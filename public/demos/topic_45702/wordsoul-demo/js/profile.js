/**
 * WordSoul - 个人资料中心
 * 展示词库、战绩、思维成长轨迹
 */

var Profile = {
  init() {
    this.render();
  },

  render() {
    const container = document.getElementById('profile-container');
    if (!container) return;

    const stats = Storage.getStats();
    const records = Storage.getRecords();
    const wordBank = Storage.getWordBank();

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- 统计卡片 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-soul-surface border border-soul-border rounded-2xl p-4 text-center">
            <div class="text-3xl font-bold text-soul-primary">${stats.totalGames}</div>
            <div class="text-xs text-soul-muted mt-1">总对战次数</div>
          </div>
          <div class="bg-soul-surface border border-soul-border rounded-2xl p-4 text-center">
            <div class="text-3xl font-bold text-soul-secondary">${stats.iterGames}</div>
            <div class="text-xs text-soul-muted mt-1">自我迭代</div>
          </div>
          <div class="bg-soul-surface border border-soul-border rounded-2xl p-4 text-center">
            <div class="text-3xl font-bold text-soul-accent">${stats.battleGames}</div>
            <div class="text-xs text-soul-muted mt-1">AI 对战</div>
          </div>
          <div class="bg-soul-surface border border-soul-border rounded-2xl p-4 text-center">
            <div class="text-3xl font-bold text-soul-gold">${stats.wordCount}</div>
            <div class="text-xs text-soul-muted mt-1">词库词语</div>
          </div>
        </div>

        <!-- 词库 -->
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-6 mb-6">
          <h3 class="text-lg font-bold text-white mb-4">我的词库</h3>
          ${wordBank.length > 0 ? `
            <div class="flex flex-wrap gap-2">
              ${wordBank.map(w => `
                <span class="word-tag">${w}</span>
              `).join('')}
            </div>
          ` : `
            <p class="text-soul-muted text-sm">暂无词语记录，快去进行自我迭代模式吧！</p>
          `}
        </div>

        <!-- 历史记录 -->
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-6 mb-6">
          <h3 class="text-lg font-bold text-white mb-4">对战历史</h3>
          ${records.length > 0 ? `
            <div class="space-y-3">
              ${records.slice(0, 10).map(r => `
                <div class="bg-soul-bg rounded-xl p-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs px-2 py-1 rounded ${r.mode === 'iter' ? 'bg-soul-primary/20 text-soul-primary' : 'bg-soul-accent/20 text-soul-accent'}">
                      ${r.mode === 'iter' ? '自我迭代' : 'AI 对战'}
                    </span>
                    <span class="text-xs text-soul-muted">${new Date(r.timestamp).toLocaleString()}</span>
                  </div>
                  ${r.mode === 'iter' ? `
                    <p class="text-sm text-white">灵魂关键词：<span class="text-soul-secondary font-bold">${r.winner}</span></p>
                    <p class="text-xs text-soul-muted mt-1">参与词语：${r.words?.join('、') || ''}</p>
                  ` : `
                    <p class="text-sm text-white">
                      得分：<span class="text-soul-secondary">${r.userScore}</span> : <span class="text-soul-accent">${r.aiScore}</span>
                      <span class="text-xs ml-2 ${r.result === 'win' ? 'text-soul-secondary' : r.result === 'draw' ? 'text-soul-gold' : 'text-soul-accent'}">
                        ${r.result === 'win' ? '胜' : r.result === 'draw' ? '平' : '负'}
                      </span>
                    </p>
                  `}
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="text-soul-muted text-sm">暂无对战记录</p>
          `}
        </div>

        <!-- 数据管理 -->
        <div class="bg-soul-surface border border-soul-border rounded-2xl p-6">
          <h3 class="text-lg font-bold text-white mb-4">数据管理</h3>
          <div class="flex gap-3">
            <button onclick="Profile.exportData()" class="soul-btn soul-btn-secondary">
              导出数据
            </button>
            <button onclick="Profile.clearData()" class="soul-btn bg-red-500 hover:bg-red-600">
              清空数据
            </button>
          </div>
        </div>
      </div>
    `;
  },

  exportData() {
    const data = Storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wordsoul-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.showToast('数据已导出');
  },

  clearData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      Storage.clearAll();
      this.render();
      App.showToast('数据已清空');
    }
  }
};
