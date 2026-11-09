PETAL POUNCE — RC17 FLORAL SCREEN TRIM
=======================================

CHANGE SUMMARY
- Fits the pink / dark-green / gold garden trim around the gameplay screen only.
- Ends at the bottom of the screen area ABOVE the joystick and Fly-button control panel.
- Trim has a transparent center so the game, menus, HUD, and scenery remain visible.
- Art cannot intercept taps, drags, or controls (pointer-events:none).
- Removes the old thin decorative rails in mobile mode to prevent a double frame.
- Keeps the currently working control panel design and input targets.
- Updates service-worker offline cache to build 69 / RC17 so the new asset is precached.

ABSOLUTELY NO GAMEPLAY CODE HAS BEEN CHANGED.
No changes to: index.html, game.mjs, engine.mjs, steering logic, joystick geometry,
Fly button geometry, hazards, collision detection, lives, scoring, difficulty, or saves.

INSTALLATION — GITHUB GLOWSTATE/PETAL-POUNCE
This ZIP has matching copies for the repo root and for dist/.
GitHub Pages deploys dist/, so upload BOTH sets of three files.

1. Before uploading, keep a rollback copy of joystick.css and sw.js.
2. From the ZIP root, upload these files to the GitHub repository ROOT:
   - joystick.css                        [replace existing file]
   - sw.js                               [replace existing file]
   - Petal_Pounce_RC17_screen_trim.webp [new file]
3. Open the repo's dist folder and upload the matching three files from ZIP/dist/:
   - dist/joystick.css                        [replace existing file]
   - dist/sw.js                               [replace existing file]
   - dist/Petal_Pounce_RC17_screen_trim.webp [new file]
4. Commit to main. The pages.yml workflow deploys from dist.
5. After deployment, close/reopen Petal Pounce. If the trim remains missing,
   refresh or reopen the installed Home Screen app to let the new cache activate.

FILES INCLUDED
joystick.css — original steering styles preserved verbatim with visual-only RC17 override
sw.js        — original service worker preserved with new build ID and asset cache entry
Petal_Pounce_RC17_screen_trim.webp — transparent decorative overlay image
README_RC17.txt

dist/joystick.css
/dist/sw.js
/dist/Petal_Pounce_RC17_screen_trim.webp

ROLLBACK
Restore the prior joystick.css and sw.js from GitHub's previous commit in
both root and dist. The new WebP asset can remain unused; no saved data is changed.

LIMITATIONS
This is a prepared installation package, NOT a live repository update.
GitHub's connected integration rejected direct writes (403 Forbidden), so
files must be uploaded through GitHub by a repository editor. The code/CSS
was validated locally; the deployed game has not been interactively tested.
