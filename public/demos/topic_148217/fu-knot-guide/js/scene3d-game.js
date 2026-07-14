/**
 * scene3d-game.js - 非遗福结 游戏化系统
 *
 * 职责：连击计数、XP进度、金色粒子庆祝效果
 * 依赖：scene3d-core.js
 */
(function (S) {
  'use strict';
  var _ = S._;

  // 游戏化状态（模块内私有）
  var game = {
    combo: 0, maxCombo: 0, totalXP: 0,
    stepXP: 15, comboBonus: 5,
    celebrating: false, celebrateTimer: 0
  };

  /** 庆祝某步骤完成，返回奖励信息 */
  S.celebrateStep = function (stepIdx) {
    game.combo++;
    if (game.combo > game.maxCombo) game.maxCombo = game.combo;
    game.totalXP += game.stepXP + (game.combo > 1 ? game.comboBonus * (game.combo - 1) : 0);
    game.celebrating = true;
    game.celebrateTimer = 1.5;
    spawnCelebrationParticles();
    return {
      combo: game.combo,
      xpEarned: game.stepXP + (game.combo > 1 ? game.comboBonus * (game.combo - 1) : 0),
      totalXP: game.totalXP,
      maxCombo: game.maxCombo
    };
  };

  /** 重置连击 */
  S.resetCombo = function () { game.combo = 0; };

  /** 获取游戏状态 */
  S.getGameState = function () {
    return {
      combo: game.combo, maxCombo: game.maxCombo,
      totalXP: game.totalXP, stepXP: game.stepXP, comboBonus: game.comboBonus
    };
  };

  /** 生成庆祝粒子 */
  function spawnCelebrationParticles() {
    while (_.celebrationGroup.children.length) {
      var c = _.celebrationGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      _.celebrationGroup.remove(c);
    }
    var count = 40;
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var velocities = [];
    var palette = [
      new THREE.Color('#FFD700'), new THREE.Color('#FF4444'),
      new THREE.Color('#FF8C00'), new THREE.Color('#FF69B4'),
      new THREE.Color('#FFFFFF')
    ];
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = -0.5 + Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      var col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
      velocities.push({
        x: (Math.random() - 0.5) * 3,
        y: 1.5 + Math.random() * 2.5,
        z: (Math.random() - 0.5) * 3
      });
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.08, vertexColors: true,
      transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending || 2,
      depthWrite: false, sizeAttenuation: true
    });
    var pts = new THREE.Points(geo, mat);
    pts.userData.velocities = velocities;
    _.celebrationGroup.add(pts);
  }

  /** 更新庆祝粒子（每帧调用） */
  function updateCelebration(dt) {
    if (!game.celebrating && _.celebrationGroup.children.length === 0) return;

    if (game.celebrating) {
      game.celebrateTimer -= dt;
      if (game.celebrateTimer <= 0) {
        game.celebrating = false;
      }
    }

    // 粒子运动
    _.celebrationGroup.children.forEach(function (pts) {
      if (!pts.userData.velocities) return;
      var posAttr = pts.geometry.getAttribute('position');
      var vels = pts.userData.velocities;
      for (var i = 0; i < vels.length; i++) {
        var px = posAttr.getX(i) + vels[i].x * dt;
        var py = posAttr.getY(i) + vels[i].y * dt;
        var pz = posAttr.getZ(i) + vels[i].z * dt;
        vels[i].y -= 3 * dt;
        vels[i].x *= 0.98;
        vels[i].z *= 0.98;
        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;
    });

    // 庆祝结束后淡出并清理
    if (!game.celebrating) {
      var allFaded = true;
      _.celebrationGroup.children.forEach(function (pts) {
        if (pts.material) {
          pts.material.opacity -= dt * 2;
          if (pts.material.opacity > 0) allFaded = false;
          if (pts.material.opacity < 0) pts.material.opacity = 0;
        }
      });
      if (allFaded && _.celebrationGroup.children.length) {
        while (_.celebrationGroup.children.length) {
          var c = _.celebrationGroup.children[0];
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
          _.celebrationGroup.remove(c);
        }
      }
    }
  }

  /* ==================== 注册回调 ==================== */
  // 注册帧回调：更新庆祝粒子
  _.frameCallbacks.push(updateCelebration);

  // 注册 dispose 回调：清理粒子
  _.disposeCallbacks.push(function () {
    game.celebrating = false;
    while (_.celebrationGroup && _.celebrationGroup.children.length) {
      var c = _.celebrationGroup.children[0];
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      _.celebrationGroup.remove(c);
    }
  });

})(Scene3D);
