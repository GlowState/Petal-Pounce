# Google Play Data safety draft

This draft matches version 1.0.0 as currently implemented. Re-audit it if any SDK, ads, analytics, accounts, cloud save, crash reporting, or network feature is added.

## Recommended declarations

- Does the app collect or share any of the required user data types? **No**
- Is all user data encrypted in transit? **Not applicable; the app does not transmit user data**
- Can users request deletion? **No account/server data exists. Local game data can be removed by clearing app storage or uninstalling.**
- Ads: **No**
- Account creation: **No**
- Location: **No**
- Personal information: **No**
- Financial information: **No**
- App activity/analytics: **No**
- Device identifiers: **No**
- Diagnostics/crash reporting: **No**
- Data shared with third parties: **No**

## Technical basis

- The Android manifest declares no permissions.
- The game is bundled inside the app and loads from `appassets.androidplatform.net` through `WebViewAssetLoader`.
- WebView cookies and third-party cookies are disabled.
- No JavaScript bridge is exposed.
- High score, sound choice, flower balance, unlocks, and equipped garden remain only in WebView local storage.
- Android cloud backup and device-transfer backup are disabled for app data.
