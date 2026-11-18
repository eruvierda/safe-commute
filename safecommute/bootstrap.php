<?php
declare(strict_types=1);

// Set strict error handling
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Force default timezone to UTC
date_default_timezone_set('UTC');

// Autoloader for SafeCommute classes
spl_autoload_register(function ($class) {
    $prefix = 'SafeCommute\\';
    $baseDir = __DIR__ . '/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

// Load .env configuration
\SafeCommute\Env::load(__DIR__ . '/.env');

// Configure upload directory
\SafeCommute\UploadService::setUploadDir(dirname(__DIR__) . '/public_html');

// Exception handler for clean JSON responses
set_exception_handler(function (\Throwable $e) {
    $debug = \SafeCommute\Env::getBool('APP_DEBUG', false);
    $status = 500;
    if ($e instanceof \InvalidArgumentException) {
        $status = 400;
    }

    $msg = $debug ? $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() : 'Internal Server Error';
    \SafeCommute\Response::error($msg, $status);
});
