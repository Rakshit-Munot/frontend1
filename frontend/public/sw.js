const CACHE_NAME = "app-cache-v1";
const STATIC_PATTERNS = [
  /\/_next\/static\//,
  /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/,
];
const API_PATTERNS = [
  /\/api\/handouts\b/,
  /\/api\/bills\b/,
  /\/api\/labs\b/,
  /\/api\/(categories|subcategories|items)\b/,
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only handle GET
  if (req.method !== "GET") return;

  const isStatic = STATIC_PATTERNS.some((re) => re.test(url.pathname));
  const isApi = API_PATTERNS.some((re) => re.test(url.pathname));

  if (isStatic) {
    // Cache-first for static assets
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  if (isApi) {
    // Network-first for API responses, fallback to cache
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const res = await fetch(req);
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        } catch (e) {
          const cached = await cache.match(req);
          if (cached) return cached;
          throw e;
        }
      })()
    );
    return;
  }
});
