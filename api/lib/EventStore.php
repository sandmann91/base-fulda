<?php
declare(strict_types=1);

require_once __DIR__ . '/Config.php';

final class EventStore
{
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    private const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

    public static function readAll(): array
    {
        $file = Config::eventsFile();
        if (!is_file($file)) {
            return [];
        }
        $fp = fopen($file, 'r');
        flock($fp, LOCK_SH);
        $contents = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        return $contents ? (json_decode($contents, true) ?: []) : [];
    }

    public static function findBySlug(string $slug): ?array
    {
        foreach (self::readAll() as $event) {
            if ($event['slug'] === $slug) {
                return $event;
            }
        }
        return null;
    }

    /**
     * Führt $mutator($events) unter einem exklusiven Lock aus und schreibt das
     * Ergebnis atomar zurück. $mutator gibt [neueEventsListe, rueckgabewert] zurück.
     */
    public static function withLock(callable $mutator): mixed
    {
        self::ensureDataDir();
        $lockFp = fopen(Config::lockFile(), 'c');
        flock($lockFp, LOCK_EX);

        try {
            $events = self::readAllUnlocked();
            [$events, $result] = $mutator($events);
            self::writeAll($events);
            return $result;
        } finally {
            flock($lockFp, LOCK_UN);
            fclose($lockFp);
        }
    }

    private static function readAllUnlocked(): array
    {
        $file = Config::eventsFile();
        if (!is_file($file)) {
            return [];
        }
        $contents = file_get_contents($file);
        return $contents ? (json_decode($contents, true) ?: []) : [];
    }

    private static function writeAll(array $events): void
    {
        self::ensureDataDir();
        $file = Config::eventsFile();
        $tmp = $file . '.tmp.' . bin2hex(random_bytes(4));
        $json = json_encode(
            array_values($events),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
        );
        if ($json === false) {
            throw new RuntimeException('events_encode_failed: ' . json_last_error_msg());
        }
        file_put_contents($tmp, $json);
        rename($tmp, $file);
    }

    private static function ensureDataDir(): void
    {
        if (!is_dir(Config::dataDir())) {
            mkdir(Config::dataDir(), 0775, true);
        }
    }

    public static function slugify(string $title): string
    {
        $map = ['ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss'];
        $slug = strtr(mb_strtolower(trim($title)), $map);
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        return trim((string) $slug, '-') ?: 'event';
    }

    public static function uniqueSlug(array $events, string $baseSlug, ?string $excludeId = null): string
    {
        $slug = $baseSlug;
        $suffix = 2;
        while (array_filter($events, fn ($e) => $e['slug'] === $slug && $e['id'] !== $excludeId)) {
            $slug = $baseSlug . '-' . $suffix;
            $suffix++;
        }
        return $slug;
    }

    public static function saveUpload(array $file): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('upload_failed');
        }
        if ($file['size'] > self::MAX_UPLOAD_BYTES) {
            throw new InvalidArgumentException('image_too_large');
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw new InvalidArgumentException('invalid_image_type');
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!in_array($mime, self::ALLOWED_MIME_TYPES, true)) {
            throw new InvalidArgumentException('invalid_image_type');
        }

        self::ensureUploadsDir();
        $filename = bin2hex(random_bytes(8)) . '.' . $extension;
        $destination = Config::uploadsDir() . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new RuntimeException('upload_move_failed');
        }

        return $filename;
    }

    public static function deleteUpload(string $filename): void
    {
        $path = Config::uploadsDir() . '/' . basename($filename);
        if (is_file($path)) {
            unlink($path);
        }
    }

    private static function ensureUploadsDir(): void
    {
        if (!is_dir(Config::uploadsDir())) {
            mkdir(Config::uploadsDir(), 0775, true);
        }
    }
}
