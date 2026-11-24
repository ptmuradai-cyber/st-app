(function () {
  "use strict";
  const root = new URL("./", document.currentScript.src);
  const key = "st-app-migration-route-v1";
  function mode() {
    return navigator.standalone || matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser";
  }
  function busy() {
    if (["training-screen", "grid-training-screen", "tmt-training-screen", "result-screen", "grid-result-screen", "tmt-result-screen"].some(id => document.getElementById(id)?.classList.contains("is-active"))) return true;
    const patient = document.getElementById("patientId");
    if (patient && !patient.disabled) {
      const inputs = [patient, document.getElementById("patientAge"), ...document.querySelectorAll("[data-field-input], [data-source-input]")];
      if (inputs.some(input => input && input.value !== "")) return true;
      const date=document.getElementById("testDate");
      if(date?.value && date.value!==new Date().toISOString().slice(0,10)) return true;
    }
    return false;
  }
  if (root.origin !== location.origin || !location.pathname.startsWith(root.pathname)) throw Error("STアプリと同じ起動環境を選んでください");
  if (document.getElementById("st-migration-route-panel")) return;
  const panel = document.createElement("aside");
  panel.id = "st-migration-route-panel";
  panel.style.cssText = "position:fixed;bottom:12px;left:12px;right:12px;z-index:2147483647;padding:16px;background:white;border:2px solid #0f766e;border-radius:6px;color:#182230;font:16px system-ui";
  const text = document.createElement("p");
  text.textContent = mode() === "standalone" ? "ホーム画面アプリ内の移行入口です。保存・バックアップ後に進んでください。" : "Safari／ブラウザ内の確認です。別のホーム画面アプリの更新は証明できません。";
  const status = document.createElement("p"); status.setAttribute("role", "status");
  const button = document.createElement("button"); button.textContent = "移行入口へ";
  const close = document.createElement("button"); close.textContent = "閉じる"; close.onclick = () => panel.remove();
  button.onclick = () => {
    if (busy()) { status.textContent = "移行停止：未保存入力・訓練中・結果確認中です。保存とバックアップを確認してください。"; return; }
    if (!confirm("入力を保存し、履歴のバックアップを確認しましたか。移行入口へ進みます。")) return;
    try {
      sessionStorage.setItem(key, JSON.stringify({root:root.href, sourceMode:mode(), createdAt:Date.now(), nonce:crypto.randomUUID()}));
      location.assign(new URL("update-migration.html", root));
    } catch { status.textContent = "移行停止：起動経路を保持できません。現在の画面を維持してください。"; }
  };
  panel.append(text, status, button, close); document.body.appendChild(panel);
})();
