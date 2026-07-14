document.addEventListener("DOMContentLoaded", () => {
  /* ── Tab切换 ── */
  const tabs = document.querySelectorAll(".test-tab");
  const panels = document.querySelectorAll(".test-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("is-active"));
      panels.forEach((p) => p.classList.remove("is-active"));

      tab.classList.add("is-active");
      const panel = document.querySelector(`[data-panel="${target}"]`);
      if (panel) {
        panel.classList.add("is-active");
      }

      if (history.pushState) {
        const url = new URL(window.location);
        url.hash = target;
        history.pushState(null, "", url);
      }
    });
  });

  const hash = window.location.hash.replace("#", "");
  if (hash) {
    const tab = document.querySelector(`[data-tab="${hash}"]`);
    if (tab) tab.click();
  }

  /* ── 混合查词 + 收藏功能 ── */
  const tooltip = createTooltip();
  const savePopup = createSavePopup();
  const translationCache = new Map();
  const dictCache = new Map();
  let localDict = null;
  let hideTimer = null;
  let currentWordData = null;

  loadLocalDictionary();

  async function loadLocalDictionary() {
    try {
      const response = await fetch("dictionary.json");
      localDict = await response.json();
    } catch {
      localDict = {};
    }
  }

  /* ── Tooltip ── */
  function createTooltip() {
    const el = document.createElement("div");
    el.className = "word-tooltip";
    el.setAttribute("aria-live", "polite");
    el.innerHTML = `
      <div class="word-tooltip-original"></div>
      <div class="word-tooltip-phonetic"></div>
      <div class="word-tooltip-definition"></div>
      <div class="word-tooltip-translation"></div>
      <div class="word-tooltip-actions">
        <button class="btn-save-word" title="收藏到词汇本">+ 收藏</button>
        <span class="word-tooltip-hint">右键关闭 · Esc关闭</span>
      </div>
    `;
    el.querySelector(".btn-save-word").addEventListener("click", (e) => {
      e.stopPropagation();
      showSavePopup();
    });
    document.body.appendChild(el);
    return el;
  }

  function hideTooltip() {
    tooltip.classList.remove("is-visible");
    hideSavePopup();
  }

  /* ── 收藏弹窗 ── */
  function createSavePopup() {
    const el = document.createElement("div");
    el.className = "save-popup-overlay";
    el.innerHTML = `
      <div class="save-popup">
        <h3>收藏到词汇本</h3>
        <div class="save-popup-word"></div>
        <p class="save-popup-prompt">请选择词库：</p>
        <div class="save-popup-categories">
          <button class="save-cat" data-cat="listening">
            <span class="save-cat-icon">🎧</span>
            <span class="save-cat-label">听力词汇</span>
          </button>
          <button class="save-cat" data-cat="reading">
            <span class="save-cat-icon">📖</span>
            <span class="save-cat-label">阅读词汇</span>
          </button>
          <button class="save-cat" data-cat="writing">
            <span class="save-cat-icon">✍️</span>
            <span class="save-cat-label">写作词汇</span>
          </button>
          <button class="save-cat" data-cat="speaking">
            <span class="save-cat-icon">💬</span>
            <span class="save-cat-label">口语词汇</span>
          </button>
        </div>
        <button class="save-popup-cancel">取消</button>
      </div>
    `;

    el.querySelector(".save-popup-cancel").addEventListener("click", hideSavePopup);
    el.addEventListener("click", (e) => {
      if (e.target === el) hideSavePopup();
    });

    el.querySelectorAll(".save-cat").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.cat;
        saveWord(cat);
        hideSavePopup();
        hideTooltip();
      });
    });

    document.body.appendChild(el);
    return el;
  }

  function showSavePopup() {
    if (!currentWordData) return;
    const wordEl = savePopup.querySelector(".save-popup-word");
    const word = currentWordData.word;
    const phonetic = currentWordData.phonetic || "";
    const definition = currentWordData.definition || "";
    const meaning = currentWordData.meaning || "";
    wordEl.innerHTML = `
      <strong>${word}</strong>
      ${phonetic ? `<span class="save-popup-phonetic">${phonetic}</span>` : ""}
      ${definition ? `<span class="save-popup-definition">${definition}</span>` : ""}
      ${meaning ? `<span class="save-popup-meaning">${meaning}</span>` : ""}
    `;
    savePopup.classList.add("is-visible");
  }

  function hideSavePopup() {
    savePopup.classList.remove("is-visible");
  }

  /* ── 查词 ── */
  function lookupLocal(text) {
    if (!localDict) return null;
    const key = text.toLowerCase().trim();
    if (localDict[key]) return localDict[key];

    // 词形还原：尝试去掉各种后缀
    const rules = [
      // 双写辅音+ed/ing: stopped→stop, running→run
      { pattern: /([bcdfghjklmnpqrstvwxyz])\1(?:ed|ing)$/, replace: "$1" },
      // ies→y: studies→study
      { pattern: /ies$/, replace: "y" },
      // 常规后缀按优先级
      { pattern: /(?:ation|iness|fulness|lessness)$/, replace: "" },
      { pattern: /(?:ment|ness|able|ible|less|ship|hood|dom|ism|ist|ity|ize|ise|fy)$/, replace: "" },
      { pattern: /(?:tion|sion|tive|al|ly|ed|ing|er|est|or|ous|ful|ive|en|ic)$/, replace: "" },
      { pattern: /(?:es|s)$/, replace: "" },
    ];

    for (const rule of rules) {
      const stripped = key.replace(rule.pattern, rule.replace || "");
      if (stripped !== key && stripped.length > 2 && localDict[stripped]) {
        return localDict[stripped];
      }
    }
    return null;
  }

  async function translateText(text) {
	    const key = text.toLowerCase().trim();
	    if (translationCache.has(key)) return translationCache.get(key);

	    const local = lookupLocal(text);
	    if (local) {
	      translationCache.set(key, local);
	      return local;
	    }

	    try {
	      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
	      const response = await fetch(url);
	      const data = await response.json();
	      if (data.responseData && data.responseData.translatedText) {
	        const translated = data.responseData.translatedText;
	        // 如果API返回原文（未翻译），标记为失败
	        if (translated.toLowerCase().trim() === key) {
	          translationCache.set(key, null);
	          return null;
	        }
	        translationCache.set(key, translated);
	        return translated;
	      }
	      translationCache.set(key, null);
	      return null;
	    } catch {
	      translationCache.set(key, null);
	      return null;
	    }
	  }

  async function fetchDictionary(word) {
    const key = word.toLowerCase().trim();
    if (dictCache.has(key)) return dictCache.get(key);

    const result = { phonetic: "", definition: "", pos: "" };

    try {
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        // 音标
        if (entry.phonetic) {
          result.phonetic = entry.phonetic;
        } else if (entry.phonetics && entry.phonetics.length > 0) {
          for (const p of entry.phonetics) {
            if (p.text) { result.phonetic = p.text; break; }
          }
        }
        // 英文释义 + 词性
        if (entry.meanings && entry.meanings.length > 0) {
          const first = entry.meanings[0];
          result.pos = first.partOfSpeech || "";
          if (first.definitions && first.definitions.length > 0) {
            result.definition = first.definitions[0].definition || "";
          }
        }
      }
    } catch {
      // 静默失败
    }

    dictCache.set(key, result);
    return result;
  }

  /* ── 句子提取 ── */
  function extractSentence() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return "";

    const range = selection.getRangeAt(0);
    let node = range.startContainer;

    // 向上查找包含完整句子的父元素
    let container = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (container && !container.closest(".tapescript, .article-text, .task-content, .writing-task, .test-panel, .essay-text-content")) {
      container = container.parentElement;
    }

    if (!container) return "";

    const text = container.textContent;
    const selectedText = selection.toString().trim();
    if (!selectedText) return "";

    // 在文本中定位选中词所在的句子
    const idx = text.indexOf(selectedText);
    if (idx === -1) return text.substring(0, 300).trim();

    // 向前找句子开头
    let start = idx;
    while (start > 0 && !/[.!?。！？\n]/.test(text[start - 1])) {
      start--;
    }
    // 跳过句子开头的空格和标点
    while (start < idx && /[\s.!?。！？\n]/.test(text[start])) {
      start++;
    }

    // 向后找句子结尾
    let end = idx + selectedText.length;
    while (end < text.length && !/[.!?。！？\n]/.test(text[end])) {
      end++;
    }
    if (end < text.length) end++;

    return text.substring(start, end).trim();
  }

  /* ── 来源识别 ── */
  function getSource() {
    const activeTab = document.querySelector(".test-tab.is-active");
    const tabName = activeTab ? activeTab.dataset.tab : "unknown";

    const tabLabels = {
      listening: "听力",
      reading: "阅读",
      writing: "写作",
      speaking: "口语"
    };

    // 获取子标题
    let subtitle = "";
    const activePanel = document.querySelector(".test-panel.is-active");
    if (activePanel) {
      const h3 = activePanel.querySelector("h3");
      if (h3) subtitle = " · " + h3.textContent.trim();
    }

    return `剑桥雅思真题1 · ${tabLabels[tabName] || tabName}${subtitle}`;
  }

  /* ── 存储 ── */
  const STORAGE_KEY = "ielts_vocabulary";

  function getVocabulary() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { listening: [], reading: [], writing: [], speaking: [] };
    } catch {
      return { listening: [], reading: [], writing: [], speaking: [] };
    }
  }

  function saveWord(category) {
    if (!currentWordData) return;

    const vocab = getVocabulary();
    const entry = {
      word: currentWordData.word,
      phonetic: currentWordData.phonetic || "",
      definition: currentWordData.definition || "",
      pos: currentWordData.pos || "",
      meaning: currentWordData.meaning || "",
      sentence: currentWordData.sentence || "",
      source: currentWordData.source || "",
      time: new Date().toISOString()
    };

    // 去重
    const exists = vocab[category].some((item) => item.word.toLowerCase() === entry.word.toLowerCase());
    if (exists) {
      showToast("该单词已在词汇本中");
      return;
    }

    vocab[category].push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vocab));
    showToast("已添加到" + getCategoryName(category));
  }

  function getCategoryName(cat) {
    const names = { listening: "听力词汇", reading: "阅读词汇", writing: "写作词汇", speaking: "口语词汇" };
    return names[cat] || cat;
  }

  /* ── Toast提示 ── */
  let toastTimer = null;
  function showToast(message) {
    let toast = document.querySelector(".save-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "save-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2000);
  }

  /* ── 定位 ── */
  function getSelectionPosition() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    return { x: rect.left + rect.width / 2, y: rect.bottom };
  }

  function isInContentArea(element) {
    const contentAreas = [
      ".article-text", ".tapescript", ".task-content", ".test-panel", ".writing-task", ".essay-text-content"
    ];
    return contentAreas.some((selector) => element.closest(selector));
  }

  function positionTooltipAt(x, y) {
    const rect = tooltip.getBoundingClientRect();
    let left = x - rect.width / 2;
    let top = y + 10;

    if (left + rect.width > window.innerWidth - 12) left = window.innerWidth - rect.width - 12;
    if (left < 12) left = 12;
    if (top + rect.height > window.innerHeight - 12) top = y - rect.height - 10;
    if (top < 12) top = 12;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }

  /* ── 事件 ── */
  document.addEventListener("mouseup", async (event) => {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    if (event.target.closest(".word-tooltip") || event.target.closest(".save-popup-overlay")) return;

    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (!text || text.length < 2 || text.length > 200) {
      hideTooltip();
      currentWordData = null;
      return;
    }

    if (!/[a-zA-Z]/.test(text)) return;

    if (!isInContentArea(event.target)) {
      hideTooltip();
      currentWordData = null;
      return;
    }

    const pos = getSelectionPosition();
    if (!pos) return;

    const word = text;
    const sentence = extractSentence();
    const source = getSource();

    tooltip.querySelector(".word-tooltip-original").textContent = word;
    tooltip.querySelector(".word-tooltip-phonetic").textContent = "";
    tooltip.querySelector(".word-tooltip-definition").textContent = "";
    tooltip.querySelector(".word-tooltip-translation").textContent = "查询中...";
    tooltip.classList.add("is-visible");
    positionTooltipAt(pos.x, pos.y);

    // 并行查词典释义和中文翻译
    const [dict, translation] = await Promise.all([
      fetchDictionary(word),
      translateText(word)
    ]);

    const currentText = window.getSelection().toString().trim();
    if (currentText !== word) return;

    // 显示英文释义（主要）
    if (dict.definition) {
      const posLabel = dict.pos ? `<span class="word-tooltip-pos">${dict.pos}</span> ` : "";
      tooltip.querySelector(".word-tooltip-definition").innerHTML = `${posLabel}${dict.definition}`;
    }
    // 显示音标
    if (dict.phonetic) {
      tooltip.querySelector(".word-tooltip-phonetic").textContent = dict.phonetic;
    }
    // 显示中文翻译（辅助）
    tooltip.querySelector(".word-tooltip-translation").textContent = translation || "";

    currentWordData = {
      word,
      phonetic: dict.phonetic || "",
      definition: dict.definition || "",
      pos: dict.pos || "",
      meaning: translation || "",
      sentence,
      source
    };

    positionTooltipAt(pos.x, pos.y);
  });

  document.addEventListener("contextmenu", () => {
    hideTooltip();
  });

  document.addEventListener("mousedown", (event) => {
    if (!event.target.closest(".word-tooltip") && !event.target.closest(".save-popup-overlay") &&
        !event.target.closest(".article-text, .tapescript, .task-content, .test-panel, .writing-task, .essay-text-content")) {
      hideTimer = setTimeout(() => hideTooltip(), 200);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideTooltip();
    }
  });

  /* ── 范文上传（文本提取） ── */
  initEssayUploads();

  /* ── 文本提取函数 ── */
  async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const lineMap = new Map();
      content.items.forEach((item) => {
        const y = Math.round(item.transform[5] * 10) / 10;
        if (!lineMap.has(y)) lineMap.set(y, []);
        lineMap.get(y).push(item.str);
      });

      const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
      const pageText = sortedYs.map((y) => lineMap.get(y).join(" ")).join("\n");
      fullText += pageText + "\n\n";
    }
    return fullText.trim();
  }

  async function extractTextFromWord(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  }

  async function extractTextFromImage(file) {
    const imageUrl = URL.createObjectURL(file);
    try {
      const { data: { text } } = await Tesseract.recognize(imageUrl, "eng+chi_sim", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            const loadingEl = document.querySelector(".essay-loading[style*='block']");
            if (loadingEl) {
              const progress = Math.round(m.progress * 100);
              loadingEl.querySelector(".essay-loading-text").textContent =
                `正在识别文字... ${progress}%`;
            }
          }
        }
      });
      return text.trim();
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  function initEssayUploads() {
    const DB_NAME = "ielts-essays";
    const STORE_NAME = "essays";

    // 设置 PDF.js worker
    if (typeof pdfjsLib !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }

    function openDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
      });
    }

    async function saveEssay(key, data) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(data, key);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    }

    async function loadEssay(key) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
      });
    }

    async function deleteEssay(key) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    }

    function showExtractedText(uploadEl, essayKey, data) {
      const uploadZone = uploadEl.querySelector(".essay-upload-zone");
      const loading = uploadEl.querySelector(".essay-loading");
      const textDisplay = uploadEl.querySelector(".essay-text-display");
      const textName = uploadEl.querySelector(".essay-text-name");
      const textContent = uploadEl.querySelector(".essay-text-content");
      const fileInput = uploadEl.querySelector(".essay-file-input");

      uploadZone.style.display = "none";
      loading.style.display = "none";
      fileInput.style.display = "none";
      fileInput.style.pointerEvents = "none";
      textDisplay.style.display = "block";
      textName.textContent = data.name;
      textContent.textContent = data.text;

      textDisplay.querySelector(".essay-text-delete").onclick = async (e) => {
        e.stopPropagation();
        await deleteEssay(essayKey);
        uploadZone.style.display = "";
        textDisplay.style.display = "none";
        textContent.textContent = "";
        fileInput.style.display = "";
        fileInput.style.pointerEvents = "";
        fileInput.value = "";
      };
    }

    document.querySelectorAll(".essay-upload").forEach((uploadEl) => {
      const essayKey = uploadEl.dataset.essay;
      const fileInput = uploadEl.querySelector(".essay-file-input");
      const uploadZone = uploadEl.querySelector(".essay-upload-zone");
      const loading = uploadEl.querySelector(".essay-loading");

      uploadZone.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        // 显示加载状态
        uploadZone.style.display = "none";
        loading.style.display = "block";
        loading.querySelector(".essay-loading-text").textContent = "正在提取文字...";

        try {
          let extractedText = "";

          if (file.type === "application/pdf") {
            extractedText = await extractTextFromPDF(file);
          } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.type === "application/msword" ||
            file.name.endsWith(".docx") ||
            file.name.endsWith(".doc")
          ) {
            extractedText = await extractTextFromWord(file);
          } else if (file.type.startsWith("image/")) {
            extractedText = await extractTextFromImage(file);
          } else {
            throw new Error("不支持的文件格式");
          }

          if (!extractedText) {
            throw new Error("未能提取到文字，请检查文件内容");
          }

          const data = {
            name: file.name,
            type: file.type,
            text: extractedText,
            time: new Date().toISOString()
          };

          await saveEssay(essayKey, data);
          showExtractedText(uploadEl, essayKey, data);
        } catch (err) {
          loading.style.display = "none";
          uploadZone.style.display = "";
          fileInput.value = "";
          alert("提取失败：" + (err.message || "请重试"));
        }
      });

      // 页面加载时恢复
      loadEssay(essayKey).then((data) => {
        if (data && data.text) {
          showExtractedText(uploadEl, essayKey, data);
        }
      });
    });
  }
});