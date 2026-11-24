(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("app-version").textContent = window.ST_SUITE_VERSION.label;
    window.StPwaUpdates.start({ buttonId: "update-app-button", statusId: "offline-status", isBusy: () => false });
  });
})();
