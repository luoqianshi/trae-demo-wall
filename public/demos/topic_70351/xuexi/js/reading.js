(function () {
  const API = {
    async chat(text, history, message) {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, history, message })
      });
      const data = await resp.json();
      return data;
    },
    async imagery(text, title) {
      const resp = await fetch('/api/imagery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title })
      });
      const data = await resp.json();
      return data;
    }
  };

  const State = {
    currentText: '',
    currentTitle: '背影',
    currentAuthor: '朱自清',
    history: [],
  };

  const ThemeSwitcher = {
    themes: {
      homesick: {
        title: '静夜思',
        author: '李白',
        text: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。\n\n这首诗写的是在寂静的月夜思念家乡的感受。诗的前两句，是写诗人在作客他乡的特定环境中一刹那间所产生的错觉。一个独处他乡的人，白天奔波忙碌，倒还能冲淡离愁，然而一到夜深人静的时候，心头就难免泛起阵阵思念故乡的波澜。何况是在月明之夜，更何况是月色如霜的秋夜。'
      },
      seasons: {
        title: '春',
        author: '朱自清',
        text: '盼望着，盼望着，东风来了，春天的脚步近了。\n\n一切都像刚睡醒的样子，欣欣然张开了眼。山朗润起来了，水涨起来了，太阳的脸红起来了。\n\n小草偷偷地从土里钻出来，嫩嫩的，绿绿的。园子里，田野里，瞧去，一大片一大片满是的。坐着，躺着，打两个滚，踢几脚球，赛几趟跑，捉几回迷藏。风轻悄悄的，草软绵绵的。'
      },
      landscape: {
        title: '答谢中书书',
        author: '陶弘景',
        text: '山川之美，古来共谈。高峰入云，清流见底。两岸石壁，五色交辉。青林翠竹，四时俱备。晓雾将歇，猿鸟乱鸣；夕日欲颓，沉鳞竞跃。实是欲界之仙都。自康乐以来，未复有能与其奇者。'
      },
      family: {
        title: '散步',
        author: '莫怀戚',
        text: '我们在田野散步：我，我的母亲，我的妻子和儿子。\n\n母亲本不愿出来的。她老了，身体不好，走远一点就觉得累。我说，正因为如此，才应该多走走。母亲信服地点点头，便去拿外套。她现在很听我的话，就像我小时候很听她的话一样。\n\n天气很好。今年的春天来得太迟，太迟了，有一些老人挺不住。但是春天总算来了。我的母亲又熬过了一个严冬。'
      },
      parting: {
        title: '送杜少府之任蜀州',
        author: '王勃',
        text: '城阙辅三秦，风烟望五津。\n与君离别意，同是宦游人。\n海内存知己，天涯若比邻。\n无为在歧路，儿女共沾巾。\n\n这首诗是王勃在长安送别一位姓杜的朋友去蜀州赴任时所作。诗人以开朗的胸襟，豪迈的语调，把临别赠言说得激昂慷慨，鼓舞人心。'
      }
    },
    init() {
      const chips = document.querySelectorAll('[data-theme-chips] .chip');
      if (!chips.length) return;
      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          chips.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          const key = chip.dataset.theme;
          const theme = this.themes[key];
          if (theme) {
            this.loadTheme(theme);
          }
        });
      });
    },
    loadTheme(theme) {
      State.currentTitle = theme.title;
      State.currentAuthor = theme.author;
      State.currentText = theme.text;
      State.history = [];

      const titleEl = document.querySelector('.reading-header h2');
      const authorEl = document.querySelector('.reading-header p');
      const textEl = document.querySelector('.reading-text');
      const messagesEl = document.querySelector('[data-chat-messages]');

      if (titleEl) titleEl.textContent = theme.title;
      if (authorEl) authorEl.textContent = `${theme.author} · ${theme.text.includes('\n') ? '散文' : '古诗'}`;
      if (textEl) {
        const paragraphs = theme.text.split('\n').filter(p => p.trim());
        textEl.innerHTML = paragraphs.map((p, i) => `<p>${p}</p>`).join('');
      }
      if (messagesEl) {
        messagesEl.innerHTML = '';
        this.appendLoading(messagesEl);
        Chat.sendInitialGreeting();
      }

      Scenario.updateTheme(key);
    },
    appendLoading(container) {
      const row = document.createElement('div');
      row.className = 'chat-row chat-row-ai fade-in visible';
      row.setAttribute('data-loading', 'true');
      row.innerHTML = `
        <span class="chat-avatar-chat">墨</span>
        <div class="chat-content">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      `;
      container.appendChild(row);
    }
  };

  const Scenario = {
    questions: {
      homesick: {
        question: '题目："举头望明月，低头思故乡"中，李白为什么要写月亮？',
        teacher: '想象你在中秋节独自在外，抬头看见一轮明月，是不是会想到家里的亲人也在看同一个月亮？月亮就像一个信使，把你的思念带给远方的家。'
      },
      seasons: {
        question: '题目："小草偷偷地从土里钻出来"中，"钻"字好在哪里？',
        teacher: '想象你春天去公园，小草不是"长"出来的，而是像小虫子一样"钻"出来的，带着调皮和力量，好像在跟你玩捉迷藏呢！'
      },
      landscape: {
        question: '题目："高峰入云，清流见底"用了什么写作手法？',
        teacher: '想象你站在山脚下抬头看，山好像插到云彩里去了；低头看水，能看到水底的石头。一高一低，一上一下，这就是"动静结合"的妙处。'
      },
      family: {
        question: '题目："她现在很听我的话，就像我小时候很听她的话一样"这句话有什么深意？',
        teacher: '想象小时候妈妈牵着你的手过马路，现在你牵着妈妈的手。角色互换了，但爱没变，这就是时间带来的温暖和责任。'
      },
      parting: {
        question: '题目："海内存知己，天涯若比邻"为什么成为千古名句？',
        teacher: '想象你好朋友要去很远的地方，你很难过。但王勃告诉你：真正的朋友，就算隔得再远，心也是在一起的，就像邻居一样近。'
      }
    },
    init() {
      const questionEl = document.querySelector('[data-scenario-question]');
      const teacherEl = document.querySelector('[data-scenario-teacher]');
      if (!questionEl || !teacherEl) return;

      questionEl.addEventListener('click', () => {
        const questionText = questionEl.textContent.trim();
        const messages = document.querySelector('[data-chat-messages]');
        if (messages) {
          Chat.appendUserMessage(messages, questionText);
          Chat.scrollToBottom(messages);
          Chat.fetchReply(questionText);
        }
      });

      questionEl.style.cursor = 'pointer';
      questionEl.style.transition = 'background 0.2s ease';
      questionEl.addEventListener('mouseenter', () => {
        questionEl.style.opacity = '0.85';
      });
      questionEl.addEventListener('mouseleave', () => {
        questionEl.style.opacity = '1';
      });
    },
    updateTheme(themeKey) {
      const questionEl = document.querySelector('[data-scenario-question]');
      const teacherEl = document.querySelector('[data-scenario-teacher]');
      if (!questionEl || !teacherEl) return;

      const data = this.questions[themeKey] || this.questions.homesick;
      questionEl.innerHTML = `<p class="body-sm font-medium" style="color:var(--color-text);">${data.question}</p>`;
      teacherEl.innerHTML = `
        <span class="teacher-badge">师</span>
        <p class="body-sm" style="color:var(--color-text-secondary);">${data.teacher}</p>
      `;
    }
  };

  const Favorite = {
    init() {
      const btn = document.querySelector('[data-favorite]');
      if (!btn) return;
      let isFav = false;
      btn.addEventListener('click', () => {
        isFav = !isFav;
        const icon = btn.querySelector('[data-lucide]');
        if (icon) {
          icon.setAttribute('data-lucide', isFav ? 'bookmark-check' : 'bookmark');
          if (window.lucide) lucide.createIcons();
        }
        btn.style.background = isFav ? 'var(--color-primary)' : 'var(--color-primary-50)';
        btn.style.color = isFav ? 'var(--color-text-inverse)' : 'var(--color-primary)';
      });
    },
  };

  const ReadAloud = {
    init() {
      const btn = document.querySelector('[data-read-aloud]');
      if (!btn) return;
      let playing = false;
      btn.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) {
          alert('当前浏览器不支持语音朗读功能');
          return;
        }
        playing = !playing;
        const icon = btn.querySelector('[data-lucide]');
        if (icon) {
          icon.setAttribute('data-lucide', playing ? 'pause' : 'volume-2');
          if (window.lucide) lucide.createIcons();
        }
        if (playing) {
          const text = State.currentText || document.querySelector('.reading-text')?.innerText || '';
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'zh-CN';
          utterance.rate = 0.9;
          utterance.onend = () => {
            playing = false;
            if (icon) {
              icon.setAttribute('data-lucide', 'volume-2');
              if (window.lucide) lucide.createIcons();
            }
          };
          speechSynthesis.speak(utterance);
        } else {
          speechSynthesis.cancel();
        }
      });
    },
  };

  const Chat = {
    init() {
      const input = document.querySelector('[data-chat-input]');
      const sendBtn = document.querySelector('[data-send-message]');
      const messages = document.querySelector('[data-chat-messages]');
      if (!input || !sendBtn || !messages) return;

      if (!State.currentText) {
        const textEl = document.querySelector('.reading-text');
        State.currentText = textEl ? textEl.innerText : '';
      }

      const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;
        this.appendUserMessage(messages, text);
        input.value = '';
        this.scrollToBottom(messages);
        this.fetchReply(text);
      };

      sendBtn.addEventListener('click', () => sendMessage());
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
      });

      document.querySelectorAll('[data-question]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const text = btn.textContent.trim();
          this.appendUserMessage(messages, text);
          this.scrollToBottom(messages);
          this.fetchReply(text);
        });
      });
    },
    async sendInitialGreeting() {
      const messages = document.querySelector('[data-chat-messages]');
      if (!messages) return;
      await this.fetchReply('', true);
    },
    async fetchReply(userMessage, isInitial = false) {
      const messages = document.querySelector('[data-chat-messages]');
      if (!messages) return;

      if (userMessage) {
        State.history.push({ role: 'user', content: userMessage });
      }

      this.appendLoading(messages);
      this.scrollToBottom(messages);

      try {
        const result = await API.chat(State.currentText, State.history, userMessage);

        this.removeLoading(messages);

        if (result.error) {
          this.appendError(messages, result.message || '对话失败，请稍后重试');
        } else {
          const reply = result.reply || '';
          State.history.push({ role: 'assistant', content: reply });
          this.appendAIReply(messages, reply);
        }
      } catch (err) {
        this.removeLoading(messages);
        this.appendError(messages, '网络错误，请检查连接后重试');
      }

      this.scrollToBottom(messages);
    },
    appendLoading(container) {
      const row = document.createElement('div');
      row.className = 'chat-row chat-row-ai fade-in visible';
      row.setAttribute('data-loading', 'true');
      row.innerHTML = `
        <span class="chat-avatar-chat">墨</span>
        <div class="chat-content">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      `;
      container.appendChild(row);
    },
    removeLoading(container) {
      const loading = container.querySelector('[data-loading]');
      if (loading) loading.remove();
    },
    appendUserMessage(container, text) {
      const row = document.createElement('div');
      row.className = 'chat-row chat-row-user fade-in visible';
      row.innerHTML = `
        <div class="chat-bubble-user-sm">
          <p class="body-md" style="color:var(--color-text);">${this.escapeHtml(text)}</p>
        </div>
        <span class="chat-avatar-user">学</span>
      `;
      container.appendChild(row);
    },
    appendAIReply(container, text) {
      const row = document.createElement('div');
      row.className = 'chat-row chat-row-ai fade-in visible';
      const formatted = this.formatReply(text);
      row.innerHTML = `
        <span class="chat-avatar-chat">墨</span>
        <div class="chat-content">${formatted}</div>
      `;
      container.appendChild(row);
    },
    appendError(container, message) {
      const row = document.createElement('div');
      row.className = 'chat-row chat-row-ai fade-in visible';
      row.innerHTML = `
        <span class="chat-avatar-chat" style="background: var(--state-error);">!</span>
        <div class="chat-content">
          <p class="body-md" style="color: var(--state-error);">${this.escapeHtml(message)}</p>
        </div>
      `;
      container.appendChild(row);
    },
    formatReply(text) {
      let followup = '';
      const followupMatch = text.match(/AI追问：(.+)/);
      if (followupMatch) {
        followup = followupMatch[1];
        text = text.replace(/AI追问：.+/, '');
      }

      const lines = text.split('\n').filter(l => l.trim());
      let formatted = lines.map(line => {
        line = this.escapeHtml(line);
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-primary);">$1</strong>');
        return `<p class="body-md" style="color:var(--color-text);margin-bottom:0.75em;">${line}</p>`;
      }).join('');

      if (followup) {
        formatted += `
          <div class="ai-followup">
            <span class="ai-followup-label">AI追问</span>
            <p class="ai-followup-content">${this.escapeHtml(followup)}</p>
          </div>
        `;
      }

      return formatted;
    },
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },
    scrollToBottom(container) {
      container.scrollTop = container.scrollHeight;
    },
  };

  const RefreshAnalysis = {
    init() {
      const btn = document.querySelector('[data-refresh-analysis]');
      if (!btn) return;
      btn.addEventListener('click', async () => {
        btn.style.opacity = '0.6';
        const icon = btn.querySelector('[data-lucide]');
        if (icon) {
          icon.style.transform = 'rotate(360deg)';
          icon.style.transition = 'transform 0.6s ease';
        }

        State.history = [];
        const messages = document.querySelector('[data-chat-messages]');
        if (messages) messages.innerHTML = '';

        await Chat.sendInitialGreeting();

        setTimeout(() => {
          btn.style.opacity = '1';
          if (icon) icon.style.transform = 'rotate(0deg)';
        }, 600);
      });
    },
  };

  const ImportText = {
    init() {
      const btn = document.querySelector('[data-import-text]');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md';
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const content = ev.target?.result || '';
            if (!content.trim()) {
              alert('文件内容为空');
              return;
            }
            this.loadImportedText(file.name, content);
          };
          reader.readAsText(file, 'UTF-8');
        };
        input.click();
      });
    },
    loadImportedText(filename, content) {
      const title = filename.replace(/\.[^/.]+$/, '') || '导入的课文';
      State.currentTitle = title;
      State.currentAuthor = '导入课文';
      State.currentText = content;
      State.history = [];

      const titleEl = document.querySelector('.reading-header h2');
      const authorEl = document.querySelector('.reading-header p');
      const textEl = document.querySelector('.reading-text');
      const messagesEl = document.querySelector('[data-chat-messages]');

      if (titleEl) titleEl.textContent = title;
      if (authorEl) authorEl.textContent = '导入课文';
      if (textEl) {
        const paragraphs = content.split(/\n+/).filter(p => p.trim());
        textEl.innerHTML = paragraphs.map(p => `<p>${this.escapeHtml(p)}</p>`).join('');
      }
      if (messagesEl) {
        messagesEl.innerHTML = '';
        Chat.sendInitialGreeting();
      }
    },
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    ThemeSwitcher.init();
    Favorite.init();
    ReadAloud.init();
    Scenario.init();
    Chat.init();
    RefreshAnalysis.init();
    ImportText.init();
  });
})();
