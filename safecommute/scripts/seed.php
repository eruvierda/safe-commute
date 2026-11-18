<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

use SafeCommute\Db;

$pdo = Db::getConnection();

echo "Seeding SafeCommute demo data on MariaDB...\n";

// 1. Create a demo user
$demoUserId = Db::uuid();
$now = Db::nowUtc();

$stmt = $pdo->prepare('INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at) 
                       VALUES (?, ?, ?, ?, ?, ?) 
                       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name)');
$stmt->execute([
    $demoUserId,
    'demo@safecommute.id',
    password_hash('password123', PASSWORD_BCRYPT),
    'Komuter Jakarta-Bogor',
    $now,
    $now
]);

echo "Created demo user: demo@safecommute.id / password123\n";

// 2. Demo reports around Jakarta & Bogor
$sampleReports = [
    [
        'type' => 'banjir',
        'desc' => 'Genangan air setinggi 30cm di depan stasiun, roda dua harap berhati-hati.',
        'lat' => -6.5976,
        'lng' => 106.7995,
        'trust' => 6,
    ],
    [
        'type' => 'macet',
        'desc' => 'Kepadatan arus dari arah Ciawi menuju Baranangsiang tersendat.',
        'lat' => -6.6030,
        'lng' => 106.8100,
        'trust' => 2,
    ],
    [
        'type' => 'jalan_rusak',
        'desc' => 'Lubang cukup dalam di lajur kiri dekat lampu merah.',
        'lat' => -6.5890,
        'lng' => 106.7850,
        'trust' => 8,
    ],
    [
        'type' => 'lampu_mati',
        'desc' => 'Penerangan jalan padam sepanjang 200 meter.',
        'lat' => -6.5750,
        'lng' => 106.8050,
        'trust' => 3,
    ],
    [
        'type' => 'banjir_rob',
        'desc' => 'Air laut pasang menggenangi ruas pelabuhan Muara Baru.',
        'lat' => -6.1150,
        'lng' => 106.8020,
        'trust' => 7,
    ],
];

$ins = $pdo->prepare('INSERT INTO reports (id, user_id, type, description, latitude, longitude, trust_score, is_resolved, last_confirmed_at, created_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)');

foreach ($sampleReports as $r) {
    $ins->execute([
        Db::uuid(),
        $demoUserId,
        $r['type'],
        $r['desc'],
        $r['lat'],
        $r['lng'],
        $r['trust'],
        $now,
        $now
    ]);
}

echo "Successfully seeded " . count($sampleReports) . " reports.\n";
