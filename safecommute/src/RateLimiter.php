<?php
declare(strict_types=1);

namespace SafeCommute;

class RateLimiter
{
    public static function check(string $key, string $action, int $maxHits, int $windowSeconds = 3600): bool
    {
        $pdo = Db::getConnection();
        $now = time();

        // 1. Delete expired windows
        $stmt = $pdo->prepare('DELETE FROM rate_limits WHERE window_expires_at < ?');
        $stmt->execute([$now]);

        // 2. Fetch or insert
        $stmt = $pdo->prepare('SELECT hits, window_expires_at FROM rate_limits WHERE key_name = ? AND action = ?');
        $stmt->execute([$key, $action]);
        $row = $stmt->fetch();

        if ($row) {
            if ($row['hits'] >= $maxHits) {
                return false; // Limit exceeded
            }
            $update = $pdo->prepare('UPDATE rate_limits SET hits = hits + 1 WHERE key_name = ? AND action = ?');
            $update->execute([$key, $action]);
            return true;
        }

        // Create new window
        $insert = $pdo->prepare('INSERT INTO rate_limits (key_name, action, hits, window_expires_at) VALUES (?, ?, 1, ?)');
        $insert->execute([$key, $action, $now + $windowSeconds]);
        return true;
    }
}
