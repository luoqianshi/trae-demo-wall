/**
 * ============================================================
 * SubmarineGame 适配器（v2）
 * 将独立模块 SubmarineGameV2 桥接到主线游戏
 * 负责：创建Canvas + 暂停3D + BGM切换 + 委托V2 + 结果回传 + 恢复3D/BGM + 清理
 * ============================================================
 */
;(function() {
'use strict';

let _canvas = null;
let _returnHandler = null;
let _savedMapBGM = null;

window.SubmarineGame = {
  /**
   * 开始潜艇游戏
   * @param {object} upgrades - 基地升级数据
   */
  start(upgrades) {
    if (!window.SubmarineGameV2) {
      console.error('[SubmarineGame] SubmarineGameV2 未加载');
      if (typeof showToast === 'function') {
        showToast('潜艇游戏加载失败', 'error');
      }
      return;
    }

    // 1. 暂停3D场景
    if (typeof window.enter2DGame === 'function') {
      window.enter2DGame();
    }

    // 2. 保存当前地图BGM并切换到捕鱼BGM（潜艇共用海洋风格）
    if (window.AudioSystem) {
      _savedMapBGM = AudioSystem.currentMapBGM;
      AudioSystem.playFishingBGM();
    }

    // 3. 创建Canvas
    _canvas = document.createElement('canvas');
    _canvas.id = 'submarine-canvas';
    _canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;cursor:crosshair;';
    _canvas.width = window.innerWidth;
    _canvas.height = window.innerHeight;
    document.body.appendChild(_canvas);

    // 4. 初始化V2模块
    SubmarineGameV2.init(_canvas);

    // 5. 设置完成回调
    _returnHandler = function() {
      const result = SubmarineGameV2.getResult();
      window.lastSubmarineResult = result;

      // 清理
      SubmarineGameV2.stop();
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

      // 恢复3D场景
      if (typeof window.exit2DGame === 'function') {
        window.exit2DGame();
      }

      // 通知IslandBase任务完成
      if (window.IslandBase && typeof IslandBase.completeSubmarineMission === 'function') {
        IslandBase.completeSubmarineMission(result);
      }
    };
    SubmarineGameV2.onComplete(_returnHandler);

    // 6. 启动游戏
    SubmarineGameV2.start();
  },

  /**
   * 紧急停止
   */
  stop() {
    if (_returnHandler) {
      _returnHandler();
      _returnHandler = null;
    }
  }
};

console.log('[SubmarineGame] 适配器 v2 已加载，使用 SubmarineGameV2 引擎');
})();
