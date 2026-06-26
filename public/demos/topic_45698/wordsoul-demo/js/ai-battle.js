/**
 * WordSoul - AI 对战模式
 * 用户与 AI 轮流出词对决
 */

var AIBattle = {
  state: {
    phase: 'setup', // setup | playing | result
    userWord: '',
    aiWord: '',
    round: 1,
    maxRounds: 3,
    userScore: 0,
    aiScore: 0,
    history: []
  },

  // AI 词库
  AI_WORD_BANK: [
    '自由', '稳定', '成长', '关系', '成就', '健康',
    '财富', '创造', '平静', '冒险', '责任', '梦想',
    '安全', '独立', '合作', '挑战', '享受', '学习',
    '权力', '名誉', '爱情', '家庭', '事业', '兴趣'
  ],

  init() {
    this.state = {
      phase: 'setup',
      userWord: '',
      aiWord: '',
      round: 1,
      maxRounds: 3,
      userScore: 0,
      aiScore: 0,
      history: []
    };
    this.render();
  },

  render() {
    const container = document.getElementById('battle-container');
    if (!container) return;

    switch (this.state.phase) {
      case 'setup':
        container.innerHTML = this.renderSetup();
        break;
      case 'playing':
        container.innerHTML = this.renderPlaying();
        break;
      case 'result':
        container.innerHTML = this.renderResult();
        break;
    }
  },

  renderSetup() {
    return `
      <div class="max-w-xl mx-auto animate-fade-in">
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-6">
          <h3 class="text-lg font-bold text-white mb-4">选择你的出战词语</h3>
          <p class="text-soul-muted text-sm mb-4">
            选择一个代表你当前价值观的词语，与 AI 进行 3 轮对决。
          </p>

          <div class="flex gap-2 mb-4">
            <input type="text" id="battle-word-input"
              placeholder="输入你的出战词语"
              class="soul-input flex-1"
              maxlength="10">
            <button onclick="AIBattle.start()" class="soul-btn px-4">
              开始对决
            </button>
          </div>

          <div class="text-center">
            <p class="text-soul-muted text-sm mb-2">或从词库中选择：</p>
            <div class="flex flex-wrap justify-center gap-2">
              ${Storage.getWordBank().slice(0, 8).map(w => `
                <button onclick="AIBattle.selectWord('${w}')"
                  class="text-xs bg-soul-elevated border border-soul-border rounded-full px-3 py-1 text-soul-muted hover:text-white hover:border-soul-primary transition-all">
                  ${w}
                </button>
              `).join('') || '<p class="text-soul-muted text-xs">暂无词库记录，请先进行自我迭代模式</p>'}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  selectWord(word) {
    document.getElementById('battle-word-input').value = word;
  },

  start() {
    const input = document.getElementById('battle-word-input');
    const word = input.value.trim();

    if (!word) {
      App.showToast('请输入出战词语');
      return;
    }

    this.state.userWord = word;
    this.state.aiWord = this.generateAIWord();
    this.state.phase = 'playing';
    this.render();
  },

  generateAIWord() {
    // 从 AI 词库中随机选择，尽量不与用户词语重复
    const available = this.AI_WORD_BANK.filter(w => w !== this.state.userWord);
    return available[Math.floor(Math.random() * available.length)];
  },

  renderPlaying() {
    const { userWord, aiWord, round, maxRounds, userScore, aiScore } = this.state;

    return `
      <div class="max-w-2xl mx-auto animate-fade-in">
        <!-- 比分 -->
        <div class="flex justify-center items-center gap-8 mb-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-soul-secondary">${userScore}</div>
            <div class="text-sm text-soul-muted">你</div>
          </div>
          <div class="text-soul-muted text-xl">VS</div>
          <div class="text-center">
            <div class="text-3xl font-bold text-soul-accent">${aiScore}</div>
            <div class="text-sm text-soul-muted">AI</div>
          </div>
        </div>

        <div class="text-center text-sm text-soul-muted mb-4">
          第 ${round} / ${maxRounds} 轮
        </div>

        <!-- 对战区域 -->
        <div class="battle-arena mb-6">
          <div class="grid grid-cols-2 gap-6 relative z-10">
            <div class="text-center">
              <div class="word-card cursor-default">
                <div class="text-sm text-soul-muted mb-1">你的词语</div>
                <div class="text-3xl font-bold text-soul-secondary">${userWord}</div>
              </div>
            </div>
            <div class="text-center">
              <div class="word-card cursor-default">
                <div class="text-sm text-soul-muted mb-1">AI 的词语</div>
                <div class="text-3xl font-bold text-soul-accent">${aiWord}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 辩护输入 -->
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-6">
          <h4 class="text-white font-bold mb-2">为你的词语辩护</h4>
          <p class="text-soul-muted text-sm mb-4">
            说明为什么「${userWord}」比「${aiWord}」更重要
          </p>
          <textarea id="defense-input"
            placeholder="写出你的辩护理由..."
            class="soul-input h-24 resize-none mb-4"
            maxlength="200"></textarea>
          <button onclick="AIBattle.submitDefense()" class="soul-btn w-full">
            提交辩护
          </button>
        </div>
      </div>
    `;
  },

  async submitDefense() {
    const input = document.getElementById('defense-input');
    const reason = input.value.trim();

    if (!reason) {
      App.showToast('请输入辩护理由');
      return;
    }

    // 显示加载
    const container = document.getElementById('battle-container');
    container.innerHTML = `
      <div class="text-center py-12 animate-fade-in">
        <div class="w-16 h-16 border-4 border-soul-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-soul-muted">AI 裁判正在评判...</p>
      </div>
    `;

    // 调用裁判
    const result = await AIJudge.judge(
      this.state.userWord,
      this.state.aiWord,
      reason,
      this.state.userWord
    );

    // 计算得分
    const userPoints = parseInt(result.consistency) || 5;
    const aiPoints = Math.floor(Math.random() * 4) + 4; // AI 随机得分 4-7

    this.state.userScore += userPoints;
    this.state.aiScore += aiPoints;

    this.state.history.push({
      round: this.state.round,
      userWord: this.state.userWord,
      aiWord: this.state.aiWord,
      reason,
      userPoints,
      aiPoints,
      result
    });

    // 显示结果
    this.showRoundResult(userPoints, aiPoints, result);
  },

  showRoundResult(userPoints, aiPoints, result) {
    const container = document.getElementById('battle-container');
    const isWin = userPoints > aiPoints;
    const isDraw = userPoints === aiPoints;

    container.innerHTML = `
      <div class="max-w-xl mx-auto animate-fade-in">
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-6">
          <div class="text-center mb-6">
            <div class="text-4xl font-bold ${isWin ? 'text-soul-secondary' : isDraw ? 'text-soul-gold' : 'text-soul-accent'}">
              ${isWin ? '胜' : isDraw ? '平' : '负'}
            </div>
            <p class="text-soul-muted mt-2">
              你 ${userPoints} : ${aiPoints} AI
            </p>
          </div>

          <!-- AI 分析 -->
          <div class="bg-soul-bg rounded-xl p-4 mb-6">
            <p class="text-white text-sm mb-2">${result.analysis}</p>
            <p class="text-soul-secondary text-sm">${result.feedback}</p>
          </div>

          <button onclick="AIBattle.nextRound()" class="soul-btn w-full">
            ${this.state.round >= this.state.maxRounds ? '查看最终结果' : '下一轮'}
          </button>
        </div>
      </div>
    `;
  },

  nextRound() {
    if (this.state.round >= this.state.maxRounds) {
      this.state.phase = 'result';
      this.render();
      return;
    }

    this.state.round++;
    this.state.aiWord = this.generateAIWord();
    this.render();
  },

  renderResult() {
    const { userScore, aiScore, history } = this.state;
    const isWin = userScore > aiScore;
    const isDraw = userScore === aiScore;

    // 保存记录
    Storage.saveRecord({
      mode: 'battle',
      userScore,
      aiScore,
      history,
      result: isWin ? 'win' : isDraw ? 'draw' : 'lose'
    });

    return `
      <div class="max-w-xl mx-auto animate-fade-in text-center">
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-8">
          <div class="text-5xl font-bold mb-4 ${isWin ? 'text-soul-secondary' : isDraw ? 'text-soul-gold' : 'text-soul-accent'}">
            ${isWin ? '胜利' : isDraw ? '平局' : '失败'}
          </div>

          <div class="flex justify-center items-center gap-8 mb-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${userScore}</div>
              <div class="text-sm text-soul-muted">你的得分</div>
            </div>
            <div class="text-soul-muted text-xl">:</div>
            <div class="text-center">
              <div class="text-3xl font-bold text-white">${aiScore}</div>
              <div class="text-sm text-soul-muted">AI 得分</div>
            </div>
          </div>

          <div class="bg-soul-bg rounded-xl p-4 mb-6 text-left">
            <h4 class="text-white font-bold mb-2">对战回顾</h4>
            <div class="space-y-2">
              ${history.map(h => `
                <div class="flex items-center justify-between text-sm">
                  <span class="text-soul-muted">第 ${h.round} 轮</span>
                  <span class="text-soul-secondary">${h.userWord}</span>
                  <span class="text-soul-muted">vs</span>
                  <span class="text-soul-accent">${h.aiWord}</span>
                  <span class="${h.userPoints > h.aiPoints ? 'text-soul-secondary' : 'text-soul-muted'}">
                    ${h.userPoints}:${h.aiPoints}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="flex gap-3">
            <button onclick="AIBattle.init()" class="soul-btn flex-1">
              再来一局
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
