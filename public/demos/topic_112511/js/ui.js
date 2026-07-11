// UI 面板管理
class UIManager {
  constructor() {
    this.uiOverlay = document.getElementById('uiOverlay');
    this.messagePanel = document.getElementById('messagePanel');
  }

  // 更新右上角状态面板
  updateStatusPanel(gameState) {
    const state = gameState;
    const max = GAME_CONFIG.maxState;

    const timeSlot = GAME_CONFIG.timeSlots.find(
      s => state.hour >= s.startHour && state.hour < s.endHour
    );
    const timeName = timeSlot ? timeSlot.name : '';

    this.uiOverlay.innerHTML = `
      <div class="ui-row">
        <span>第${state.day}天</span>
        <span style="color:#aaa;font-size:10px;">${timeName} ${String(state.hour).padStart(2,'0')}:${String(state.minute).padStart(2,'0')}</span>
      </div>
      <div class="ui-row">
        <span style="color:#ffd700;">💰${state.gold}</span>
      </div>
      <div class="ui-row">
        <span style="color:#e74c3c;font-size:10px;">❤</span>
        <div class="bar-container">
          <div class="bar-fill bar-health" style="width:${(state.health / max.health * 100)}%"></div>
        </div>
        <span style="font-size:10px;">${Math.floor(state.health)}</span>
      </div>
      <div class="ui-row">
        <span style="color:#f39c12;font-size:10px;">⚡</span>
        <div class="bar-container">
          <div class="bar-fill bar-energy" style="width:${(state.energy / max.energy * 100)}%"></div>
        </div>
        <span style="font-size:10px;">${Math.floor(state.energy)}</span>
      </div>
      <div class="ui-row">
        <span style="color:#3498db;font-size:10px;">📊</span>
        <div class="bar-container">
          <div class="bar-fill bar-ability" style="width:${Math.min(state.ability / 100 * 100, 100)}%"></div>
        </div>
        <span style="font-size:10px;">${Math.floor(state.ability)}</span>
      </div>
      <div class="ui-row" style="margin-top:4px;font-size:10px;color:#aaa;">
        <span>${state.currentSceneName || '家'}</span>
      </div>
    `;
  }

  // 显示消息
  showMessage(text, duration = 3000) {
    this.messagePanel.textContent = text;
    this.messagePanel.style.display = 'block';

    if (this.messageTimer) clearTimeout(this.messageTimer);
    this.messageTimer = setTimeout(() => {
      this.messagePanel.style.display = 'none';
    }, duration);
  }

  // 显示事件结果弹窗
  showEventResult(event, success, result) {
    const status = success ? '成功' : '失败';
    const color = success ? '#2ecc71' : '#e74c3c';

    let effectText = '';
    if (result.goldDelta) effectText += ` 金币${result.goldDelta > 0 ? '+' : ''}${result.goldDelta}`;
    if (result.healthDelta) effectText += ` 健康${result.healthDelta > 0 ? '+' : ''}${result.healthDelta}`;
    if (result.energyDelta) effectText += ` 精力${result.energyDelta > 0 ? '+' : ''}${result.energyDelta}`;
    if (result.abilityDelta) effectText += ` 能力${result.abilityDelta > 0 ? '+' : ''}${result.abilityDelta}`;

    this.showMessage(
      `${event.name} ${status}!${effectText}\n${event.message || ''}`,
      4000
    );
  }

  // 显示场景切换提示
  showSceneChange(sceneName) {
    this.showMessage(`到达: ${sceneName}`, 2000);
  }

  // 显示死亡结算
  showDeathScreen(gameState, statistics) {
    this.uiOverlay.innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div style="color:#e74c3c;font-size:16px;margin-bottom:10px;">游戏结束</div>
        <div style="color:#fff;font-size:12px;margin-bottom:5px;">${gameState.name} 倒下了...</div>
        <div style="color:#aaa;font-size:10px;">存活了 ${gameState.day} 天</div>
        <div style="color:#ffd700;font-size:10px;margin-top:5px;">累计获得金币: ${statistics.totalGoldEarned}</div>
        <div style="color:#3498db;font-size:10px;">最高工作能力: ${statistics.maxAbilityReached}</div>
        <div style="margin-top:10px;color:#aaa;font-size:9px;">按 R 重新开始</div>
      </div>
    `;
  }
}
