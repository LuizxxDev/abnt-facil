// Service worker do ABNTFácil: deixa o editor abrir e funcionar sem internet.
// - Páginas: rede primeiro; offline, devolve a página guardada (a SPA cuida da rota).
// - Arquivos de /assets (com hash no nome): cache primeiro, pois nunca mudam.
// - Fontes do Google: devolve do cache e atualiza em segundo plano.
// - /api (PDF no servidor) e Supabase nunca passam pelo cache.
const VERSION = 'v2';
const SHELL = `abntfacil-shell-${VERSION}`;
const RUNTIME = `abntfacil-runtime-${VERSION}`;

// Preenchida no build (vite.config.js) com os arquivos JS/CSS gerados
const BUILD_ASSETS = [];
const PRECACHE = ['/', '/index.html', '/app.html', '/manifest.json', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([
    caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)),
    // Os módulos ficam em segundo plano: uma falha isolada não impede a instalação
    caches.open(RUNTIME).then((cache) => Promise.allSettled(BUILD_ASSETS.map((a) => cache.add(a)))),
  ]));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== SHELL && n !== RUNTIME).map((n) => caches.delete(n))
    ))
  );
  self.clients.claim();
});

const putInCache = async (cacheName, request, response) => {
  if (response && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname.endsWith('supabase.co')) return;
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;

  // Navegação: rede primeiro; offline, a página inicial (index.html) ou o aplicativo (app.html)
  if (request.mode === 'navigate') {
    const page = url.pathname === '/' ? '/index.html' : '/app.html';
    event.respondWith(
      fetch(request)
        .then((res) => putInCache(SHELL, page, res))
        .catch(async () => (await caches.match(page)) || (await caches.match('/index.html')))
    );
    return;
  }

  // Arquivos versionados do build
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => putInCache(RUNTIME, request, res)))
    );
    return;
  }

  // Fontes e folhas de estilo do Google: cache e atualização em segundo plano
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((hit) => {
        const network = fetch(request).then((res) => putInCache(RUNTIME, request, res)).catch(() => hit);
        return hit || network;
      })
    );
    return;
  }

  // Demais arquivos do próprio site: rede primeiro, cache como reserva
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((res) => putInCache(RUNTIME, request, res))
        .catch(() => caches.match(request))
    );
  }
});
