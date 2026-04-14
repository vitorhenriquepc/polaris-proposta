// ============================================================
// SERVICE WORKER — Polaris Energia Solar
// Versao: 1.0
// ============================================================

const CACHE_NAME = 'polaris-proposta-v1';

// Arquivos essenciais para funcionamento offline
const ASSETS = [
  '/',
  '/index.html'
];

// INSTALL — cacheia os arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE — limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH — cache first para assets, network first para o resto
self.addEventListener('fetch', event => {
  // Ignorar requisicoes nao GET
  if (event.request.method !== 'GET') return;

  // Ignorar requisicoes externas (CDN, APIs)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cachear apenas respostas validas
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback para offline: retornar index.html
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
