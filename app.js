(function () {
  "use strict";

  const VERSION_INFO = window.ST_SUITE_VERSION || {
    version: "1.0.0-local",
    label: "v1.0",
  };

  const MODULE_SCOPE_MARKERS = [
    "/st-attention-training-v0.1/",
    "/cat-r-input-app-v0.1/",
  ];

  const state = {
    updateReloading: false,
  };

  document.addEventListener("DOMContentLoaded", () => {
    const versionLabel = document.getElementById("app-version");
    const updateButton = document.getElementById("update-app-button");

    if (versionLabel) {
      versionLabel.textContent = VERSION_INFO.label;
    }
    if (updateButton) {
      updateButton.addEventListener("click", refreshOfflineApp);
    }

    setupServiceWorkerMessages();
    registerServiceWorker();
  });

  function getServiceWorkerApi() {
    return window.navigator && window.navigator.serviceWorker
      ? window.navigator.serviceWorker
      : null;
  }

  function updateOfflineStatus(message) {
    const label = document.getElementById("offline-status");
    if (!label) return;

    if (message) {
      label.textContent = message;
      return;
    }

    const serviceWorker = getServiceWorkerApi();
    if (window.location.protocol === "file:") {
      label.textContent = "ブラウザ確認中";
      return;
    }
    if (!window.isSecureContext) {
      label.textContent = "HTTPS接続が必要";
      return;
    }
    if (!serviceWorker) {
      label.textContent = "オフライン非対応";
      return;
    }
    label.textContent = serviceWorker.controller ? "オフライン準備済み" : "オフライン準備中";
  }

  function setupServiceWorkerMessages() {
    const serviceWorker = getServiceWorkerApi();
    if (!serviceWorker) return;

    serviceWorker.addEventListener("message", (event) => {
      if (!event.data || event.data.type !== "CACHE_REFRESHED") return;
      updateOfflineStatus("最新版準備完了");
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    });

    serviceWorker.addEventListener("controllerchange", () => {
      if (state.updateReloading) return;
      state.updateReloading = true;
      updateOfflineStatus("最新版準備完了");
      window.setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  }

  function registerServiceWorker() {
    const serviceWorker = getServiceWorkerApi();
    if (!serviceWorker || window.location.protocol === "file:" || !window.isSecureContext) {
      updateOfflineStatus();
      return;
    }

    serviceWorker.register("./sw.js")
      .then((registration) => {
        unregisterModuleServiceWorkers();
        watchRegistration(registration);
        return serviceWorker.ready;
      })
      .then(() => {
        updateOfflineStatus();
      })
      .catch(() => {
        updateOfflineStatus("準備できません");
      });
  }

  function watchRegistration(registration) {
    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;
      installingWorker.addEventListener("statechange", () => {
        if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
          updateOfflineStatus("更新あり");
        }
      });
    });
  }

  function unregisterModuleServiceWorkers() {
    const serviceWorker = getServiceWorkerApi();
    if (!serviceWorker || !serviceWorker.getRegistrations) return;

    serviceWorker.getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          const scopePath = new URL(registration.scope).pathname;
          if (MODULE_SCOPE_MARKERS.some((marker) => scopePath.includes(marker))) {
            registration.unregister();
          }
        });
      })
      .catch(() => {});
  }

  function refreshOfflineApp() {
    const serviceWorker = getServiceWorkerApi();
    const button = document.getElementById("update-app-button");
    if (!serviceWorker || window.location.protocol === "file:" || !window.isSecureContext) {
      updateOfflineStatus("HTTPS接続が必要");
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "確認中";
    }
    updateOfflineStatus("最新版確認中");

    const updatePromise = serviceWorker.register("./sw.js")
      .then((registration) => {
        unregisterModuleServiceWorkers();
        return registration.update().then(() => registration);
      })
      .then((registration) => {
        const worker = registration.waiting || registration.active || serviceWorker.controller;
        if (!worker) {
          updateOfflineStatus("準備完了");
          return null;
        }
        return sendRefreshMessage(worker);
      })
      .then((message) => {
        if (message && message.error) {
          throw new Error(message.error);
        }
        updateOfflineStatus("最新版準備完了");
        if (button) {
          button.textContent = "最新版";
        }
      })
      .catch(() => {
        updateOfflineStatus("確認できません");
      });

    withTimeout(updatePromise, 15000)
      .catch(() => {
        updateOfflineStatus("確認できません");
      })
      .finally(() => {
        window.setTimeout(() => {
          if (button) {
            button.disabled = false;
            button.textContent = "最新版を確認";
          }
        }, 900);
      });
  }

  function sendRefreshMessage(worker) {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      const timeoutId = window.setTimeout(() => resolve(null), 7000);
      channel.port1.onmessage = (event) => {
        window.clearTimeout(timeoutId);
        resolve(event.data);
      };
      worker.postMessage({ type: "REFRESH_CACHE" }, [channel.port2]);
    });
  }

  function withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("timeout")), timeoutMs);
      }),
    ]);
  }
})();
