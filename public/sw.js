/* PRAETORIA gestor de seguros — service worker.
 * Solo gestiona notificaciones push y una página sin conexión. NO guarda en caché pólizas, documentos
 * ni datos personales: cada pantalla se pide siempre al servidor. */
const VERSION = 'v1';
const CACHE = `praetoria-offline-${VERSION}`;
const OFFLINE = '/offline';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, '/marca/logo.svg'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Solo las navegaciones: si no hay red, se muestra la página sin conexión. El resto va directo a la red.
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)));
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const titulo = d.title || 'PRAETORIA';
  e.waitUntil(self.registration.showNotification(titulo, {
    body: d.body || 'Tienes un aviso nuevo.',
    icon: '/iconos/icono-192.png',
    badge: '/iconos/insignia-96.png',
    tag: d.tag || 'praetoria',
    data: { url: d.url || '/avisos' },
    lang: 'es',
  }));
});

// Al pulsar la notificación se abre (o enfoca) la aplicación en el aviso. Si la sesión caducó,
// la aplicación pide entrar y vuelve después a ese destino.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/avisos', self.location.origin).href;
  e.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const v of ventanas) {
      if (new URL(v.url).origin === self.location.origin && 'focus' in v) {
        await v.focus();
        if ('navigate' in v) return v.navigate(url);
        return;
      }
    }
    return self.clients.openWindow(url);
  })());
});

self.addEventListener('pushsubscriptionchange', (e) => {
  // El navegador renovó la suscripción: la próxima visita a «Avisos en este móvil» la registra de nuevo.
  e.waitUntil(Promise.resolve());
});
