<?php
declare(strict_types=1);

require_once __DIR__ . '/../../safecommute/bootstrap.php';

use SafeCommute\Request;
use SafeCommute\Response;
use SafeCommute\Router;
use SafeCommute\Auth;
use SafeCommute\Db;
use SafeCommute\RateLimiter;
use SafeCommute\ReportService;
use SafeCommute\VoteService;
use SafeCommute\UploadService;
use SafeCommute\GeoService;

$req = new Request();
$router = new Router();

// ==========================================
// 1. SYSTEM & CSRF TOKEN
// ==========================================
$router->get('/csrf', function (Request $req) {
    Response::success([
        'csrf_token' => Auth::getCsrfToken(),
    ]);
});

// ==========================================
// 2. AUTHENTICATION
// ==========================================
$router->get('/auth/me', function (Request $req) {
    $user = Auth::user();
    Response::success([
        'user' => $user,
        'is_logged_in' => ($user !== null),
    ]);
});

$router->post('/auth/register', function (Request $req) {
    if (!Auth::verifyCsrf($req)) {
        Response::error('Invalid CSRF token', 403);
    }

    $ip = $req->getIp();
    if (!RateLimiter::check('ip:' . $ip, 'auth_register', 10, 3600)) {
        Response::error('Terlalu banyak percobaan registrasi. Silakan coba lagi nanti.', 429);
    }

    $body = $req->getBody();
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');
    $name = trim((string)($body['display_name'] ?? ''));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        Response::error('Format email tidak valid.');
    }

    if (strlen($password) < 6) {
        Response::error('Password minimal 6 karakter.');
    }

    if ($name === '') {
        $parts = explode('@', $email);
        $name = $parts[0] ?: 'User';
    }

    $pdo = Db::getConnection();
    $check = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $check->execute([$email]);
    if ($check->fetch()) {
        Response::error('Email sudah terdaftar. Silakan login.');
    }

    $userId = Db::uuid();
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $now = Db::nowUtc();

    $stmt = $pdo->prepare('INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$userId, $email, $hash, $name, $now, $now]);

    Auth::login($userId);

    Response::success([
        'user' => [
            'id' => $userId,
            'email' => $email,
            'display_name' => $name,
        ]
    ], 'Registrasi berhasil');
});

$router->post('/auth/login', function (Request $req) {
    if (!Auth::verifyCsrf($req)) {
        Response::error('Invalid CSRF token', 403);
    }

    $ip = $req->getIp();
    if (!RateLimiter::check('ip:' . $ip, 'auth_login', 15, 900)) {
        Response::error('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.', 429);
    }

    $body = $req->getBody();
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $password = (string)($body['password'] ?? '');

    $pdo = Db::getConnection();
    $stmt = $pdo->prepare('SELECT id, password_hash, display_name, avatar_url FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        Response::error('Email atau password salah.', 401);
    }

    // Rehash if needed
    if (password_needs_rehash($user['password_hash'], PASSWORD_BCRYPT)) {
        $newHash = password_hash($password, PASSWORD_BCRYPT);
        $upd = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $upd->execute([$newHash, $user['id']]);
    }

    Auth::login($user['id']);

    Response::success([
        'user' => [
            'id' => $user['id'],
            'email' => $email,
            'display_name' => $user['display_name'],
            'avatar_url' => $user['avatar_url'],
        ]
    ], 'Login berhasil');
});

$router->post('/auth/logout', function (Request $req) {
    Auth::logout();
    Response::success(null, 'Logout berhasil');
});

$router->patch('/me', function (Request $req) {
    if (!Auth::verifyCsrf($req)) {
        Response::error('Invalid CSRF token', 403);
    }

    $user = Auth::requireUser();
    $body = $req->getBody();
    $displayName = trim((string)($body['display_name'] ?? ''));

    if ($displayName === '') {
        Response::error('Nama tidak boleh kosong.');
    }

    $pdo = Db::getConnection();
    $now = Db::nowUtc();
    $stmt = $pdo->prepare('UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?');
    $stmt->execute([$displayName, $now, $user['id']]);

    Response::success(['display_name' => $displayName], 'Profil diperbarui');
});

// ==========================================
// 3. REPORTS
// ==========================================
$router->get('/reports', function (Request $req) {
    $since = $req->getQuery('since');
    $reports = ReportService::getActiveReports($since ? (string)$since : null);

    // Support ETag caching
    $etag = '"' . md5(json_encode($reports)) . '"';
    if ($req->getHeader('If-None-Match') === $etag) {
        http_response_code(304);
        exit;
    }

    header('ETag: ' . $etag);
    Response::success($reports);
});

