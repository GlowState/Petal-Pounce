PETAL POUNCE — RC41 UI TITLES AND GUIDE TEXT

Built on cumulative RC40 Android/joystick release.

CHANGES
- Flower Shop title now matches the Options title's light cyan-white color.
- All page titles use a restrained, consistent glow.
- High Scores screen heading dynamically says Records or Achievements,
  depending on the tab selected (including on initial open).
- How to Play confirmation button now says GOT IT? LET'S POUNCE.
- RC41 build/cache 92 ensures installed web apps load the changes.

NOT CHANGED
- No changes to the engine, physics, collision, scoring, difficulty,
  movement, control response, or saved player progress.
- All RC40 Android assets, joystick fixes and Android build preparation
  are included unchanged.
- No bee appearance redesign in this update; that is the next design step.

INSTALL
1. Extract the archive. Merge all root-level files and the dist/ folder
   into your existing GlowState/Petal-Pounce repository.
2. Keep the .github/, android-app/ and scripts/ directories from the ZIP
   if you have not uploaded RC40 yet. Existing game files not in the ZIP
   (engine.mjs, style.css, fonts etc.) should NOT be deleted.
3. Replace existing files when prompted, and commit.
4. Check GitHub Pages and the GitHub Actions Android build.
5. Close and relaunch an installed web app to refresh the cache.

This is a cumulative source update, not a signed Android APK/AAB.
