// MANMIN Family Trip · 서비스워커 (HTML=네트워크 우선, 정적=캐시 우선)
const CACHE = 'manmin-sg-2026-v3';
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
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 외부(환율 API 등)는 캐시 안 함

  const isHTML = request.mode === 'navigate'
    || request.destination === 'document'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/');

  if (isHTML) {
    // 네트워크 우선: 항상 최신 페이지, 오프라인이면 캐시로 대체
    e.respondWith(
      fetch(request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(request).then(hit => hit || caches.match('./index.html')))
    );
  } else {
    // 정적 자산: 캐시 우선(빠름), 없으면 네트워크 후 캐시에 저장
    e.respondWith(
      caches.match(request).then(hit => hit || fetch(request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(request, copy)).catch(() => {});
        return res;
      }))
    );
  }
});
