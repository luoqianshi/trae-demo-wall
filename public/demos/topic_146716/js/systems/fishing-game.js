/**
 * ============================================================
 * FishingGame 适配器（v2）
 * 将独立模块 FishingGameV2 桥接到主线游戏
 * 负责：创建Canvas + 暂停3D + BGM切换 + 委托V2 + 结果回传 + 恢复3D/BGM + 清理
 * ============================================================
 */
;(function() {
'use strict';

// 保存退出回调引用
let _canvas = null;
let _returnHandler = null;
let _savedMapBGM = null; // 进入小游戏前保存的地图BGM

window.FishingGame = {
  /**
   * 开始捕鱼游戏
   */
  start() {
    // 确保V2模块已加载
    if (!window.FishingGameV2) {
      console.error('[FishingGame] FishingGameV2 未加载');
      if (typeof showToast === 'function') {
        showToast('捕鱼游戏加载失败', 'error');
      }
      return;
    }

    // 1. 暂停3D场景
    if (typeof window.enter2DGame === 'function') {
      window.enter2DGame();
    }

    // 2. 保存当前地图BGM并切换到捕鱼BGM
    if (window.AudioSystem) {
      _savedMapBGM = AudioSystem.currentMapBGM;
      AudioSystem.playFishingBGM();
    }

    // 3. 创建Canvas（全屏覆盖）
    _canvas = document.createElement('canvas');
    _canvas.id = 'fishing-canvas';
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;cursor:crosshair;';
    _canvas.width = window.innerWidth;
    _canvas.height = window.innerHeight;
    document.body.appendChild(_canvas);

    // 4. 初始化V2模块
    FishingGameV2.init(_canvas);

    // 5. 设置返回回调
    _returnHandler = function() {
      const result = FishingGameV2.getResult();
      window.lastFishingResult = result;
      window.lastFishingGameResult = result;

      // 清理V2
      FishingGameV2.stop();
      if (_canvas && _canvas.parentNode) {
        _canvas.parentNode.removeChild(_canvas);
      }
      _canvas = null;

      // 恢复地图BGM
      if (window.AudioSystem) {
        if (_savedMapBGM && AudioSystem.mapBGM[_savedMapBGM]) {
          AudioSystem.playMapBGM(_savedMapBGM);
        } else if (window.currentMap && window.currentMap !== 'city') {
          AudioSystem.playMapBGM(window.currentMap);
        } else {
          AudioSystem.playBGM();
        }
        _savedMapBGM = null;
      }

      // 先恢复3D场景，但不立即锁定鼠标
      if (typeof window.exit2DGame === 'function') {
        window.exit2DGame();
      }

      // 延迟一帧后自动弹出老陈对话框（任务完成状态）
      // 这样对话框可以正确获取焦点和鼠标控制权
      requestAnimationFrame(() => {
        if (window.IslandBase && typeof window.IslandBase.completeFishingQuest === 'function') {
          window.IslandBase.completeFishingQuest(result);
        }
        // 再次延迟，确保exit2DGame的PointerLock异步操作已完成
        setTimeout(() => {
          if (window.IslandBase && typeof window.IslandBase.showNPCDialog === 'function') {
            // 找到渔夫老陈的NPC索引
            const npcs = window.IslandBase.npcs || [];
            const fishingNPCIndex = npcs.findIndex(n => n && n.isFishingNPC);
            if (fishingNPCIndex >= 0) {
              window.IslandBase.showNPCDialog(fishingNPCIndex);
            }
          }
        }, 100);
      });
    };
    FishingGameV2.onReturn(_returnHandler);

    // 6. 启动游戏
    FishingGameV2.start();
  },

  /**
   * 停止游戏（紧急退出）
   */
  stop() {
    if (_returnHandler) {
      _returnHandler();
      _returnHandler = null;
    }
  }
};

console.log('[FishingGame] 适配器 v2 已加载，使用 FishingGameV2 引擎');
})();
