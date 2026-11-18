<?php
declare(strict_types=1);

namespace SafeCommute;

class GeoService
{
    private static function getCached(string $key): ?array
    {
        $pdo = Db::getConnection();
        $stmt = $pdo->prepare('SELECT data FROM geo_cache WHERE cache_key = ? AND expires_at > ?');
        $stmt->execute([$key, time()]);
        $row = $stmt->fetch();
        if ($row) {
            $data = json_decode($row['data'], true);
            return is_array($data) ? $data : null;
        }
        return null;
    }

    private static function setCached(string $key, array $data, int $ttlSeconds = 86400): void
    {
        $pdo = Db::getConnection();
        $stmt = $pdo->prepare('REPLACE INTO geo_cache (cache_key, data, expires_at) VALUES (?, ?, ?)');
        $stmt->execute([$key, json_encode($data), time() + $ttlSeconds]);
    }

    public static function geocode(string $query): array
    {
        $key = 'geo:' . md5(mb_strtolower(trim($query)));
        $cached = self::getCached($key);
        if ($cached !== null) {
            return $cached;
        }

        $ua = Env::get('USER_AGENT', 'SafeCommute/1.0');
        $url = 'https://nominatim.openstreetmap.org/search?format=json&q=' 
             . urlencode($query) . '&limit=5&countrycodes=id';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERAGENT      => $ua,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_HTTPHEADER     => ['Accept-Language: id,en;q=0.8'],
        ]);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code === 200 && $res) {
            $decoded = json_decode($res, true);
            if (is_array($decoded)) {
                self::setCached($key, $decoded, 86400 * 3); // 3 days cache
                return $decoded;
            }
        }

        return [];
    }

    public static function route(float $startLat, float $startLng, float $endLat, float $endLng): ?array
    {
        $key = sprintf('route:%.4f,%.4f:%.4f,%.4f', $startLng, $startLat, $endLng, $endLat);
        $cached = self::getCached($key);
        if ($cached !== null) {
            return $cached;
        }

        $url = "https://router.project-osrm.org/route/v1/driving/{$startLng},{$startLat};{$endLng},{$endLat}?overview=full&geometries=geojson";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_USERAGENT      => Env::get('USER_AGENT', 'SafeCommute/1.0'),
            CURLOPT_TIMEOUT        => 10,
        ]);

        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code === 200 && $res) {
            $decoded = json_decode($res, true);
            if (is_array($decoded) && ($decoded['code'] ?? '') === 'Ok') {
                self::setCached($key, $decoded, 86400); // 1 day cache
                return $decoded;
            }
        }

        return null;
    }
}
