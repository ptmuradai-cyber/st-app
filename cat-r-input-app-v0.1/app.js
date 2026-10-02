const STORAGE_KEY = "catr-ipad-assessments-v1";
const BACKUP_VERSION = 1;
const VERSION_INFO = window.CATR_APP_VERSION || {
  version: "0.1.0-local-dev",
  label: "v0.1 local",
};
const APP_VERSION = VERSION_INFO.label;

const state = {
  meta: defaultMeta(),
  values: {},
  sources: {},
  valueOrigins: {},
  activeRecordId: null,
  openAssist: null,
  readOnly: false,
  updateReloading: false,
};

const fields = [
  manual("span_digit_forward", "① Span", "Digit Span", "forward", "桁", 0, 10),
  manual("span_digit_backward", "① Span", "Digit Span", "backward", "桁", 0, 10),
  manual("span_tapping_forward", "① Span", "Tapping Span", "forward", "桁", 0, 10),
  manual("span_tapping_backward", "① Span", "Tapping Span", "backward", "桁", 0, 10),

  manual("vc_triangle_time", "② Cancellation and Detection", "1) Visual Cancellation Ⓐ 図形 △", "所要時間", "sec.", 0, 210),
  rate("vc_triangle_accuracy", "② Cancellation and Detection", "1) Visual Cancellation Ⓐ 図形 △", "正答率", "正答数", "標的数"),
  hitRate("vc_triangle_hit", "② Cancellation and Detection", "1) Visual Cancellation Ⓐ 図形 △", "的中率"),
  manual("vc_symbol_time", "② Cancellation and Detection", "1) Visual Cancellation Ⓐ 図形 ※", "所要時間", "sec.", 0, 210),
  rate("vc_symbol_accuracy", "② Cancellation and Detection", "1) Visual Cancellation Ⓐ 図形 ※", "正答率", "正答数", "標的数"),
  hitRate("vc_symbol_hit", "② Cancellation and Detection", "1) Visual Cancellation Ⓐ 図形 ※", "的中率"),
  manual("vc_number_time", "② Cancellation and Detection", "1) Visual Cancellation Ⓒ 数字 3", "所要時間", "sec.", 0, 210),
  rate("vc_number_accuracy", "② Cancellation and Detection", "1) Visual Cancellation Ⓒ 数字 3", "正答率", "正答数", "標的数"),
  hitRate("vc_number_hit", "② Cancellation and Detection", "1) Visual Cancellation Ⓒ 数字 3", "的中率"),
  manual("vc_kana_time", "② Cancellation and Detection", "1) Visual Cancellation Ⓓ 仮名 か", "所要時間", "sec.", 0, 210),
  rate("vc_kana_accuracy", "② Cancellation and Detection", "1) Visual Cancellation Ⓓ 仮名 か", "正答率", "正答数", "標的数"),
  hitRate("vc_kana_hit", "② Cancellation and Detection", "1) Visual Cancellation Ⓓ 仮名 か", "的中率"),
  rate("auditory_accuracy", "② Cancellation and Detection", "2) Auditory Detection", "正答率", "正答数", "標的数"),
  hitRate("auditory_hit", "② Cancellation and Detection", "2) Auditory Detection", "的中率"),

  rate("mu_3_accuracy", "③ Memory Updating", "3スパン", "正答率", "正答数", "試行数"),
  rate("mu_4_accuracy", "③ Memory Updating", "4スパン", "正答率", "正答数", "試行数"),

  rate("pasat_2_accuracy", "④ PASAT", "2秒条件", "正答率", "正答数", "総問題数"),
  rate("pasat_1_accuracy", "④ PASAT", "1秒条件", "正答率", "正答数", "総問題数"),

  manual("cpt_srt_rt", "⑤ CPT-2 Continuous Performance Test-2", "平均反応時間", "SRT課題", "m sec.", 0, 800),
  manual("cpt_x_rt", "⑤ CPT-2 Continuous Performance Test-2", "平均反応時間", "X課題", "m sec.", 0, 800),
  manual("cpt_ax_rt", "⑤ CPT-2 Continuous Performance Test-2", "平均反応時間", "AX課題", "m sec.", 0, 800),
  manual("cpt_srt_error", "⑤ CPT-2 Continuous Performance Test-2", "誤反応", "SRT課題", "回", null, null, { abnormalAt: 4 }),
  manual("cpt_x_error", "⑤ CPT-2 Continuous Performance Test-2", "誤反応", "X課題", "回", null, null, { abnormalAt: 10 }),
  manual("cpt_ax_error", "⑤ CPT-2 Continuous Performance Test-2", "誤反応", "AX課題", "回", null, null, { abnormalAt: 11 }),
  rate("cpt_srt_accuracy", "⑤ CPT-2 Continuous Performance Test-2", "正答率", "SRT課題", "正答数", "標的数"),
  rate("cpt_x_accuracy", "⑤ CPT-2 Continuous Performance Test-2", "正答率", "X課題", "正答数", "標的数"),
  rate("cpt_ax_accuracy", "⑤ CPT-2 Continuous Performance Test-2", "正答率", "AX課題", "正答数", "標的数"),
  hitRate("cpt_srt_hit", "⑤ CPT-2 Continuous Performance Test-2", "的中率", "SRT課題"),
  hitRate("cpt_x_hit", "⑤ CPT-2 Continuous Performance Test-2", "的中率", "X課題"),
  hitRate("cpt_ax_hit", "⑤ CPT-2 Continuous Performance Test-2", "的中率", "AX課題"),
  corrected("cpt_srt_corrected", "⑤ CPT-2 Continuous Performance Test-2", "修正正答率", "SRT課題"),
  corrected("cpt_x_corrected", "⑤ CPT-2 Continuous Performance Test-2", "修正正答率", "X課題"),
  corrected("cpt_ax_corrected", "⑤ CPT-2 Continuous Performance Test-2", "修正正答率", "AX課題"),
  coefficient("cpt_srt_cv", "⑤ CPT-2 Continuous Performance Test-2", "変動係数", "SRT課題", "cpt_srt_rt"),
  coefficient("cpt_x_cv", "⑤ CPT-2 Continuous Performance Test-2", "変動係数", "X課題", "cpt_x_rt"),
  coefficient("cpt_ax_cv", "⑤ CPT-2 Continuous Performance Test-2", "変動係数", "AX課題", "cpt_ax_rt"),
];

