const TOTAL_BUDGET = 500;
const STORAGE_KEY = "loveBudgetIOS_v1";

const dimensions = {
  security: "安全與信任",
  repair: "溝通與修復",
  intimacy: "親密與陪伴",
  attraction: "個人特質與吸引",
  lifestyle: "生活習慣與價值觀",
  future: "未來規劃與責任"
};

const options = [
  { name: "相處時感到自在", category: "安全感", dimension: "security" },
  { name: "願意給我空間／自由", category: "安全感", dimension: "security" },
  { name: "誠實專情", category: "安全感", dimension: "security" },
  { name: "情緒穩定", category: "安全感", dimension: "security" },
  { name: "接納／包容／支持我", category: "安全感", dimension: "security" },

  { name: "爭執後願意道歉", category: "溝通", dimension: "repair" },
  { name: "願意傾聽我", category: "溝通", dimension: "repair" },
  { name: "理解／回應我的情緒", category: "溝通", dimension: "repair" },
  { name: "清楚表達需求", category: "溝通", dimension: "repair" },

  { name: "願意表達愛", category: "親密", dimension: "intimacy" },
  { name: "常有待在一起的陪伴", category: "親密", dimension: "intimacy" },
  { name: "常給我擁抱和觸摸", category: "親密", dimension: "intimacy" },
  { name: "寵愛我／欣賞我", category: "親密", dimension: "intimacy" },
  { name: "製造驚喜", category: "親密", dimension: "intimacy" },

  { name: "聰明有才華", category: "吸引", dimension: "attraction" },
  { name: "有自信", category: "吸引", dimension: "attraction" },
  { name: "幽默風趣", category: "吸引", dimension: "attraction" },
  { name: "會打理自己的外貌", category: "吸引", dimension: "attraction" },

  { name: "大方不計較", category: "生活", dimension: "lifestyle" },
  { name: "溫柔脾氣好", category: "生活", dimension: "lifestyle" },
  { name: "有共同的興趣愛好", category: "生活", dimension: "lifestyle" },
  { name: "喜歡運動／戶外", category: "生活", dimension: "lifestyle" },
  { name: "整潔／衛生習慣好", category: "生活", dimension: "lifestyle" },
  { name: "不酗酒／賭博／抽菸", category: "生活", dimension: "lifestyle" },
  { name: "品味與我相似", category: "生活", dimension: "lifestyle" },

  { name: "有責任感", category: "未來", dimension: "future" },
  { name: "有上進心", category: "未來", dimension: "future" },
  { name: "能獨立安排生活", category: "未來", dimension: "future" },
  { name: "金錢觀相似", category: "未來", dimension: "future" },
  { name: "信仰／政治立場相近", category: "未來", dimension: "future" }
];

function defaultState() {
  return {
    selected: Array(options.length).fill(false),
    values: Array(options.length).fill(0)
  };
}

function normalizeState(raw) {
  const base = defaultState();

  if (!raw || typeof raw !== "object") return base;

  const selected = Array.isArray(raw.selected) && raw.selected.length === options.length
    ? raw.selected.map(Boolean)
    : base.selected;

  const values = Array.isArray(raw.values) && raw.values.length === options.length
    ? raw.values.map((value, index) => selected[index] ? Number(value) || 0 : 0)
    : base.values;

  return { selected, values };
}

function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}

function getSelectedIndexes(state) {
  return state.selected
    .map((value, index) => value ? index : null)
    .filter((index) => index !== null);
}

function getSelectedItems(state) {
  return getSelectedIndexes(state).map((index) => ({
    ...options[index],
    index,
    value: Number(state.values[index]) || 0
  }));
}

function getScoredItems(state) {
  return getSelectedItems(state)
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function getTotalUsed(state) {
  return state.values.reduce((sum, value) => sum + Number(value || 0), 0);
}

function getDimensionScores(state) {
  const scores = {};

  Object.keys(dimensions).forEach((key) => {
    scores[key] = 0;
  });

  options.forEach((item, index) => {
    if (!state.selected[index]) return;
    scores[item.dimension] += Number(state.values[index]) || 0;
  });

  return scores;
}

function getTopDimension(scores) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [key, score] = sorted[0] || ["security", 0];

  return {
    key,
    label: dimensions[key],
    score
  };
}

