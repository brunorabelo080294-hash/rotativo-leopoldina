const CACHE_NAME = 'rotativo-leopoldina-v24';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './baixar.html',
  './manifest.json',
  './dados_iniciais.js',
  './logo-prefeitura.png',
  './icone-192.png',
  './icone-512.png',
  './apple-touch-icon.png',
  './favicon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ESTRATÉGIA NETWORK-FIRST: Sempre busca a versão mais recente na rede.
// Se estiver sem internet, usa o cache local.
self.addEventListener('fetch', (event) => {
  // Ignora chamadas externas do Google Sheets ou corsproxy para o fetch normal
  if (event.request.url.includes('docs.google.com') || event.request.url.includes('corsproxy')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida, atualiza o cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhar, usa o cache
        return caches.match(event.request);
      })
  );
});
