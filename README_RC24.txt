PETAL POUNCE — RC24: BLACK + YELLOW COMPACT PAUSE POPUP
=========================================================

Install directly over RC22. RC23 does not need to be installed first.

WHAT CHANGED
• Includes the smaller centered popup layout from RC23.
• Uses a deep-black popup with a warm yellow/gold border and title.
• Uses a golden Keep Flying button with black lettering.
• Makes End Run a restrained gold text link.
• Keeps the paused garden visible with subtle dimming and blur.
• Preserves RC22 HUD, score, Shop, lives and floating control layout.

IMPORTANT SCOPE
• This is a CSS-only visual theme and cache update.
• The existing app uses the same state-overlay component for Pause and Game Over,
  so the compact black/yellow styling also affects Game Over on mobile.
• The new text copy (Tuckered Out? / Your garden will bee right here when you
  get back.) is NOT part of this CSS-only zip, because it is rendered by
  game.mjs. These files do not change that script.
• None of the actual game mechanics or touch handlers were changed.

FILES TO UPLOAD
  joystick.css     => repository root
  sw.js            => repository root
  dist/joystick.css => repository dist folder
  dist/sw.js        => repository dist folder

Commit and push, then reload the game after GitHub Pages finishes deploying.
