PETAL POUNCE RC37 — CUSTOMIZE & NAVIGATION (CUMULATIVE RELEASE)
===========================================================
BASE: RC36 | PWA BUILD/CACHE: 88 | SCRIPT VERSION: 1.0 RC37

NEW FEATURES
- Customize: 8 existing bee styles with named backstories, large preview,
  previous/next arrows, achievement lock rules and saved equipped choice.
- Customize also chooses owned garden designs and saves cosmetic Fly and
  Joystick appearance (Classic, Neon, Minimal).
- Camera-only checkpoint view adjustment: on revive, the last safe leaf is
  framed above the controls; the view follows the current bee climb until it
  rejoins its previous high point. Does NOT change physics or checkpoint rules.
- Semitransparent neon HUD, lives, Fly and Joystick visuals. Same touch zones.
- Flower Shop: 3-column garden selection grid, locks, center header / wallet,
  concise purchase/equip panel, smaller centered close control.
- Main Menu: PLAY, CUSTOMIZE, FLOWER SHOP, HIGH SCORES, OPTIONS.
  High Scores includes Records and Achievements tabs. Credits lives in Options.
- Options: simplified list, centered title, unified bee-emblem navigation.
- Credits: new thank-you wording and neon bee icon; Release row removed.
- Consistent centered small X controls; changed BEST SCORE to HIGH SCORE.

PRESERVATION
- No modifications to engine.mjs, flowers.mjs, hold-controls.mjs or game
  geometry/physics, score/difficulty rules, wind, obstacles, touch hit areas.
- Existing saved game keys and data remain intact (banked flowers, unlocks,
  achievements, records, and best scores). Control appearances use new,
  separate cosmetic-only storage key petal-pounce-control-looks-v1.
- Includes Neon Garden and all RC36 neon styling and menu artwork.

INSTALLATION (IMPORTANT)
1. Extract this ZIP.
2. Upload EACH of the 11 root files to the GitHub repository ROOT and replace
   matching files. Do not upload the 'dist' folder as a nested folder in root.
3. Upload the 11 matching files in ZIP's dist/ directory to GitHub's dist/
   directory, replacing matching files. This synchronizes the previously
   lagging RC32 dist deployment with RC36 + RC37.
4. Commit changes. Let GitHub Pages deploy, then fully close/reopen the
   iPhone Home Screen app. Do NOT uninstall/delete the app to force refresh:
   local saves are tied to device storage.
5. Confirm Customize, Flower Shop, Records/Achievements, Play, Pause and
   checkpoint revive on your actual iPhone.

TESTING
- Browser interactions passed at 320, 375, 393 and 430px widths.
- Separate regression validated Neon Garden purchase/save, bee unlocking,
  identical Fly/Joystick hit areas before/after customization, and checkpoint
  camera framing after a forced revive. 0 JS errors in tested flows.
- ZIP integrity, JavaScript syntax, HTML ID uniqueness and CSS parsing pass.
- iPhone Safari / live GitHub Pages deployment is NOT verified yet.
- The unresolved iOS Home Screen bottom bar is not altered by RC37.
