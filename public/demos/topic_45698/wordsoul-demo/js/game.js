/**
 * WordSoul - 自我迭代模式
 * 核心玩法：录入词语 → 两两配对 → 吞噬选择 → AI/本地裁判 → 灵魂关键词
 */

var Game = {
  // 游戏状态
  state: {
    phase: 'input', // input | battle | result
    words: [],
    currentPair: [],
    winners: [],
    losers: [],
    round: 0,
    totalRounds: 0,
    history: []
  },

  // 初始化
  init() {
    this.state = {
      phase: 'input',
      words: [],
      currentPair: [],
      winners: [],
      losers: [],
      round: 0,
      totalRounds: 0,
      history: []
    };
    this.render();
  },

  // 渲染游戏界面
  render() {
    const container = document.getElementById('game-container');
    if (!container) return;

    switch (this.state.phase) {
      case 'input':
        container.innerHTML = this.renderInputPhase();
        this.bindInputEvents();
        break;
      case 'battle':
        container.innerHTML = this.renderBattlePhase();
        break;
      case 'result':
        container.innerHTML = this.renderResultPhase();
        break;
    }
  },

  // 录入阶段
  renderInputPhase() {
    return `
      <div class="max-w-xl mx-auto animate-fade-in">
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-6 mb-6">
          <h3 class="text-lg font-bold text-white mb-4">录入你的内心词语</h3>
          <p class="text-soul-muted text-sm mb-4">
            输入 8-12 个代表你当前内心想法的词语。可以是抽象概念（如"自由""稳定"），
            也可以是具体事物（如"家人""创业"）。<br>
            <span class="text-soul-secondary">建议：选择那些让你感到矛盾或纠结的词语</span>
          </p>

          <div class="flex gap-2 mb-4">
            <input type="text" id="word-input"
              placeholder="输入一个词语，按回车添加"
              class="soul-input flex-1"
              maxlength="10">
            <button onclick="Game.addWord()" class="soul-btn px-4">
              添加
            </button>
          </div>

          <div id="word-tags" class="flex flex-wrap gap-2 min-h-[60px]">
            ${this.state.words.map((word, i) => `
              <span class="word-tag animate-fade-in">
                ${word}
                <span class="remove" onclick="Game.removeWord(${i})">&times;</span>
              </span>
            `).join('')}
          </div>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-soul-border">
            <span class="text-sm text-soul-muted">
              已录入 <strong class="text-white">${this.state.words.length}</strong> 个词语
              ${this.state.words.length < 8 ? '（至少 8 个）' : ''}
            </span>
            <button onclick="Game.startBattle()"
              class="soul-btn ${this.state.words.length < 8 ? 'opacity-50 cursor-not-allowed' : ''}"
              ${this.state.words.length < 8 ? 'disabled' : ''}>
              开始对战
            </button>
          </div>
        </div>

        <!-- 示例词语 -->
        <div class="text-center">
          <p class="text-soul-muted text-sm mb-2">没有灵感？试试这些：</p>
          <div class="flex flex-wrap justify-center gap-2">
            ${['自由', '稳定', '成长', '关系', '成就', '健康', '财富', '创造', '平静', '冒险'].map(w => `
              <button onclick="Game.quickAdd('${w}')"
                class="text-xs bg-soul-elevated border border-soul-border rounded-full px-3 py-1 text-soul-muted hover:text-white hover:border-soul-primary transition-all">
                ${w}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // 绑定输入事件
  bindInputEvents() {
    const input = document.getElementById('word-input');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addWord();
      });
      input.focus();
    }
  },

  // 添加词语
  addWord() {
    const input = document.getElementById('word-input');
    const word = input.value.trim();

    if (!word) return;
    if (this.state.words.includes(word)) {
      App.showToast('该词语已存在');
      return;
    }
    if (this.state.words.length >= 12) {
      App.showToast('最多 12 个词语');
      return;
    }

    this.state.words.push(word);
    Storage.addWord(word);
    input.value = '';
    this.render();
  },

  // 快速添加
  quickAdd(word) {
    if (this.state.words.includes(word)) {
      App.showToast('该词语已存在');
      return;
    }
    if (this.state.words.length >= 12) {
      App.showToast('最多 12 个词语');
      return;
    }
    this.state.words.push(word);
    Storage.addWord(word);
    this.render();
  },

  // 删除词语
  removeWord(index) {
    this.state.words.splice(index, 1);
    this.render();
  },

  // 开始对战
  startBattle() {
    if (this.state.words.length < 8) return;

    // 计算总轮次
    const n = this.state.words.length;
    this.state.totalRounds = n - 1;
    this.state.round = 1;
    this.state.winners = [...this.state.words];
    this.state.losers = [];
    this.state.history = [];

    this.nextBattle();
  },

  // 下一轮对战
  nextBattle() {
    if (this.state.winners.length === 1) {
      this.state.phase = 'result';
      this.render();
      return;
    }

    // 随机选择两个词语
    const shuffled = [...this.state.winners].sort(() => Math.random() - 0.5);
    this.state.currentPair = [shuffled[0], shuffled[1]];
    this.state.phase = 'battle';
    this.render();
  },

  // 对战阶段
  renderBattlePhase() {
    const [wordA, wordB] = this.state.currentPair;
    const progress = ((this.state.round - 1) / this.state.totalRounds) * 100;

    return `
      <div class="max-w-2xl mx-auto animate-fade-in">
        <!-- 进度 -->
        <div class="mb-6">
          <div class="flex justify-between text-sm text-soul-muted mb-2">
            <span>第 ${this.state.round} / ${this.state.totalRounds} 轮</span>
            <span>剩余 ${this.state.winners.length} 个词语</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${progress}%"></div>
          </div>
        </div>

        <!-- 对战区域 -->
        <div class="battle-arena mb-6">
          <p class="text-center text-soul-muted text-sm mb-6">选择你认为更重要的词语，并给出理由</p>

          <div class="grid grid-cols-2 gap-6 relative z-10">
            <div class="word-card" onclick="Game.choose('${wordA}')">
              <div class="text-3xl font-bold text-white mb-2">${wordA}</div>
              <p class="text-soul-muted text-sm">点击选择</p>
            </div>
            <div class="word-card" onclick="Game.choose('${wordB}')">
              <div class="text-3xl font-bold text-white mb-2">${wordB}</div>
              <p class="text-soul-muted text-sm">点击选择</p>
            </div>
          </div>
        </div>

        <!-- 已淘汰 -->
        ${this.state.losers.length > 0 ? `
          <div class="text-center">
            <p class="text-soul-muted text-sm mb-2">已淘汰</p>
            <div class="flex flex-wrap justify-center gap-2">
              ${this.state.losers.map(w => `
                <span class="text-xs text-soul-muted bg-soul-surface border border-soul-border rounded-full px-2 py-1 opacity-50">${w}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // 选择词语
  choose(chosen) {
    const [wordA, wordB] = this.state.currentPair;
    const other = chosen === wordA ? wordB : wordA;

    // 显示理由输入对话框
    const reason = prompt(`你选择了「${chosen}」吞噬「${other}」\n\n请给出理由（为什么它更重要）：`);

    if (reason === null) return; // 用户取消
    if (!reason.trim()) {
      App.showToast('请给出理由');
      return;
    }

    this.processBattle(chosen, other, reason.trim());
  },

  // 处理对战结果
  async processBattle(chosen, other, reason) {
    // 显示加载状态
    const container = document.getElementById('game-container');
    container.innerHTML = `
      <div class="text-center py-12 animate-fade-in">
        <div class="w-16 h-16 border-4 border-soul-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-soul-muted">AI 裁判正在分析...</p>
      </div>
    `;

    // 调用裁判
    const result = await AIJudge.judge(chosen, other, reason, chosen);

    // 记录历史
    this.state.history.push({
      pair: [chosen, other],
      chosen,
      reason,
      result
    });

    // 更新胜者/败者
    this.state.winners = this.state.winners.filter(w => w !== other);
    this.state.losers.push(other);
    this.state.round++;

    // 显示结果
    this.showBattleResult(chosen, other, reason, result);
  },

  // 显示对战结果
  showBattleResult(chosen, other, reason, result) {
    const container = document.getElementById('game-container');

    container.innerHTML = `
      <div class="max-w-xl mx-auto animate-fade-in">
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-6">
          <div class="text-center mb-6">
            <div class="inline-flex items-center gap-3 mb-4">
              <span class="text-2xl font-bold text-soul-secondary">${chosen}</span>
              <span class="text-soul-muted">吞噬了</span>
              <span class="text-2xl font-bold text-soul-muted line-through">${other}</span>
            </div>
            <p class="text-soul-muted text-sm">你的理由："${reason}"</p>
          </div>

          <!-- AI 分析 -->
          <div class="bg-soul-bg rounded-xl p-4 mb-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs px-2 py-1 rounded ${result.source === 'ai' ? 'bg-soul-primary/20 text-soul-primary' : 'bg-soul-muted/20 text-soul-muted'}">
                ${result.source === 'ai' ? 'AI 裁判' : '本地裁判'}
              </span>
              ${result.values && result.values.length > 0 ? `
                <span class="text-xs text-soul-muted">涉及价值观：${result.values.join('、')}</span>
              ` : ''}
            </div>
            <p class="text-white text-sm mb-2">${result.analysis}</p>
            <p class="text-soul-secondary text-sm">${result.feedback}</p>
          </div>

          <!-- 评分 -->
          ${result.consistency && result.depth ? `
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="text-center bg-soul-bg rounded-xl p-3">
                <div class="text-2xl font-bold text-soul-primary">${result.consistency}/10</div>
                <div class="text-xs text-soul-muted">一致性</div>
              </div>
              <div class="text-center bg-soul-bg rounded-xl p-3">
                <div class="text-2xl font-bold text-soul-secondary">${result.depth}/10</div>
                <div class="text-xs text-soul-muted">思考深度</div>
              </div>
            </div>
          ` : ''}

          <button onclick="Game.nextBattle()" class="soul-btn w-full">
            ${this.state.winners.length === 1 ? '查看最终结果' : '下一轮'}
          </button>
        </div>
      </div>
    `;
  },

  // 结果阶段
  renderResultPhase() {
    const winner = this.state.winners[0];
    const stats = Storage.getStats();

    // 保存记录
    Storage.saveRecord({
      mode: 'iter',
      words: this.state.words,
      winner,
      history: this.state.history,
      result: 'win'
    });

    return `
      <div class="max-w-xl mx-auto animate-fade-in text-center">
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-8">
          <p class="text-soul-muted mb-4">经过 ${this.state.totalRounds} 轮对战</p>

          <div class="mb-6">
            <div class="text-sm text-soul-muted mb-2">你的灵魂关键词是</div>
            <div class="text-5xl font-bold text-soul-primary animate-pulse">${winner}</div>
          </div>

          <div class="bg-soul-bg rounded-xl p-4 mb-6 text-left">
            <h4 class="text-white font-bold mb-2">对战历程</h4>
            <div class="space-y-2">
              ${this.state.history.map((h, i) => `
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-soul-muted w-8">${i + 1}.</span>
                  <span class="text-soul-secondary">${h.chosen}</span>
                  <span class="text-soul-muted">→</span>
                  <span class="text-soul-muted line-through">${h.pair.find(w => w !== h.chosen)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="flex gap-3">
            <button onclick="Game.init()" class="soul-btn flex-1">
              再来一次
            </button>
            <button onclick="router.navigate('profile')" class="soul-btn soul-btn-secondary flex-1">
              查看资料
            </button>
          </div>
        </div>
      </div>
    `;
  }
};
