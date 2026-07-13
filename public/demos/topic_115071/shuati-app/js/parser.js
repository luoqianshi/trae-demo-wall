/* ============== 刷题 App · 文件解析与题目提取 ============== */

// PDF.js worker 配置
if (window['pdfjsLib']) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
}

// ========== 解析状态 UI ==========
function showStatus(msg, kind) {
  const parseStatus = document.getElementById('parseStatus');
  if (!parseStatus) return;
  parseStatus.hidden = false;
  parseStatus.className = 'parse-status ' + (kind || '');
  let bar = parseStatus.querySelector('.progress');
  if (kind === 'ok' || kind === 'err') {
    if (bar) bar.remove();
  } else if (!bar) {
    bar = document.createElement('div');
    bar.className = 'progress';
    bar.innerHTML = '<div class="progress-fill"></div><div class="progress-text"></div>';
    parseStatus.appendChild(bar);
  }
  let textEl = parseStatus.querySelector('.status-text');
  if (!textEl) {
    textEl = document.createElement('div');
    textEl.className = 'status-text';
    parseStatus.insertBefore(textEl, parseStatus.firstChild);
  }
  textEl.textContent = msg;
}

function setProgress(cur, total) {
  const bar = document.querySelector('#parseStatus .progress');
  if (!bar) return;
  const fill = bar.querySelector('.progress-fill');
  const text = bar.querySelector('.progress-text');
  const pct = total > 0 ? Math.min(100, Math.round(cur / total * 100)) : 0;
  fill.style.width = pct + '%';
  text.textContent = `${cur}/${total}  ·  ${pct}%`;
}

// ========== PDF 解析 ==========
async function parsePdf(file, onProgress) {
  onProgress && onProgress(0, 1, '加载 PDF...');
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const total = pdf.numPages;
  let all = '';
  for (let i = 1; i <= total; i++) {
    onProgress && onProgress(i, total, `解析第 ${i}/${total} 页`);
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent({ disableCombineTextItems: false });
    const TOL = CONFIG.PDF_LINE_TOLERANCE;
    const items = tc.items
      .map(it => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))
      .filter(it => it.str && it.str.trim());
    // 按 y 降序（PDF 原点在底部），同行按 x 升序
    items.sort((a, b) => {
      const dy = b.y - a.y;
      if (Math.abs(dy) > TOL) return dy;
      return a.x - b.x;
    });
    // 分行
    let lineY = null, line = '';
    const lines = [];
    for (const it of items) {
      if (lineY === null || Math.abs(lineY - it.y) <= TOL) {
        line += (line ? ' ' : '') + it.str;
        lineY = it.y;
      } else {
        lines.push(line); line = it.str; lineY = it.y;
      }
    }
    if (line) lines.push(line);
    all += lines.join('\n') + '\n\n';
    // 用微任务让出主线程（比 setTimeout(0) 更高效）
    await new Promise(r => queueMicrotask(r));
  }
  return all;
}

