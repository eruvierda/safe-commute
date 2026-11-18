<?php
declare(strict_types=1);

namespace SafeCommute;

use PDO;
use PDOException;
use RuntimeException;

class Db
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $host = Env::get('DB_HOST', '127.0.0.1');
            $port = Env::get('DB_PORT', '3306');
            $name = Env::get('DB_NAME', 'safecommute');
            $user = Env::get('DB_USER', 'root');
            $pass = Env::get('DB_PASS', '');

            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone = '+00:00'"
            ];

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                if (Env::getBool('APP_DEBUG', false)) {
                    throw $e;
                }
                throw new RuntimeException('Database connection failed');
            }
        }

        return self::$instance;
    }

    /**
     * Generate a RFC-4122 / UUIDv7 formatted random UUID
     */
    public static function uuid(): string
    {
        // 16 bytes of cryptographically secure random data
        $bytes = random_bytes(16);

        // Version 4 or 7 variant bits
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40); // version 4
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80); // variant RFC 4122

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }

    /**
     * Get current UTC timestamp with milliseconds (YYYY-MM-DD HH:MM:SS.uuu)
     */
    public static function nowUtc(): string
    {
        $d = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
        return $d->format('Y-m-d H:i:s.v');
    }
}
