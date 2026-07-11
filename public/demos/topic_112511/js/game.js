// 游戏主引擎 - 大地图版本
class Game {
  constructor() {
    this.renderer = new Renderer('gameCanvas');
    this.input = new InputHandler();
    this.ui = new UIManager();
    this.player = new Player(250, 225);

    this.gameState = null;
    this.statistics = null;
    this.currentLocation = null;
    this.availableEvents = [];
    this.selectedEventIndex = 0;
    this.isPaused = false;
    this.isGameOver = false;

    this.eventHistory = {};
    this.consecutiveEvents = {};
    this.lastEventId = null;

    this.timeAccumulator = 0;
    this.lastTime = 0;

    this.init();
  }

  init() {
    const saveData = this.loadSave();
    if (saveData) {
      this.gameState = saveData.gameState;
      this.statistics = saveData.statistics;
      this.eventHistory = saveData.eventHistory || {};
      // 兼容旧存档：将 currentScene 转换为 currentLocation
      if (this.gameState.currentScene && !this.gameState.currentLocation) {
        this.gameState.currentLocation = this.gameState.currentScene;
      }
    } else {
      this.resetGame();
    }

    // 确保 currentLocation 有效
    if (!this.gameState.currentLocation || !LOCATIONS[this.gameState.currentLocation]) {
      this.gameState.currentLocation = 'home';
    }

    this.currentLocation = LOCATIONS[this.gameState.currentLocation];
    this.player.x = this.currentLocation.x + this.currentLocation.w / 2 - this.player.width / 2;
    this.player.y = this.currentLocation.y + this.currentLocation.h + 12;

    this.updateAvailableEvents();
    requestAnimationFrame((t) => this.loop(t));
  }

  resetGame() {
    const init = GAME_CONFIG.initialState;
    this.gameState = {
      name: init.name,
      health: init.health,
      energy: init.energy,
      ability: init.ability,
      gold: init.gold,
      currentLocation: init.currentLocation,
      currentLocationName: LOCATIONS[init.currentLocation].name,
      day: init.day,
      hour: init.hour,
      minute: init.minute
    };
    this.statistics = {
      totalGoldEarned: 0,
      totalGoldSpent: 0,
      maxAbilityReached: init.ability,
      hospitalVisits: 0
    };
    this.eventHistory = {};
    this.consecutiveEvents = {};
    this.lastEventId = null;
    this.isGameOver = false;
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (!this.isPaused && !this.isGameOver) {
      this.update(dt);
    }

    this.render();
    this.input.update();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // 时间推进
    this.timeAccumulator += dt;
    if (this.timeAccumulator >= 1000) {
      this.timeAccumulator -= 1000;
      this.advanceTime(GAME_CONFIG.minutesPerRealSecond);
    }

    // 更新玩家位置（在世界坐标系中移动）
    const bounds = {
      width: GAME_CONFIG.mapWidth,
      height: GAME_CONFIG.mapHeight
    };
    this.player.update(this.input, 1, bounds);

    // 检测当前所在地点
    this.checkCurrentLocation();

    // 检查事件按键
    this.checkEventInput();

    // 检查暂停/重新开始
    if (this.input.isPressed('p')) {
      this.isPaused = !this.isPaused;
      this.ui.showMessage(this.isPaused ? '游戏暂停' : '游戏继续', 1500);
    }

    if (this.isGameOver && this.input.isPressed('r')) {
      this.resetGame();
      this.currentLocation = LOCATIONS[this.gameState.currentLocation];
      this.player.x = this.currentLocation.x + this.currentLocation.w / 2 - this.player.width / 2;
      this.player.y = this.currentLocation.y + this.currentLocation.h + 12;
      this.updateAvailableEvents();
    }

    this.autoSave();
  }

  checkCurrentLocation() {
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;

    let foundLocation = null;
    for (const key in LOCATIONS) {
      const loc = LOCATIONS[key];
      if (
        px >= loc.x && px <= loc.x + loc.w &&
        py >= loc.y && py <= loc.y + loc.h
      ) {
        foundLocation = key;
        break;
      }
    }

    if (foundLocation && foundLocation !== this.gameState.currentLocation) {
      this.gameState.currentLocation = foundLocation;
      this.currentLocation = LOCATIONS[foundLocation];
      this.gameState.currentLocationName = this.currentLocation.name;
      this.updateAvailableEvents();
      this.ui.showSceneChange(this.currentLocation.name);
    }
  }

  advanceTime(minutes) {
    this.gameState.minute += minutes;
    while (this.gameState.minute >= 60) {
      this.gameState.minute -= 60;
      this.gameState.hour += 1;
    }
    while (this.gameState.hour >= 24) {
      this.gameState.hour -= 24;
      this.gameState.day += 1;
      this.applyDailyDecay();
    }
  }

  applyDailyDecay() {
    this.gameState.health -= 2;
    if (this.gameState.hour >= 6 && this.gameState.hour < 22) {
      this.gameState.energy = Math.min(100, this.gameState.energy + 5);
    }
    this.checkDeath();
  }

  updateAvailableEvents() {
    if (!this.currentLocation) {
      this.availableEvents = [];
      return;
    }
    const locEvents = this.currentLocation.events || [];
    this.availableEvents = locEvents
      .map(id => EVENTS[id])
      .filter(e => e !== undefined);
    this.selectedEventIndex = 0;
  }

