// MANMIN Family Trip · 간단 오프라인 캐시
const CACHE = 'manmin-sg-2026-v2';
const ASSETS = [
  './', './index.html', './favicon.svg',
  './icon-192.png', './icon-512.png', './manifest.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  // 외부(교차 출처) 요청은 캐시하지 않고 항상 네트워크로 (실시간 환율 등)
  if (new URL(request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
