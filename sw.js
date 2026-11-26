"use strict";
const SERVICE_WORKER_BUILD = "update-safe-131-1";
const CACHE_PREFIX = "st-app-restored-";
const CACHE_NAME=CACHE_PREFIX+SERVICE_WORKER_BUILD;
const ROOT=new URL("./",self.location.href);
const COMPLETE=new URL("./__st_cache_complete__",ROOT).href;
const ASSETS = ["./workspace.css", "./workspace.js", "./clinical-ui.css", "./picture-card-training/bundled.js", "./picture-card-training/backup.js", "./picture-card-training/backup-ui.js", "./picture-card-training/", "./picture-card-training/index.html", "./picture-card-training/style.css", "./picture-card-training/version.js", "./picture-card-training/pack.js", "./picture-card-training/store.js", "./picture-card-training/session.js", "./picture-card-training/app.js", "./", "./index.html", "./version.js", "./styles.css", "./app.js", "./pwa-update.js", "./update-migration.html", "./update-migration.js", "./migration-route.js", "./manifest.webmanifest", "./icon.svg", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png", "./st-attention-training-v0.1/", "./st-attention-training-v0.1/index.html", "./st-attention-training-v0.1/version.js", "./st-attention-training-v0.1/styles.css", "./st-attention-training-v0.1/app.js", "./st-attention-training-v0.1/manifest.webmanifest", "./st-attention-training-v0.1/icon.svg", "./cat-r-input-app-v0.1/", "./cat-r-input-app-v0.1/index.html", "./cat-r-input-app-v0.1/version.js", "./cat-r-input-app-v0.1/styles.css", "./cat-r-input-app-v0.1/app.js", "./cat-r-input-app-v0.1/manifest.json", "./cat-r-input-app-v0.1/icon.svg", "./picture-card-training/bundled/st-candidate-762.zip"];
self.addEventListener('install', event => event.waitUntil(installRelease()));
// Legacy adoption never claims an already-open old clinical page. Explicit modern
// switching may claim only after every ST client has acknowledged and locked.
self.addEventListener('activate', event => event.waitUntil((async()=>{
 const meta=await readMeta('activation-'+SERVICE_WORKER_BUILD);
 if(meta?.claim===true){try{await self.clients.claim();}catch{await progress("restart-required",{reason:"新版は準備できました。入力を保存してアプリを終了し、開き直してください"});}}
})()));
const META_NAME='st-app-update-meta-v1';
async function readMeta(key){try{return await (await (await caches.open(META_NAME)).match(new URL('__update_'+key,ROOT))).json();}catch{return null;}}
async function writeMeta(key,data){await (await caches.open(META_NAME)).put(new URL('__update_'+key,ROOT).href,new Response(JSON.stringify(data)));}
function ownedClient(client){try{const u=new URL(client.url);return u.origin===ROOT.origin&&u.pathname.startsWith(ROOT.pathname);}catch{return false;}}
function homeClient(client){if(!ownedClient(client))return false;const u=new URL(client.url);return !u.search&&[ROOT.pathname,ROOT.pathname+'index.html'].includes(u.pathname);}
async function progress(stage,extra={}){
 const data={type:'ST_UPDATE_PROGRESS',build:SERVICE_WORKER_BUILD,stage,...extra};
 try{await writeMeta('latest',data);}catch{}
 for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true}))if(ownedClient(client))client.postMessage(data);
}
async function completeCache(name){const r=await (await caches.open(name)).match(COMPLETE);if(!r)return null;try{return await r.json();}catch{return null;}}
async function sha(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
async function fetchBytes(url,timeout){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),timeout);
 try{const r=await fetch(url,{cache:'no-store',signal:abort.signal});if(!r.ok||r.type==='opaque')throw Error('HTTP '+r.status);return {bytes:await r.arrayBuffer(),headers:r.headers,status:r.status};}
 finally{clearTimeout(timer);}
}
async function installRelease(){
 if(await completeCache(CACHE_NAME))return;
 const cache=await caches.open(CACHE_NAME);
 try{
  await progress('checking');
  const manifest=await fetchBytes(new URL('release.json',ROOT),20000);const release=JSON.parse(new TextDecoder().decode(manifest.bytes));
  if(release.build!==SERVICE_WORKER_BUILD)throw Error('公開版情報が一致しません。少し待って再確認してください');
  for(let i=0;i<ASSETS.length;i++){
   const asset=ASSETS[i],url=new URL(asset,ROOT),expected=release.files[asset];if(!expected)throw Error('検証情報がありません');
   const existing=await cache.match(url.href);
   if(existing&&await sha(await existing.arrayBuffer())===expected){await progress('downloading',{done:i+1,total:ASSETS.length,reused:true});continue;}
   let success=false,last;
   for(let attempt=1;attempt<=3;attempt++){
    try{
     await progress('downloading',{done:i,total:ASSETS.length,material:asset.endsWith('.zip'),attempt});
     const result=await fetchBytes(url,asset.endsWith('.zip')?180000:30000);
     await progress('verifying',{done:i,total:ASSETS.length});
     if(await sha(result.bytes)!==expected)throw Error('ファイルの版が一致しません');
     await cache.put(url.href,new Response(result.bytes,{status:result.status,headers:result.headers}));success=true;break;
    }catch(error){last=error;if(error.name==='QuotaExceededError'||/quota/i.test(error.message))throw error;if(attempt<3)await new Promise(r=>setTimeout(r,attempt*1000));}
   }
   if(!success)throw Error((asset.endsWith('.zip')?'教材':'アプリ')+'を取得できませんでした。Wi-Fi接続を確認して再試行してください（'+(last?.name==='AbortError'?'時間切れ':last?.message||'通信失敗')+'）');
  }
  await cache.put(COMPLETE,new Response(JSON.stringify({build:SERVICE_WORKER_BUILD,version:release.version,modules:release.modules})));
  await progress('ready',{version:release.version});
 }catch(error){
  const reason=error.name==='QuotaExceededError'||/quota/i.test(error.message)?'保存容量が不足しています。バックアップを確認し、端末管理者へ相談してください':error.message;
  await progress('failed',{reason});
  // Keep verified partial files for retry. No old or candidate cache is deleted.
  throw Error(reason);
 }
}
async function clientsReady(){
 const clients=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(ownedClient),token=crypto.randomUUID();
 const results=await Promise.all(clients.map(async client=>{
  const c=new MessageChannel();const ready=await new Promise(resolve=>{const t=setTimeout(()=>{c.port1.close();resolve(false);},2500);c.port1.onmessage=e=>{clearTimeout(t);c.port1.close();resolve(e.data?.ready===true);};client.postMessage({type:'ST_PREPARE_UPDATE',token},[c.port2]);});return {client,ready};
 }));
 if(results.some(r=>!r.ready)){for(const r of results)if(r.ready)r.client.postMessage({type:'ST_RELEASE_UPDATE',token});return false;}return true;
}
async function legacyHomesOnly(source){
 if(!homeClient(source))return false;
 const clients=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(ownedClient);
 return clients.length>0&&clients.every(homeClient);
}
self.addEventListener('message',event=>{
 const reply=data=>event.ports?.[0]?.postMessage(data);
 event.waitUntil((async()=>{
  if(!ownedClient(event.source))return reply({error:'outside ST scope'});
  if(event.data?.type==='ST_STATUS')return reply({build:SERVICE_WORKER_BUILD,ready:!!await completeCache(CACHE_NAME),release:await completeCache(CACHE_NAME),scope:ROOT.href,lastUpdate:await readMeta('latest')});
  if(event.data?.type==='SKIP_WAITING'){
   if(!await completeCache(CACHE_NAME)||!await legacyHomesOnly(event.source))return reply({deferred:true});
   await writeMeta('activation-'+SERVICE_WORKER_BUILD,{claim:false});
   // Adoption only: do not claim, reload or erase any running old page.
   await self.skipWaiting();return reply({prepared:true,restartRequired:true});
  }
  if(event.data?.type==='ST_ACTIVATE'){
   if(!await completeCache(CACHE_NAME))return reply({error:'candidate incomplete'});
   if(!await clientsReady())return reply({deferred:true});
   await writeMeta('activation-'+SERVICE_WORKER_BUILD,{claim:true});reply({activating:true});await self.skipWaiting();return;
  }
  if(event.data?.type==='REFRESH_CACHE'){
   if(await completeCache(CACHE_NAME)&&await legacyHomesOnly(event.source)&&!self.registration?.waiting)return reply({type:'CACHE_REFRESHED',version:(await completeCache(CACHE_NAME)).version});
   return reply({type:'CACHE_REFRESH_FAILED',error:'入力を保存し、他のST画面を閉じてから再確認してください'});
  }
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
 if(url.pathname.endsWith('/release.json')||url.pathname.endsWith('/sw.js')||url.searchParams.has('stUpdateCheck'))return;
 const key=new URL(url);key.search='';key.hash='';if(!ASSETS.some(a=>new URL(a,ROOT).href===key.href))return;
 event.respondWith((async()=>{
  let name=CACHE_NAME;
  if(!await completeCache(name)){name=null;for(const n of (await caches.keys()).filter(n=>n.startsWith(CACHE_PREFIX)&&n!==CACHE_NAME).reverse())if(await completeCache(n)){name=n;break;}}
  if(!name)return new Response('オフライン版の準備が未完了です。オンラインで最新版を確認してください。',{status:503});
  return await (await caches.open(name)).match(key.href)||new Response('この版のファイルを確認できません。最新版を確認してください。',{status:503});
 })());
});
