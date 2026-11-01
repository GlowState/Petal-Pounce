# Petal Pounce Android release handoff

Petal Pounce now includes a native Android project in `android-app/`. It packages the `dist/` game inside a hardened `WebViewAssetLoader` shell, works offline, requests no permissions, and uses the permanent package ID `com.glowstate.petalpounce`.

## Publisher decisions still required

- The permanent package ID is `com.glowstate.petalpounce`. Do not change it after the first Play Console app/release is created.
- Create and protect the Android signing key and Play App Signing account. Never commit signing keys or passwords.
- Choose the paid price and countries in Play Console. The in-game flower shop uses earned flowers only; it does not process money.
- Host a public privacy policy. The current game has no account, ads, analytics or networked player data; flower balance, settings and high score stay on the device.
- Supply final store screenshots, feature graphic, short/full descriptions, content rating and Data safety answers.

## Packaging path

1. Put this repository in private GitHub source control, excluding signing secrets.
2. Let `.github/workflows/android-build.yml` build the debug AAB and run all tests.
3. Generate the upload keystore locally and add its encoded value/passwords only as GitHub environment secrets.
4. Run the signed-release workflow and test its AAB on current small, tall and tablet devices.
5. Test multi-touch steering plus Fly, interruptions, offline launch, safe areas, audio behavior, saved flower purchases and upgrade persistence.
6. Upload the bundle to Play Console internal testing before production.

The included `manifest.webmanifest`, service worker, Android-size icons and in-app `privacy.html` page also allow browser installation and give the wrapper a complete offline-ready asset set. As of November 1, 2026, Google requires new app submissions to target API 36 or newer, use Play App Signing, and complete the Data safety form. Re-check these requirements immediately before submission because Google updates them regularly.

Official references:

- https://support.google.com/googleplay/android-developer/answer/11926878
- https://developer.android.com/studio/publish/app-signing
- https://support.google.com/googleplay/android-developer/answer/10787469
