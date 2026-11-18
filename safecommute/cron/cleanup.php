<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

use SafeCommute\Db;

$pdo = Db::getConnection();
$now = time();

// 1. Purge rate limit entries older than their window
$stmt = $pdo->prepare('DELETE FROM rate_limits WHERE window_expires_at < ?');
$stmt->execute([$now]);
$rateLimitsDeleted = $stmt->rowCount();

// 2. Purge expired geocoding & routing cache
$stmt = $pdo->prepare('DELETE FROM geo_cache WHERE expires_at < ?');
$stmt->execute([$now]);
$cacheDeleted = $stmt->rowCount();

echo sprintf("[%s] SafeCommute Cron: Cleaned up %d rate-limit records, %d cached geodata records.\n", 
    date('Y-m-d H:i:s'), 
    $rateLimitsDeleted, 
    $cacheDeleted
);
