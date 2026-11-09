const BUILD='67';
const CACHE='petal-pounce-v67-rc15-animated-controls';
const SHELL=['./','./index.html','./privacy.html','./style.css?v=67','./retro-arcade.css?v=67','./zoom-B.css?v=67','./joystick.css?v=67','./petal-arcade.woff2','./shop.css?v=67','./game.mjs?v=67','./engine.mjs?v=67','./scenery.mjs?v=67','./flowers.mjs?v=67','./hold-controls.mjs?v=67','./profile.mjs?v=67','./bee.svg','./control-panel-base.png?v=67','./joystick-classic.png?v=67','./fly-classic.png?v=67','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];

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
