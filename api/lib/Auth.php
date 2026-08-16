<?php
declare(strict_types=1);

require_once __DIR__ . '/Config.php';
require_once __DIR__ . '/Response.php';

final class Auth
{
    private const MAX_ATTEMPTS = 5;
    private const LOCKOUT_SECONDS = 15 * 60;
    private const ATTEMPT_WINDOW_SECONDS = 10 * 60;

    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);

        session_start();
    }

    public static function isLoggedIn(): bool
    {
        return ($_SESSION['admin'] ?? false) === true;
    }

    public static function requireAuth(): void
    {
        if (!self::isLoggedIn()) {
            Response::error('unauthenticated', 401);
        }
    }

    public static function requireCsrf(?string $token): void
    {
        if (!$token || !hash_equals((string) ($_SESSION['csrf'] ?? ''), $token)) {
            Response::error('invalid_csrf', 403);
        }
    }

    public static function attemptLogin(string $password): bool
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $throttle = self::readThrottle();
        $entry = $throttle[$ip] ?? ['attempts' => 0, 'firstAttempt' => time(), 'lockedUntil' => 0];

        if ($entry['lockedUntil'] > time()) {
            Response::json(
                ['ok' => false, 'error' => 'too_many_attempts', 'retryAfter' => $entry['lockedUntil'] - time()],
                429
            );
        }

        if (time() - $entry['firstAttempt'] > self::ATTEMPT_WINDOW_SECONDS) {
            $entry = ['attempts' => 0, 'firstAttempt' => time(), 'lockedUntil' => 0];
        }

        // Konstante Mindestverzögerung gegen Brute-Force/Timing-Angriffe.
        usleep(300_000);

        if (!password_verify($password, Config::adminPasswordHash())) {
            $entry['attempts']++;
            if ($entry['attempts'] >= self::MAX_ATTEMPTS) {
                $entry['lockedUntil'] = time() + self::LOCKOUT_SECONDS;
            }
            $throttle[$ip] = $entry;
            self::writeThrottle($throttle);
            return false;
        }

        unset($throttle[$ip]);
        self::writeThrottle($throttle);

        self::startSession();
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        $_SESSION['csrf'] = bin2hex(random_bytes(32));

        return true;
    }

    public static function csrfToken(): string
    {
        return $_SESSION['csrf'] ?? '';
    }

    public static function logout(): void
    {
        $_SESSION = [];
        session_destroy();
    }

    private static function readThrottle(): array
    {
        $file = Config::throttleFile();
        if (!is_file($file)) {
            return [];
        }
        $contents = file_get_contents($file);
        return $contents ? (json_decode($contents, true) ?: []) : [];
    }

    private static function writeThrottle(array $data): void
    {
        $dir = dirname(Config::throttleFile());
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        file_put_contents(Config::throttleFile(), json_encode($data), LOCK_EX);
    }
}
