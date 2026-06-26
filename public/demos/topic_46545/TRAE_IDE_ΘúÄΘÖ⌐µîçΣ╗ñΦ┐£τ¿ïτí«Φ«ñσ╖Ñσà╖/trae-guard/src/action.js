const chalk = require('chalk');

const log = {
  info: (...args) => console.log(chalk.cyan('[action]'), ...args),
  warn: (...args) => console.log(chalk.yellow('[action]'), ...args),
  error: (...args) => console.log(chalk.red('[action]'), ...args),
  ok: (...args) => console.log(chalk.green('[action]'), ...args)
};

async function executeAction(page, decision, dialog) {
  const targetType = decision === 'approve' ? 'approve' : 'deny';
  const expectedApproveText = dialog.approveBtnText || '';
  const expectedDenyText = dialog.denyBtnText || '';
  const expectedSignature = dialog.signature || '';
  const targetBtnText = targetType === 'approve' ? expectedApproveText : expectedDenyText;
  const otherBtnText = targetType === 'approve' ? expectedDenyText : expectedApproveText;

  log.info(`Executing ${targetType.toUpperCase()} (button text: "${targetBtnText}")`);

  try {
    const result = await page.evaluate(({ targetType, targetBtnText, otherBtnText, expectedSignature }) => {
      function norm(s) { return (s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
      function exactNorm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
      function isVisible(el) {
        if (!el || !el.getBoundingClientRect) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) return false;
        const s = window.getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
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
      function getDialogSig(dialog) {
        if (!dialog) return '';
        const role = (dialog.getAttribute && dialog.getAttribute('role')) || '';
        const cls = (dialog.className && typeof dialog.className === 'string') ? dialog.className : '';
        const txt = exactNorm(dialog.innerText || '').slice(0, 500);
        return `${role}|${cls.slice(0,100)}|${txt.length}|${txt.slice(0,100)}`;
      }
      function buttonText(el) {
        return exactNorm(el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '');
      }
      function textMatchesExactly(elText, expected) {
        if (!expected) return false;
        return norm(elText) === norm(expected);
      }
      function textContains(elText, expected) {
        if (!expected) return false;
        return norm(elText).includes(norm(expected));
      }

      const allCandidates = Array.from(document.querySelectorAll('button, [role="button"], a.monaco-button, .monaco-button, a'))
        .filter(b => isVisible(b));

      const groups = [];
      for (const btn of allCandidates) {
        const txt = buttonText(btn);
        if (!txt) continue;
        const dlg = getDialogContainer(btn);
        const sig = dlg ? getDialogSig(dlg) : '';
        groups.push({ btn, txt, dlg, sig, zIndex: dlg ? (parseInt(window.getComputedStyle(dlg).zIndex) || 0) : 0 });
      }

      let bestMatch = null;
      let bestScore = -1;

      for (const g of groups) {
        let score = 0;
        const isTarget = textMatchesExactly(g.txt, targetBtnText);
        const isTargetLoose = !isTarget && textContains(g.txt, targetBtnText);
        const isOther = textMatchesExactly(g.txt, otherBtnText);
        if (!isTarget && !isTargetLoose) continue;
        if (isOther) continue;

        if (isTarget) score += 100;
        else if (isTargetLoose) score += 40;

        if (expectedSignature && g.sig === expectedSignature) score += 200;
        if (g.dlg) score += 30;
        score += g.zIndex;

        if (score > bestScore) {
          bestScore = score;
          bestMatch = g.btn;
        }
      }

      if (!bestMatch) return { clicked: false, reason: 'no matching button found' };

      bestMatch.click();
      bestMatch.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      return { clicked: true, usedExactMatch: bestScore >= 100 };
    }, { targetType, targetBtnText, otherBtnText, expectedSignature });

    if (result.clicked) {
      log.ok(`${targetType.toUpperCase()} executed successfully${result.usedExactMatch ? ' (exact match)' : ' (fuzzy match)'}`);
      return true;
    }

    log.warn(`Precise click failed (${result.reason}), trying keyboard fallback...`);
    const keyToPress = decision === 'deny' ? 'Escape' : 'Enter';
    await page.keyboard.press(keyToPress);
    await new Promise(r => setTimeout(r, 500));
    log.ok(`Keyboard ${keyToPress} sent as fallback`);
    return true;

  } catch (e) {
    log.error('Action execution failed:', e.message);
    return false;
  }
}

module.exports = { executeAction };
