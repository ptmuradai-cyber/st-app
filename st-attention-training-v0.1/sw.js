importScripts("./version.js");

const VERSION_INFO = self.ST_APP_VERSION || {
  version: "0.1.0-dev",
};
const SERVICE_WORKER_BUILD = "storage-update-20261012-1";
const CACHE_NAME = `st-attention-training-${VERSION_INFO.version}-${SERVICE_WORKER_BUILD}`;
const ASSETS = [
  "./",
  "./index.html",
  "./version.js",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
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
          .filter((key) => key.startsWith("st-attention-training-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (!event.data) {
    return;
  }

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
  if (event.request.method !== "GET" || !isSameOrigin(event.request.url)) {
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function refreshCache() {
  const tempCacheName = `${CACHE_NAME}-pending-${Date.now()}`;
  const tempCache = await caches.open(tempCacheName);
  const cacheKeys = [];

  try {
    for (const asset of ASSETS) {
      const url = new URL(asset, self.location.href).toString();
      const response = await fetchWithTimeout(url, { cache: "reload" });
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
  if (cached) {
    return cached;
  }

  try {
    const response = await fetchWithTimeout(request);
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

function fetchWithTimeout(resource, options = {}, timeoutMs = 8000) {
  if (typeof AbortController === "undefined") {
    return fetch(resource, options);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(resource, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}