const fieldById = Object.fromEntries(fields.map((field) => [field.id, field]));

function manual(id, group, subtest, metric, unit, min, max, extra = {}) {
  return {
    id,
    group,
    subtest,
    metric,
    unit,
    min,
    max,
    mode: "manual",
    rangeLabel: rangeLabel(min, max, extra),
    ...extra,
  };
}

function rate(id, group, subtest, metric, correctLabel, denominatorLabel) {
  return {
    id,
    group,
    subtest,
    metric,
    unit: "%",
    min: 0,
    max: 100,
    mode: "calculated",
    calcType: "rate",
    rangeLabel: "0〜100",
    sources: [
      { key: "correct", label: correctLabel, min: 0 },
      { key: "denominator", label: denominatorLabel, min: 1 },
    ],
    formulaLabel: `${correctLabel} ÷ ${denominatorLabel} × 100`,
  };
}

function hitRate(id, group, subtest, metric = "的中率") {
  return {
    id,
    group,
    subtest,
    metric,
    unit: "%",
    min: 0,
    max: 100,
    mode: "calculated",
    calcType: "hitRate",
    rangeLabel: "0〜100",
    sources: [
      { key: "correct", label: "正答数", min: 0 },
      { key: "responses", label: "反応数", min: 1 },
    ],
    formulaLabel: "正答数 ÷ 反応数 × 100",
  };
}

function corrected(id, group, subtest, metric) {
  return {
    id,
    group,
    subtest,
    metric,
    unit: "%",
    min: 0,
    max: 100,
    mode: "calculated",
    calcType: "corrected",
    rangeLabel: "0〜100 / 定義確認",
    sources: [
      { key: "correct", label: "正答数", min: 0 },
      { key: "falsePositive", label: "誤反応数", min: 0 },
      { key: "denominator", label: "標的数", min: 1 },
    ],
    formulaLabel: "暫定: (正答数 − 誤反応数) ÷ 標的数 × 100",
    caution: "修正正答率は正式定義確認後に固定してください。",
  };
}

function coefficient(id, group, subtest, metric, meanFieldId) {
  return {
    id,
    group,
    subtest,
    metric,
    unit: "",
    min: 0,
    max: 30,
    mode: "calculated",
    calcType: "cv",
    rangeLabel: "0〜30",
    meanFieldId,
    sources: [
      { key: "sd", label: "反応時間SD", min: 0 },
    ],
    formulaLabel: "反応時間SD ÷ 平均反応時間 × 100",
  };
}

function rangeLabel(min, max, extra = {}) {
  if (extra.abnormalAt != null) return `${extra.abnormalAt}≦異常`;
  if (min != null && max != null) {
    if (max === 800) return "0.0〜800.0";
    return `${min}〜${max}`;
  }
  return "";
}

function defaultMeta(overrides = {}) {
  return {
    patientId: "",
    patientAge: "",
    testDate: todayString(),
    ...overrides,
  };
}

function metaInputIds() {
  return ["patientId", "patientAge", "testDate"];
}

function metaForStorage() {
  return {
    patientId: state.meta.patientId,
    patientAge: state.meta.patientAge,
    testDate: state.meta.testDate,
  };
}

function initialize() {
  hydrateDefaultValues();
  bindMetaInputs();
  bindTabs();
  bindActions();
  renderAll();
  initializePwaStatus();
  registerServiceWorker();
}

function hydrateDefaultValues() {
  document.getElementById("testDate").value = state.meta.testDate;
  document.getElementById("versionLabel").textContent = APP_VERSION;
}

function bindMetaInputs() {
  metaInputIds().forEach((id) => {
    const input = document.getElementById(id);
    input.value = state.meta[id] ?? "";
    input.addEventListener("input", () => {
      state.meta[id] = input.value;
      renderMeta();
      renderSummary();
    });
  });
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("is-active"));
      document.querySelectorAll(".view").forEach((view) => view.classList.remove("is-active"));
      button.classList.add("is-active");
      document.getElementById(`${button.dataset.tab}View`).classList.add("is-active");
      if (button.dataset.tab === "summary") renderSummary();
      if (button.dataset.tab === "records") renderRecords();
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    });
  });
}

