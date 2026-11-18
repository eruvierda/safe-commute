<?php
declare(strict_types=1);

namespace SafeCommute;

class UploadService
{
    private static string $uploadDir = '';

    public static function setUploadDir(string $dir): void
    {
        self::$uploadDir = $dir;
    }

    /**
     * Process an uploaded file: validate MIME, size, re-encode via GD to strip EXIF and save as WebP/JPEG.
     * Returns the relative path for database storage (e.g. "uploads/hazard-photos/2026/11/abc.webp")
     */
    public static function processImage(array $file): string
    {
        if (!isset($file['error']) || is_array($file['error'])) {
            throw new \RuntimeException('Invalid file upload parameters');
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \RuntimeException('File upload failed with error code ' . $file['error']);
        }

        // Limit raw size to 10MB before processing
        if ($file['size'] > 10 * 1024 * 1024) {
            throw new \RuntimeException('File size exceeds 10MB limit');
        }

        // Validate MIME type with finfo
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        $allowed = ['image/jpeg', 'image/png', 'image/webp'];

        if (!in_array($mime, $allowed, true)) {
            throw new \RuntimeException('Only JPEG, PNG, and WebP images are allowed');
        }

        // Load image using GD
        $img = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($file['tmp_name']),
            'image/png'  => @imagecreatefrompng($file['tmp_name']),
            'image/webp' => @imagecreatefromwebp($file['tmp_name']),
            default      => false,
        };

        if (!$img) {
            throw new \RuntimeException('Failed to process image content');
        }

        // Auto-orient using EXIF if JPEG
        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            $exif = @exif_read_data($file['tmp_name']);
            if (!empty($exif['Orientation'])) {
                $img = match ($exif['Orientation']) {
                    3 => imagerotate($img, 180, 0),
                    6 => imagerotate($img, -90, 0),
                    8 => imagerotate($img, 90, 0),
                    default => $img,
                };
            }
        }

        // Downscale if width/height > 1280px to save storage & bandwidth
        $width = imagesx($img);
        $height = imagesy($img);
        $maxDim = 1280;

        if ($width > $maxDim || $height > $maxDim) {
            $ratio = min($maxDim / $width, $maxDim / $height);
            $newWidth = (int)round($width * $ratio);
            $newHeight = (int)round($height * $ratio);

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled($resized, $img, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($img);
            $img = $resized;
        }

        // Subdirectory by year/month
        $relSubdir = 'uploads/hazard-photos/' . date('Y/m');
        $targetDir = self::$uploadDir . '/' . $relSubdir;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        $filename = bin2hex(random_bytes(16));
        
        // Prefer WebP if supported by GD, otherwise JPEG
        if (function_exists('imagewebp')) {
            $filename .= '.webp';
            $fullPath = $targetDir . '/' . $filename;
            imagewebp($img, $fullPath, 80);
        } else {
            $filename .= '.jpg';
            $fullPath = $targetDir . '/' . $filename;
            imagejpeg($img, $fullPath, 82);
        }

        imagedestroy($img);

        return $relSubdir . '/' . $filename;
    }
}
