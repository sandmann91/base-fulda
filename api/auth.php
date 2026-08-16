<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/Config.php';
require_once __DIR__ . '/lib/Response.php';
require_once __DIR__ . '/lib/Auth.php';

Auth::startSession();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' && ($_GET['action'] ?? '') === 'me') {
    Response::json(['ok' => true, 'authenticated' => Auth::isLoggedIn()]);
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input') ?: '', true) ?? [];
    $password = (string) ($body['password'] ?? '');

    if ($password === '') {
        Response::error('password_required', 422);
    }

    if (!Auth::attemptLogin($password)) {
        Response::error('invalid_password', 401);
    }

    Response::json(['ok' => true, 'csrfToken' => Auth::csrfToken()]);
}

if ($method === 'DELETE') {
    Auth::requireAuth();
    Auth::logout();
    Response::json(['ok' => true]);
}

Response::error('method_not_allowed', 405);
