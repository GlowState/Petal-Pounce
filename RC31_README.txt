PETAL POUNCE — RC31 COMPACT ACHIEVEMENT + FLOWER MILESTONE NOTIFICATIONS

This is an INCREMENTAL update over the currently installed RC30.

Upload to repository ROOT:
  index.html
  joystick.css
  game.mjs
  sw.js

Upload to repository dist/ folder:
  dist/index.html
  dist/joystick.css
  dist/game.mjs
  dist/sw.js

New notification styling:
- Achievement and 25/50/75/... flower milestone banners shrink to 206 x 46 CSS pixels
  (188 x 44 on narrower phones); roughly half their previous area.
- Align left, directly beneath the Shop HUD button.
- Dark translucent black panels; translucent black circle behind the star/flower.
- Softer border and animation; messages still run for the existing 2.65 seconds.
- Long reward subtitles wrap when needed instead of overflowing.
- No gameplay mechanics, score, unlock rules, control handlers, pause or progress
  storage changed. The only game.mjs change is the displayed release number.

Cache version updated to 83 for the new stylesheet/module and displayed version RC31.

The bottom iOS bar remains unresolved and is NOT changed by this update.
