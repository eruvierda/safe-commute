<?php
declare(strict_types=1);

namespace SafeCommute;

class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function patch(string $path, callable $handler): void
    {
        $this->add('PATCH', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    private function add(string $method, string $path, callable $handler): void
    {
        // Normalize path
        $path = rtrim($path, '/') ?: '/';
        // Convert :param or {param} into regex capture group
        $pattern = preg_replace('#\{([a-zA-Z0-9_]+)\}#', '(?P<$1>[^/]+)', $path);
        $pattern = "#^{$pattern}$#";

        $this->routes[] = [
            'method' => $method,
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $req): void
    {
        $method = $req->getMethod();
        $path = $req->getPath();

        // Handle path prefixes if hosted in subfolder
        // Strip /api prefix if matched
        if (str_starts_with($path, '/api')) {
            $path = substr($path, 4) ?: '/';
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (preg_match($route['pattern'], $path, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                call_user_func($route['handler'], $req, $params);
                return;
            }
        }

        Response::error('Endpoint not found', 404);
    }
}
