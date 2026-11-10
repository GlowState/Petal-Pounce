PETAL POUNCE — RC33 NEON UI ADDON A

PURPOSE
This is a separate visual-only workstream built from the RC33 menu baseline.
It extends the home-screen neon style across every non-gameplay menu and page.

UPDATED SURFACES
- Settings / Options
- How to Play
- Garden Shop
- Records
- Achievements
- First Flight tutorial
- Credits
- Pause
- Revival
- Game Over

FILES IN THIS ADDON
- neon-ui.css
- neon-ui-backdrop.png
- index.html
- sw.js
- matching dist/ copies

UNCHANGED
- game.mjs
- engine.mjs
- movement and joystick behavior
- Fly input
- physics and vertical/horizontal speed
- hazards, flowers, beetles and wind
- collisions and safe revival
- scoring, streaks, lives and progression
- the gameplay canvas and level artwork
- saved player data

IMPORTANT MERGE NOTE
Another workstream is building the neon level theme. This addon is intentionally
separate so the two updates can be reviewed independently. If the level build is
packaged after this addon, merge the neon-ui.css link and the two new assets into
that newer build instead of replacing its index.html or sw.js with older copies.

DIRECT UPLOAD (RC33 BASELINE ONLY)
Upload these four files to the repository root:
- index.html
- sw.js
- neon-ui.css
- neon-ui-backdrop.png

Upload the same four files from dist/ into the repository dist/ folder.

CACHE
The addon uses cache build 85 so iPhone Home Screen installations receive the
new stylesheet and artwork.

ROLLBACK
Remove neon-ui.css and neon-ui-backdrop.png, restore the previous index.html and
sw.js, and the app returns to the RC33 menu presentation.
