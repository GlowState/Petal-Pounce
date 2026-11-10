PETAL POUNCE RC30 — RESPONSIVE HUD / LIVES / PAUSE / CONTROL ALIGNMENT

RC30 is a cumulative update built from RC29. No separate prior patch is
required if you have the game's other image and module assets installed.

CHANGES:
• Shop, live SCORE and live FLOWERS are now children of the SAME #hud grid.
  This prevents independent absolute positioning and keeps a consistent
  3-column row from 320px to 560px phone widths. Shop uses the same existing
  #open-shop button and its existing click handler; no new gameplay code.
• Shop and readouts are smaller, with balanced 42px-tall touch/readout cards.
• Lives hides the visible numeral and word; the original 3 bee images and
  ARIA accessibility label are retained. Shrink-wrapped to the icons and
  aligned with Shop's left edge at the bottom, slightly lower than RC29.
• Pause popup moves to the screen center and changes to semi-transparent
  slate gray, keeping the yellow buttons and original End Run action.
• Joystick and Fly control areas move down 7px on shorter screens and 13px
  on taller screens. Their sizes, handlers and joystick/Fly logic do not change.
• Score/flowers/bloom-streak continue using the game's existing dynamic data.

UPLOAD THESE FIVE FILES IN BOTH LOCATIONS:
1. Repository root: index.html, joystick.css, game.mjs, sw.js,
   manifest.webmanifest.
2. dist folder: matching files inside the dist/ directory.
3. Commit to GitHub and fully close/reopen the installed game after deploy.

Note: The manifest is unchanged from RC29, included to make this package
self-contained for owners updating from RC28 as well.

DO NOT delete the Home Screen app to refresh it: progress is saved locally.
No canvas, physics, collision, joystick input, scoring, or difficulty code
was changed. The only game.mjs edit updates the credits version string.

QA: ZIP structure/integrity, root=dist parity, asset references, and CSS
parsing checked. iOS in-app sizing still needs to be confirmed on device.