  checkEventInput() {
    for (let i = 1; i <= 9; i++) {
      if (this.input.isPressed(String(i))) {
        const index = i - 1;
        if (index < this.availableEvents.length) {
          this.selectedEventIndex = index;
          this.executeEvent(this.availableEvents[index]);
        }
      }
    }

    if (this.input.isPressed(' ')) {
      if (this.selectedEventIndex < this.availableEvents.length) {
        this.executeEvent(this.availableEvents[this.selectedEventIndex]);
      }
    }
  }

  executeEvent(event) {
    if (!event) return;

    if (event.prerequisites) {
      const pre = event.prerequisites;
      if (pre.minHealth && this.gameState.health < pre.minHealth) {
        this.ui.showMessage(`健康值不足! 需要${pre.minHealth}点健康`);
        return;
      }
      if (pre.minEnergy && this.gameState.energy < pre.minEnergy) {
        this.ui.showMessage(`精力值不足! 需要${pre.minEnergy}点精力`);
        return;
      }
      if (pre.minGold && this.gameState.gold < pre.minGold) {
        this.ui.showMessage(`金币不足! 需要${pre.minGold}金币`);
        return;
      }
    }

    if (event.repeatPenalty) {
      const count = this.consecutiveEvents[event.id] || 0;
      if (count >= event.repeatPenalty.consecutiveLimit) {
        this.ui.showMessage(event.repeatPenalty.penaltyMessage, 4000);
        this.gameState.health -= 10;
        this.gameState.energy -= 10;
        this.checkDeath();
        return;
      }
    }

    const success = Math.random() < (event.successRate || 1);
    const effects = event.effects || {};
    let result = { goldDelta: 0, healthDelta: 0, energyDelta: 0, abilityDelta: 0 };

    if (success) {
      result.goldDelta = effects.goldDelta || 0;
      result.healthDelta = effects.healthDelta || 0;
      result.energyDelta = effects.energyDelta || 0;
      result.abilityDelta = effects.abilityDelta || 0;
    } else {
      result.healthDelta = -(event.effects?.healthDelta || 0) * 0.5 || -5;
      result.energyDelta = -(event.effects?.energyDelta || 0) * 0.3 || -5;
    }

    this.gameState.gold = Math.max(0, this.gameState.gold + result.goldDelta);
    this.gameState.health = Math.min(100, Math.max(0, this.gameState.health + result.healthDelta));
    this.gameState.energy = Math.min(100, Math.max(0, this.gameState.energy + result.energyDelta));
    this.gameState.ability = Math.max(0, this.gameState.ability + (result.abilityDelta || 0));

    if (event.durationMinutes) {
      this.advanceTime(event.durationMinutes);
    }

    if (result.goldDelta > 0) this.statistics.totalGoldEarned += result.goldDelta;
    if (result.goldDelta < 0) this.statistics.totalGoldSpent += Math.abs(result.goldDelta);
    if (this.gameState.ability > this.statistics.maxAbilityReached) {
      this.statistics.maxAbilityReached = this.gameState.ability;
    }

    this.eventHistory[event.id] = (this.eventHistory[event.id] || 0) + 1;

    if (this.lastEventId === event.id) {
      this.consecutiveEvents[event.id] = (this.consecutiveEvents[event.id] || 0) + 1;
    } else {
      this.consecutiveEvents = {};
      this.consecutiveEvents[event.id] = 1;
    }
    this.lastEventId = event.id;

    this.ui.showEventResult(event, success, result);
    this.checkDeath();
    this.saveGame();
  }

  checkDeath() {
    if (this.gameState.health <= 0) {
      this.isGameOver = true;
      this.gameState.health = 0;
      this.ui.showDeathScreen(this.gameState, this.statistics);
    }
  }

  saveGame() {
    const saveData = {
      gameState: this.gameState,
      statistics: this.statistics,
      eventHistory: this.eventHistory,
      version: '1.1'
    };
    localStorage.setItem('worker_life_save', JSON.stringify(saveData));
  }

  loadSave() {
    try {
      const data = localStorage.getItem('worker_life_save');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('读取存档失败:', e);
    }
    return null;
  }

  autoSave() {
    const now = Date.now();
    if (!this.lastSaveTime || now - this.lastSaveTime > 30000) {
      this.saveGame();
      this.lastSaveTime = now;
    }
  }

  render() {
    this.renderer.clear();

    // 更新相机跟随玩家
    this.renderer.updateCamera(
      this.player.x + this.player.width / 2,
      this.player.y + this.player.height / 2
    );

    // 绘制大地图
    this.renderer.drawMap(this.gameState, this.gameState.currentLocation);

    // 绘制小地图
    this.renderer.drawMinimap(this.player, this.gameState.currentLocation);

    // 绘制玩家（需要将世界坐标转换为屏幕坐标）
    const screenPos = this.renderer.worldToScreen(this.player.x, this.player.y);
    const originalX = this.player.x;
    const originalY = this.player.y;
    this.player.x = screenPos.x;
    this.player.y = screenPos.y;
    this.player.draw(this.renderer.ctx);
    this.player.x = originalX;
    this.player.y = originalY;

    // 绘制事件面板
    this.renderer.drawEventPanel(
      this.availableEvents,
      this.gameState,
      this.selectedEventIndex
    );

    // 更新UI
    this.ui.updateStatusPanel(this.gameState);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