$router->post('/reports', function (Request $req) {
    if (!Auth::verifyCsrf($req)) {
        Response::error('Invalid CSRF token', 403);
    }

    $user = Auth::requireUser();

    // Rate limit: max 10 reports per hour per user
    if (!RateLimiter::check('user:' . $user['id'], 'create_report', 10, 3600)) {
        Response::error('Batas laporan tercapai (maks 10 per jam).', 429);
    }

    $body = $req->getBody();
    $type = (string)($body['type'] ?? '');
    $lat = filter_var($body['latitude'] ?? null, FILTER_VALIDATE_FLOAT);
    $lng = filter_var($body['longitude'] ?? null, FILTER_VALIDATE_FLOAT);
    $desc = isset($body['description']) ? trim((string)$body['description']) : null;

    if ($lat === false || $lng === false) {
        Response::error('Koordinat lokasi tidak valid.');
    }

    $imagePath = null;
    if (!empty($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        try {
            $imagePath = UploadService::processImage($_FILES['image']);
        } catch (\Throwable $e) {
            Response::error('Upload foto gagal: ' . $e->getMessage());
        }
    }

    try {
        $report = ReportService::createReport($user['id'], $type, (float)$lat, (float)$lng, $desc, $imagePath);
        Response::success($report, 'Laporan berhasil dibuat', 201);
    } catch (\Throwable $e) {
        Response::error($e->getMessage());
    }
});

$router->patch('/reports/{id}', function (Request $req, array $params) {
    if (!Auth::verifyCsrf($req)) {
        Response::error('Invalid CSRF token', 403);
    }

    $user = Auth::requireUser();
    $reportId = $params['id'];
    $body = $req->getBody();

    $type = (string)($body['type'] ?? '');
    $desc = isset($body['description']) ? trim((string)$body['description']) : null;

    try {
        ReportService::updateReport($reportId, $user['id'], $type, $desc);
        Response::success(null, 'Laporan berhasil diperbarui');
    } catch (\Throwable $e) {
        Response::error($e->getMessage());
    }
});

$router->delete('/reports/{id}', function (Request $req, array $params) {
    if (!Auth::verifyCsrf($req)) {
        Response::error('Invalid CSRF token', 403);
    }

    $user = Auth::requireUser();
    $reportId = $params['id'];

    try {
        ReportService::deleteReport($reportId, $user['id']);
        Response::success(null, 'Laporan berhasil dihapus');
    } catch (\Throwable $e) {
        Response::error($e->getMessage());
    }
});

// ==========================================
// 4. VOTING
// ==========================================
$router->post('/reports/{id}/vote', function (Request $req, array $params) {
    if (!Auth::verifyCsrf($req)) {
        Response::error('Invalid CSRF token', 403);
    }

    $user = Auth::requireUser();
    $reportId = $params['id'];

    // Rate limit: 60 votes per hour per user
    if (!RateLimiter::check('user:' . $user['id'], 'vote', 60, 3600)) {
        Response::error('Terlalu banyak vote. Tunggu sejenak.', 429);
    }

    $body = $req->getBody();
    $voteType = (string)($body['vote_type'] ?? '');

    try {
        $res = VoteService::castVote($reportId, $user['id'], $voteType);
        Response::success($res, 'Vote tersimpan');
    } catch (\Throwable $e) {
        Response::error($e->getMessage());
    }
});

// ==========================================
// 5. USER PROFILE, REPORTS & HISTORY
// ==========================================
$router->get('/me/reports', function (Request $req) {
    $user = Auth::requireUser();
    $reports = ReportService::getUserReports($user['id']);
    Response::success($reports);
});

$router->get('/me/votes', function (Request $req) {
    $user = Auth::requireUser();
    $history = VoteService::getUserVotingHistory($user['id']);
    Response::success($history);
});

$router->get('/me/stats', function (Request $req) {
    $user = Auth::requireUser();
    $stats = VoteService::getUserStats($user['id']);
    Response::success($stats);
});

// ==========================================
// 6. GEOCODING & ROUTING CACHED PROXY
// ==========================================
$router->get('/geocode', function (Request $req) {
    $q = trim((string)$req->getQuery('q', ''));
    if (mb_strlen($q) < 3) {
        Response::success([]);
    }

    $results = GeoService::geocode($q);
    Response::success($results);
});

$router->get('/route', function (Request $req) {
    $startLat = filter_var($req->getQuery('start_lat'), FILTER_VALIDATE_FLOAT);
    $startLng = filter_var($req->getQuery('start_lng'), FILTER_VALIDATE_FLOAT);
    $endLat = filter_var($req->getQuery('end_lat'), FILTER_VALIDATE_FLOAT);
    $endLng = filter_var($req->getQuery('end_lng'), FILTER_VALIDATE_FLOAT);

    if ($startLat === false || $startLng === false || $endLat === false || $endLng === false) {
        Response::error('Koordinat rute tidak valid.');
    }

    $route = GeoService::route((float)$startLat, (float)$startLng, (float)$endLat, (float)$endLng);
    if (!$route) {
        Response::error('Gagal menghitung rute navigasi.', 502);
    }

    Response::success($route);
});

// Dispatch the request
$router->dispatch($req);
