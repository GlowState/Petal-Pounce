# Petal Pounce

An independently drawn browser arcade game about a bee gathering flowers in a wild garden of thorny vines.

## Play

- Hold the left or right on-screen arrow button to steer. Release to stop steering.
- Left/right arrows or A/D also steer.
- Hold the large wing-outline button, Space, W or the up arrow to fly upward. Release to descend.
- Falling onto a leaf bounces the bee and sets a safe respawn point.
- Collect every flower to clear the garden. Avoid purple thorn branches and the bottom of the world.
- Three starting lives. Lives carry from one garden to the next, and every cleared garden awards one life up to the three-life maximum.
- Losing a life automatically revives the bee at the last leaf after a brief burst, with two seconds of protection. Only the last life ends the run.
- The run is endless: clearing a longer garden opens the next one, with no final stage. Every new run generates fresh layouts. Leaf sizes, spacing and positions vary; all thorn vines remain horizontal with different lengths, thicknesses and positions. Garden size is capped so late stages stay performant.
- Every collected bloom also adds one flower to a permanent, device-local bank. Twilight and Classic are free. Flower Garden costs 60 flowers and Glowwood costs 120. Unlocks are permanent on that device, and any owned garden can remain equipped across all levels. Every background has its own collectible flower design.
- P or Escape: pause. Switching away pauses automatically.
- The large, icon-only steering and Fly buttons support simultaneous touches. Pointer release, cancellation, capture loss, drag-out, app backgrounding and visibility changes all clear held input so a mobile button cannot remain stuck. The full game page disables selection, long-press copy callouts and image dragging; the controls also cancel Safari's parallel touch, selection, context-menu and drag defaults.

Flowers award ten honey. Clearing a garden awards two honey per remaining whole second. Losing a life retains already collected flowers. Timing out costs a life and automatically resets the timer when the bee revives. The timer freezes during revival and while paused. The personal best and sound preference are stored locally on the player's device. No account, database, analytics or paid service is used by the game.

## Project

The static site lives in `dist/`; the `.openai/hosting.json` manifest selects that directory. There is no build step. Serve `dist/` over HTTP for local play, since the JavaScript uses ES modules. It includes an installable web-app manifest, 192/512/maskable icons, an offline app shell, safe-area layout, responsive touch targets and standalone-display metadata.

The paid Android release source lives in `android-app/`. It targets API 36 under `com.glowstate.petalpounce`, bundles the web game offline through `WebViewAssetLoader`, declares no permissions, disables cookies/backups/cleartext traffic, and has automated GitHub Actions builds. Play Store copy, declarations, artwork and the remaining publisher checklist live in `release/`.

- `dist/engine.mjs`: deterministic level generation, fixed-step physics, collisions, scoring and run state.
- `dist/game.mjs`: canvas artwork, sound synthesis, inputs and interface.
- `dist/scenery.mjs`: environment palettes, cached background layers and atmospheric animation.
- `dist/flowers.mjs`: distinct flower art for each purchasable garden.
- `dist/hold-controls.mjs`: resilient multi-touch, pointer and keyboard hold lifecycle.
- `dist/profile.mjs`: device-local flower balance, permanent unlocks and equipped garden.
- `dist/manifest.webmanifest` and `dist/sw.js`: installability and offline shell.
- `dist/style.css`: responsive cabinet and controls.
- `tests/`: gameplay, control-release, economy/persistence and installability regression checks.

Run `node --test tests/*.test.mjs` and `node --check dist/game.mjs` to verify the source.

For Google Play, `android-app/` is the release wrapper. The included GitHub Actions workflow builds a debug App Bundle on every push and can build a signed release App Bundle after the publisher adds the private upload-key secrets. Store copy, declarations, the feature graphic and the remaining Play Console steps are collected in `release/`. The publisher still needs to provide a public privacy-policy URL, support contact, Play Console/payments identity, signing credentials and screenshots from the real Android build. Keep all credentials out of source control.

All bees, flowers, leaves, thorns and clouds are newly drawn in code. Audio uses generated oscillator tones. Petal Pounce is a working title; no comprehensive trademark clearance has been performed.
