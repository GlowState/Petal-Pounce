PETAL POUNCE — RC18 / NO-PINK TRIM + FITTED BUTTON OPENINGS
===========================================================

This is a cumulative visual update based on the existing RC16 code and RC17
floral frame. It works even if RC17 was not previously uploaded.

FIXES
1. Gold/dark-green floral screen trim replaces the pink rim. Transparent center
   displays the original game; frame ends ABOVE the entire control deck.
2. Cabinet pink border and iPhone Home Screen top pink rail are green/gold.
3. Panel art is cropped slightly to conceal its baked-in hot-pink outer rim.
4. Existing distorted elliptical button wells are concealed by opaque, forest-
   green circular pads; matching 1:1 concentric gold rings are drawn behind
   the actual joystick and Fly button. No stretching or changes to hit zones.
5. The circular bezels follow existing control centers on different screen
   widths. They do not intercept touches, drags, or pointer gestures.
6. Service worker cache bumped to v70/RC18 with the new transparent art.

GAMEPLAY PRESERVED
No changes to index.html, game.mjs, engine.mjs, joystick input logic, camera,
physics, game difficulty, collisions, lives, points, game saves, or controls.
Original joystick.css rules are retained VERBATIM; visual overrides appended.
The on-screen RC16 text remains unchanged (because index.html is not edited).

IMPORTANT DESIGN NOTE
The panel base image still stretches its ornamental art inside the cropped
background layer, but its old built-in distorted button wells are now masked
and replaced with truly circular live CSS bezels. This makes the button rings
line up with the actual on-screen controls without changing their input zones.

INSTALL — https://github.com/GlowState/Petal-Pounce
GitHub Pages publishes files from the dist/ folder. Update BOTH locations.

Upload these 3 files to the repository ROOT:
  joystick.css                              (replace)
  sw.js                                     (replace)
  Petal_Pounce_RC18_screen_trim_gold.webp  (new)

Upload the same 3 matching files from this ZIP's dist/ directory into
GitHub's dist/ folder:
  dist/joystick.css
  dist/sw.js
  dist/Petal_Pounce_RC18_screen_trim_gold.webp

Commit the updates, allow the Pages deployment to finish, then fully close
and reopen the app on the phone to activate the new service-worker cache.
If your app is already open, reload. Installed iPhone apps may require a
second reopen when the new service worker takes control.

ROLLBACK
GitHub's previous commit preserves the prior joystick.css and sw.js files.
Restore those in both root and dist if desired. The added RC18 image can stay.
No user data, scores or saved unlocks are touched.

VERIFICATION SCOPE
CSS structure, content preservation, image alpha transparency and service-
worker syntax can be checked offline. Real iPhone rendering and gameplay
have NOT been verified on the user's device. GitHub direct write access was
previously denied (403), so this package does not change the live website.