function bindActions() {
  document.getElementById("refreshButton").addEventListener("click", refreshAppShell);
  document.getElementById("editButton").addEventListener("click", enableRecordEditing);
  document.getElementById("saveButton").addEventListener("click", saveCurrent);
  document.getElementById("printButton").addEventListener("click", printReport);
  document.getElementById("copyImpressionButton").addEventListener("click", copyImpressionDraft);
  document.getElementById("exportButton").addEventListener("click", exportRecords);
  document.getElementById("importButton").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", importRecords);
  document.getElementById("clearAllButton").addEventListener("click", clearAllRecords);
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("print-report");
    const sheet = document.getElementById("printProfileSheet");
    if (sheet) sheet.setAttribute("aria-hidden", "true");
  });
}

function refreshAppShell() {
  const serviceWorker = getServiceWorkerApi();
  const button = document.getElementById("refreshButton");
  if (!serviceWorker || window.location.protocol === "file:" || !window.isSecureContext) {
    updateOfflineStatus("HTTPS接続が必要");
    flashButton(button, "確認不可");
    return;
  }

  updateOfflineStatus("最新版確認中");
  button.disabled = true;

  checkMacServerForUpdate()
    .then(() => serviceWorker.getRegistration())
    .then((registration) => registration || serviceWorker.register("./service-worker.js"))
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
      flashButton(button, "最新版");
    })
    .catch(() => {
      updateOfflineStatus("確認できません");
      flashButton(button, "確認不可");
    })
    .finally(() => {
      window.setTimeout(() => {
        button.disabled = false;
      }, 700);
    });
}

function checkMacServerForUpdate() {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller ? window.setTimeout(() => controller.abort(), 4000) : null;
  const url = `./version.js?catrUpdateCheck=${Date.now()}`;

  return fetch(url, {
    cache: "no-store",
    signal: controller?.signal,
  }).then((response) => {
    if (timeout) window.clearTimeout(timeout);
    if (!response.ok) throw new Error("version check failed");
    return response.text();
  }).then((text) => {
    if (!text.includes("CATR_APP_VERSION")) {
      throw new Error("version marker missing");
    }
    return text;
  }).catch((error) => {
    if (timeout) window.clearTimeout(timeout);
    throw error;
  });
}

function renderAll() {
  renderMeta();
  renderInputRows();
  renderSummary();
  renderRecords();
  applyFormMode();
}

function renderMeta() {
  const age = toNumber(state.meta.patientAge);
  document.getElementById("ageBand").value = ageBand(age);
}

function renderInputRows() {
  const tbody = document.getElementById("inputRows");
  tbody.innerHTML = "";
  const tabOrder = { current: 10 };

  fields.forEach((field) => {
    const row = document.createElement("tr");
    row.dataset.fieldId = field.id;
    row.appendChild(cell(field.group, "group-cell"));
    row.appendChild(cell(field.subtest, "subtest-cell"));
    row.appendChild(cell(field.metric, "metric-cell"));
    row.appendChild(valueCell(field, tabOrder.current++));
    row.appendChild(cell(field.unit, "unit-cell"));
    row.appendChild(rangeCell(field));
    tbody.appendChild(row);

    if (state.openAssist === field.id) {
      tbody.appendChild(assistRow(field, tabOrder));
    }
  });
}

function cell(text, className) {
  const td = document.createElement("td");
  td.className = className;
  td.textContent = text;
  return td;
}

function valueCell(field, tabIndex) {
  const td = document.createElement("td");
  td.className = "value-cell";
  const wrap = document.createElement("div");
  wrap.className = `input-control ${field.mode === "calculated" ? "calculated" : ""}`;

  const input = document.createElement("input");
  input.type = "number";
  input.inputMode = "decimal";
  input.step = stepForField(field);
  input.tabIndex = tabIndex;
  input.dataset.fieldInput = field.id;
  input.value = displayValueForField(field, getFieldValue(field));
  input.dataset.valueOrigin = state.valueOrigins[field.id] || "";
  input.ariaLabel = `${field.subtest} ${field.metric}`;
  input.disabled = state.readOnly;
  input.addEventListener("input", () => {
    state.values[field.id] = input.value;
    if (field.mode === "calculated") {
      state.valueOrigins[field.id] = "manual";
      input.dataset.valueOrigin = "manual";
    }
    recalculateDependents(field.id);
    renderSummary();
    updateRowStatus(field);
  });
  input.addEventListener("blur", () => {
    const normalized = normalizeValueForField(field, input.value);
    if (normalized === input.value) return;
    state.values[field.id] = normalized;
    input.value = normalized;
    renderSummary();
    updateRowStatus(field);
  });

  wrap.appendChild(input);

  if (field.mode === "calculated") {
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "calc-toggle";
    toggle.textContent = "計";
    toggle.title = "計算補助";
    toggle.ariaLabel = `${field.metric}の計算補助`;
    toggle.tabIndex = -1;
    toggle.disabled = state.readOnly;
    toggle.addEventListener("click", () => {
      if (state.readOnly) return;
      state.openAssist = state.openAssist === field.id ? null : field.id;
      renderInputRows();
    });
    wrap.appendChild(toggle);
  }

  td.appendChild(wrap);
  return td;
}

function rangeCell(field) {
  const td = document.createElement("td");
  td.className = "range-cell";
  const status = statusForField(field);
  const pill = document.createElement("span");
  pill.className = `status-pill ${status.level}`;
  pill.dataset.statusFor = field.id;
  pill.textContent = status.label || field.rangeLabel || "入力";
  td.appendChild(pill);
  return td;
}

function updateRowStatus(field) {
  const pill = document.querySelector(`[data-status-for="${field.id}"]`);
  if (!pill) return;
  const status = statusForField(field);
  pill.className = `status-pill ${status.level}`;
  pill.textContent = status.label || field.rangeLabel || "入力";
}