function getTopThreeRatio(state) {
  const total = getTotalUsed(state);
  if (total === 0) return 0;

  const topThree = getScoredItems(state)
    .slice(0, 3)
    .reduce((sum, item) => sum + item.value, 0);

  return Math.round((topThree / total) * 100);
}

function renderScoreBars(container, scores, total) {
  container.innerHTML = Object.entries(scores)
    .map(([key, value]) => {
      const percent = total === 0 ? 0 : Math.round((value / total) * 100);

      return `
        <div class="score-row">
          <div class="score-row-top">
            <span>${dimensions[key]}</span>
            <span>${value} 分｜${percent}%</span>
          </div>
          <div class="score-track">
            <div class="score-fill" style="width:${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function encodePayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodePayload(encoded) {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getSharedStateFromUrl() {
  const hash = window.location.hash || "";
  if (!hash.startsWith("#data=")) return null;
  return normalizeState(decodePayload(hash.replace("#data=", "")));
}

function buildShareUrl(state) {
  const url = new URL("result.html", window.location.href);

  url.hash = `data=${encodePayload({
    selected: state.selected,
    values: state.values
  })}`;

  return url.toString();
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function initHome(state) {
  const resetBtn = document.querySelector("#resetBtn");

  resetBtn.addEventListener("click", () => {
    const ok = confirm("要清除目前的選擇並重新開始嗎？");
    if (!ok) return;

    resetState();
    window.location.href = "index.html";
  });
}

function initChoose(state) {
  const filterRow = document.querySelector("#filterRow");
  const optionList = document.querySelector("#optionList");
  const searchInput = document.querySelector("#searchInput");
  const chooseCountText = document.querySelector("#chooseCountText");
  const bottomChooseCount = document.querySelector("#bottomChooseCount");
  const chosenPreview = document.querySelector("#chosenPreview");
  const toBudgetBtn = document.querySelector("#toBudgetBtn");
  const clearChooseBtn = document.querySelector("#clearChooseBtn");

  let activeDimension = "all";
  let keyword = "";

  function renderFilters() {
    const filters = [
      ["all", "全部"],
      ...Object.entries(dimensions)
    ];

    filterRow.innerHTML = filters
      .map(([key, label]) => `
        <button
          class="filter-chip ${activeDimension === key ? "active" : ""}"
          type="button"
          data-filter="${key}"
        >
          ${label}
        </button>
      `)
      .join("");
  }

  function getVisibleOptions() {
    return options
      .map((item, index) => ({ ...item, index }))
      .filter((item) => {
        const matchDimension = activeDimension === "all" || item.dimension === activeDimension;
        const matchKeyword =
          item.name.includes(keyword) ||
          item.category.includes(keyword) ||
          dimensions[item.dimension].includes(keyword);

        return matchDimension && matchKeyword;
      });
  }

  function renderPreview() {
    const selectedItems = getSelectedItems(state);

    chooseCountText.textContent = `已選 ${selectedItems.length} 項`;
    bottomChooseCount.textContent = `${selectedItems.length} 項`;
    toBudgetBtn.disabled = selectedItems.length === 0;

    if (selectedItems.length === 0) {
      chosenPreview.classList.add("hidden");
      chosenPreview.innerHTML = "";
      return;
    }

    chosenPreview.classList.remove("hidden");
    chosenPreview.innerHTML = `
      <p>目前已選</p>
      <div class="preview-list">
        ${selectedItems.map((item) => `<span class="preview-pill">${item.name}</span>`).join("")}
      </div>
    `;
  }

  function renderOptions() {
    const visibleOptions = getVisibleOptions();

    optionList.innerHTML = visibleOptions
      .map((item) => {
        const selected = state.selected[item.index];

        return `
          <article class="option-card ${selected ? "selected" : ""}">
            <button class="option-button" type="button" data-index="${item.index}">
              <div class="option-main">
                <div>
                  <p class="option-title">${item.name}</p>
                  <p class="option-meta">${dimensions[item.dimension]}・${item.category}</p>
                </div>
                <span class="check-dot"></span>
              </div>
            </button>
          </article>
        `;
      })
      .join("");

    renderPreview();
  }

  filterRow.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-chip");
    if (!button) return;

    activeDimension = button.dataset.filter;
    renderFilters();
    renderOptions();
  });

  searchInput.addEventListener("input", () => {
    keyword = searchInput.value.trim();
    renderOptions();
  });

  optionList.addEventListener("click", (event) => {
    const button = event.target.closest(".option-button");
    if (!button) return;

    const index = Number(button.dataset.index);
    state.selected[index] = !state.selected[index];

    if (!state.selected[index]) {
      state.values[index] = 0;
    }

    saveState(state);
    renderOptions();
  });

  clearChooseBtn.addEventListener("click", () => {
    const ok = confirm("要清空所有已選條件嗎？");
    if (!ok) return;

    state.selected = Array(options.length).fill(false);
    state.values = Array(options.length).fill(0);
    saveState(state);
    renderOptions();
  });

  toBudgetBtn.addEventListener("click", () => {
    if (getSelectedIndexes(state).length === 0) {
      alert("請先選擇至少一個條件。");
      return;
    }

    saveState(state);
    window.location.href = "budget.html";
  });

  renderFilters();
  renderOptions();
}

function initBudget(state) {
  if (getSelectedIndexes(state).length === 0) {
    window.location.href = "choose.html";
    return;
  }

  const budgetStatusText = document.querySelector("#budgetStatusText");
  const budgetProgressFill = document.querySelector("#budgetProgressFill");
  const usedBudget = document.querySelector("#usedBudget");
  const leftBudget = document.querySelector("#leftBudget");
  const selectedTotal = document.querySelector("#selectedTotal");
  const budgetHint = document.querySelector("#budgetHint");
  const currentTopPanel = document.querySelector("#currentTopPanel");
  const budgetList = document.querySelector("#budgetList");
  const equalBudgetBtn = document.querySelector("#equalBudgetBtn");
  const zeroBudgetBtn = document.querySelector("#zeroBudgetBtn");
  const clearBudgetBtn = document.querySelector("#clearBudgetBtn");
  const toResultBtn = document.querySelector("#toResultBtn");

  function updateSummary() {
    const used = getTotalUsed(state);
    const left = TOTAL_BUDGET - used;
    const selectedCount = getSelectedIndexes(state).length;
    const percent = Math.round((used / TOTAL_BUDGET) * 100);

    budgetStatusText.textContent = `${used} / ${TOTAL_BUDGET}`;
    budgetProgressFill.style.width = `${percent}%`;
    usedBudget.textContent = used;
    leftBudget.textContent = left;
    selectedTotal.textContent = selectedCount;

    if (used > 0 && used < TOTAL_BUDGET) {
      budgetHint.classList.remove("hidden");
      budgetHint.textContent = `你還有 ${left} 元尚未分配。可以繼續查看結果，也可以把預算用完。`;
    } else {
      budgetHint.classList.add("hidden");
      budgetHint.textContent = "";
    }

    renderCurrentTop();
  }

  function renderCurrentTop() {
    const top = getScoredItems(state).slice(0, 3);

    if (top.length === 0) {
      currentTopPanel.classList.add("hidden");
      currentTopPanel.innerHTML = "";
      return;
    }

    currentTopPanel.classList.remove("hidden");
    currentTopPanel.innerHTML = `
      <h2>目前投入最高</h2>
      <ol>
        ${top.map((item) => `<li>${item.name}｜${item.value} 元</li>`).join("")}
      </ol>
    `;
  }

  function setValue(index, nextValue) {
    const oldValue = Number(state.values[index]) || 0;
    let newValue = Math.max(0, Math.min(TOTAL_BUDGET, Number(nextValue) || 0));
    newValue = Math.round(newValue / 10) * 10;

    const projected = getTotalUsed(state) - oldValue + newValue;

    if (projected > TOTAL_BUDGET) {
      const over = projected - TOTAL_BUDGET;
      newValue = Math.max(0, newValue - over);
      newValue = Math.round(newValue / 10) * 10;
    }

    state.values[index] = newValue;
    saveState(state);

    const valueText = document.querySelector(`#value-${index}`);
    const slider = document.querySelector(`.range[data-index="${index}"]`);

    if (valueText) valueText.textContent = newValue;
    if (slider) slider.value = newValue;

    updateSummary();
  }

  function renderList() {
    const items = getSelectedItems(state);

    budgetList.innerHTML = items
      .map((item) => `
        <article class="budget-item">
          <div class="budget-item-top">
            <h2>${item.name}</h2>
            <small>${item.category}</small>
          </div>

          <p class="budget-value">
            <span id="value-${item.index}">${item.value}</span> 元
          </p>

          <div class="budget-controls">
            <button class="step-button" type="button" data-action="minus" data-index="${item.index}">-10</button>

            <input
              class="range"
              type="range"
              min="0"
              max="500"
              step="10"
              value="${item.value}"
              data-index="${item.index}"
              aria-label="${item.name}"
            />

            <button class="step-button" type="button" data-action="plus" data-index="${item.index}">+10</button>
          </div>
        </article>
      `)
      .join("");

    updateSummary();
  }

  budgetList.addEventListener("input", (event) => {
    if (!event.target.classList.contains("range")) return;
    setValue(Number(event.target.dataset.index), Number(event.target.value));
  });

  budgetList.addEventListener("click", (event) => {
    const button = event.target.closest(".step-button");
    if (!button) return;

    const index = Number(button.dataset.index);
    const action = button.dataset.action;
    const current = Number(state.values[index]) || 0;

    setValue(index, action === "plus" ? current + 10 : current - 10);
  });

  equalBudgetBtn.addEventListener("click", () => {
    const selectedIndexes = getSelectedIndexes(state);
    const count = selectedIndexes.length;

    if (count === 0) return;

    state.values = state.values.map(() => 0);

    const base = Math.floor(TOTAL_BUDGET / count / 10) * 10;
    let remaining = TOTAL_BUDGET - base * count;

    selectedIndexes.forEach((index) => {
      state.values[index] = base;
    });

    selectedIndexes.forEach((index) => {
      if (remaining <= 0) return;
      state.values[index] += 10;
      remaining -= 10;
    });

    saveState(state);
    renderList();
  });

  zeroBudgetBtn.addEventListener("click", () => {
    state.values = state.values.map(() => 0);
    saveState(state);
    renderList();
  });

  clearBudgetBtn.addEventListener("click", () => {
    const ok = confirm("要清空目前所有金額嗎？");
    if (!ok) return;

    state.values = state.values.map(() => 0);
    saveState(state);
    renderList();
  });

  toResultBtn.addEventListener("click", () => {
    if (getTotalUsed(state) === 0) {
      alert("請先分配至少一個條件的金額。");
      return;
    }

    saveState(state);
    window.location.href = "result.html";
  });

  renderList();
}

function getScoreReport(state) {
  const used = getTotalUsed(state);
  const selectedCount = getSelectedIndexes(state).length;
  const scores = getDimensionScores(state);
  const topDimension = getTopDimension(scores);
  const topItems = getScoredItems(state).slice(0, 3);
  const ratio = getTopThreeRatio(state);

  const topText = topItems.length
    ? topItems.map((item) => `「${item.name}」`).join("、")
    : "尚未分配";

  let concentration = "你的分配較平均，代表你同時考慮多個條件。";

  if (ratio >= 70) {
    concentration = "你的分配偏集中，代表你對少數條件有很明確的優先順序。";
  } else if (ratio >= 45) {
    concentration = "你的分配有明顯重點，也保留一些彈性給其他條件。";
  }

  return [
    `你一共選擇 ${selectedCount} 個條件，並使用 ${used} / 500 元。最高面向是「${topDimension.label}」，共 ${topDimension.score} 分。`,
    `投入最高的前三項是 ${topText}，合計佔總投入的 ${ratio}%。${concentration}`,
    "這份結果只呈現你的選擇與分數分布，不代表標準答案，也不替你下人格標籤。"
  ].join("\n\n");
}

function buildShareText(state) {
  const used = getTotalUsed(state);
  const scores = getDimensionScores(state);
  const selectedCount = getSelectedIndexes(state).length;
  const topItems = getScoredItems(state);

  const scoreText = Object.entries(scores)
    .map(([key, value]) => `${dimensions[key]}：${value} 分`)
    .join("\n");

  const itemText = topItems.length
    ? topItems.map((item, index) => `${index + 1}. ${item.name}：${item.value} 元`).join("\n")
    : "尚未分配";

  return [
    "我的愛情條件分數",
    `已選條件：${selectedCount} 項`,
    `使用預算：${used} / 500`,
    "",
    "面向分數：",
    scoreText,
    "",
    "條件分配：",
    itemText,
    "",
    "Love Budget｜用 500 元，看見你的愛情排序"
  ].join("\n");
}

function initResult(state) {
  const shared = getSharedStateFromUrl();

  if (shared) {
    state.selected = shared.selected;
    state.values = shared.values;
    saveState(state);
  }

  const used = getTotalUsed(state);
  const scores = getDimensionScores(state);
  const topDimension = getTopDimension(scores);
  const selectedCount = getSelectedIndexes(state).length;
  const topRatio = getTopThreeRatio(state);
  const topItems = getScoredItems(state);

  document.querySelector("#resultIntro").textContent =
    `你總共使用 ${used} / 500 元。以下內容只呈現你的條件分數，不替你取風格名稱。`;

  document.querySelector("#resultUsed").textContent = `${used} / 500`;
  document.querySelector("#resultTopDimension").textContent =
    used === 0 ? "尚未分配" : `${topDimension.label}｜${topDimension.score} 分`;
  document.querySelector("#resultSelectedCount").textContent = `${selectedCount} 項`;
  document.querySelector("#resultTopRatio").textContent = `${topRatio}%`;

  renderScoreBars(document.querySelector("#dimensionScores"), scores, used);

  document.querySelector("#topItems").innerHTML = topItems.length
    ? topItems.map((item) => `<li>${item.name}｜${item.value} 元</li>`).join("")
    : "<li>尚未分配</li>";

  document.querySelector("#scoreReport").textContent = getScoreReport(state);

  renderStory(state, scores, used, topDimension, topItems);
  bindResultActions(state);
}

function renderStory(state, scores, used, topDimension, topItems) {
  document.querySelector("#storyUsed").textContent = `${used} / 500`;
  document.querySelector("#storyTopDimension").textContent =
    used === 0 ? "尚未分配" : `${topDimension.label}｜${topDimension.score} 分`;

  renderScoreBars(document.querySelector("#storyScores"), scores, used);

  document.querySelector("#storyTopItems").innerHTML = topItems.length
    ? topItems.slice(0, 5).map((item) => `<li>${item.name}｜${item.value} 元</li>`).join("")
    : "<li>尚未分配</li>";
}

async function downloadStoryImage(button) {
  const originalText = button.textContent;
  const storyCard = document.querySelector("#storyCard");

  try {
    button.textContent = "圖片生成中...";

    const canvas = await html2canvas(storyCard, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    const file = new File([blob], "love-budget-result.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "我的愛情條件分數",
        text: "我的 500 元愛情條件分配結果"
      });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "love-budget-result.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    button.textContent = originalText;
  } catch {
    button.textContent = originalText;
    alert("圖片產生失敗，可以先使用手機截圖保存結果。");
  }
}

function bindResultActions(state) {
  const shareLinkBtn = document.querySelector("#shareLinkBtn");
  const downloadImageBtn = document.querySelector("#downloadImageBtn");
  const copyTextBtn = document.querySelector("#copyTextBtn");
  const restartBtn = document.querySelector("#restartBtn");

  shareLinkBtn.addEventListener("click", async () => {
    const shareUrl = buildShareUrl(state);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "我的愛情條件分數",
          text: "這是我的 500 元愛情條件分配結果",
          url: shareUrl
        });
      } else {
        await copyToClipboard(shareUrl);
        shareLinkBtn.textContent = "連結已複製";
        setTimeout(() => (shareLinkBtn.textContent = "分享結果連結"), 1400);
      }
    } catch {
      await copyToClipboard(shareUrl);
      shareLinkBtn.textContent = "連結已複製";
      setTimeout(() => (shareLinkBtn.textContent = "分享結果連結"), 1400);
    }
  });

  downloadImageBtn.addEventListener("click", () => {
    downloadStoryImage(downloadImageBtn);
  });

  copyTextBtn.addEventListener("click", async () => {
    await copyToClipboard(buildShareText(state));
    copyTextBtn.textContent = "已複製";
    setTimeout(() => (copyTextBtn.textContent = "複製文字結果"), 1400);
  });

  restartBtn.addEventListener("click", () => {
    const ok = confirm("重新測一次會清除目前的選擇，確定要繼續嗎？");
    if (!ok) return;

    resetState();
    window.location.href = "index.html";
  });
}

const state = loadState();
const page = document.body.dataset.page;

if (page === "home") initHome(state);
if (page === "choose") initChoose(state);
if (page === "budget") initBudget(state);
if (page === "result") initResult(state);