// ========== DOCX 解析 ==========
async function parseDocx(file) {
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

// ========== 题目提取 ==========
function extractQuestions(text) {
  const rawLines = text.split(/\r?\n/).map(l => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean);

  // 题号匹配
  const qStart = /^\s*(\d+)\s*[\.、．:：\)）\]】]\s*(.*)$/;
  const ansRe = /(?:【\s*)?(?:答案|参考答案|正确答案|参考答\s*案)\s*[】:：]?\s*([A-D,，\s]+)/i;

  // 切分题目块
  const blocks = [];
  let cur = null;
  // 解析行/干扰行：这些行不属于任何题目
  const noiseLineRe = /^(?:简要解析|解析|参考答案|答案|考点|知识点|参考解析|答案解析)\s*[：:]?\s*/i;
  for (const line of rawLines) {
    if (noiseLineRe.test(line)) continue; // 跳过解析行
    const m = line.match(qStart);
    if (m) {
      if (cur) blocks.push(cur);
      cur = { no: m[1], lines: m[2] ? [m[2]] : [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  if (cur) blocks.push(cur);

  const questions = [];
  for (const b of blocks) {
    let fullText = b.lines.join(' ').trim();
    if (fullText.length < 3) continue;

    // 1) 提取"答案：X"
    let answer = [];
    const strictAnsRe = /(?:【\s*)?(?:参考答案|正确答案|参考答\s*案|答案|答\s*案)\s*(?:为|是)?\s*[】:：=\s]+([A-D,，\s]+)/;
    const strictMatch = fullText.match(strictAnsRe);
    if (strictMatch) {
      const A_D_RE = /^[A-D]$/;
      answer = strictMatch[1].split(/[,，\s]+/).filter(function (s) { return A_D_RE.test(s); });
      fullText = fullText.replace(strictMatch[0], ' ');
    }

    // 2) 定位第一个选项标记
    const strongOptRe = /([A-D])\s*[\.、．:：]/g;
    let optStartMatch = null;
    let tmp;
    while ((tmp = strongOptRe.exec(fullText)) !== null) {
      if (tmp[1] === 'A') { optStartMatch = tmp; break; }
    }
    if (!optStartMatch) {
      strongOptRe.lastIndex = 0;
      optStartMatch = strongOptRe.exec(fullText);
    }
    // 兜底：宽松标记
    if (!optStartMatch) {
      const optMarkerRe = /([A-D])\s*[\.、．:：\)）\]】]/g;
      optMarkerRe.lastIndex = 0;
      optStartMatch = optMarkerRe.exec(fullText);
    }
    if (!optStartMatch) continue;

    const optStartIdx = optStartMatch.index;
    let stem = fullText.slice(0, optStartIdx).trim();
    let optText = fullText.slice(optStartIdx).trim();

    // 2.2) 题干中括号答案（末尾或中间）
    if (answer.length === 0) {
      const bracketRe = /[\(（]\s*([A-Da-d]+)\s*[\)）]/g;
      let bestMatch = null;
      let m;
      while ((m = bracketRe.exec(stem)) !== null) {
        const ansLetters = m[1].toUpperCase().split('').filter(c => /[A-D]/.test(c));
        if (ansLetters.length > 0) {
          if (!bestMatch) { bestMatch = { match: m, letters: ansLetters }; continue; }
          if (m.index > bestMatch.match.index) { bestMatch = { match: m, letters: ansLetters }; }
        }
      }
      if (bestMatch) {
        answer = bestMatch.letters;
        stem = (stem.slice(0, bestMatch.match.index) + stem.slice(bestMatch.match.index + bestMatch.match[0].length)).replace(/\s+/g, ' ').trim();
      }
    }

    // 2.5) 提取解析文字（先于选项切分，保存后移除）
    let explanation = '';
    const explainCutRe = /(?:【\s*)?(?:解析|考点|知识点|答案解析|参考解析|答案解析)\s*[：:】]\s*/i;
    const explainMatch = optText.match(explainCutRe);
    if (explainMatch && explainMatch.index > 10) {
      explanation = optText.slice(explainMatch.index + explainMatch[0].length).trim();
      // 截断到合理长度（解析一般不超过 500 字）
      if (explanation.length > 500) explanation = explanation.slice(0, 500) + '...';
      optText = optText.slice(0, explainMatch.index).trim();
    }

    // 3) 提取选项
    const opts = [];
    const optRe = /([A-D])\s*[\.、．:：\)）\]】]\s*([\s\S]*?)(?=\s*[A-D]\s*[\.、．:：\)）\]】]|$)/g;
    let m;
    while ((m = optRe.exec(optText)) !== null) {
      let t = m[2].trim().replace(/\s+/g, ' ');
      const ansCut = t.match(/(?:【\s*)?(?:参考答案|正确答案|参考答\s*案|答案|答\s*案)\s*(?:为|是)?\s*[】:：=\s]+[A-D,，\s]+/);
      if (ansCut) t = t.slice(0, ansCut.index).trim();
      t = t.replace(/^[\s:：、，,.\-—_]+/, '').trim();
      if (t) opts.push({ key: m[1], text: t });
    }
    if (opts.length < 2) continue;

    // 3.2) 最后一个选项可能混入下一题开头，截断常见干扰词
    if (opts.length > 0) {
      const last = opts[opts.length - 1];
      // 截断"简要""解析"等尾部噪声词（可能在同一行末尾）
      const noiseRe = /\s+(?:简要|简述|解析|答案|参考答案|正确答案|解析:|解析：|【解析】|【答案】|考点|知识点|参考解析|答案解析)\s*$/i;
      const nm = last.text.match(noiseRe);
      if (nm && nm.index > 5) {
        last.text = last.text.slice(0, nm.index).trim();
      }
    }

    // 3.3) 所有选项末尾也可能带噪声词，统一清理
    for (const o of opts) {
      const tailNoiseRe = /\s+(?:简要|简述|解析|答案|参考答案|正确答案|考点|知识点|参考解析|答案解析)\s*$/i;
      const tm = o.text.match(tailNoiseRe);
      if (tm && tm.index > 5) {
        o.text = o.text.slice(0, tm.index).trim();
      }
    }

    // 3.5) 组合选项处理
    const comboMarkRe = /^[①②③④⑤⑥⑦⑧⑨⑩\s]+$/;
    const isComboOpts = opts.length >= 2 &&
      opts.slice(0, -1).every(o => comboMarkRe.test(o.text)) &&
      /^[①②③④⑤⑥⑦⑧⑨⑩]/.test(opts[opts.length - 1].text);
    if (isComboOpts) {
      const lastOpt = opts[opts.length - 1];
      const explainStart = lastOpt.text.match(/[①②③④⑤⑥⑦⑧⑨⑩][^\s①②③④⑤⑥⑦⑧⑨⑩\.、．:：\)）\]】]/);
      if (explainStart) {
        const comboPart = lastOpt.text.slice(0, explainStart.index).trim();
        const explainPart = lastOpt.text.slice(explainStart.index).trim();
        opts[opts.length - 1].text = comboPart;
        if (explainPart) {
          const cleanExplain = explainPart.replace(/\s+/g, ' ').replace(/\s*(?=[①②③④⑤⑥⑦⑧⑨⑩][^\.、\s])/g, ' ').trim();
          stem = stem + ' ' + cleanExplain;
        }
      }
    }

    // 题型判定
    let type = 'single';
    const isJudge = opts.length === 2 && /正确|错误|对|错|是|否|√|×|True|False/i.test(opts[0].text + opts[1].text);
    if (isJudge) type = 'judge';
    else if (answer.length > 1) type = 'multiple';

    questions.push({
      no: b.no,
      type,
      stem,
      options: opts,
      answer,
      explanation,
      source: '',
    });
  }
  return questions;
}

