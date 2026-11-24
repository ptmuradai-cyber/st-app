"use strict";
const SERVICE_WORKER_BUILD = "restored-762-catr-records-130-1";
const CACHE_PREFIX = "st-app-restored-";
const CACHE_NAME = CACHE_PREFIX + SERVICE_WORKER_BUILD;
const COMPLETE = new URL("./__st_cache_complete__", self.location.href).href;
const ROOT = new URL("./", self.location.href);
const ASSETS = ["./workspace.css", "./workspace.js", "./clinical-ui.css", "./picture-card-training/bundled.js", "./picture-card-training/backup.js", "./picture-card-training/backup-ui.js", "./picture-card-training/", "./picture-card-training/index.html", "./picture-card-training/style.css", "./picture-card-training/version.js", "./picture-card-training/pack.js", "./picture-card-training/store.js", "./picture-card-training/session.js", "./picture-card-training/app.js", "./", "./index.html", "./version.js", "./styles.css", "./app.js", "./pwa-update.js", "./update-migration.html", "./update-migration.js", "./migration-route.js", "./manifest.webmanifest", "./icon.svg", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./st-attention-training-v0.1/", "./st-attention-training-v0.1/index.html", "./st-attention-training-v0.1/version.js", "./st-attention-training-v0.1/styles.css", "./st-attention-training-v0.1/app.js", "./st-attention-training-v0.1/manifest.webmanifest", "./st-attention-training-v0.1/icon.svg", "./cat-r-input-app-v0.1/", "./cat-r-input-app-v0.1/index.html", "./cat-r-input-app-v0.1/version.js", "./cat-r-input-app-v0.1/styles.css", "./cat-r-input-app-v0.1/app.js", "./cat-r-input-app-v0.1/manifest.json", "./cat-r-input-app-v0.1/icon.svg", "./picture-card-training/bundled/st-candidate-762.zip"];
self.addEventListener("install", event => event.waitUntil(installRelease()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
// Completed releases and legacy caches are retained; no user data is touched.
async function installRelease() {
  if (await completeCache(CACHE_NAME)) return;
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetchTimed(new URL("release.json", ROOT));
    if (!response.ok) throw new Error("release manifest HTTP " + response.status);
    const release = await response.json();
    if (release.build !== SERVICE_WORKER_BUILD) throw new Error("release build mismatch");
    for (const asset of ASSETS) {
      const url = new URL(asset, ROOT);
      const expected = release.files[asset];
      if (!expected) throw new Error("missing integrity: " + asset);
      const response = await fetchTimed(url);
      if (!response.ok || response.type === "opaque") throw new Error("asset HTTP " + response.status + ": " + asset);
      const bytes = await response.clone().arrayBuffer();
      const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), b => b.toString(16).padStart(2, "0")).join("");
      if (digest !== expected) throw new Error("integrity mismatch: " + asset);
      await cache.put(url.href, response);
    }
    await cache.put(COMPLETE, new Response(JSON.stringify({build: SERVICE_WORKER_BUILD, version: release.version, modules: release.modules})));
  } catch (error) {
    // Only this incomplete candidate is removed. All previous releases remain.
    await caches.delete(CACHE_NAME);
    throw error;
  }
}
async function completeCache(name) {
  const cache = await caches.open(name);
  const marker = await cache.match(COMPLETE);
  if (!marker) return null;
  try { return await marker.json(); } catch { return null; }
}
function ownedClient(client) {
  return client && new URL(client.url).origin === ROOT.origin && new URL(client.url).pathname.startsWith(ROOT.pathname);
}
async function clientsReady() {
  const clients = (await self.clients.matchAll({type: "window", includeUncontrolled: true})).filter(ownedClient);
  const token = crypto.randomUUID();
  const results = await Promise.all(clients.map(async client => {
    const channel = new MessageChannel();
    const ready = await new Promise(resolve => {
      const timer = setTimeout(() => resolve(false), 2500);
      channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data?.ready === true); };
      client.postMessage({type: "ST_PREPARE_UPDATE", token}, [channel.port2]);
    });
    return {client, ready};
  }));
  if (results.some(result => !result.ready)) {
    for (const {client, ready} of results) if (ready) client.postMessage({type: "ST_RELEASE_UPDATE", token});
    return false;
  }
  return true;
}
self.addEventListener("message", event => {
  const reply = data => { if (event.ports[0]) event.ports[0].postMessage(data); };
  event.waitUntil((async () => {
    if (!ownedClient(event.source)) return reply({error: "outside ST scope"});
    if (event.data?.type === "ST_STATUS") {
      const current = await completeCache(CACHE_NAME);
      return reply({build: SERVICE_WORKER_BUILD, ready: !!current, release: current, scope: ROOT.href});
    }
    if (event.data?.type === "ST_ACTIVATE") {
      if (!await completeCache(CACHE_NAME)) return reply({error: "candidate incomplete"});
      if (!await clientsReady()) return reply({deferred: true});
      reply({activating: true});
      await self.skipWaiting();
    }
    // Legacy REFRESH_CACHE requests must never overwrite a running release.
    if (event.data?.type === "REFRESH_CACHE") reply({type: "CACHE_REFRESH_FAILED", error: "更新画面を閉じてSTメニューから再確認してください"});
  })());
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  if (url.pathname.endsWith("/release.json") || url.pathname.endsWith("/sw.js") || url.searchParams.has("stUpdateCheck")) return;
  const key = new URL(url); key.search = ""; key.hash = "";
  if (!ASSETS.some(asset => new URL(asset, ROOT).href === key.href)) return;
  event.respondWith((async () => {
    let name = CACHE_NAME;
    if (!await completeCache(name)) {
      // Recover only a fully marked previous ST release; never mix asset sets.
      const names = (await caches.keys()).filter(n => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME).reverse();
      name = null;
      for (const candidate of names) {
        if (await completeCache(candidate)) { name = candidate; break; }
      }

    }
    if (!name) return new Response("オフライン版を準備できません。オンラインで更新を確認してください。", {status: 503});
    const cache = await caches.open(name);
    return await cache.match(key.href) || new Response("この版にファイルがありません。STメニューから更新してください。", {status: 503});
  })());
});
async function fetchTimed(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try { return await fetch(url, {cache: "no-store", signal: controller.signal}); }
  finally { clearTimeout(timer); }
}
