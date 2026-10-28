// 広告ナビ Service Worker（10/22 社長の指示：スマホで Web からインストールして使える形に）
// 方針：古い画面を出さないよう、画面のファイルは毎回サーバーの最新を取りにいく（network-first）。
// つながらないときだけ、前に開いたときの控えを出す。API（/api/）と他社のサーバー（Google Maps など）は扱わない。
// 中身を変えたら VERSION を上げる（古い控えは activate で消える）
const VERSION = 'kn-pwa-v1';
const SHELL = ['/', '/shared-data.js', '/pin-base.png', '/manifest.json', '/icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // Google Maps・Firebase などはブラウザに任せる
  if (url.pathname.startsWith('/api/')) return;        // 掲載情報・ログインは常にサーバーへ
  if (url.pathname.startsWith('/admin')) return;       // 管理画面は控えを作らない
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('/') : null)).then(r => r || Response.error()))
  );
});
