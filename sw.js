// Service Worker para HazelTest (Modo Offline y Cache PWA v8)
const CACHE_NAME = 'hazeltest-cache-v8';

const STATIC_ASSETS = [
  '/',
  '/articulos/',
  '/articulos/estructura-del-buque-conocimientos-marineros.html',
  '/acerca-de.html',
  '/categorias.html',
  '/mapa-del-sitio.html',
  '/contacto.html',
  '/marina/test.html',
  '/marina/estudio/test-cultura-naval.html',
  '/marina/estudio/test-grados-jerarquias.html',
  '/marina/estudio/test-estructura-del-buque.html',
  '/marina/estudio/data/cultura-naval-banco.js',
  '/marina/estudio/data/cultura-naval-banco.json',
  '/marina/estudio/temario/progreso-estudio.html',
  '/marina/estudio/funcionarios/funcionarios-de-marina.html',
  '/marina/estudio/funcionarios/identifica-por-imagen-funcionarios.html',
  '/marina/estudio/funcionarios/contra-el-reloj-funcionarios.html',
  '/marina/estudio/funcionarios/elige-el-cargo.html',
  '/marina/estudio/funcionarios/ordena-los-apellidos-de-los-funcionarios.html',
  '/marina/estudio/funcionarios/ordena-el-nombre-y-apellidos-de-los-funcionarios.html',
  '/marina/estudio/funcionarios/ordena-los-cargos-de-los-funcionarios.html',
  '/social/test.html',
  '/social/test-de-personalidad.html',
  '/social/test-de-ansiedad.html',
  '/social/test-de-autoestima.html',
  '/social/test-de-estres-burnout.html',
  '/social/test-de-depresion.html',
  '/social/test-de-narcisismo.html',
  '/mi-estudio.html',
  '/privacidad.html',
  '/terminos-y-condiciones.html',
  '/hazeltest-og.webp',
  '/hazeltest.ico',
  '/hazeltest-theme.css',
  '/hazeltest-app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Tomar el control inmediatamente sin esperar a que cierren pestañas
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Precarga de caché parcial:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Destruir cualquier caché vieja (v1, v2, v3, etc.)
          if (key !== CACHE_NAME) {
            console.log('Purgando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Excluir dominios externos de terceros
  if (
    url.hostname.includes('google') ||
    url.hostname.includes('googlesyndication') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('cloudflare')
  ) {
    return;
  }

  const isHtmlRequest = event.request.mode === 'navigate' || 
                        (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  // ESTRATEGIA PARA PÁGINAS HTML: NETWORK FIRST SIEMPRE
  // Nunca servir HTML viejo si el usuario tiene conexión a internet
  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Si no hay red, servir de caché offline
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const home = await caches.match('/');
          if (home) return home;
          return new Response('Sin conexión a Internet', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // ESTRATEGIA PARA RECURSOS ESTÁTICOS (CSS, imágenes, JS): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {});

      return cachedResponse || fetchPromise;
    })
  );
});
