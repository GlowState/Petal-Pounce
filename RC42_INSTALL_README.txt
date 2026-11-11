PETAL POUNCE — RC42: NEON GARDENS + GLOWWOOD MUSHROOMS

Built directly on the RC41 cumulative Android-ready source package.

NEW (VISUAL ONLY)
• Twilight Garden: soft lavender moonlight, subtle glowing leaf edges and pastel pink danger accents.
• Flower Garden: pink floral highlights, restrained neon platform and hazard trim.
• Glowwood Forest: cyan/teal bioluminescent scenery, luminous forest mushrooms and new glowing mushroom collectible artwork in place of the former bell-shaped blooms.
• Classic Garden: understated warm highlights around daisies, sky, safe leaves and hazards.
• Neon Garden: preserves its stronger cyan/magenta arcade artwork.
• Flower milestones (25 / 50 / 75 / ...): thin cyan rim with a restrained pink secondary glow, matching the main menu.
• How to Play explains that Glowwood mushrooms count as normal flower collectibles.

MECHANICS GUARANTEE
• `engine.mjs` is not changed or included in this archive. Retain your existing engine file.
• Flower positions, collection radius, score/bonus rules, physics, obstacle hitboxes, life count,
  steering, joystick, thrust, respawns, timers and difficulty are unchanged.
• Existing save keys, shop prices and owned/equipped garden IDs are unchanged.
• Bee skins are unchanged; replacement bee artwork can be added when you have it.

INSTALL ON THE EXISTING GITHUB REPOSITORY
1. Unzip this archive.
2. Merge the archive's files/folders into your existing `GlowState/Petal-Pounce` repository.
3. Replace matching files in BOTH the repository root and `dist/`. Keep unrelated files
   (engine.mjs, style.css, fonts etc.) that aren't included here.
4. Commit the changes. The new web assets are included in `dist/`, which the Android build packages.
5. Reload the deployed website (and relaunch an installed PWA) so the v93 cache updates.
6. When the GitHub Actions Android build runs, verify the debug APK on an Android device.

VALIDATION PERFORMED
• All 30 existing Node.js regression tests passed with this update merged into the complete source.
• Android web assets verifier passed: 30 root/dist file pairs synchronized.
• The unchanged engine.mjs SHA-256 matches RC41 exactly.
• Real garden drawing functions rendered correctly on the browser canvas for all five gardens.
• Milestone CSS checked visually; 1.5px specified neon border (browser computes 1px at 1x viewport).

IMPORTANT
This is a source/package update, not a signed Android APK/AAB or a claim of device playtesting.