function assistRow(field, tabOrder) {
  const template = document.getElementById("assistTemplate");
  const row = template.content.firstElementChild.cloneNode(true);
  const panel = row.querySelector(".assist-panel");

  field.sources.forEach((source) => {
    const label = document.createElement("label");
    const span = document.createElement("span");
    span.textContent = source.label;
    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "decimal";
    input.step = source.key === "sd" ? "0.1" : "1";
    input.tabIndex = tabOrder.current++;
    input.min = source.min ?? "";
    input.ariaLabel = `${field.subtest} ${field.metric} ${source.label}`;
    input.dataset.sourceInput = field.id;
    input.value = state.sources[field.id]?.[source.key] ?? "";
    input.disabled = state.readOnly;
    input.addEventListener("input", () => {
      if (state.readOnly) return;
      if (!state.sources[field.id]) state.sources[field.id] = {};
      state.sources[field.id][source.key] = input.value;
      setCalculatedValue(field, "auto");
      updateValueInput(field);
      updateRowStatus(field);
      renderSummary();
    });
    label.appendChild(span);
    label.appendChild(input);
    panel.appendChild(label);
  });

  if (field.calcType === "cv") {
    const label = document.createElement("label");
    const span = document.createElement("span");
    span.textContent = "平均反応時間";
    const input = document.createElement("input");
    input.value = displayValueForField(fieldById[field.meanFieldId], state.values[field.meanFieldId]);
    input.readOnly = true;
    input.tabIndex = -1;
    input.ariaLabel = `${field.subtest} ${field.metric} 平均反応時間`;
    label.appendChild(span);
    label.appendChild(input);
    panel.appendChild(label);
  }

  const formula = document.createElement("div");
  formula.className = "formula-note";
  formula.textContent = field.formulaLabel;
  panel.appendChild(formula);

  const actions = document.createElement("div");
  actions.className = "assist-actions";
  const apply = document.createElement("button");
  apply.type = "button";
  apply.className = "small-button";
  apply.textContent = "計算値を反映";
  apply.tabIndex = -1;
  apply.disabled = state.readOnly;
  apply.addEventListener("click", () => {
    if (state.readOnly) return;
    setCalculatedValue(field, "auto");
    updateValueInput(field);
    updateRowStatus(field);
    renderSummary();
  });
  actions.appendChild(apply);
  panel.appendChild(actions);

  if (field.caution) {
    const note = document.createElement("div");
    note.className = "assist-note";
    note.textContent = field.caution;
    panel.appendChild(note);
  }

  return row;
}

function setCalculatedValue(field, origin = "auto") {
  state.values[field.id] = calculateField(field);
  state.valueOrigins[field.id] = origin;
  return state.values[field.id];
}

function getFieldValue(field) {
  if (field.mode === "calculated") {
    if (state.valueOrigins[field.id] === "manual") return state.values[field.id] ?? "";
    if (state.values[field.id] !== "" && state.values[field.id] != null) return state.values[field.id];
    if (hasSourceValues(field)) return setCalculatedValue(field, "auto");
  }
  return state.values[field.id] ?? "";
}

function updateValueInput(field) {
  const input = document.querySelector(`[data-field-input="${field.id}"]`);
  if (!input) return;
  input.value = displayValueForField(field, state.values[field.id]);
  input.dataset.valueOrigin = state.valueOrigins[field.id] || "";
}

function recalculateDependents(changedFieldId) {
  fields
    .filter((field) => field.mode === "calculated" && field.meanFieldId === changedFieldId)
    .forEach((field) => {
      if (!hasSourceValues(field) || state.valueOrigins[field.id] === "manual") return;
      setCalculatedValue(field, "auto");
      updateValueInput(field);
      updateRowStatus(field);
    });
}

function hasSourceValues(field) {
  const src = state.sources[field.id] || {};
  return Object.values(src).some((value) => value !== "" && value != null);
}

function calculateField(field) {
  const src = state.sources[field.id] || {};
  if (field.calcType === "rate" || field.calcType === "hitRate") {
    return percent(toNumber(src.correct), toNumber(src.denominator ?? src.responses));
  }
  if (field.calcType === "corrected") {
    const correct = toNumber(src.correct);
    const falsePositive = toNumber(src.falsePositive);
    const denominator = toNumber(src.denominator);
    if (correct == null || falsePositive == null || denominator == null || denominator <= 0) return "";
    return percentValue(clamp(((correct - falsePositive) / denominator) * 100, 0, 100));
  }
  if (field.calcType === "cv") {
    const sd = toNumber(src.sd);
    const mean = toNumber(state.values[field.meanFieldId]);
    if (sd == null || mean == null || mean <= 0) return "";
    return round1((sd / mean) * 100);
  }
  return "";
}

function percent(numerator, denominator) {
  if (numerator == null || denominator == null || denominator <= 0) return "";
  return percentValue(clamp((numerator / denominator) * 100, 0, 100));
}

function statusForField(field) {
  const value = toNumber(getFieldValue(field));
  if (value == null) {
    if (field.mode === "calculated") return { level: "warn", label: "未入力" };
    return { level: "", label: field.rangeLabel };
  }

  if (field.abnormalAt != null) {
    return value >= field.abnormalAt
      ? { level: "bad", label: "異常" }
      : { level: "ok", label: "正常" };
  }

  if ((field.min != null && value < field.min) || (field.max != null && value > field.max)) {
    return { level: "bad", label: "範囲外" };
  }

  if (field.mode === "calculated") {
    if (state.valueOrigins[field.id] === "manual") return { level: "manual", label: "手入力" };
    if (state.valueOrigins[field.id] === "auto") return { level: "ok", label: "自動計算" };
    return { level: "ok", label: "入力済" };
  }
  return { level: "ok", label: field.rangeLabel || "入力済" };
}

