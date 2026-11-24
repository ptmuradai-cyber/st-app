(function () {
  "use strict";
  const root = new URL("./", document.currentScript.src);
  const sw = navigator.serviceWorker;
  let options, registration, running = false, locked = false, lockTimer, reloadExpected = null;
  let message = "オフライン準備中", reason = "", remoteVersion = "";
  function busy() {
    try { return !!options.isBusy(); } catch { return true; }
  }
  function status(text, error = "") {
    message = text; reason = error;
    const label = document.getElementById(options.statusId);
    if (label) label.textContent = text;
  }
  function rpc(worker, type, timeout = 12000) {
    return new Promise((resolve, reject) => {
      if (!worker) return reject(new Error("Service Workerがありません"));
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); reject(new Error("応答がありません。別のST画面を閉じて再確認してください")); }, timeout);
      channel.port1.onmessage = event => {
        clearTimeout(timer); channel.port1.close();
        event.data?.error ? reject(new Error(event.data.error)) : resolve(event.data);
      };
      worker.postMessage({type}, [channel.port2]);
    });
  }
  function unlock() {
    clearTimeout(lockTimer); locked = false;
    document.getElementById("st-update-lock")?.remove();
  }
  function lock() {
    locked = true;
    const overlay = document.createElement("div");
    overlay.id = "st-update-lock"; overlay.setAttribute("role", "status");
    overlay.textContent = "更新切り替え中です。しばらくお待ちください。";
    Object.assign(overlay.style, {position:"fixed", inset:"0", zIndex:"2147483647", background:"rgba(255,255,255,.95)", display:"grid", placeItems:"center", padding:"24px"});
    document.body.appendChild(overlay);
    lockTimer = setTimeout(unlock, 60000);
  }
  function waitInstalling(worker) {
    if (!worker || worker.state === "installed" || worker.state === "activated") return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => done(new Error("新版の取得が時間内に完了しませんでした")), 90000);
      function done(error) { clearTimeout(timer); worker.removeEventListener("statechange", check); error ? reject(error) : resolve(); }
      function check() {
        if (worker.state === "installed" || worker.state === "activated") done();
        else if (worker.state === "redundant") done(new Error("新版の取得・検証・保存に失敗しました。通信と空き容量を確認してください"));
      }
      worker.addEventListener("statechange", check); check();
    });
  }
  function watch(reg) {
    reg.addEventListener("updatefound", () => {
      const worker = reg.installing;
      waitInstalling(worker).then(() => {
        if (!running && reg.waiting) status("更新待機中");
      }).catch(error => status("更新失敗・旧版を継続", error.message));
    });
  }
  async function actual() {
    const active = await rpc(sw.controller || registration.active, "ST_STATUS");
    const expected = window.ST_SUITE_VERSION?.version;
    if (!active.ready) throw new Error("オフライン用ファイルの完了を確認できません");
    if (active.release.version !== expected) {
      status("更新待機中", "表示中の版とService Workerの版が異なります。入力を保存してから最新版を確認してください");
      return false;
    }
    const moduleVersion = window.ST_PICTURE_VERSION?.version || window.CATR_APP_VERSION?.version || window.ST_APP_VERSION?.version;
    const expectedModule = window.ST_PICTURE_VERSION ? active.release.modules?.picture : window.CATR_APP_VERSION ? active.release.modules?.catr : active.release.modules?.attention;
    if (moduleVersion && moduleVersion !== expectedModule) {
      status("更新待機中", "表示中の課題とアプリ本体の版が一致しません");
      return false;
    }
    return true;
  }
  async function refresh() {
    if (running) return;
    if (busy()) { status("更新延期・入力／訓練を継続"); return; }
    running = true;
    const button = document.getElementById(options.buttonId); button.disabled = true;
    try {
      status("最新版確認中");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      let response;
      try { response = await fetch(new URL("release.json?stUpdateCheck=" + Date.now(), root), {cache:"no-store", signal:controller.signal}); }
      finally { clearTimeout(timer); }
      if (!response.ok) throw new Error("公開版情報の取得に失敗しました: HTTP " + response.status);
      const release = await response.json();
      if (typeof release.version !== "string" || typeof release.build !== "string") throw new Error("公開版情報が不正です");
      remoteVersion = release.version;
      await registration.update();
      await waitInstalling(registration.installing);
      if (busy()) { status("更新延期・入力／訓練を継続"); return; }
      if (registration.waiting) {
        const candidate = await rpc(registration.waiting, "ST_STATUS");
        if (!candidate.ready || candidate.build !== release.build || candidate.release.version !== release.version) throw new Error("新版のバージョンが一致しません");
        if (busy()) { status("更新延期・入力／訓練を継続"); return; }
        reloadExpected = release.version;
        const result = await rpc(registration.waiting, "ST_ACTIVATE", 20000);
        if (result.deferred) { reloadExpected = null; status("更新延期・別のST画面を確認", "入力中・訓練中、または更新確認に対応しない旧画面があります"); return; }
        status("更新切り替え中");
        return;
      }
      const active = await rpc(sw.controller || registration.active, "ST_STATUS");
      if (active.build !== release.build) throw new Error("公開版と動作中の版が一致しません。再確認してください");
      if (window.ST_SUITE_VERSION?.version !== release.version) {
        if (busy()) { status("更新延期・入力／訓練を継続"); return; }
        location.reload(); return;
      }
      if (await actual()) status("更新完了・版を確認済み");
    } catch (error) {
      reloadExpected = null; unlock();
      status("更新失敗・旧版を継続", error.message);
    } finally { running = false; button.disabled = false; }
  }
  async function diagnostics() {
    let active = null, waiting = null;
    try {
      active = await rpc(sw?.controller || registration?.active, "ST_STATUS", 3000);
      if (registration?.waiting) waiting = await rpc(registration.waiting, "ST_STATUS", 3000);
    } catch (error) { reason = reason || error.message; }
    const report = {
      appVersion: window.ST_SUITE_VERSION?.version || "不明",
      moduleVersion: window.ST_PICTURE_VERSION?.version || window.CATR_APP_VERSION?.version || window.ST_APP_VERSION?.version || null,
      scope: registration?.scope ? new URL(registration.scope).pathname : null,
      controllerState: sw?.controller?.state || "なし",
      controllerScript: sw?.controller ? new URL(sw.controller.scriptURL).pathname : null,
      legacyModuleScopes: sw ? (await sw.getRegistrations()).filter(r => r.scope.startsWith(root.href) && r.scope !== root.href).map(r => new URL(r.scope).pathname) : [],
      activeBuild: active?.build || "旧版または応答なし",
      activeVersion: active?.release?.version || null,
      waiting: !!registration?.waiting,
      waitingBuild: waiting?.build || null,
      offlineReady: active?.ready === true,
      online: navigator.onLine,
      displayMode: matchMedia("(display-mode: standalone)").matches || navigator.standalone ? "ホーム画面" : "ブラウザ",
      latestCheckedVersion: remoteVersion || null,
      status: message,
      failureReason: reason || null
    };
    const dialog = document.createElement("dialog");
    const title = document.createElement("h2"); title.textContent = "更新診断";
    const pre = document.createElement("pre"); pre.textContent = JSON.stringify(report, null, 2);
    pre.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px";
    const close = document.createElement("button"); close.textContent = "閉じる"; close.onclick = () => { dialog.close(); dialog.remove(); };
    dialog.append(title, pre, close); document.body.appendChild(dialog); dialog.showModal();
  }
  async function start(config) {
    options = config;
    const button = document.getElementById(config.buttonId);
    button.addEventListener("click", refresh);
    const diagnostic = document.createElement("button");
    diagnostic.type = "button"; diagnostic.textContent = "更新診断"; diagnostic.className = button.className;
    diagnostic.addEventListener("click", diagnostics); button.after(diagnostic);
    // Capture blocks keyboard actions too while every open ST client is checked.
    for (const eventName of ["click", "keydown", "input", "submit", "pointerdown", "touchstart"]) {
      document.addEventListener(eventName, event => { if (locked) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
    }
    if (!sw || !isSecureContext || location.protocol === "file:") { status("HTTPS接続が必要"); return; }
    sw.addEventListener("message", event => {
      if (event.source?.scriptURL !== new URL("sw.js", root).href) return;
      if (event.data?.type === "ST_PREPARE_UPDATE") {
        const ready = !busy();
        if (ready && !locked) lock();
        event.ports[0]?.postMessage({ready});
      }
      if (event.data?.type === "ST_RELEASE_UPDATE") unlock();
    });
    sw.addEventListener("controllerchange", async () => {
      unlock();
      // Other tabs are never reloaded automatically.
      if (!reloadExpected || busy()) { status("更新待機中"); return; }
      try {
        const active = await rpc(sw.controller, "ST_STATUS");
        if (!active.ready || active.release.version !== reloadExpected) throw new Error("切り替え後の版を確認できません");
        reloadExpected = null;
        if (busy()) { status("更新延期・入力／訓練を継続"); return; }
        location.reload();
      } catch (error) { status("更新失敗・旧画面を維持", error.message); }
    });
    try {
      registration = await sw.register(new URL("sw.js", root), {scope:root.href, updateViaCache:"none"});
      if (registration.scope !== root.href) throw new Error("STアプリの登録範囲が一致しません");
      watch(registration);
      if (sw.controller && sw.controller.scriptURL !== new URL("sw.js", root).href) throw new Error("課題専用または別のService Workerが制御中です。削除せず移行を中止してください");
      if (registration.waiting) status("更新待機中");
      else if (sw.controller && await actual()) status("オフライン準備済み・版確認済み");
      else status("初回準備中・完了後に開き直してください");
    } catch (error) { status("更新状態を確認できません", error.message); }
  }
  window.StPwaUpdates = {start};
})();
