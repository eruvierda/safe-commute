<?php
declare(strict_types=1);

namespace SafeCommute;

class VoteService
{
    /**
     * Handles voting logic in an ACID transaction:
     * - Repeat vote of same type: toggles off (removes vote)
     * - Different vote type: changes vote (updates row)
     * - Upvote refreshes last_confirmed_at to extend TTL
     * - Automatically recalculates and updates reports.trust_score
     */
    public static function castVote(string $reportId, string $userId, string $voteType): array
    {
        if (!in_array($voteType, ['up', 'down'], true)) {
            throw new \InvalidArgumentException('Tipe vote harus "up" atau "down".');
        }

        $pdo = Db::getConnection();
        $pdo->beginTransaction();

        try {
            // Check report exists and lock row
            $stmt = $pdo->prepare('SELECT id, trust_score FROM reports WHERE id = ? AND deleted_at IS NULL FOR UPDATE');
            $stmt->execute([$reportId]);
            $report = $stmt->fetch();
            if (!$report) {
                throw new \RuntimeException('Laporan tidak ditemukan.');
            }

            // Check existing vote
            $stmt = $pdo->prepare('SELECT id, vote_type FROM votes WHERE report_id = ? AND user_id = ?');
            $stmt->execute([$reportId, $userId]);
            $existing = $stmt->fetch();

            $now = Db::nowUtc();
            $myCurrentVote = null;

            if ($existing) {
                if ($existing['vote_type'] === $voteType) {
                    // Toggle off: remove vote
                    $del = $pdo->prepare('DELETE FROM votes WHERE id = ?');
                    $del->execute([$existing['id']]);
                    $myCurrentVote = null;
                } else {
                    // Change vote
                    $upd = $pdo->prepare('UPDATE votes SET vote_type = ?, created_at = ? WHERE id = ?');
                    $upd->execute([$voteType, $now, $existing['id']]);
                    $myCurrentVote = $voteType;

                    if ($voteType === 'up') {
                        $updRep = $pdo->prepare('UPDATE reports SET last_confirmed_at = ? WHERE id = ?');
                        $updRep->execute([$now, $reportId]);
                    }
                }
            } else {
                // New vote
                $newVoteId = Db::uuid();
                $ins = $pdo->prepare('INSERT INTO votes (id, report_id, user_id, vote_type, created_at) VALUES (?, ?, ?, ?, ?)');
                $ins->execute([$newVoteId, $reportId, $userId, $voteType, $now]);
                $myCurrentVote = $voteType;

                if ($voteType === 'up') {
                    $updRep = $pdo->prepare('UPDATE reports SET last_confirmed_at = ? WHERE id = ?');
                    $updRep->execute([$now, $reportId]);
                }
            }

            // Recalculate trust_score directly from votes table
            $countStmt = $pdo->prepare('
                SELECT 
                    SUM(CASE WHEN vote_type = "up" THEN 1 ELSE 0 END) as up_count,
                    SUM(CASE WHEN vote_type = "down" THEN 1 ELSE 0 END) as down_count
                FROM votes WHERE report_id = ?
            ');
            $countStmt->execute([$reportId]);
            $counts = $countStmt->fetch();

            $up = (int)($counts['up_count'] ?? 0);
            $down = (int)($counts['down_count'] ?? 0);
            $newScore = $up - $down;

            $updScore = $pdo->prepare('UPDATE reports SET trust_score = ? WHERE id = ?');
            $updScore->execute([$newScore, $reportId]);

            $pdo->commit();

            return [
                'success' => true,
                'trust_score' => $newScore,
                'my_vote' => $myCurrentVote,
                'up_count' => $up,
                'down_count' => $down,
            ];
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    public static function getUserVotingHistory(string $userId): array
    {
        $pdo = Db::getConnection();
        $stmt = $pdo->prepare('
            SELECT 
                v.vote_type,
                v.created_at AS voted_at,
                r.id AS report_id,
                r.type AS report_type,
                r.description AS report_description,
                CAST(r.latitude AS DOUBLE) AS report_latitude,
                CAST(r.longitude AS DOUBLE) AS report_longitude,
                r.created_at AS report_created_at,
                r.trust_score AS current_trust_score,
                (r.deleted_at IS NOT NULL) AS is_deleted,
                t.label AS report_type_label,
                t.color AS report_type_color
            FROM votes v
            JOIN reports r ON v.report_id = r.id
            JOIN report_type_ttl t ON r.type = t.type
            WHERE v.user_id = ?
            ORDER BY v.created_at DESC
        ');
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        return array_map(function ($row) {
            return [
                'vote_type' => $row['vote_type'],
                'voted_at' => $row['voted_at'],
                'report_id' => $row['report_id'],
                'report_type' => $row['report_type'],
                'report_type_label' => $row['report_type_label'],
                'report_type_color' => $row['report_type_color'],
                'report_description' => $row['report_description'],
                'report_latitude' => (float)$row['report_latitude'],
                'report_longitude' => (float)$row['report_longitude'],
                'report_created_at' => $row['report_created_at'],
                'current_trust_score' => (int)$row['current_trust_score'],
                'is_deleted' => (bool)$row['is_deleted'],
            ];
        }, $rows);
    }

    public static function getUserStats(string $userId): array
    {
        $pdo = Db::getConnection();

        // 1. Total reports submitted & average trust score over user's entire history
        $stmt = $pdo->prepare('
            SELECT 
                COUNT(*) as total_reports,
                COALESCE(AVG(trust_score), 0) as avg_trust_score,
                MIN(created_at) as first_report_at
            FROM reports
            WHERE user_id = ? AND deleted_at IS NULL
        ');
        $stmt->execute([$userId]);
        $repStats = $stmt->fetch();

        // 2. Most reported hazard type
        $stmt = $pdo->prepare('
            SELECT type, COUNT(*) as cnt 
            FROM reports 
            WHERE user_id = ? AND deleted_at IS NULL
            GROUP BY type 
            ORDER BY cnt DESC 
            LIMIT 1
        ');
        $stmt->execute([$userId]);
        $topType = $stmt->fetch();

        // 3. Total votes cast
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM votes WHERE user_id = ?');
        $stmt->execute([$userId]);
        $totalVotes = (int)$stmt->fetchColumn();

        $accountAgeDays = 0;
        if (!empty($repStats['first_report_at'])) {
            $first = new \DateTimeImmutable($repStats['first_report_at'], new \DateTimeZone('UTC'));
            $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
            $accountAgeDays = $now->diff($first)->days;
        }

        return [
            'totalReports' => (int)$repStats['total_reports'],
            'totalVotes' => $totalVotes,
            'averageTrustScore' => round((float)$repStats['avg_trust_score'], 1),
            'mostReportedType' => $topType ? $topType['type'] : 'none',
            'accountAgeDays' => $accountAgeDays,
        ];
    }
}
