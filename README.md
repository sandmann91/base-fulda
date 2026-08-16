# base-fulda

PHP-Seite. Im Dev-Modus läuft sie über den eingebauten PHP-Webserver, Browser Sync sorgt für Live-Reload – kein Apache/XAMPP nötig.

## Voraussetzung

PHP muss in der Kommandozeile verfügbar sein (`php -v`).

## Start

1) Dependencies installieren:

`npm install`

2) Dev-Server starten:

`npm run dev`

Das startet parallel den PHP-Server (`localhost:8000`), den CSS-Build im Watch-Modus und Browser Sync, das alles proxied und den Browser automatisch öffnet. Änderungen an `index.php`, `assets/src/**` und `events/` laden automatisch neu.

Für den produktiven Betrieb (z. B. unter XAMPP/Apache) wird weiterhin ganz normal `index.php` direkt ausgeliefert – dafür ist kein `npm run dev` nötig.

## CSS-Build

Alle Styles (eigenes CSS, Bootstrap Reboot/Grid, Font Awesome, Google-Fonts-Ersatz via self-hosted Fonts) liegen als Quelle in [assets/src/main.css](assets/src/main.css) und werden per esbuild zu `assets/dist/main.css` (+ Font-Dateien) gebündelt und minifiziert. Es werden bewusst **keine externen CDNs** (Google Fonts, cdnjs) mehr eingebunden – u. a. weil das direkte Laden von Google Fonts beim Seitenaufruf ohne Einwilligung als DSGVO-Verstoß gilt.

- Eigene Styles bearbeiten: [assets/src/custom.css](assets/src/custom.css)
- Einmalig bauen: `npm run build`
- `assets/dist/` wird mit eingecheckt (kein CI/CD vorhanden) – nach Änderungen an `assets/src/` also **vor dem Deploy immer `npm run build` ausführen und den aktualisierten `assets/dist/`-Ordner committen**.
