<?php
declare(strict_types=1);

final class Config
{
    private static bool $localLoaded = false;

    public static function dataDir(): string
    {
        return dirname(__DIR__, 2) . '/data';
    }

    public static function eventsFile(): string
    {
        return self::dataDir() . '/events.json';
    }

    public static function lockFile(): string
    {
        return self::dataDir() . '/events.json.lock';
    }

    public static function throttleFile(): string
    {
        return self::dataDir() . '/auth-throttle.json';
    }

    public static function uploadsDir(): string
    {
        return __DIR__ . '/../uploads';
    }

    public static function adminPasswordHash(): string
    {
        self::loadLocalConfig();
        if (!defined('ADMIN_PASSWORD_HASH')) {
            throw new RuntimeException(
                'api/lib/config.local.php fehlt. Kopiere config.local.example.php und trage einen Passwort-Hash ein.'
            );
        }
        return ADMIN_PASSWORD_HASH;
    }

    private static function loadLocalConfig(): void
    {
        if (self::$localLoaded) {
            return;
        }
        self::$localLoaded = true;
        $path = __DIR__ . '/config.local.php';
        if (is_file($path)) {
            require $path;
        }
    }
}
