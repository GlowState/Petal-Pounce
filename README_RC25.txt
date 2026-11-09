PETAL POUNCE — RC25: MENU DISPLAY FIX
====================================

Built directly on RC22, with fixed black-and-yellow menus, no RC23/RC24
forced visibility rules, and improved mobile typography. Install over RC24.

FIXES
• Fixes the black menu staying on-screen after starting/restarting play.
• Keeps the title/menu in the new black-and-yellow style.
• Compact popup styling is only shown while an actual menu is visible.
• Constrains text, titles, and buttons to screen width (no sideways scroll).
• Respects the game's existing overlay.hidden state without changing physics.
• Leaves all joystick and Fly controls, HUD, graphics, and scoring untouched.

LIMITATION
• The pause screen still uses the older "TAKE A BREATHER" wording.
  That wording is in game.mjs, not CSS; this package fixes menu display/layout.
  The optional RC25 text-patcher utility can update the copy separately.

INSTALL
1. Upload joystick.css and sw.js to GitHub repo root.
2. Upload dist/joystick.css and dist/sw.js to the corresponding dist folder.
3. Commit changes. Wait for GitHub Pages to publish, then reload/reopen.
4. Test Start > Play > Pause > Keep Flying > End Run > Play Again.

No gameplay scripts were modified.
