PETAL POUNCE — RC21: FLOATING CONTROLS & CENTERED SCORE
=======================================================

VISUAL-ONLY UPDATE • BUILT ON RC20 • NO GAMEPLAY SOURCE CHANGES

CHANGES
• Spreads joystick/Fly input regions 12px further toward each edge.
• Makes visible joystick 99px (was 88px) and Fly button 118px (was 108px).
• Moves original Sound and Pause buttons to the bottom-center between the main controls.
• Adds subtle glowing-white circular styling to Sound and Pause. Paused/disabled
  controls still respect their original states and events.
• Centers SCORE and increases its font size; retains FLOWERS toward the right.
• Removes the HUD/top utility bar's translucent background.
• Preserves RC20's full-screen gameplay behind the controls.

WHAT IS NOT CHANGED
• game.mjs, engine.mjs, hold-controls.mjs, scenery.mjs and flowers.mjs.
• Movement/flight speed, steering handler, physics, hazards, lives, scoring,
  collision detection, progression, auto-revival and in-game save data.
• Joystick zone width/height and Fly button event handler (only position and
  visible Fly button dimensions are adjusted).

INSTALL — GlowState/Petal-Pounce
1. Keep RC20 in place; this update builds on it.
2. Upload joystick.css and sw.js from this ZIP root into your GitHub repo root.
3. Upload matching dist/joystick.css and dist/sw.js into the repo's dist folder.
4. Commit; GitHub Pages deploys from dist.
5. Refresh/close and reopen the website or Home Screen app to allow cache v73
   to activate. If visuals are stale, revisit after deployment and refresh.

NOTE
• Do not remove other files. No HTML, JavaScript gameplay code or assets need
  replacement in this update.
• The score and button placement are CSS and need a visual test on the real phone
  before release. Safe-area offsets support modern iPhones and other mobile screens.
• Installation is NOT automated; upload is required because GitHub writes are
  unavailable through the connected account.

TEST
[ ] Screen still fills entire viewport with no trim or panel image.
[ ] Joystick and Fly are a little larger, spaced further apart, and responsive.
[ ] Sound/Pause appear in the center BELOW the main buttons and work.
[ ] SCORE is large and centered; FLOWERS remains readable on the right.
[ ] No translucent bar appears behind the HUD/utility row.
[ ] Title, pauses, restarts, menus, toast and lives remain visible.
[ ] Check in browser and installed Home Screen mode, if used.

ROLLBACK
Reupload the RC20 joystick.css and sw.js into both root and dist.