function renderSummary() {
  const completed = fields.filter((field) => toNumber(getFieldValue(field)) != null).length;
  const abnormal = fields.filter((field) => field.abnormalAt != null && statusForField(field).level === "bad").length;
  const calculated = fields.filter((field) => field.mode === "calculated" && toNumber(getFieldValue(field)) != null).length;
  const previousRecord = findPreviousRecord();
  const age = toNumber(state.meta.patientAge);

  document.getElementById("summaryCards").innerHTML = [
    card(`${completed}/${fields.length}`, "入力済み"),
    card(ageBand(age), "基準年代"),
    card(String(abnormal), "CPT-2誤反応 異常"),
    card(String(calculated), "計算欄入力済み"),
    card(previousRecord ? (previousRecord.meta.testDate || formatDateTime(previousRecord.savedAt)) : "なし", "比較対象"),
    card(state.meta.patientId || "未入力", "利用者ID"),
  ].join("");

  renderCompletion();
  renderMissingList();
  renderComparisonPanel(previousRecord);
  renderImpressionDraft(previousRecord);
  renderResultRows();
}

function card(value, label) {
  return `<div class="summary-card"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function renderCompletion() {
  const groups = [...new Set(fields.map((field) => field.group))];
  const html = groups.map((group) => {
    const groupFields = fields.filter((field) => field.group === group);
    const done = groupFields.filter((field) => toNumber(getFieldValue(field)) != null).length;
    return `<div class="completion-item"><strong>${escapeHtml(group)}</strong><span class="status-pill ${done === groupFields.length ? "ok" : "warn"}">${done}/${groupFields.length}</span></div>`;
  }).join("");
  document.getElementById("completionList").innerHTML = html;
}

function renderMissingList() {
  const missing = missingFields();
  const badge = document.getElementById("missingBadge");
  badge.className = `status-pill ${missing.length ? "warn" : "ok"}`;
  badge.textContent = missing.length ? `${missing.length}項目` : "なし";

  const list = document.getElementById("missingList");
  if (!missing.length) {
    list.innerHTML = `<p class="empty-state">入力漏れはありません。</p>`;
    return;
  }

  const shown = missing.slice(0, 18).map((field) =>
    `<li><strong>${escapeHtml(field.group)}</strong><span>${escapeHtml(field.subtest)} / ${escapeHtml(field.metric)}</span></li>`
  ).join("");
  const rest = missing.length > 18 ? `<p class="panel-note">ほか ${missing.length - 18} 項目</p>` : "";
  list.innerHTML = `<ul>${shown}</ul>${rest}`;
}

function missingFields() {
  return fields.filter((field) => toNumber(getFieldValue(field)) == null);
}

function renderComparisonPanel(previousRecord = findPreviousRecord()) {
  const panel = document.getElementById("comparisonPanel");
  if (!patientLookupKey(state.meta)) {
    panel.innerHTML = `<p class="empty-state">利用者IDを入力すると、保存済みデータから前回値を探します。</p>`;
    return;
  }
  if (!previousRecord) {
    panel.innerHTML = `<p class="empty-state">同じ患者の前回データはまだありません。</p>`;
    return;
  }

  const comparisons = comparisonRows(previousRecord);
  const changed = comparisons.filter((item) => item.diffLabel && item.diff !== 0);
  const rows = (changed.length ? changed : comparisons.filter((item) => item.current != null && item.previous != null).slice(0, 8))
    .slice(0, 12)
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.field.subtest)} / ${escapeHtml(item.field.metric)}</td>
        <td>${escapeHtml(displayValueForField(item.field, item.current))}</td>
        <td>${escapeHtml(displayValueForField(item.field, item.previous))}</td>
        <td><span class="status-pill ${item.level}">${escapeHtml(item.diffLabel || "±0")}</span></td>
      </tr>
    `).join("");

  panel.innerHTML = `
    <div class="comparison-head">
      <strong>比較対象</strong>
      <span>${escapeHtml(previousRecord.meta.testDate || formatDateTime(previousRecord.savedAt))}</span>
    </div>
    <div class="result-table-wrap compact-table">
      <table class="comparison-table">
        <thead>
          <tr><th>項目</th><th>今回</th><th>前回</th><th>変化</th></tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="4">比較できる入力値がありません。</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function renderImpressionDraft(previousRecord = findPreviousRecord()) {
  const textarea = document.getElementById("impressionDraft");
  textarea.value = createImpressionDraft(previousRecord);
}

function createImpressionDraft(previousRecord = findPreviousRecord()) {
  const completed = fields.filter((field) => toNumber(getFieldValue(field)) != null).length;
  const missing = missingFields();
  const abnormalFields = fields.filter((field) => field.abnormalAt != null && statusForField(field).level === "bad");
  const outOfRange = fields.filter((field) => statusForField(field).label === "範囲外");
  const lines = [];

  const patient = state.meta.patientId || "対象者";
  lines.push(`${patient}のCAT-R成績について、${completed}/${fields.length}項目が入力済み。`);

  if (missing.length) {
    lines.push(`未入力項目が${missing.length}項目あり、結果解釈時には未実施または未入力項目の確認が必要。`);
  } else {
    lines.push("主要入力項目はすべて入力済み。");
  }

  if (abnormalFields.length) {
    lines.push(`CPT-2誤反応では、${fieldListText(abnormalFields)}で基準を超える反応がみられる。`);
  } else {
    lines.push("CPT-2誤反応は、入力範囲内では異常判定に該当する項目を認めない。");
  }

  if (outOfRange.length) {
    lines.push(`入力範囲外の値として、${fieldListText(outOfRange)}を確認。入力値または単位の再確認を推奨。`);
  }

  if (previousRecord) {
    const changed = comparisonRows(previousRecord).filter((item) => item.diffLabel && item.diff !== 0);
    const improved = changed.filter((item) => item.level === "ok").slice(0, 5);
    const declined = changed.filter((item) => item.level === "bad").slice(0, 5);
    lines.push(`前回（${previousRecord.meta.testDate || formatDateTime(previousRecord.savedAt)}）との比較では、${changed.length}項目に変化あり。`);
    if (improved.length) lines.push(`改善方向の変化: ${fieldListText(improved.map((item) => item.field))}。`);
    if (declined.length) lines.push(`低下方向の変化: ${fieldListText(declined.map((item) => item.field))}。`);
  } else {
    lines.push("同一患者の前回データは未登録のため、経時比較は未実施。");
  }

  return lines.join("\n");
}

function fieldListText(list) {
  return list.map((field) => `${field.subtest} ${field.metric}`).join("、");
}

async function copyImpressionDraft() {
  const textarea = document.getElementById("impressionDraft");
  try {
    await navigator.clipboard.writeText(textarea.value);
    flashButton(document.getElementById("copyImpressionButton"), "コピー済");
  } catch {
    textarea.select();
    document.execCommand("copy");
    flashButton(document.getElementById("copyImpressionButton"), "コピー済");
  }
}

function renderResultRows() {
  const tbody = document.getElementById("resultRows");
  const previousRecord = findPreviousRecord();
  tbody.innerHTML = "";
  fields.forEach((field) => {
    const comparison = previousRecord ? comparisonForField(field, previousRecord) : null;
    const row = document.createElement("tr");
    row.appendChild(cell(`${field.subtest} / ${field.metric}`, ""));
    row.appendChild(cell(displayValueForField(field, getFieldValue(field)), ""));
    row.appendChild(cell(comparison ? displayValueForField(field, comparison.previous) : "", ""));
    const diffTd = document.createElement("td");
    if (comparison?.diffLabel) {
      const pill = document.createElement("span");
      pill.className = `status-pill ${comparison.level}`;
      pill.textContent = comparison.diffLabel;
      diffTd.appendChild(pill);
    }
    row.appendChild(diffTd);
    row.appendChild(cell(field.unit, ""));
    const status = statusForField(field);
    const statusTd = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = `status-pill ${status.level}`;
    pill.textContent = status.label || "";
    statusTd.appendChild(pill);
    row.appendChild(statusTd);
    tbody.appendChild(row);
  });
}

function findPreviousRecord() {
  const key = patientLookupKey(state.meta);
  if (!key) return null;
  const currentDate = recordComparableDate({ meta: state.meta, savedAt: new Date().toISOString() });
  const records = loadRecords()
    .filter((record) => record.id !== state.activeRecordId)
    .filter((record) => patientLookupKey(record.meta) === key)
    .map((record) => ({ record, date: recordComparableDate(record) }))
    .sort((a, b) => b.date - a.date);

  return records.find((item) => item.date < currentDate)?.record || records[0]?.record || null;
}

function patientLookupKey(meta) {
  const id = normalizeText(meta?.patientId);
  if (id) return `id:${id}`;
  return "";
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function recordComparableDate(record) {
  const testDate = Date.parse(record.meta?.testDate || "");
  if (Number.isFinite(testDate)) return testDate;
  const savedAt = Date.parse(record.savedAt || "");
  return Number.isFinite(savedAt) ? savedAt : 0;
}

function comparisonRows(previousRecord) {
  return fields.map((field) => comparisonForField(field, previousRecord));
}

function comparisonForField(field, previousRecord) {
  const current = toNumber(getFieldValue(field));
  const previous = toNumber(previousRecord?.values?.[field.id]);
  if (current == null || previous == null) {
    return { field, current, previous, diff: null, diffLabel: "", level: "" };
  }
  const diff = field.unit === "%" ? trunc1(current - previous) : round1(current - previous);
  const abs = Math.abs(diff);
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "±";
  const level = comparisonLevel(field, diff);
  return {
    field,
    current,
    previous,
    diff,
    diffLabel: diff === 0 ? "±0" : `${sign}${displayValueForField(field, abs)}`,
    level,
  };
}

function comparisonLevel(field, diff) {
  if (diff === 0) return "";
  const direction = preferredDirection(field);
  if (direction === "lower") return diff < 0 ? "ok" : "bad";
  if (direction === "higher") return diff > 0 ? "ok" : "bad";
  return "manual";
}

function preferredDirection(field) {
  if (field.abnormalAt != null) return "lower";
  if (field.calcType === "cv") return "lower";
  if (field.metric.includes("所要時間") || field.subtest.includes("平均反応時間")) return "lower";
  if (field.metric.includes("誤反応")) return "lower";
  if (field.unit === "%" || field.unit === "桁") return "higher";
  return "";
}

function saveCurrent() {
  if (state.readOnly) {
    alert("履歴データは参照中です。修正する場合は先に「編集」を押してください。");
    return;
  }

  const missing = missingFields();
  if (missing.length && !confirm(`未入力が${missing.length}項目あります。このまま保存しますか。`)) {
    document.querySelector('[data-tab="summary"]').click();
    return;
  }
  const records = loadRecords();
  const existingIndex = records.findIndex((entry) => entry.id === state.activeRecordId);
  const existing = existingIndex >= 0 ? records[existingIndex] : null;
  const id = existing?.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
  const record = {
    id,
    savedAt: existing?.savedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meta: metaForStorage(),
    values: { ...state.values },
    sources: structuredCloneSafe(state.sources),
    valueOrigins: { ...state.valueOrigins },
  };
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.unshift(record);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 100)));
  clearCurrentAssessment();
  flashSaveButton();
}

function flashSaveButton() {
  const button = document.getElementById("saveButton");
  flashButton(button, "保存済");
}

function flashButton(button, text) {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = original;
  }, 900);
}

function clearCurrentAssessment() {
  state.meta = defaultMeta();
  state.values = {};
  state.sources = {};
  state.valueOrigins = {};
  state.activeRecordId = null;
  state.openAssist = null;
  state.readOnly = false;
  syncMetaInputs();
  renderAll();
  document.querySelector('[data-tab="input"]').click();
}

function enableRecordEditing() {
  if (!state.activeRecordId) return;
  state.readOnly = false;
  applyFormMode();
  renderInputRows();
  renderSummary();
  flashButton(document.getElementById("editButton"), "編集中");
}

function applyFormMode() {
  const editButton = document.getElementById("editButton");
  const saveButton = document.getElementById("saveButton");
  const isLockedRecord = state.readOnly && Boolean(state.activeRecordId);

  editButton.classList.toggle("is-hidden", !isLockedRecord);
  saveButton.disabled = state.readOnly;

  metaInputIds().forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.disabled = state.readOnly;
  });

  document.querySelectorAll("[data-field-input], [data-source-input]").forEach((input) => {
    input.disabled = state.readOnly;
  });

  document.querySelectorAll(".calc-toggle, .assist-actions button").forEach((button) => {
    button.disabled = state.readOnly;
  });
}

function renderRecords() {
  const list = document.getElementById("recordList");
  const records = loadRecords();
  if (!records.length) {
    list.innerHTML = `<p class="empty-state">保存済みデータはありません。</p>`;
    return;
  }
  list.innerHTML = "";
  records.forEach((record) => {
    const item = document.createElement("div");
    item.className = "record-item";
    const title = document.createElement("div");
    const name = record.meta.patientId || "無題";
    title.innerHTML = `<strong>${escapeHtml(name)}</strong><br><span>${escapeHtml(record.meta.testDate || "")}</span>`;
    const actions = document.createElement("div");
    actions.className = "record-actions";
    const load = document.createElement("button");
    load.type = "button";
    load.className = "small-button";
    load.textContent = "参照";
    load.addEventListener("click", () => loadRecord(record.id));
    const del = document.createElement("button");
    del.type = "button";
    del.className = "small-button danger";
    del.textContent = "削除";
    del.addEventListener("click", () => deleteRecord(record.id));
    actions.append(load, del);
    item.append(title, actions);
    list.appendChild(item);
  });
}

function loadRecord(id) {
  const record = loadRecords().find((entry) => entry.id === id);
  if (!record) return;
  state.meta = { ...defaultMeta(), ...record.meta };
  state.values = { ...record.values };
  state.sources = structuredCloneSafe(record.sources || {});
  state.valueOrigins = { ...(record.valueOrigins || {}) };
  state.activeRecordId = record.id;
  state.openAssist = null;
  state.readOnly = true;
  syncMetaInputs();
  renderAll();
  document.querySelector('[data-tab="input"]').click();
}

function deleteRecord(id) {
  const records = loadRecords().filter((entry) => entry.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  if (state.activeRecordId === id) {
    clearCurrentAssessment();
    return;
  }
  renderSummary();
  renderRecords();
}

function clearAllRecords() {
  if (!confirm("保存済みデータをすべて削除しますか。")) return;
  localStorage.removeItem(STORAGE_KEY);
  clearCurrentAssessment();
}

function exportRecords() {
  const records = loadRecords();
  if (!records.length) {
    alert("書き出す保存済みデータがありません。");
    return;
  }

  const backup = {
    app: "CAT-R結果入力",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    records,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cat-r-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importRecords(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      const imported = normalizeImportedRecords(payload);
      if (!imported.length) {
        alert("読み込める保存データが見つかりませんでした。");
        return;
      }

      const current = loadRecords();
      const merged = mergeRecords(current, imported);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.slice(0, 200)));
      renderSummary();
      renderRecords();
      alert(`${imported.length}件のデータを読み込みました。`);
    } catch {
      alert("読み込みに失敗しました。ファイル形式を確認してください。");
    }
  });
  reader.readAsText(file);
}

function normalizeImportedRecords(payload) {
  const records = Array.isArray(payload) ? payload : payload.records;
  if (!Array.isArray(records)) return [];
  return records
    .filter((record) => record && typeof record === "object" && record.meta && record.values)
    .map((record) => ({
      id: record.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
      savedAt: record.savedAt || new Date().toISOString(),
      meta: { ...record.meta },
      values: { ...record.values },
      sources: structuredCloneSafe(record.sources || {}),
      valueOrigins: { ...(record.valueOrigins || {}) },
    }));
}

function mergeRecords(current, imported) {
  const byId = new Map();
  [...imported, ...current].forEach((record) => byId.set(record.id, record));
  return [...byId.values()].sort((a, b) => Date.parse(b.savedAt || "") - Date.parse(a.savedAt || ""));
}

function printReport() {
  renderSummary();
  renderPrintProfileSheet();
  document.querySelector('[data-tab="summary"]').click();
  document.body.classList.add("print-report");
  window.print();
}

function renderPrintProfileSheet() {
  const sheet = document.getElementById("printProfileSheet");
  if (!sheet) return;

  const age = toNumber(state.meta.patientAge);
  const patientItems = [
    ["利用者ID", state.meta.patientId || "未入力"],
    ["年齢", state.meta.patientAge ? `${state.meta.patientAge}歳` : ""],
    ["実施日", state.meta.testDate || ""],
    ["基準年代", ageBand(age) || ""],
  ];
  const rows = fields.map((field) => {
    const value = displayValueForField(field, getFieldValue(field));
    const unit = value && field.unit ? ` ${field.unit}` : "";
    const status = statusForField(field);
    return {
      name: `${field.subtest} / ${field.metric}`,
      score: value ? `${value}${unit}` : "未入力",
      status: status.label || "",
    };
  });
  const chunkSize = Math.ceil(rows.length / 3);
  const columns = [0, 1, 2].map((index) => rows.slice(index * chunkSize, (index + 1) * chunkSize));

  sheet.innerHTML = `
    <div class="print-sheet-header">
      <div>
        <p>CAT-R</p>
        <h1>プロフィール一覧</h1>
      </div>
      <span>${escapeHtml(APP_VERSION)}</span>
    </div>
    <div class="print-patient-grid">
      ${patientItems.map(([label, value]) => `
        <div class="print-patient-cell">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `).join("")}
    </div>
    <div class="print-profile-columns">
      ${columns.map((column) => `
        <div class="print-profile-column">
          <div class="print-profile-row print-profile-row--head">
            <span>項目</span>
            <strong>点数</strong>
            <em>判定</em>
          </div>
          ${column.map((row) => `
            <div class="print-profile-row">
              <span>${escapeHtml(row.name)}</span>
              <strong>${escapeHtml(row.score)}</strong>
              <em>${escapeHtml(row.status)}</em>
            </div>
          `).join("")}
        </div>
      `).join("")}
    </div>
  `;
  sheet.setAttribute("aria-hidden", "false");
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function syncMetaInputs() {
  metaInputIds().forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = state.meta[id] ?? "";
  });
}

function ageBand(age) {
  if (age == null) return "";
  if (age < 30) return "20歳代";
  if (age < 40) return "30歳代";
  if (age < 50) return "40歳代";
  if (age < 60) return "50歳代";
  if (age < 70) return "60歳代";
  if (age < 80) return "70歳代";
  return "80歳代";
}

function toNumber(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function displayValue(value) {
  if (value === "" || value == null) return "";
  return String(value);
}

function displayValueForField(field, value) {
  if (value === "" || value == null) return "";
  if (field?.unit !== "%") return displayValue(value);
  const number = toNumber(value);
  return number == null ? displayValue(value) : percentValue(number).toFixed(1);
}

function normalizeValueForField(field, value) {
  if (value === "" || value == null) return "";
  if (field?.unit !== "%") return value;
  const number = toNumber(value);
  return number == null ? value : percentValue(number).toFixed(1);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function round1(number) {
  return Math.round(number * 10) / 10;
}

function trunc1(number) {
  return Math.trunc(number * 10) / 10;
}

function percentValue(number) {
  return trunc1(number);
}

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function stepForField(field) {
  if (field.unit === "桁" || field.unit === "回") return "1";
  return "0.1";
}

function initializePwaStatus() {
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
  const label = document.getElementById("offlineStatusLabel");
  if (!label) return;
  if (message) {
    label.textContent = message;
    return;
  }

  const serviceWorker = getServiceWorkerApi();
  if (window.location.protocol === "file:") {
    label.textContent = "ファイル表示";
    return;
  }
  if (!window.isSecureContext) {
    label.textContent = "HTTPS接続が必要";
    return;
  }
  if (!serviceWorker) {
    label.textContent = "オフライン未対応";
    return;
  }
  if (window.navigator && window.navigator.onLine === false) {
    label.textContent = "オフライン中";
    return;
  }
  label.textContent = serviceWorker.controller
    ? "オフライン準備済み"
    : "オフライン準備中";
}

function setupServiceWorkerMessages() {
  const serviceWorker = getServiceWorkerApi();
  if (!serviceWorker) return;

  serviceWorker.addEventListener("message", (event) => {
    if (!event.data) return;
    if (event.data.type === "CACHE_REFRESHED") {
      updateOfflineStatus("最新版準備完了");
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
      return;
    }
    if (event.data.type === "CACHE_REFRESH_FAILED") {
      updateOfflineStatus("確認できません");
    }
  });

  serviceWorker.addEventListener("controllerchange", () => {
    if (state.updateReloading) return;
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

  serviceWorker.register("./service-worker.js")
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

function watchServiceWorkerUpdate(registration) {
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && getServiceWorkerApi().controller) {
        updateOfflineStatus("更新あり");
      }
    });
  });
}

function isInsideIntegratedStApp() {
  return window.location.pathname.includes("/cat-r-input-app-v0.1/");
}

initialize();
