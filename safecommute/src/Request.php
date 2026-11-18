<?php
declare(strict_types=1);

namespace SafeCommute;

class Request
{
    private string $method;
    private string $path;
    private array $query;
    private array $headers;
    private ?array $jsonBody = null;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';
        $this->path = rtrim($path, '/') ?: '/';
        
        $this->query = $_GET;
        $this->headers = getallheaders() ?: [];
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function getQuery(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function getHeader(string $name, ?string $default = null): ?string
    {
        $nameLower = strtolower($name);
        foreach ($this->headers as $k => $v) {
            if (strtolower($k) === $nameLower) {
                return (string)$v;
            }
        }
        return $default;
    }

    public function getJson(): array
    {
        if ($this->jsonBody === null) {
            $input = file_get_contents('php://input');
            if ($input) {
                $decoded = json_decode($input, true);
                $this->jsonBody = is_array($decoded) ? $decoded : [];
            } else {
                $this->jsonBody = [];
            }
        }
        return $this->jsonBody;
    }

    public function getBody(): array
    {
        if ($this->method === 'POST' && !empty($_POST)) {
            return $_POST;
        }
        return $this->getJson();
    }

    public function getIp(): string
    {
        return $_SERVER['HTTP_CF_CONNECTING_IP'] 
            ?? $_SERVER['HTTP_X_FORWARDED_FOR'] 
            ?? $_SERVER['REMOTE_ADDR'] 
            ?? '127.0.0.1';
    }
}
