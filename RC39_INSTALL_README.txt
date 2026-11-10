PETAL POUNCE RC39 — NEON ICON + HOW TO PLAY POLISH
====================================================
This ZIP is a cumulative website update from the RC38 codebase. Existing
mechanics, input areas, saves, purchases, scoring, hazards and difficulty
are unchanged. Only APP_VERSION's label changes in game.mjs.

WHAT CHANGED
1. The lives box and three bee-life emblems use substantially gentler glow.
2. Main Menu High Score digits are larger, with a soft white outline;
   the cyan-to-pink gradient and floating position are preserved.
3. All close X buttons are floating soft WHITE with white glow (not pink).
4. How to Play was rewritten into 12 clean native tap-to-expand topics,
   with a streamlined heading, descriptions, and accessible keyboard support.
5. The app icon matches the EXISTING neon Petal Pounce main-menu artwork:
   the same cyan/pink title, glowing outline bee and dark navy atmosphere.
6. Standard 192 px and 512 px PNG icons, a 512 px maskable Android icon,
   manifest and PWA cache v90 are included.

UPLOAD TO GITHUB (REPOSITORY ROOT + DIST)
- Upload these 18 website files from the ZIP root, replacing files of
  the same name. DO NOT delete the other project files, including engine.mjs,
  flowers.mjs, style.css, fonts or existing saved data.
- Upload the identical 18 files from ZIP dist/ into your repository's
  dist/ folder, replacing the matching files there.
- Commit and wait for GitHub Pages deployment, then visit the site in Safari.
- Allow the installed Home Screen app to refresh using the new v90 cache.

NOTE ABOUT THE APP ICON
Apple iOS may retain a cached Home Screen icon even after a website update.
Do NOT remove the existing installed PWA just to refresh the icon without
first considering locally saved flowers, purchases and scores. For a new
Home Screen installation, the new icon is supplied by icon-192.png.
Native Android app-store launcher icons may need to be updated separately
inside an Android app project; this update covers the web/PWA icon assets.

TEST COVERAGE
- JS syntax (game.mjs, modules, service worker), XML/manifest/icon sizes,
  basic static checks, source parity with RC38 except UI and build label.
- Native accordion open/close interactions and horizontal overflow on
  320, 375, 393 and 430 pixel-wide Chromium viewports.
- High score stroke color/width computed in Chromium at several widths.
- Complete iPhone Home Screen behavior must still be verified on-device.

RC39 intentionally leaves the unresolved iPhone bottom-bar behavior alone.
