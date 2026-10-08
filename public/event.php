<?php
declare(strict_types=1);

// Liefert für /events/<slug> die normale SPA (index.html) aus, setzt vorher aber
// Titel, Beschreibung und Flyer des Events in die Vorschau-Tags ein.
// WhatsApp, Instagram, Facebook & Co. führen kein JavaScript aus und würden
// sonst nur die allgemeine Startseiten-Vorschau anzeigen.
// Die Tags entsprechen denen aus src/components/seo/seo.tsx.

require_once __DIR__ . '/api/lib/EventStore.php';

const SITE_ORIGIN = 'https://base-fulda.de';
const SITE_NAME = 'BASE. Fulda';
const WEEKDAYS = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];

function escapeAttr(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/** Ersetzt den content eines einzeiligen <meta name|property="$key" content="..."> aus index.html. */
function setMeta(string $html, string $attribute, string $key, string $value): string
{
    $pattern = '/(<meta ' . $attribute . '="' . preg_quote($key, '/') . '" content=")[^"]*(")/';
    return preg_replace_callback($pattern, fn (array $m) => $m[1] . escapeAttr($value) . $m[2], $html, 1) ?? $html;
}

function formatDate(string $isoDate): string
{
    $date = DateTime::createFromFormat('Y-m-d', $isoDate);
    return $date ? WEEKDAYS[(int) $date->format('w')] . ', ' . $date->format('d.m.Y') : $isoDate;
}

function shorten(string $text, int $maxLength = 200): string
{
    $text = trim((string) preg_replace('/\s+/u', ' ', $text));
    return mb_strlen($text) > $maxLength ? rtrim(mb_substr($text, 0, $maxLength - 1)) . '…' : $text;
}

header('Content-Type: text/html; charset=utf-8');

$html = (string) file_get_contents(__DIR__ . '/index.html');
$slug = (string) ($_GET['slug'] ?? '');
$event = $slug !== '' ? EventStore::findBySlug($slug) : null;

if (!$event) {
    // Die SPA zeigt dann ihre 404-Seite; Suchmaschinen bekommen den passenden Status.
    http_response_code(404);
    echo $html;
    exit;
}

$title = $event['title'] . ' | ' . SITE_NAME;
$description = $event['description'] !== ''
    ? shorten($event['description'])
    : $event['title'] . ' am ' . formatDate($event['date']) . ', Beginn ' . $event['startTime'] . ' Uhr – BASE. Fulda';
$url = SITE_ORIGIN . '/events/' . rawurlencode($event['slug']);
$image = SITE_ORIGIN . '/api/uploads/' . rawurlencode($event['imageFilename']);

$html = preg_replace_callback(
    '/<title([^>]*)>[^<]*<\/title>/',
    fn (array $m) => '<title' . $m[1] . '>' . escapeAttr($title) . '</title>',
    $html,
    1,
) ?? $html;
$html = preg_replace_callback(
    '/(<link rel="canonical" href=")[^"]*(")/',
    fn (array $m) => $m[1] . escapeAttr($url) . $m[2],
    $html,
    1,
) ?? $html;
$html = setMeta($html, 'name', 'description', $description);
$html = setMeta($html, 'property', 'og:url', $url);
$html = setMeta($html, 'property', 'og:title', $title);
$html = setMeta($html, 'property', 'og:description', $description);
$html = setMeta($html, 'property', 'og:image', $image);

echo $html;
