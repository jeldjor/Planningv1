// cache v2.71 - network first, no stale iPhone cache
const CACHE='kim-planner-v271';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request).then(resp => {
    const copy = resp.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(()=>{});
    return resp;
  }).catch(() => caches.match(event.request)));
});
