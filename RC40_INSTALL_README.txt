PETAL POUNCE RC40 — ANDROID BUILD CLEANUP + JOYSTICK FIX
======================================================

WHAT THIS IS: SOURCE UPDATE PACKAGE, NOT AN APK OR SIGNED GOOGLE PLAY AAB.
Merge it into your existing GlowState/Petal-Pounce GitHub repository.

1. JOYSTICK FIX (WEBSITE + ANDROID):
 - RC37/RC39 stored the joystick look, but its filter targeted a transparent
   housing, while the visible gold image rendered in #joystick-stick.
 - RC40 applies the classic/neon/minimal appearance to the actual moving image.
 - On mobile, redundant gold ball/stem art is hidden to match the preview.
 - The joystick's movement, touch zone, steering, deadzone, and physics do NOT change.
 - Existing saved 'petal-pounce-control-looks-v1' choices continue to work.

2. ANDROID BUILD CLEANUP:
 - The repository currently contains android-build.yml at its ROOT. GitHub
   Actions ignores workflows unless they live under .github/workflows/.
 - Add the new .github/workflows/android-build.yml from this package.
 - Existing Android Gradle app now fails early if dist/ is missing files,
   references an outdated game release, or differs from the website root.
 - New tests enforce root/dist parity and verify that RC40 assets exist.
 - Root/dist privacy policy is synchronized and updated for cosmetics.
 - Android launcher icons are refreshed to match the RC39 neon menu artwork.
 - System bar/theme colors now use deep navy matching the neon game.
 - The Android wrapper still targets API 36. No permissions, ads, accounts,
   tracking, or in-app purchases are introduced.

3. HOW TO INSTALL (IMPORTANT):
 A) Extract the entire ZIP locally.
 B) From the ZIP root, copy all the website files to the repo ROOT,
    replacing files that have the same names.
 C) Copy every file from the ZIP's dist/ to your repo's dist/.
    DO NOT delete other existing dist/ files, such as engine.mjs, fonts,
    privacy.html, fly-classic.png and joystick-classic.png.
 D) Merge the ZIP's android-app/ folder into the repository android-app/.
    This updates app/build.gradle, MainActivity colors and launcher icons.
 E) Add .github/workflows/android-build.yml and scripts/verify-android-assets.mjs
    at those EXACT repository paths. Do not put the workflow at the root.
 F) Commit to main; open GitHub Actions > Petal Pounce Android CI.
    Normal runs build debug APK and debug AAB. The release workflow does
    NOT sign an AAB without explicitly selecting 'signed_release' and
    configuring four private signing secrets.

4. CHECKS BEFORE YOU PRESS RELEASE:
 Run: node scripts/verify-android-assets.mjs
 Run: node --test tests/*.test.mjs
 And after Gradle + Android SDK 36 are installed:
   gradle -p android-app lintDebug assembleDebug bundleDebug
 Test the debug APK on an Android device, including offline restart,
 saving a style, closing/reopening Customize, and joystick movement.
 Then use a signed release AAB for Play internal testing.

SECURITY: Never commit a .jks, keystore password, or signing secrets.
KNOWN LIMIT: This environment cannot run Gradle/Android SDK or verify an
 installed Android APK. The ZIP is source-ready but NOT Play-validated.

APP STATE: RC40 is based directly on the exact RC39 ZIP; the simulator's
 engine.mjs, hold-controls.mjs, collision, physics, score and difficulty
 files are unchanged. Saved progress is not reset.
