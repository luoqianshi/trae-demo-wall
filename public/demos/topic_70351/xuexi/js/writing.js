(function () {
  const API = {
    async polish(essay) {
      const resp = await fetch('/api/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essay })
      });
      return await resp.json();
    },
    async suggestions(essay) {
      const resp = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essay })
      });
      return await resp.json();
    },
    async vocab(essay) {
      const resp = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essay })
      });
      return await resp.json();
    },
    async imagery(text, title) {
      const resp = await fetch('/api/imagery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title })
      });
      return await resp.json();
    }
  };

  const WordCount = {
    init() {
      const editor = document.querySelector('[data-editor]');
      const countEl = document.querySelector('[data-word-count]');
      if (!editor || !countEl) return;
      const update = () => {
        const text = editor.innerText.replace(/\s/g, '');
        countEl.textContent = text.length;
      };
      editor.addEventListener('input', update);
      update();
    },
  };

  const TemplateSwitcher = {
    templates: {
      narrative: {
        title: '记叙文',
        content: '<p style="text-indent: 2em; margin-bottom: 1.5em;">那是一个阳光明媚的下午，我独自走在回家的路上，心里装着满满的心事。</p><p style="text-indent: 2em; margin-bottom: 1.5em;">路旁的梧桐树叶子沙沙作响，像是在低声诉说着什么。我停下脚步，抬头望向天空，一群候鸟正排着整齐的队伍向南飞去。</p><p style="text-indent: 2em; margin-bottom: 1.5em;">那一刻，我忽然想起了很久很久以前的一件事...</p>',
      },
      argumentative: {
        title: '议论文',
        content: '<p style="text-indent: 2em; margin-bottom: 1.5em;">古人云："学无止境。"在这个日新月异的时代，持续学习的重要性愈发凸显。</p><p style="text-indent: 2em; margin-bottom: 1.5em;">首先，学习是个人成长的阶梯。唯有不断汲取新知识，才能拓宽视野、提升能力，在竞争中脱颖而出。其次，学习是社会进步的动力。每一次科技的飞跃，都离不开人类对未知的探索。</p><p style="text-indent: 2em; margin-bottom: 1.5em;">综上所述，学习不仅是一种责任，更是一种生活方式。让我们以书为友，以学为乐，在求知的道路上不断前行。</p>',
      },
      review: {
        title: '读后感',
        content: '<p style="text-indent: 2em; margin-bottom: 1.5em;">翻开这本《背影》，我仿佛穿越了时光的长廊，站在了那个月台上，看着那个蹒跚的背影渐行渐远。</p><p style="text-indent: 2em; margin-bottom: 1.5em;">朱自清用最朴素的文字，写出了最深沉的父爱。没有华丽的辞藻，没有激烈的情感宣泄，只有那一句"我买几个橘子去"，却胜过千言万语。这让我想起了我的父亲...</p><p style="text-indent: 2em; margin-bottom: 1.5em;">合上书页，我久久不能平静。原来，最深的爱，往往藏在最平淡的日常里。</p>',
      },
      lyrical: {
        title: '写景抒情',
        content: '<p style="text-indent: 2em; margin-bottom: 1.5em;">春日的清晨，薄雾如轻纱般笼罩着大地。远处的山峦若隐若现，像是水墨画中晕开的笔触。</p><p style="text-indent: 2em; margin-bottom: 1.5em;">小径两旁的樱花正开得烂漫，粉白的花瓣随风飘落，铺成一条柔软的花毯。空气中弥漫着淡淡的花香，混着泥土的清新气息，让人忍不住深呼吸。</p><p style="text-indent: 2em; margin-bottom: 1.5em;">我静静地站在这春光里，心中所有的烦恼都被这温柔的景色融化了。原来，大自然才是最好的治愈师。</p>',
      },
    },
    init() {
      const cards = document.querySelectorAll('[data-template]');
      const editor = document.querySelector('[data-editor]');
      if (!cards.length || !editor) return;
      cards.forEach((card) => {
        card.addEventListener('click', () => {
          cards.forEach((c) => c.classList.remove('active'));
          card.classList.add('active');
          const key = card.dataset.template;
          const tpl = this.templates[key];
          if (tpl) {
            editor.innerHTML = tpl.content;
            editor.dispatchEvent(new Event('input'));
            WritingAssistant.refreshAll();
          }
        });
      });
    },
  };

  const Toolbar = {
    init() {
      const editor = document.querySelector('[data-editor]');
      const btns = document.querySelectorAll('[data-tool]');
      if (!editor || !btns.length) return;

      const exec = (cmd, value = null) => {
        editor.focus();
        document.execCommand(cmd, false, value);
        editor.dispatchEvent(new Event('input'));
      };

      btns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const tool = btn.dataset.tool;
          switch (tool) {
            case 'bold':
              exec('bold');
              btn.classList.toggle('active');
              break;
            case 'italic':
              exec('italic');
              btn.classList.toggle('active');
              break;
            case 'underline':
              exec('underline');
              btn.classList.toggle('active');
              break;
            case 'heading':
              document.execCommand('formatBlock', false, 'h3');
              break;
            case 'list':
              exec('insertUnorderedList');
              break;
            case 'quote':
              document.execCommand('formatBlock', false, 'blockquote');
              break;
            case 'undo':
              exec('undo');
              break;
            case 'redo':
              exec('redo');
              break;
          }
        });
      });
    },
  };

  const AIPolish = {
    init() {
      const btn = document.querySelector('[data-ai-polish]');
      const editor = document.querySelector('[data-editor]');
      if (!btn || !editor) return;

      btn.addEventListener('click', async () => {
        const essay = editor.innerText.trim();
        if (!essay) {
          alert('请先写一些内容再润色');
          return;
        }

        const original = btn.innerHTML;
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<i data-lucide="loader-2" style="width:14px;height:14px;animation:spin 1s linear infinite;"></i><span>润色中...</span>';
        if (window.lucide) lucide.createIcons();

        try {
          const result = await API.polish(essay);

          if (result.error) {
            alert(result.message || '润色失败，请稍后重试');
          } else {
            this.showPolishResult(essay, result);
          }
        } catch (err) {
          alert('网络错误，请检查连接后重试');
        } finally {
          btn.disabled = false;
          btn.style.opacity = '';
          btn.innerHTML = original;
          if (window.lucide) lucide.createIcons();
        }
      });
    },
    showPolishResult(original, result) {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
        display: flex; align-items: center; justify-content: center; padding: 1.5rem;
      `;
      modal.innerHTML = `
        <div style="background: var(--color-surface); border-radius: var(--radius-xl); width: 100%; max-width: 900px; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
          <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border-light); display: flex; align-items: center; justify-content: space-between;">
            <h3 class="heading-md" style="color: var(--color-text); margin: 0;">AI润色结果</h3>
            <button class="icon-btn" data-close-modal style="width:32px;height:32px;border-radius:var(--radius-lg);background:var(--color-bg);color:var(--color-text-secondary);border:none;cursor:pointer;">
              <i data-lucide="x" style="width:18px;height:18px;"></i>
            </button>
          </div>
          <div style="flex:1; overflow-y:auto; padding: 1.5rem;">
            ${result.overall_comment ? `
              <div style="background: var(--color-primary-50); border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1.25rem;">
                <p class="body-sm" style="color: var(--color-primary-700); margin: 0; line-height: 1.7;">${this.escapeHtml(result.overall_comment)}</p>
              </div>
            ` : ''}
            <div style="display: grid; grid-template-columns: 1fr; gap: 1.25rem;">
              <div>
                <p class="label" style="color: var(--color-text-secondary); margin-bottom: 0.5rem;">原文</p>
                <div style="background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1rem; font-family: var(--font-display); line-height: 2; max-height: 280px; overflow-y: auto; white-space: pre-wrap;">${this.escapeHtml(original)}</div>
              </div>
              <div>
                <p class="label" style="color: var(--color-primary); margin-bottom: 0.5rem;">润色后</p>
                <div data-polished-text style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200); border-radius: var(--radius-lg); padding: 1rem; font-family: var(--font-display); line-height: 2; max-height: 280px; overflow-y: auto; white-space: pre-wrap;">${this.escapeHtml(result.polished_essay)}</div>
              </div>
            </div>
            ${result.changes_summary && result.changes_summary.length ? `
              <div style="margin-top: 1.25rem;">
                <p class="label" style="color: var(--color-text-secondary); margin-bottom: 0.5rem;">修改要点</p>
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
                  ${result.changes_summary.map((c, i) => `
                    <li style="display: flex; gap: 0.5rem; align-items: flex-start;">
                      <span style="width: 20px; height: 20px; border-radius: 50%; background: var(--color-primary-100); color: var(--color-primary-700); font-size: var(--text-xs); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;">${i + 1}</span>
                      <span class="body-sm" style="color: var(--color-text); line-height: 1.6;">${this.escapeHtml(c)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
          <div style="padding: 1rem 1.5rem; border-top: 1px solid var(--color-border-light); display: flex; gap: 0.75rem; justify-content: flex-end;">
            <button class="btn-secondary" data-close-modal>取消</button>
            <button class="btn-primary" data-apply-polish>应用润色结果</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      if (window.lucide) lucide.createIcons();

      const close = () => modal.remove();
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
      modal.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', close);
      });
      modal.querySelector('[data-apply-polish]').addEventListener('click', () => {
        const editor = document.querySelector('[data-editor]');
        const polished = modal.querySelector('[data-polished-text]')?.innerText || '';
        if (editor && polished) {
          const paragraphs = polished.split(/\n+/).filter(p => p.trim());
          editor.innerHTML = paragraphs.map(p => `<p style="text-indent: 2em; margin-bottom: 1.5em;">${this.escapeHtml(p)}</p>`).join('');
          editor.dispatchEvent(new Event('input'));
        }
        close();
      });
    },
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  const Suggestions = {
    init() {
      const editor = document.querySelector('[data-editor]');
      if (!editor) return;
      this.loaded = false;
      editor.addEventListener('input', () => {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this.refresh(), 1500);
      });
      setTimeout(() => this.refresh(), 1000);
    },
    async refresh() {
      const editor = document.querySelector('[data-editor]');
      const listEl = document.querySelector('.suggestion-list');
      if (!editor || !listEl) return;

      const essay = editor.innerText.trim();
      if (!essay || essay.length < 50) return;

      if (this._loading) return;
      this._loading = true;

      try {
        const result = await API.suggestions(essay);
        if (!result.error && result.suggestions && result.suggestions.length) {
          const suggestions = result.suggestions.slice(0, 5);
          listEl.innerHTML = suggestions.map(s => `
            <div class="suggestion-item">
              <span class="suggestion-num">${s.num || ''}</span>
              <p class="body-xs" style="color:var(--color-text-secondary);line-height:1.6;">${this.escapeHtml(typeof s === 'string' ? s : s.text)}</p>
            </div>
          `).join('');
        }
      } catch (err) {
        // Silently fail - keep existing suggestions
      } finally {
        this._loading = false;
      }
    },
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  const Vocab = {
    init() {
      const editor = document.querySelector('[data-editor]');
      const listEl = document.querySelector('.vocab-list');
      if (!editor || !listEl) return;

      editor.addEventListener('input', () => {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this.refresh(), 2000);
      });

      listEl.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-vocab-chip]');
        if (!chip) return;
        const improved = chip.dataset.improved;
        if (!improved) return;
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
          document.execCommand('insertText', false, improved);
          editor.dispatchEvent(new Event('input'));
        }
      });

      setTimeout(() => this.refresh(), 1500);
    },
    async refresh() {
      const editor = document.querySelector('[data-editor]');
      const listEl = document.querySelector('.vocab-list');
      if (!editor || !listEl) return;

      const essay = editor.innerText.trim();
      if (!essay || essay.length < 50) return;

      if (this._loading) return;
      this._loading = true;

      try {
        const result = await API.vocab(essay);
        if (!result.error && result.vocab_list && result.vocab_list.length) {
          const items = result.vocab_list.slice(0, 6);
          listEl.innerHTML = items.map(v => `
            <span class="vocab-chip" data-vocab-chip data-improved="${this.escapeHtml(v.improved)}" title="${this.escapeHtml(v.reason || '')}">
              ${this.escapeHtml(v.original)} → ${this.escapeHtml(v.improved)}
            </span>
          `).join('');
        }
      } catch (err) {
        // Silently fail
      } finally {
        this._loading = false;
      }
    },
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  const Imagery = {
    init() {
      const editor = document.querySelector('[data-editor]');
      const quoteEl = document.querySelector('.imagery-card p');
      if (!editor || !quoteEl) return;

      editor.addEventListener('input', () => {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this.refresh(), 2500);
      });

      setTimeout(() => this.refresh(), 2000);
    },
    async refresh() {
      const editor = document.querySelector('[data-editor]');
      const quoteEl = document.querySelector('.imagery-quote-target');
      const descEl = document.querySelector('.imagery-card .body-xs');
      if (!editor) return;

      const essay = editor.innerText.trim();
      if (!essay || essay.length < 50) return;

      if (this._loading) return;
      this._loading = true;

      try {
        const result = await API.imagery(essay, '我的作文');
        if (!result.error && result.description) {
          const allPs = document.querySelectorAll('.imagery-card p');
          if (allPs.length > 0) {
            allPs[0].textContent = `"${result.description}"`;
          }
          if (result.scenes && result.scenes.length) {
            // Could update scene list
          }
        }
      } catch (err) {
        // Silently fail
      } finally {
        this._loading = false;
      }
    }
  };

  const WritingAssistant = {
    refreshAll() {
      Suggestions.refresh();
      Vocab.refresh();
      Imagery.refresh();
    },
    init() {
      WordCount.init();
      TemplateSwitcher.init();
      Toolbar.init();
      AIPolish.init();
      Suggestions.init();
      Vocab.init();
      Imagery.init();
    }
  };

  const Submit = {
    init() {
      const btn = document.querySelector('[data-submit]');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const editor = document.querySelector('[data-editor]');
        const count = document.querySelector('[data-word-count]')?.textContent || '0';
        const text = editor?.innerText?.trim() || '';
        if (!text) {
          alert('请先写一些内容再提交');
          return;
        }
        alert(`作文已提交！\n\n字数：${count} 字\n\n（演示功能，真实提交需接入后端）`);
      });
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    WritingAssistant.init();
    Submit.init();
  });
})();
