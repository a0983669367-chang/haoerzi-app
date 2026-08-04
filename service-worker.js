/* ==========================================================================
   service-worker.js — 讓 App 在沒有網路時也能開啟
   --------------------------------------------------------------------------
   ★ 每次改完程式碼、重新部署後，請把下面的 CACHE 版本號 +1
     （例如 v1 改成 v2），手機才會抓到最新版本。
   ========================================================================== */

var CACHE = 'haoerzi-v11';

var FILES = [
  './',
  './index.html',
  './css/styles.css',
  './js/data.js',
  './js/screens.js',
  './js/notes.js',
  './js/app.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

/* 安裝：預先下載所有檔案 */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

/* 啟用：清掉舊版快取 */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* 取用：優先用網路，失敗才用快取（確保使用者看到最新版） */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      })
      .catch(function () { return caches.match(e.request); })
  );
});
