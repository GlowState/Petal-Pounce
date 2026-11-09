PETAL POUNCE — RC20: FULL-SCREEN GARDEN + FLOATING BUTTONS
========================================================

TWO FILES ONLY • VISUAL UPDATE • NO GAMEPLAY FILE CHANGES

WHAT CHANGED
- Removes all cabinet trim, pink/green/gold screen frame imagery, rails, and bottom divider on phones.
- Uses the entire available phone viewport for the actual game screen, behind floating controls.
- Removes the control-panel background art, panel background color, decorative wells and rings.
- Keeps the existing joystick artwork and Fly icon, now visibly smaller (~88px artwork).
- Leaves the steering and Fly hit zones large and uses the same input handlers.
- Moves lives and on-screen messages above the floating buttons to avoid overlap.
- Keeps title/game-over menus out of the bottom controls area.
- Does NOT change any JS: movement, physics, collisions, hazards, scoring, lives,
  camera logic, save data, or difficulty algorithms remain unmodified.

INSTALL IN GITHUB — GlowState/Petal-Pounce (main branch)
1. Extract this zip file.
2. Upload the two files in its root: joystick.css and sw.js.
3. Open the repository's dist folder and upload the matching two files from dist/.
4. Commit. GitHub Pages deploys from dist, so updating dist is essential.
5. Fully close/reopen the game on your iPhone after GitHub Pages deployment.
   If the old styling remains cached, refresh/reopen, or remove/re-add the
   Home Screen shortcut after verifying the web version.

The old panel-art files are deliberately NOT deleted. They are simply no longer
used, so you can revisit them later. The engine, game, HTML, and touch-control
scripts remain unchanged. This package is prepared for upload and not yet live.

TEST CHECKLIST
[ ] Game fills the phone viewport with no screen border.
[ ] No green deck or decorative plate underneath the controls.
[ ] Joystick and Fly button float over the game background.
[ ] Joystick remains responsive across its original full touch area.
[ ] Fly still responds to touch-and-hold, release, and repeated presses.
[ ] Lives, Shop, Pause and notifications remain visible and usable.
[ ] Start screen, restart menu, garden shop and pauses remain accessible.
[ ] Verify in both browser and added-to-Home-Screen mode if used.

ROLLBACK
Replace these same files in root and dist with the previous RC18 or RC19
copies. You do not need to touch game.mjs or engine.mjs to roll back.
