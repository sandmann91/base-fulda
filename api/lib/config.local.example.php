<?php
declare(strict_types=1);

// Kopieren nach config.local.php (wird von git ignoriert, siehe .gitignore).
// Hash erzeugen mit:
//   php -r "echo password_hash('DEIN_PASSWORT', PASSWORD_DEFAULT), PHP_EOL;"

define('ADMIN_PASSWORD_HASH', '$2y$10$replaceWithARealBcryptHashHere');
