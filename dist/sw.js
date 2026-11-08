const CACHE='petal-pounce-v57-browser-layout-parity';
const SHELL=['./','./index.html','./privacy.html','./style.css?v=57','./retro-arcade.css?v=57','./zoom-B.css?v=57','./joystick.css?v=57','./petal-arcade.woff2','./shop.css?v=57','./game.mjs?v=57','./engine.mjs?v=57','./scenery.mjs?v=57','./flowers.mjs?v=57','./hold-controls.mjs?v=57','./profile.mjs?v=57','./bee.svg','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];

self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  const liveAsset=event.request.mode==='navigate'||['script','style','manifest','font'].includes(event.request.destination);
  if(liveAsset){
    event.respondWith(fetch(event.request,{cache:'no-cache'}).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match('./index.html'))));
});
