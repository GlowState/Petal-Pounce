const BUILD='77';
const CACHE='petal-pounce-v77-rc25-menu-display-fix';
const SHELL=['./','./index.html','./privacy.html','./style.css?v=68','./retro-arcade.css?v=68','./zoom-B.css?v=68','./joystick.css?v=68','./petal-arcade.woff2','./shop.css?v=68','./game.mjs?v=68','./engine.mjs?v=68','./scenery.mjs?v=68','./flowers.mjs?v=68','./hold-controls.mjs?v=68','./profile.mjs?v=68','./bee.svg','./control-panel-base.png?v=68','./joystick-classic.png?v=68','./fly-classic.png?v=68','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];

self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
    .then(()=>self.clients.matchAll({type:'window',includeUncontrolled:true}))
    .then(clients=>Promise.all(clients.map(client=>{
      const url=new URL(client.url);
      if(url.origin!==self.location.origin||url.searchParams.get('appbuild')===BUILD)return undefined;
      url.searchParams.set('appbuild',BUILD);
      return client.navigate(url.href).catch(()=>undefined);
    })))
));
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
