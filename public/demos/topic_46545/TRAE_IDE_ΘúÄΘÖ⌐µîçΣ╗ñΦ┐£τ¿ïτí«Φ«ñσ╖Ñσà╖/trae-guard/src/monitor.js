const chalk = require('chalk');

const log = {
  info: (...args) => console.log(chalk.cyan('[monitor]'), ...args),
  warn: (...args) => console.log(chalk.yellow('[monitor]'), ...args),
  error: (...args) => console.log(chalk.red('[monitor]'), ...args),
  ok: (...args) => console.log(chalk.green('[monitor]'), ...args)
};

const APPROVE_KEYWORDS = [
  'approve', 'allow', 'run', 'execute', 'confirm', 'yes', 'ok', 'continue', 'proceed',
  '批准', '允许', '执行', '确认', '同意', '继续', '是', '确定'
];

const DENY_KEYWORDS = [
  'deny', 'reject', 'cancel', 'refuse', 'block', 'no', 'stop', 'abort', 'decline',
  '拒绝', '取消', '阻止', '否', '中止', '停止'
];

const RISK_DIALOG_HINTS = [
  'risk', 'dangerous', 'command', 'terminal', 'execute', 'shell', 'permission',
  '风险', '危险', '执行', '命令', '终端', '权限', '确认执行', '需要确认'
];

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function normalizeText(text) {
  return (text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function detectAllDialogs(page) {
  return await page.evaluate(({ APPROVE_KEYWORDS, DENY_KEYWORDS, RISK_DIALOG_HINTS }) => {
    function norm(s) { return (s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
    function exactNorm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
    function isVisible(el) {
      if (!el || !el.getBoundingClientRect) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 5 || rect.height < 5) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      return true;
    }
    function getDialogContainer(el) {
      let cur = el;
      for (let i = 0; i < 12 && cur; i++) {
        const role = (cur.getAttribute && cur.getAttribute('role')) || '';
        const cls = (cur.className && typeof cur.className === 'string') ? cur.className : '';
        const style = window.getComputedStyle(cur);
        if (role === 'dialog' || role === 'alertdialog') return cur;
        if (/(^|\s)(dialog|modal|popup|overlay|monaco-dialog|notification-toast)(\s|$)/i.test(' ' + cls + ' ')) return cur;
        if (style.position === 'fixed' && style.zIndex && parseInt(style.zIndex) > 100) return cur;
        cur = cur.parentElement;
      }
      return null;
    }
    function getMessageText(dialog) {
      if (!dialog) return '';
      const selectors = ['.dialog-message', '.message', '.monaco-dialog-box .dialog-message-text', '.dialog-description', '.body', '.content', 'p'];
      for (const sel of selectors) {
        const el = dialog.querySelector(sel);
        if (el && el.innerText && el.innerText.trim()) return el.innerText.trim();
      }
      const clone = dialog.cloneNode(true);
      clone.querySelectorAll('button, a, input, textarea').forEach(n => n.remove());
      return (clone.innerText || '').trim();
    }
    function getDialogSignature(dialog) {
      if (!dialog) return '';
      const role = (dialog.getAttribute && dialog.getAttribute('role')) || '';
      const cls = (dialog.className && typeof dialog.className === 'string') ? dialog.className : '';
      const txt = exactNorm(dialog.innerText || '').slice(0, 500);
      return `${role}|${cls.slice(0,100)}|${txt.length}|${txt.slice(0,100)}`;
    }
    function buildDialogResult(approveBtn, denyBtn, dialogEl, riskScore) {
      const messageText = getMessageText(dialogEl);
      const title = dialogEl
        ? ((dialogEl.querySelector('h1, h2, h3, .title, .dialog-title') || {}).innerText || '').trim()
        : '';
      const btnApproveText = exactNorm(approveBtn.innerText || approveBtn.textContent || '');
      const btnDenyText = denyBtn ? exactNorm(denyBtn.innerText || denyBtn.textContent || '') : '';
      const signature = getDialogSignature(dialogEl);
      const cmdSnippet = (messageText || '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3).join(' | ').slice(0, 120);
      return {
        found: true,
        riskScore,
        title,
        message: messageText,
        approveBtnText: btnApproveText,
        denyBtnText: btnDenyText,
        inDialog: !!dialogEl,
        signature,
        cmdSnippet,
        dialogZIndex: dialogEl ? (parseInt(window.getComputedStyle(dialogEl).zIndex) || 0) : 0
      };
    }
    function keywordMatchScore(btnText, keyword) {
      const t = norm(btnText);
      const kl = keyword.toLowerCase();
      if (t === kl) return 100;
      if (t === kl + ' ' || t === ' ' + kl) return 95;
      if (t.startsWith(kl)) return 80;
      if (t.endsWith(kl)) return 70;
      if (t.includes(kl)) return 50;
      return 0;
    }

    const allButtons = Array.from(document.querySelectorAll('button, [role="button"], a.monaco-button, .monaco-button, a'));
    const visibleButtons = allButtons.filter(b => isVisible(b));

    const dialogGroups = new Map();
    const orphanApprove = [];

    for (const btn of visibleButtons) {
      const rawText = exactNorm(btn.innerText || btn.textContent || btn.value || btn.getAttribute('aria-label') || '');
      if (!rawText) continue;

      let bestApprove = 0, bestApproveKw = null;
      for (const kw of APPROVE_KEYWORDS) {
        const s = keywordMatchScore(rawText, kw);
        if (s > bestApprove) { bestApprove = s; bestApproveKw = kw; }
      }
      let bestDeny = 0, bestDenyKw = null;
      for (const kw of DENY_KEYWORDS) {
        const s = keywordMatchScore(rawText, kw);
        if (s > bestDeny) { bestDeny = s; bestDenyKw = kw; }
      }
      if (bestApprove === 0 && bestDeny === 0) continue;
      const isApprove = bestApprove >= bestDeny;

      const dialogEl = getDialogContainer(btn);
      if (dialogEl) {
        const sig = getDialogSignature(dialogEl);
        if (!dialogGroups.has(sig)) {
          dialogGroups.set(sig, { dialogEl, approve: null, deny: null, zIndex: parseInt(window.getComputedStyle(dialogEl).zIndex) || 0 });
        }
        const group = dialogGroups.get(sig);
        if (isApprove) {
          if (!group.approve || bestApprove > group.approve.score) {
            group.approve = { btn, text: rawText, score: bestApprove };
          }
        } else {
          if (!group.deny || bestDeny > group.deny.score) {
            group.deny = { btn, text: rawText, score: bestDeny };
          }
        }
      } else {
        if (isApprove) orphanApprove.push({ btn, text: rawText, score: bestApprove });
      }
    }

    const results = [];
    for (const group of dialogGroups.values()) {
      if (group.approve) {
        let riskScore = 2;
        if (group.deny) riskScore += 2;
        const combined = norm(group.dialogEl.innerText || '');
        for (const hint of RISK_DIALOG_HINTS) {
          if (combined.includes(hint.toLowerCase())) riskScore++;
        }
        results.push(buildDialogResult(group.approve.btn, group.deny ? group.deny.btn : null, group.dialogEl, riskScore));
      }
    }

    if (results.length === 0 && orphanApprove.length > 0) {
      orphanApprove.sort((a, b) => b.score - a.score);
      const best = orphanApprove[0];
      let riskScore = 1;
      const container = getDialogContainer(best.btn);
      if (container) {
        const combined = norm(container.innerText || '');
        for (const hint of RISK_DIALOG_HINTS) {
          if (combined.includes(hint.toLowerCase())) riskScore++;
        }
      }
      const denyBtn = visibleButtons.find(b => {
        const t = exactNorm(b.innerText || b.textContent || '');
        if (!t) return false;
        for (const kw of DENY_KEYWORDS) {
          if (norm(t) === kw.toLowerCase() || norm(t).includes(kw.toLowerCase())) return true;
        }
        return false;
      }) || null;
      results.push(buildDialogResult(best.btn, denyBtn, container, riskScore));
    }

    results.sort((a, b) => b.dialogZIndex - a.dialogZIndex);
    return results;
  }, { APPROVE_KEYWORDS, DENY_KEYWORDS, RISK_DIALOG_HINTS });
}

function getAllPages(browser) {
  const pages = [];
  for (const ctx of browser.contexts()) {
    for (const p of ctx.pages()) pages.push(p);
  }
  return pages;
}

function getPageId(page) {
  try {
    return page._guid || page._pageId || (page.target && page.target()._targetId) || '';
  } catch (e) {
    return '';
  }
}

function parseProjectNameFromTitle(title) {
  if (!title) return '';
  let t = title.trim();
  t = t.replace(/^[●○◉◯⦿⦾\*\s]+/, '').trim();
  const parts = t.split(/\s[-–—]\s/);
  if (parts.length === 0) return '';
  const lastPart = parts[parts.length - 1].trim().toLowerCase();
  const appNames = ['trae ide', 'trae', 'visual studio code', 'vscode', 'code'];
  let nameParts = parts.slice();
  if (appNames.some(n => lastPart.includes(n))) {
    nameParts = parts.slice(0, -1);
  }
  if (nameParts.length === 0) return '';
  let projectName = nameParts[nameParts.length - 1].trim();
  projectName = projectName.replace(/[|[\](){}\\/:*?"<>]/g, '').trim();
  return projectName;
}

function parseFileNameFromTitle(title) {
  if (!title) return '';
  let t = title.trim();
  t = t.replace(/^[●○◉◯⦿⦾\*\s]+/, '').trim();
  const parts = t.split(/\s[-–—]\s/);
  if (parts.length < 3) return '';
  const lastPart = parts[parts.length - 1].trim().toLowerCase();
  const appNames = ['trae ide', 'trae', 'visual studio code', 'vscode', 'code'];
  if (appNames.some(n => lastPart.includes(n))) {
    const filePart = parts[0].trim();
    if (/\.[a-zA-Z0-9]{1,6}$/.test(filePart)) return filePart;
  }
  return '';
}

function makePageLabel(page, title, url) {
  const projectName = parseProjectNameFromTitle(title);
  if (projectName) return projectName;
  let label = '';
  if (title) {
    const t = title.replace(/[|[\](){}\/\\:*?"<>]/g, '').trim();
    label = t.slice(0, 30);
  }
  if (!label && url) {
    try {
      const u = new URL(url);
      label = u.host + u.pathname.slice(0, 20);
    } catch (e) {
      label = url.slice(0, 30);
    }
  }
  if (!label) label = 'Untitled Window';
  return label;
}

async function snapshotAllPages(browser) {
  const results = [];
  for (const ctx of browser.contexts()) {
    for (const page of ctx.pages()) {
      try {
        const url = page.url();
        const title = await page.title();
        const info = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, [role="button"], .monaco-button, a'))
            .filter(b => { const r = b.getBoundingClientRect(); return r.width > 5 && r.height > 5; })
            .map(b => (b.innerText || b.textContent || b.getAttribute('aria-label') || '').trim())
            .filter(t => t && t.length < 80);
          const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"], .dialog, .modal'))
            .map(d => (d.innerText || '').trim().slice(0, 500));
          return { buttons: buttons.slice(0, 50), dialogs };
        });
        results.push({ url, title, ...info });
      } catch (e) {
        results.push({ url: page.url(), error: e.message });
      }
    }
  }
  return results;
}

function startMonitoringMulti(browserEntries, config, onDialogDetected) {
  const instanceStates = new Map();
  const knownPageIds = new Map();

  for (const entry of browserEntries) {
    instanceStates.set(entry, {
      seenSigs: new Set(),
      disconnected: false,
      pageCounter: 0,
      pageLabels: new Map()
    });
    entry.browser.on('disconnected', () => {
      const st = instanceStates.get(entry);
      if (st) st.disconnected = true;
      log.warn(`TRAE IDE on port ${entry.port} disconnected`);
    });
  }

  let isProcessing = false;

  async function scanPagesForEntry(entry, st) {
    let allDialogs = [];
    let pages = [];
    try {
      pages = getAllPages(entry.browser);
    } catch (e) {
      st.disconnected = true;
      return allDialogs;
    }

    for (const p of pages) {
      let pageKey;
      try {
        const tid = (p.target && p.target()) ? p.target()._targetId : null;
        pageKey = tid || getPageId(p) || `${p.url()}|${(await p.title()).slice(0, 50)}`;
      } catch (e) {
        pageKey = `page-${st.pageCounter++}`;
      }

      if (!st.pageLabels.has(pageKey)) {
        let title = '';
        let url = '';
        try { title = await p.title(); url = p.url(); } catch (e) {}
        const projectName = parseProjectNameFromTitle(title) || '';
        const fileName = parseFileNameFromTitle(title) || '';
        const label = projectName || makePageLabel(p, title, url);
        st.pageLabels.set(pageKey, { title, url, label, projectName, fileName, idx: st.pageLabels.size + 1 });
        st.pageCounter++;
        if (st.pageLabels.size > 1) {
          log.info(`[port-${entry.port}] New window detected: "${label}"${fileName ? ' ('+fileName+')' : ''} (total ${st.pageLabels.size} windows)`);
        }
      }

      const pageMeta = st.pageLabels.get(pageKey);
      const windowLabel = pageMeta.label || `win-${pageMeta.idx}`;
      const windowTitle = pageMeta.title || '';
      const projectName = pageMeta.projectName || '';
      const fileName = pageMeta.fileName || '';

      try {
        const dialogs = await detectAllDialogs(p);
        for (const d of dialogs) {
          if (d.found && d.riskScore >= 2) {
            allDialogs.push({
              ...d,
              page: p,
              pageKey,
              windowIdx: pageMeta.idx,
              windowLabel,
              windowTitle,
              windowUrl: pageMeta.url,
              projectName,
              fileName
            });
          }
        }
      } catch (e) {
        if (!e.message || !/Target closed|closed|crashed/i.test(e.message)) {
        }
      }
    }

    const closedKeys = new Set(st.pageLabels.keys());
    for (const p of pages) {
      try {
        const tid = (p.target && p.target()) ? p.target()._targetId : null;
        const pk = tid || getPageId(p) || `${p.url()}|${(await p.title()).slice(0, 50)}`;
        closedKeys.delete(pk);
      } catch (e) {}
    }
    for (const k of closedKeys) {
      const meta = st.pageLabels.get(k);
      if (meta) log.info(`[port-${entry.port}] Window closed: "${meta.label}"`);
      st.pageLabels.delete(k);
    }

    return allDialogs;
  }

  const timer = setInterval(async () => {
    if (isProcessing) return;
    try {
      isProcessing = true;

      for (const entry of browserEntries) {
        const st = instanceStates.get(entry);
        if (!st || st.disconnected) continue;

        let allDialogs = [];
        try {
          allDialogs = await scanPagesForEntry(entry, st);
        } catch (e) {
          continue;
        }

        for (const dialog of allDialogs) {
          const pageUid = simpleHash(`${entry.port}|${dialog.pageKey}`);
          const sig = simpleHash(`${pageUid}|${dialog.signature}|${dialog.approveBtnText}|${dialog.denyBtnText}`);
          if (st.seenSigs.has(sig)) continue;
          st.seenSigs.add(sig);
          setTimeout(() => st.seenSigs.delete(sig), 5 * 60 * 1000);

          const portLabel = `port-${entry.port}`;
          const multiProcess = browserEntries.length > 1;
          const winCount = st.pageLabels.size;

          const projLabels = Array.from(st.pageLabels.values()).map(m => m.label).filter(Boolean);
          const sameProjInSameProcess = projLabels.filter(l => l === dialog.windowLabel).length > 1;

          let instanceLabel;
          if (dialog.projectName) {
            instanceLabel = dialog.projectName;
            if (sameProjInSameProcess && dialog.fileName) {
              instanceLabel = `${instanceLabel} · ${dialog.fileName}`;
            } else if (sameProjInSameProcess) {
              instanceLabel = `${instanceLabel} #${dialog.windowIdx}`;
            }
            if (multiProcess) {
              instanceLabel = `${instanceLabel} (${portLabel})`;
            }
          } else if (winCount > 1) {
            instanceLabel = `${portLabel}/${dialog.windowLabel}`;
          } else {
            instanceLabel = portLabel;
          }

          const snippet = dialog.cmdSnippet || (dialog.message || '').slice(0, 80).replace(/\n/g, ' ');
          log.ok(`[${instanceLabel}] Dialog detected (score=${dialog.riskScore}): "${dialog.approveBtnText}" / "${dialog.denyBtnText}"`);
          if (snippet) log.info('Command:', snippet);
          await onDialogDetected({
            ...dialog,
            browserEntry: entry,
            instanceLabel,
            portLabel,
            windowCount: winCount,
            _sig: sig,
            _pageUid: pageUid
          });
        }
      }
    } catch (e) {
      log.error('Monitor error:', e.message);
    } finally {
      isProcessing = false;
    }
  }, config.pollIntervalMs || 1500);

  function addBrowser(entry) {
    instanceStates.set(entry, {
      seenSigs: new Set(),
      disconnected: false,
      pageCounter: 0,
      pageLabels: new Map()
    });
    entry.browser.on('disconnected', () => {
      const st = instanceStates.get(entry);
      if (st) st.disconnected = true;
      log.warn(`TRAE IDE on port ${entry.port} disconnected`);
    });
    browserEntries.push(entry);
    log.ok(`Now monitoring ${browserEntries.length} TRAE IDE instance(s)`);
  }

  return { stop: () => clearInterval(timer), addBrowser };
}

module.exports = {
  detectAllDialogs,
  startMonitoringMulti,
  getAllPages,
  snapshotAllPages,
  simpleHash
};
