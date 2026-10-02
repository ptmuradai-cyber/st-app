(function () {
  "use strict";

  const COLORS = {
    red: "赤",
    black: "黒",
  };

  const SHAPES = {
    circle: "丸",
    square: "四角",
    triangle: "三角",
  };

  const ENTRY_LABELS = {
    top: "上",
    right: "右",
    bottom: "下",
    left: "左",
  };

  const REGION_LABELS = {
    topLeft: "左上",
    topRight: "右上",
    bottomLeft: "左下",
    bottomRight: "右下",
  };

  const REGION_KEYS = ["topLeft", "topRight", "bottomLeft", "bottomRight"];

  const GRID_COLS = 7;
  const GRID_ROWS = 5;
  const GRID_TOTAL = GRID_COLS * GRID_ROWS;

  const GRID_MODE_LABELS = {
    active: "能動探索",
    passive: "受動探索",
    delete: "削除",
    color: "着色",
    reveal: "強調",
    sequence: "順序",
  };

  const TMT_TYPE_LABELS = {
    a: "TMT-A",
    b: "TMT-B",
  };

  const TMT_MODE_LABELS = {
    tap: "タップ",
    trace: "なぞり",
  };

  const TMT_KANA = ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "さ", "し", "す"];

  const OUTCOME_LABELS = {
    hit: "正反応",
    miss: "見逃し",
    false_alarm: "誤反応",
    correct_rejection: "正棄却",
  };

  const SPEED_PRESETS = {
    slow: {
      displayDurationSec: 2.8,
      minIntervalSec: 1.0,
      maxIntervalSec: 2.4,
    },
    normal: {
      displayDurationSec: 1.8,
      minIntervalSec: 0.7,
      maxIntervalSec: 1.8,
    },
    fast: {
      displayDurationSec: 1.0,
      minIntervalSec: 0.4,
      maxIntervalSec: 1.0,
    },
  };

  const BLINK_SPEEDS = {
    slow: {
      label: "ゆっくり",
      durationSec: 0.95,
    },
    normal: {
      label: "ふつう",
      durationSec: 0.62,
    },
    fast: {
      label: "速い",
      durationSec: 0.36,
    },
  };

  const STORAGE_KEY = "st-attention-training-v0.1-records";
  const GRID_STORAGE_KEY = "st-attention-grid-v2.0-records";
  const TMT_STORAGE_KEY = "st-attention-tmt-v2.1-records";
  const VERSION_INFO = window.ST_APP_VERSION || {
    version: "0.1.0-dev",
    label: "v0.1",
  };

  const state = {
    activeUserId: "",
    settings: null,
    running: false,
    trialNumber: 0,
    trialPlan: [],
    results: [],
    current: null,
    currentRecord: null,
    sessionSaved: false,
    nextTimer: null,
    animationFrame: null,
    updateReloading: false,
    grid: {
      running: false,
      settings: null,
      cells: [],
      selectedIds: new Set(),
      sequence: [],
      promptIndex: 0,
      currentPrompt: null,
      promptTimer: null,
      startAt: null,
      lastActionAt: null,
      results: [],
      currentRecord: null,
      sessionSaved: false,
    },
    tmt: {
      running: false,
      settings: null,
      items: [],
      expectedIndex: 0,
      startAt: null,
      lastStepAt: null,
      results: [],
      completedPoints: [],
      tracePoints: [],
      traceActive: false,
      lastWrongId: null,
      currentRecord: null,
      sessionSaved: false,
    },
  };

  const $ = (selector) => document.querySelector(selector);

  const homeScreen = $("#home-screen");
  const setupScreen = $("#setup-screen");
  const trainingScreen = $("#training-screen");
  const resultScreen = $("#result-screen");
  const gridSetupScreen = $("#grid-setup-screen");
  const gridTrainingScreen = $("#grid-training-screen");
  const gridResultScreen = $("#grid-result-screen");
  const tmtSetupScreen = $("#tmt-setup-screen");
  const tmtTrainingScreen = $("#tmt-training-screen");
  const tmtResultScreen = $("#tmt-result-screen");
  const settingsForm = $("#settings-form");
  const openMotionTaskButton = $("#open-motion-task");
  const openGridTaskButton = $("#open-grid-task");
  const openTmtTaskButton = $("#open-tmt-task");
  const motionHomeButton = $("#motion-home-button");
  const stage = $("#stage");
  const stimulusLayer = $("#stimulus-layer");
  const feedback = $("#feedback");
  const trialProgress = $("#trial-progress");
  const liveScore = $("#live-score");
  const responseButton = $("#response-button");
  const stopButton = $("#stop-button");
  const retryButton = $("#retry-button");
  const backSettingsButton = $("#back-settings-button");
  const resultHomeButton = $("#result-home-button");
  const resultPdfButton = $("#result-pdf-button");
  const downloadCsvButton = $("#download-csv-button");
  const appVersionLabel = $("#app-version");
  const offlineStatusLabel = $("#offline-status");
  const updateAppButton = $("#update-app-button");
  const targetPreviewMark = $("#target-preview-mark");
  const userIdInput = $("#user-id");
  const loginButton = $("#login-button");
  const activeUserLabel = $("#active-user");
  const targetCountRange = $("#target-count-range");
  const targetCountInput = $("#target-count");
  const targetCountTotal = $("#target-count-total");
  const simultaneousCountRange = $("#simultaneous-count-range");
  const simultaneousCountInput = $("#simultaneous-count");
  const simultaneousTargetCountRange = $("#simultaneous-target-count-range");
  const simultaneousTargetCountInput = $("#simultaneous-target-count");
  const simultaneousTargetTotal = $("#simultaneous-target-total");
  const trialCountInput = $("#trial-count");
  const trainingDateInput = $("#training-date");
  const trainingTimeInput = $("#training-time");
  const setCurrentTimeButton = $("#set-current-time-button");
  const setupHistoryContext = $("#setup-history-context");
  const setupLastSummary = $("#setup-last-summary");
  const setupHistoryResults = $("#setup-history-results");
  const resultContext = $("#result-context");
  const comparisonResults = $("#comparison-results");
  const historyResults = $("#history-results");
  const gridSettingsForm = $("#grid-settings-form");
  const gridUserIdInput = $("#grid-user-id");
  const gridLoginButton = $("#grid-login-button");
  const gridActiveUserLabel = $("#grid-active-user");
  const gridTrainingDateInput = $("#grid-training-date");
  const gridTrainingTimeInput = $("#grid-training-time");
  const gridSetCurrentTimeButton = $("#grid-set-current-time-button");
  const gridBoard = $("#grid-board");
  const gridProgress = $("#grid-progress");
  const gridLiveScore = $("#grid-live-score");
  const gridFeedback = $("#grid-feedback");
  const gridStopButton = $("#grid-stop-button");
  const gridRetryButton = $("#grid-retry-button");
  const gridBackSettingsButton = $("#grid-back-settings-button");
  const gridHomeButton = $("#grid-home-button");
  const gridResultHomeButton = $("#grid-result-home-button");
  const gridResultPdfButton = $("#grid-result-pdf-button");
  const gridResultContext = $("#grid-result-context");
  const gridSummaryGrid = $("#grid-summary-grid");
  const gridGuidance = $("#grid-guidance");
  const gridResultMap = $("#grid-result-map");
  const gridTrialLog = $("#grid-trial-log");
  const gridDownloadCsvButton = $("#grid-download-csv-button");
  const tmtSettingsForm = $("#tmt-settings-form");
  const tmtUserIdInput = $("#tmt-user-id");
  const tmtLoginButton = $("#tmt-login-button");
  const tmtActiveUserLabel = $("#tmt-active-user");
  const tmtTrainingDateInput = $("#tmt-training-date");
  const tmtTrainingTimeInput = $("#tmt-training-time");
  const tmtSetCurrentTimeButton = $("#tmt-set-current-time-button");
  const tmtHomeButton = $("#tmt-home-button");
  const tmtBoard = $("#tmt-board");
  const tmtConnectorLine = $("#tmt-connector-line");
  const tmtTraceLine = $("#tmt-trace-line");
  const tmtProgress = $("#tmt-progress");
  const tmtNextTarget = $("#tmt-next-target");
  const tmtLiveScore = $("#tmt-live-score");
  const tmtFeedback = $("#tmt-feedback");
  const tmtStopButton = $("#tmt-stop-button");
  const tmtRetryButton = $("#tmt-retry-button");
  const tmtBackSettingsButton = $("#tmt-back-settings-button");
  const tmtResultHomeButton = $("#tmt-result-home-button");
  const tmtResultPdfButton = $("#tmt-result-pdf-button");
  const tmtResultContext = $("#tmt-result-context");
  const tmtSummaryGrid = $("#tmt-summary-grid");
  const tmtGuidance = $("#tmt-guidance");
  const tmtResultMap = $("#tmt-result-map");
  const tmtTrialLog = $("#tmt-trial-log");
  const tmtDownloadCsvButton = $("#tmt-download-csv-button");

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    restoreActiveUser();
    setTrainingDateTimeToNow();
    setGridTrainingDateTimeToNow();
    setTmtTrainingDateTimeToNow();
    connectRangeAndNumber("grid-dot-size-range", "grid-dot-size");
    connectRangeAndNumber("grid-blink-sec-range", "grid-blink-sec");
    connectRangeAndNumber("grid-timeout-range", "grid-timeout");
    connectRangeAndNumber("tmt-node-size-range", "tmt-node-size");
    connectRangeAndNumber("stimulus-size-range", "stimulus-size");
    connectRangeAndNumber("display-duration-range", "display-duration", selectCustomSpeed);
    connectRangeAndNumber("simultaneous-count-range", "simultaneous-count", syncSimultaneousTargetBounds);
    connectRangeAndNumber("simultaneous-target-count-range", "simultaneous-target-count", syncSimultaneousTargetBounds);
    openMotionTaskButton.addEventListener("click", openMotionSetup);
    openGridTaskButton.addEventListener("click", openGridSetup);
    openTmtTaskButton.addEventListener("click", openTmtSetup);
    motionHomeButton.addEventListener("click", () => {
      finishCleanup();
      showScreen(homeScreen);
    });
    document.querySelectorAll('input[name="speedPreset"]').forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked && SPEED_PRESETS[input.value]) {
          applySpeedPreset(input.value);
        }
      });
    });
    ["min-interval", "max-interval"].forEach((id) => {
      document.getElementById(id).addEventListener("input", selectCustomSpeed);
    });
    loginButton.addEventListener("click", applyLogin);
    setCurrentTimeButton.addEventListener("click", setTrainingDateTimeToNow);
    gridLoginButton.addEventListener("click", applyGridLogin);
    gridSetCurrentTimeButton.addEventListener("click", setGridTrainingDateTimeToNow);
    tmtLoginButton.addEventListener("click", applyTmtLogin);
    tmtSetCurrentTimeButton.addEventListener("click", setTmtTrainingDateTimeToNow);
    userIdInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyLogin();
      }
    });
    gridUserIdInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyGridLogin();
      }
    });
    tmtUserIdInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyTmtLogin();
      }
    });
    trialCountInput.addEventListener("input", syncTargetCountBounds);
    targetCountRange.addEventListener("input", () => {
      targetCountInput.value = targetCountRange.value;
      syncTargetCountBounds();
    });
    targetCountInput.addEventListener("input", syncTargetCountBounds);
    settingsForm.addEventListener("input", updateTargetPreview);
    settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      startSession(readSettings());
    });

    responseButton.addEventListener("click", handleResponse);
    stopButton.addEventListener("click", finishSession);
    retryButton.addEventListener("click", () => {
      startSession({
        ...state.settings,
        trainingDateTime: new Date().toISOString(),
      });
    });
    backSettingsButton.addEventListener("click", () => {
      finishCleanup();
      renderSetupHistory();
      showScreen(setupScreen);
    });
    resultHomeButton.addEventListener("click", () => {
      finishCleanup();
      showScreen(homeScreen);
    });
    resultPdfButton.addEventListener("click", () => showResultPdf(resultScreen, "移動刺激選択反応", resultPdfButton));
    downloadCsvButton.addEventListener("click", downloadCsv);
    updateAppButton.addEventListener("click", refreshOfflineApp);
    gridSettingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      startGridSession(readGridSettings());
    });
    gridStopButton.addEventListener("click", finishGridSession);
    gridRetryButton.addEventListener("click", () => {
      startGridSession({
        ...state.grid.settings,
        trainingDateTime: new Date().toISOString(),
      });
    });
    gridBackSettingsButton.addEventListener("click", () => {
      finishGridCleanup();
      showScreen(gridSetupScreen);
    });
    gridHomeButton.addEventListener("click", () => {
      finishGridCleanup();
      showScreen(homeScreen);
    });
    gridResultHomeButton.addEventListener("click", () => {
      finishGridCleanup();
      showScreen(homeScreen);
    });
    gridResultPdfButton.addEventListener("click", () => showResultPdf(gridResultScreen, "視覚探索グリッド", gridResultPdfButton));
    gridBoard.addEventListener("click", (event) => {
      const button = event.target.closest("[data-grid-id]");
      if (button) {
        handleGridCellClick(Number(button.dataset.gridId));
      }
    });
    gridDownloadCsvButton.addEventListener("click", downloadGridCsv);
    tmtSettingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      startTmtSession(readTmtSettings());
    });
    tmtHomeButton.addEventListener("click", () => {
      finishTmtCleanup();
      showScreen(homeScreen);
    });
    tmtStopButton.addEventListener("click", finishTmtSession);
    tmtRetryButton.addEventListener("click", () => {
      startTmtSession({
        ...state.tmt.settings,
        trainingDateTime: new Date().toISOString(),
      });
    });
    tmtBackSettingsButton.addEventListener("click", () => {
      finishTmtCleanup();
      showScreen(tmtSetupScreen);
    });
    tmtResultHomeButton.addEventListener("click", () => {
      finishTmtCleanup();
      showScreen(homeScreen);
    });
    tmtResultPdfButton.addEventListener("click", () => showResultPdf(tmtResultScreen, "TMT風順序探索", tmtResultPdfButton));
    tmtBoard.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tmt-id]");
      if (button) {
        handleTmtTap(Number(button.dataset.tmtId));
      }
    });
    tmtBoard.addEventListener("pointerdown", handleTmtPointerDown);
    tmtBoard.addEventListener("pointermove", handleTmtPointerMove);
    tmtBoard.addEventListener("pointerup", handleTmtPointerUp);
    tmtBoard.addEventListener("pointercancel", handleTmtPointerUp);
    tmtDownloadCsvButton.addEventListener("click", downloadTmtCsv);
    setupHistoryResults.addEventListener("click", (event) => {
      const button = event.target.closest("[data-record-id]");
      if (!button) {
        return;
      }
      const record = getRecordById(button.dataset.recordId);
      if (record) {
        renderResults(record);
        showScreen(resultScreen);
      }
    });
    historyResults.addEventListener("click", (event) => {
      const button = event.target.closest("[data-record-id]");
      if (!button) {
        return;
      }
      const record = getRecordById(button.dataset.recordId);
      if (record) {
        renderResults(record);
      }
    });

    responseButton.addEventListener("touchstart", (event) => {
      if (!trainingScreen.classList.contains("is-active")) {
        return;
      }
      event.preventDefault();
      handleResponse();
    }, { passive: false });
    stage.addEventListener("touchmove", (event) => {
      if (trainingScreen.classList.contains("is-active")) {
        event.preventDefault();
      }
    }, { passive: false });

    document.addEventListener("keydown", (event) => {
      if (!trainingScreen.classList.contains("is-active")) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat) {
          handleResponse();
        }
      }
    });

    updateTargetPreview();
    initializePwaStatus();
    syncTargetCountBounds();
    syncSimultaneousTargetBounds();
    syncUserInputs();
    renderSetupHistory();
    registerServiceWorker();
  }

  function connectRangeAndNumber(rangeId, numberId, onManualInput) {
    const range = document.getElementById(rangeId);
    const number = document.getElementById(numberId);
    range.addEventListener("input", () => {
      number.value = range.value;
      if (onManualInput) {
        onManualInput();
      }
    });
    number.addEventListener("input", () => {
      range.value = number.value;
      if (onManualInput) {
        onManualInput();
      }
    });
  }

  function openMotionSetup() {
    syncUserInputs();
    renderSetupHistory();
    showScreen(setupScreen);
  }

  function openGridSetup() {
    syncUserInputs();
    showScreen(gridSetupScreen);
  }

  function openTmtSetup() {
    syncUserInputs();
    showScreen(tmtSetupScreen);
  }

  function syncUserInputs() {
    userIdInput.value = state.activeUserId;
    gridUserIdInput.value = state.activeUserId;
    tmtUserIdInput.value = state.activeUserId;
    updateActiveUserLabel();
    updateGridActiveUserLabel();
    updateTmtActiveUserLabel();
  }

  function applySpeedPreset(presetName) {
    const preset = SPEED_PRESETS[presetName];
    setControlPair("display-duration-range", "display-duration", preset.displayDurationSec);
    $("#min-interval").value = formatSeconds(preset.minIntervalSec);
    $("#max-interval").value = formatSeconds(preset.maxIntervalSec);
  }

  function selectCustomSpeed() {
    const custom = document.querySelector('input[name="speedPreset"][value="custom"]');
    if (custom) {
      custom.checked = true;
    }
  }

  function setControlPair(rangeId, numberId, value) {
    const formatted = formatSeconds(value);
    document.getElementById(rangeId).value = formatted;
    document.getElementById(numberId).value = formatted;
  }

  function restoreActiveUser() {
    state.activeUserId = "";
    userIdInput.value = "";
    gridUserIdInput.value = "";
    tmtUserIdInput.value = "";
    updateActiveUserLabel();
    updateGridActiveUserLabel();
    updateTmtActiveUserLabel();
  }

  function applyLogin() {
    state.activeUserId = sanitizeUserId(userIdInput.value);
    userIdInput.value = state.activeUserId;
    gridUserIdInput.value = state.activeUserId;
    tmtUserIdInput.value = state.activeUserId;
    updateActiveUserLabel();
    updateGridActiveUserLabel();
    updateTmtActiveUserLabel();
    renderSetupHistory();
  }

  function applyGridLogin() {
    state.activeUserId = sanitizeUserId(gridUserIdInput.value);
    userIdInput.value = state.activeUserId;
    gridUserIdInput.value = state.activeUserId;
    tmtUserIdInput.value = state.activeUserId;
    updateActiveUserLabel();
    updateGridActiveUserLabel();
    updateTmtActiveUserLabel();
    renderSetupHistory();
  }

  function applyTmtLogin() {
    state.activeUserId = sanitizeUserId(tmtUserIdInput.value);
    userIdInput.value = state.activeUserId;
    gridUserIdInput.value = state.activeUserId;
    tmtUserIdInput.value = state.activeUserId;
    updateActiveUserLabel();
    updateGridActiveUserLabel();
    updateTmtActiveUserLabel();
    renderSetupHistory();
  }

  function updateActiveUserLabel() {
    activeUserLabel.textContent = state.activeUserId
      ? `ログイン中: ${state.activeUserId}`
      : "ID未入力";
  }

  function updateGridActiveUserLabel() {
    gridActiveUserLabel.textContent = state.activeUserId
      ? `ログイン中: ${state.activeUserId}`
      : "ID未入力";
  }

  function updateTmtActiveUserLabel() {
    tmtActiveUserLabel.textContent = state.activeUserId
      ? `ログイン中: ${state.activeUserId}`
      : "ID未入力";
  }

  function sanitizeUserId(value) {
    const normalized = String(value || "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 40);
    return normalized;
  }

  function syncTargetCountBounds() {
    const trialCount = clamp(readNumber("trial-count") || 30, 5, 120);
    targetCountRange.max = String(trialCount);
    targetCountInput.max = String(trialCount);

    const targetCount = clamp(readNumber("target-count") || 1, 1, trialCount);
    const roundedTargetCount = String(Math.round(targetCount));
    targetCountRange.value = roundedTargetCount;
    targetCountInput.value = roundedTargetCount;
    targetCountTotal.textContent = `回 / 全${Math.round(trialCount)}回`;
  }

  function syncSimultaneousTargetBounds() {
    const simultaneousCount = Math.round(clamp(readNumber("simultaneous-count") || 1, 1, 6));
    simultaneousCountRange.value = String(simultaneousCount);
    simultaneousCountInput.value = String(simultaneousCount);

    simultaneousTargetCountRange.max = String(simultaneousCount);
    simultaneousTargetCountInput.max = String(simultaneousCount);

    const simultaneousTargetCount = Math.round(
      clamp(readNumber("simultaneous-target-count") || 1, 1, simultaneousCount),
    );
    simultaneousTargetCountRange.value = String(simultaneousTargetCount);
    simultaneousTargetCountInput.value = String(simultaneousTargetCount);
    simultaneousTargetTotal.textContent = `個 / 全${simultaneousCount}個`;
  }

  function setTrainingDateTimeToNow() {
    setTrainingDateTimeInputs(new Date());
  }

  function setGridTrainingDateTimeToNow() {
    setGridTrainingDateTimeInputs(new Date());
  }

  function setTmtTrainingDateTimeToNow() {
    setTmtTrainingDateTimeInputs(new Date());
  }

  function getTrainingDateTimeIso() {
    if (!trainingDateInput.value || !trainingTimeInput.value) {
      setTrainingDateTimeToNow();
    }

    const normalizedDate = normalizeDateInput(trainingDateInput.value);
    const normalizedTime = normalizeTimeInput(trainingTimeInput.value);
    const date = normalizedDate && normalizedTime
      ? new Date(`${normalizedDate}T${normalizedTime}`)
      : new Date(NaN);
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      setTrainingDateTimeInputs(now);
      return now.toISOString();
    }
    trainingDateInput.value = normalizedDate.replaceAll("-", "/");
    trainingTimeInput.value = normalizedTime;
    return date.toISOString();
  }

  function getGridTrainingDateTimeIso() {
    if (!gridTrainingDateInput.value || !gridTrainingTimeInput.value) {
      setGridTrainingDateTimeToNow();
    }

    const normalizedDate = normalizeDateInput(gridTrainingDateInput.value);
    const normalizedTime = normalizeTimeInput(gridTrainingTimeInput.value);
    const date = normalizedDate && normalizedTime
      ? new Date(`${normalizedDate}T${normalizedTime}`)
      : new Date(NaN);
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      setGridTrainingDateTimeInputs(now);
      return now.toISOString();
    }
    gridTrainingDateInput.value = normalizedDate.replaceAll("-", "/");
    gridTrainingTimeInput.value = normalizedTime;
    return date.toISOString();
  }

  function getTmtTrainingDateTimeIso() {
    if (!tmtTrainingDateInput.value || !tmtTrainingTimeInput.value) {
      setTmtTrainingDateTimeToNow();
    }

    const normalizedDate = normalizeDateInput(tmtTrainingDateInput.value);
    const normalizedTime = normalizeTimeInput(tmtTrainingTimeInput.value);
    const date = normalizedDate && normalizedTime
      ? new Date(`${normalizedDate}T${normalizedTime}`)
      : new Date(NaN);
    if (Number.isNaN(date.getTime())) {
      const now = new Date();
      setTmtTrainingDateTimeInputs(now);
      return now.toISOString();
    }
    tmtTrainingDateInput.value = normalizedDate.replaceAll("-", "/");
    tmtTrainingTimeInput.value = normalizedTime;
    return date.toISOString();
  }

  function setTrainingDateTimeInputs(date) {
    const localValue = toDateTimeLocalValue(date);
    trainingDateInput.value = localValue.slice(0, 10).replaceAll("-", "/");
    trainingTimeInput.value = localValue.slice(11, 16);
  }

  function setGridTrainingDateTimeInputs(date) {
    const localValue = toDateTimeLocalValue(date);
    gridTrainingDateInput.value = localValue.slice(0, 10).replaceAll("-", "/");
    gridTrainingTimeInput.value = localValue.slice(11, 16);
  }

  function setTmtTrainingDateTimeInputs(date) {
    const localValue = toDateTimeLocalValue(date);
    tmtTrainingDateInput.value = localValue.slice(0, 10).replaceAll("-", "/");
    tmtTrainingTimeInput.value = localValue.slice(11, 16);
  }

  function normalizeDateInput(value) {
    const text = String(value || "")
      .trim()
      .replace(/[.\-年]/g, "/")
      .replace(/月/g, "/")
      .replace(/日/g, "");
    const compact = text.replace(/\D/g, "");
    let year;
    let month;
    let day;

    if (/^\d{8}$/.test(compact)) {
      year = Number(compact.slice(0, 4));
      month = Number(compact.slice(4, 6));
      day = Number(compact.slice(6, 8));
    } else {
      const parts = text.split("/").filter(Boolean);
      if (parts.length !== 3) {
        return null;
      }
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    }

    if (!isValidDateParts(year, month, day)) {
      return null;
    }
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function normalizeTimeInput(value) {
    const text = String(value || "").trim();
    let hour;
    let minute;

    if (/^\d{1,2}:\d{1,2}$/.test(text)) {
      const parts = text.split(":");
      hour = Number(parts[0]);
      minute = Number(parts[1]);
    } else {
      const compact = text.replace(/\D/g, "");
      if (!/^\d{3,4}$/.test(compact)) {
        return null;
      }
      hour = Number(compact.slice(0, -2));
      minute = Number(compact.slice(-2));
    }

    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function isValidDateParts(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return false;
    }
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  function updateTargetPreview() {
    const color = getCheckedValue("targetColor");
    const shape = getCheckedValue("targetShape");
    targetPreviewMark.className = `mark color-${color} shape-${shape}`;
  }

  function readSettings() {
    const displayDurationSec = clamp(readNumber("display-duration"), 0.5, 5);
    const minInterval = clamp(readNumber("min-interval"), 0.3, 5);
    const maxInterval = clamp(readNumber("max-interval"), 0.3, 7);
    const normalizedMin = Math.min(minInterval, maxInterval);
    const normalizedMax = Math.max(minInterval, maxInterval);
    const trialCount = Math.round(clamp(readNumber("trial-count"), 5, 120));
    const targetCount = Math.round(clamp(readNumber("target-count"), 1, trialCount));
    const simultaneousCount = Math.round(clamp(readNumber("simultaneous-count"), 1, 6));
    const simultaneousTargetCount = Math.round(
      clamp(readNumber("simultaneous-target-count"), 1, simultaneousCount),
    );

    applyLogin();
    setControlPair("display-duration-range", "display-duration", displayDurationSec);
    $("#min-interval").value = formatSeconds(normalizedMin);
    $("#max-interval").value = formatSeconds(normalizedMax);
    trialCountInput.value = String(trialCount);
    targetCountInput.value = String(targetCount);
    syncTargetCountBounds();
    simultaneousCountInput.value = String(simultaneousCount);
    simultaneousTargetCountInput.value = String(simultaneousTargetCount);
    syncSimultaneousTargetBounds();

    return {
      userId: state.activeUserId,
      trainingDateTime: getTrainingDateTimeIso(),
      targetColor: getCheckedValue("targetColor"),
      targetShape: getCheckedValue("targetShape"),
      targetCount,
      simultaneousCount,
      simultaneousTargetCount,
      blinkMode: getCheckedValue("blinkMode"),
      blinkSpeed: getCheckedValue("blinkSpeed"),
      stimulusSize: clamp(readNumber("stimulus-size"), 28, 120),
      displayDuration: secondsToMs(displayDurationSec),
      trialCount,
      minInterval: secondsToMs(normalizedMin),
      maxInterval: secondsToMs(normalizedMax),
    };
  }

  function readGridSettings() {
    applyGridLogin();
    const mode = getCheckedValue("gridMode");
    const dotSize = Math.round(clamp(readNumber("grid-dot-size"), 36, 96));
    const blinkSec = clamp(readNumber("grid-blink-sec"), 0.3, 1.6);
    const blinkMs = secondsToMs(blinkSec);
    const timeoutSec = clamp(readNumber("grid-timeout"), 1, 8);
    const requestedTargetCount = Math.round(clamp(readNumber("grid-target-count"), 5, GRID_TOTAL));
    const targetCount = ["active", "delete", "color"].includes(mode)
      ? GRID_TOTAL
      : requestedTargetCount;

    $("#grid-dot-size").value = String(dotSize);
    $("#grid-dot-size-range").value = String(dotSize);
    $("#grid-blink-sec").value = formatSeconds(blinkSec);
    $("#grid-blink-sec-range").value = formatSeconds(blinkSec);
    $("#grid-timeout").value = formatSeconds(timeoutSec);
    $("#grid-timeout-range").value = formatSeconds(timeoutSec);
    $("#grid-target-count").value = String(targetCount);

    return {
      userId: state.activeUserId,
      trainingDateTime: getGridTrainingDateTimeIso(),
      mode,
      dotSize,
      blinkMs,
      showNumbers: getCheckedValue("gridNumbers") === "show",
      timeoutMs: secondsToMs(timeoutSec),
      targetCount,
    };
  }

  function readTmtSettings() {
    applyTmtLogin();
    const type = getCheckedValue("tmtType");
    const mode = getCheckedValue("tmtMode");
    const nodeSize = Math.round(clamp(readNumber("tmt-node-size"), 42, 82));
    const itemCount = Math.round(clamp(readNumber("tmt-item-count"), 8, 25));

    $("#tmt-node-size").value = String(nodeSize);
    $("#tmt-node-size-range").value = String(nodeSize);
    $("#tmt-item-count").value = String(itemCount);

    return {
      userId: state.activeUserId,
      trainingDateTime: getTmtTrainingDateTimeIso(),
      type,
      mode,
      nodeSize,
      itemCount,
    };
  }

  function readNumber(id) {
    const value = Number(document.getElementById(id).value);
    return Number.isFinite(value) ? value : 0;
  }

  function getCheckedValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`).value;
  }

  function startSession(settings) {
    finishCleanup();
    state.settings = settings;
    state.running = true;
    state.trialNumber = 0;
    state.trialPlan = buildTrialPlan(settings);
    state.results = [];
    state.current = null;
    state.currentRecord = null;
    state.sessionSaved = false;

    showScreen(trainingScreen);
    updateTrainingStats();
    setFeedback("待機中");
    stage.focus({ preventScroll: true });
    scheduleNextTrial(600);
  }

  function buildTrialPlan(settings) {
    const plan = [];
    for (let index = 0; index < settings.trialCount; index += 1) {
      plan.push(index < settings.targetCount);
    }
    return shuffle(plan);
  }

  function scheduleNextTrial(delay) {
    if (!state.running) {
      return;
    }

    if (state.trialNumber >= state.settings.trialCount) {
      finishSession();
      return;
    }

    const wait = Number.isFinite(delay)
      ? delay
      : randomBetween(state.settings.minInterval, state.settings.maxInterval);

    clearTimeout(state.nextTimer);
    state.nextTimer = window.setTimeout(() => {
      spawnStimulus();
    }, wait);
  }

  function spawnStimulus() {
    if (!state.running) {
      return;
    }

    clearStimulusLayer();

    const rect = stage.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) {
      setFeedback("表示領域を確認中");
      scheduleNextTrial(300);
      return;
    }

    const isTargetTrial = Boolean(state.trialPlan[state.trialNumber]);
    state.trialNumber += 1;
    updateTrainingStats();

    const size = state.settings.stimulusSize;
    const stimuli = chooseStimuli(isTargetTrial).map((stimulus, index) => {
      const entrySide = randomChoice(["top", "right", "bottom", "left"]);
      const path = createMotionPath(entrySide, rect.width, rect.height, size);
      const element = document.createElement("div");
      const mark = document.createElement("span");

      element.className =
        state.settings.blinkMode === "target" && stimulus.isTarget
          ? "stimulus is-blinking"
          : "stimulus";
      if (state.settings.blinkMode === "target" && stimulus.isTarget) {
        element.style.setProperty("--blink-duration", `${getBlinkDuration(state.settings.blinkSpeed)}s`);
      }
      element.style.setProperty("--stimulus-size", `${size}px`);
      mark.className = `mark color-${stimulus.color} shape-${stimulus.shape}`;
      element.appendChild(mark);
      stimulusLayer.appendChild(element);

      return {
        ...stimulus,
        id: index + 1,
        entrySide,
        path,
        element,
        position: null,
        lastVisiblePosition: null,
        visibleAt: null,
      };
    });

    state.current = {
      trialNumber: state.trialNumber,
      isTarget: stimuli.some((stimulus) => stimulus.isTarget),
      stimuli,
      createdAt: performance.now(),
      visibleAt: null,
      responded: false,
      stageWidth: rect.width,
      stageHeight: rect.height,
      size,
    };

    setFeedback("刺激表示中");
    state.animationFrame = requestAnimationFrame(animateStimulus);
  }

  function chooseStimuli(isTargetTrial) {
    const simultaneousCount = Math.round(clamp(state.settings.simultaneousCount || 1, 1, 6));
    const targetCount = isTargetTrial
      ? Math.round(clamp(state.settings.simultaneousTargetCount || 1, 1, simultaneousCount))
      : 0;
    const stimuli = [];

    for (let index = 0; index < targetCount; index += 1) {
      stimuli.push(createTargetStimulus());
    }

    while (stimuli.length < simultaneousCount) {
      stimuli.push(createDistractorStimulus());
    }

    return shuffle(stimuli);
  }

  function createTargetStimulus() {
    return {
      color: state.settings.targetColor,
      shape: state.settings.targetShape,
      isTarget: true,
    };
  }

  function createDistractorStimulus() {
    const target = {
      color: state.settings.targetColor,
      shape: state.settings.targetShape,
    };
    const alternatives = [];
    for (const color of Object.keys(COLORS)) {
      for (const shape of Object.keys(SHAPES)) {
        if (color !== target.color || shape !== target.shape) {
          alternatives.push({ color, shape, isTarget: false });
        }
      }
    }
    return randomChoice(alternatives);
  }

  function createMotionPath(entrySide, width, height, size) {
    const margin = size * 0.75 + 18;
    const safeX = () => randomBetween(size * 0.65, width - size * 0.65);
    const safeY = () => randomBetween(size * 0.65, height - size * 0.65);
    let p0;
    let p1;

    if (entrySide === "top") {
      p0 = { x: randomBetween(-size, width + size), y: -margin };
      p1 = { x: clamp(p0.x + randomBetween(-width * 0.22, width * 0.22), size, width - size), y: randomBetween(size, height * 0.30) };
    } else if (entrySide === "bottom") {
      p0 = { x: randomBetween(-size, width + size), y: height + margin };
      p1 = { x: clamp(p0.x + randomBetween(-width * 0.22, width * 0.22), size, width - size), y: randomBetween(height * 0.70, height - size) };
    } else if (entrySide === "left") {
      p0 = { x: -margin, y: randomBetween(-size, height + size) };
      p1 = { x: randomBetween(size, width * 0.30), y: clamp(p0.y + randomBetween(-height * 0.22, height * 0.22), size, height - size) };
    } else {
      p0 = { x: width + margin, y: randomBetween(-size, height + size) };
      p1 = { x: randomBetween(width * 0.70, width - size), y: clamp(p0.y + randomBetween(-height * 0.22, height * 0.22), size, height - size) };
    }

    return {
      p0,
      p1,
      p2: { x: safeX(), y: safeY() },
      p3: { x: safeX(), y: safeY() },
      wobbleAmplitude: randomBetween(0, Math.min(width, height) * 0.11),
      wobbleFrequency: randomBetween(0.75, 1.75),
      wobblePhase: randomBetween(0, Math.PI * 2),
    };
  }

  function animateStimulus(now) {
    const current = state.current;
    if (!state.running || !current) {
      return;
    }

    const elapsed = now - current.createdAt;
    const duration = state.settings.displayDuration;
    const t = clamp(elapsed / duration, 0, 1);

    current.stimuli.forEach((stimulus) => {
      const position = getPathPosition(stimulus.path, t);
      stimulus.position = position;

      stimulus.element.style.left = `${position.x}px`;
      stimulus.element.style.top = `${position.y}px`;

      if (isVisible(position, current.stageWidth, current.stageHeight, current.size)) {
        stimulus.lastVisiblePosition = position;
        if (!stimulus.visibleAt) {
          stimulus.visibleAt = now;
        }
        if (!current.visibleAt) {
          current.visibleAt = now;
        }
      }
    });

    if (elapsed >= duration) {
      const outcome = current.isTarget ? "miss" : "correct_rejection";
      recordOutcome(outcome, null);
      return;
    }

    state.animationFrame = requestAnimationFrame(animateStimulus);
  }

  function getPathPosition(path, t) {
    const base = cubicBezier(path.p0, path.p1, path.p2, path.p3, t);
    const direction = {
      x: path.p3.x - path.p0.x,
      y: path.p3.y - path.p0.y,
    };
    const length = Math.hypot(direction.x, direction.y) || 1;
    const perpendicular = {
      x: -direction.y / length,
      y: direction.x / length,
    };
    const wobble =
      Math.sin(t * Math.PI * 2 * path.wobbleFrequency + path.wobblePhase) *
      path.wobbleAmplitude *
      Math.sin(Math.PI * t);

    return {
      x: base.x + perpendicular.x * wobble,
      y: base.y + perpendicular.y * wobble,
    };
  }

  function cubicBezier(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    return {
      x:
        mt * mt * mt * p0.x +
        3 * mt * mt * t * p1.x +
        3 * mt * t * t * p2.x +
        t * t * t * p3.x,
      y:
        mt * mt * mt * p0.y +
        3 * mt * mt * t * p1.y +
        3 * mt * t * t * p2.y +
        t * t * t * p3.y,
    };
  }

  function isVisible(position, width, height, size) {
    const half = size / 2;
    return (
      position.x >= -half &&
      position.x <= width + half &&
      position.y >= -half &&
      position.y <= height + half
    );
  }

  function handleResponse() {
    const current = state.current;
    if (!state.running || !current || current.responded) {
      return;
    }

    if (!current.visibleAt) {
      setFeedback("画面内表示前");
      return;
    }

    current.responded = true;
    const now = performance.now();
    const rt = Math.round(now - current.visibleAt);
    const outcome = current.isTarget ? "hit" : "false_alarm";
    recordOutcome(outcome, rt);
  }

  function recordOutcome(outcome, rt) {
    const current = state.current;
    if (!current) {
      return;
    }

    const stimuli = current.stimuli.map((stimulus) => {
      const position =
        stimulus.lastVisiblePosition ||
        stimulus.position ||
        { x: current.stageWidth / 2, y: current.stageHeight / 2 };
      return {
        color: stimulus.color,
        shape: stimulus.shape,
        isTarget: stimulus.isTarget,
        entrySide: stimulus.entrySide,
        region: classifyRegion(position, current.stageWidth, current.stageHeight),
      };
    });
    const targetRegions = stimuli
      .filter((stimulus) => stimulus.isTarget)
      .map((stimulus) => stimulus.region);
    const primaryStimulus = stimuli.find((stimulus) => stimulus.isTarget) || stimuli[0];

    state.results.push({
      trialNumber: current.trialNumber,
      color: primaryStimulus.color,
      shape: primaryStimulus.shape,
      isTarget: current.isTarget,
      entrySide: primaryStimulus.entrySide,
      region: primaryStimulus.region,
      stimuli,
      targetRegions,
      outcome,
      rt,
    });

    cleanupCurrentStimulus();
    setFeedback(OUTCOME_LABELS[outcome], outcome);
    updateTrainingStats();
    scheduleNextTrial();
  }

  function classifyRegion(position, width, height) {
    const isLeft = position.x < width / 2;
    const isTop = position.y < height / 2;

    if (isTop) {
      return isLeft ? "topLeft" : "topRight";
    }
    return isLeft ? "bottomLeft" : "bottomRight";
  }

  function cleanupCurrentStimulus() {
    if (state.animationFrame) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }

    if (state.current) {
      if (Array.isArray(state.current.stimuli)) {
        state.current.stimuli.forEach((stimulus) => {
          stimulus.element.remove();
        });
      } else if (state.current.element) {
        state.current.element.remove();
      }
    }

    clearStimulusLayer();
    state.current = null;
  }

  function clearStimulusLayer() {
    if (stimulusLayer.replaceChildren) {
      stimulusLayer.replaceChildren();
      return;
    }
    stimulusLayer.innerHTML = "";
  }

  function updateTrainingStats() {
    const stats = summarizeResults();
    trialProgress.textContent = `${state.trialNumber}/${state.settings ? state.settings.trialCount : 0}`;
    liveScore.textContent = `正反応 ${stats.hit} / 見逃し ${stats.miss} / 誤反応 ${stats.false_alarm}`;
  }

  function finishSession() {
    if (!trainingScreen.classList.contains("is-active")) {
      return;
    }
    finishCleanup();
    const record = saveSessionIfNeeded();
    renderResults(record);
    showScreen(resultScreen);
  }

  function finishCleanup() {
    state.running = false;
    clearTimeout(state.nextTimer);
    state.nextTimer = null;
    cleanupCurrentStimulus();
  }

  function startGridSession(settings) {
    finishGridCleanup();
    state.grid.settings = settings;
    state.grid.running = true;
    state.grid.cells = createGridCells();
    state.grid.selectedIds = new Set();
    state.grid.sequence = buildGridSequence(settings);
    state.grid.promptIndex = 0;
    state.grid.currentPrompt = null;
    state.grid.startAt = performance.now();
    state.grid.lastActionAt = state.grid.startAt;
    state.grid.results = [];
    state.grid.currentRecord = null;
    state.grid.sessionSaved = false;

    showScreen(gridTrainingScreen);
    renderGridBoard();
    setGridFeedback("開始");
    updateGridStats();

    if (isGridPromptMode(settings.mode)) {
      scheduleGridPrompt(500);
    } else {
      setGridFeedback("任意の順序で選択");
    }
  }

  function createGridCells() {
    const cells = [];
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const id = row * GRID_COLS + col + 1;
        cells.push({
          id,
          row,
          col,
          label: `${row + 1}行${col + 1}列`,
          horizontal: col < 3 ? "left" : col > 3 ? "right" : "center",
          vertical: row < 2 ? "top" : row > 2 ? "bottom" : "middle",
        });
      }
    }
    return cells;
  }

  function buildGridSequence(settings) {
    const ids = shuffle(Array.from({ length: GRID_TOTAL }, (_, index) => index + 1));
    return ids.slice(0, settings.targetCount || GRID_TOTAL);
  }

  function isGridPromptMode(mode) {
    return ["passive", "reveal", "sequence"].includes(mode);
  }

  function renderGridBoard() {
    const settings = state.grid.settings;
    gridBoard.style.setProperty("--grid-dot-size", `${settings.dotSize}px`);
    gridBoard.classList.toggle("is-number-hidden", settings.showNumbers === false);
    gridBoard.innerHTML = state.grid.cells
      .map((cell) => {
        const classes = ["grid-dot"];
        if (settings.mode === "reveal") {
          classes.push("is-hidden");
        }
        return `
          <button
            type="button"
            class="${classes.join(" ")}"
            data-grid-id="${cell.id}"
            aria-label="${escapeHtml(cell.label)}"
          >
            <span>${settings.showNumbers === false ? "" : cell.id}</span>
          </button>
        `;
      })
      .join("");
  }

  function scheduleGridPrompt(delay = 0) {
    clearTimeout(state.grid.promptTimer);
    if (!state.grid.running) {
      return;
    }
    if (state.grid.promptIndex >= state.grid.sequence.length) {
      finishGridSession();
      return;
    }
    state.grid.promptTimer = window.setTimeout(showNextGridPrompt, delay);
  }

  function showNextGridPrompt() {
    if (!state.grid.running) {
      return;
    }
    clearGridPromptClasses();
    const id = state.grid.sequence[state.grid.promptIndex];
    const cell = getGridCell(id);
    state.grid.currentPrompt = {
      id,
      cell,
      shownAt: performance.now(),
    };
    const button = getGridButton(id);
    if (button) {
      button.classList.add("is-prompt");
      if (state.grid.settings.mode === "reveal") {
        button.classList.remove("is-hidden");
      }
      button.style.setProperty("--blink-duration", `${state.grid.settings.blinkMs / 1000}s`);
    }
    setGridFeedback("点滅位置を選択");
    updateGridStats();

    clearTimeout(state.grid.promptTimer);
    state.grid.promptTimer = window.setTimeout(() => {
      if (!state.grid.running || !state.grid.currentPrompt || state.grid.currentPrompt.id !== id) {
        return;
      }
      recordGridResult({
        targetId: id,
        clickedId: null,
        outcome: "miss",
        rt: null,
      });
      state.grid.promptIndex += 1;
      state.grid.currentPrompt = null;
      markGridCell(id, "miss");
      setGridFeedback("見逃し", "miss");
      scheduleGridPrompt(450);
    }, state.grid.settings.timeoutMs);
  }

  function handleGridCellClick(id) {
    if (!state.grid.running) {
      return;
    }

    if (isGridPromptMode(state.grid.settings.mode)) {
      handlePromptGridClick(id);
      return;
    }

    if (state.grid.selectedIds.has(id)) {
      recordGridResult({
        targetId: id,
        clickedId: id,
        outcome: "false_alarm",
        rt: Math.round(performance.now() - state.grid.lastActionAt),
      });
      setGridFeedback("重複選択", "false_alarm");
      updateGridStats();
      return;
    }

    const now = performance.now();
    const rt = Math.round(now - state.grid.lastActionAt);
    state.grid.lastActionAt = now;
    state.grid.selectedIds.add(id);
    recordGridResult({
      targetId: id,
      clickedId: id,
      outcome: "hit",
      rt,
    });
    markGridCell(id, "hit");
    setGridFeedback("選択", "hit");
    updateGridStats();

    if (state.grid.selectedIds.size >= GRID_TOTAL) {
      finishGridSession();
    }
  }

  function handlePromptGridClick(id) {
    const prompt = state.grid.currentPrompt;
    if (!prompt) {
      recordGridResult({
        targetId: id,
        clickedId: id,
        outcome: "false_alarm",
        rt: null,
      });
      markGridCell(id, "false_alarm");
      setGridFeedback("提示前の反応", "false_alarm");
      updateGridStats();
      return;
    }

    const rt = Math.round(performance.now() - prompt.shownAt);
    if (id !== prompt.id) {
      recordGridResult({
        targetId: prompt.id,
        clickedId: id,
        outcome: "false_alarm",
        rt,
      });
      markGridCell(id, "false_alarm");
      setGridFeedback("位置違い", "false_alarm");
      updateGridStats();
      return;
    }

    clearTimeout(state.grid.promptTimer);
    state.grid.selectedIds.add(id);
    recordGridResult({
      targetId: id,
      clickedId: id,
      outcome: "hit",
      rt,
    });
    markGridCell(id, "hit");
    state.grid.promptIndex += 1;
    state.grid.currentPrompt = null;
    clearGridPromptClasses();
    setGridFeedback("正反応", "hit");
    updateGridStats();
    scheduleGridPrompt(450);
  }

  function recordGridResult({ targetId, clickedId, outcome, rt }) {
    const targetCell = getGridCell(targetId);
    const clickedCell = clickedId ? getGridCell(clickedId) : null;
    state.grid.results.push({
      trialNumber: state.grid.results.length + 1,
      targetId,
      clickedId,
      row: targetCell ? targetCell.row : null,
      col: targetCell ? targetCell.col : null,
      clickedRow: clickedCell ? clickedCell.row : null,
      clickedCol: clickedCell ? clickedCell.col : null,
      horizontal: targetCell ? targetCell.horizontal : "-",
      vertical: targetCell ? targetCell.vertical : "-",
      outcome,
      rt,
    });
  }

  function markGridCell(id, outcome) {
    const button = getGridButton(id);
    if (!button) {
      return;
    }
    button.classList.remove("is-prompt", "is-hidden");
    if (state.grid.settings.mode === "delete" && outcome === "hit") {
      button.classList.add("is-removed");
      return;
    }
    if (state.grid.settings.mode === "color" && outcome === "hit") {
      button.classList.add("is-colored");
      if (state.grid.settings.showNumbers === false) {
        button.removeAttribute("data-order");
      } else {
        button.dataset.order = String(state.grid.selectedIds.size);
      }
      return;
    }
    button.classList.add(`is-${outcome}`);
  }

  function clearGridPromptClasses() {
    gridBoard.querySelectorAll(".is-prompt").forEach((button) => {
      button.classList.remove("is-prompt");
      if (state.grid.settings && state.grid.settings.mode === "reveal" && !button.classList.contains("is-hit")) {
        button.classList.add("is-hidden");
      }
    });
  }

  function getGridCell(id) {
    return state.grid.cells.find((cell) => cell.id === id) || null;
  }

  function getGridButton(id) {
    return gridBoard.querySelector(`[data-grid-id="${id}"]`);
  }

  function updateGridStats() {
    const summary = summarizeGridResults(state.grid.results);
    const targetCount = state.grid.settings ? state.grid.settings.targetCount : GRID_TOTAL;
    const progress = isGridPromptMode(state.grid.settings ? state.grid.settings.mode : "")
      ? state.grid.promptIndex
      : state.grid.selectedIds.size;
    gridProgress.textContent = `${Math.min(progress, targetCount)}/${targetCount}`;
    gridLiveScore.textContent = `正反応 ${summary.hit} / 見逃し ${summary.miss} / 誤反応 ${summary.false_alarm}`;
  }

  function setGridFeedback(text, outcome) {
    gridFeedback.className = "feedback";
    if (outcome) {
      gridFeedback.classList.add(`is-${outcome}`);
    }
    gridFeedback.textContent = text;
  }

  function finishGridSession() {
    if (!gridTrainingScreen.classList.contains("is-active")) {
      return;
    }
    if (state.grid.running && !isGridPromptMode(state.grid.settings.mode)) {
      addGridUnselectedMisses();
    }
    finishGridCleanup(false);
    const record = saveGridSessionIfNeeded();
    renderGridResults(record);
    showScreen(gridResultScreen);
  }

  function finishGridCleanup(clearResults = true) {
    state.grid.running = false;
    clearTimeout(state.grid.promptTimer);
    state.grid.promptTimer = null;
    state.grid.currentPrompt = null;
    if (clearResults) {
      state.grid.results = [];
      state.grid.currentRecord = null;
      state.grid.sessionSaved = false;
    }
  }

  function addGridUnselectedMisses() {
    state.grid.cells.forEach((cell) => {
      if (state.grid.selectedIds.has(cell.id)) {
        return;
      }
      const alreadyLogged = state.grid.results.some(
        (result) => result.targetId === cell.id && result.outcome === "miss",
      );
      if (!alreadyLogged) {
        recordGridResult({
          targetId: cell.id,
          clickedId: null,
          outcome: "miss",
          rt: null,
        });
      }
    });
  }

  function renderGridResults(record) {
    const activeRecord = record || createUnsavedGridRecord();
    state.grid.currentRecord = activeRecord;
    state.grid.settings = { ...activeRecord.settings };
    state.grid.cells = createGridCells();
    const summary = summarizeGridRecord(activeRecord);

    gridSummaryGrid.innerHTML = [
      summaryItem("正答率", `${summary.accuracy}%`),
      summaryItem("正反応", summary.hit),
      summaryItem("見逃し", summary.miss),
      summaryItem("誤反応", summary.false_alarm),
      summaryItem("平均反応時間", formatMsAsSeconds(summary.averageRt)),
      summaryItem("総所要時間", summary.totalTime === null ? "-" : `${summary.totalTime} 秒`),
      summaryItem("課題モード", GRID_MODE_LABELS[activeRecord.settings.mode] || "-"),
      summaryItem("提示数", activeRecord.settings.targetCount || GRID_TOTAL),
    ].join("");

    gridResultContext.textContent = `利用者ID: ${activeRecord.userId || "ID未入力"} / ${formatDateTime(activeRecord.createdAt)}`;
    renderGridGuidance(activeRecord, summary);
    renderGridResultMap(activeRecord);
    renderGridTrialLog(activeRecord.results);
  }

  function summarizeGridResults(results = []) {
    return results.reduce(
      (stats, result) => {
        if (result.outcome === "hit") {
          stats.hit += 1;
        } else if (result.outcome === "miss") {
          stats.miss += 1;
        } else if (result.outcome === "false_alarm") {
          stats.false_alarm += 1;
        }
        return stats;
      },
      { hit: 0, miss: 0, false_alarm: 0 },
    );
  }

  function summarizeGridRecord(record) {
    const stats = summarizeGridResults(record.results);
    const total = stats.hit + stats.miss + stats.false_alarm;
    const hitRts = record.results
      .filter((result) => result.outcome === "hit" && Number.isFinite(result.rt))
      .map((result) => result.rt);
    const allRts = record.results
      .filter((result) => Number.isFinite(result.rt))
      .map((result) => result.rt);
    const totalTime = allRts.length
      ? Math.round((allRts.reduce((sum, rt) => sum + rt, 0) / 1000) * 10) / 10
      : null;

    return {
      ...stats,
      total,
      accuracy: total ? Math.round((stats.hit / total) * 1000) / 10 : 0,
      averageRt: hitRts.length
        ? Math.round(hitRts.reduce((sum, rt) => sum + rt, 0) / hitRts.length)
        : null,
      totalTime,
    };
  }

  function renderGridGuidance(record, summary) {
    const guidance = buildGridGuidance(record, summary);
    gridGuidance.innerHTML = guidance
      .map((item) => `
        <article class="guidance-card">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.lead)}</p>
          <ul>${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
        </article>
      `)
      .join("");
  }

  function buildGridGuidance(record, summary) {
    const stats = buildGridSpatialStats(record.results);
    return [
      buildGridSummaryGuidance(record, summary, stats),
      buildGridNextConditionGuidance(record, summary, stats),
      buildGridTransferGuidance(record, summary, stats),
    ];
  }

  function buildGridSpatialStats(results) {
    const targetResults = results.filter((result) => ["hit", "miss"].includes(result.outcome));
    const sideRows = ["left", "center", "right"].map((side) => {
      const rows = targetResults.filter((result) => result.horizontal === side);
      const hits = rows.filter((result) => result.outcome === "hit");
      const misses = rows.filter((result) => result.outcome === "miss");
      const rts = hits.filter((result) => Number.isFinite(result.rt)).map((result) => result.rt);
      return {
        side,
        total: rows.length,
        hit: hits.length,
        miss: misses.length,
        missRate: rows.length ? misses.length / rows.length : 0,
        averageRt: rts.length ? Math.round(rts.reduce((sum, rt) => sum + rt, 0) / rts.length) : null,
      };
    });
    const verticalRows = ["top", "middle", "bottom"].map((area) => {
      const rows = targetResults.filter((result) => result.vertical === area);
      const misses = rows.filter((result) => result.outcome === "miss");
      return {
        area,
        total: rows.length,
        miss: misses.length,
        missRate: rows.length ? misses.length / rows.length : 0,
      };
    });
    return {
      sides: sideRows,
      verticals: verticalRows,
      left: sideRows.find((row) => row.side === "left"),
      right: sideRows.find((row) => row.side === "right"),
      top: verticalRows.find((row) => row.area === "top"),
      bottom: verticalRows.find((row) => row.area === "bottom"),
    };
  }

  function buildGridSummaryGuidance(record, summary, stats) {
    const points = [];
    let lead = `正答率は${summary.accuracy}%です。`;
    if (summary.accuracy >= 90 && summary.false_alarm <= 1) {
      lead += " 全体として安定しています。";
      points.push("探索の正確性は保たれており、同じ条件で再現性を確認した後に負荷を上げる余地があります。");
    } else if (summary.accuracy < 70) {
      lead += " まずは条件を易しくして探索と反応の安定を確認します。";
      points.push("成功体験を作るため、提示数を減らす、ターゲットを大きくする、点滅手がかりを使う条件が候補です。");
    } else {
      lead += " 見逃し、誤反応、反応時間、空間的な偏りを合わせて確認します。";
    }
    if (summary.miss > 0) {
      points.push(`見逃しが${summary.miss}回あり、空間探索または外的手がかりへの気づきを確認します。`);
    }
    if (summary.false_alarm > 0) {
      points.push(`誤反応が${summary.false_alarm}回あり、反応抑制や位置確認の方略を確認します。`);
    }
    if (summary.averageRt !== null && summary.averageRt >= 1200) {
      points.push(`平均反応時間が${formatMsAsSeconds(summary.averageRt)}で、探索速度または反応開始の遅れを確認します。`);
    }
    if (stats.left && stats.right && stats.left.missRate > stats.right.missRate + 0.2) {
      points.push("左側で見逃しが相対的に多く、左空間への探索・定位を重点的に確認します。");
    }
    if (stats.right && stats.left && stats.right.missRate > stats.left.missRate + 0.2) {
      points.push("右側で見逃しが相対的に多く、右空間への探索・定位を重点的に確認します。");
    }
    if (!points.length) {
      points.push("大きな偏りは目立ちません。課題モードを変えて注意特性を比較します。");
    }
    return { title: "結果サマリー", lead, points };
  }

  function buildGridNextConditionGuidance(record, summary, stats) {
    const mode = record.settings.mode;
    const points = [];
    let lead = "次回は現在条件を基準に、探索の正確性と気づきやすさに合わせて負荷を調整します。";
    if (summary.accuracy >= 90 && summary.false_alarm <= 1) {
      lead = "次回は少し難しくしてもよい状態です。";
      points.push("提示数を増やす、ターゲットを少し小さくする、点滅手がかりを減らす設定が候補です。");
      if (mode !== "sequence") {
        points.push("成績が安定していれば、順序課題へ進めて注意の切り替え負荷を確認します。");
      }
    } else {
      if (summary.miss > 0) {
        points.push("見逃しがある場合は、提示数を減らす、点滅時間を長くする、ターゲットを大きくする設定を優先します。");
        points.push("一定方向の視覚走査を声かけし、探索開始位置を固定して反応の安定を確認します。");
      }
      if (summary.false_alarm > 0) {
        points.push("誤反応がある場合は、タップ前に位置を確認する手順を入れ、反応抑制を促します。");
      }
      if (summary.averageRt !== null && summary.averageRt >= 1200) {
        points.push("反応時間が長い場合は、難易度を上げずに同条件で再検し、速度より正確性を優先します。");
      }
      if (!points.length) {
        points.push("条件は大きく変えず、同じ設定で再現性を確認します。");
      }
    }
    if (stats.left && stats.right && stats.left.missRate > stats.right.missRate + 0.2) {
      points.push("左方向への視線誘導や、左端から探索を始める声かけを併用します。");
    }
    if (stats.right && stats.left && stats.right.missRate > stats.left.missRate + 0.2) {
      points.push("右方向への視線誘導や、右端まで確認する声かけを併用します。");
    }
    return { title: "次回のアプリ条件", lead, points };
  }

  function buildGridTransferGuidance(record, summary, stats) {
    const mode = record.settings.mode;
    const points = [];
    let lead = "アプリ結果をもとに、机上課題や生活場面へ発展できます。";
    if (["active", "delete", "color"].includes(mode)) {
      points.push("能動探索の要素が強いため、抹消課題、物品探索、書類内探索へ発展できます。");
      points.push("探索順序、左右への開始偏り、後半の反応時間延長を見ることで、探索方略と持続性注意を確認します。");
    }
    if (["passive", "reveal"].includes(mode)) {
      points.push("外的に出現・点滅した刺激への定位が中心のため、腹側注意ネットワーク寄りの反応を確認します。");
      points.push("点滅への気づきが弱い場合は、外的手がかりへの注意の向け直しを支援する訓練につなげます。");
    }
    if (mode === "sequence") {
      points.push("順序課題では、注意の切り替え、位置保持、反応制御の複合的な負荷を確認します。");
    }
    if (summary.miss > 0) {
      points.push("見逃し位置を確認し、机上で必要物品を探す課題や、棚・書類内から目的物を探す練習へつなげます。");
    }
    if (summary.false_alarm > 0) {
      points.push("Go/No-Go課題、ストループ課題、ルール切替課題で反応抑制を確認します。");
    }
    if (summary.averageRt !== null && summary.averageRt >= 1200) {
      points.push("単純反応課題、選択反応課題、ペーシング課題で速度調整を練習します。");
    }
    if (stats.left && stats.right && stats.left.averageRt && stats.right.averageRt) {
      const diff = stats.left.averageRt - stats.right.averageRt;
      if (Math.abs(diff) >= 300) {
        points.push(`${diff > 0 ? "左" : "右"}側の平均反応時間が遅く、空間側性の負荷差を確認します。`);
      }
    }
    if (summary.accuracy >= 90) {
      lead = "成績が安定しているため、より実用場面に近い負荷へ進めます。";
      points.push("二重課題、聴覚指示を聞きながらの探索、作業記憶負荷を加えた課題へ進めます。");
    }
    if (!points.length) {
      points.push("抹消課題や物品探索など、標準的な視覚探索課題で同様の傾向が出るか確認します。");
    }
    return { title: "他訓練への発展", lead, points };
  }

  function renderGridResultMap(record) {
    const showNumbers = !record.settings || record.settings.showNumbers !== false;
    const statusById = new Map();
    record.results.forEach((result) => {
      if (result.outcome === "false_alarm" && result.clickedId) {
        statusById.set(result.clickedId, "false_alarm");
      }
      if (["hit", "miss"].includes(result.outcome)) {
        statusById.set(result.targetId, result.outcome);
      }
    });
    gridResultMap.classList.toggle("is-number-hidden", !showNumbers);
    gridResultMap.innerHTML = createGridCells()
      .map((cell) => {
        const status = statusById.get(cell.id) || "none";
        return `
          <div class="grid-result-dot is-${status}">
            <span>${showNumbers ? cell.id : ""}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderGridTrialLog(results) {
    gridTrialLog.innerHTML = results
      .map((result) => {
        const cell = getGridCell(result.targetId) || createGridCells().find((item) => item.id === result.targetId);
        const rt = formatMsAsSeconds(result.rt);
        return `
          <tr>
            <td>${result.trialNumber}</td>
            <td>${cell ? escapeHtml(cell.label) : "-"}</td>
            <td>${escapeHtml(sideLabel(result.horizontal))}</td>
            <td>${escapeHtml(verticalLabel(result.vertical))}</td>
            <td class="outcome-${result.outcome}">${OUTCOME_LABELS[result.outcome] || result.outcome}</td>
            <td>${rt}</td>
          </tr>
        `;
      })
      .join("");
  }

  function sideLabel(value) {
    return value === "left" ? "左" : value === "right" ? "右" : value === "center" ? "中央" : "-";
  }

  function verticalLabel(value) {
    return value === "top" ? "上" : value === "bottom" ? "下" : value === "middle" ? "中央" : "-";
  }

  function createUnsavedGridRecord() {
    return {
      recordId: "current-grid",
      userId: state.activeUserId,
      createdAt: state.grid.settings && state.grid.settings.trainingDateTime
        ? state.grid.settings.trainingDateTime
        : new Date().toISOString(),
      settings: state.grid.settings,
      results: state.grid.results.slice(),
    };
  }

  function saveGridSessionIfNeeded() {
    if (state.grid.sessionSaved && state.grid.currentRecord) {
      return state.grid.currentRecord;
    }
    const record = {
      recordId: createRecordId(),
      userId: state.activeUserId,
      createdAt: state.grid.settings.trainingDateTime || new Date().toISOString(),
      settings: { ...state.grid.settings },
      results: state.grid.results.map((result) => ({ ...result })),
    };
    if (record.userId && record.results.length) {
      const records = readGridStoredRecords();
      records.unshift(record);
      writeGridStoredRecords(records.slice(0, 300));
    }
    state.grid.currentRecord = record;
    state.grid.sessionSaved = true;
    return record;
  }

  function readGridStoredRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(GRID_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeGridStoredRecords(records) {
    localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(records));
  }

  function downloadGridCsv() {
    const record = state.grid.currentRecord || createUnsavedGridRecord();
    if (!record.results.length) {
      return;
    }
    const header = ["試行", "対象位置", "選択位置", "左右", "上下", "結果", "反応時間_秒", "課題モード"];
    const rows = record.results.map((result) => [
      result.trialNumber,
      result.targetId,
      result.clickedId || "",
      sideLabel(result.horizontal),
      verticalLabel(result.vertical),
      OUTCOME_LABELS[result.outcome] || result.outcome,
      Number.isFinite(result.rt) ? msToSecondsValue(result.rt) : "",
      GRID_MODE_LABELS[record.settings.mode] || record.settings.mode,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `st-attention-grid-${record.userId || "no-id"}-${record.createdAt.slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function startTmtSession(settings) {
    finishTmtCleanup();
    state.tmt.settings = settings;
    state.tmt.running = true;
    state.tmt.items = buildTmtItems(settings);
    state.tmt.expectedIndex = 0;
    state.tmt.startAt = performance.now();
    state.tmt.lastStepAt = state.tmt.startAt;
    state.tmt.results = [];
    state.tmt.completedPoints = [];
    state.tmt.tracePoints = [];
    state.tmt.traceActive = false;
    state.tmt.lastWrongId = null;
    state.tmt.currentRecord = null;
    state.tmt.sessionSaved = false;
    state.tmt.totalTimeMs = null;

    showScreen(tmtTrainingScreen);
    renderTmtBoard();
    setTmtFeedback(settings.mode === "trace" ? "なぞり開始" : "開始");
    updateTmtStats();
  }

  function buildTmtItems(settings) {
    const labels = buildTmtLabels(settings);
    const positions = createTmtPositions(labels.length);
    return labels.map((label, index) => ({
      id: index + 1,
      order: index + 1,
      label,
      x: positions[index].x,
      y: positions[index].y,
      horizontal: positions[index].x < 42 ? "left" : positions[index].x > 58 ? "right" : "center",
      vertical: positions[index].y < 42 ? "top" : positions[index].y > 58 ? "bottom" : "middle",
    }));
  }

  function buildTmtLabels(settings) {
    const count = settings.itemCount;
    if (settings.type === "a") {
      return Array.from({ length: count }, (_, index) => String(index + 1));
    }

    const labels = [];
    let number = 1;
    let kanaIndex = 0;
    while (labels.length < count) {
      labels.push(String(number));
      number += 1;
      if (labels.length >= count) {
        break;
      }
      labels.push(TMT_KANA[kanaIndex] || TMT_KANA[TMT_KANA.length - 1]);
      kanaIndex += 1;
    }
    return labels;
  }

  function createTmtPositions(count) {
    const positions = [];
    const margin = 9;
    const minDistance = count >= 23 ? 13.5 : 15;
    let attempts = 0;

    while (positions.length < count && attempts < 6000) {
      attempts += 1;
      const candidate = {
        x: randomBetween(margin, 100 - margin),
        y: randomBetween(margin, 100 - margin),
      };
      const farEnough = positions.every((position) => {
        const dx = candidate.x - position.x;
        const dy = candidate.y - position.y;
        return Math.hypot(dx, dy) >= minDistance;
      });
      if (farEnough) {
        positions.push(candidate);
      }
    }

    while (positions.length < count) {
      const index = positions.length;
      const col = index % 5;
      const row = Math.floor(index / 5);
      positions.push({
        x: 14 + col * 18 + randomBetween(-3, 3),
        y: 14 + row * 16 + randomBetween(-3, 3),
      });
    }

    return shuffle(positions).slice(0, count);
  }

  function renderTmtBoard() {
    const settings = state.tmt.settings;
    tmtBoard.classList.toggle("is-trace-mode", settings.mode === "trace");
    tmtBoard.style.setProperty("--tmt-node-size", `${settings.nodeSize}px`);
    tmtConnectorLine.setAttribute("points", "");
    tmtTraceLine.setAttribute("points", "");
    tmtBoard.querySelectorAll(".tmt-item").forEach((item) => item.remove());
    state.tmt.items.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = index === 0 ? "tmt-item is-next" : "tmt-item";
      button.dataset.tmtId = String(item.id);
      button.style.setProperty("--x", String(item.x));
      button.style.setProperty("--y", String(item.y));
      button.setAttribute("aria-label", `${item.order}番 ${item.label}`);
      button.textContent = item.label;
      tmtBoard.appendChild(button);
    });
  }

  function handleTmtTap(id) {
    if (!state.tmt.running || state.tmt.settings.mode !== "tap") {
      return;
    }
    completeOrRejectTmtItem(id);
  }

  function completeOrRejectTmtItem(id) {
    const expected = state.tmt.items[state.tmt.expectedIndex];
    const clicked = state.tmt.items.find((item) => item.id === id) || null;
    const now = performance.now();
    if (!expected || !clicked) {
      return;
    }

    if (clicked.id !== expected.id) {
      recordTmtResult({
        expected,
        selected: clicked,
        outcome: "false_alarm",
        rt: Math.round(now - state.tmt.lastStepAt),
        cumulative: Math.round(now - state.tmt.startAt),
      });
      markTmtItem(clicked.id, "error");
      setTmtFeedback("順序違い", "false_alarm");
      updateTmtStats();
      window.setTimeout(() => {
        const button = getTmtButton(clicked.id);
        if (button && !button.classList.contains("is-complete")) {
          button.classList.remove("is-error");
        }
      }, 420);
      return;
    }

    const result = {
      expected,
      selected: clicked,
      outcome: "hit",
      rt: Math.round(now - state.tmt.lastStepAt),
      cumulative: Math.round(now - state.tmt.startAt),
    };
    recordTmtResult(result);
    state.tmt.lastStepAt = now;
    state.tmt.completedPoints.push({ x: clicked.x, y: clicked.y });
    state.tmt.expectedIndex += 1;
    markTmtItem(clicked.id, "complete");
    renderTmtConnectorLine();

    if (state.tmt.expectedIndex >= state.tmt.items.length) {
      setTmtFeedback("完了", "hit");
      updateTmtStats();
      finishTmtSession();
      return;
    }

    markTmtNextItem();
    setTmtFeedback("正反応", "hit");
    updateTmtStats();
  }

  function recordTmtResult({ expected, selected, outcome, rt, cumulative }) {
    state.tmt.results.push({
      trialNumber: state.tmt.results.length + 1,
      expectedId: expected.id,
      expectedLabel: expected.label,
      selectedId: selected ? selected.id : null,
      selectedLabel: selected ? selected.label : "",
      outcome,
      rt,
      cumulative,
      horizontal: expected.horizontal,
      vertical: expected.vertical,
      expectedX: expected.x,
      expectedY: expected.y,
      selectedX: selected ? selected.x : null,
      selectedY: selected ? selected.y : null,
    });
  }

  function markTmtItem(id, status) {
    const button = getTmtButton(id);
    if (!button) {
      return;
    }
    button.classList.remove("is-next", "is-error", "is-complete");
    if (status === "complete") {
      button.classList.add("is-complete");
    } else if (status === "error") {
      button.classList.add("is-error");
    }
  }

  function markTmtNextItem() {
    tmtBoard.querySelectorAll(".tmt-item").forEach((button) => button.classList.remove("is-next"));
    const next = state.tmt.items[state.tmt.expectedIndex];
    if (next) {
      const button = getTmtButton(next.id);
      if (button) {
        button.classList.add("is-next");
      }
    }
  }

  function getTmtButton(id) {
    return tmtBoard.querySelector(`[data-tmt-id="${id}"]`);
  }

  function renderTmtConnectorLine() {
    tmtConnectorLine.setAttribute("points", formatTmtSvgPoints(state.tmt.completedPoints));
  }

  function renderTmtTraceLine() {
    tmtTraceLine.setAttribute("points", formatTmtSvgPoints(state.tmt.tracePoints));
  }

  function formatTmtSvgPoints(points) {
    return points.map((point) => `${point.x},${point.y}`).join(" ");
  }

  function updateTmtStats() {
    const summary = summarizeTmtResults(state.tmt.results);
    const total = state.tmt.items.length || (state.tmt.settings ? state.tmt.settings.itemCount : 0);
    const next = state.tmt.items[state.tmt.expectedIndex];
    tmtProgress.textContent = `${Math.min(state.tmt.expectedIndex, total)}/${total}`;
    tmtNextTarget.textContent = next ? `次: ${next.label}` : "完了";
    tmtLiveScore.textContent = `誤反応 ${summary.false_alarm}`;
  }

  function setTmtFeedback(text, outcome) {
    tmtFeedback.className = "feedback";
    if (outcome) {
      tmtFeedback.classList.add(`is-${outcome}`);
    }
    tmtFeedback.textContent = text;
  }

  function handleTmtPointerDown(event) {
    if (!state.tmt.running || state.tmt.settings.mode !== "trace") {
      return;
    }
    event.preventDefault();
    state.tmt.traceActive = true;
    state.tmt.lastWrongId = null;
    state.tmt.tracePoints = [];
    const point = getTmtPointerPoint(event);
    addTmtTracePoint(point);
    tmtBoard.setPointerCapture(event.pointerId);
    inspectTmtTracePoint(point);
  }

  function handleTmtPointerMove(event) {
    if (!state.tmt.running || state.tmt.settings.mode !== "trace" || !state.tmt.traceActive) {
      return;
    }
    event.preventDefault();
    const point = getTmtPointerPoint(event);
    addTmtTracePoint(point);
    inspectTmtTracePoint(point);
  }

  function handleTmtPointerUp(event) {
    if (state.tmt.settings && state.tmt.settings.mode === "trace") {
      event.preventDefault();
    }
    state.tmt.traceActive = false;
    state.tmt.lastWrongId = null;
  }

  function addTmtTracePoint(point) {
    const previous = state.tmt.tracePoints[state.tmt.tracePoints.length - 1];
    if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) >= 0.7) {
      state.tmt.tracePoints.push({ x: point.x, y: point.y });
      if (state.tmt.tracePoints.length > 900) {
        state.tmt.tracePoints.shift();
      }
      renderTmtTraceLine();
    }
  }

  function inspectTmtTracePoint(point) {
    const touched = getTmtItemAtPoint(point);
    if (!touched) {
      state.tmt.lastWrongId = null;
      return;
    }
    const expected = state.tmt.items[state.tmt.expectedIndex];
    if (!expected) {
      return;
    }
    if (touched.id === expected.id) {
      completeOrRejectTmtItem(touched.id);
      state.tmt.lastWrongId = null;
      return;
    }
    const alreadyComplete = state.tmt.completedPoints.some(
      (completed) => Math.abs(completed.x - touched.x) < 0.01 && Math.abs(completed.y - touched.y) < 0.01,
    );
    if (alreadyComplete || state.tmt.lastWrongId === touched.id) {
      return;
    }
    state.tmt.lastWrongId = touched.id;
    completeOrRejectTmtItem(touched.id);
  }

  function getTmtPointerPoint(event) {
    const rect = tmtBoard.getBoundingClientRect();
    const xPx = clamp(event.clientX - rect.left, 0, rect.width);
    const yPx = clamp(event.clientY - rect.top, 0, rect.height);
    return {
      x: rect.width ? (xPx / rect.width) * 100 : 0,
      y: rect.height ? (yPx / rect.height) * 100 : 0,
      xPx,
      yPx,
      rect,
    };
  }

  function getTmtItemAtPoint(point) {
    const radius = Math.max(24, state.tmt.settings.nodeSize * 0.56);
    return state.tmt.items.find((item) => {
      const itemX = (item.x / 100) * point.rect.width;
      const itemY = (item.y / 100) * point.rect.height;
      return Math.hypot(point.xPx - itemX, point.yPx - itemY) <= radius;
    }) || null;
  }

  function finishTmtSession() {
    if (!tmtTrainingScreen.classList.contains("is-active")) {
      return;
    }
    state.tmt.totalTimeMs = Math.round(performance.now() - state.tmt.startAt);
    finishTmtCleanup(false);
    const record = saveTmtSessionIfNeeded();
    renderTmtResults(record);
    showScreen(tmtResultScreen);
  }

  function finishTmtCleanup(clearResults = true) {
    state.tmt.running = false;
    state.tmt.traceActive = false;
    state.tmt.lastWrongId = null;
    if (clearResults) {
      state.tmt.results = [];
      state.tmt.items = [];
      state.tmt.completedPoints = [];
      state.tmt.tracePoints = [];
      state.tmt.currentRecord = null;
      state.tmt.sessionSaved = false;
      state.tmt.totalTimeMs = null;
    }
  }

  function renderTmtResults(record) {
    const activeRecord = record || createUnsavedTmtRecord();
    state.tmt.currentRecord = activeRecord;
    state.tmt.settings = { ...activeRecord.settings };
    state.tmt.items = activeRecord.items.map((item) => ({ ...item }));
    const summary = summarizeTmtRecord(activeRecord);

    tmtSummaryGrid.innerHTML = [
      summaryItem("完了率", `${summary.completionRate}%`),
      summaryItem("所要時間", formatMsAsSeconds(summary.totalTimeMs)),
      summaryItem("誤反応", summary.false_alarm),
      summaryItem("平均ステップ時間", formatMsAsSeconds(summary.averageRt)),
      summaryItem("課題", TMT_TYPE_LABELS[activeRecord.settings.type] || "-"),
      summaryItem("操作", TMT_MODE_LABELS[activeRecord.settings.mode] || "-"),
      summaryItem("項目数", activeRecord.settings.itemCount),
      summaryItem("最長ステップ", summary.longestStep ? `${summary.longestStep.expectedLabel} / ${formatMsAsSeconds(summary.longestStep.rt)}` : "-"),
    ].join("");

    tmtResultContext.textContent = `利用者ID: ${activeRecord.userId || "ID未入力"} / ${formatDateTime(activeRecord.createdAt)}`;
    renderTmtGuidance(activeRecord, summary);
    renderTmtResultMap(activeRecord);
    renderTmtTrialLog(activeRecord.results);
  }

  function summarizeTmtResults(results = []) {
    return results.reduce(
      (stats, result) => {
        if (result.outcome === "hit") {
          stats.hit += 1;
        } else if (result.outcome === "false_alarm") {
          stats.false_alarm += 1;
        }
        return stats;
      },
      { hit: 0, false_alarm: 0 },
    );
  }

  function summarizeTmtRecord(record) {
    const stats = summarizeTmtResults(record.results);
    const hitRows = record.results.filter((result) => result.outcome === "hit" && Number.isFinite(result.rt));
    const totalTimeMs = Number.isFinite(record.totalTimeMs)
      ? record.totalTimeMs
      : hitRows.length
        ? hitRows[hitRows.length - 1].cumulative
        : null;
    const longestStep = hitRows.slice().sort((a, b) => b.rt - a.rt)[0] || null;
    return {
      ...stats,
      total: record.settings.itemCount,
      completionRate: record.settings.itemCount ? Math.round((stats.hit / record.settings.itemCount) * 1000) / 10 : 0,
      averageRt: hitRows.length
        ? Math.round(hitRows.reduce((sum, result) => sum + result.rt, 0) / hitRows.length)
        : null,
      totalTimeMs,
      longestStep,
    };
  }

  function renderTmtGuidance(record, summary) {
    const guidance = buildTmtGuidance(record, summary);
    tmtGuidance.innerHTML = guidance
      .map((item) => `
        <article class="guidance-card">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.lead)}</p>
          <ul>${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
        </article>
      `)
      .join("");
  }

  function buildTmtGuidance(record, summary) {
    return [
      buildTmtSummaryGuidance(record, summary),
      buildTmtNextConditionGuidance(record, summary),
      buildTmtTransferGuidance(record, summary),
    ];
  }

  function buildTmtSummaryGuidance(record, summary) {
    const type = record.settings.type;
    const slowStep = summary.longestStep;
    const points = [];
    let lead = `${TMT_TYPE_LABELS[type]}、${TMT_MODE_LABELS[record.settings.mode]}操作での結果です。`;
    if (type === "a") {
      points.push("数字の順序探索を通して、視覚探索、処理速度、持続性注意を確認します。");
    } else {
      points.push("数字とかなの交互探索を通して、注意の切り替え、ルール保持、遂行機能を確認します。");
    }
    if (summary.false_alarm > 0) {
      points.push(`誤反応が${summary.false_alarm}回あり、順序確認や反応抑制の支援を検討します。`);
    }
    if (slowStep && slowStep.rt >= 2500) {
      points.push(`${slowStep.expectedLabel}付近で時間を要しており、探索停滞や切り替え負荷の場面を確認します。`);
    }
    if (summary.completionRate < 100) {
      lead += " 途中終了のため、完了できた範囲を中心に確認します。";
      points.push("完了率が100%未満のため、項目数や課題タイプを調整して完了できる条件を確認します。");
    }
    if (summary.completionRate === 100 && summary.false_alarm === 0) {
      points.push("誤反応なく完了できており、項目数を維持して再現性を見るか、TMT-Bで切り替え負荷を確認できます。");
    }
    const spatial = getTmtSpatialStats(record);
    if (spatial.leftAvg !== null && spatial.rightAvg !== null && Math.abs(spatial.leftAvg - spatial.rightAvg) >= 600) {
      points.push(`${spatial.leftAvg > spatial.rightAvg ? "左" : "右"}側のステップ時間が長く、空間探索の偏りを確認します。`);
    }
    if (!points.length) {
      points.push("大きな誤反応や遅延は目立ちません。同条件で再現性を確認します。");
    }
    return { title: "結果サマリー", lead, points };
  }

  function getTmtSpatialStats(record) {
    const hitRows = record.results.filter((result) => result.outcome === "hit");
    const leftRows = hitRows.filter((result) => result.horizontal === "left");
    const rightRows = hitRows.filter((result) => result.horizontal === "right");
    const avg = (rows) => rows.length
      ? Math.round(rows.reduce((sum, result) => sum + result.rt, 0) / rows.length)
      : null;
    return {
      leftAvg: avg(leftRows),
      rightAvg: avg(rightRows),
    };
  }

  function buildTmtSpatialGuidance(record) {
    const hitRows = record.results.filter((result) => result.outcome === "hit");
    const leftRows = hitRows.filter((result) => result.horizontal === "left");
    const rightRows = hitRows.filter((result) => result.horizontal === "right");
    const avg = (rows) => rows.length
      ? Math.round(rows.reduce((sum, result) => sum + result.rt, 0) / rows.length)
      : null;
    const leftAvg = avg(leftRows);
    const rightAvg = avg(rightRows);
    const points = [];
    if (leftAvg !== null && rightAvg !== null && Math.abs(leftAvg - rightAvg) >= 600) {
      points.push(`${leftAvg > rightAvg ? "左" : "右"}側のステップ時間が長く、空間探索の偏りを確認します。`);
    } else {
      points.push("左右差が大きくない場合も、経路の迷い、戻り、探索開始位置を観察します。");
    }
    points.push("なぞりモードでは線の戻りや迂回、タップモードでは誤選択位置を合わせて見ます。");
    return {
      title: "空間探索の視点",
      lead: "位置別の遅れや迷いを、無視症状や探索方略の観察につなげます。",
      points,
    };
  }

  function buildTmtApproachGuidance(record, summary) {
    return buildTmtNextConditionGuidance(record, summary);
  }

  function buildTmtNextConditionGuidance(record, summary) {
    const points = [];
    let lead = "次回は現在条件を基準に、探索速度、切り替え、反応抑制のどこに負荷があるかを整理します。";
    if (summary.completionRate === 100 && summary.false_alarm === 0) {
      lead = "次回は少し難しくしてもよい状態です。";
      if (record.settings.type === "a") {
        points.push("TMT-Aで安定していれば、TMT-Bで注意の切り替え負荷を確認します。");
      }
      points.push("項目数を維持して再現性を見るか、項目数を少し増やして負荷を調整します。");
    }
    if (record.settings.type === "b" && (summary.false_alarm > 0 || summary.averageRt >= 1800)) {
      points.push("TMT-Aへ戻して探索速度を確認した後、TMT-Bで切り替え負荷を再確認します。");
    }
    if (summary.false_alarm > 0) {
      points.push("選択前に次の番号・かなを声に出して確認する手順を入れます。");
    }
    if (summary.averageRt !== null && summary.averageRt >= 2000) {
      points.push("項目数を減らす、項目サイズを大きくするなど、成功しやすい条件から始めます。");
    }
    if (summary.completionRate < 100) {
      points.push("完了できない場合は、項目数を減らす、TMT-Aから開始する、タップ操作で成功率を確認する設定が候補です。");
    }
    if (!points.length) {
      points.push("同条件で再検し、タップとなぞりの差やTMT-A/Bの差を比較します。");
    }
    return {
      title: "次回のアプリ条件",
      lead,
      points,
    };
  }

  function buildTmtTransferGuidance(record, summary) {
    const points = [];
    let lead = "アプリ結果をもとに、机上課題や生活場面へ発展できます。";
    if (record.settings.type === "a") {
      points.push("数字探索、抹消課題、書類内の番号確認など、視覚探索と処理速度を使う課題へ発展できます。");
    } else {
      points.push("交互探索、ルール切替課題、手順確認課題など、注意の切り替えと遂行機能を使う課題へ発展できます。");
    }
    if (summary.false_alarm > 0) {
      points.push("選択前に次の番号・かなを声に出して確認する手順を入れ、反応抑制を支援します。");
    }
    if (summary.averageRt !== null && summary.averageRt >= 2000) {
      points.push("単純探索から複雑探索へ段階づけ、処理速度と探索方略を分けて確認します。");
    }
    if (summary.completionRate === 100 && summary.false_alarm === 0) {
      lead = "成績が安定しているため、より実用場面に近い負荷へ進めます。";
      points.push("時刻表、予定表、書類確認など、順序探索と切り替えを含む生活課題へ展開できます。");
    }
    const spatial = getTmtSpatialStats(record);
    if (spatial.leftAvg !== null && spatial.rightAvg !== null && Math.abs(spatial.leftAvg - spatial.rightAvg) >= 600) {
      points.push(`${spatial.leftAvg > spatial.rightAvg ? "左" : "右"}側への視覚走査、机上探索、移動時の確認動作へ発展します。`);
    }
    if (!points.length) {
      points.push("同様の傾向が机上課題や日常場面でも出るか、観察と課題設定を合わせて確認します。");
    }
    return {
      title: "他訓練への発展",
      lead,
      points,
    };
  }

  function renderTmtResultMap(record) {
    const completedIds = new Set(record.results.filter((result) => result.outcome === "hit").map((result) => result.expectedId));
    const errorIds = new Set(record.results.filter((result) => result.outcome === "false_alarm" && result.selectedId).map((result) => result.selectedId));
    const points = record.results
      .filter((result) => result.outcome === "hit")
      .map((result) => `${result.expectedX},${result.expectedY}`)
      .join(" ");
    const itemsHtml = record.items.map((item) => {
      const status = completedIds.has(item.id) ? "complete" : errorIds.has(item.id) ? "error" : "pending";
      return `
        <div class="tmt-result-item is-${status}" style="--x:${item.x}; --y:${item.y}; --tmt-node-size:${record.settings.nodeSize}px">
          ${escapeHtml(item.label)}
        </div>
      `;
    }).join("");
    tmtResultMap.innerHTML = `
      <svg class="tmt-line-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline class="tmt-connector-line" points="${escapeHtml(points)}"></polyline>
      </svg>
      ${itemsHtml}
    `;
  }

  function renderTmtTrialLog(results) {
    tmtTrialLog.innerHTML = results
      .map((result) => `
        <tr>
          <td>${result.trialNumber}</td>
          <td>${escapeHtml(result.expectedLabel)}</td>
          <td>${escapeHtml(result.selectedLabel || "-")}</td>
          <td class="outcome-${result.outcome}">${result.outcome === "hit" ? "正反応" : "誤反応"}</td>
          <td>${formatMsAsSeconds(result.rt)}</td>
          <td>${formatMsAsSeconds(result.cumulative)}</td>
        </tr>
      `)
      .join("");
  }

  function createUnsavedTmtRecord() {
    return {
      recordId: "current-tmt",
      userId: state.activeUserId,
      createdAt: state.tmt.settings && state.tmt.settings.trainingDateTime
        ? state.tmt.settings.trainingDateTime
        : new Date().toISOString(),
      settings: state.tmt.settings,
      items: state.tmt.items.map((item) => ({ ...item })),
      results: state.tmt.results.map((result) => ({ ...result })),
      totalTimeMs: state.tmt.totalTimeMs,
    };
  }

  function saveTmtSessionIfNeeded() {
    if (state.tmt.sessionSaved && state.tmt.currentRecord) {
      return state.tmt.currentRecord;
    }
    const record = {
      recordId: createRecordId(),
      userId: state.activeUserId,
      createdAt: state.tmt.settings.trainingDateTime || new Date().toISOString(),
      settings: { ...state.tmt.settings },
      items: state.tmt.items.map((item) => ({ ...item })),
      results: state.tmt.results.map((result) => ({ ...result })),
      totalTimeMs: state.tmt.totalTimeMs,
    };
    if (record.userId && record.results.length) {
      const records = readTmtStoredRecords();
      records.unshift(record);
      writeTmtStoredRecords(records.slice(0, 300));
    }
    state.tmt.currentRecord = record;
    state.tmt.sessionSaved = true;
    return record;
  }

  function readTmtStoredRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(TMT_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeTmtStoredRecords(records) {
    localStorage.setItem(TMT_STORAGE_KEY, JSON.stringify(records));
  }

  function downloadTmtCsv() {
    const record = state.tmt.currentRecord || createUnsavedTmtRecord();
    if (!record.results.length) {
      return;
    }
    const header = ["試行", "正しい項目", "選択", "結果", "反応時間_秒", "累積時間_秒", "左右", "上下", "課題", "操作"];
    const rows = record.results.map((result) => [
      result.trialNumber,
      result.expectedLabel,
      result.selectedLabel || "",
      result.outcome === "hit" ? "正反応" : "誤反応",
      Number.isFinite(result.rt) ? msToSecondsValue(result.rt) : "",
      Number.isFinite(result.cumulative) ? msToSecondsValue(result.cumulative) : "",
      sideLabel(result.horizontal),
      verticalLabel(result.vertical),
      TMT_TYPE_LABELS[record.settings.type] || record.settings.type,
      TMT_MODE_LABELS[record.settings.mode] || record.settings.mode,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `st-attention-tmt-${record.userId || "no-id"}-${record.createdAt.slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function renderResults(record) {
    const activeRecord = record || createUnsavedRecord();
    state.currentRecord = activeRecord;
    state.settings = { ...activeRecord.settings };
    const summary = summarizeRecord(activeRecord);

    $("#summary-grid").innerHTML = [
      summaryItem("正答率", `${summary.accuracy}%`),
      summaryItem("正反応", summary.hit),
      summaryItem("見逃し", summary.miss),
      summaryItem("誤反応", summary.false_alarm),
      summaryItem("正棄却", summary.correct_rejection),
      summaryItem("平均反応時間", formatMsAsSeconds(summary.averageRt)),
      summaryItem("試行数", summary.total),
      summaryItem("ターゲット", `${COLORS[activeRecord.settings.targetColor]}${SHAPES[activeRecord.settings.targetShape]}`),
      summaryItem("同時表示", `${activeRecord.settings.simultaneousCount || 1}個`),
      summaryItem("同時ターゲット", `${activeRecord.settings.simultaneousTargetCount || 1}個`),
      summaryItem("点滅", getBlinkModeLabel(activeRecord.settings.blinkMode)),
      summaryItem("点滅速度", getBlinkSpeedLabel(activeRecord.settings.blinkSpeed, activeRecord.settings.blinkMode)),
    ].join("");

    resultContext.textContent = `利用者ID: ${activeRecord.userId || "ID未入力"} / ${formatDateTime(activeRecord.createdAt)}`;
    renderTrainingGuidance(activeRecord, summary);
    renderComparison(activeRecord);
    renderHistory(activeRecord);
    renderRegionResults(activeRecord.results);
    renderTrialLog(activeRecord.results);
  }

  function summaryItem(label, value) {
    return `<div class="summary-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
  }

  function renderTrainingGuidance(record, summary) {
    const guidance = buildTrainingGuidance(record, summary);
    $("#training-guidance").innerHTML = guidance
      .map((item) => `
        <article class="guidance-card">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.lead)}</p>
          <ul>
            ${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
          </ul>
        </article>
      `)
      .join("");
  }

  function buildTrainingGuidance(record, summary) {
    const stats = buildGuidanceStats(record, summary);
    return [
      buildResultSummaryGuidance(record, summary, stats),
      buildNextConditionGuidance(record, summary, stats),
      buildTransferGuidance(record, summary, stats),
    ];
  }

  function buildGuidanceStats(record, summary) {
    const targetTrials = summary.hit + summary.miss;
    const nonTargetTrials = summary.false_alarm + summary.correct_rejection;
    const missRate = targetTrials ? summary.miss / targetTrials : 0;
    const falseAlarmRate = nonTargetTrials ? summary.false_alarm / nonTargetTrials : 0;
    const regionRows = getRegionGuidanceStats(record.results);
    const weakRegions = regionRows
      .filter((region) => region.total >= 2 && region.missRate >= 0.5)
      .sort((a, b) => b.missRate - a.missRate || b.total - a.total);

    return {
      targetTrials,
      nonTargetTrials,
      missRate,
      falseAlarmRate,
      weakRegions,
      strongestWeakRegion: weakRegions[0] || null,
      highAccuracy: summary.accuracy >= 85 && summary.miss <= 1 && summary.false_alarm <= 1,
      lowAccuracy: summary.total >= 5 && summary.accuracy < 65,
      missConcern: summary.miss >= 2 || missRate >= 0.3,
      inhibitionConcern: summary.false_alarm >= 2 || falseAlarmRate >= 0.25,
      slowConcern: summary.averageRt !== null && summary.averageRt >= 1200,
    };
  }

  function getRegionGuidanceStats(results) {
    return REGION_KEYS.map((region) => {
      let hit = 0;
      let miss = 0;
      results.forEach((result) => {
        getResultTargetRegions(result).forEach((targetRegion) => {
          if (targetRegion !== region) {
            return;
          }
          if (result.outcome === "hit") {
            hit += 1;
          } else if (result.outcome === "miss") {
            miss += 1;
          }
        });
      });
      const total = hit + miss;
      return {
        region,
        label: REGION_LABELS[region],
        hit,
        miss,
        total,
        missRate: total ? miss / total : 0,
      };
    });
  }

  function buildResultSummaryGuidance(record, summary, stats) {
    const points = [];
    let lead = `正答率は${summary.accuracy}%です。`;

    if (stats.highAccuracy) {
      lead += " 全体として安定した成績です。";
      points.push("現条件での見逃し・誤反応は少なく、難易度を少し上げる余地があります。");
    } else if (stats.lowAccuracy) {
      lead += " まずは課題を少し易しくして反応の安定を確認します。";
      points.push("成功体験を作るため、刺激を見つけやすい条件から再開します。");
    } else {
      lead += " 成績の内訳を見ながら、見逃しと誤反応のどちらが主課題か確認します。";
    }

    if (stats.missConcern) {
      points.push(`見逃しが${summary.miss}回あり、ターゲットへの気づきや探索の支援が必要です。`);
    }
    if (stats.inhibitionConcern) {
      points.push(`誤反応が${summary.false_alarm}回あり、反応抑制やルール保持も確認します。`);
    }
    if (stats.slowConcern) {
      points.push(`平均反応時間が${formatMsAsSeconds(summary.averageRt)}で、速度面の負荷もみられます。`);
    }
    if (stats.strongestWeakRegion) {
      points.push(`${stats.strongestWeakRegion.label}領域で見逃しが目立つため、空間的な探索傾向を確認します。`);
    }
    if (!points.length) {
      points.push("大きな偏りは目立ちません。条件を維持して再現性を確認します。");
    }

    return {
      title: "結果サマリー",
      lead,
      points,
    };
  }

  function buildNextConditionGuidance(record, summary, stats) {
    const settings = record.settings || {};
    const points = [];
    let lead = "次回は現在条件を基準に、成績に合わせて負荷を調整します。";

    if (stats.highAccuracy) {
      lead = "次回は少し難しくしてもよい状態です。";
      if ((settings.simultaneousCount || 1) < 6) {
        points.push("同時表示数を1個増やして、選択性注意の負荷を上げます。");
      }
      if ((settings.displayDuration || 1800) > 700) {
        points.push("見えている時間を0.2〜0.3秒短くして、反応速度を確認します。");
      }
      if (settings.blinkMode === "target") {
        points.push("ターゲット点滅をなしにして、手がかりなしでの探索を確認します。");
      }
    } else {
      if (stats.missConcern) {
        points.push("見えている時間を長くする、刺激を大きくする、動きをゆっくりにする設定を優先します。");
        if ((settings.simultaneousCount || 1) > 1) {
          points.push("同時表示数を1個減らし、まずターゲットへの気づきを安定させます。");
        }
        if (settings.blinkMode !== "target") {
          points.push("ターゲット点滅をありにして、導入課題として成功率を確認します。");
        }
      }
      if (stats.inhibitionConcern) {
        points.push("誤反応が多い場合は、点滅なし・反応前に確認する声かけで抑制を重視します。");
        points.push("ターゲット提示回数を少し下げ、対象外刺激への反応抑制を観察します。");
      }
      if (stats.slowConcern) {
        points.push("反応時間が遅い場合は、難易度を上げずに同条件で再検し、安定後に速度負荷を調整します。");
      }
      if (!points.length) {
        points.push("条件は大きく変えず、同じ設定で再現性を確認します。");
      }
    }

    if (stats.strongestWeakRegion) {
      points.push(`${stats.strongestWeakRegion.label}方向への視線誘導や探索開始位置の声かけを併用します。`);
    }

    return {
      title: "次回のアプリ条件",
      lead,
      points,
    };
  }

  function buildTransferGuidance(record, summary, stats) {
    const points = [];
    let lead = "アプリ結果をもとに、机上課題や生活場面へ発展できます。";

    if (stats.missConcern) {
      points.push("視覚探索課題、抹消課題、文字・数字探しへ発展します。");
      points.push("机上で必要物品を探す課題や、棚・書類内から目的物を探す練習へつなげます。");
    }
    if (stats.inhibitionConcern) {
      points.push("Go/No-Go課題、ストループ課題、ルール切替課題で反応抑制を確認します。");
    }
    if (stats.slowConcern) {
      points.push("単純反応課題、選択反応課題、ペーシング課題で速度調整を練習します。");
    }
    if (stats.strongestWeakRegion) {
      points.push(`${stats.strongestWeakRegion.label}方向への視覚走査、机上探索、移動時の確認動作へ発展します。`);
    }
    if (stats.highAccuracy) {
      lead = "成績が安定しているため、より実用場面に近い負荷へ進めます。";
      points.push("二重課題、聴覚指示を聞きながらの探索、作業記憶負荷を加えた課題へ進めます。");
      points.push("書類・新聞・物品探索など、ADL/IADL場面への般化を確認します。");
    }
    if (!points.length) {
      points.push("抹消課題や物品探索など、標準的な視覚探索課題で同様の傾向が出るか確認します。");
    }

    return {
      title: "他訓練への発展",
      lead,
      points,
    };
  }

  function getBlinkModeLabel(mode) {
    return mode === "target" ? "ターゲットのみ" : "なし";
  }

  function getBlinkSpeedLabel(speed, mode = "target") {
    if (mode !== "target") {
      return "-";
    }
    const blinkSpeed = BLINK_SPEEDS[speed] || BLINK_SPEEDS.normal;
    return blinkSpeed.label;
  }

  function getBlinkDuration(speed) {
    const blinkSpeed = BLINK_SPEEDS[speed] || BLINK_SPEEDS.normal;
    return blinkSpeed.durationSec;
  }

  function initializePwaStatus() {
    appVersionLabel.textContent = VERSION_INFO.label;
    updateOfflineStatus();
    window.addEventListener("online", () => updateOfflineStatus());
    window.addEventListener("offline", () => updateOfflineStatus());
    setupServiceWorkerMessages();
  }

  function getServiceWorkerApi() {
    return window.navigator && window.navigator.serviceWorker
      ? window.navigator.serviceWorker
      : null;
  }

  function updateOfflineStatus(message) {
    if (message) {
      offlineStatusLabel.textContent = message;
      return;
    }

    const serviceWorker = getServiceWorkerApi();
    if (window.location.protocol === "file:") {
      offlineStatusLabel.textContent = "ファイル表示";
      return;
    }
    if (!window.isSecureContext) {
      offlineStatusLabel.textContent = "HTTPS接続が必要";
      return;
    }
    if (!serviceWorker) {
      offlineStatusLabel.textContent = "オフライン未対応";
      return;
    }
    if (window.navigator && window.navigator.onLine === false) {
      offlineStatusLabel.textContent = "オフライン中";
      return;
    }
    offlineStatusLabel.textContent = serviceWorker.controller
      ? "オフライン準備済み"
      : "オフライン準備中";
  }

  function setupServiceWorkerMessages() {
    const serviceWorker = getServiceWorkerApi();
    if (!serviceWorker) {
      return;
    }

    serviceWorker.addEventListener("message", (event) => {
      if (!event.data || event.data.type !== "CACHE_REFRESHED") {
        return;
      }
      updateOfflineStatus("最新版準備完了");
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    });

    serviceWorker.addEventListener("controllerchange", () => {
      if (state.updateReloading) {
        return;
      }
      state.updateReloading = true;
      window.location.reload();
    });
  }

  function registerServiceWorker() {
    const serviceWorker = getServiceWorkerApi();
    if (!serviceWorker || window.location.protocol === "file:" || !window.isSecureContext) {
      updateOfflineStatus();
      return;
    }
    if (isInsideIntegratedStApp()) {
      updateOfflineStatus();
      return;
    }

    serviceWorker.register("./sw.js")
      .then((registration) => {
        watchServiceWorkerUpdate(registration);
        return serviceWorker.ready;
      })
      .then(() => {
        updateOfflineStatus();
      })
      .catch(() => {
        updateOfflineStatus("準備できません");
      });
  }

  function isInsideIntegratedStApp() {
    return window.location.pathname.includes("/st-attention-training-v0.1/");
  }

  function watchServiceWorkerUpdate(registration) {
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) {
        return;
      }
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && getServiceWorkerApi().controller) {
          updateOfflineStatus("更新あり");
        }
      });
    });
  }

  function refreshOfflineApp() {
    const serviceWorker = getServiceWorkerApi();
    if (!serviceWorker || window.location.protocol === "file:" || !window.isSecureContext) {
      updateOfflineStatus("HTTPS接続が必要");
      return;
    }

    updateOfflineStatus("最新版確認中");
    updateAppButton.disabled = true;

    const updatePromise = serviceWorker.getRegistration()
      .then((registration) => registration || serviceWorker.register("./sw.js"))
      .then((registration) => {
        watchServiceWorkerUpdate(registration);
        return registration.update().then(() => registration);
      })
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          return;
        }
        if (serviceWorker.controller) {
          serviceWorker.controller.postMessage({ type: "REFRESH_CACHE" });
          return;
        }
        updateOfflineStatus("準備完了");
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
          updateAppButton.disabled = false;
        }, 700);
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

  function createUnsavedRecord() {
    return {
      recordId: "current",
      userId: state.activeUserId,
      createdAt: state.settings && state.settings.trainingDateTime
        ? state.settings.trainingDateTime
        : new Date().toISOString(),
      settings: state.settings,
      results: state.results.slice(),
    };
  }

  function summarizeRecord(record) {
    const stats = summarizeResults(record.results);
    const total = record.results.length;
    const correct = stats.hit + stats.correct_rejection;
    const accuracy = total ? Math.round((correct / total) * 1000) / 10 : 0;
    const hitRts = record.results
      .filter((result) => result.outcome === "hit" && Number.isFinite(result.rt))
      .map((result) => result.rt);
    const averageRt = hitRts.length
      ? Math.round(hitRts.reduce((sum, rt) => sum + rt, 0) / hitRts.length)
      : null;

    return {
      ...stats,
      total,
      accuracy,
      averageRt,
    };
  }

  function renderSetupHistory() {
    if (!state.activeUserId) {
      setupHistoryContext.textContent = "IDを入力してログインすると履歴を確認できます";
      setupLastSummary.innerHTML = summaryItem("前回結果", "ID未入力");
      setupHistoryResults.innerHTML = `
        <tr>
          <td colspan="8" class="muted-table-message">IDを入力してログインすると、このIDの前回結果と履歴を表示します</td>
        </tr>
      `;
      return;
    }

    const records = getRecordsForUser(state.activeUserId).slice(0, 10);
    setupHistoryContext.textContent = `利用者ID: ${state.activeUserId}`;

    if (!records.length) {
      setupLastSummary.innerHTML = summaryItem("前回結果", "履歴なし");
      setupHistoryResults.innerHTML = `
        <tr>
          <td colspan="8" class="muted-table-message">このIDの履歴はまだありません</td>
        </tr>
      `;
      return;
    }

    const latest = records[0];
    const summary = summarizeRecord(latest);
    setupLastSummary.innerHTML = [
      summaryItem("前回訓練日時", formatDateTime(latest.createdAt)),
      summaryItem("正答率", `${summary.accuracy}%`),
      summaryItem("正反応", summary.hit),
      summaryItem("見逃し", summary.miss),
      summaryItem("平均反応時間", formatMsAsSeconds(summary.averageRt)),
    ].join("");

    setupHistoryResults.innerHTML = buildHistoryRows(records, null);
  }

  function renderComparison(record) {
    if (!record.userId) {
      comparisonResults.innerHTML = `
        <tr>
          <td colspan="4" class="muted-table-message">ID未入力のため前回比較は表示されません</td>
        </tr>
      `;
      return;
    }

    const previous = getPreviousRecord(record);
    if (!previous) {
      comparisonResults.innerHTML = `
        <tr>
          <td colspan="4" class="muted-table-message">同じIDの前回データはまだありません</td>
        </tr>
      `;
      return;
    }

    const currentSummary = summarizeRecord(record);
    const previousSummary = summarizeRecord(previous);
    const rows = [
      comparisonRow("正答率", `${currentSummary.accuracy}%`, `${previousSummary.accuracy}%`, currentSummary.accuracy - previousSummary.accuracy, "%"),
      comparisonRow("正反応", currentSummary.hit, previousSummary.hit, currentSummary.hit - previousSummary.hit, ""),
      comparisonRow("見逃し", currentSummary.miss, previousSummary.miss, currentSummary.miss - previousSummary.miss, ""),
      comparisonRow("誤反応", currentSummary.false_alarm, previousSummary.false_alarm, currentSummary.false_alarm - previousSummary.false_alarm, ""),
      comparisonRow(
        "平均反応時間",
        formatMsAsSeconds(currentSummary.averageRt),
        formatMsAsSeconds(previousSummary.averageRt),
        currentSummary.averageRt === null || previousSummary.averageRt === null
          ? null
          : msToSecondsValue(currentSummary.averageRt - previousSummary.averageRt),
        " 秒",
      ),
    ];

    comparisonResults.innerHTML = rows.join("");
  }

  function comparisonRow(label, current, previous, delta, unit) {
    return `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td>${escapeHtml(String(current))}</td>
        <td>${escapeHtml(String(previous))}</td>
        <td>${escapeHtml(formatDelta(delta, unit))}</td>
      </tr>
    `;
  }

  function renderHistory(record) {
    if (!record.userId) {
      historyResults.innerHTML = `
        <tr>
          <td colspan="8" class="muted-table-message">ID未入力のため履歴は保存されません</td>
        </tr>
      `;
      return;
    }

    const records = getRecordsForUser(record.userId).slice(0, 10);
    if (!records.length) {
      historyResults.innerHTML = `
        <tr>
          <td colspan="8" class="muted-table-message">このIDの履歴はまだありません</td>
        </tr>
      `;
      return;
    }

    historyResults.innerHTML = buildHistoryRows(records, record.recordId);
  }

  function buildHistoryRows(records, selectedRecordId) {
    return records
      .map((item) => {
        const summary = summarizeRecord(item);
        const selected = item.recordId === selectedRecordId ? "表示中" : "表示";
        const disabled = item.recordId === selectedRecordId ? " disabled" : "";
        return `
          <tr>
            <td>${escapeHtml(formatDateTime(item.createdAt))}</td>
            <td>${summary.total}</td>
            <td>${summary.accuracy}%</td>
            <td>${summary.hit}</td>
            <td>${summary.miss}</td>
            <td>${summary.false_alarm}</td>
            <td>${formatMsAsSeconds(summary.averageRt)}</td>
            <td><button type="button" class="secondary-action history-button" data-record-id="${escapeHtml(item.recordId)}"${disabled}>${selected}</button></td>
          </tr>
        `;
      })
      .join("");
  }

  function renderRegionResults(results) {
    const rows = REGION_KEYS.map((region) => {
      let hit = 0;
      let miss = 0;
      results.forEach((result) => {
        getResultTargetRegions(result).forEach((targetRegion) => {
          if (targetRegion !== region) {
            return;
          }
          if (result.outcome === "hit") {
            hit += 1;
          } else if (result.outcome === "miss") {
            miss += 1;
          }
        });
      });
      const total = hit + miss;
      const rate = total ? `${Math.round((hit / total) * 1000) / 10}%` : "-";

      return `
        <tr>
          <td>${REGION_LABELS[region]}</td>
          <td class="outcome-hit">${hit}</td>
          <td class="outcome-miss">${miss}</td>
          <td>${total}</td>
          <td>${rate}</td>
        </tr>
      `;
    });

    $("#region-results").innerHTML = rows.join("");
  }

  function renderTrialLog(results) {
    $("#trial-log").innerHTML = results
      .map((result) => {
        const stimuli = getResultStimuli(result);
        const target = result.isTarget ? "対象あり" : "対象なし";
        const rt = formatMsAsSeconds(result.rt);
        const stimulus = formatStimulusSummary(stimuli);
        const entry = formatEntrySummary(stimuli);
        const region = formatRegionSummary(result);

        return `
          <tr>
            <td>${result.trialNumber}</td>
            <td>${escapeHtml(stimulus)}</td>
            <td>${target}</td>
            <td>${escapeHtml(entry)}</td>
            <td>${escapeHtml(region)}</td>
            <td class="outcome-${result.outcome}">${OUTCOME_LABELS[result.outcome]}</td>
            <td>${rt}</td>
          </tr>
        `;
      })
      .join("");
  }

  function getResultStimuli(result) {
    if (Array.isArray(result.stimuli) && result.stimuli.length) {
      return result.stimuli;
    }
    return [
      {
        color: result.color,
        shape: result.shape,
        isTarget: result.isTarget,
        entrySide: result.entrySide,
        region: result.region,
      },
    ];
  }

  function getResultTargetRegions(result) {
    if (Array.isArray(result.targetRegions) && result.targetRegions.length) {
      return result.targetRegions.filter(Boolean);
    }
    if (Array.isArray(result.stimuli) && result.stimuli.length) {
      return result.stimuli
        .filter((stimulus) => stimulus.isTarget)
        .map((stimulus) => stimulus.region)
        .filter(Boolean);
    }
    return result.isTarget && result.region ? [result.region] : [];
  }

  function formatStimulusSummary(stimuli) {
    return summarizeLabels(
      stimuli.map((stimulus) => `${COLORS[stimulus.color] || ""}${SHAPES[stimulus.shape] || ""}`),
      "、",
    );
  }

  function formatEntrySummary(stimuli) {
    return summarizeLabels(
      stimuli.map((stimulus) => ENTRY_LABELS[stimulus.entrySide] || "-"),
      "・",
    );
  }

  function formatRegionSummary(result) {
    const targetRegions = getResultTargetRegions(result);
    const regions = targetRegions.length
      ? targetRegions
      : getResultStimuli(result).map((stimulus) => stimulus.region).filter(Boolean);
    return summarizeLabels(
      regions.map((region) => REGION_LABELS[region] || "-"),
      "・",
    );
  }

  function summarizeLabels(labels, separator) {
    const counts = new Map();
    labels.forEach((label) => {
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, count]) => (count > 1 ? `${label}×${count}` : label))
      .join(separator);
  }

  function summarizeResults(results = state.results) {
    return results.reduce(
      (stats, result) => {
        stats[result.outcome] += 1;
        return stats;
      },
      {
        hit: 0,
        miss: 0,
        false_alarm: 0,
        correct_rejection: 0,
      },
    );
  }

  function saveSessionIfNeeded() {
    if (state.sessionSaved && state.currentRecord) {
      return state.currentRecord;
    }

    const record = {
      recordId: createRecordId(),
      userId: state.activeUserId,
      createdAt: state.settings.trainingDateTime || new Date().toISOString(),
      settings: { ...state.settings },
      results: state.results.map((result) => ({ ...result })),
    };

    if (record.userId && record.results.length) {
      const records = readStoredRecords();
      records.unshift(record);
      writeStoredRecords(records.slice(0, 300));
    }

    state.currentRecord = record;
    state.sessionSaved = true;
    return record;
  }

  function readStoredRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeStoredRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function getRecordsForUser(userId) {
    if (!userId) {
      return [];
    }
    return readStoredRecords()
      .filter((record) => record.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  function getPreviousRecord(record) {
    return getRecordsForUser(record.userId).find((item) => item.recordId !== record.recordId) || null;
  }

  function getRecordById(recordId) {
    return readStoredRecords().find((record) => record.recordId === recordId) || null;
  }

  function createRecordId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function downloadCsv() {
    const record = state.currentRecord || createUnsavedRecord();
    if (!record.results.length) {
      return;
    }

    const header = [
      "試行",
      "刺激",
      "ターゲット有無",
      "侵入方向",
      "領域",
      "結果",
      "反応時間_秒",
      "点滅条件",
      "点滅速度",
    ];
    const rows = record.results.map((result) => {
      const stimuli = getResultStimuli(result);
      return [
        result.trialNumber,
        formatStimulusSummary(stimuli),
        result.isTarget ? "対象あり" : "対象なし",
        formatEntrySummary(stimuli),
        formatRegionSummary(result),
        OUTCOME_LABELS[result.outcome],
        Number.isFinite(result.rt) ? msToSecondsValue(result.rt) : "",
        getBlinkModeLabel(record.settings.blinkMode),
        getBlinkSpeedLabel(record.settings.blinkSpeed, record.settings.blinkMode),
      ];
    });
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `st-attention-training-${record.userId || "no-id"}-${record.createdAt.slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function csvCell(value) {
    const text = String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replaceAll('"', '""')}"`;
    }
    return text;
  }

  function showScreen(screen) {
    [
      homeScreen,
      setupScreen,
      trainingScreen,
      resultScreen,
      gridSetupScreen,
      gridTrainingScreen,
      gridResultScreen,
      tmtSetupScreen,
      tmtTrainingScreen,
      tmtResultScreen,
    ].forEach((item) => {
      item.classList.toggle("is-active", item === screen);
    });
  }

  function showResultPdf(screen, taskName) {
    if (!screen) {
      return;
    }
    if (document.body.classList.contains("is-pdf-preview-result")) {
      clearPdfPreview();
    }
    if (!screen.classList.contains("is-active")) {
      showScreen(screen);
    }

    const date = new Date();
    const dateText = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const previousTitle = document.title;
    document.title = `${taskName} 結果 ${dateText}`;
    window.print();
    document.title = previousTitle;
  }

  function showPdfPreviewNotice(taskName) {
    let notice = document.getElementById("pdf-preview-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "pdf-preview-notice";
      notice.className = "pdf-preview-notice";
      notice.innerHTML = `
        <div>
          <strong>PDF表示中</strong>
          <span>PDF表示を押すと、iPadの印刷/PDF保存画面を開きます。</span>
        </div>
        <button type="button" class="secondary-action compact-action">通常表示に戻る</button>
      `;
      notice.querySelector("button").addEventListener("click", clearPdfPreview);
      document.body.prepend(notice);
    }
    const label = notice.querySelector("strong");
    if (label) {
      label.textContent = `${taskName} PDF表示中`;
    }
  }

  function clearPdfPreview() {
    document.body.classList.remove("is-pdf-preview-result");
    const previousTitle = document.body.dataset.previousTitle;
    if (previousTitle) {
      document.title = previousTitle;
      delete document.body.dataset.previousTitle;
    }
    const notice = document.getElementById("pdf-preview-notice");
    if (notice) {
      notice.remove();
    }
    setPdfButtonLabels(null);
  }

  function setPdfButtonLabels(activeButton) {
    [resultPdfButton, gridResultPdfButton, tmtResultPdfButton].forEach((item) => {
      if (!item) return;
      item.textContent = item === activeButton ? "通常表示に戻る" : "PDF表示";
    });
  }

  function setFeedback(text, outcome) {
    feedback.className = "feedback";
    if (outcome) {
      feedback.classList.add(`is-${outcome}`);
    }
    feedback.textContent = text;
  }

  function randomChoice(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function shuffle(items) {
    const shuffled = items.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function secondsToMs(seconds) {
    return Math.round(seconds * 1000);
  }

  function msToSecondsValue(ms) {
    if (!Number.isFinite(ms)) {
      return null;
    }
    return Math.round((ms / 1000) * 100) / 100;
  }

  function formatMsAsSeconds(ms) {
    const seconds = msToSecondsValue(ms);
    if (seconds === null) {
      return "-";
    }
    return `${formatSecondsPrecise(seconds)} 秒`;
  }

  function formatSecondsPrecise(seconds) {
    if (!Number.isFinite(seconds)) {
      return "-";
    }
    const rounded = Math.round(seconds * 100) / 100;
    return String(rounded).replace(/(\.\d)0$/, "$1");
  }

  function formatSeconds(seconds) {
    return String(Math.round(seconds * 10) / 10);
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function toDateTimeLocalValue(date) {
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  function formatDelta(delta, unit) {
    if (delta === null || !Number.isFinite(delta)) {
      return "-";
    }
    if (delta === 0) {
      return `±0${unit}`;
    }
    const rounded = unit.trim() === "秒"
      ? Math.round(delta * 100) / 100
      : Math.round(delta * 10) / 10;
    return `${delta > 0 ? "+" : ""}${rounded}${unit}`;
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
