<?php
declare(strict_types=1);

namespace SafeCommute;

class Auth
{
    private const SESSION_USER_ID = 'safecommute_user_id';
    private const SESSION_CSRF = 'safecommute_csrf_token';

    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            $lifetime = (int)Env::get('SESSION_LIFETIME', 2592000);
            
            // Modern, secure session cookie parameters for shared hosting
            $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') 
                    || ($_SERVER['SERVER_PORT'] ?? 80) == 443;

            session_set_cookie_params([
                'lifetime' => $lifetime,
                'path' => '/',
                'domain' => '',
                'secure' => $isHttps,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            
            session_start();
        }
    }

    public static function getCsrfToken(): string
    {
        self::startSession();
        if (empty($_SESSION[self::SESSION_CSRF])) {
            $_SESSION[self::SESSION_CSRF] = bin2hex(random_bytes(32));
        }
        return $_SESSION[self::SESSION_CSRF];
    }

    public static function verifyCsrf(Request $req): bool
    {
        self::startSession();
        $token = $req->getHeader('X-CSRF-Token') ?? $req->getBody()['csrf_token'] ?? null;
        if (!$token || empty($_SESSION[self::SESSION_CSRF])) {
            return false;
        }
        return hash_equals($_SESSION[self::SESSION_CSRF], (string)$token);
    }

    public static function login(string $userId): void
    {
        self::startSession();
        session_regenerate_id(true);
        $_SESSION[self::SESSION_USER_ID] = $userId;
    }

    public static function logout(): void
    {
        self::startSession();
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
    }

    public static function userId(): ?string
    {
        self::startSession();
        return $_SESSION[self::SESSION_USER_ID] ?? null;
    }

    public static function user(): ?array
    {
        $id = self::userId();
        if (!$id) {
            return null;
        }

        $pdo = Db::getConnection();
        $stmt = $pdo->prepare('SELECT id, email, display_name, avatar_url, created_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function requireUser(): array
    {
        $u = self::user();
        if (!$u) {
            Response::error('Unauthorized. Please log in.', 401);
        }
        return $u;
    }
}
