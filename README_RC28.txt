PETAL POUNCE RC28 — EDGE-TO-EDGE iPHONE STATUS AREA

CHANGE: iPhone's solid top strip can blend into the game. The iOS clock,
battery and cellular/Wi-Fi icons still appear; web apps cannot hide them.

Changes (3 files in root and dist):
  index.html  — viewport-fit=cover, bust CSS/SW versions, RC28 display label
  joystick.css — keep title art and Shop below iPhone safe area, extend sky behind status icons
  sw.js — force a new cache version (80)

No game.mjs, physics, scoring, state, controls, or graphics changed.

TO INSTALL:
1. Upload index.html, joystick.css, sw.js to the repository root.
2. Upload the matching dist/ versions to the dist folder.
3. Commit and reload the app after GitHub Pages deploys. Fully close/reopen
   the Home Screen app once if the cached old screen remains.

IMPORTANT: iOS 26 can render standalone status bars differently across versions.
This cannot remove the system clock/battery/status icons, and the status area
may remain opaque on affected iOS versions. Do NOT delete/reinstall the app
just to clear this: local records and unlocks may be lost.

RC27 remains the gameplay and main-menu baseline.
