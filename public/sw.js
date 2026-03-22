// public/sw.js
const CACHE_NAME = 'abntfacil-cache-v1';

// Recursos mínimos para a PWA funcionar offline
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalação: Salva em cache os arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto com sucesso');
        return cache.addAll(urlsToCache);
      })
  );
  // Força o novo SW a assumir o controle imediatamente
  self.skipWaiting();
});

// Ativação: Limpa caches antigos quando atualizas a versão
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Tenta buscar na internet. Se falhar (offline), busca no Cache
self.addEventListener('fetch', event => {
  // Ignora requisições de API externas (ex: Supabase) para o cache local
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});