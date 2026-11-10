PETAL POUNCE RC27 — FUNCTIONAL RETRO MAIN MENU

This update builds on RC26. No game engine or movement/control files change.

HOW TO UPLOAD
1. Unzip.
2. Upload the five files at the ZIP top level to your repository root.
3. Upload the five files inside dist/ to your existing dist/ folder.
4. Commit, refresh the GitHub Pages site / reopen your Home Screen app.

FILES: index.html, game.mjs, joystick.css, sw.js,
       petal-pounce-main-menu.png (plus matching files in dist/).

NEW MAIN MENU
- Pixel-art background remains a static image, buttons are live HTML.
- PLAY begins the normal game (original first-flight tutorial stays intact).
- HOW TO PLAY opens the existing help dialog.
- HIGH SCORES opens existing personal Records screen.
- OPTIONS opens working sound toggle, Garden Shop, Achievements, Credits.
- The six-digit HIGH SCORE is taken from the game's existing saved best,
  not baked into the background image.
- Title UI covers the full cabinet and hides gameplay controls;
  Pause/Game Over remain the original black-and-yellow popups.

GAMEPLAY UNCHANGED. No engine.mjs, hold-controls.mjs, scenery.mjs,
flowers.mjs, profile.mjs or game physics/collision/rules changed.

Note: scores stay on each player's device as before (not an online leaderboard).
