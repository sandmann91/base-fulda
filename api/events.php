<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/Config.php';
require_once __DIR__ . '/lib/Response.php';
require_once __DIR__ . '/lib/Auth.php';
require_once __DIR__ . '/lib/EventStore.php';

Auth::startSession();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['slug'])) {
        $event = EventStore::findBySlug((string) $_GET['slug']);
        if (!$event) {
            Response::error('not_found', 404);
        }
        Response::json(['ok' => true, 'event' => $event]);
    }

    $events = EventStore::readAll();
    usort($events, fn ($a, $b) => $a['date'] <=> $b['date']);

    if (($_GET['upcoming'] ?? '') === '1') {
        $today = (new DateTime())->format('Y-m-d');
        $events = array_values(array_filter($events, fn ($e) => $e['date'] >= $today));
    }

    Response::json(['ok' => true, 'events' => $events]);
}

if ($method === 'POST') {
    Auth::requireAuth();
    Auth::requireCsrf($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null);

    $id = $_POST['id'] ?? null;
    $title = trim((string) ($_POST['title'] ?? ''));
    $description = trim((string) ($_POST['description'] ?? ''));
    $date = (string) ($_POST['date'] ?? '');
    $startTime = (string) ($_POST['startTime'] ?? '');
    $doorsTime = trim((string) ($_POST['doorsTime'] ?? ''));
    $price = trim((string) ($_POST['price'] ?? ''));

    if ($title === '' || $description === '' || $date === '' || $startTime === '' || $price === '') {
        Response::error('missing_fields', 422);
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !preg_match('/^\d{2}:\d{2}$/', $startTime)) {
        Response::error('invalid_format', 422);
    }

    $hasImageUpload = isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE;

    if (!$id && !$hasImageUpload) {
        Response::error('image_required', 422);
    }

    try {
        $result = EventStore::withLock(
            function (array $events) use ($id, $title, $description, $date, $startTime, $doorsTime, $price, $hasImageUpload) {
                $now = (new DateTime())->format(DateTime::ATOM);

                if ($id) {
                    $index = null;
                    foreach ($events as $i => $event) {
                        if ($event['id'] === $id) {
                            $index = $i;
                            break;
                        }
                    }
                    if ($index === null) {
                        Response::error('not_found', 404);
                    }

                    $existing = $events[$index];
                    $imageFilename = $existing['imageFilename'];
                    if ($hasImageUpload) {
                        $imageFilename = EventStore::saveUpload($_FILES['image']);
                        EventStore::deleteUpload($existing['imageFilename']);
                    }

                    $baseSlug = EventStore::slugify($title);
                    $slug = $baseSlug === EventStore::slugify($existing['title'])
                        ? $existing['slug']
                        : EventStore::uniqueSlug($events, $baseSlug, $id);

                    $events[$index] = array_merge($existing, [
                        'title' => $title,
                        'slug' => $slug,
                        'description' => $description,
                        'date' => $date,
                        'startTime' => $startTime,
                        'doorsTime' => $doorsTime !== '' ? $doorsTime : null,
                        'price' => $price,
                        'imageFilename' => $imageFilename,
                        'updatedAt' => $now,
                    ]);

                    return [$events, $events[$index]];
                }

                $imageFilename = EventStore::saveUpload($_FILES['image']);
                $slug = EventStore::uniqueSlug($events, EventStore::slugify($title));

                $event = [
                    'id' => bin2hex(random_bytes(8)),
                    'slug' => $slug,
                    'title' => $title,
                    'description' => $description,
                    'date' => $date,
                    'startTime' => $startTime,
                    'doorsTime' => $doorsTime !== '' ? $doorsTime : null,
                    'price' => $price,
                    'imageFilename' => $imageFilename,
                    'createdAt' => $now,
                    'updatedAt' => $now,
                ];

                $events[] = $event;
                return [$events, $event];
            }
        );
    } catch (InvalidArgumentException $e) {
        Response::error($e->getMessage(), 422);
    }

    Response::json(['ok' => true, 'event' => $result], $id ? 200 : 201);
}

if ($method === 'DELETE') {
    Auth::requireAuth();
    Auth::requireCsrf($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null);

    $id = (string) ($_GET['id'] ?? '');
    if ($id === '') {
        Response::error('missing_id', 422);
    }

    $deleted = EventStore::withLock(function (array $events) use ($id) {
        $remaining = [];
        $removed = null;
        foreach ($events as $event) {
            if ($event['id'] === $id) {
                $removed = $event;
                continue;
            }
            $remaining[] = $event;
        }
        return [$remaining, $removed];
    });

    if (!$deleted) {
        Response::error('not_found', 404);
    }

    EventStore::deleteUpload($deleted['imageFilename']);
    Response::json(['ok' => true]);
}

Response::error('method_not_allowed', 405);
