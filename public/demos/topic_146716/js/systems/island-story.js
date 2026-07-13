/**
 * 孤岛基地剧情触发系统
 * 当沙漠地图完成20波防御后触发
 */
const IslandStory = {
  triggered: false,
  helicopter: null,
  phase: 'idle', // idle -> triggered -> helicopter_arrived -> flying -> island_loaded
  rotorSpeed: 0,
  rotorMesh: null,
  tailRotorMesh: null,
  takeoffTimer: 0,
  originalCameraY: 0,
  notificationEl: null,
  promptActive: false,

  trigger() {
    if (this.triggered) return;
    this.triggered = true;
    this.phase = 'triggered';

    this.showNotification('直升机救援已到达！请前往基地中央的停机坪。');
    this.spawnHelicopter();
    this.saveState();
  },

  spawnHelicopter() {
    if (!window.scene) return;

    const group = new THREE.Group();

    // 机身 - 主箱体
    const bodyGeo = new THREE.BoxGeometry(2.5, 1.4, 4);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    body.castShadow = true;
    group.add(body);

    // 驾驶舱窗户
    const cockpitGeo = new THREE.BoxGeometry(1.8, 0.8, 1.2);
    const cockpitMat = new THREE.MeshLambertMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.6 });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 1.6, 1.4);
    group.add(cockpit);

    // 主旋翼轴
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const mastMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 2.1, 0.3);
    group.add(mast);

    // 主旋翼
    const rotorGeo = new THREE.BoxGeometry(0.3, 0.05, 6);
    const rotorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    this.rotorMesh = new THREE.Mesh(rotorGeo, rotorMat);
    this.rotorMesh.position.set(0, 2.4, 0.3);
    group.add(this.rotorMesh);

    // 尾梁
    const tailGeo = new THREE.BoxGeometry(0.5, 0.5, 3);
    const tailMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 1.4, -3);
    group.add(tail);

    // 尾翼
    const tailFinGeo = new THREE.BoxGeometry(0.15, 1, 1);
    const tailFin = new THREE.Mesh(tailFinGeo, tailMat);
    tailFin.position.set(0, 1.9, -4);
    group.add(tailFin);

    // 尾旋翼
    const tailRotorGeo = new THREE.BoxGeometry(0.05, 1.2, 0.15);
    const tailRotorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    this.tailRotorMesh = new THREE.Mesh(tailRotorGeo, tailRotorMat);
    this.tailRotorMesh.position.set(0.3, 1.9, -4);
    group.add(this.tailRotorMesh);

    // 起落架
    const skidGeo = new THREE.BoxGeometry(0.15, 0.4, 3.5);
    const skidMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const skidL = new THREE.Mesh(skidGeo, skidMat);
    skidL.position.set(-1, 0.4, 0);
    group.add(skidL);
    const skidR = new THREE.Mesh(skidGeo, skidMat);
    skidR.position.set(1, 0.4, 0);
    group.add(skidR);

    // 位置：基地中央停机坪 (0, 0)
    group.position.set(0, 0, 0);

    window.scene.add(group);
    this.helicopter = group;
    this.phase = 'helicopter_arrived';
    this.rotorSpeed = 0;
  },

  update(dt) {
    if (this.phase === 'idle') return;

    // 旋翼旋转动画
    if (this.rotorMesh) {
      // 加速到目标转速
      const targetSpeed = this.phase === 'flying' ? 25 : 8;
      this.rotorSpeed += (targetSpeed - this.rotorSpeed) * dt * 0.5;
      this.rotorMesh.rotation.y += this.rotorSpeed * dt;
    }
    if (this.tailRotorMesh) {
      this.tailRotorMesh.rotation.x += this.rotorSpeed * dt * 1.5;
    }

    // 直升机悬浮微动
    if (this.helicopter && this.phase !== 'flying') {
      const t = Date.now() * 0.001;
      this.helicopter.position.y = Math.sin(t * 2) * 0.05;
    }

    // 检测玩家靠近
    if (this.phase === 'helicopter_arrived' && this.helicopter && window.camera) {
      const dx = window.camera.position.x - this.helicopter.position.x;
      const dz = window.camera.position.z - this.helicopter.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 3) {
        if (!this.promptActive) {
          this.showInteractionPrompt('按 F 进入直升机');
          this.promptActive = true;
        }
      } else {
        if (this.promptActive) {
          this.hideInteractionPrompt();
          this.promptActive = false;
        }
      }
    }

    // 起飞动画
    if (this.phase === 'flying') {
      this.takeoffTimer += dt;

      // 直升机上升
      if (this.helicopter) {
        this.helicopter.position.y += dt * 3;
      }

      // 摄像机跟随上升
      if (window.camera) {
        window.camera.position.y += dt * 2.5;
        // 轻微向后拉远
        const backDir = new THREE.Vector3(0, 0, 1).applyQuaternion(window.camera.quaternion);
        window.camera.position.add(backDir.multiplyScalar(dt * 2));
      }

      // 5秒后加载孤岛
      if (this.takeoffTimer > 5) {
        this.phase = 'island_loaded';
        if (typeof startGame === 'function') startGame('island');
      }
    }
  },

  onKeyDown(event) {
    if (this.phase !== 'helicopter_arrived') return;
    if (event.key === 'f' || event.key === 'F') {
      if (this.promptActive) {
        this.startTakeoff();
      }
    }
  },

  startTakeoff() {
    if (this.phase === 'flying') return;
    this.phase = 'flying';
    this.takeoffTimer = 0;
    this.hideInteractionPrompt();

    // 保存原始摄像机高度
    if (window.camera) {
      this.originalCameraY = window.camera.position.y;
    }

    // 禁用玩家移动输入
    if (typeof window.keys !== 'undefined') {
      window.keys = window.keys || {};
    }

    this.showNotification('直升机起飞！前往孤岛基地...');
  },

  showNotification(text) {
    // 移除旧通知
    if (this.notificationEl) {
      this.notificationEl.remove();
      this.notificationEl = null;
    }

    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      'top:30%',
      'left:50%',
      'transform:translate(-50%,-50%)',
      'background:rgba(0,0,0,0.85)',
      'border:2px solid #ffcc00',
      'border-radius:12px',
      'padding:20px 40px',
      'color:#ffcc00',
      'font-size:18px',
      'font-weight:bold',
      'z-index:10000',
      'text-align:center',
      'box-shadow:0 0 20px rgba(255,204,0,0.3)',
      'animation:fadeInDown 0.5s ease-out'
    ].join(';');
    el.textContent = text;
    document.body.appendChild(el);
    this.notificationEl = el;

    // 3秒后消失
    setTimeout(() => {
      if (el.parentNode) {
        el.style.animation = 'fadeOutUp 0.5s ease-in forwards';
        setTimeout(() => el.remove(), 500);
      }
      if (this.notificationEl === el) {
        this.notificationEl = null;
      }
    }, 3000);
  },

  showInteractionPrompt(text) {
    const prompt = document.getElementById('interaction-prompt');
    const promptText = document.getElementById('prompt-text');
    if (prompt && promptText) {
      promptText.textContent = text;
      prompt.style.display = 'block';
    }
  },

  hideInteractionPrompt() {
    const prompt = document.getElementById('interaction-prompt');
    if (prompt) prompt.style.display = 'none';
  },

  saveState() {
    try {
      const data = JSON.parse(localStorage.getItem('worldMapData') || '{}');
      data.islandStoryTriggered = this.triggered;
      localStorage.setItem('worldMapData', JSON.stringify(data));
    } catch (e) {
      console.warn('[IslandStory] 保存状态失败:', e);
    }
  },

  loadState() {
    try {
      const data = JSON.parse(localStorage.getItem('worldMapData') || '{}');
      if (data.islandStoryTriggered) {
        this.triggered = true;
      }
    } catch (e) {
      console.warn('[IslandStory] 加载状态失败:', e);
    }
  },

  triggerHelicopterArrival() {
    // 显示剧情提示
    if (typeof showToast === 'function') {
      showToast('🚁 直升机正在飞往孤岛基地...', 'success');
    }
    // 延迟后切换地图
    setTimeout(() => {
      if (window.MapManager && typeof MapManager.switchTo === 'function') {
        MapManager.switchTo('island');
      }
      if (typeof showToast === 'function') {
        showToast('🏝️ 已到达孤岛基地！这里是安全区，没有僵尸。', 'success');
      }
    }, 3000);
  },

  reset() {
    this.triggered = false;
    this.phase = 'idle';
    this.rotorSpeed = 0;
    this.takeoffTimer = 0;
    this.promptActive = false;
    if (this.helicopter && window.scene) {
      window.scene.remove(this.helicopter);
    }
    this.helicopter = null;
    this.rotorMesh = null;
    this.tailRotorMesh = null;
    if (this.notificationEl) {
      this.notificationEl.remove();
      this.notificationEl = null;
    }
    this.hideInteractionPrompt();
  }
};

// 初始化时加载存档状态
IslandStory.loadState();

// 监听键盘事件
window.addEventListener('keydown', (e) => IslandStory.onKeyDown(e));

window.IslandStory = IslandStory;
