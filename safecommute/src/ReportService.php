<?php
declare(strict_types=1);

namespace SafeCommute;

class ReportService
{
    /**
     * Fetch all active reports based on TTL rules and trust score > -3
     * Does NOT expose user_id to public. Returns is_mine boolean based on current session.
     */
    public static function getActiveReports(?string $since = null): array
    {
        $pdo = Db::getConnection();
        $currentUserId = Auth::userId();

        // Join with report_type_ttl to compute dynamic expiry based on last_confirmed_at + ttl_minutes
        // MariaDB: DATE_ADD(r.last_confirmed_at, INTERVAL t.ttl_minutes MINUTE) > UTC_TIMESTAMP(3)
        $sql = "
            SELECT 
                r.id,
                r.type,
                r.description,
                CAST(r.latitude AS DOUBLE) AS latitude,
                CAST(r.longitude AS DOUBLE) AS longitude,
                r.image_path,
                r.trust_score,
                r.is_resolved,
                r.created_at,
                r.last_confirmed_at,
                r.user_id,
                t.label AS type_label,
                t.color AS type_color
            FROM reports r
            INNER JOIN report_type_ttl t ON r.type = t.type
            WHERE r.deleted_at IS NULL
              AND r.trust_score > -3
              AND DATE_ADD(r.last_confirmed_at, INTERVAL t.ttl_minutes MINUTE) > UTC_TIMESTAMP(3)
        ";

        $params = [];
        if ($since !== null && $since !== '') {
            $sql .= " AND r.last_confirmed_at > ?";
            $params[] = $since;
        }

        $sql .= " ORDER BY r.created_at DESC LIMIT 500";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Map rows: compute is_mine, full image URL, and hide raw user_id
        return array_map(function ($row) use ($currentUserId) {
            $isMine = ($currentUserId !== null && $row['user_id'] === $currentUserId);
            $imageUrl = null;
            if (!empty($row['image_path'])) {
                $imageUrl = '/' . ltrim($row['image_path'], '/');
            }

            return [
                'id' => $row['id'],
                'type' => $row['type'],
                'label' => $row['type_label'],
                'color' => $row['type_color'],
                'description' => $row['description'],
                'latitude' => (float)$row['latitude'],
                'longitude' => (float)$row['longitude'],
                'image_url' => $imageUrl,
                'trust_score' => (int)$row['trust_score'],
                'is_resolved' => (bool)$row['is_resolved'],
                'created_at' => $row['created_at'],
                'last_confirmed_at' => $row['last_confirmed_at'],
                'is_mine' => $isMine,
            ];
        }, $rows);
    }

    public static function createReport(
        string $userId,
        string $type,
        float $lat,
        float $lng,
        ?string $description,
        ?string $imagePath
    ): array {
        $pdo = Db::getConnection();

        // Validate type exists
        $check = $pdo->prepare('SELECT type FROM report_type_ttl WHERE type = ?');
        $check->execute([$type]);
        if (!$check->fetch()) {
            throw new \InvalidArgumentException('Tipe bahaya tidak valid.');
        }

        // Validate coordinates
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            throw new \InvalidArgumentException('Koordinat di luar jangkauan valid.');
        }

        // Description max 500 chars
        if ($description !== null && mb_strlen($description) > 500) {
            throw new \InvalidArgumentException('Deskripsi maksimal 500 karakter.');
        }

        $id = Db::uuid();
        $now = Db::nowUtc();

        $stmt = $pdo->prepare('
            INSERT INTO reports (id, user_id, type, description, latitude, longitude, image_path, trust_score, is_resolved, last_confirmed_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        ');
        $stmt->execute([
            $id,
            $userId,
            $type,
            $description,
            $lat,
            $lng,
            $imagePath,
            $now,
            $now
        ]);

        return [
            'id' => $id,
            'type' => $type,
            'description' => $description,
            'latitude' => $lat,
            'longitude' => $lng,
            'image_url' => $imagePath ? '/' . ltrim($imagePath, '/') : null,
            'trust_score' => 0,
            'is_resolved' => false,
            'created_at' => $now,
            'last_confirmed_at' => $now,
            'is_mine' => true,
        ];
    }

    public static function updateReport(
        string $reportId,
        string $userId,
        string $type,
        ?string $description
    ): void {
        $pdo = Db::getConnection();

        // Check report ownership and 15 min rule
        $stmt = $pdo->prepare('SELECT user_id, created_at FROM reports WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$reportId]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new \RuntimeException('Laporan tidak ditemukan.');
        }

        if ($row['user_id'] !== $userId) {
            throw new \RuntimeException('Anda tidak berhak mengedit laporan ini.');
        }

        $created = new \DateTimeImmutable($row['created_at'], new \DateTimeZone('UTC'));
        $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        if (($now->getTimestamp() - $created->getTimestamp()) > 900) {
            throw new \RuntimeException('Batas waktu edit (15 menit) telah lewat.');
        }

        $stmt = $pdo->prepare('UPDATE reports SET type = ?, description = ? WHERE id = ?');
        $stmt->execute([$type, $description, $reportId]);
    }

    public static function deleteReport(string $reportId, string $userId): void
    {
        $pdo = Db::getConnection();

        $stmt = $pdo->prepare('SELECT user_id FROM reports WHERE id = ? AND deleted_at IS NULL');
        $stmt->execute([$reportId]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new \RuntimeException('Laporan tidak ditemukan.');
        }

        if ($row['user_id'] !== $userId) {
            throw new \RuntimeException('Anda tidak berhak menghapus laporan ini.');
        }

        $now = Db::nowUtc();
        $stmt = $pdo->prepare('UPDATE reports SET deleted_at = ? WHERE id = ?');
        $stmt->execute([$now, $reportId]);
    }

    public static function getUserReports(string $userId): array
    {
        $pdo = Db::getConnection();
        $stmt = $pdo->prepare('
            SELECT 
                r.id, r.type, r.description, CAST(r.latitude AS DOUBLE) as latitude, CAST(r.longitude AS DOUBLE) as longitude,
                r.image_path, r.trust_score, r.is_resolved, r.created_at, r.last_confirmed_at, r.deleted_at,
                t.label as type_label, t.color as type_color
            FROM reports r
            JOIN report_type_ttl t ON r.type = t.type
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
        ');
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        return array_map(function ($row) {
            return [
                'id' => $row['id'],
                'type' => $row['type'],
                'label' => $row['type_label'],
                'color' => $row['type_color'],
                'description' => $row['description'],
                'latitude' => (float)$row['latitude'],
                'longitude' => (float)$row['longitude'],
                'image_url' => $row['image_path'] ? '/' . ltrim($row['image_path'], '/') : null,
                'trust_score' => (int)$row['trust_score'],
                'is_resolved' => (bool)$row['is_resolved'],
                'created_at' => $row['created_at'],
                'last_confirmed_at' => $row['last_confirmed_at'],
                'deleted_at' => $row['deleted_at'],
                'is_mine' => true,
            ];
        }, $rows);
    }
}