// ========== 文件处理入口 ==========
async function handleFile(file) {
  const onProgress = (cur, total, msg) => {
    showStatus(`正在解析 ${file.name}：${msg}`, '');
    setProgress(cur, total);
  };
  onProgress(0, 1, '准备中...');
  try {
    let text = '';
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'pdf') {
      text = await parsePdf(file, onProgress);
    } else if (ext === 'docx') {
      onProgress(0.5, 1, '解析 Word...');
      text = await parseDocx(file);
    } else {
      throw new Error('暂不支持该格式，请用 .pdf 或 .docx');
    }
    onProgress(1, 1, '识别题目...');
    state.lastRawText = text;
    const questions = extractQuestions(text);
    if (questions.length === 0) {
      const tip = '\n\n💡 格式提示：请确认文件包含"题号 + 选项(A/B/C/D)"格式的题目。\n常见格式：\n  1. 题目内容\n  A. 选项一  B. 选项二\n  答案：A';
      showStatus('未能识别到题目。文件可能不是题库格式（需要题号 + 选项）。' + tip, 'err');
      return;
    }
    const groupName = file.name.replace(/\.[^.]+$/, '');
    // 合并到题库（同组内基于题干前 N 字去重）
    const prefixLen = CONFIG.DEDUP_STEM_PREFIX_LEN;
    const existing = new Set(state.bank.filter(q => q.group === groupName).map(q => q.stem.slice(0, prefixLen)));
    let added = 0;
    questions.forEach(q => {
      if (!existing.has(q.stem.slice(0, prefixLen))) {
        state.bank.push({
          id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          group: groupName,
          ...q
        });
        added++;
      }
    });
    rebuildGroups();
    state.currentGroup = groupName;
    clearGroupResults();
    saveBank();
    saveResults();
    showStatus(`解析完成：从 ${file.name} 中识别 ${questions.length} 道题，新增 ${added} 道。已切换到分组「${groupName}」。`, 'ok');
    renderUpload();
    renderGroupSelector();
    updateTopProgress();
  } catch (err) {
    console.error(err);
    showStatus('解析失败：' + err.message, 'err');
  }
}

// ========== 拖拽上传事件绑定 ==========
function setupFileInput() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag');
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });
}

// ========== 原始文本弹窗 ==========
function setupRawModal() {
  const rawModal = document.getElementById('rawModal');
  const rawModalBody = document.getElementById('rawModalBody');
  if (!rawModal) return;

  rawModal.style.display = 'none';

  function openRaw() {
    if (rawModalBody) rawModalBody.textContent = state.lastRawText || '（暂无内容）';
    rawModal.hidden = false;
    rawModal.style.display = 'grid';
  }
  function closeRaw() {
    rawModal.hidden = true;
    rawModal.style.display = 'none';
  }

  // 统一使用事件委托（避免与直接绑定重复触发）
  document.addEventListener('click', (e) => {
    if (e.target.id === 'rawModalClose' || e.target.closest('#rawModalClose')) { closeRaw(); return; }
    if (e.target.id === 'rawModalMask') { closeRaw(); return; }
    if (e.target.id === 'viewRawBtn' || e.target.closest('#viewRawBtn')) { openRaw(); return; }
  });

  // ESC 关闭：只在此处处理，避免与键盘快捷键重复
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && rawModal && !rawModal.hidden) closeRaw();
  });
}

// 初始化
setupFileInput();
setupRawModal();
