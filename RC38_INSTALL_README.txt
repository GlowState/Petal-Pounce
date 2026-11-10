PETAL POUNCE RC38 — FLOWER SHOP, CUSTOMIZE PREVIEWS & NEON POLISH
================================================================
CUMULATIVE UPDATE from RC36/RC37. Build 89 / version 1.0 RC38.

NEW
1. Flower Shop now has LEVELS / BEES / TRAILS tabs.
   - Five existing gardens and their unlock prices are unchanged.
   - Eight original bees remain available via their original achievement rules.
   - Two separate, shop-only bee skins added:
       Neon Scout: 90 banked flowers
       Candywing: 150 banked flowers
   - Three trail choices: Bee Default (free), Neon Sparks (75 flowers),
     Pink Pollen (125 flowers). Trail choice is a visual effect only.
   - Purchases use the existing banked flower balance, but new bee and trail
     ownership is stored separately under petal-pounce-shop-cosmetics-v1.
2. Customize now shows rendered level artwork and exact existing Fly/Joystick
   sprite images (Classic / Neon / Minimal); Gardens is renamed LEVELS.
3. Bee names in Customize have glowing white type.
4. Centered Game Over overlay; HUD, lives and control art are hidden behind it.
   PAUSE has not been modified by this change.
5. Floating neon-pink X without a surrounding white/circular backing.
6. New transparent cyan-and-pink outline bee emblem on life icons,
   game-over buttons, navigation buttons and Credits.
7. Flower Shop header glows pink. High Score numbers blend cyan/pink neon.
8. Neon Fly cosmetic uses blue/pink tint rather than green. TOUCH ZONES remain
   absolutely unchanged.

WHAT IS NOT TOUCHED
No engine.mjs, hold-controls.mjs, flowers.mjs, physics, difficulty, collision,
scoring, steering, thrust, checkpoint behavior or control hit areas are changed.
Existing saved flower balance, purchased gardens, best scores, achievements,
and original bee unlocks remain intact. Never delete app storage to refresh.
The unresolved iPhone Home Screen bottom-bar behavior has not been changed.

GITHUB INSTALL
1. Unzip the archive.
2. Upload the 13 files from the top level into your repository ROOT, replacing
   matching names. The new assets rc38.css and bee-life-neon.svg are required.
3. Upload the matching 13 files from dist/ into the GitHub dist/ folder.
   Do not place dist/ inside dist/! Root and dist versions are byte-identical.
4. Commit changes; let Pages deploy, open once in Safari, then fully close
   and reopen your Home Screen copy. No reinstall or storage reset.
5. Check each Flower Shop tab, preview customization, new life icons,
   Game Over centering and the existing joystick/Fly response.

NOTE ON IMAGE DEPENDENCIES
The exact gameplay sprite files fly-classic.png and joystick-classic.png are
unchanged and already live in the repository. RC38 displays those existing
images in the Customize previews; do not delete or rename them.

TESTS
- JavaScript syntax, ZIP integrity, file-pair consistency and markup checked.
- In-browser interactions checked at 320, 375, 393, 430 px widths. Game Over
  centered within a fraction of a pixel with no HUD/controls in front.
- Tested all three shop tabs, all five level preview canvases, Fly/Joystick
  previews, saved Bee and Trail purchases, existing achievement locks,
  and 0 runtime JS errors during the tested flows.
- Final iPhone Safari / deployed PWA appearance still needs real-device testing.
