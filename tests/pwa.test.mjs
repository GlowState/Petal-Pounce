import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the installable app manifest has complete Android icon sizes',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../dist/manifest.webmanifest',import.meta.url),'utf8'));
  assert.equal(manifest.name,'Petal Pounce');assert.equal(manifest.display,'standalone');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'&&icon.purpose==='any'));
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'&&icon.purpose==='maskable'));
  for(const icon of manifest.icons){
    const bytes=await readFile(new URL(`../dist/${icon.src.replace('./','')}`,import.meta.url));
    assert.equal(bytes.toString('ascii',1,4),'PNG');
    const [expectedWidth,expectedHeight]=icon.sizes.split('x').map(Number);
    assert.equal(bytes.readUInt32BE(16),expectedWidth);assert.equal(bytes.readUInt32BE(20),expectedHeight);
  }
});

test('the game deck exposes a joystick and separate fly button and registers the offline shell',async()=>{
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const style=await readFile(new URL('../dist/style.css',import.meta.url),'utf8');
  const shopStyle=await readFile(new URL('../dist/shop.css',import.meta.url),'utf8');
  const deck=html.match(/<div class="control-deck retro-controls">([\s\S]*?)<\/section>/)?.[1]??'';
  assert.ok(deck.includes('id="joystick"'));assert.ok(deck.includes('id="fly"'));
  assert.equal(deck.includes('control-label'),false);assert.equal(deck.includes('deck-message'),false);
  assert.ok(html.includes('manifest.webmanifest'));assert.ok(html.includes("serviceWorker.register('./sw.js')"));assert.ok(html.includes('privacy.html'));
  assert.equal(style.includes('@import url('),false,'the app shell must not contact an external font service');
  assert.ok(shopStyle.includes('-webkit-user-select:none'));assert.ok(shopStyle.includes('-webkit-touch-callout:none'));assert.ok(shopStyle.includes('-webkit-user-drag:none'));
  const privacy=await readFile(new URL('../dist/privacy.html',import.meta.url),'utf8');
  assert.ok(privacy.includes('does not collect, transmit, sell, or share personal data'));
});
