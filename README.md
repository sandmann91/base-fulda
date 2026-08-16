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

1. Inhalt von `dist/` (also `index.html` + `assets/`) direkt ins Webroot hochladen (nicht als Unterordner).
2. `api/`- und `data/`-Ordner daneben ins selbe Webroot hochladen — inkl. `api/lib/config.local.php` mit dem echten Passwort-Hash (diese Datei ist nicht Teil des Git-Repos).
3. Die Root-`.htaccess` sorgt dafür, dass `/api/*` an PHP geht, echte Dateien direkt ausgeliefert werden und alle anderen Routen (`/events/:slug`, `/admin`, ...) an die SPA fallen, die dann clientseitig per React Router übernimmt.

Es gibt kein CI/CD — `dist/` wird bewusst **nicht** committed und muss vor jedem Deploy frisch gebaut werden.

## Events verwalten

Events werden ausschließlich über den Admin-Bereich (`/admin`) gepflegt: Metadaten liegen in `data/events.json` (nicht versioniert, wird bei Bedarf automatisch angelegt), Titelbilder in `api/uploads/`.

Der alte `events/`-Ordner (Bild+Text-Dateien nach Datum benannt) ist ein Auslaufmodell aus der Vor-CRUD-Zeit und wird vom neuen Code nicht mehr gelesen. Kann gelöscht werden, sobald der Admin-Bereich produktiv genutzt wird.

## Tech-Stack

- React 19, Chakra UI v3, react-router-dom v7, react-helmet-async (Meta-Tags & JSON-LD für Google-Events)
- Self-hosted Font "Anta" via `@fontsource` (bewusst kein Google-Fonts-CDN, aus DSGVO-Gründen)
- PHP 8 ohne Framework/Composer als API-Backend, Event-Daten als JSON-Datei, Bilder als Dateien
