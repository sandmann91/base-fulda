# base-fulda

Website für den Club **BASE. Fulda** — Vite + React + Chakra UI im Frontend, ein schlankes PHP-Backend (ohne Framework/Composer) für die Event-Verwaltung.

## Setup

1. Dependencies installieren: `npm install`
2. Admin-Passwort einrichten:
   - `api/lib/config.local.example.php` nach `api/lib/config.local.php` kopieren
   - Hash erzeugen: `php -r "echo password_hash('DEIN_PASSWORT', PASSWORD_DEFAULT), PHP_EOL;"`
   - Hash in `config.local.php` eintragen
3. Dev-Server starten: `npm run dev`

Das startet den eingebauten PHP-Server (`localhost:8000`, dient nur als API-Backend) und Vite (`localhost:5173`) parallel. Vite proxied `/api/*` zum PHP-Server, sodass das Frontend im Dev-Modus genauso mit der API spricht wie später in Produktion.

Admin-Bereich: `/admin/login`.

## Build & Deploy

`npm run build` erzeugt `dist/`. Für den Produktivbetrieb auf einem Standard-Apache/PHP-Webserver:

1. Inhalt von `dist/` (`index.html`, `assets/`, `favicon.svg`, `social-preview.jpg`, `event.php` **und `.htaccess`**) direkt ins Webroot hochladen (nicht als Unterordner). Im FTP-Client versteckte Dateien einblenden, sonst fehlt die `.htaccess`.
2. `api/`- und `data/`-Ordner daneben ins selbe Webroot hochladen — jeweils inkl. ihrer `.htaccess` und inkl. `api/lib/config.local.php` mit dem echten Passwort-Hash (diese Datei ist nicht Teil des Git-Repos).
3. Die `.htaccess` aus `public/` (landet beim Build im Root von `dist/`) erzwingt HTTPS auf `base-fulda.de`, reicht `/api/*` an PHP durch, leitet `/events/<slug>` an `event.php` (setzt Titel, Beschreibung und Flyer als Link-Vorschau für WhatsApp & Co. ein und liefert dann die SPA aus), liefert echte Dateien direkt aus und gibt alle anderen Routen (`/admin`, ...) an die SPA, die dann clientseitig per React Router übernimmt. `api/.htaccess` sperrt `api/lib/`, `data/.htaccess` sperrt den Zugriff auf die Laufzeitdaten (Events-JSON, Login-Throttle).
4. Voraussetzungen am Server: PHP ≥ 8.1, SSL-Zertifikat für `base-fulda.de` und `www.base-fulda.de`, Schreibrechte für PHP auf `data/` und `api/uploads/`.

Es gibt kein CI/CD — `dist/` wird bewusst **nicht** committed und muss vor jedem Deploy frisch gebaut werden.

## Events verwalten

Events werden ausschließlich über den Admin-Bereich (`/admin`) gepflegt: Metadaten liegen in `data/events.json` (nicht versioniert, wird bei Bedarf automatisch angelegt), Titelbilder in `api/uploads/`.

Der alte `events/`-Ordner (Bild+Text-Dateien nach Datum benannt) ist ein Auslaufmodell aus der Vor-CRUD-Zeit und wird vom neuen Code nicht mehr gelesen. Kann gelöscht werden, sobald der Admin-Bereich produktiv genutzt wird.

## Tech-Stack

- React 19, Chakra UI v3, react-router-dom v7, react-helmet-async (Meta-Tags & JSON-LD für Google-Events)
- Self-hosted Font "Anta" via `@fontsource` (bewusst kein Google-Fonts-CDN, aus DSGVO-Gründen)
- PHP 8 ohne Framework/Composer als API-Backend, Event-Daten als JSON-Datei, Bilder als Dateien
