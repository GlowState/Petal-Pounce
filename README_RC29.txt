PETAL POUNCE — RC29 | iPHONE BOTTOM BAND COLOR BLEND

Use this package over RC28. Only visual chrome/metadata and the release
version string change. Gameplay, physics, collision, scoring, joystick, Fly
button positions, input events, and popups are UNCHANGED.

WHY: The screenshot shows the game ending at the web viewport and a 50-ish
CSS-pixel strip painted below in the old app background (#171e20).
On iOS 26 installed Home Screen web apps, WebKit can reserve this bottom
region outside the page's viewport (bug 301994 / 313800). CSS cannot
reliably draw the actual game canvas into that OS-owned area.

RC29 changes the launch color, theme/background metadata, and fallback
page color to #2c424d — sampled from the Twilight Garden's bottom edge.
That removes the stark near-black strip and blends the bottom visually
without stretching or repositioning any gameplay element.

UPLOAD ONLY THESE FIVE FILES, IN BOTH LOCATIONS:
1. index.html, joystick.css, sw.js, manifest.webmanifest, game.mjs
   -> GitHub repository root.
2. dist/index.html, dist/joystick.css, dist/sw.js,
   dist/manifest.webmanifest, dist/game.mjs -> dist folder.
3. Commit. After Pages updates, fully CLOSE and reopen the Home Screen app.
   iOS can cache the OS-painted band color until the app relaunches.

DO NOT delete the installed app: player data is stored locally.

LIMITATION: iOS 26 WebKit may still leave a separate physical band. This
update matches its color; it cannot guarantee the garden image itself
reaches that OS-owned area or remove the iPhone Home indicator.
