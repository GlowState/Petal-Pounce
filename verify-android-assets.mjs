import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root,file));
const required=['index.html','game.mjs','engine.mjs','scenery.mjs','flowers.mjs',
 'hold-controls.mjs','profile.mjs','joystick.css','rc37.css','rc38.css',
 'rc39.css','rc40.css','neon-ui.css','shop.css','style.css','sw.js',
 'joystick-classic.png','fly-classic.png','control-panel-base.png',
 'petal-arcade.woff2','neon-ui-backdrop.png','petal-pounce-main-menu.png',
 'bee-life-neon.svg','icon-192.png','icon-512.png','icon-maskable-512.png',
 'manifest.webmanifest','privacy.html'];
const mismatches=[];
for(const name of required){
 const d=path.join(root,'dist',name), r=path.join(root,name);
 assert(fs.existsSync(d),`Missing Android asset dist/${name}`);
 assert(fs.existsSync(r),`Missing website asset ${name}`);
 if(!read(name).equals(read(`dist/${name}`))) mismatches.push(name);
}
assert.deepEqual(mismatches,[],`Unsynchronized root/dist: ${mismatches.join(', ')}`);
const index=read('dist/index.html').toString();
const css=read('dist/rc40.css').toString();
const js=read('dist/game.mjs').toString();
const sw=read('dist/sw.js').toString();
assert(index.includes('rc40.css?v=91') && index.includes('game.mjs?v=91'));
assert(js.includes("const APP_VERSION = '1.0 RC40'"));
assert(js.includes('cabinet.dataset.joystickLook=controlLooks.joystick'));
assert(css.includes('[data-joystick-look="neon"] .control-deck .joystick-stick'));
assert(css.includes('[data-joystick-look="minimal"] .control-deck .joystick-stick'));
assert(sw.includes("const BUILD='91'"));
for(const ref of index.matchAll(/(?:src|href)="\.\/([^"?#]+)(?:\?[^\"]*)?"/g)) {
 const name=ref[1];
 assert(fs.existsSync(path.join(root,'dist',name)),`Missing linked file dist/${name}`);
}
for(const icon of ['icon-192.png','icon-512.png','icon-maskable-512.png']){
 const data=read(`dist/${icon}`);
 assert(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
}
console.log(`RC40 Android web asset verification OK: ${required.length} synchronized files.`);
