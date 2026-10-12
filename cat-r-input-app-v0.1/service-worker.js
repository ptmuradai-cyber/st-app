importScripts("./version.js");

const VERSION_INFO = self.CATR_APP_VERSION || {
  version: "0.1.0-local-dev",
};
const CACHE_PREFIX = "catr-input-";
const SERVICE_WORKER_BUILD = "storage-update-20261012-1";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION_INFO.version}-${SERVICE_WORKER_BUILD}`;
const APP_FILES = [
  "./",
  "./index.html",
  "./version.js",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(refreshCache());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data.type === "REFRESH_CACHE") {
    event.waitUntil(
      refreshCache()
        .then(() => reply(event, {
          type: "CACHE_REFRESHED",
          version: VERSION_INFO.version,
        }))
        .catch((error) => reply(event, {
          type: "CACHE_REFRESH_FAILED",
          error: error && error.message ? error.message : "refresh failed",
        })),
    );
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !isSameOrigin(event.request.url)) return;
  const url = new URL(event.request.url);
  if (url.searchParams.has("catrUpdateCheck")) return;
  event.respondWith(cacheFirst(event.request));
});

async function refreshCache() {
  const tempCacheName = `${CACHE_NAME}-pending-${Date.now()}`;
  const tempCache = await caches.open(tempCacheName);
  const cacheKeys = [];

  try {
    for (const asset of APP_FILES) {
      const url = new URL(asset, self.location.href).toString();
      const response = await fetch(url, { cache: "reload" });
      if (!isCacheable(response)) {
        throw new Error(`cache failed: ${asset}`);
      }
      const key = getCacheKey(url);
      cacheKeys.push(key);
      await tempCache.put(key, response.clone());
    }

    await caches.delete(CACHE_NAME);
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(cacheKeys.map(async (key) => {
      const cached = await tempCache.match(key);
      if (!cached) {
        throw new Error(`cache copy failed: ${key}`);
      }
      await cache.put(key, cached);
    }));
  } finally {
    await caches.delete(tempCacheName);
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = getCacheKey(request.url);
  const cached = await cache.match(request) || await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (error) {
    if (request.mode === "navigate") {
      return cache.match(getCacheKey("./index.html"));
    }
    throw error;
  }
}

function getCacheKey(value) {
  const url = new URL(value, self.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function isSameOrigin(value) {
  return new URL(value, self.location.href).origin === self.location.origin;
}

function isCacheable(response) {
  return response && response.ok && response.type !== "opaque";
}

function reply(event, message) {
  if (event.ports && event.ports[0]) {
    event.ports[0].postMessage(message);
    return;
  }
  if (event.source) {
    event.source.postMessage(message);
  }
}
