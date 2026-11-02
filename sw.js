const CACHE='petal-pounce-v22-mixed-vines';
const SHELL=['./','./index.html','./privacy.html','./style.css?v=16','./retro-arcade.css?v=17','./zoom-B.css?v=19','./joystick.css?v=20','./petal-arcade.woff2','./shop.css?v=16','./game.mjs?v=22','./engine.mjs?v=22','./scenery.mjs?v=16','./flowers.mjs?v=16','./hold-controls.mjs?v=16','./profile.mjs?v=16','./bee.svg','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];

self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match('./index.html'))));
});
