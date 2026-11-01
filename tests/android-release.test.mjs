import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Android release identity and current Play target are locked',async()=>{
  const gradle=await read('android-app/app/build.gradle');
  assert.match(gradle,/applicationId 'com\.glowstate\.petalpounce'/);
  assert.match(gradle,/namespace 'com\.glowstate\.petalpounce'/);
  assert.match(gradle,/compileSdk 36/);assert.match(gradle,/targetSdk 36/);
  assert.match(gradle,/versionCode 1/);assert.match(gradle,/versionName '1\.0\.0'/);
  assert.match(gradle,/androidx\.webkit:webkit:1\.18\.0/);
});

test('Android shell is offline and requests no device permissions',async()=>{
  const manifest=await read('android-app/app/src/main/AndroidManifest.xml');
  const activity=await read('android-app/app/src/main/java/com/glowstate/petalpounce/MainActivity.java');
  assert.equal(manifest.includes('<uses-permission'),false);
  assert.match(manifest,/android:allowBackup="false"/);
  assert.match(manifest,/android:usesCleartextTraffic="false"/);
  assert.match(activity,/WebViewAssetLoader/);
  assert.match(activity,/setAllowFileAccess\(false\)/);
  assert.match(activity,/setAcceptThirdPartyCookies\(webView, false\)/);
  assert.equal(activity.includes('addJavascriptInterface'),false);
});

test('native app mode is full-screen and keeps privacy accessible',async()=>{
  const html=await read('dist/index.html');
  const css=await read('dist/shop.css');
  assert.match(html,/classList\.add\('android-shell'\)/);
  assert.match(html,/id="privacy-in-app"/);
  assert.match(css,/html\.android-shell \.cabinet\{width:100%;height:100%/);
});

test('store listing copy fits Play field limits and contains no unfinished public claims',async()=>{
  const listing=await read('release/STORE_LISTING.md');
  const short=listing.match(/## Short description\n\n([^\n]+)/)?.[1]??'';
  assert.ok(short.length>0&&short.length<=80,`short description is ${short.length} characters`);
  assert.match(listing,/\$1\.99 USD/);
  assert.match(listing,/No ads, accounts, analytics, or tracking/);
});

test('signing files are ignored and absent from the repository',async()=>{
  const ignore=await read('.gitignore');
  assert.match(ignore,/\*\.jks/);assert.match(ignore,/\*\.keystore/);
  const files=await readdir(new URL('../',import.meta.url),{recursive:true});
  assert.equal(files.some(name=>/\.(jks|keystore)$/i.test(name)),false);
});

test('feature graphic is opaque 1024 by 500 PNG',async()=>{
  const bytes=await readFile(new URL('../release/store-assets/feature-graphic.png',import.meta.url));
  assert.equal(bytes.toString('ascii',1,4),'PNG');
  assert.equal(bytes.readUInt32BE(16),1024);assert.equal(bytes.readUInt32BE(20),500);
  assert.equal(bytes[25],2,'feature graphic must be RGB without alpha');
});
