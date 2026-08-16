# base-fulda

PHP-Seite. Im Dev-Modus läuft sie über den eingebauten PHP-Webserver, Browser Sync sorgt für Live-Reload – kein Apache/XAMPP nötig.

## Voraussetzung

PHP muss in der Kommandozeile verfügbar sein (`php -v`).

## Start

1) Dependencies installieren:

`npm install`

2) Dev-Server starten:

`npm run dev`

Das startet parallel den PHP-Server (`localhost:8000`) und Browser Sync, das ihn proxied und den Browser automatisch öffnet. Änderungen an `index.php` sowie Dateien unter `assets/` und `events/` laden sofort neu.

Für den produktiven Betrieb (z. B. unter XAMPP/Apache) wird weiterhin ganz normal `index.php` direkt ausgeliefert – dafür ist kein `npm run dev` nötig.
