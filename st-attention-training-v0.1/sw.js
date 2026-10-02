importScripts("./version.js");

const VERSION_INFO = self.ST_APP_VERSION || {
  version: "0.1.0-dev",
};
const SERVICE_WORKER_BUILD = "card-preview-20261002-1";
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
  self.skipWaiting();
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
      refreshCache().then(() => {
        if (event.source) {
          event.source.postMessage({
            type: "CACHE_REFRESHED",
            version: VERSION_INFO.version,
          });
        }
      }),
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
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    ASSETS.map(async (asset) => {
      const url = new URL(asset, self.location.href).toString();
      const response = await fetchWithTimeout(url, { cache: "reload" });
      if (isCacheable(response)) {
        await cache.put(getCacheKey(url), response.clone());
      }
    }),
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = getCacheKey(request.url);
  const cached = await caches.match(request) || await caches.match(cacheKey);
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
      return caches.match(getCacheKey("./index.html"));
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
