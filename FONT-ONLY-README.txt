PETAL POUNCE — FONT-ONLY UPDATE (from OG-Petal-Pounce-Update-2-Automatic-Fullscreen.zip)

Only text font, typography sizing, and cache version have changed. No gameplay logic, controls, art, fullscreen logic, or HTML layout structure is modified.

For the website, put the 4 files inside dist/ into the existing dist folder in GlowState/Petal-Pounce:
  dist/index.html
  dist/style.css
  dist/game.mjs
  dist/sw.js

These replace same-named files. Do NOT upload them to the repository root if changing only the website.

The root copies are included for consistency if you later build another version, but they are not required for the website. All other files from your exact supplied ZIP are preserved unchanged.

Arcade font: Press Start 2P, SIL Open Font License (commercially usable). Font served from Google Fonts; a connection is required for this exact face, and an offline device will use a monospace fallback. No font files are redistributed.

The game's saved progress and previous controls are not changed. When testing on an iPhone, reload twice after the GitHub Pages deployment to let the service worker switch caches.
