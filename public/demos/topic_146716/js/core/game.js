// ============================================================
// 敌人子弹系统
// ============================================================
function updateEnemyBullets(dt) {
  if (typeof enemyBullets === 'undefined') return;
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    if (!b || !b.mesh || !b.dir || typeof b.dir.x !== 'number') {
      if (b && b.mesh && scene) scene.remove(b.mesh);
      enemyBullets.splice(i, 1); continue;
    }

    // 移动子弹
    b.mesh.position.x += b.dir.x * b.speed * dt;
    b.mesh.position.y += b.dir.y * b.speed * dt;
    b.mesh.position.z += b.dir.z * b.speed * dt;
    b.life -= dt;
    
    // 碰撞检测：检查是否命中玩家
    const distToPlayer = b.mesh.position.distanceTo(camera.position);
    if (distToPlayer < 1.5) {
      damagePlayer(b.damage);
      // 特殊效果
      if (b.effect === 'blind') {
        // 致盲效果：屏幕变绿1.5秒
        if (!window.playerBlind) window.playerBlind = { duration: 1.5, timer: 0 };
        else { window.playerBlind.duration = 1.5; window.playerBlind.timer = 0; }
        showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '致盲!', 0x55AA00);
      }
      // 命中特效
      createHitEffect(b.mesh.position.clone(), 0x55AA00);
      scene.remove(b.mesh);
      if (b.mesh.geometry) b.mesh.geometry.dispose();
      if (b.mesh.material) b.mesh.material.dispose();
      enemyBullets.splice(i, 1);
      continue;
    }
    
    // 子弹过期或超出范围
    if (b.life <= 0 || b.mesh.position.y < -1 || b.mesh.position.length() > 200) {
      scene.remove(b.mesh);
      if (b.mesh.geometry) b.mesh.geometry.dispose();
      if (b.mesh.material) b.mesh.material.dispose();
      enemyBullets.splice(i, 1);
    }
  }
}

// ============================================================
// 末日幸存者 - 肉鸽枪战探险游戏
// ============================================================
// 注意：CONFIG 已从 config.js 加载

// --- 游戏状态 ---
let gameState = 'menu'; // menu, playing, paused, upgrading, statPanel, dead
// 全局函数：暂停游戏状态（供外部模块调用）
window.pauseGameState = function() {
  if (gameState === 'playing') {
    gameState = 'paused';
  }
};
// 全局函数：恢复游戏状态（供外部模块如DesertMap调用）
window.resumeGameState = function() {
  if (gameState === 'paused') {
    gameState = 'playing';
  }
};
// 全局函数：进入2D小游戏模式（暂停3D场景，释放鼠标）
window.enter2DGame = function() {
  if (gameState === 'playing') {
    gameState = 'paused';
    document.exitPointerLock();
    document.body.style.cursor = 'default';
    console.log('[game.js] 已进入2D游戏模式，3D场景已暂停');
  }
};
// 全局函数：退出2D小游戏模式（恢复3D场景，重新锁定鼠标）
window.exit2DGame = function() {
  if (gameState === 'paused') {
    gameState = 'playing';
    document.body.style.cursor = 'none';
    if (renderer && renderer.domElement) {
      renderer.domElement.requestPointerLock().catch(err => {
        console.warn('[game.js] 恢复指针锁定失败:', err);
      });
    }
    console.log('[game.js] 已退出2D游戏模式，3D场景已恢复');
  }
};
let scene, camera, renderer, clock;
let player, weapons, currentWeaponIndex = 0;
let footstepTimer = 0;
let enemies = [], allies = [], bullets = [], enemyBullets = [], pickups = [], buildings = [], missiles = [];
let floatingTexts = [];
let particles = []; // 特效粒子数组

// ========== 空投救援事件状态 ==========
let airdropSystem = {
  timer: 0,              // 空投生成计时器
  active: null,          // 当前活跃的空投事件
  showPrompt: false,     // 是否显示空投开启提示
};

// 分区分片动态加载系统
let chunkSystem = {
  chunks: new Map(),           // 已加载的区块: key="cx,cz" -> {x, z, meshes[], colliders[], loaded}
  chunkUpdateTimer: 0,         // 区块更新计时器
  lastPlayerChunk: {x: 0, z: 0}, // 玩家上次所在区块
  allChunkData: [],            // 所有区块的静态数据（预生成）
};
let keys = {}, mouseDown = false, rightMouseDown = false, isAiming = false;
let yaw = 0, pitch = 0;
let playerVelocity = null; // 在init中初始化
let onGround = true;
let jumpCount = 0;
let spacePressed = false; // 上一帧Space状态，用于边缘检测
let rKeyDownTime = 0;        // R键按下时间戳（用于长按检测）
let weaponHolstered = false; // 武器是否收起
const HOLSTER_LONG_PRESS = 400; // 长按R收起武器的阈值（毫秒）

// FPS武器动画v2状态
let handsMesh = null;          // 空手双手模型
let holsterAnim = { t: 0, dir: 0, active: false }; // 收起/拿出过渡动画 (0=完全拿出, 1=完全收起)
let grenadeAnim = { phase: 'idle', timer: 0 }; // 投弹动画阶段: idle/pullPin/raise/throw/recover
let scopeAnim = { t: 0, active: false }; // 狙击镜开镜过渡
let _smoothGroundY = null; // 平滑地面高度跟踪（用于起伏地形的流畅行走）
let _groundHeightHistory = null; // 地面高度移动平均缓冲区
let _groundHistoryIdx = 0; // 移动平均缓冲区索引
let kills = 0, surviveTime = 0, wave = 1;
let enemiesRemaining = 0, waveActive = false, waveTimer = 0;
let xp = 0, xpToLevel = 50, level = 1;
let upgradePoints = 0;
let minimapCtx;

// 昼夜系统
let dayNightCycle = {
  time: 0, // 0-24小时
  cycleDuration: 600, // 一个完整昼夜周期（秒），默认10分钟
  sun: null,
  moon: null,
  ambientLight: null,
  skyColor: null, // 在init中初始化
};

// ============================================================
// 碰撞系统 - 所有可站立/阻挡物体统一管理
// ============================================================
let colliders = []; // { x, z, hw, hd, topY, type, solid? }
window.colliders = colliders; // 暴露到window，方便控制台调试
// type: 'ground' | 'step' | 'car' | 'building_wall' | 'stair_shell'
// solid: true = 不可穿越（建筑墙壁），false = 可走进去（楼梯台阶、汽车）

// 楼梯几何信息（用于斜坡高度计算）
let stairs = []; // { worldX, worldZ, rotation, cos, sin, stepCount, stepHeight, stepDepth, stepWidth, totalDepth, topY }

// 空间分区系统 - 用于优化碰撞检测
const SPATIAL_GRID_SIZE = 20; // 每个格子20x20米
let spatialGrid = new Map(); // key: "gx,gz", value: [collider indices]

function getGridKey(x, z) {
  const gx = Math.floor(x / SPATIAL_GRID_SIZE);
  const gz = Math.floor(z / SPATIAL_GRID_SIZE);
  return `${gx},${gz}`;
}

function addColliderToSpatialGrid(collider, index) {
  // 计算碰撞器覆盖的所有格子
  const minX = collider.x - collider.hw;
  const maxX = collider.x + collider.hw;
  const minZ = collider.z - collider.hd;
  const maxZ = collider.z + collider.hd;
  
  const minGx = Math.floor(minX / SPATIAL_GRID_SIZE);
  const maxGx = Math.floor(maxX / SPATIAL_GRID_SIZE);
  const minGz = Math.floor(minZ / SPATIAL_GRID_SIZE);
  const maxGz = Math.floor(maxZ / SPATIAL_GRID_SIZE);
  
  for (let gx = minGx; gx <= maxGx; gx++) {
    for (let gz = minGz; gz <= maxGz; gz++) {
      const key = `${gx},${gz}`;
      if (!spatialGrid.has(key)) {
        spatialGrid.set(key, []);
      }
      spatialGrid.get(key).push(index);
    }
  }
}

function getNearbyColliders(x, z, radius) {
  // 获取指定位置周围的所有碰撞器索引
  const result = new Set();
  const minGx = Math.floor((x - radius) / SPATIAL_GRID_SIZE);
  const maxGx = Math.floor((x + radius) / SPATIAL_GRID_SIZE);
  const minGz = Math.floor((z - radius) / SPATIAL_GRID_SIZE);
  const maxGz = Math.floor((z + radius) / SPATIAL_GRID_SIZE);
  
  for (let gx = minGx; gx <= maxGx; gx++) {
    for (let gz = minGz; gz <= maxGz; gz++) {
      const key = `${gx},${gz}`;
      if (spatialGrid.has(key)) {
        spatialGrid.get(key).forEach(idx => result.add(idx));
      }
    }
  }
  
  return Array.from(result).map(idx => colliders[idx]);
}

function rebuildSpatialGrid() {
  spatialGrid.clear();
  for (let i = 0; i < colliders.length; i++) {
    addColliderToSpatialGrid(colliders[i], i);
  }
}

function addCollider(x, z, hw, hd, topY, type, solid) {
  const collider = { x, z, hw, hd, topY, type, solid: !!solid };
  const index = colliders.length;
  colliders.push(collider);
  addColliderToSpatialGrid(collider, index);
}

function clearColliders() {
  colliders = [];
  stairs = [];
  spatialGrid.clear();
}

// ============================================================
// 碰撞体可视化调试系统
// ============================================================
let colliderDebugMeshes = [];
let colliderDebugEnabled = false;

function toggleColliderDebug() {
  colliderDebugEnabled = !colliderDebugEnabled;
  if (colliderDebugEnabled) {
    updateColliderDebugVisuals();
    console.log('[ColliderDebug] 碰撞体可视化已开启，按 F10 关闭');
  } else {
    clearColliderDebugVisuals();
    console.log('[ColliderDebug] 碰撞体可视化已关闭');
  }
}
// 控制台备用调试命令（F10被浏览器拦截时用）
window.showColliders = toggleColliderDebug;
window.listColliders = function() {
  console.log(`[ColliderDebug] 当前共 ${colliders.length} 个碰撞体:`);
  colliders.forEach((c, i) => {
    console.log(`  #${i}: type=${c.type} x=${c.x.toFixed(1)} z=${c.z.toFixed(1)} hw=${c.hw.toFixed(1)} hd=${c.hd.toFixed(1)} topY=${c.topY.toFixed(1)}`);
  });
};
window.clearAllColliders = function() {
  colliders.length = 0;
  clearColliderDebugVisuals();
  console.log('[ColliderDebug] 所有碰撞体已清空');
};

function updateColliderDebugVisuals() {
  clearColliderDebugVisuals();
  if (!scene) return;

  const colors = {
    'wall': 0xff0000,
    'cityWall': 0xff0000,
    'gateTower': 0xff6600,
    'house': 0x00ff00,
    'outpost': 0x0000ff,
    'building': 0x00aaff,
    'stair_wall': 0xffff00,
    'well': 0x00ffff,
    'supply': 0xffff00,
    'cactus': 0x88ff88,
    'rock': 0x888888,
    'tower': 0xff8888,
    'default': 0xffffff
  };

  for (const c of colliders) {
    const color = colors[c.type] || colors['default'];
    const h = Math.max(c.topY || 2, 0.5);
    const w = c.hw * 2;
    const d = c.hd * 2;

    // 1. 半透明实体方块（显示完整碰撞体积）
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(c.x, h / 2, c.z);
    mesh.name = 'colliderDebug';
    scene.add(mesh);
    colliderDebugMeshes.push(mesh);

    // 2. 线框边框
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const edgeMat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.position.copy(mesh.position);
    edges.name = 'colliderDebug';
    scene.add(edges);
    colliderDebugMeshes.push(edges);

    // 3. 顶部文字标签（Canvas Sprite）
    const labelText = `${c.type || '?'}`;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#' + new THREE.Color(color).getHexString();
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(c.x, h + 0.8, c.z);
    sprite.scale.set(3, 0.75, 1);
    sprite.name = 'colliderDebug';
    scene.add(sprite);
    colliderDebugMeshes.push(sprite);

    // 4. 底部中心点（白色十字）
    const cx = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    cx.position.set(c.x, 0.025, c.z);
    cx.name = 'colliderDebug';
    scene.add(cx);
    colliderDebugMeshes.push(cx);
    const cz = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    cz.position.set(c.x, 0.025, c.z);
    cz.name = 'colliderDebug';
    scene.add(cz);
    colliderDebugMeshes.push(cz);
  }

  console.log(`[ColliderDebug] 显示了 ${colliders.length} 个碰撞体，按 F10 关闭`);
}

window.clearColliderDebugVisuals = function() {
  if (!scene) return;
  for (const mesh of colliderDebugMeshes) {
    scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  }
  colliderDebugMeshes = [];
}

// 根据世界坐标计算楼梯斜坡高度（返回脚底高度，-1表示不在楼梯上）
// currentFootY: 玩家当前脚底高度，用于防止远处玩家被拉到高处
function getStairHeight(worldX, worldZ, currentFootY) {
  for (const s of stairs) {
    // 将世界坐标转换到楼梯局部坐标
    const dx = worldX - s.worldX;
    const dz = worldZ - s.worldZ;
    const localX = dx * s.cos + dz * s.sin;
    const localZ = -dx * s.sin + dz * s.cos;
    
    // 检查是否在楼梯宽度范围内
    if (Math.abs(localX) > s.stepWidth / 2 + 0.3) continue;
    
    // 检查是否在楼梯长度范围内（0到totalDepth）
    if (localZ < -0.3 || localZ > s.totalDepth + 0.3) continue;
    
    // 在范围内，计算该位置的斜坡高度
    const t = Math.max(0, Math.min(1, localZ / s.totalDepth));
    const rampHeight = t * s.topY; // 从0线性插值到topY
    
    // 物理约束：只有当玩家当前高度接近斜坡高度时才返回斜坡高度
    if (currentFootY !== undefined) {
      const heightDiff = currentFootY - rampHeight;
      // 玩家在斜坡上方：允许落下，返回斜坡高度作为支撑
      if (heightDiff > 0) {
        // 从上方落下，但限制最大落差为3米（防止从远处被拉到楼梯上）
        if (heightDiff < 3.0) {
          return rampHeight;
        }
        continue;
      }
      // 玩家在斜坡下方：只有接近时（1米以内）才能走上楼梯
      if (heightDiff > -1.0) {
        return rampHeight;
      }
      continue;
    }
    
    return rampHeight;
  }
  return -1; // 不在任何楼梯上
}

// 注意：WEAPON_DEFS, ZOMBIE_DEFS, UPGRADE_DEFS 已从 config.js 加载

// ============================================================
// 浮动文字系统 (委托给 EffectsSystem)
// ============================================================
function showFloatingText(pos, text, color) {
  if (window.EffectsSystem && EffectsSystem.initialized) {
    try {
      EffectsSystem.createFloatingText(text, pos, '#' + color.toString(16).padStart(6, '0'));
      return;
    } catch (e) {}
  }
  // Fallback
  floatingTexts.push({
    pos: pos.clone(),
    text: text,
    color: color,
    life: 2,
    vel: new THREE.Vector3(0, 2, 0)
  });
}

// 创建命中特效（血液/火花飞溅）(委托给 EffectsSystem)
function createHitEffect(pos, color) {
  if (window.EffectsSystem && EffectsSystem.initialized) {
    try {
      EffectsSystem.createHitEffect(pos, { count: 6, color: color });
      return;
    } catch (e) {}
  }
  // Fallback
  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: color });
    const particle = new THREE.Mesh(geo, mat);
    particle.position.copy(pos);
    scene.add(particle);
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      Math.random() * 3 + 1,
      (Math.random() - 0.5) * 5
    );
    particles.push({ mesh: particle, vel: vel, life: 0.5 + Math.random() * 0.3 });
  }
}

// 创建队友枪口闪光效果
function createAllyMuzzleFlash(pos, dir, allyType) {
  // === 机器狗：近战撕咬弧线特效 ===
  if (allyType === 'dog' || allyType === 'robot_dog' || allyType === '机器狗') {
    const arcGeo = new THREE.RingGeometry(0.3, 0.8, 8, 1, 0, Math.PI * 0.8);
    const arcMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const arc = new THREE.Mesh(arcGeo, arcMat);
    arc.position.copy(pos);
    arc.position.y += 0.5;
    if (dir && dir.length() > 0.01) {
      const lookTarget = pos.clone().add(dir.clone().multiplyScalar(2));
      arc.lookAt(lookTarget);
    }
    scene.add(arc);
    // 弧线淡出动画
    let arcLife = 0.2;
    const arcAnim = () => {
      arcLife -= 0.016;
      if (arcLife > 0) {
        arc.material.opacity = (arcLife / 0.2) * 0.7;
        arc.scale.setScalar(1 + (0.2 - arcLife) * 3);
        requestAnimationFrame(arcAnim);
      } else {
        scene.remove(arc);
        arc.geometry.dispose();
        arc.material.dispose();
      }
    };
    arcAnim();
    // 额外溅射粒子
    for (let i = 0; i < 4; i++) {
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xff6600 })
      );
      spark.position.copy(pos);
      spark.position.y += 0.5;
      const sparkVel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 2,
        (Math.random() - 0.5) * 3
      );
      scene.add(spark);
      particles.push({ mesh: spark, vel: sparkVel, life: 0.2 + Math.random() * 0.15 });
    }
    return;
  }

  // === 无人机：蓝色激光线特效 ===
  if (allyType === 'drone' || allyType === '无人机') {
    const targetPos = pos.clone().add(dir.clone().multiplyScalar(50));
    const laserGeo = new THREE.BufferGeometry().setFromPoints([pos.clone(), targetPos]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 });
    const laser = new THREE.Line(laserGeo, laserMat);
    scene.add(laser);
    // 激光快速消失
    let laserLife = 0.1;
    const laserAnim = () => {
      laserLife -= 0.016;
      if (laserLife > 0) {
        laser.material.opacity = (laserLife / 0.1) * 0.9;
        requestAnimationFrame(laserAnim);
      } else {
        scene.remove(laser);
        laser.geometry.dispose();
        laser.material.dispose();
      }
    };
    laserAnim();
    // 枪口蓝色光点
    const dotFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 })
    );
    dotFlash.position.copy(pos);
    scene.add(dotFlash);
    let dotLife = 0.06;
    const dotAnim = () => {
      dotLife -= 0.016;
      if (dotLife > 0) {
        dotFlash.material.opacity = (dotLife / 0.06) * 0.8;
        requestAnimationFrame(dotAnim);
      } else {
        scene.remove(dotFlash);
        dotFlash.geometry.dispose();
        dotFlash.material.dispose();
      }
    };
    dotAnim();
    return;
  }

  // === 炮台：黄色弹道线特效 ===
  if (allyType === 'turret' || allyType === '炮台') {
    const targetPos = pos.clone().add(dir.clone().multiplyScalar(40));
    const bulletGeo = new THREE.BufferGeometry().setFromPoints([pos.clone(), targetPos]);
    const bulletMat = new THREE.LineBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
    const bullet = new THREE.Line(bulletGeo, bulletMat);
    scene.add(bullet);
    // 弹道线淡出
    let bLife = 0.15;
    const bAnim = () => {
      bLife -= 0.016;
      if (bLife > 0) {
        bullet.material.opacity = (bLife / 0.15) * 0.8;
        requestAnimationFrame(bAnim);
      } else {
        scene.remove(bullet);
        bullet.geometry.dispose();
        bullet.material.dispose();
      }
    };
    bAnim();
    // 枪口橙色闪光
    const tFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.7 })
    );
    tFlash.position.copy(pos);
    scene.add(tFlash);
    let tLife = 0.06;
    const tAnim = () => {
      tLife -= 0.016;
      if (tLife > 0) {
        tFlash.material.opacity = (tLife / 0.06) * 0.7;
        tFlash.scale.setScalar(1 + (0.06 - tLife) * 8);
        requestAnimationFrame(tAnim);
      } else {
        scene.remove(tFlash);
        tFlash.geometry.dispose();
        tFlash.material.dispose();
      }
    };
    tAnim();
    return;
  }

  // === 原有职业类型特效（狙击手、突击手、战士、医疗兵、射手） ===
  const colorMap = {
    '狙击手': 0xc0c0c0,
    '突击手': 0xffaa00,
    '战士': 0xff6600,
    '医疗兵': 0x44ff44,
    '射手': 0xff8800
  };
  const color = colorMap[allyType] || 0xff8800;
  
  // 创建闪光球
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 6, 6),
    new THREE.MeshLambertMaterial({ 
      color: color, 
      emissive: color, 
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9
    })
  );
  
  flash.position.copy(pos);
  // 稍微向前偏移，避免被队友身体遮挡
  flash.position.addScaledVector(dir, 0.5);
  scene.add(flash);
  
  // 创建光晕
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 6, 6),
    new THREE.MeshBasicMaterial({ 
      color: color, 
      transparent: true,
      opacity: 0.3
    })
  );
  glow.position.copy(flash.position);
  scene.add(glow);
  
  // 动画：快速淡出并放大
  let life = 0.08; // 80毫秒
  const animate = () => {
    life -= 0.016;
    if (life > 0) {
      const scale = 1 + (0.08 - life) * 10;
      flash.scale.setScalar(scale);
      flash.material.opacity = life / 0.08 * 0.9;
      glow.scale.setScalar(scale * 1.5);
      glow.material.opacity = life / 0.08 * 0.3;
      requestAnimationFrame(animate);
    } else {
      scene.remove(flash);
      scene.remove(glow);
      flash.geometry.dispose();
      flash.material.dispose();
      glow.geometry.dispose();
      glow.material.dispose();
    }
  };
  animate();
}

// 创建队友子弹视觉mesh（根据职业差异化）
function createAllyBulletMesh(bullet, allyType) {
  let mesh;
  let color;
  let size;
  
  // === 机器狗：近战无子弹（不创建弹道mesh） ===
  if (allyType === 'dog' || allyType === 'robot_dog' || allyType === '机器狗') {
    return null; // 近战攻击没有飞行弹道
  }

  // === 无人机：青色激光弹丸 ===
  if (allyType === 'drone' || allyType === '无人机') {
    color = 0x00ffff;
    size = 0.04;
    mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(size * 0.3, size, 0.6, 6),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.9 })
    );
    mesh.rotation.x = Math.PI / 2;
    if (mesh) {
      mesh.position.copy(bullet.pos);
      scene.add(mesh);
      bullet.mesh = mesh;
      bullet.color = color;
    }
    return mesh;
  }

  // === 炮台：黄色/橙色弹丸 ===
  if (allyType === 'turret' || allyType === '炮台') {
    color = 0xffaa00;
    size = 0.08;
    mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 6, 6),
      new THREE.MeshLambertMaterial({ color: color, emissive: 0xff6600, emissiveIntensity: 0.4 })
    );
    if (mesh) {
      mesh.position.copy(bullet.pos);
      scene.add(mesh);
      bullet.mesh = mesh;
      bullet.color = color;
    }
    return mesh;
  }

  switch(allyType) {
    case '狙击手':
      // 狙击手：细长穿甲弹，银色尾迹（更小）
      color = 0xc0c0c0;
      size = 0.04;
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(size * 0.3, size, 0.4, 6),
        new THREE.MeshLambertMaterial({ color: color, emissive: 0x444444, emissiveIntensity: 0.3 })
      );
      mesh.rotation.x = Math.PI / 2;
      break;
      
    case '突击手':
      // 突击手：黄色短弹道（更小）
      color = 0xffaa00;
      size = 0.06;
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 6, 6),
        new THREE.MeshLambertMaterial({ color: color, emissive: color, emissiveIntensity: 0.5 })
      );
      break;
      
    case '战士':
      // 战士：霰弹（多个小弹丸，更小）
      color = 0xff6600;
      size = 0.03;
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 5, 5),
        new THREE.MeshBasicMaterial({ color: color })
      );
      break;
      
    case '炮兵':
      // 炮兵使用导弹，不是子弹，在createArtilleryProjectile中处理
      return null;
      
    case '医疗兵':
      // 医疗兵：绿色治疗光束（更小）
      color = 0x44ff44;
      size = 0.05;
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(size * 0.5, size, 0.3, 6),
        new THREE.MeshLambertMaterial({ color: color, emissive: color, emissiveIntensity: 0.6 })
      );
      mesh.rotation.x = Math.PI / 2;
      break;
      
    default: // 射手
      // 射手：标准橙色子弹（更小）
      color = 0xff8800;
      size = 0.05;
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 6, 6),
        new THREE.MeshBasicMaterial({ color: color })
      );
  }
  
  if (mesh) {
    mesh.position.copy(bullet.pos);
    scene.add(mesh);
    bullet.mesh = mesh;
    bullet.color = color;
  }
  return mesh;
}

// 创建队友击中特效（根据职业差异化）
function createAllyHitEffect(pos, allyType, damage) {
  // === 机器狗：近战撕咬命中 - 红色血雾飞溅 ===
  if (allyType === 'dog' || allyType === 'robot_dog' || allyType === '机器狗') {
    for (let i = 0; i < 8; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 4, 4),
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff2200 : 0xff6600 })
      );
      particle.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 2.5 + 0.5,
        (Math.random() - 0.5) * 4
      );
      scene.add(particle);
      particles.push({ mesh: particle, vel: vel, life: 0.3 + Math.random() * 0.2 });
    }
    // 撕裂弧线效果
    const slashGeo = new THREE.RingGeometry(0.1, 0.4, 6, 1, 0, Math.PI * 0.6);
    const slashMat = new THREE.MeshBasicMaterial({ color: 0xff3300, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const slash = new THREE.Mesh(slashGeo, slashMat);
    slash.position.copy(pos);
    slash.position.y += 0.3;
    slash.rotation.x = -Math.PI / 4 + Math.random() * Math.PI / 2;
    slash.rotation.z = Math.random() * Math.PI;
    scene.add(slash);
    particles.push({ mesh: slash, vel: new THREE.Vector3(0, 0, 0), life: 0.25 });
    return;
  }

  // === 无人机：激光命中 - 青色电弧/灼烧效果 ===
  if (allyType === 'drone' || allyType === '无人机') {
    for (let i = 0; i < 6; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.04, 4, 4),
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.3 ? 0x00ffff : 0x00aaff, transparent: true, opacity: 0.9 })
      );
      particle.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0.5 + Math.random() * 2,
        (Math.random() - 0.5) * 2
      );
      scene.add(particle);
      particles.push({ mesh: particle, vel: vel, life: 0.3 + Math.random() * 0.2 });
    }
    // 灼烧光点
    const burnDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 })
    );
    burnDot.position.copy(pos);
    scene.add(burnDot);
    particles.push({ mesh: burnDot, vel: new THREE.Vector3(0, 0, 0), life: 0.2 });
    return;
  }

  // === 炮台：子弹命中 - 黄色火花爆裂 ===
  if (allyType === 'turret' || allyType === '炮台') {
    for (let i = 0; i < 10; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.05, 4, 4),
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.4 ? 0xffaa00 : 0xff6600 })
      );
      particle.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 3,
        (Math.random() - 0.5) * 6
      );
      scene.add(particle);
      particles.push({ mesh: particle, vel: vel, life: 0.2 + Math.random() * 0.2 });
    }
    // 冲击闪光
    const impactFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.6 })
    );
    impactFlash.position.copy(pos);
    scene.add(impactFlash);
    particles.push({ mesh: impactFlash, vel: new THREE.Vector3(0, 0, 0), life: 0.15 });
    return;
  }

  switch(allyType) {
    case '狙击手':
      // 狙击手：穿透血雾（深红色粒子）
      for (let i = 0; i < 6; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0x8b0000 })
        );
        particle.position.copy(pos);
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 2,
          (Math.random() - 0.5) * 3
        );
        scene.add(particle);
        particles.push({ mesh: particle, vel: vel, life: 0.4 + Math.random() * 0.3 });
      }
      break;
      
    case '突击手':
      // 突击手：火花四溅（橙黄色）
      for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        );
        particle.position.copy(pos);
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 3,
          (Math.random() - 0.5) * 5
        );
        scene.add(particle);
        particles.push({ mesh: particle, vel: vel, life: 0.2 + Math.random() * 0.2 });
      }
      break;
      
    case '战士':
      // 战士：血肉横飞（红色大粒子）
      for (let i = 0; i < 5; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.12 + Math.random() * 0.1, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0xcc0000 })
        );
        particle.position.copy(pos);
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1.5,
          (Math.random() - 0.5) * 2
        );
        scene.add(particle);
        particles.push({ mesh: particle, vel: vel, life: 0.5 + Math.random() * 0.3 });
      }
      break;
      
    case '医疗兵':
      // 医疗兵：绿色治愈光效（向上飘）
      for (let i = 0; i < 6; i++) {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(0.06 + Math.random() * 0.04, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.8 })
        );
        particle.position.copy(pos);
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 1,
          1 + Math.random() * 2,
          (Math.random() - 0.5) * 1
        );
        scene.add(particle);
        particles.push({ mesh: particle, vel: vel, life: 0.6 + Math.random() * 0.3 });
      }
      break;
      
    default: // 射手
      // 射手：标准击中特效（橙色）
      createHitEffect(pos, 0xff6600);
  }
}

// 创建冲击波特效
function createShockwave(pos, color) {
  const ringGeo = new THREE.RingGeometry(0.1, 0.3, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos);
  ring.position.y = 0.1;
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  
  particles.push({
    mesh: ring,
    vel: new THREE.Vector3(0, 0, 0),
    life: 0.4,
    isShockwave: true,
    scale: 1
  });
}

// 创建暴君砸地特效：地面裂痕 + 碎石飞溅
function createSlamEffect(pos) {
  // 碎石飞溅（16个）
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 3 + Math.random() * 5;
    const size = 0.15 + Math.random() * 0.25;
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(0.08, 0.3, 0.2 + Math.random() * 0.15) });
    const debris = new THREE.Mesh(geo, mat);
    debris.position.copy(pos);
    debris.position.y = 0.2;
    debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    scene.add(debris);
    
    particles.push({
      mesh: debris,
      vel: new THREE.Vector3(Math.cos(angle) * speed, 4 + Math.random() * 6, Math.sin(angle) * speed),
      life: 1.2 + Math.random() * 0.5,
      gravity: true
    });
  }
  
  // 地面裂痕环（3层，延迟扩散）
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const ringGeo = new THREE.RingGeometry(0.5 + i * 0.5, 1 + i * 0.8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(0.05, 0.9, 0.3 - i * 0.08),
        side: THREE.DoubleSide, transparent: true, opacity: 0.9 
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.position.y = 0.05;
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);
      
      particles.push({
        mesh: ring,
        vel: new THREE.Vector3(0, 0, 0),
        life: 0.6 + i * 0.15,
        isShockwave: true,
        scale: 1
      });
    }, i * 120);
  }
  
  // 中心烟尘
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 2;
    const geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0x8B7355, transparent: true, opacity: 0.6 });
    const dust = new THREE.Mesh(geo, mat);
    dust.position.set(pos.x + Math.cos(angle) * dist, 0.5, pos.z + Math.sin(angle) * dist);
    scene.add(dust);
    
    particles.push({
      mesh: dust,
      vel: new THREE.Vector3(Math.cos(angle) * 2, 1.5 + Math.random() * 2, Math.sin(angle) * 2),
      life: 0.8 + Math.random() * 0.5,
      gravity: true
    });
  }
}

// 创建毒液区域（地面持续伤害）
function createPoisonZone(pos, damagePerTick) {
  if (!window.poisonZones) window.poisonZones = [];
  
  // 创建毒液池视觉效果
  const poolGeo = new THREE.CircleGeometry(3, 24);
  const poolMat = new THREE.MeshBasicMaterial({ 
    color: 0x33cc33, 
    transparent: true, 
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const poolMesh = new THREE.Mesh(poolGeo, poolMat);
  poolMesh.position.copy(pos);
  poolMesh.position.y = 0.05;
  poolMesh.rotation.x = -Math.PI / 2;
  scene.add(poolMesh);
  
  // 创建毒雾效果
  const fogGeo = new THREE.CylinderGeometry(2.5, 2.5, 2, 16, 1, true);
  const fogMat = new THREE.MeshBasicMaterial({ 
    color: 0x44ff44, 
    transparent: true, 
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const fogMesh = new THREE.Mesh(fogGeo, fogMat);
  fogMesh.position.copy(pos);
  fogMesh.position.y = 1;
  scene.add(fogMesh);
  
  const zone = {
    pos: pos.clone(),
    damage: damagePerTick,
    duration: 4, // 持续4秒
    radius: 3,
    mesh: poolMesh,
    fogMesh: fogMesh,
    lastDamageTime: 0,
    damageInterval: 0.5, // 每0.5秒造成一次伤害
    createdAt: surviveTime
  };
  
  window.poisonZones.push(zone);
  return zone;
}

// 更新毒液区域
function updatePoisonZones(dt) {
  if (!window.poisonZones) return;
  
  const now = surviveTime;
  const toRemove = [];
  
  for (let i = 0; i < window.poisonZones.length; i++) {
    const zone = window.poisonZones[i];
    const elapsed = now - zone.createdAt;
    
    // 渐变消失
    const fadeStart = zone.duration - 1;
    if (elapsed > fadeStart) {
      const fadeProgress = (elapsed - fadeStart) / 1;
      zone.mesh.material.opacity = 0.6 * (1 - fadeProgress);
      zone.fogMesh.material.opacity = 0.2 * (1 - fadeProgress);
    }
    
    // 持续时间结束
    if (elapsed >= zone.duration) {
      scene.remove(zone.mesh);
      scene.remove(zone.fogMesh);
      toRemove.push(i);
      continue;
    }
    
    // 对玩家造成伤害
    const distToPlayer = new THREE.Vector2(
      camera.position.x - zone.pos.x,
      camera.position.z - zone.pos.z
    ).length();
    
    if (distToPlayer < zone.radius) {
      if (now - zone.lastDamageTime >= zone.damageInterval) {
        damagePlayer(zone.damage);
        showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 1.5, 0)), '毒液伤害!', 0x33ff33);
        zone.lastDamageTime = now;
      }
    }
    
    // 毒雾上下浮动
    zone.fogMesh.position.y = 1 + Math.sin(elapsed * 3) * 0.3;
    zone.fogMesh.rotation.y += dt * 0.5;
  }
  
  // 移除过期区域
  for (let i = toRemove.length - 1; i >= 0; i--) {
    window.poisonZones.splice(toRemove[i], 1);
  }
}

// 更新毒液喷射特效
function updatePoisonSprays(dt) {
  if (!window.poisonSprays) return;
  
  const toRemove = [];
  
  for (let i = 0; i < window.poisonSprays.length; i++) {
    const spray = window.poisonSprays[i];
    const elapsed = surviveTime - spray.createdAt;
    
    for (const p of spray.particles) {
      if (p.delay > elapsed) {
        continue;
      }
      
      p.progress = Math.min(1, (elapsed - p.delay) / 0.3);
      
      // 抛物线轨迹 - 使用当前位置作为起点
      const t = p.progress;
      const startPos = p.mesh.position.clone();
      p.mesh.position.lerpVectors(startPos, p.target, t * 0.1);
      p.mesh.position.y += Math.sin(t * Math.PI) * 2; // 抛物线高度
      
      // 落地后消失
      if (p.progress >= 1) {
        p.mesh.position.y = 0.1;
      }
    }
    
    if (elapsed > 1) {
      for (const p of spray.particles) {
        scene.remove(p.mesh);
      }
      toRemove.push(i);
    }
  }
  
  for (let i = toRemove.length - 1; i >= 0; i--) {
    window.poisonSprays.splice(toRemove[i], 1);
  }
}

function updateFloatingTexts(dt) {
  if (window.EffectsSystem && EffectsSystem.initialized) {
    try {
      EffectsSystem.updateFloatingTexts(dt);
      return;
    } catch (e) {}
  }
  // Fallback: 旧浮动文字系统更新
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.pos.addScaledVector(ft.vel, dt);
    ft.life -= dt;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }
}

// 更新粒子特效
// updateParticles 已合并到行8199（兼容两种粒子格式+冲击波）
// 保留此处注释避免混淆

function renderFloatingTexts() {
  // 使用2D canvas绘制浮动文字
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  floatingTexts.forEach(ft => {
    // 将3D位置转换为屏幕位置
    const screenPos = ft.pos.clone().project(camera);
    if (screenPos.z > 1) return; // 在相机后面
    
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    
    // 创建文字纹理
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = `#${ft.color.toString(16).padStart(6, '0')}`;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, 128, 40);
    
    // 这里简化处理，实际应该用Sprite
  });
}

// ============================================================
// 初始化
// ============================================================
function init() {
  // 初始化依赖THREE的变量
  playerVelocity = new THREE.Vector3();
  dayNightCycle.skyColor = new THREE.Color();
  
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 30, 120);
  
  // 初始化避难所系统
  if (window.ShelterSystem) ShelterSystem.init();

  // 初始化世界地图系统
  if (window.WorldMap) WorldMap.init();

  // 初始化昼夜系统
  initDayNightCycle();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 1.7, 0);
  scene.add(camera); // 将camera加入scene，使其children（武器模型等）能被渲染

  // 初始化天气系统（必须在 camera 创建之后）
  if (window.WeatherSystem) WeatherSystem.init(scene, camera);

  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // 限制像素比以减少GPU负载
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // 优化：启用排序以保证透明粒子正确渲染
  renderer.sortObjects = true;
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();
  minimapCtx = document.getElementById('minimap-canvas').getContext('2d');

  // 初始化地图管理器（必须在 scene/camera/renderer 创建之后）
  if (window.MapManager) {
    MapManager.init(scene, camera, renderer);
    MapManager.autoRegister();
    // 延迟再次注册，确保所有地图模块（在game.js之后加载的）都能被捕获
    setTimeout(function() {
      if (window.MapManager && typeof MapManager.autoRegister === 'function') {
        MapManager.autoRegister();
        console.log('[MapManager] Delayed auto-register completed, maps:', Array.from(MapManager.maps.keys()).join(', '));
      }
    }, 100);
  }

  // 初始化模块适配器（连接新模块与旧代码，必须在 scene/camera 创建之后）
  if (window.ModuleAdapter) {
    ModuleAdapter.init(scene, camera, renderer);
  }

  // 暴露给工事系统等外部模块使用
  window.scene = scene;
  window.camera = camera;
  window.renderer = renderer;
  window.player = player;
  window.weapons = weapons;
  window.playSound = function(type, vol) { if (window.AudioSystem) AudioSystem.playSound(type, vol); };
  // 同步相机到天气特效系统
  if (window.WeatherEffects) WeatherEffects.syncCamera(camera);
  window.showFloatingText = showFloatingText;
  window.startGame = startGame;
  window.spawnAlly = spawnAlly; // 暴露给升级系统使用
  window.allies = allies; // 暴露给升级系统使用

  // 灯光
  const ambient = new THREE.AmbientLight(0x334455, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
  dirLight.position.set(50, 80, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024); // 降低阴影分辨率以减少GPU负载
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 150; // 减少阴影距离
  dirLight.shadow.camera.left = -60;
  dirLight.shadow.camera.right = 60;
  dirLight.shadow.camera.top = 60;
  dirLight.shadow.camera.bottom = -60;
  dirLight.shadow.bias = -0.0005; // 减少阴影失真
  scene.add(dirLight);

  const hemiLight = new THREE.HemisphereLight(0x446688, 0x223322, 0.4);
  scene.add(hemiLight);

  setupInput();
  animate();

  // 隐藏首页加载遮罩层，显示开始菜单
  const loadingScreen = document.getElementById('loading-screen');
  const loadingBar = document.getElementById('loading-bar');
  const loadingPercent = document.getElementById('loading-percent');
  const loadingText = document.getElementById('loading-text');
  if (loadingScreen) {
    // 模拟加载完成进度动画
    const steps = [
      { pct: 30, text: '加载资源...' },
      { pct: 60, text: '初始化场景...' },
      { pct: 85, text: '准备就绪...' },
      { pct: 100, text: '加载完成！' }
    ];
    let stepIdx = 0;
    function nextStep() {
      if (stepIdx < steps.length) {
        const s = steps[stepIdx];
        if (loadingBar) loadingBar.style.width = s.pct + '%';
        if (loadingPercent) loadingPercent.textContent = s.pct + '%';
        if (loadingText) loadingText.textContent = s.text;
        stepIdx++;
        setTimeout(nextStep, 200);
      } else {
        // 进度完成，淡出遮罩层
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 800);
      }
    }
    nextStep();
  }
}

// ============================================================
// 输入控制
// ============================================================
function setupInput() {
  // 调试标志：用于确认输入系统是否正常工作
  window._inputDebug = { keydown: false, mousemove: false, updatePlayer: 0 };

  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    // 首次按键时记录调试信息
    if (!window._inputDebug.keydown && gameState === 'playing') {
      window._inputDebug.keydown = true;
      if (window._showError) window._showError('[调试] 键盘输入已捕获: ' + e.code);
    }
    
    // 死亡状态下只允许Enter键（重新开始）
    if (gameState === 'dead' || gameState === 'loading') return;
    
    // 调试命令：按 / 打开/关闭命令输入框（toggle模式）
    if (e.code === 'Slash') {
      e.preventDefault();
      openDebugCommandInput(); // 内部已有toggle逻辑：打开时关闭，关闭时打开
      return;
    }

    // M键：切换世界地图显示/隐藏（支持playing和paused两种状态）
    if (e.code === 'KeyM') {
      e.preventDefault();
      if (window.WorldMap && WorldMap.isOpen) {
        WorldMap.hideWorldMap();
      } else if (gameState === 'playing') {
        if (window.WorldMap) {
          WorldMap.showWorldMap();
        }
      }
      return;
    }

    // L键：查看任务面板
    if (e.code === 'KeyL') {
      e.preventDefault();
      if (gameState === 'playing' && window.DesertMap && DesertMap.active) {
        DesertMap.showQuestPanel();
      }
      return;
    }

    // ESC处理：优先取消工事部署，否则打开ESC菜单
    if (e.code === 'Escape') {
      // 优先关闭NPC对话面板
      if (window.DesertMap && DesertMap.npcDialogOpen) {
        DesertMap.closeNPCDialog();
        return;
      }
      if (window.selectedFortification) {
        window.selectedFortification = null;
        const hint = document.getElementById('deployment-hint');
        if (hint) hint.style.display = 'none';
        return;
      }
      // 打开ESC菜单（仅在playing状态）
      if (gameState === 'playing' && typeof openEscMenu === 'function') {
        openEscMenu();
        return;
      }
    }
    if (e.code === 'KeyR' && gameState === 'playing' && !e.repeat) {
      // 建造模式下R旋转预览模型
      if (window.deploymentMode) {
        if (window.FortificationSystem) FortificationSystem.rotatePreview();
      } else {
        // 记录R键按下时间，用于长按检测
        rKeyDownTime = Date.now();
      }
    }
    if (e.code === 'KeyC') {
      if (gameState === 'playing') {
        openStatPanel();
      } else if (gameState === 'statPanel') {
        closeStatPanel();
      }
    }
    // 数字键：部署模式下选择工事，非部署模式切换武器
    if (e.code >= 'Digit1' && e.code <= 'Digit9' && gameState === 'playing') {
      const idx = parseInt(e.code.replace('Digit', '')) - 1;
      if (window.deploymentMode) {
        // 部署模式：选择工事
        if (window.FortificationSystem) {
          window.FortificationSystem.selectFortificationByIndex(idx);
        }
      } else {
        // 非部署模式：切换武器
        if (idx < weapons.length) switchWeapon(idx);
      }
    }
    // G键回收工事
    if (e.code === 'KeyG' && gameState === 'playing') {
      if (window.FortificationSystem) FortificationSystem.recycleFortificationAtCursor();
    }
    // 避难所按键 H（切换开关）
    if (e.code === 'KeyH' && gameState === 'playing') {
      if (window.ShelterUI) {
        if (window.shelterPauseState) {
          ShelterUI.close();
        } else {
          ShelterUI.open();
        }
      }
    }
    // 伙伴窗口按键 P（切换开关）
    // 在playing或paused状态都可以按P（paused时只用于关闭P面板）
    if (e.code === 'KeyP' && (gameState === 'playing' || (gameState === 'paused' && window.allyPanelState))) {
      // 如果H避难所打开，不处理P
      if (window.shelterPauseState) return;
      
      // 如果P界面打开，先关闭它；否则打开
      if (window.allyPanelState) {
        closeAllyPanel();
      } else {
        // 关闭V部署界面（如果打开的话）
        if (window.deploymentMode) {
          window.deploymentMode = false;
          if (window.FortificationSystem) FortificationSystem.exitDeploymentMode();
        }
        openAllyPanel();
      }
    }
    // Q键仅在部署模式下切换工事（忽略重复触发）
    if (e.code === 'KeyQ' && !e.repeat && gameState === 'playing' && window.deploymentMode) {
      if (window.FortificationSystem) FortificationSystem.cycleFortification();
    }
    // E键在部署模式下放置工事（忽略重复触发）
    if (e.code === 'KeyE' && !e.repeat && gameState === 'playing' && window.deploymentMode) {
      if (window.FortificationSystem) FortificationSystem.placeFortification();
    }
    // 城市传送门E键交互（非部署模式下）
    if (e.code === 'KeyE' && !e.repeat && gameState === 'playing' && !window.deploymentMode) {
      if (portalsActivated && cityPortals.length > 0 && (window.currentMap === 'city' || !window.currentMap)) {
        cityPortals.forEach(portal => {
          if (portal.userData.activated) {
            const dist = camera.position.distanceTo(portal.position);
            if (dist < 8) {
              // 打开世界地图选择界面
              if (window.WorldMap) WorldMap.showWorldMap();
              keys['KeyE'] = false;
            }
          }
        });
      }
      // 沙漠NPC对话（必须在KeyE条件内！）
      if (window.DesertMap && DesertMap.active) {
        const nearNPC = DesertMap.getNearbyNPC(camera.position, 4);
        if (nearNPC && ['arms_dealer','bounty_hunter','camp_manager','villager'].includes(nearNPC.type)) {
          DesertMap.openNPCDialog(nearNPC);
          gameState = 'paused';
          return;
        }
      }
    }
    // 雪山地图E键交互
    if (window.SnowMap && SnowMap.active && window.currentMap === 'snow') {
      // 收音机交互
      if (SnowMap.radioMesh && !SnowMap.radioInteracted) {
        const dist = camera.position.distanceTo(SnowMap.radioMesh.position);
        if (dist < 5) {
          SnowMap.interactRadio();
          // 暂停游戏，释放鼠标到弹窗
          gameState = 'paused';
          if (document.pointerLockElement) document.exitPointerLock();
          document.body.style.cursor = 'default';
          keys['KeyE'] = false;
        }
      }
      // 电源交互
      SnowMap.powerNodes.forEach((node, idx) => {
        if (!node.activated && node.zombiesCleared) {
          const dist = camera.position.distanceTo(node.mesh.position);
          if (dist < 5) {
            SnowMap.activatePower(idx);
            keys['KeyE'] = false;
          }
        }
      });
      // 信号塔启动交互
      if (SnowMap.phase === 'returnToTower') {
        const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
        if (dist < 8) {
          if (typeof showSnowMissionDialog === 'function') {
            showSnowMissionDialog('towerStart');
            // 暂停游戏，释放鼠标到弹窗
            gameState = 'paused';
            if (document.pointerLockElement) document.exitPointerLock();
            document.body.style.cursor = 'default';
            keys['KeyE'] = false;
          }
        }
      }
      // 返回传送门交互
      if (SnowMap.portalMesh) {
        const dist = camera.position.distanceTo(SnowMap.portalMesh.position);
        if (dist < 8) {
          travelToCityMap();
          keys['KeyE'] = false;
        }
      }
      // 直升机登机
      if (window.DesertMap && DesertMap.helicopterArrived && !DesertMap.playerBoarded && DesertMap.helicopterFlightPhase === 'waiting') {
        const px = camera.position.x;
        const pz = camera.position.z;
        const dist = Math.sqrt(px * px + pz * pz);
        if (dist < 6) {
          DesertMap.playerBoarded = true;
          DesertMap.onPlayerBoardHelicopter();
        }
      }
    }
    // M键取消工事移动
    if (e.code === 'KeyM' && !e.repeat && gameState === 'playing') {
      e.preventDefault();
      if (window.FortificationSystem) FortificationSystem.cancelMoveFort();
    }
    // V键切换部署模式
    if (e.code === 'KeyV' && gameState === 'playing') {
      // 如果H避难所或P伙伴窗口打开，不处理V
      if (window.shelterPauseState || window.allyPanelState) return;
      
      window.deploymentMode = !window.deploymentMode;
      console.log('[Game] Deployment mode:', window.deploymentMode);
      if (window.FortificationSystem) {
        if (window.deploymentMode) {
          window.FortificationSystem.enterDeploymentMode();
        } else {
          window.FortificationSystem.exitDeploymentMode();
        }
      }
    }
    // F10键切换碰撞体可视化调试
    if (e.code === 'F10') {
      e.preventDefault();
      toggleColliderDebug();
    }
  });
  document.addEventListener('keyup', e => {
    keys[e.code] = false;
    // 忽略M键的keyup
    if (e.code === 'KeyM') {
      e.preventDefault();
    }
    // R键：长按收起/拿出武器，短按换弹
    if (e.code === 'KeyR' && gameState === 'playing' && rKeyDownTime > 0) {
      const pressDuration = Date.now() - rKeyDownTime;
      rKeyDownTime = 0;
      if (!window.deploymentMode) {
        if (pressDuration >= HOLSTER_LONG_PRESS) {
          // 长按：切换收起/拿出武器
          toggleHolster();
        } else {
          // 短按：换弹（只有在武器未收起时才换弹）
          if (!weaponHolstered) {
            reloadWeapon();
          }
        }
      }
    }
  });
  document.addEventListener('mousedown', e => {
    // 非playing状态下不处理鼠标按下（防止面板交互干扰）
    if (gameState !== 'playing') return;
    // 检查是否点击了对话框
    const dialog = document.getElementById('npc-dialog-overlay');
    if (dialog && dialog.style.display !== 'none' && dialog.contains(e.target)) {
      return; // 点击对话框时不射击
    }
    // 检查是否点击了升级面板
    const upgradePanel = document.getElementById('upgrade-panel');
    if (upgradePanel && upgradePanel.style.display !== 'none' && upgradePanel.contains(e.target)) {
      return; // 点击升级面板时不射击
    }
    if (e.button === 0) {
      // 部署模式下左键部署工事
      if (window.deploymentMode && window.selectedFortification) {
        if (window.FortificationSystem) FortificationSystem.handleClick(e);
        return;
      }
      mouseDown = true;
      shoot();
    } else if (e.button === 2) {
      // 右键瞄准（仅狙击枪）
      rightMouseDown = true;
      if (weapons[currentWeaponIndex].name === '狙击枪') {
        toggleAim(true);
      }
    }
  });
  document.addEventListener('mouseup', e => {
    if (gameState !== 'playing') return;
    if (e.button === 0) mouseDown = false;
    else if (e.button === 2) {
      rightMouseDown = false;
      toggleAim(false);
    }
  });
  document.addEventListener('contextmenu', e => e.preventDefault()); // 禁用右键菜单
  // 滚轮切换武器
  document.addEventListener('wheel', e => {
    if (gameState !== 'playing') return;
    if (!document.pointerLockElement) return;
    e.preventDefault();
    if (e.deltaY > 0) {
      // 向下滚：下一把武器
      switchWeapon((currentWeaponIndex + 1) % weapons.length);
    } else {
      // 向上滚：上一把武器
      switchWeapon((currentWeaponIndex - 1 + weapons.length) % weapons.length);
    }
  }, { passive: false });
  document.addEventListener('mousemove', e => {
    if (gameState === 'playing' && document.pointerLockElement) {
      // 首次鼠标移动时记录调试信息
      if (!window._inputDebug.mousemove) {
        window._inputDebug.mousemove = true;
        if (window._showError) window._showError('[调试] 鼠标视角控制已激活');
      }
      // 基础鼠标移动（应用设置中的灵敏度）
      const sensMultiplier = window.mouseSensitivityMultiplier || 1;
      let moveX = e.movementX * CONFIG.MOUSE_SENS * sensMultiplier;
      let moveY = e.movementY * CONFIG.MOUSE_SENS * sensMultiplier;
      // 狙击瞄准时的呼吸晃动偏移
      if (isAiming && breathingOffset) {
        moveX += breathingOffset.x;
        moveY += breathingOffset.y;
      }
      yaw -= moveX;
      pitch -= moveY;
      pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));
    }
  });
  renderer.domElement.addEventListener('click', () => {
    // 避难所打开时不锁定指针
    if (gameState === 'playing' && !window.shelterPauseState) {
      renderer.domElement.requestPointerLock().catch(err => {
        console.warn('[game.js] requestPointerLock failed:', err);
      });
    }
  });

  // 监听指针锁定变化，防止在面板打开时被重新锁定
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement && (gameState !== 'playing' || window.shelterPauseState)) {
      document.exitPointerLock();
    }
    // 自动重新锁定：当面板关闭后需要恢复指针锁定
    if (!document.pointerLockElement && window._needReLock && gameState === 'playing' && !window.shelterPauseState) {
      window._needReLock = false;
      renderer.domElement.requestPointerLock();
    }
  });

  // restart-btn仍然需要绑定（死亡后重新开始，保留当前地图）
  document.getElementById('restart-btn').addEventListener('click', function() {
    // 记住死亡前的地图，复活后回到同一地图
    window._respawnMap = window.currentMap || 'city';
    startGame();
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ===== 命令行调试/跳过功能 =====
  window._cheats = {
    // 跳过雪山任务，直接进入防御阶段
    skipSnow() {
      if (!window.SnowMap || !SnowMap.active) {
        console.log('[Cheat] 当前不在雪山地图');
        return;
      }
      // 清理游荡僵尸
      if (SnowMap.wanderZombies) {
        SnowMap.wanderZombies.forEach(z => { if (z.mesh) scene.remove(z.mesh); });
        SnowMap.wanderZombies = [];
      }
      // 激活所有电源
      SnowMap.powerNodes.forEach((node, i) => {
        node.activated = true;
        node.zombiesCleared = true;
        const light = node.mesh.getObjectByName('powerStatus');
        if (light) light.material.color.setHex(0x00ff00);
      });
      SnowMap.activatedPowers = SnowMap.powerNodes.length;
      // 直接进入防御阶段
      SnowMap.startDefense();
      console.log('[Cheat] 已跳过雪山任务，进入防御阶段');
    },
    // 跳过荒漠任务，直接进入防御阶段
    skipDesert() {
      if (!window.DesertMap || !DesertMap.active) {
        console.log('[Cheat] 当前不在荒漠地图');
        return;
      }
      DesertMap.currentWave = DesertMap.maxWaves;
      DesertMap.waveComplete = true;
      DesertMap.startDefense();
      console.log('[Cheat] 已跳过荒漠任务，进入防御阶段');
    },
    // 跳过沼泽任务，直接进入防御阶段
    skipSwamp() {
      if (!window.SwampMap || !SwampMap.active) {
        console.log('[Cheat] 当前不在沼泽地图');
        return;
      }
      SwampMap.defenseWave = SwampMap.maxWaves;
      SwampMap.phase = 'defend';
      SwampMap.startDefenseWave();
      console.log('[Cheat] 已跳过沼泽探索，进入最终防御波次');
    },
    // 传送到指定地图
    goto(mapId) {
      const validMaps = ['city', 'snow', 'desert', 'island', 'swamp'];
      if (!validMaps.includes(mapId)) {
        console.log(`[Cheat] 无效地图ID: ${mapId}。可用: ${validMaps.join(', ')}`);
        return;
      }
      if (window.MapManager && typeof MapManager.switchTo === 'function') {
        MapManager.switchTo(mapId);
        console.log(`[Cheat] 已传送到地图: ${mapId}`);
      } else {
        console.log('[Cheat] MapManager 未加载');
      }
    },
    // 列出所有可用地图
    maps() {
      const maps = [];
      if (window.CityMap) maps.push('city - 城市');
      if (window.SnowMap) maps.push('snow - 雪山');
      if (window.DesertMap) maps.push('desert - 荒漠');
      if (window.IslandBase) maps.push('island - 孤岛基地');
      if (window.SwampMap) maps.push('swamp - 毒雾沼泽');
      console.log('[Cheat] 可用地图:\n' + maps.map(m => '  ' + m).join('\n'));
    },
    // 杀死所有敌人
    killAll() {
      enemies.forEach(e => { if (!e.dead) killEnemy(e); });
      if (SnowMap && SnowMap.wanderZombies) SnowMap.wanderZombies.forEach(z => { if (z.state !== 'dead') { z.state = 'dead'; if (z.mesh) scene.remove(z.mesh); } });
      if (SnowMap && SnowMap.defenseEnemies) SnowMap.defenseEnemies.forEach(e => { if (e.state !== 'dead') { e.state = 'dead'; if (e.mesh) scene.remove(e.mesh); } });
      if (DesertMap && DesertMap.desertMonsters) DesertMap.desertMonsters.forEach(m => { if (!m.dead) { m.dead = true; if (m.mesh) scene.remove(m.mesh); } });
      if (SwampMap && SwampMap.mutants) SwampMap.mutants.forEach(m => { if (m.hp > 0) { m.hp = 0; if (m.mesh) scene.remove(m.mesh); } });
      if (SwampMap && SwampMap.defenseEnemies) SwampMap.defenseEnemies.forEach(e => { if (e.hp > 0) { e.hp = 0; if (e.mesh) scene.remove(e.mesh); } });
      console.log('[Cheat] 已清除所有敌人');
    },
    // 满血
    heal() {
      if (player) { player.hp = player.maxHp; updateHUD(); }
      console.log('[Cheat] 已恢复满血');
    },
    // 无限弹药
    ammo() {
      if (weapons) weapons.forEach(w => { w.ammo = w.maxAmmo; w.reserve = w.maxReserve; });
      updateAmmo();
      console.log('[Cheat] 已补满弹药');
    },
    // 显示帮助
    help() {
      console.log(`
[Cheat] 可用调试命令:
  _cheats.goto('city')    - 传送到城市地图
  _cheats.goto('snow')    - 传送到雪山地图
  _cheats.goto('desert')  - 传送到荒漠地图
  _cheats.goto('island')  - 传送到孤岛基地
  _cheats.goto('swamp')   - 传送到毒雾沼泽
  _cheats.maps()          - 列出所有可用地图
  _cheats.skipSnow()      - 跳过雪山任务
  _cheats.skipDesert()    - 跳过荒漠任务
  _cheats.skipSwamp()     - 跳过沼泽探索
  _cheats.killAll()       - 清除所有敌人
  _cheats.heal()          - 恢复满血
  _cheats.ammo()          - 补满弹药
  _cheats.help()          - 显示此帮助
      `);
    }
  };
  console.log('[Cheat] 调试命令已加载: _cheats.help() 查看所有命令');
}

// ============================================================
// 地图生成 - 真实城市街区系统
// ============================================================

// 城市街区配置
// CITY_CONFIG - 直接定义到window对象，避免重复声明问题
if (!window.CITY_CONFIG) {
  window.CITY_CONFIG = {
    BLOCK_SIZE: 60,        // 街区大小
    ROAD_WIDTH: 10,        // 道路宽度
    BUILDING_MIN_SIZE: 8,  // 最小建筑尺寸
    BUILDING_MAX_SIZE: 20, // 最大建筑尺寸
    MIN_BUILDING_HEIGHT: 4,
    MAX_BUILDING_HEIGHT: 35,
    BLOCKS_PER_SIDE: 3,    // 每边街区数量
  };
}

// 建筑类型定义
// BUILDING_TYPES - 直接定义到window对象，避免重复声明问题
if (!window.BUILDING_TYPES) {
  window.BUILDING_TYPES = {
    RESIDENTIAL: { 
      colors: [0x8B7355, 0xA0826D, 0xBC9A6A, 0xC4A77D], // 暖色调住宅
      heightRange: [4, 12],
      windowDensity: 0.7,
      hasBalcony: true,
    },
    COMMERCIAL: {
      colors: [0x556677, 0x4A5568, 0x5A6A7A, 0x607080], // 冷色调商业
      heightRange: [8, 25],
      windowDensity: 0.9,
      hasBalcony: false,
    },
    INDUSTRIAL: {
      colors: [0x666666, 0x777777, 0x555555, 0x606060], // 灰色工业
      heightRange: [4, 8],
      windowDensity: 0.3,
      hasBalcony: false,
    },
    SKYSCRAPER: {
      colors: [0x2C3E50, 0x34495E, 0x3D566E, 0x465F6F], // 深蓝玻璃
      heightRange: [20, 35],
      windowDensity: 0.95,
      hasBalcony: false,
    },
  };
}

// ============================================================
// 分区分片动态加载系统
// ============================================================

// 获取玩家所在区块坐标
function getPlayerChunk() {
  const px = camera.position.x;
  const pz = camera.position.z;
  const cx = Math.floor(px / CONFIG.CHUNK_SIZE);
  const cz = Math.floor(pz / CONFIG.CHUNK_SIZE);
  return {x: cx, z: cz};
}

// 获取区块key
function getChunkKey(cx, cz) {
  return `${cx},${cz}`;
}

// 初始化分区分片系统
function initChunkSystem() {
  chunkSystem.chunks.clear();
  chunkSystem.chunkUpdateTimer = 0;
  chunkSystem.lastPlayerChunk = {x: 0, z: 0};
  
  // 预生成所有区块的静态数据（建筑位置、类型等）
  generateAllChunkData();
  
  // 加载初始区块（玩家周围）
  updateChunks();
}

// 预生成所有区块数据（只生成数据，不创建mesh）
function generateAllChunkData() {
  chunkSystem.allChunkData = [];
  const range = Math.ceil(CONFIG.MAP_SIZE / CONFIG.CHUNK_SIZE);
  
  for (let cx = -range; cx <= range; cx++) {
    for (let cz = -range; cz <= range; cz++) {
      const chunkData = generateChunkData(cx, cz);
      if (chunkData && chunkData.buildings.length > 0) {
        chunkSystem.allChunkData.push(chunkData);
      }
    }
  }
}

// 生成单个区块的数据（建筑配置）- 真实城市场景
function generateChunkData(cx, cz) {
  const chunkWorldX = cx * CONFIG.CHUNK_SIZE;
  const chunkWorldZ = cz * CONFIG.CHUNK_SIZE;
  
  // 跳过中心区块（玩家出生点）
  if (cx === 0 && cz === 0) {
    return {cx, cz, buildings: [], props: []};
  }
  
  const buildings = [];
  const props = [];
  const FLOOR_H = 3;
  const ROAD_WIDTH = 8;
  const placed = []; // 已放置建筑的占用区域
  
  // 建筑类型定义
  const BUILDING_TYPES = [
    { type: 'RESIDENTIAL', minFloors: 4, maxFloors: 8,  minW: 10, maxW: 16, minD: 10, maxD: 16, weight: 0.4 },
    { type: 'COMMERCIAL',  minFloors: 6, maxFloors: 15, minW: 12, maxW: 20, minD: 12, maxD: 20, weight: 0.3 },
    { type: 'INDUSTRIAL',  minFloors: 2, maxFloors: 4,  minW: 14, maxW: 22, minD: 14, maxD: 22, weight: 0.15 },
    { type: 'WAREHOUSE',   minFloors: 1, maxFloors: 2,  minW: 16, maxW: 24, minD: 16, maxD: 24, weight: 0.15 }
  ];
  
  // 按权重随机选择建筑类型
  function pickBuildingType() {
    const r = Math.random();
    let acc = 0;
    for (const bt of BUILDING_TYPES) {
      acc += bt.weight;
      if (r <= acc) return bt;
    }
    return BUILDING_TYPES[0];
  }
  
  // 检查是否与已有建筑重叠（含道路间距）
  function overlaps(nx, nz, nw, nd) {
    const margin = ROAD_WIDTH / 2;
    for (const p of placed) {
      if (nx - nw / 2 - margin < p.x + p.w / 2 + margin &&
          nx + nw / 2 + margin > p.x - p.w / 2 - margin &&
          nz - nd / 2 - margin < p.z + p.d / 2 + margin &&
          nz + nd / 2 + margin > p.z - p.d / 2 - margin) {
        return true;
      }
    }
    return false;
  }
  
  // 尝试在区块内放置建筑
  const maxAttempts = 6;
  const numBuildings = 1 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numBuildings; i++) {
    const bt = pickBuildingType();
    const floors = bt.minFloors + Math.floor(Math.random() * (bt.maxFloors - bt.minFloors + 1));
    const w = bt.minW + Math.random() * (bt.maxW - bt.minW);
    const d = bt.minD + Math.random() * (bt.maxD - bt.minD);
    const h = floors * FLOOR_H;
    
    // 尝试找到不重叠的位置
    let placed_ok = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const px = chunkWorldX + (Math.random() - 0.5) * (CONFIG.CHUNK_SIZE - w - ROAD_WIDTH);
      const pz = chunkWorldZ + (Math.random() - 0.5) * (CONFIG.CHUNK_SIZE - d - ROAD_WIDTH);
      
      if (!overlaps(px, pz, w, d)) {
        // 入口门位置：随机选一面墙的中间
        const doorSide = Math.floor(Math.random() * 4); // 0=+x, 1=-x, 2=+z, 3=-z
        let doorX, doorZ, doorDir;
        if (doorSide === 0) { doorX = px + w / 2; doorZ = pz; doorDir = 0; }
        else if (doorSide === 1) { doorX = px - w / 2; doorZ = pz; doorDir = Math.PI; }
        else if (doorSide === 2) { doorX = px; doorZ = pz + d / 2; doorDir = Math.PI / 2; }
        else { doorX = px; doorZ = pz - d / 2; doorDir = -Math.PI / 2; }
        
        // 窗户布局：每层每面墙的窗户数量和间距
        const windowsPerFloor = {
          xWalls: Math.max(1, Math.floor(w / 3)),  // 沿x方向墙面的窗户数
          zWalls: Math.max(1, Math.floor(d / 3))   // 沿z方向墙面的窗户数
        };
        
        // 是否有楼梯（大建筑一定有，小建筑随机）
        const hasStair = floors >= 3 || Math.random() > 0.4;
        
        // 楼梯数据
        let stairData = null;
        if (hasStair) {
          const stairWidth = 2.5;
          const stepHeight = 0.3;
          const stepDepth = 0.5;
          const stepCount = Math.round(FLOOR_H / stepHeight);
          // 楼梯放在建筑内部靠墙位置
          const stairOffsetX = (Math.random() > 0.5 ? 1 : -1) * (w / 2 - stairWidth / 2 - 1);
          const stairOffsetZ = (Math.random() > 0.5 ? 1 : -1) * (d / 2 - stepCount * stepDepth / 2 - 1);
          stairData = {
            offsetX: stairOffsetX,
            offsetZ: stairOffsetZ,
            width: stairWidth,
            stepHeight: stepHeight,
            stepDepth: stepDepth,
            stepCount: stepCount,
            direction: Math.random() > 0.5 ? 0 : Math.PI / 2
          };
        }
        
        // 建筑颜色根据类型
        let color;
        if (bt.type === 'RESIDENTIAL') color = 0x8899AA + Math.floor(Math.random() * 0x222222);
        else if (bt.type === 'COMMERCIAL') color = 0x667788 + Math.floor(Math.random() * 0x222222);
        else if (bt.type === 'INDUSTRIAL') color = 0x778877 + Math.floor(Math.random() * 0x111111);
        else color = 0x888877 + Math.floor(Math.random() * 0x111111);
        
        buildings.push({
          x: px, z: pz, w, h, d,
          floors, floorHeight: FLOOR_H,
          color, type: bt.type,
          doorX, doorZ, doorDir,
          windowsPerFloor,
          hasStair, stairData
        });
        
        placed.push({ x: px, z: pz, w, d });
        placed_ok = true;
        break;
      }
    }
  }
  
  // 随机生成道具（车辆）
  if (Math.random() > 0.5) {
    props.push({
      type: 'car',
      x: chunkWorldX + (Math.random() - 0.5) * CONFIG.CHUNK_SIZE * 0.8,
      z: chunkWorldZ + (Math.random() - 0.5) * CONFIG.CHUNK_SIZE * 0.8,
      rotation: Math.random() * Math.PI * 2
    });
  }
  
  return {cx, cz, buildings, props};
}

// 创建建筑Canvas纹理（窗户绘制在纹理上）
function createBuildingTexture(b) {
  const canvas = document.createElement('canvas');
  const texW = 512;
  const texH = 512;
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext('2d');
  
  // 墙面底色
  const r = ((b.color >> 16) & 0xFF);
  const g = ((b.color >> 8) & 0xFF);
  const bl = (b.color & 0xFF);
  ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + bl + ')';
  ctx.fillRect(0, 0, texW, texH);
  
  // 绘制窗户网格
  const floors = b.floors;
  const winCols = b.windowsPerFloor.xWalls;
  const floorPixelH = texH / floors;
  const winPixelW = texW / (winCols * 2 + 1);
  const winPixelH = floorPixelH * 0.5;
  
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < winCols; c++) {
      const wx = winPixelW * (2 * c + 1);
      const wy = floorPixelH * f + floorPixelH * 0.25;
      
      // 窗框
      ctx.fillStyle = '#334455';
      ctx.fillRect(wx - 1, wy - 1, winPixelW + 2, winPixelH + 2);
      
      // 窗户玻璃（随机亮暗模拟有人/没人）
      const lit = Math.random() > 0.4;
      if (lit) {
        ctx.fillStyle = 'rgba(255,240,180,0.8)';
      } else {
        ctx.fillStyle = 'rgba(100,120,140,0.6)';
      }
      ctx.fillRect(wx, wy, winPixelW, winPixelH);
    }
  }
  
  // 入口门（底部中间）
  const doorW = texW * 0.12;
  const doorH = floorPixelH * 0.8;
  ctx.fillStyle = '#553322';
  ctx.fillRect(texW / 2 - doorW / 2, texH - doorH, doorW, doorH);
  // 门把手
  ctx.fillStyle = '#CCAA66';
  ctx.fillRect(texW / 2 + doorW * 0.2, texH - doorH * 0.5, 3, 3);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 加载单个区块 - 创建可进入的建筑模型
function loadChunk(cx, cz) {
  const key = getChunkKey(cx, cz);
  if (chunkSystem.chunks.has(key)) return;
  
  const chunkData = chunkSystem.allChunkData.find(c => c.cx === cx && c.cz === cz);
  if (!chunkData) return;
  
  const meshes = [];
  const chunkColliders = [];
  const chunkStairs = []; // 记录本区块添加的楼梯索引
  
  // 创建建筑mesh
  chunkData.buildings.forEach(b => {
    const group = new THREE.Group();
    
    // 创建Canvas纹理
    const texture = createBuildingTexture(b);
    
    // 建筑主体 - 使用纹理
    const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
    const bodyMat = new THREE.MeshLambertMaterial({ map: texture });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);
    
    // 建筑位置：底部在地面上
    group.position.set(b.x, b.h / 2, b.z);
    
    // 屋顶细节
    // 空调机组
    if (b.floors >= 4) {
      const numAC = 1 + Math.floor(Math.random() * 3);
      for (let ai = 0; ai < numAC; ai++) {
        const acGeo = new THREE.BoxGeometry(1.5, 0.8, 1.2);
        const acMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.set(
          (Math.random() - 0.5) * (b.w - 4),
          b.h / 2 + 0.4,
          (Math.random() - 0.5) * (b.d - 4)
        );
        ac.castShadow = true;
        group.add(ac);
      }
    }
    
    // 水箱（高建筑）
    if (b.floors >= 8) {
      const tankGeo = new THREE.CylinderGeometry(1, 1, 2, 8);
      const tankMat = new THREE.MeshLambertMaterial({ color: 0x667788 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(0, b.h / 2 + 1, 0);
      tank.castShadow = true;
      group.add(tank);
    }
    
    scene.add(group);
    meshes.push(group);
    
    // 建筑碰撞盒 - 四面墙壁，入口处留2米通道
    const WALL_THICK = 0.3;
    const DOOR_WIDTH = 2;
    // 墙壁位置（建筑边缘 + 墙厚一半）
    const wallX = b.w / 2 + WALL_THICK / 2;
    const wallZ = b.d / 2 + WALL_THICK / 2;
    // 墙壁长度（刚好到角落，不重叠）
    const wallLenX = b.w / 2;
    const wallLenZ = b.d / 2;
    
    // 判断入口在哪面墙，对应位置不添加碰撞盒
    // doorDir: 0=+x面, PI=-x面, PI/2=+z面, -PI/2=-z面
    // +x面墙壁（z方向分段，入口处留空）
    if (b.doorDir !== 0) {
      // +x面完整碰撞
      chunkColliders.push({ x: b.x + wallX, z: b.z, hw: WALL_THICK, hd: wallLenZ, topY: b.h, type: 'building_wall', solid: true });
    } else {
      // +x面入口，分两段
      const doorHalfW = DOOR_WIDTH / 2;
      const segLen = (wallLenZ - doorHalfW) / 2;
      if (segLen > 0.1) {
        chunkColliders.push({ x: b.x + wallX, z: b.z - doorHalfW - segLen, hw: WALL_THICK, hd: segLen, topY: b.h, type: 'building_wall', solid: true });
        chunkColliders.push({ x: b.x + wallX, z: b.z + doorHalfW + segLen, hw: WALL_THICK, hd: segLen, topY: b.h, type: 'building_wall', solid: true });
      }
    }
    
    // -x面
    if (b.doorDir !== Math.PI) {
      chunkColliders.push({ x: b.x - wallX, z: b.z, hw: WALL_THICK, hd: wallLenZ, topY: b.h, type: 'building_wall', solid: true });
    } else {
      const doorHalfW = DOOR_WIDTH / 2;
      const segLen = (wallLenZ - doorHalfW) / 2;
      if (segLen > 0.1) {
        chunkColliders.push({ x: b.x - wallX, z: b.z - doorHalfW - segLen, hw: WALL_THICK, hd: segLen, topY: b.h, type: 'building_wall', solid: true });
        chunkColliders.push({ x: b.x - wallX, z: b.z + doorHalfW + segLen, hw: WALL_THICK, hd: segLen, topY: b.h, type: 'building_wall', solid: true });
      }
    }
    
    // +z面
    if (b.doorDir !== Math.PI / 2) {
      chunkColliders.push({ x: b.x, z: b.z + wallZ, hw: wallLenX, hd: WALL_THICK, topY: b.h, type: 'building_wall', solid: true });
    } else {
      const doorHalfW = DOOR_WIDTH / 2;
      const segLen = (wallLenX - doorHalfW) / 2;
      if (segLen > 0.1) {
        chunkColliders.push({ x: b.x - doorHalfW - segLen, z: b.z + wallZ, hw: segLen, hd: WALL_THICK, topY: b.h, type: 'building_wall', solid: true });
        chunkColliders.push({ x: b.x + doorHalfW + segLen, z: b.z + wallZ, hw: segLen, hd: WALL_THICK, topY: b.h, type: 'building_wall', solid: true });
      }
    }
    
    // -z面
    if (b.doorDir !== -Math.PI / 2) {
      chunkColliders.push({ x: b.x, z: b.z - wallZ, hw: wallLenX, hd: WALL_THICK, topY: b.h, type: 'building_wall', solid: true });
    } else {
      const doorHalfW = DOOR_WIDTH / 2;
      const segLen = (wallLenX - doorHalfW) / 2;
      if (segLen > 0.1) {
        chunkColliders.push({ x: b.x - doorHalfW - segLen, z: b.z - wallZ, hw: segLen, hd: WALL_THICK, topY: b.h, type: 'building_wall', solid: true });
        chunkColliders.push({ x: b.x + doorHalfW + segLen, z: b.z - wallZ, hw: segLen, hd: WALL_THICK, topY: b.h, type: 'building_wall', solid: true });
      }
    }
    
    // 添加屋顶碰撞盒（让玩家可以站在屋顶上）
    // 屋顶是一个平面碰撞器，高度为建筑高度，solid: false 表示可以从下方跳上去
    chunkColliders.push({ 
      x: b.x, 
      z: b.z, 
      hw: wallLenX, 
      hd: wallLenZ, 
      topY: b.h, 
      type: 'roof', 
      solid: false  // 非solid，可以从下方跳上去
    });
    
    // 创建楼梯结构
    if (b.hasStair && b.stairData) {
      const sd = b.stairData;
      const stairGroup = new THREE.Group();
      
      // 楼梯台阶
      const stepGeo = new THREE.BoxGeometry(sd.width, sd.stepHeight, sd.stepDepth);
      const stepMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      
      for (let s = 0; s < sd.stepCount; s++) {
        const step = new THREE.Mesh(stepGeo, stepMat);
        step.position.set(0, s * sd.stepHeight + sd.stepHeight / 2, -s * sd.stepDepth + sd.stepCount * sd.stepDepth / 2);
        step.castShadow = true;
        step.receiveShadow = true;
        stairGroup.add(step);
      }
      
      // 楼梯userData（供registerStairColliders使用）
      stairGroup.userData = {
        stepCount: sd.stepCount,
        stepHeight: sd.stepHeight,
        stepDepth: sd.stepDepth,
        stepWidth: sd.width
      };
      
      // 楼梯世界位置
      const stairWorldX = b.x + sd.offsetX;
      const stairWorldZ = b.z + sd.offsetZ;
      stairGroup.position.set(stairWorldX, 0, stairWorldZ);
      stairGroup.rotation.y = sd.direction;
      scene.add(stairGroup);
      meshes.push(stairGroup);
      
      // 注册楼梯碰撞
      const stairIdxBefore = stairs.length;
      registerStairColliders(stairGroup, stairWorldX, stairWorldZ, sd.direction);
      
      // 记录新添加的楼梯索引范围
      for (let si = stairIdxBefore; si < stairs.length; si++) {
        chunkStairs.push(si);
      }
      // 同时记录楼梯侧面墙壁碰撞盒的数量（registerStairColliders会添加2个stair_wall）
      chunkColliders.push({ x: stairWorldX, z: stairWorldZ, isStairWall: true });
    }
    
    // 设置建筑userData
    group.userData = {
      type: 'building',
      width: b.w,
      depth: b.d,
      height: b.h,
      hasStair: b.hasStair,
      floors: b.floors
    };
  });
  
  // 创建道具mesh
  chunkData.props.forEach(p => {
    if (p.type === 'car') {
      const car = createSimpleCar();
      car.position.set(p.x, 0, p.z);
      car.rotation.y = p.rotation;
      scene.add(car);
      meshes.push(car);
      
      // 为汽车添加碰撞盒（非solid，可跳上去）
      // 计算旋转后的AABB包围盒
      const cos = Math.cos(p.rotation);
      const sin = Math.sin(p.rotation);
      const hw = 1.3; // 车身半宽
      const hd = 2.5; // 车身半长
      chunkColliders.push({
        x: p.x,
        z: p.z,
        hw: Math.abs(cos * hw) + Math.abs(sin * hd),  // 旋转后在x方向的投影
        hd: Math.abs(sin * hw) + Math.abs(cos * hd),  // 旋转后在z方向的投影
        topY: 1.7, // 车顶高度（可站上去）
        type: 'car',
        solid: false, // 非solid，可以跳上去
        rotation: p.rotation
      });
    }
  });
  
  chunkSystem.chunks.set(key, {
    cx, cz,
    meshes,
    colliders: chunkColliders,
    stairIndices: chunkStairs,
    loaded: true
  });
  
  // 添加碰撞盒到全局
  chunkColliders.forEach(c => {
    if (!c.isStairWall) {
      addCollider(c.x, c.z, c.hw, c.hd, c.topY, c.type, c.solid);
    }
  });
}

// 卸载单个区块 - 正确清理资源
function unloadChunk(cx, cz) {
  const key = getChunkKey(cx, cz);
  const chunk = chunkSystem.chunks.get(key);
  if (!chunk) return;
  
  // 移除所有mesh并dispose
  chunk.meshes.forEach(mesh => {
    scene.remove(mesh);
    mesh.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (child.material.map) child.material.map.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        } else {
          child.material.dispose();
        }
      }
    });
  });
  
  // 移除碰撞盒
  chunk.colliders.forEach(c => {
    if (c.isStairWall) return; // 楼梯墙壁通过stairs数组清理
    const idx = colliders.findIndex(col =>
      Math.abs(col.x - c.x) < 0.01 && Math.abs(col.z - c.z) < 0.01
    );
    if (idx !== -1) colliders.splice(idx, 1);
  });
  
  // 清理楼梯碰撞盒（从stairs数组移除，并移除对应的stair_wall碰撞盒）
  if (chunk.stairIndices && chunk.stairIndices.length > 0) {
    // 收集需要移除的楼梯worldX/worldZ用于查找stair_wall碰撞盒
    const stairPositions = [];
    chunk.stairIndices.sort((a, b) => b - a); // 从大到小删除避免索引偏移
    chunk.stairIndices.forEach(si => {
      if (si < stairs.length) {
        stairPositions.push({ x: stairs[si].worldX, z: stairs[si].worldZ });
        stairs.splice(si, 1);
      }
    });
    // 移除对应的stair_wall碰撞盒
    stairPositions.forEach(sp => {
      for (let i = colliders.length - 1; i >= 0; i--) {
        if (colliders[i].type === 'stair_wall' &&
            Math.abs(colliders[i].x - sp.x) < 0.5 &&
            Math.abs(colliders[i].z - sp.z) < 0.5) {
          colliders.splice(i, 1);
        }
      }
    });
  }
  
  chunkSystem.chunks.delete(key);
}

// 更新区块（加载/卸载）- 加载时同时重建空间分区
function updateChunks() {
  const playerChunk = getPlayerChunk();
  const viewDist = CONFIG.CHUNK_VIEW_DISTANCE;
  const unloadDist = CONFIG.CHUNK_UNLOAD_DISTANCE;
  
  let anyLoaded = false;
  
  // 加载玩家周围的区块
  for (let dx = -viewDist; dx <= viewDist; dx++) {
    for (let dz = -viewDist; dz <= viewDist; dz++) {
      const cx = playerChunk.x + dx;
      const cz = playerChunk.z + dz;
      const k = getChunkKey(cx, cz);
      if (!chunkSystem.chunks.has(k)) {
        loadChunk(cx, cz);
        anyLoaded = true;
      }
    }
  }
  
  // 卸载远处的区块
  const keysToRemove = [];
  for (const [key, chunk] of chunkSystem.chunks) {
    const dx = chunk.cx - playerChunk.x;
    const dz = chunk.cz - playerChunk.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > unloadDist) {
      unloadChunk(chunk.cx, chunk.cz);
    }
  }
  
  // 有新区块加载或卸载时重建空间分区
  if (anyLoaded) {
    rebuildSpatialGrid();
  }
  
  chunkSystem.lastPlayerChunk = playerChunk;
}

// 详细的车辆模型
function createSimpleCar() {
  const group = new THREE.Group();
  const bodyColor = [0x882222, 0x228822, 0x222288, 0x666666, 0x222222, 0xCC8822][Math.floor(Math.random() * 6)];
  
  // 车身底盘
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.5, 4.5),
    new THREE.MeshLambertMaterial({ color: bodyColor })
  );
  chassis.position.y = 0.45;
  chassis.castShadow = true;
  group.add(chassis);
  
  // 车顶/驾驶室
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.8, 2.2),
    new THREE.MeshLambertMaterial({ color: bodyColor })
  );
  cabin.position.set(0, 1.1, -0.3);
  cabin.castShadow = true;
  group.add(cabin);
  
  // 前挡风玻璃
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.7, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x88BBDD, transparent: true, opacity: 0.6 })
  );
  windshield.position.set(0, 1.05, 0.8);
  windshield.rotation.x = -0.3;
  group.add(windshield);
  
  // 后挡风玻璃
  const rearGlass = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.6, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x88BBDD, transparent: true, opacity: 0.6 })
  );
  rearGlass.position.set(0, 1.05, -1.4);
  rearGlass.rotation.x = 0.3;
  group.add(rearGlass);
  
  // 车轮
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const wheelPositions = [
    [-1.1, 0.35, 1.3], [1.1, 0.35, 1.3],
    [-1.1, 0.35, -1.3], [1.1, 0.35, -1.3]
  ];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    group.add(wheel);
  });
  
  // 车灯（前）
  const headlightGeo = new THREE.BoxGeometry(0.3, 0.2, 0.1);
  const headlightMat = new THREE.MeshLambertMaterial({ color: 0xFFFFAA, emissive: 0x444400 });
  const hlLeft = new THREE.Mesh(headlightGeo, headlightMat);
  hlLeft.position.set(-0.7, 0.55, 2.25);
  group.add(hlLeft);
  const hlRight = new THREE.Mesh(headlightGeo, headlightMat);
  hlRight.position.set(0.7, 0.55, 2.25);
  group.add(hlRight);
  
  // 尾灯
  const taillightMat = new THREE.MeshLambertMaterial({ color: 0xFF2222, emissive: 0x440000 });
  const tlLeft = new THREE.Mesh(headlightGeo, taillightMat);
  tlLeft.position.set(-0.7, 0.55, -2.25);
  group.add(tlLeft);
  const tlRight = new THREE.Mesh(headlightGeo, taillightMat);
  tlRight.position.set(0.7, 0.55, -2.25);
  group.add(tlRight);
  
  group.userData = {
    type: 'car',
    width: 2.2,
    depth: 4.5,
    height: 1.5,
    canStand: true,
    standHeight: 1.7
  };
  return group;
}

// ============================================================
// 地图生成（使用分区分片系统）
// ============================================================
function generateMap() {
  // 同时调用新MapManager（双轨并行）
  if (window.MapManager && MapManager.generateMap) {
    try {
      MapManager.generateMap();
    } catch (e) {
      // MapManager可能不存在或方法未实现，静默处理
    }
  }

  // 清除旧地图
  buildings.forEach(b => scene.remove(b));
  buildings = [];
  clearColliders();
  
  // 清除区块系统
  if (chunkSystem.chunks) {
    for (const [key, chunk] of chunkSystem.chunks) {
      chunk.meshes.forEach(mesh => scene.remove(mesh));
    }
    chunkSystem.chunks.clear();
  }

  // 地面 - 使用大平面（始终存在）
  const groundGeo = new THREE.PlaneGeometry(CONFIG.MAP_SIZE * 2, CONFIG.MAP_SIZE * 2, 10, 10);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x3a4a3a });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'cityGround';
  scene.add(ground);
  buildings.push(ground);

  // 生成道路网格（简化版，始终存在）
  generateSimpleRoadGrid();
  
  // 初始化分区分片系统
  initChunkSystem();
  
  // 生成传送门（城市四边各1个）
  generateCityPortals();
}

// 简化的道路网格（与区块系统配合使用）
function generateSimpleRoadGrid() {
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const chunkSize = CONFIG.CHUNK_SIZE;
  const range = Math.ceil(CONFIG.MAP_SIZE / chunkSize);
  
  // 只在区块边界生成道路
  for (let i = -range; i <= range; i++) {
    // 横向道路
    const roadH = new THREE.Mesh(
      new THREE.PlaneGeometry(CONFIG.MAP_SIZE * 2, 8),
      roadMat
    );
    roadH.rotation.x = -Math.PI / 2;
    roadH.position.set(0, 0.02, i * chunkSize);
    roadH.receiveShadow = true;
    roadH.name = 'cityRoad';
    scene.add(roadH);
    buildings.push(roadH);
    
    // 纵向道路
    const roadV = new THREE.Mesh(
      new THREE.PlaneGeometry(8, CONFIG.MAP_SIZE * 2),
      roadMat
    );
    roadV.rotation.x = -Math.PI / 2;
    roadV.position.set(i * chunkSize, 0.02, 0);
    roadV.receiveShadow = true;
    roadV.name = 'cityRoad';
    scene.add(roadV);
    buildings.push(roadV);
  }
}

// 城市传送门系统 - 委托给 CityMap
let cityPortals = [];
let portalsActivated = false;

function generateCityPortals() {
  if (window.CityMap) {
    // 确保 CityMap 已初始化
    if (!CityMap.scene && scene) {
      CityMap.init(scene, camera);
    }
    if (CityMap.generatePortals) {
      CityMap.generatePortals();
      cityPortals = CityMap.cityPortals || [];
      portalsActivated = CityMap.portalsActivated || false;
      return;
    }
  }
  console.warn('[game.js] CityMap not available for generateCityPortals');
}

function activateCityPortals() {
  if (window.CityMap && CityMap.activatePortals) {
    CityMap.activatePortals();
    portalsActivated = CityMap.portalsActivated || true;
    // 解锁雪山节点
    if (window.WorldMap) {
      WorldMap.unlockNode('snow');
    }
    return;
  }
  console.warn('[game.js] CityMap not available for activateCityPortals');
}

function updateCityPortals(dt) {
  if (window.CityMap && CityMap.updatePortals) {
    CityMap.updatePortals(dt);
    return;
  }
}

// 更新交互提示UI
function updateInteractionPrompt() {
  const promptEl = document.getElementById('interaction-prompt');
  const textEl = document.getElementById('prompt-text');
  if (!promptEl || !textEl) return;
  
  let showPrompt = false;
  let promptText = '';
  
  // 城市传送门提示
  if (portalsActivated && cityPortals.length > 0 && (window.currentMap === 'city' || !window.currentMap)) {
    cityPortals.forEach(portal => {
      if (portal && portal.userData && portal.userData.activated) {
        const dist = camera.position.distanceTo(portal.position);
        if (dist < 8) {
          showPrompt = true;
          promptText = '按 E 打开世界地图';
        }
      }
    });
  }
  
  // 雪山地图交互提示
  if (window.SnowMap && SnowMap.active && window.currentMap === 'snow') {
    // 收音机
    if (SnowMap.radioMesh && !SnowMap.radioInteracted) {
      const dist = camera.position.distanceTo(SnowMap.radioMesh.position);
      if (dist < 5) {
        showPrompt = true;
        promptText = '按 E 查看收音机';
      }
    }
    // 电源
    if (SnowMap.powerNodes) {
      SnowMap.powerNodes.forEach(node => {
      if (!node || !node.mesh) return;
      if (!node.activated && node.zombiesCleared) {
        const dist = camera.position.distanceTo(node.mesh.position);
        if (dist < 5) {
          showPrompt = true;
          promptText = '按 E 开启电源';
        }
      }
    });
    }
    // 信号塔
    if (SnowMap.phase === 'returnToTower') {
      const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
      if (dist < 8) {
        showPrompt = true;
        promptText = '按 E 启动信号塔';
      }
    }
    // 返回传送门
    if (SnowMap.portalMesh) {
      const dist = camera.position.distanceTo(SnowMap.portalMesh.position);
      if (dist < 8) {
        showPrompt = true;
        promptText = '按 E 返回城市';
      }
    }
  }
  
  // 沙漠NPC交互提示
  if (window.DesertMap && DesertMap.active && !DesertMap.npcDialogOpen) {
    const nearNPC = DesertMap.getNearbyNPC(camera.position, 4);
    if (nearNPC) {
      showPrompt = true;
      promptText = `[E] 与 ${nearNPC.name} 对话`;
    }
  }
  
  if (showPrompt) {
    promptEl.style.display = 'block';
    textEl.textContent = promptText;
  } else {
    promptEl.style.display = 'none';
  }
}

// 旧版完整道路网格（保留但不再使用）
function generateRoadGrid() {
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  
  const gridSize = window.CITY_CONFIG.BLOCK_SIZE;
  const roadWidth = window.CITY_CONFIG.ROAD_WIDTH;
  const range = window.CITY_CONFIG.BLOCKS_PER_SIDE;
  
  // 主干道（横向和纵向）
  for (let i = -range; i <= range; i++) {
    // 横向道路
    const roadH = new THREE.Mesh(
      new THREE.PlaneGeometry(CONFIG.MAP_SIZE * 2, roadWidth),
      roadMat
    );
    roadH.rotation.x = -Math.PI / 2;
    roadH.position.set(0, 0.02, i * gridSize);
    roadH.receiveShadow = true;
    scene.add(roadH);
    buildings.push(roadH);
    
    // 纵向道路
    const roadV = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, CONFIG.MAP_SIZE * 2),
      roadMat
    );
    roadV.rotation.x = -Math.PI / 2;
    roadV.position.set(i * gridSize, 0.02, 0);
    roadV.receiveShadow = true;
    scene.add(roadV);
    buildings.push(roadV);
    
    // 人行道
    for (let side of [-1, 1]) {
      const sidewalkH = new THREE.Mesh(
        new THREE.PlaneGeometry(CONFIG.MAP_SIZE * 2, 2),
        sidewalkMat
      );
      sidewalkH.rotation.x = -Math.PI / 2;
      sidewalkH.position.set(0, 0.03, i * gridSize + side * (roadWidth / 2 + 1));
      scene.add(sidewalkH);
      buildings.push(sidewalkH);
      
      const sidewalkV = new THREE.Mesh(
        new THREE.PlaneGeometry(2, CONFIG.MAP_SIZE * 2),
        sidewalkMat
      );
      sidewalkV.rotation.x = -Math.PI / 2;
      sidewalkV.position.set(i * gridSize + side * (roadWidth / 2 + 1), 0.03, 0);
      scene.add(sidewalkV);
      buildings.push(sidewalkV);
    }
  }
  
  // 道路标线
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  for (let i = -range; i <= range; i++) {
    // 横向虚线
    for (let x = -CONFIG.MAP_SIZE; x < CONFIG.MAP_SIZE; x += 8) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 0.3),
        lineMat
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.03, i * gridSize);
      scene.add(line);
      buildings.push(line);
    }
    
    // 纵向虚线
    for (let z = -CONFIG.MAP_SIZE; z < CONFIG.MAP_SIZE; z += 8) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 4),
        lineMat
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(i * gridSize, 0.03, z);
      scene.add(line);
      buildings.push(line);
    }
  }
}

function generateCityBlocks() {
  const gridSize = window.CITY_CONFIG.BLOCK_SIZE;
  const roadWidth = window.CITY_CONFIG.ROAD_WIDTH;
  const blockInnerSize = gridSize - roadWidth - 4; // 减去道路和人行道
  const range = window.CITY_CONFIG.BLOCKS_PER_SIDE;
  
  for (let bx = -range; bx < range; bx++) {
    for (let bz = -range; bz < range; bz++) {
      // 跳过中心区域（玩家出生点）
      if (bx === 0 && bz === 0) continue;
      
      const blockCenterX = (bx + 0.5) * gridSize;
      const blockCenterZ = (bz + 0.5) * gridSize;
      
      // 决定街区类型
      const blockType = determineBlockType(bx, bz);
      
      // 在街区内生成建筑
      generateBuildingsInBlock(blockCenterX, blockCenterZ, blockInnerSize, blockType);
    }
  }
}

function determineBlockType(bx, bz) {
  // 根据位置决定街区类型
  const distFromCenter = Math.sqrt(bx * bx + bz * bz);
  
  if (distFromCenter < 2) return 'COMMERCIAL';
  if (distFromCenter > 4) return 'INDUSTRIAL';
  if (Math.random() > 0.7) return 'SKYSCRAPER';
  if (Math.random() > 0.5) return 'RESIDENTIAL';
  return 'COMMERCIAL';
}

function generateBuildingsInBlock(cx, cz, size, type) {
  const config = BUILDING_TYPES[type];
  const numBuildings = type === 'SKYSCRAPER' ? 1 : (type === 'INDUSTRIAL' ? 2 : 3);
  
  for (let i = 0; i < numBuildings; i++) {
    // 建筑尺寸
    const w = window.CITY_CONFIG.BUILDING_MIN_SIZE + Math.random() * (window.CITY_CONFIG.BUILDING_MAX_SIZE - window.CITY_CONFIG.BUILDING_MIN_SIZE) * 0.5;
    const d = window.CITY_CONFIG.BUILDING_MIN_SIZE + Math.random() * (window.CITY_CONFIG.BUILDING_MAX_SIZE - window.CITY_CONFIG.BUILDING_MIN_SIZE) * 0.5;
    const h = config.heightRange[0] + Math.random() * (config.heightRange[1] - config.heightRange[0]);
    
    // 建筑位置（在街区内随机分布）
    const offsetX = (Math.random() - 0.5) * (size - w - 4);
    const offsetZ = (Math.random() - 0.5) * (size - d - 4);
    const px = cx + offsetX;
    const pz = cz + offsetZ;
    
    // 创建建筑主体
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    const building = createRealisticBuilding(w, h, d, color, config, type);
    building.position.set(px, h / 2, pz);
    scene.add(building);
    buildings.push(building);
    
    // 注册碰撞盒
    addCollider(px, pz, w / 2 + 0.15, d / 2 + 0.15, h, 'building_wall', true);
    
    // 添加消防梯（高层建筑）
    if (h > 10 && Math.random() > 0.3) {
      addFireEscape(px, pz, w, h, d);
    }
    
    // 添加入口雨棚
    addEntranceCanopy(px, pz, w, d);
  }
}

function createRealisticBuilding(w, h, d, color, config, type) {
  const group = new THREE.Group();
  
  // 主建筑体
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color: color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  
  // 屋顶设备
  if (type !== 'RESIDENTIAL') {
    const roofEquipment = createRoofEquipment(w, d);
    roofEquipment.position.y = h / 2 + 1;
    group.add(roofEquipment);
  }
  
  // 窗户系统 - 使用纹理贴图代替独立mesh以提升性能
  const windowCanvas = document.createElement('canvas');
  windowCanvas.width = 128;
  windowCanvas.height = 256;
  const wctx = windowCanvas.getContext('2d');
  
  // 建筑墙面底色 — 安全解析颜色
  let colorHex;
  if (typeof color === 'number') {
    colorHex = '#' + color.toString(16).padStart(6, '0');
  } else if (typeof color === 'string') {
    colorHex = color.startsWith('#') ? color : '#' + color;
  } else {
    colorHex = '#8B7355';
  }
  wctx.fillStyle = colorHex;
  wctx.fillRect(0, 0, 128, 256);
  
  // 绘制窗户网格
  const floors = Math.max(1, Math.floor(h / 3));
  const cols = Math.max(1, Math.floor(w / 3));
  const winW = Math.floor(100 / cols);
  const winH = Math.floor(200 / floors);
  const windowColorStr = Math.random() > 0.3 ? '#87CEEB' : '#2F4F4F';
  
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > config.windowDensity) continue;
      const wx = Math.floor((c + 0.5) * (128 / cols) - winW / 2);
      const wy = Math.floor(20 + f * (220 / floors));
      wctx.fillStyle = windowColorStr;
      wctx.fillRect(wx, wy, winW - 4, winH - 4);
    }
  }
  
  // 用纹理覆盖建筑体（使用 MeshStandardMaterial 替代 MeshLambertMaterial，避免低光照渲染异常）
  const windowTexture = new THREE.CanvasTexture(windowCanvas);
  windowTexture.wrapS = THREE.RepeatWrapping;
  windowTexture.wrapT = THREE.RepeatWrapping;
  const texturedMat = new THREE.MeshStandardMaterial({
    map: windowTexture,
    roughness: 0.9,
    metalness: 0.05,
  });
  mesh.material = texturedMat;

  // 入口大门
  const doorWidth = Math.min(3, w * 0.3);
  const doorHeight = 2.5;
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.8, metalness: 0.05 });
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(doorWidth, doorHeight),
    doorMat
  );
  door.position.set(0, -h / 2 + doorHeight / 2, d / 2 + 0.02);
  group.add(door);

  return group;
}

function createRoofEquipment(w, d) {
  const group = new THREE.Group();
  const equipMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7, metalness: 0.3 });

  // 空调机组
  const ac1 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.5, 2),
    equipMat
  );
  ac1.position.set(-w * 0.25, 0.75, -d * 0.25);
  group.add(ac1);

  const ac2 = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1, 1.5),
    equipMat
  );
  ac2.position.set(w * 0.25, 0.5, d * 0.25);
  group.add(ac2);

  // 通风管道
  const vent = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 2, 8),
    new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.4 })
  );
  vent.position.set(0, 1, 0);
  group.add(vent);

  return group;
}

function addBalcony(group, x, y, z, rot) {
  const balconyGroup = new THREE.Group();
  
  // 地板
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.1, 1),
    new THREE.MeshLambertMaterial({ color: 0x888888 })
  );
  floor.position.set(0, 0, 0.5);
  balconyGroup.add(floor);
  
  // 栏杆
  const railMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  const railFront = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.8, 0.05),
    railMat
  );
  railFront.position.set(0, 0.4, 1);
  balconyGroup.add(railFront);
  
  balconyGroup.position.set(x, y, z);
  balconyGroup.rotation.y = rot;
  group.add(balconyGroup);
}

function addFireEscape(px, pz, w, h, d) {
  // 简化的消防梯表示
  const side = Math.floor(Math.random() * 4);
  let sx = px, sz = pz;
  
  switch(side) {
    case 0: sz = pz + d / 2 + 1; break;
    case 1: sz = pz - d / 2 - 1; break;
    case 2: sx = px + w / 2 + 1; break;
    case 3: sx = px - w / 2 - 1; break;
  }
  
  const ladderMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  const ladder = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, h, 0.3),
    ladderMat
  );
  ladder.position.set(sx, h / 2, sz);
  scene.add(ladder);
  buildings.push(ladder);
}

function addEntranceCanopy(px, pz, w, d) {
  const canopyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(Math.min(4, w * 0.5), 0.1, 1.5),
    canopyMat
  );
  canopy.position.set(px, 2.5, pz + d / 2 + 0.5);
  scene.add(canopy);
  buildings.push(canopy);
}

function generateCityDetails() {
  // 生成废弃车辆
  generateAbandonedCars();
  
  // 生成路灯
  generateStreetLights();
  
  // 生成路障和掩体
  generateBarriers();
  
  // 生成树木
  generateCityTrees();
  
  // 生成补给站
  generateAmmoStations();
}

function generateAbandonedCars() {
  const carColors = [0x882222, 0x228822, 0x222288, 0x888822, 0x666666, 0x333333];
  
  for (let i = 0; i < 20; i++) {
    const car = createDetailedCar(carColors[Math.floor(Math.random() * carColors.length)]);
    
    // 随机放置在道路上或路边
    const side = Math.random() > 0.5 ? 1 : -1;
    const roadIndex = Math.floor(Math.random() * (window.CITY_CONFIG.BLOCKS_PER_SIDE * 2 + 1)) - window.CITY_CONFIG.BLOCKS_PER_SIDE;
    
    const cx = roadIndex * window.CITY_CONFIG.BLOCK_SIZE + (Math.random() - 0.5) * window.CITY_CONFIG.ROAD_WIDTH * 0.8;
    const cz = (Math.random() - 0.5) * CONFIG.MAP_SIZE * 1.4;
    
    car.position.set(cx, 0, cz);
    car.rotation.y = Math.random() * Math.PI * 2;
    
    // 随机倾斜（废弃感）
    if (Math.random() > 0.5) {
      car.rotation.z = (Math.random() - 0.5) * 0.2;
    }
    
    scene.add(car);
    buildings.push(car);
    addCollider(cx, cz, 1.3, 2.3, 1.7, 'car', false);
  }
}

function createDetailedCar(color) {
  const group = new THREE.Group();
  
  // 车身
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.8, 4.5),
    new THREE.MeshLambertMaterial({ color: color })
  );
  body.position.y = 0.7;
  body.castShadow = true;
  group.add(body);
  
  // 车顶
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.7, 2.5),
    new THREE.MeshLambertMaterial({ color: color })
  );
  roof.position.set(0, 1.45, -0.3);
  roof.castShadow = true;
  group.add(roof);
  
  // 车轮
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const wheelPositions = [
    [-1.1, 0.3, 1.5], [1.1, 0.3, 1.5],
    [-1.1, 0.3, -1.5], [1.1, 0.3, -1.5]
  ];
  
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.3, 8),
      wheelMat
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...pos);
    group.add(wheel);
  });
  
  group.userData = { type: 'building', width: 2.2, depth: 4.5, canStand: true, standHeight: 1.7 };
  return group;
}

function generateStreetLights() {
  for (let i = -window.CITY_CONFIG.BLOCKS_PER_SIDE; i <= window.CITY_CONFIG.BLOCKS_PER_SIDE; i++) {
    for (let j = -window.CITY_CONFIG.BLOCKS_PER_SIDE; j <= window.CITY_CONFIG.BLOCKS_PER_SIDE; j++) {
      // 在每个街区角落放置路灯
      const x = i * window.CITY_CONFIG.BLOCK_SIZE + window.CITY_CONFIG.ROAD_WIDTH / 2 + 2;
      const z = j * window.CITY_CONFIG.BLOCK_SIZE + window.CITY_CONFIG.ROAD_WIDTH / 2 + 2;
      
      // 四个角落
      const offsets = [
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
      
      offsets.forEach(offset => {
        if (Math.random() > 0.3) {
          const lamp = createDetailedLampPost();
          lamp.position.set(x * offset[0], 0, z * offset[1]);
          scene.add(lamp);
          buildings.push(lamp);
        }
      });
    }
  }
}

function createDetailedLampPost() {
  const group = new THREE.Group();
  
  // 灯柱
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 6, 6),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  );
  pole.position.y = 3;
  group.add(pole);
  
  // 灯臂
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 1.5),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  );
  arm.position.set(0, 5.8, 0.5);
  group.add(arm);
  
  // 灯罩
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 0.4, 8, 1, true),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  shade.position.set(0, 5.6, 1);
  group.add(shade);
  
  // 灯泡（发光材质，不使用PointLight以提升性能）
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc66 })
  );
  bulb.position.set(0, 5.4, 1);
  group.add(bulb);
  
  return group;
}

function generateBarriers() {
  const barrierMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
  
  // 在道路交叉口放置路障
  for (let i = -window.CITY_CONFIG.BLOCKS_PER_SIDE; i <= window.CITY_CONFIG.BLOCKS_PER_SIDE; i++) {
    for (let j = -window.CITY_CONFIG.BLOCKS_PER_SIDE; j <= window.CITY_CONFIG.BLOCKS_PER_SIDE; j++) {
      if (i === 0 && j === 0) continue; // 跳过中心
      
      if (Math.random() > 0.6) {
        const ix = i * window.CITY_CONFIG.BLOCK_SIZE;
        const jz = j * window.CITY_CONFIG.BLOCK_SIZE;
        
        // 沙袋掩体
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 5;
        const bx = ix + Math.cos(angle) * dist;
        const bz = jz + Math.sin(angle) * dist;
        
        const barrier = new THREE.Mesh(
          new THREE.BoxGeometry(3, 1, 0.8),
          barrierMat
        );
        barrier.position.set(bx, 0.5, bz);
        barrier.rotation.y = angle + Math.PI / 2;
        barrier.castShadow = true;
        scene.add(barrier);
        buildings.push(barrier);
        addCollider(bx, bz, 1.5 + 0.2, 0.4 + 0.2, 1, 'barrier', false);
      }
    }
  }
}

function generateCityTrees() {
  // 在人行道边缘种植树木
  for (let i = -window.CITY_CONFIG.BLOCKS_PER_SIDE; i <= window.CITY_CONFIG.BLOCKS_PER_SIDE; i++) {
    for (let j = -window.CITY_CONFIG.BLOCKS_PER_SIDE; j <= window.CITY_CONFIG.BLOCKS_PER_SIDE; j++) {
      if (Math.random() > 0.4) continue;
      
      const roadX = i * window.CITY_CONFIG.BLOCK_SIZE;
      const roadZ = j * window.CITY_CONFIG.BLOCK_SIZE;
      
      // 在道路两侧种植
      const side = Math.random() > 0.5 ? 1 : -1;
      const offset = window.CITY_CONFIG.ROAD_WIDTH / 2 + 3;
      
      const tree = createDetailedTree();
      tree.position.set(
        roadX + (Math.random() - 0.5) * 10,
        0,
        roadZ + side * offset + (Math.random() - 0.5) * 5
      );
      scene.add(tree);
      buildings.push(tree);
    }
  }
}

function createDetailedTree() {
  const group = new THREE.Group();
  
  // 树干
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 3, 6),
    new THREE.MeshLambertMaterial({ color: 0x5D4037 })
  );
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  group.add(trunk);
  
  // 树冠 - 多层
  const leafColors = [0x2d5a2d, 0x3d6a3d, 0x1d4a1d];
  const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];
  const leafMat = new THREE.MeshLambertMaterial({ color: leafColor });
  
  for (let i = 0; i < 3; i++) {
    const size = 2.5 - i * 0.5;
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(size, 2, 8),
      leafMat
    );
    leaves.position.y = 3.5 + i * 1.2;
    leaves.castShadow = true;
    group.add(leaves);
  }
  
  return group;
}

function generateAmmoStations() {
  for (let i = 0; i < 5; i++) {
    const station = createAmmoStation();
    let px, pz;
    do {
      px = (Math.random() - 0.5) * CONFIG.MAP_SIZE * 1.2;
      pz = (Math.random() - 0.5) * CONFIG.MAP_SIZE * 1.2;
    } while (Math.abs(px) < 25 && Math.abs(pz) < 25);
    station.position.set(px, 0, pz);
    scene.add(station);
    buildings.push(station);
  }
}

// 保留原有的辅助函数
function createAmmoStation() {
  const group = new THREE.Group();
  
  // 补给箱
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0x228822 })
  );
  box.position.y = 0.5;
  box.castShadow = true;
  group.add(box);
  
  // 标识
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.4, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
  );
  sign.position.set(0, 1.2, 0.5);
  group.add(sign);
  
  return group;
}

// 保留原有的楼梯创建函数
function createStair(buildingHeight, buildingWidth, buildingDepth) {
  const group = new THREE.Group();
  const stepCount = Math.min(Math.floor(buildingHeight / 0.5), 20);
  const stepHeight = 0.5;
  const stepDepth = 1.5;
  const stepWidth = 2.5;
  
  const stepMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
  const sideMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
  
  for (let i = 0; i < stepCount; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth),
      stepMat
    );
    step.position.set(0, i * stepHeight + stepHeight / 2, i * stepDepth);
    step.castShadow = true;
    group.add(step);
  }
  
  // 侧面墙壁
  const sideHeight = stepCount * stepHeight;
  const sideDepth = stepCount * stepDepth;
  
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, sideHeight, sideDepth),
    sideMat
  );
  leftWall.position.set(-stepWidth / 2 - 0.1, sideHeight / 2, sideDepth / 2 - stepDepth / 2);
  group.add(leftWall);
  
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, sideHeight, sideDepth),
    sideMat
  );
  rightWall.position.set(stepWidth / 2 + 0.1, sideHeight / 2, sideDepth / 2 - stepDepth / 2);
  group.add(rightWall);
  
  group.userData = { stepCount, stepHeight, stepDepth, stepWidth };
  return group;
}

function registerStairColliders(stair, sx, sz, rot) {
  const stepCount = stair.userData.stepCount;
  const stepHeight = stair.userData.stepHeight;
  const stepDepth = stair.userData.stepDepth;
  const stepWidth = stair.userData.stepWidth;
  const totalDepth = stepCount * stepDepth;
  const topY = stepCount * stepHeight;
  
  stairs.push({
    worldX: sx,
    worldZ: sz,
    rotation: rot,
    cos: Math.cos(rot),
    sin: Math.sin(rot),
    stepCount,
    stepHeight,
    stepDepth,
    stepWidth,
    totalDepth,
    topY
  });
  
  // 楼梯侧面墙壁碰撞盒
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  
  const leftWallX = sx + (-stepWidth / 2 - 0.1) * cos - (totalDepth / 2 - stepDepth / 2) * sin;
  const leftWallZ = sz + (-stepWidth / 2 - 0.1) * sin + (totalDepth / 2 - stepDepth / 2) * cos;
  addCollider(leftWallX, leftWallZ, 0.1, totalDepth / 2, topY, 'stair_wall', true);
  
  const rightWallX = sx + (stepWidth / 2 + 0.1) * cos - (totalDepth / 2 - stepDepth / 2) * sin;
  const rightWallZ = sz + (stepWidth / 2 + 0.1) * sin + (totalDepth / 2 - stepDepth / 2) * cos;
  addCollider(rightWallX, rightWallZ, 0.1, totalDepth / 2, topY, 'stair_wall', true);
}

// 旧版函数保留（用于兼容性）
function createTree() {
  return createDetailedTree();
}

function createLampPost() {
  return createDetailedLampPost();
}

function createCar() {
  return createDetailedCar(0x666666);
}

function createAmmoStation() {
  const group = new THREE.Group();
  
  // 底座
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.3, 2),
    new THREE.MeshLambertMaterial({ color: 0x444444 })
  );
  base.position.y = 0.15;
  base.castShadow = true;
  group.add(base);
  
  // 柱子
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8),
    new THREE.MeshLambertMaterial({ color: 0x666666 })
  );
  pole.position.y = 1.4;
  group.add(pole);
  
  // 弹药箱
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.8, 0.8),
    new THREE.MeshLambertMaterial({ color: 0x228822 })
  );
  box.position.y = 2.2;
  box.castShadow = true;
  group.add(box);
  
  // 弹药标识
  const ammoIcon = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.3, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  ammoIcon.position.set(0, 2.2, 0.41);
  group.add(ammoIcon);
  
  // 旋转的弹药盒
  const ammoBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    new THREE.MeshLambertMaterial({ color: 0xffaa00 })
  );
  ammoBox.position.y = 2.8;
  group.add(ammoBox);
  group.userData.ammoBox = ammoBox;
  
  // 发光效果
  const light = new THREE.PointLight(0x44ff44, 0.8, 8);
  light.position.y = 2.5;
  group.add(light);
  
  // 碰撞数据
  group.userData = { type: 'ammo_station', width: 2.5, depth: 2.5, ammoBox: ammoBox };
  
  return group;
}

// ============================================================
// 玩家系统
// ============================================================
function createPlayer() {
  // 获取避难所科技效果
  let techEffects = {};
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getTechEffects) {
    try {
      techEffects = ShelterSystem.getTechEffects();
    } catch(e) {}
  }
  
  // 计算科技加成后的初始属性
  const damageMult = 1 * (techEffects.damageMult || 1);
  const maxHealthBonus = techEffects.maxHealthBonus || 0;
  
  // 计算幸存者战场加成
  let survivorDamageBonus = 0;
  let survivorFortHealthBonus = 0;
  let survivorWaveHealBonus = 0;
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getData) {
    try {
      const shelterData = ShelterSystem.getData();
      const defs = ShelterSystem.getDefs().survivors;
      shelterData.survivors.forEach(sur => {
        const def = defs[sur.type];
        if (!def || !def.battlefieldEffect) return;
        const skillMult = 1 + (sur.skill - 1) * 0.10;
        if (def.battlefieldEffect.damageBonus) {
          survivorDamageBonus += def.battlefieldEffect.damageBonus * skillMult;
        }
        if (def.battlefieldEffect.fortHealthBonus) {
          survivorFortHealthBonus += def.battlefieldEffect.fortHealthBonus * skillMult;
        }
        if (def.battlefieldEffect.waveHealBonus) {
          survivorWaveHealBonus += def.battlefieldEffect.waveHealBonus * skillMult;
        }
      });
    } catch(e) {}
  }
  
  // 计算护盾科技加成
  const shieldCapacityMult = techEffects.shieldCapacityMult || 1;
  const shieldRegenMult = techEffects.shieldRegenMult || 1;
  const shieldMax = Math.floor(50 * shieldCapacityMult);
  const shieldRegenRate = Math.floor(2 * shieldRegenMult * 10) / 10;
  
  player = {
    // 基础属性（应用科技+幸存者加成）
    hp: 100 + maxHealthBonus, 
    maxHp: 100 + maxHealthBonus, 
    speed: CONFIG.PLAYER_SPEED,
    dmgMult: damageMult + survivorDamageBonus, 
    fireRateMult: 1, 
    magMult: 1, 
    reloadMult: 1,
    ammoMult: 1, 
    lifeSteal: 0, 
    critChance: 0,
    critChanceUpgrade: 0,
    critDamage: 1.5, 
    armor: 0, 
    regen: 0,
    // 电力护盾
    shield: shieldMax,       // 当前护盾值
    maxShield: shieldMax,    // 最大护盾值（受科技加成影响）
    shieldRegen: shieldRegenRate,   // 护盾回复速度/秒
    shieldRegenDelay: 5, // 停止受击后几秒开始回复
    lastShieldDamageTime: -999, // 上次护盾受损时间（用于延迟回复）
    // 成长属性
    level: 1, xp: 0, statPoints: 0,
    // 可分配属性（每项有上限）
    stats: {
      maxHp: 0,      // 生命上限，每级+10，上限200
      damage: 0,     // 伤害加成，每级+10%，上限100%
      speed: 0,      // 移动速度，每级+5%，上限50%
      critChance: 0, // 暴击率，每级+5%，上限50%
      critDamage: 0, // 暴击伤害，每级+20%，上限100%
      armor: 0,      // 护甲，每级+5%，上限50%
      lifeSteal: 0,  // 吸血，每级+2%，上限20%
      // 新增属性
      fireRate: 0,       // 射速，每级+5%，上限50%
      reloadSpeed: 0,    // 换弹速度，每级+5%，上限50%
      ammoCapacity: 0,   // 弹匣容量，每级+5%，上限75%
      quickDraw: 0,// 瞬发手铳，每级+1发，10级上限
      doubleJump: 0,     // 二段跳，10级解锁空中二段跳
      climbing: 0,         // 攀爬，每级+1秒攀爬时间，10级永久无时限
      healthRegen: 0,    // 生命恢复，每级+1HP/秒
      pickupRange: 0,    // 拾取范围，每级+1米
      expGain: 0,        // 经验获取，每级+10%
    },
    // 特殊能力
    explosiveRounds: false, chainLightning: false,
    fireTimer: 0, isReloading: false, reloadTimer: 0,
    // 精通点（基础属性全满后解锁）
    masteryPoints: 0,
    masteryDamage: 0,     // 伤害精通：所有伤害+5%/级
    masteryDefense: 0,     // 防御精通：所有防御+5%/级
    masteryEfficiency: 0,  // 效率精通：资源获取+10%/级
    // 避难所科技效果缓存
    shelterTech: techEffects,
  };
  
  // 每级所需经验公式：level * 100
  player.xpToNextLevel = player.level * 100;
  
  weapons = WEAPON_DEFS.map(w => ({
    ...w,
    mag: Math.floor(w.magSize),
    reserve: Math.floor(w.magSize * 5),
    currentMag: Math.floor(w.magSize),
  }));
  currentWeaponIndex = 0;
}

function switchWeapon(idx) {
  if (idx === currentWeaponIndex) return;
  // 强制中断换弹以允许切换
  if (player.isReloading) {
    player.isReloading = false;
    if (reloadTimer) { clearTimeout(reloadTimer); reloadTimer = null; }
  }
  // 切换武器时退出瞄准
  if (isAiming) toggleAim(false);
  currentWeaponIndex = idx;
  player.fireTimer = 0;
  // 如果武器处于收起状态，切换武器自动拿出；否则直接重新创建武器模型
  if (weaponHolstered) {
    weaponHolstered = false;
    holsterAnim.t = 0;
    holsterAnim.active = false;
    holsterAnim.dir = 0;
  }
  // BUG FIX: 隐藏空手双手模型，避免与武器叠加显示
  if (handsMesh) handsMesh.visible = false;

  createWeaponModel();
  updateHUD();
}

// 自动切换到下一个可用武器（弹匣或备弹>0）
function switchToNextAvailableWeapon() {
  for (let i = 1; i <= weapons.length; i++) {
    const nextIdx = (currentWeaponIndex + i) % weapons.length;
    const w = weapons[nextIdx];
    if (w.currentMag > 0 || w.reserve > 0) {
      switchWeapon(nextIdx);
      return;
    }
  }
}

function toggleAim(enable) {
  isAiming = enable;
  const scope = document.getElementById('sniper-scope');
  const crosshair = document.getElementById('crosshair');

  if (enable) {
    scope.style.display = 'block';
    crosshair.style.display = 'none';
    // 降低移动速度（考虑stats加成）
    player.speed = CONFIG.PLAYER_SPEED * (1 + player.stats.speed * 0.05) * 0.3;
    // 降低鼠标灵敏度（更精准）
    CONFIG.MOUSE_SENS = 0.0003;
    // 倍镜缩放效果：缩小FOV实现放大
    camera.fov = 20; // 正常75度 -> 瞄准20度（约4倍镜效果）
    camera.updateProjectionMatrix();
    // 添加呼吸晃动效果
    startBreathingEffect();
    // 更新狙击镜弹药显示
    updateScopeAmmo();
    // 隐藏武器和手臂，避免干扰狙击镜视野
    if (weaponMesh) weaponMesh.visible = false;
    if (rightArmMesh) rightArmMesh.visible = false;
    if (leftArmMesh) leftArmMesh.visible = false;
  } else {
    scope.style.display = 'none';
    crosshair.style.display = 'block';
    // 恢复正常（考虑stats加成）
    player.speed = CONFIG.PLAYER_SPEED * (1 + player.stats.speed * 0.05);
    CONFIG.MOUSE_SENS = 0.002;
    // 恢复FOV
    camera.fov = 75;
    camera.updateProjectionMatrix();
    // 停止呼吸晃动
    stopBreathingEffect();
    // 恢复武器和手臂显示
    if (weaponMesh) weaponMesh.visible = true;
    if (rightArmMesh) rightArmMesh.visible = true;
    if (leftArmMesh) leftArmMesh.visible = true;
  }
}

// 更新狙击镜弹药显示
function updateScopeAmmo() {
  const scopeAmmo = document.getElementById('scope-ammo');
  if (scopeAmmo && isAiming) {
    const w = weapons[currentWeaponIndex];
    scopeAmmo.textContent = `${w.currentMag} / ${w.reserve}`;
  }
}

// 狙击镜呼吸晃动效果
let breathingInterval = null;
let breathingOffset = { x: 0, y: 0 };
let scopeWindValue = 0;
let scopeWindTimer = 0;

function startBreathingEffect() {
  if (breathingInterval) clearInterval(breathingInterval);
  let time = 0;
  breathingInterval = setInterval(() => {
    time += 0.05;
    // 模拟呼吸的缓慢晃动
    breathingOffset.x = Math.sin(time) * 0.0003;
    breathingOffset.y = Math.cos(time * 0.7) * 0.0002;
  }, 50);
}

function stopBreathingEffect() {
  if (breathingInterval) {
    clearInterval(breathingInterval);
    breathingInterval = null;
  }
  breathingOffset = { x: 0, y: 0 };
}

// 更新狙击镜距离和风速显示
function updateScopeInfo(dt) {
  // 风速缓慢随机变化
  scopeWindTimer += dt;
  if (scopeWindTimer > 2.0) {
    scopeWindTimer = 0;
    scopeWindValue += (Math.random() - 0.5) * 1.5;
    scopeWindValue = Math.max(-5, Math.min(5, scopeWindValue));
  }

  // 使用射线检测计算瞄准距离
  let distance = '---';
  if (scene) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const dist = intersects[0].distance;
      if (dist < 1000) {
        distance = Math.round(dist).toString();
      }
    }
  }

  const distEl = document.getElementById('scope-distance');
  if (distEl) distEl.textContent = distance;
  const windEl = document.getElementById('scope-wind');
  if (windEl) windEl.textContent = scopeWindValue.toFixed(1);
}

function shoot() {
  if (player.isReloading) return;
  if (weaponHolstered) return; // 收起状态不能射击
  const w = weapons[currentWeaponIndex];
  const effectiveFireRate = w.fireRate * player.fireRateMult / (1 + player.stats.fireRate * 0.05);
  if (player.fireTimer > 0) return;

  // 手雷特殊处理：启动投弹动画序列
  if (w.isGrenade) {
    if (w.currentMag <= 0) {
      if (w.reserve > 0) {
        reloadWeapon();
      } else {
        // 备弹为0，自动切换到下一个可用武器
        switchToNextAvailableWeapon();
      }
      return;
    }
    // 投弹动画进行中不能再次触发
    if (grenadeAnim.phase !== 'idle') return;
    player.fireTimer = effectiveFireRate;
    w.currentMag--;
    // 启动投弹动画：拉环 -> 举起 -> 投掷 -> 恢复
    grenadeAnim.phase = 'pullPin';
    grenadeAnim.timer = 0.3;
    updateHUD();
    return;
  }

  if (w.currentMag <= 0) {
    reloadWeapon();
    return;
  }

  player.fireTimer = effectiveFireRate;

  // 瞬发手铳：计算总发射子弹数（仅手枪生效）
  // 设计：每级+1发额外子弹，10级时总共发射11发（如果弹匣够）
  // 如果弹匣不够，发射弹匣内所有子弹
  const quickDrawLevel = player.stats.quickDraw || 0;
  let shotsToFire = 1; // 默认每次射击发射1发
  if (quickDrawLevel > 0 && w.name === '手枪') {
    shotsToFire = 1 + quickDrawLevel; // 主射击 + 瞬发子弹数
  }
  
  // 实际发射数不能超过弹匣内子弹数
  const actualShots = Math.min(shotsToFire, w.currentMag);
  
  // 一次性消耗弹药
  w.currentMag -= actualShots;

  // 更新狙击镜弹药显示（如果正在瞄准）
  if (isAiming) updateScopeAmmo();

  // 播放射击音效
  if(window.AudioSystem)AudioSystem.playSound(w.sound || 'pistol');

  // 枪口闪光 + 后坐力（手雷不触发）
  if (!w.isGrenade) {
    triggerMuzzleFlash();
    applyRecoil(w.name === '霰弹枪' ? 2.0 : w.name === '狙击枪' ? 1.5 : 1.0);
  }

  // 创建所有子弹
  for (let shot = 0; shot < actualShots; shot++) {
    const pellets = w.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      const dir = new THREE.Vector3(0, 0, -1);
      dir.applyQuaternion(camera.quaternion);
      
      // 瞄准模式下散布为0（完全精准），否则应用武器散布
      const effectiveSpread = isAiming ? 0 : w.spread;
      // 瞬发手铳的额外子弹（shot > 0）有更大的散布
      const spreadMultiplier = (quickDrawLevel > 0 && w.name === '手枪' && shot > 0) ? 2 : 1;
      dir.x += (Math.random() - 0.5) * effectiveSpread * spreadMultiplier;
      dir.y += (Math.random() - 0.5) * effectiveSpread * spreadMultiplier;
      dir.z += (Math.random() - 0.5) * effectiveSpread * spreadMultiplier;
      dir.normalize();

      const isCrit = Math.random() < player.critChance;
      const baseDmg = w.damage * player.dmgMult * (1 + player.stats.damage * 0.10);
      const dmg = baseDmg * (isCrit ? player.critDamage : 1);

      const bullet = {
        pos: camera.position.clone(),
        dir: dir,
        speed: w.bulletSpeed,
        damage: dmg,
        life: 2,
        isCrit,
        fromPlayer: true,
        pierce: w.pierce || false,
        pierceCount: w.pierceCount || 1,
        hitEnemies: null,
        trail: null,
      };

      // 创建弹道轨迹并与子弹绑定（碰撞/过期时自动清理）
      if (barrelTipLocal && weaponMesh && camera) {
        const tipWorld = barrelTipLocal.clone();
        weaponMesh.localToWorld(tipWorld);
        bullet.trail = createBulletTrail(tipWorld, dir, 0.8 + Math.random() * 0.6);
      }

      bullets.push(bullet);

      // 枪口闪光
      createMuzzleFlash(camera.position.clone().add(dir.clone().multiplyScalar(1)));
    }
  }

  // 后坐力（瞬发手铳增加后坐力）
  pitch += 0.01 * actualShots;

  // 弹匣空时自动换弹
  if (w.currentMag <= 0 && w.reserve > 0) {
    setTimeout(() => reloadWeapon(), 200);
  }
  updateHUD();
}

// ============================================================
// 手雷系统
// ============================================================
function throwGrenade() {
  if(window.AudioSystem)AudioSystem.playSound('grenade_throw');

  const dir = new THREE.Vector3(0, 0.3, -1); // 稍微向上抛
  dir.applyQuaternion(camera.quaternion);
  dir.normalize();

  const throwSpeed = CONFIG.GRENADE_THROW_SPEED;
  const grenadeDmg = CONFIG.GRENADE_DAMAGE * player.dmgMult * (1 + player.stats.damage * 0.10);

  // 创建手雷可视化mesh
  const grenadeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
  grenadeGeo.rotateX(Math.PI / 2);
  const grenadeMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
  const grenadeMesh = new THREE.Mesh(grenadeGeo, grenadeMat);
  grenadeMesh.position.copy(camera.position);
  scene.add(grenadeMesh);

  bullets.push({
    pos: camera.position.clone(),
    dir: dir.clone().multiplyScalar(throwSpeed),
    vel: dir.clone().multiplyScalar(throwSpeed), // 手雷使用速度而非方向
    speed: throwSpeed,
    damage: grenadeDmg,
    life: CONFIG.GRENADE_FUSE_TIME,
    isCrit: false,
    fromPlayer: true,
    pierce: false,
    hitEnemies: null,
    isGrenade: true,
    mesh: grenadeMesh,
    rotationSpeed: 10,
  });
  
  // 手雷投掷后，弹匣为0时自动换弹（类似自动换弹）
  const w = weapons[currentWeaponIndex];
  if (w && w.isGrenade && w.currentMag <= 0 && w.reserve > 0 && !player.isReloading) {
    setTimeout(() => {
      if (currentWeaponIndex >= 0 && weapons[currentWeaponIndex] && weapons[currentWeaponIndex].isGrenade && weapons[currentWeaponIndex].currentMag <= 0) {
        reloadWeapon();
      }
    }, 300); // 300ms延迟，让投掷动画完成
  }
}

function createHandsModel() {
  if (handsMesh && camera) camera.remove(handsMesh);
  if (!camera) {
    console.warn('[createHandsModel] camera 未初始化，跳过创建');
    return;
  }
  const group = new THREE.Group();
  group.name = 'fpsHands';
  // 使用更明亮的颜色避免看起来像黑柱子
  const skinMat = new THREE.MeshBasicMaterial({ color: 0xdea876 });
  const sleeveMat = new THREE.MeshBasicMaterial({ color: 0x3d4a2e }); // 军绿色袖子
  const gloveMat = new THREE.MeshBasicMaterial({ color: 0x3a3028 }); // 深棕色手套

  function createHandMesh(isLeft) {
    const armGroup = new THREE.Group();
    const side = isLeft ? -1 : 1;

    // === 完整手臂：握拳手 + 手腕 + 前臂 + 肘 + 上臂 ===
    // 拳头主体（握拳状态）
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.042, 0.048), gloveMat);
    fist.position.set(0, 0, -0.005);
    armGroup.add(fist);

    // 四指（弯曲握拳，贴紧拳头前方）
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.018, 0.016), gloveMat);
      finger.position.set((i - 1.5) * 0.012, -0.018, -0.025);
      finger.rotation.x = 1.5; // 弯曲向前握拳
      armGroup.add(finger);
    }

    // 拇指（弯曲贴紧拳头侧面）
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.018, 0.016), gloveMat);
    thumb.position.set(side * 0.030, -0.012, -0.010);
    thumb.rotation.z = side * 0.25;
    thumb.rotation.x = 0.7;
    armGroup.add(thumb);

    // 手腕
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.026, 0.025, 8), skinMat);
    wrist.position.set(side * 0.005, 0.005, 0.035);
    armGroup.add(wrist);

    // 前臂：向后下方延伸
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 0.12, 8), sleeveMat);
    forearm.position.set(side * 0.015, -0.02, 0.08);
    forearm.rotation.x = 2.2;
    armGroup.add(forearm);

    // 肘关节
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), sleeveMat);
    elbow.position.set(side * 0.020, -0.07, 0.17);
    armGroup.add(elbow);

    // 上臂
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.15, 8), sleeveMat);
    upperArm.position.set(side * 0.028, -0.14, 0.28);
    upperArm.rotation.x = 2.4;
    armGroup.add(upperArm);

    // 肩部
    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.05, 8), sleeveMat);
    shoulder.position.set(side * 0.035, -0.23, 0.40);
    shoulder.rotation.x = 2.5;
    armGroup.add(shoulder);

    return armGroup;
  }

  // 左手 — 放在视野左下方
  const leftArm = createHandMesh(true);
  leftArm.position.set(-0.12, -0.18, -0.25);
  leftArm.rotation.z = 0.08;
  group.add(leftArm);

  // 右手 — 放在视野右下方
  const rightArm = createHandMesh(false);
  rightArm.position.set(0.12, -0.18, -0.25);
  rightArm.rotation.z = -0.08;
  group.add(rightArm);

  group.visible = false;
  camera.add(group);
  handsMesh = group;
}

function toggleHolster() {
  if (holsterAnim.active) return; // 动画进行中不响应
  const willHolster = !weaponHolstered;
  if (willHolster) {
    // 开始收起
    if (isAiming) toggleAim(false);
    holsterAnim.dir = 1;
    holsterAnim.active = true;
    if (typeof showToast === 'function') showToast('武器已收起（长按R拿出）', 'info');
  } else {
    // 开始拿出
    createWeaponModel();
    holsterAnim.dir = -1;
    holsterAnim.active = true;
    if (typeof showToast === 'function') showToast('武器已装备', 'success');
  }
  updateHUD();
}

function reloadWeapon() {
  if (weaponHolstered) return; // 收起状态不能换弹
  const w = weapons[currentWeaponIndex];
  const maxMag = Math.floor(w.magSize * player.magMult * (1 + player.stats.ammoCapacity * 0.05));
  if (player.isReloading || w.currentMag >= maxMag || w.reserve <= 0) return;
  player.isReloading = true;
  player.reloadTimer = w.reloadTime * player.reloadMult / (1 + player.stats.reloadSpeed * 0.05);
  document.getElementById('reload-text').textContent = '换弹中...';
  if(window.AudioSystem)AudioSystem.playSound('reload', 0.3);
}

function finishReload() {
  const w = weapons[currentWeaponIndex];
  const maxMag = Math.floor(w.magSize * player.magMult * (1 + player.stats.ammoCapacity * 0.05));
  const needed = maxMag - w.currentMag;
  const available = Math.min(needed, w.reserve);
  w.currentMag += available;
  w.reserve -= available;
  player.isReloading = false;
  document.getElementById('reload-text').textContent = '';
  updateHUD();
}

function updatePlayer(dt) {
  // 调试用：确认 updatePlayer 被调用
  if (window._inputDebug) {
    window._inputDebug.updatePlayer++;
    if (window._inputDebug.updatePlayer === 1 && window._showError) {
      window._showError('[调试] updatePlayer 开始运行');
    }
  }

  // 确保HP字段有效
  if (typeof player.hp !== 'number' || isNaN(player.hp)) player.hp = 0;
  if (typeof player.maxHp !== 'number' || isNaN(player.maxHp)) player.maxHp = 100;

  // 中毒效果处理（沙漠毒蝎丧尸）
  if (window.playerPoison && window.playerPoison.duration > 0) {
    window.playerPoison.timer += dt;
    if (window.playerPoison.timer >= 1.0) {
      window.playerPoison.timer -= 1.0;
      window.playerPoison.duration -= 1.0;
      damagePlayer(window.playerPoison.damage);
      showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 1.5, 0)), `-${window.playerPoison.damage}`, 0x44FF44);
    }
    if (window.playerPoison.duration <= 0) {
      window.playerPoison = null;
    }
  }

  // 致盲效果处理（沙漠秃鹫腐尸）
  if (window.playerBlind && window.playerBlind.duration > 0) {
    window.playerBlind.timer += dt;
    if (window.playerBlind.timer >= 0.1) {
      window.playerBlind.timer -= 0.1;
      window.playerBlind.duration -= 0.1;
      // 屏幕变绿效果通过CSS覆盖层实现
      let blindOverlay = document.getElementById('blind-overlay');
      if (!blindOverlay) {
        blindOverlay = document.createElement('div');
        blindOverlay.id = 'blind-overlay';
        blindOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(85,170,0,0.3);pointer-events:none;z-index:9999;transition:opacity 0.3s;';
        document.body.appendChild(blindOverlay);
      }
      blindOverlay.style.opacity = '1';
    }
    if (window.playerBlind.duration <= 0) {
      window.playerBlind = null;
      const blindOverlay = document.getElementById('blind-overlay');
      if (blindOverlay) {
        blindOverlay.style.opacity = '0';
        setTimeout(() => { if (blindOverlay.parentNode) blindOverlay.parentNode.removeChild(blindOverlay); }, 300);
      }
    }
  }

  // 燃烧效果处理（沙漠自爆火甲虫）
  if (window.playerBurning && window.playerBurning.duration > 0) {
    window.playerBurning.timer += dt;
    if (window.playerBurning.timer >= 0.5) {
      window.playerBurning.timer -= 0.5;
      window.playerBurning.duration -= 0.5;
      damagePlayer(window.playerBurning.damage);
      showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 1.5, 0)), `-${window.playerBurning.damage}`, 0xFF4400);
      // 火焰粒子
      particles.push({
        pos: camera.position.clone().add(new THREE.Vector3((Math.random()-0.5)*0.5, 0.5, (Math.random()-0.5)*0.5)),
        vel: new THREE.Vector3((Math.random()-0.5)*0.5, Math.random()*1+0.5, (Math.random()-0.5)*0.5),
        life: 0.3, color: 0xFF4400, size: 0.08
      });
    }
    if (window.playerBurning.duration <= 0) {
      window.playerBurning = null;
    }
  }

  // 生命恢复（每秒恢复）
  if (player.stats.healthRegen > 0 && player.hp < player.maxHp) {
    player.hp = Math.min(player.hp + player.stats.healthRegen * dt, player.maxHp);
  }
  
  // 护盾被动回复（受击延迟机制）
  // 确保所有字段有效
  const currentShield = (typeof player.shield === 'number' && !isNaN(player.shield)) ? player.shield : 0;
  const maxShield = (typeof player.maxShield === 'number' && !isNaN(player.maxShield)) ? player.maxShield : 50;
  player.shield = currentShield;
  player.maxShield = maxShield;
  
  if (currentShield < maxShield) {
    const lastDamageTime = (typeof player.lastShieldDamageTime === 'number' && !isNaN(player.lastShieldDamageTime)) ? player.lastShieldDamageTime : -999;
    const timeSinceDamage = surviveTime - lastDamageTime;
    const regenDelay = (typeof player.shieldRegenDelay === 'number' && !isNaN(player.shieldRegenDelay)) ? player.shieldRegenDelay : 5;
    const shieldRegen = (typeof player.shieldRegen === 'number' && !isNaN(player.shieldRegen)) ? player.shieldRegen : 2;
    if (timeSinceDamage >= regenDelay) {
      const regenAmount = shieldRegen * dt;
      player.shield = Math.min(currentShield + regenAmount, maxShield);
    }
  }

  // 更新BUFF
  updateBuffs(dt);

  // 弹药补给站动画和交互
  buildings.forEach(b => {
    if (b.userData && b.userData.type === 'ammo_station' && b.userData.ammoBox) {
      b.userData.ammoBox.rotation.y += dt * 2;
      b.userData.ammoBox.position.y = 2.8 + Math.sin(Date.now() * 0.003) * 0.1;

      // 检查玩家是否在补给站附近按E（含拾取范围加成）
      const pickupDist = 4 + player.stats.pickupRange;
      const dist = camera.position.distanceTo(b.position);
      if (dist < pickupDist && keys['KeyE']) {
        // 补充所有武器弹药
        let ammoAdded = false;
        weapons.forEach(w => {
          const maxReserve = Math.floor(w.magSize * 10 * player.ammoMult);
          if (w.reserve < maxReserve) {
            w.reserve = Math.min(w.reserve + Math.floor(w.magSize * 2), maxReserve);
            ammoAdded = true;
          }
        });
        if (ammoAdded) {
          if(window.AudioSystem)AudioSystem.playSound('reload', 0.3);
          showFloatingText(b.position.clone().add(new THREE.Vector3(0, 3, 0)), "弹药已补充!", 0x44ff44);
          keys['KeyE'] = false; // 防止连续触发
        }
      }
    }
  });

  // 移动
  const moveDir = new THREE.Vector3();
  if (keys['KeyW']) moveDir.z -= 1;
  if (keys['KeyS']) moveDir.z += 1;
  if (keys['KeyA']) moveDir.x -= 1;
  if (keys['KeyD']) moveDir.x += 1;
  moveDir.normalize();

  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const right = new THREE.Vector3(1, 0, 0);
  right.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

  const velocity = new THREE.Vector3();
  velocity.addScaledVector(forward, -moveDir.z);
  velocity.addScaledVector(right, moveDir.x);
  velocity.normalize();

  let speed = player.speed * (1 + player.stats.speed * 0.05);
  // 应用天气移速效果
  if (window.WeatherSystem) {
    speed *= WeatherSystem.getPlayerSpeedMult();
  }
  if (keys['ShiftLeft']) speed *= CONFIG.SPRINT_MULT;

  // 攀爬中：完全禁止水平移动，避免碰撞系统把玩家弹离墙面
  if (player._isClimbing) speed = 0;

  const newPos = camera.position.clone();
  newPos.x += velocity.x * speed * dt;
  newPos.z += velocity.z * speed * dt;

  // 碰撞检测 - 检查新位置是否有阻挡
  // 水平移动时使用当前高度检测，但允许走进可站立物体区域（汽车、楼梯）
  
  // 首先用当前高度检测
  let blocked = checkCollision(newPos);
  
  // 如果被阻挡，检查新位置是否有可站立的表面
  if (blocked) {
    const groundAtNewPos = getGroundLevel(newPos);
    // 如果新位置有可站立的表面（比当前地面高），允许走进去
    // 重力系统会将玩家放到正确的y位置
    if (groundAtNewPos > camera.position.y) {
      // 使用新位置的地面高度重新检测
      const testPos = newPos.clone();
      testPos.y = groundAtNewPos;
      blocked = checkCollision(testPos);
    }
  }
  
  if (!blocked) {
    camera.position.x = newPos.x;
    camera.position.z = newPos.z;
    // 注意：y坐标不由水平移动改变，由重力系统+地面检测统一处理
    // 不在此处做任何地形跟随，避免与地面检测块冲突
    // 所有地形跟随逻辑集中在 "检测地面" 区域（下面 ~3870行）
    
    // 脚步声
    if (moveDir.length() > 0) {
      footstepTimer -= dt;
      if (footstepTimer <= 0) {
        if(window.AudioSystem)AudioSystem.playSound('footstep');
        footstepTimer = keys['ShiftLeft'] ? 0.3 : 0.5; // 奔跑时脚步更快
      }
    }
  }

  // 跳跃（支持二段跳）- 使用边缘检测，只在按下瞬间触发
  var spaceJustPressed = keys['Space'] && !spacePressed;
  spacePressed = !!keys['Space'];
  if (spaceJustPressed) {
    if (onGround) {
      playerVelocity.y = CONFIG.JUMP_FORCE * (player.jumpForceMult || 1);
      onGround = false;
      jumpCount = 1;
    } else if (player.canDoubleJump && jumpCount < 2) {
      // 二段跳：在空中再次跳跃
      playerVelocity.y = CONFIG.JUMP_FORCE * 0.85 * (player.jumpForceMult || 1);
      jumpCount = 2;
    }
  }

  // === 攀爬系统 v5 (贴墙自动爬：靠近墙+持续按方向键0.3秒=垂直上升) ===
  if (typeof player.climbTime === 'undefined') player.climbTime = 0;
  if (typeof player._climbTimer === 'undefined') player._climbTimer = 0;
  if (typeof player._climbCooldown === 'undefined') player._climbCooldown = 0;
  if (typeof player._isClimbing === 'undefined') player._isClimbing = false;
  if (typeof player._climbPending === 'undefined') player._climbPending = 0;

  if (player._climbCooldown > 0) {
    player._climbCooldown -= dt;
    if (player._climbCooldown < 0) player._climbCooldown = 0;
  }

  // 满级检测：10级=永久攀爬，不受时间和冷却限制
  const isMaxLevelClimb = player.climbTime >= 10;

  // 检测玩家移动方向前方是否有可攀爬的垂直面
  // 返回 { wall, dist } 以便知道距离
  function checkClimbableWall() {
    if (!colliders || colliders.length === 0) return { wall: null, dist: Infinity };
    if (moveDir.length() === 0) return { wall: null, dist: Infinity };
    // 部署模式下不检测攀爬，防止与工事预览操作冲突
    if (window.deploymentMode) return { wall: null, dist: Infinity };

    const px = camera.position.x;
    const py = camera.position.y - 0.5;
    const pz = camera.position.z;
    const CLIMB_DETECT_DIST = 2.0; // 检测距离2米

    const checkDir = velocity.clone();
    if (checkDir.length() < 0.01) return { wall: null, dist: Infinity };

    const origin = { x: px, y: py, z: pz };
    let bestWall = null;
    let bestDist = Infinity;

    for (const c of colliders) {
      if (!c.solid || !c.topY || c.topY < 2.0) continue;
      if (py < -0.5 || py > c.topY + 0.5) continue;

      let t = Infinity;
      if (Math.abs(checkDir.x) > 0.01) {
        const targetX = checkDir.x > 0 ? c.x - c.hw : c.x + c.hw;
        const tx = (targetX - origin.x) / checkDir.x;
        if (tx > 0.3 && tx < t) {
          const hitZ = origin.z + checkDir.z * tx;
          const hitY = origin.y + checkDir.y * tx;
          if (hitZ >= c.z - c.hd && hitZ <= c.z + c.hd && hitY >= 0 && hitY <= c.topY) {
            t = tx;
          }
        }
      }
      if (Math.abs(checkDir.z) > 0.01) {
        const targetZ = checkDir.z > 0 ? c.z - c.hd : c.z + c.hd;
        const tz = (targetZ - origin.z) / checkDir.z;
        if (tz > 0.3 && tz < t) {
          const hitX = origin.x + checkDir.x * tz;
          const hitY = origin.y + checkDir.y * tz;
          if (hitX >= c.x - c.hw && hitX <= c.x + c.hw && hitY >= 0 && hitY <= c.topY) {
            t = tz;
          }
        }
      }
      if (t < CLIMB_DETECT_DIST && t < bestDist) {
        bestDist = t;
        bestWall = c;
      }
    }
    return { wall: bestWall, dist: bestDist };
  }

  // 攀爬结束后强制推出所有碰撞体（防止卡在墙里/屋顶穿模）
  function pushOutOfAllColliders() {
    if (!colliders || colliders.length === 0) return;
    const px = camera.position.x;
    const py = camera.position.y;
    const pz = camera.position.z;
    for (const c of colliders) {
      if (!c.solid) continue;
      if (py < 0 || py > c.topY + 2.0) continue; // 只检查玩家所在高度的碰撞体
      const dx = px - c.x;
      const dz = pz - c.z;
      // 检查玩家是否在碰撞体水平范围内（被墙体包含）
      if (Math.abs(dx) < c.hw && Math.abs(dz) < c.hd) {
        // 玩家在碰撞体内部！沿最短路径推出
        const overlapX = c.hw - Math.abs(dx) + 0.4;
        const overlapZ = c.hd - Math.abs(dz) + 0.4;
        if (overlapX < overlapZ) {
          camera.position.x = c.x + Math.sign(dx) * (c.hw + 0.4);
        } else {
          camera.position.z = c.z + Math.sign(dz) * (c.hd + 0.4);
        }
        if (player._climbDebug) console.log('[攀爬调试] 推出碰撞体', c.type, '重叠X=' + overlapX.toFixed(2) + ' Z=' + overlapZ.toFixed(2));
      }
    }
  }

  const { wall, dist } = checkClimbableWall();
  const isMovingAny = moveDir.length() > 0;

  // 攀爬调试（按F9切换）
  if (typeof player._climbDebug === 'undefined') player._climbDebug = false;
  if (keys['F9'] && !player._climbDebugKeyLast) {
    player._climbDebug = !player._climbDebug;
    console.log('[攀爬调试]', player._climbDebug ? '开启' : '关闭');
  }
  player._climbDebugKeyLast = !!keys['F9'];
  if (player._climbDebug && isMovingAny) {
    let dbg = '[攀爬调试] climbTime=' + player.climbTime + ' cd=' + player._climbCooldown.toFixed(1) + ' pending=' + player._climbPending.toFixed(2) + ' wall=' + (wall ? wall.type + '(d=' + dist.toFixed(2) + ')' : 'null') + ' climbing=' + player._isClimbing;
    console.log(dbg);
  }

  // 攀爬状态机
  if (player._isClimbing) {
    // 攀爬中锁定当前墙壁（不依赖每帧射线检测，因为高度过滤会导致wall变null）
    const activeWall = player._climbWall || wall;

    // 满级不消耗时间
    if (!isMaxLevelClimb) {
      player._climbTimer -= dt;
    }

    // 检测是否到达楼顶/平台顶部：脚底 >= 墙壁顶部 → 自动着陆
    const footY_climb = camera.position.y - 1.7;
    const reachedTop = activeWall && footY_climb >= activeWall.topY - 0.2;

    // 结束条件：到达楼顶、松开方向键、时间耗尽(非满级)
    // 注意：不再检查 !wall，因为 wall 可能因高度过滤变null
    const timeUp = !isMaxLevelClimb && player._climbTimer <= 0;
    if (reachedTop || !isMovingAny || timeUp) {
      player._isClimbing = false;
      player._climbPending = 0;
      player._climbWall = null;

      if (reachedTop && activeWall) {
        // 到达楼顶：吸附到楼顶表面
        camera.position.y = activeWall.topY + 1.7;
        playerVelocity.y = 0;
        onGround = true;
        jumpCount = 0;
        _smoothGroundY = activeWall.topY + 1.7;
        _groundHeightHistory = []; // 重置地面高度缓冲区，防止旧值把玩家拉回地面

        // 把玩家移到碰撞体顶部边缘内侧（保证getGroundLevel能检测到楼顶）
        const dx = camera.position.x - activeWall.x;
        const dz = camera.position.z - activeWall.z;
        const margin = 0.2;
        if (Math.abs(dx) >= activeWall.hw) {
          camera.position.x = activeWall.x + Math.sign(dx) * (activeWall.hw - margin);
        }
        if (Math.abs(dz) >= activeWall.hd) {
          camera.position.z = activeWall.z + Math.sign(dz) * (activeWall.hd - margin);
        }

        if (player._climbDebug) console.log('[攀爬调试] 到达楼顶！高度=' + activeWall.topY.toFixed(1) + ' pos=(' + camera.position.x.toFixed(1) + ',' + camera.position.z.toFixed(1) + ')');
        player._climbDebug = true;
        setTimeout(() => { player._climbDebug = false; console.log('[楼顶调试] 自动关闭'); }, 3000);
      } else if (timeUp) {
        player._climbCooldown = 10;
        if (player._climbDebug) console.log('[攀爬调试] 攀爬结束（时间耗尽）冷却10秒');
      } else {
        if (player._climbDebug) console.log('[攀爬调试] 攀爬停止：松开方向键');
      }
    } else {
      // 攀爬中：纯垂直上升，水平完全禁止
      playerVelocity.y = 4.0;
      onGround = false;
      playerVelocity.x = 0;
      playerVelocity.z = 0;
    }
  } else if (player.climbTime > 0 && player._climbCooldown <= 0 && wall && isMovingAny) {
    // 触发条件满足：进入待启动状态，持续0.3秒后正式触发
    player._climbPending += dt;
    if (player._climbPending >= 0.3) {
      player._isClimbing = true;
      player._climbWall = wall; // 锁定当前墙壁
      player._climbTimer = player.climbTime;
      player._climbPending = 0;
      playerVelocity.y = 0;
      if (player._climbDebug) console.log('[攀爬调试] 攀爬触发成功！持续' + (isMaxLevelClimb ? '无限(满级)' : player.climbTime + '秒'));
    }
  } else {
    // 条件不满足：重置待启动计时
    player._climbPending = 0;
    // 不在攀爬中：持续减少冷却
    if (player._climbCooldown > 0) {
      player._climbCooldown -= dt;
      if (player._climbCooldown < 0) player._climbCooldown = 0;
    }
  }

  // 重力（攀爬中跳过，攀爬系统自己控制垂直速度）
  if (!player._isClimbing) {
    playerVelocity.y -= CONFIG.GRAVITY * dt;
  }
  camera.position.y += playerVelocity.y * dt;
  
  // 检测地面和可站立物体
  const groundLevel = getGroundLevel(camera.position);
  
  // ── FBM地形平滑系统 ──
  // 策略：大缓冲区移动平均(15帧) + 极慢指数平滑(factor=0.08) + 死区(0.02)
  // 消除Math.max截断抖动: 永远使用平滑值，不直接跳到raw值
  if (_smoothGroundY === null) {
    _smoothGroundY = groundLevel;
    _groundHeightHistory = [];
    _groundHistoryIdx = 0;
  }
  
  // 15帧环形缓冲区（~250ms窗口，远大于之前的83ms）
  if (_groundHeightHistory) {
    _groundHeightHistory[_groundHistoryIdx] = groundLevel;
    _groundHistoryIdx = (_groundHistoryIdx + 1) % 15;
    // 确保缓冲区达到15帧后才启用平均
    if (_groundHeightHistory.length < 15) {
      _groundHeightHistory = Array(15).fill(groundLevel);
      _groundHistoryIdx = 0;
    }
  }
  
  // 使用移动平均作为目标高度（滤除高频噪声）
  let targetGroundLevel;
  const isRoughTerrain = window.currentMap === 'snow' || window.currentMap === 'island' || window.currentMap === 'swamp';
  if (isRoughTerrain && _groundHeightHistory && _groundHeightHistory.length >= 15) {
    let sum = 0;
    for (let i = 0; i < 15; i++) sum += _groundHeightHistory[i];
    targetGroundLevel = sum / 15;
  } else {
    targetGroundLevel = groundLevel;
  }
  
  // 大幅落差时立即跟随（如从高处跳下，>1.5单位），防止穿地
  // 但只向上跟随（防止从高处落下时穿地），不向下跟随（防止从楼顶拉回地面）
  const heightDiff = targetGroundLevel - _smoothGroundY;
  if (heightDiff > 1.5) {
    _smoothGroundY = targetGroundLevel;
  }
  
  // 楼梯斜坡：自动吸附到斜坡高度（实现平滑上楼梯）
  const footY = camera.position.y - 1.7;
  const stairH = getStairHeight(camera.position.x, camera.position.z, footY);
  if (stairH >= 0) {
    const stairEyeLevel = stairH + 1.7;
    if (stairEyeLevel > camera.position.y) {
      const maxRiseSpeed = 8;
      const riseAmount = Math.min(stairEyeLevel - camera.position.y, maxRiseSpeed * dt);
      camera.position.y += riseAmount;
      playerVelocity.y = 0;
      onGround = true;
      jumpCount = 0;
      _smoothGroundY = camera.position.y;
    }
    if (camera.position.y <= stairEyeLevel) {
      camera.position.y = stairEyeLevel;
      playerVelocity.y = 0;
      onGround = true;
      jumpCount = 0;
      _smoothGroundY = camera.position.y;
    }
  } else if (camera.position.y <= targetGroundLevel + 0.1) {
    // 着地检测：使用帧率无关平滑插值
    if (isRoughTerrain) {
      // 关键改进: 极慢指数平滑 factor=0.08
      // 每帧只向目标靠近8%，配合15帧平均天然消除FBM高频
      // 同时使用死区：差值<0.02时完全不更新，消除微抖动
      const lerpFactor = 1 - Math.pow(1 - 0.08, dt * 60);
      const delta = (targetGroundLevel - _smoothGroundY) * lerpFactor;
      if (Math.abs(delta) > 0.005) {
        _smoothGroundY += delta;
      }
      // 关键修复：不再使用 Math.max 截断到 raw 值
      // 永远使用平滑后的值，但允许玩家从高处落下时跟上
      camera.position.y = _smoothGroundY;
    } else {
      camera.position.y = targetGroundLevel;
      _smoothGroundY = targetGroundLevel;
    }
    playerVelocity.y = 0;
    onGround = true;
    jumpCount = 0;
  } else if (onGround && playerVelocity.y <= 0 && camera.position.y - targetGroundLevel < 0.5) {
    // 在地面上方但很近，强制吸附
    if (isRoughTerrain) {
      const lerpFactor = 1 - Math.pow(1 - 0.08, dt * 60);
      const delta = (targetGroundLevel - _smoothGroundY) * lerpFactor;
      if (Math.abs(delta) > 0.005) {
        _smoothGroundY += delta;
      }
      camera.position.y = _smoothGroundY;
    } else {
      camera.position.y = targetGroundLevel;
      _smoothGroundY = targetGroundLevel;
    }
    playerVelocity.y = 0;
    onGround = true;
    jumpCount = 0;
  }

  // 相机旋转
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  // 相机碰撞检测 - 防止视角穿透物体
  // 攀爬中跳过，防止被建筑碰撞体在密集城市中反复推挤
  // 部署模式下跳过，防止相机震荡导致工事预览位置跳动
  if (!player._isClimbing && !window.deploymentMode) {
    updateCameraCollision();
  }

  // 射击计时器
  player.fireTimer = Math.max(0, player.fireTimer - dt);
  if (mouseDown && weapons[currentWeaponIndex].auto) shoot();

  // 换弹计时器
  if (player.isReloading) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) finishReload();
  }

  // 生命回复（基础回复 + 幸存者加成）
  let regenAmount = player.regen;
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getData) {
    try {
      const shelterData = ShelterSystem.getData();
      const defs = ShelterSystem.getDefs().survivors;
      shelterData.survivors.forEach(sur => {
        const def = defs[sur.type];
        if (def && def.battlefieldEffect && def.battlefieldEffect.hpRegen) {
          // 技能等级加成：每级+10%
          regenAmount += def.battlefieldEffect.hpRegen * (1 + (sur.skill - 1) * 0.10);
        }
      });
    } catch(e) {}
  }
  if (regenAmount > 0) {
    player.hp = Math.min(player.hp + regenAmount * dt, player.maxHp);
  }

  // 边界限制
  const mapBound = (window.currentMap === 'snow') ? SNOW_MAP_CONFIG.MAP_SIZE * 0.9 : CONFIG.MAP_SIZE * 0.9;
  camera.position.x = Math.max(-mapBound, Math.min(mapBound, camera.position.x));
  camera.position.z = Math.max(-mapBound, Math.min(mapBound, camera.position.z));

  // 拾取物品
  checkPickups(dt);

  updateHUD();
}

function checkCollision(pos) {
  const footY = pos.y - 1.7;
  const PLAYER_RADIUS = 0.4; // 玩家碰撞半径

  // [DEBUG] 碰撞日志：大门区域
  if (window.colliderLog && window.currentMap === 'island') {
    console.log('[碰撞检测] pos=', pos.x.toFixed(1), pos.z.toFixed(1), pos.y.toFixed(1), 'colliders数量=', colliders.length);
  }

  // 使用空间分区优化 - 只检查附近的碰撞器
  const nearbyColliders = getNearbyColliders(pos.x, pos.z, 15);

  for (const c of nearbyColliders) {
    // 关键修复：站在 solid 碰撞体顶部时，使用完整范围防止从边缘掉下去
    // 地面上贴墙走时，仍使用缩进范围（c.hw - PLAYER_RADIUS）
    const onTop = c.solid && (Math.abs(footY - c.topY) < 1.0 || footY > c.topY);
    const hw = onTop ? c.hw : c.hw - PLAYER_RADIUS;
    const hd = onTop ? c.hd : c.hd - PLAYER_RADIUS;

    // 检查水平范围
    if (Math.abs(pos.x - c.x) < hw && Math.abs(pos.z - c.z) < hd) {
      // 楼梯侧面墙壁（stair_wall）：始终阻挡，防止从侧面掉落
      // 但如果玩家在墙壁顶部以上，不阻挡（可以跳过墙壁）
      if (c.type === 'stair_wall') {
        if (footY > c.topY + 0.3) {
          continue; // 在墙壁上方，不阻挡
        }
        return true; // 阻挡
      }

      // 如果是solid物体（建筑墙壁），始终阻挡
      if (c.solid) {
        // 但如果在建筑物顶部（可以站上去），不阻挡
        if (Math.abs(footY - c.topY) < 1.0) {
          continue;
        }
        // 如果玩家在建筑物上方（脚底高于顶部），也不阻挡，允许站在房顶
        if (footY > c.topY) {
          continue;
        }
        return true;
      }
      
      // 非solid物体（汽车）：可跳上去的障碍物
      if (footY >= c.topY - 0.3) {
        // 脚底在车顶表面或略高：不阻挡，可以站上去
        continue;
      }
      if (footY >= c.topY - 2.0 && playerVelocity.y > 0) {
        // 正在向上跳且接近车顶：不阻挡，让玩家跳上去
        continue;
      }
      // 其他情况（脚底远低于车顶且没在跳）：阻挡
      return true;
    }
  }
  return false;
}

// 获取玩家脚底位置对应的地面高度（返回眼睛高度）
function getGroundLevel(pos) {
  let bestTop = -9999; // 玩家脚底的最佳支撑高度（初始为很低，允许负高度地形）
  const footY = pos.y - 1.7; // 玩家脚底实际高度
  
  // 雪山地形高度查询（多点空间采样平均，消除FBM噪声）
  if (window.currentMap === 'snow' && window.SnowMap && SnowMap.active) {
    const R = 0.4;
    bestTop = (
      SnowMap.getTerrainHeight(pos.x - R, pos.z - R) +
      SnowMap.getTerrainHeight(pos.x + R, pos.z - R) +
      SnowMap.getTerrainHeight(pos.x - R, pos.z + R) +
      SnowMap.getTerrainHeight(pos.x + R, pos.z + R) +
      SnowMap.getTerrainHeight(pos.x, pos.z)
    ) / 5;
  } else if (window.currentMap === 'desert') {
    bestTop = 0; // 沙漠地图完全平坦
  } else if (window.currentMap === 'island' && window.IslandBase && IslandBase.active) {
    // 海岛地图：基地内部（r<58）使用平整地面 y=0，基地外部使用FBM
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    if (dist < 58) {
      bestTop = 0; // 基地内部完全平整，地面在 y=0
    } else {
      const R = 0.4;
      bestTop = (
        IslandBase.getTerrainHeight(pos.x - R, pos.z - R) +
        IslandBase.getTerrainHeight(pos.x + R, pos.z - R) +
        IslandBase.getTerrainHeight(pos.x - R, pos.z + R) +
        IslandBase.getTerrainHeight(pos.x + R, pos.z + R) +
        IslandBase.getTerrainHeight(pos.x, pos.z)
      ) / 5;
    }
  } else if (window.currentMap === 'swamp' && window.SwampMap && SwampMap.active) {
    // 沼泽地图：多点空间采样平均，消除FBM高频噪声
    const R = 0.4;
    bestTop = (
      SwampMap.getTerrainHeight(pos.x - R, pos.z - R) +
      SwampMap.getTerrainHeight(pos.x + R, pos.z - R) +
      SwampMap.getTerrainHeight(pos.x - R, pos.z + R) +
      SwampMap.getTerrainHeight(pos.x + R, pos.z + R) +
      SwampMap.getTerrainHeight(pos.x, pos.z)
    ) / 5;
  } else {
    bestTop = 0; // 城市地图默认地面高度
  }
  
  // 优先检查楼梯斜坡高度（连续的，不会掉落）
  const stairH = getStairHeight(pos.x, pos.z, footY);
  if (stairH >= 0 && stairH > bestTop) {
    bestTop = stairH;
  }
  
  // 检查其他碰撞盒（可攀爬的平台表面）
  // 只跳过**垂直墙壁**，所有 solid 碰撞盒都允许踩顶（包括建筑、房子、高楼）
  const nearbyColliders = getNearbyColliders(pos.x, pos.z, 15);
  for (const c of nearbyColliders) {
    // 跳过垂直墙壁（这些是侧面，不是顶部）
    if (c.type === 'stair_wall' || c.type === 'wall' || c.type === 'cityWall' || c.type === 'gate') continue;
    // 其他类型（建筑、房子、高楼、岩石等）都可以踩顶
    
    // 检查玩家是否在碰撞盒水平范围内
    const inRange = Math.abs(pos.x - c.x) < c.hw && Math.abs(pos.z - c.z) < c.hd;

    // [楼顶调试] 攀爬结束后3秒内打印调试
    if (player._climbDebug && c.solid && c.topY > 2) {
      const _dx = Math.abs(pos.x - c.x);
      const _dz = Math.abs(pos.z - c.z);
      console.log('[楼顶调试] collider:', c.type, 'topY:', c.topY.toFixed(1), 'hw:', c.hw.toFixed(1), 'hd:', c.hd.toFixed(1), 'dx:', _dx.toFixed(2), '(<hw?', inRange, ')', 'dz:', _dz.toFixed(2), 'footY:', (pos.y - 1.7).toFixed(2), 'bestTop:', bestTop.toFixed(2));
    }

    if (inRange) {
      // 脚底在平台表面附近，或从上方落下
      const onSurface = Math.abs(footY - c.topY) < 0.5;
      // 只在脚底接近或高于楼顶时吸附，不允许从下方被拉上去
      const aboveSurface = footY >= c.topY - 0.1 && footY < c.topY + 3;
      
      if (onSurface && c.topY > bestTop) {
        bestTop = c.topY;
      }
    }
  }
  
  return bestTop + 1.7; // 返回眼睛高度 = 脚底 + 1.7
}

// 相机碰撞检测 - 防止视角穿透物体
function updateCameraCollision() {
  const eyePos = camera.position.clone();
  const PLAYER_EYE_RADIUS = 0.5; // 玩家头部碰撞半径（增大安全边距）

  // 方法1：检测相机位置是否在碰撞体内（球形碰撞）
  const nearbyColliders = getNearbyColliders(eyePos.x, eyePos.z, 15);
  for (const c of nearbyColliders) {
    // 跳过非solid和特殊类型
    if (!c.solid) continue;
    if (c.type === 'stair_wall') continue;

    // 城门楼使用更大的安全边距和更强的推力
    const isGateTower = c.type === 'gateTower';
    const safetyMargin = isGateTower ? 0.4 : 0.1;
    const pushMultiplier = isGateTower ? 1.5 : 1.0;

    // 检查相机是否在碰撞体水平范围内（考虑头部半径）
    const dx = Math.abs(eyePos.x - c.x);
    const dz = Math.abs(eyePos.z - c.z);
    const inHorizontal = dx < (c.hw + PLAYER_EYE_RADIUS) && dz < (c.hd + PLAYER_EYE_RADIUS);

    if (inHorizontal) {
      // 检查垂直范围：相机高度是否在碰撞体范围内
      const eyeY = eyePos.y;
      const bottomY = 0; // 地面
      const topY = c.topY + (isGateTower ? 1.0 : 0.5); // 城门楼检测范围更高

      if (eyeY >= bottomY && eyeY <= topY) {
        // [楼顶调试]
        if (player._climbDebug) {
          console.log('[楼顶调试] ⚠️ updateCameraCollision推出！', c.type, 'eyeY:', eyeY.toFixed(2), 'topY:', topY.toFixed(2), 'dx:', dx.toFixed(2), 'dz:', dz.toFixed(2));
        }
        // 相机在碰撞体内！计算推出方向
        // 找到最近的外推方向
        const pushX = (dx / c.hw) > (dz / c.hd);
        let pushDir = new THREE.Vector3();

        if (pushX) {
          // 沿X轴推出
          pushDir.x = (eyePos.x - c.x) > 0 ? 1 : -1;
          const targetDist = c.hw + PLAYER_EYE_RADIUS + safetyMargin;
          const currentDist = dx;
          const pushAmount = (targetDist - currentDist) * pushMultiplier;
          camera.position.x += pushDir.x * pushAmount;
        } else {
          // 沿Z轴推出
          pushDir.z = (eyePos.z - c.z) > 0 ? 1 : -1;
          const targetDist = c.hd + PLAYER_EYE_RADIUS + safetyMargin;
          const currentDist = dz;
          const pushAmount = (targetDist - currentDist) * pushMultiplier;
          camera.position.z += pushDir.z * pushAmount;
        }
      }
    }
  }

  // 方法2：从玩家眼睛位置向前发射射线，检测是否碰到物体前方
  const raycaster = new THREE.Raycaster();
  raycaster.camera = camera; // 必须设置camera，否则Sprite raycast会报错
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(camera.quaternion);

  raycaster.set(eyePos, forward);

  // 检测与场景物体的碰撞
  // 过滤掉parent为null的无效对象、灯光、粒子系统、Sprite，避免matrixWorld崩溃
  const validObjects = scene.children.filter(obj => {
    if (!obj || obj.parent === null) return false;
    if (obj.isLight) return false;
    if (obj.isPoints) return false;
    if (obj.isSprite) return false;
    return true;
  });
  // 自定义递归：跳过Sprite子对象，防止NPC名称标签等触发raycast错误
  const intersects = [];
  function collectIntersects(objects) {
    for (const obj of objects) {
      if (!obj || obj.isSprite) continue;
      if (obj.layers && obj.layers.test(raycaster.layers)) {
        obj.raycast(raycaster, intersects);
      }
      if (obj.children && obj.children.length > 0) {
        collectIntersects(obj.children);
      }
    }
  }
  collectIntersects(validObjects);
  intersects.sort((a, b) => a.distance - b.distance);

  for (const hit of intersects) {
    const obj = hit.object;
    // 跳过不可见物体和特殊对象
    if (!obj.visible) continue;
    if (obj.name === 'weaponModel' || obj.name === 'muzzleFlash') continue;
    if (obj.name === 'towerHPFill' || obj.name === 'towerHPBg') continue;
    if (obj.name === 'allyLabel' || obj.name === 'damageNumber') continue;
    // 跳过相机子对象（FPS武器、手臂等第一人称视图模型）
    let p = obj.parent;
    while (p) {
      if (p === camera) break;
      p = p.parent;
    }
    if (p === camera) continue;
    // 跳过islandGroup下所有视觉mesh（碰撞由addCollider碰撞盒处理，射线检测会导致误推）
    p = obj.parent;
    while (p) {
      if (p.name && p.name === 'islandGroup') break;
      p = p.parent;
    }
    if (p && p.name === 'islandGroup') continue;

    // 检测是否命中城门楼碰撞体
    const isGateTowerHit = obj.name === 'gateTower';
    const minDistance = isGateTowerHit ? 1.2 : 0.5;

    // 如果距离太近，将相机推离命中点（避免穿模）
    if (hit.distance < minDistance) {
      const pushBack = forward.clone().multiplyScalar(-(minDistance - hit.distance));
      camera.position.add(pushBack);
      break;
    }
  }
}

// 屏幕震动效果 - 委托给 CameraSystem
function screenShake(intensity, duration) {
  if (window.CameraSystem && CameraSystem.initialized) {
    CameraSystem.screenShake(intensity, duration);
  }
}

function damagePlayer(amount) {
  // 检查无敌BUFF和调试无敌模式
  if (player.activeBuffs && player.activeBuffs.invincible) {
    return; // 无敌状态不受伤害
  }
  if (player.godMode) {
    return; // 调试模式无敌
  }

  // 确保护盾字段存在且有效
  if (typeof player.shield !== 'number' || isNaN(player.shield)) player.shield = 0;
  if (typeof player.maxShield !== 'number' || isNaN(player.maxShield)) player.maxShield = 50;
  if (typeof player.lastShieldDamageTime !== 'number' || isNaN(player.lastShieldDamageTime)) player.lastShieldDamageTime = -999;

  // 护盾优先吸收伤害
  let remainingDamage = amount;
  // 使用 > 0 判断，避免 NaN 导致的问题
  const hasShield = player.shield > 0;
  if (hasShield) {
    const shieldAbsorb = Math.min(player.shield, remainingDamage);
    player.shield -= shieldAbsorb;
    remainingDamage -= shieldAbsorb;
    // 护盾受损时记录时间（用于延迟回复）
    if (shieldAbsorb > 0) {
      player.lastShieldDamageTime = surviveTime;
    }
    // 护盾被击破时震动（护盾归零且伤害有剩余）
    const shieldBroken = player.shield <= 0 && remainingDamage > 0;
    if (shieldBroken) {
      screenShake(3, 0.2);
    }
  }
  
  if (remainingDamage <= 0) return; // 护盾完全吸收
  
  const totalArmor = Math.min(player.armor, 0.8); // player.armor 已包含所有加成，无需再加 stats.armor
  const actual = remainingDamage * (1 - totalArmor);
  player.hp -= actual;
  
  // 播放受伤音效
  if(window.AudioSystem)AudioSystem.playSound('player_hit');
  
  document.getElementById('damage-flash').style.opacity = '1';
  setTimeout(() => { document.getElementById('damage-flash').style.opacity = '0'; }, 150);
  
  // 检查死亡（包括NaN情况）
  const isDead = player.hp <= 0 || (typeof player.hp !== 'number') || isNaN(player.hp);
  if (isDead) {
    player.hp = 0;
    gameOver();
  }
}

// 计算敌人攻击伤害（含天气倍率）
function getEnemyDamage(enemy, baseDamageMult = 1) {
  const weatherDamageMult = enemy.damageMult || 1;
  const waveDamageMult = 1 + (wave - 1) * 0.05;
  return enemy.def.damage * baseDamageMult * waveDamageMult * weatherDamageMult;
}

// ============================================================
// 电力护盾系统
// ============================================================

// 护盾充能（由shelter-ui.js触发）
function chargeShield() {
  if (!player) return;
  player.shield = player.maxShield;
  player.lastShieldDamageTime = -999; // 重置受击时间，立即开始回复
  screenShake(2, 0.1);
  // 显示充能特效（使用camera.position代替player.mesh.position）
  if (typeof showEMPVisual === 'function') showEMPVisual(camera.position, '#3498db', 8);
}

// 战场充能积累（战场侧每波次/击杀调用）
let chargeAccumulator = 0;
function accumulateBattlefieldCharge(amount) {
  chargeAccumulator += amount;
  // 每累计1点就通知shelter系统
  if (chargeAccumulator >= 1) {
    const toAdd = Math.floor(chargeAccumulator);
    chargeAccumulator -= toAdd;
    if (typeof ShelterSystem !== 'undefined' && ShelterSystem.addBattlefieldCharge) {
      ShelterSystem.addBattlefieldCharge(toAdd);
    }
  }
}

// ============================================================
// 电磁脉冲系统
// ============================================================
const EMP_RANGE = 100; // 100米范围
const EMP_DURATION = 3; // 麻痹3秒

// EMP视觉效果
function showEMPVisual(pos, color, radius) {
  if (!scene) return;
  // 冲击波环
  const ringGeo = new THREE.RingGeometry(0.1, radius, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos);
  ring.position.y = 0.5;
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);
  
  // 向上扩散动画
  let scale = 0.1;
  let opacity = 0.8;
  const expandAnim = setInterval(() => {
    scale += 0.15;
    opacity -= 0.06;
    if (opacity <= 0) {
      clearInterval(expandAnim);
      scene.remove(ring);
      ringGeo.dispose();
      ringMat.dispose();
      return;
    }
    ring.scale.set(scale, scale, 1);
    ringMat.opacity = opacity;
  }, 50);
  
  // 放电粒子
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const pGeo = new THREE.SphereGeometry(0.3, 4, 4);
    const pMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.8 });
    const p = new THREE.Mesh(pGeo, pMat);
    p.position.copy(pos);
    p.position.y = 0.5;
    p.position.x += Math.cos(angle) * 1;
    p.position.z += Math.sin(angle) * 1;
    scene.add(p);
    
    const targetX = pos.x + Math.cos(angle) * radius * 0.9;
    const targetZ = pos.z + Math.sin(angle) * radius * 0.9;
    let t = 0;
    const moveAnim = setInterval(() => {
      t += 0.05;
      if (t >= 1) {
        clearInterval(moveAnim);
        scene.remove(p);
        pGeo.dispose();
        pMat.dispose();
        return;
      }
      p.position.x = pos.x + Math.cos(angle) * (1 + (targetX - pos.x) * t);
      p.position.z = pos.z + Math.sin(angle) * (1 + (targetZ - pos.z) * t);
      p.position.y = 0.5 + Math.sin(t * Math.PI * 3) * 2;
      pMat.opacity = 0.8 - t * 0.8;
    }, 30);
  }
}

// 触发EMP（由shelter-ui.js触发）
function triggerEMP() {
  if (!player) return;
  
  const playerPos = camera.position.clone();
  let empCount = 0;
  
  // 遍历所有敌人，对100米内敌人施加麻痹效果
  enemies.forEach(e => {
    if (e.dead || !e.mesh) return;
    const dist = playerPos.distanceTo(e.mesh.position);
    if (dist <= EMP_RANGE) {
      e.empParalyzed = true;
      e.empParalyzeTimer = EMP_DURATION;
      empCount++;
    }
  });
  
  // 视觉效果
  showEMPVisual(playerPos, '#9b59b6', EMP_RANGE);
  if(window.AudioSystem)AudioSystem.playSound('grenade_explosion');
  screenShake(5, 0.3);
  console.log(`[EMP] 麻痹了 ${empCount} 个敌人`);
}

// ============================================================
// 工事紧急修复（由shelter-ui.js触发）
// ============================================================
function repairAllFortifications() {
  if (typeof FortificationSystem !== 'undefined' && FortificationSystem.repairAll) {
    FortificationSystem.repairAll(0.5); // 回复50%耐久
  }
}

// ============================================================
// FPS武器系统（第一人称手持武器 + 动画）
// ============================================================
let weaponMesh;
let rightArmMesh = null;   // 右臂独立Group
let leftArmMesh = null;    // 左臂独立Group（camera子对象）
let _leftArmBasePos = null; // 左手初始局部位置（换弹偏移基准）
let rightArmGripOffset = { pos: new THREE.Vector3(), rot: new THREE.Euler() };
let leftArmGripOffset = { pos: new THREE.Vector3(), rot: new THREE.Euler() };
let _lastArmMaterials = null;  // 存储手臂材质，供换弹时临时创建手臂用
let _reloadLeftArm = null;     // 手枪换弹时临时创建的左手
let muzzleFlashLight = null;
let muzzleFlashMesh = null;
let weaponRecoil = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, timer: 0 };
let weaponSway = { x: 0, y: 0, timer: 0 };
let muzzleFlashTimer = 0;
let bulletTrails = [];      // 弹道轨迹数组
let barrelTipLocal = null;  // 当前武器枪管末端在weaponGroup本地坐标

// 创建弹道轨迹（从枪口沿射击方向延伸）
// 返回 trail mesh，调用者可以保存到 bullet.trail 以便碰撞时立即清理
function createBulletTrail(origin, direction, length) {
  if (!origin || !direction) return null;
  const mid = origin.clone().add(direction.clone().multiplyScalar(length / 2));
  const trailGeo = new THREE.CylinderGeometry(0.006, 0.006, length, 4);
  trailGeo.rotateX(Math.PI / 2);
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0xddaa55,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const trail = new THREE.Mesh(trailGeo, trailMat);
  trail.position.copy(mid);
  trail.lookAt(origin.clone().add(direction));
  scene.add(trail);
  bulletTrails.push({ mesh: trail, life: 0.12, opacity: 0.55 });
  return trail;
}

// 清理与子弹绑定的弹道轨迹
function cleanupBulletTrail(b) {
  if (b.trail) {
    scene.remove(b.trail);
    const idx = bulletTrails.findIndex(t => t.mesh === b.trail);
    if (idx >= 0) bulletTrails.splice(idx, 1);
    if (b.trail.material) b.trail.material.dispose();
    if (b.trail.geometry) b.trail.geometry.dispose();
    b.trail = null;
  }
}

function updateBulletTrails(dt) {
  for (let i = bulletTrails.length - 1; i >= 0; i--) {
    const t = bulletTrails[i];
    t.life -= dt;
    if (t.life <= 0) {
      scene.remove(t.mesh);
      if (t.mesh.material) t.mesh.material.dispose();
      if (t.mesh.geometry) t.mesh.geometry.dispose();
      bulletTrails.splice(i, 1);
    } else {
      t.mesh.material.opacity = t.opacity * (t.life / 0.12);
    }
  }
}

// ---- 独立手臂创建函数（手掌对齐握把，前臂+上臂从画面下方伸入） ----
// 坐标系：armGroup 原点 = 手掌中心 = 握把/护木位置
// 手臂关节从手掌→手腕→前臂→肘部→上臂→肩部，向后下方延伸
// 在视野中可以看到：手掌握住武器 + 手腕 + 前臂下段 + 袖子从画面底部伸入
function createArm(isLeft, armMaterials) {
  const armGroup = new THREE.Group();
  const side = isLeft ? 1 : -1;
  const { glove, skin, sleeve } = armMaterials;

  // === 手掌在原点（调用者将其对齐到握把）===
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.04), glove);
  armGroup.add(palm);

  // 四指（向前下方环绕握把）
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.007, 0.02), glove);
    finger.position.set((i - 1.5) * 0.011, -0.008, -0.018);
    armGroup.add(finger);
  }

  // 拇指（内侧）
  const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.009, 0.016), glove);
  thumb.position.set(side * 0.028, -0.002, -0.005);
  thumb.rotation.z = side * 0.45;
  armGroup.add(thumb);

  // === 手腕（短圆柱，连接手掌和前臂）===
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.026, 0.025, 8), skin);
  wrist.position.set(side * 0.005, 0.005, 0.035);
  armGroup.add(wrist);

  // === 前臂：从手腕向后下方延伸（朝向玩家身体，消失在画面底部）===
  const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 0.12, 8), sleeve);
  forearm.position.set(side * 0.015, -0.02, 0.08);
  forearm.rotation.x = 2.2; // 指向下方和后方（+z方向，朝玩家身体）
  armGroup.add(forearm);

  // === 肘关节 ===
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), sleeve);
  elbow.position.set(side * 0.020, -0.07, 0.17);
  armGroup.add(elbow);

  // === 上臂：从肘部向肩膀，更陡峭地向下方后方 ===
  const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.15, 8), sleeve);
  upperArm.position.set(side * 0.028, -0.14, 0.28);
  upperArm.rotation.x = 2.4;
  armGroup.add(upperArm);

  // === 肩部/袖子顶端（在画面底部之外）===
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.05, 8), sleeve);
  shoulder.position.set(side * 0.035, -0.23, 0.40);
  shoulder.rotation.x = 2.5;
  armGroup.add(shoulder);

  return armGroup;
}

// ---- 左手模型（FPS非主手：一体化粗壮前臂+手掌握枪） ----
// 单段连续圆柱从手掌延伸到画面下方，球体底部过渡，无断裂弯曲
function createLeftHand(armMaterials) {
  const armGroup = new THREE.Group();
  const { glove, skin } = armMaterials;

  // === 手掌：宽大，从左侧包裹武器 ===
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.05, 0.14), glove);
  armGroup.add(palm);

  // 四指
  for (let i = 0; i < 4; i++) {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.026, 0.030), glove);
    finger.position.set(0.105, -0.012, (i - 1.5) * 0.032);
    armGroup.add(finger);
  }

  // 拇指
  const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.032, 0.035), glove);
  thumb.position.set(0.082, 0.032, 0.015);
  thumb.rotation.z = 0.3;
  armGroup.add(thumb);

  // === 前臂：一体化长圆柱，从手掌后端连续延伸到画面下方 ===
  // 手腕细(r=0.055) → 向下逐渐加粗(r=0.10)，长度0.28
  const forearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.10, 0.28, 12),
    skin
  );
  forearm.position.set(-0.02, -0.16, 0.03);
  forearm.rotation.x = 0.18;
  armGroup.add(forearm);

  // === 底部球体过渡：平滑收尾，消失在画面外 ===
  const elbowCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 12, 12),
    skin
  );
  elbowCap.position.set(-0.03, -0.32, 0.06);
  armGroup.add(elbowCap);

  // 整体向左倾斜
  armGroup.rotation.z = -0.18;

  return armGroup;
}

function createWeaponModel() {
  // 清理旧模型
  if (weaponMesh) {
    if (camera) camera.remove(weaponMesh);
    weaponMesh = null;
  }
  if (rightArmMesh) {
    if (camera) camera.remove(rightArmMesh);
    rightArmMesh = null;
  }
  if (leftArmMesh) {
    if (camera) camera.remove(leftArmMesh);
    leftArmMesh = null;
  }
  _leftArmBasePos = null;
  rightArmGripOffset.pos.set(0, 0, 0);
  rightArmGripOffset.rot.set(0, 0, 0);
  leftArmGripOffset.pos.set(0, 0, 0);
  leftArmGripOffset.rot.set(0, 0, 0);
  if (muzzleFlashLight) {
    if (camera) camera.remove(muzzleFlashLight);
    muzzleFlashLight = null;
  }
  if (muzzleFlashMesh) {
    if (camera) camera.remove(muzzleFlashMesh);
    muzzleFlashMesh = null;
  }
  if (_reloadLeftArm) {
    if (camera) camera.remove(_reloadLeftArm);
    _reloadLeftArm = null;
  }
  barrelTipLocal = null;
  // 重置后坐力状态，避免换武器后残留
  weaponRecoil.x = 0; weaponRecoil.y = 0; weaponRecoil.z = 0;
  weaponRecoil.rotX = 0; weaponRecoil.rotY = 0; weaponRecoil.timer = 0;

  if (!camera) { console.warn('[createWeaponModel] camera 未初始化'); return; }
  if (!Array.isArray(weapons) || weapons.length === 0 || currentWeaponIndex < 0 || currentWeaponIndex >= weapons.length) {
    console.warn('[createWeaponModel] 武器数据无效'); return;
  }

  const w = weapons[currentWeaponIndex];
  const group = new THREE.Group();
  group.name = 'fpsWeapon';

  // 材质定义
  const darkMetal = new THREE.MeshBasicMaterial({ color: 0x3a3a3a });
  const metal = new THREE.MeshBasicMaterial({ color: 0x5a5a5a });
  const lightMetal = new THREE.MeshBasicMaterial({ color: 0x888888 });
  const barrelMetal = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });
  const wood = new THREE.MeshBasicMaterial({ color: 0x5a3a1a });
  const darkWood = new THREE.MeshBasicMaterial({ color: 0x3d2510 });
  const accent = new THREE.MeshBasicMaterial({ color: w.color || 0x666666 });
  const black = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
  // 手臂/手套材质
  const sleeve = new THREE.MeshBasicMaterial({ color: 0x3d4a2e });  // 军绿袖子
  const glove = new THREE.MeshBasicMaterial({ color: 0x2a2a2a });   // 深灰手套
  const skin = new THREE.MeshBasicMaterial({ color: 0xc4956a });    // 肤色
  const armMaterials = { glove, skin, sleeve };
  _lastArmMaterials = armMaterials; // 保存供换弹时临时创建手臂用

  // ============ 手枪 ============
  if (w.name === '手枪') {
    // 套筒（slide）
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.16), darkMetal);
    slide.position.set(0, 0.018, -0.03);
    group.add(slide);
    // 套筒锯齿
    for (let i = 0; i < 4; i++) {
      const serr = new THREE.Mesh(new THREE.BoxGeometry(0.041, 0.005, 0.006), lightMetal);
      serr.position.set(0, 0.04, 0.02 + i * 0.008);
      group.add(serr);
    }
    // 枪管
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.14, 8), barrelMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.018, -0.16);
    group.add(barrel);
    // 枪身框架
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.025, 0.08), metal);
    frame.position.set(0, -0.005, 0.01);
    group.add(frame);
    // 握把
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.09, 0.04), wood);
    grip.position.set(0, -0.04, 0.03);
    grip.rotation.x = 0.2;
    group.add(grip);
    // 握把纹理
    for (let i = 0; i < 3; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.033, 0.003, 0.003), darkWood);
      line.position.set(0, -0.02 + i * 0.025, 0.04);
      line.rotation.x = 0.2;
      group.add(line);
    }
    // 扳机护圈
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 4, 8, Math.PI), metal);
    guard.position.set(0, -0.008, 0.0);
    guard.rotation.y = Math.PI / 2;
    group.add(guard);
    // 扳机
    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.015, 0.005), black);
    trigger.position.set(0, -0.01, 0.0);
    group.add(trigger);
    // 击锤
    const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.015, 0.01), darkMetal);
    hammer.position.set(0, 0.025, 0.06);
    group.add(hammer);
    // 准星
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.008, 0.006), black);
    frontSight.position.set(0, 0.038, -0.11);
    group.add(frontSight);
    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.006), black);
    rearSight.position.set(0, 0.038, 0.04);
    group.add(rearSight);
    // 弹匣底座
    const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.01, 0.04), darkMetal);
    magBase.position.set(0, -0.08, 0.045);
    magBase.rotation.x = 0.2;
    group.add(magBase);

    // 右臂作为camera子对象（手枪单手持握）
    rightArmMesh = createArm(false, armMaterials);
    rightArmMesh.position.set(0.06, -0.04, 0.03);
    rightArmMesh.rotation.set(0.2, 0, -0.05);
    camera.add(rightArmMesh);
    rightArmGripOffset.pos.set(0.06, -0.04, 0.03);
    rightArmGripOffset.rot.set(0.2, 0, -0.05);
    leftArmMesh = null; // 单手持握

    group.position.set(0.08, -0.22, -0.28);
    barrelTipLocal = new THREE.Vector3(0, 0.018, -0.23);
  }

  // ============ 冲锋枪 ============
  else if (w.name === '冲锋枪') {
    // 机匣（下机匣）
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.2), metal);
    receiver.position.set(0, 0.025, -0.02);
    group.add(receiver);
    // 上机匣（分隔线明显）
    const upperReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.16), darkMetal);
    upperReceiver.position.set(0, 0.058, -0.03);
    group.add(upperReceiver);
    // 抛壳窗
    const ejectPort = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.025), black);
    ejectPort.position.set(0.024, 0.045, 0.0);
    group.add(ejectPort);
    // 枪管
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.013, 0.22, 8), barrelMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.025, -0.22);
    group.add(barrel);
    // 消焰器
    const fh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.04, 8), darkMetal);
    fh.rotation.x = Math.PI / 2;
    fh.position.set(0, 0.025, -0.35);
    group.add(fh);
    // 护木
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.047, 0.045, 0.16), accent);
    handguard.position.set(0, 0.015, -0.14);
    group.add(handguard);
    // 护木散热孔
    for (let i = 0; i < 3; i++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.008, 0.03), black);
      vent.position.set(0.02, 0.015, -0.18 + i * 0.04);
      group.add(vent);
      const vent2 = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.008, 0.03), black);
      vent2.position.set(-0.02, 0.015, -0.18 + i * 0.04);
      group.add(vent2);
    }
    // 弹匣井（区分弹匣和握把的区域）
    const magWell = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.015, 0.035), darkMetal);
    magWell.position.set(0, -0.01, 0.02);
    group.add(magWell);
    // 弹匣
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.12, 0.04), darkMetal);
    mag.position.set(0, -0.05, 0.02);
    mag.rotation.x = 0.3;
    group.add(mag);
    // 弹匣卡榫
    const magCatch = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.008), lightMetal);
    magCatch.position.set(0.025, -0.015, 0.02);
    group.add(magCatch);
    // 扳机护圈
    const trigGuard = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 4, 8, Math.PI), metal);
    trigGuard.position.set(0, -0.008, 0.02);
    trigGuard.rotation.y = Math.PI / 2;
    group.add(trigGuard);
    // 握把（更清晰的主体）
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.08, 0.04), black);
    grip.position.set(0, -0.04, 0.05);
    grip.rotation.x = 0.25;
    group.add(grip);
    // 握把防滑纹
    for (let i = 0; i < 3; i++) {
      const gLine = new THREE.Mesh(new THREE.BoxGeometry(0.033, 0.004, 0.005), darkMetal);
      gLine.position.set(0, -0.06 + i * 0.018, 0.065);
      gLine.rotation.x = 0.25;
      group.add(gLine);
    }
    // 枪托
    const stockBase = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 0.08), darkMetal);
    stockBase.position.set(0, 0.03, 0.14);
    group.add(stockBase);
    const stockBar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), metal);
    stockBar.rotation.x = Math.PI / 2;
    stockBar.position.set(0.015, 0.03, 0.22);
    group.add(stockBar);
    const stockBar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), metal);
    stockBar2.rotation.x = Math.PI / 2;
    stockBar2.position.set(-0.015, 0.03, 0.22);
    group.add(stockBar2);
    const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.02), black);
    stockPad.position.set(0, 0.03, 0.28);
    group.add(stockPad);
    // 机匣顶部导轨
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.006, 0.12), darkMetal);
    rail.position.set(0, 0.07, -0.02);
    group.add(rail);
    // 准星
    const fs = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.02, 6), black);
    fs.position.set(0, 0.06, -0.18);
    group.add(fs);
    const rs = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.01, 0.01), black);
    rs.position.set(0, 0.06, 0.06);
    group.add(rs);

    // 右臂+左臂作为camera子对象（冲锋枪双手持握）
    rightArmMesh = createArm(false, armMaterials);
    rightArmMesh.position.set(0.06, -0.04, 0.05);
    rightArmMesh.rotation.set(0.25, 0, -0.05);
    camera.add(rightArmMesh);
    rightArmGripOffset.pos.set(0.06, -0.04, 0.05);
    rightArmGripOffset.rot.set(0.25, 0, -0.05);
    // 左手作为camera子对象，握持护木（手掌在护木左侧包裹）
    // x=-0.05让手掌右边缘(x=0.08)直接贴合护木左侧，消除空隙
    leftArmMesh = createLeftHand(armMaterials);
    camera.add(leftArmMesh);
    leftArmGripOffset.pos.set(-0.10, -0.01, -0.14);
    leftArmGripOffset.rot.set(0.0, 0, 0.12);
    _leftArmBasePos = null;

    group.position.set(0.08, -0.2, -0.35);
    barrelTipLocal = new THREE.Vector3(0, 0.025, -0.33);
  }

  // ============ 霰弹枪 ============
  else if (w.name === '霰弹枪') {
    // 枪管
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.4, 8), barrelMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.028, -0.22);
    group.add(barrel);
    // 机匣
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.14), metal);
    receiver.position.set(0, 0.025, 0.05);
    group.add(receiver);
    // 泵动护木（包裹枪管下方，更粗更立体）
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.058, 0.16), wood);
    pump.position.set(0, -0.008, -0.14);
    group.add(pump);
    // 泵动防滑纹理（横向凸起）
    for (let i = 0; i < 6; i++) {
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.008, 0.010), darkWood);
      ridge.position.set(0, -0.008, -0.20 + i * 0.022);
      group.add(ridge);
    }
    // 握把
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.045), wood);
    grip.position.set(0, -0.04, 0.06);
    grip.rotation.x = 0.22;
    group.add(grip);
    // 枪托
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.16), wood);
    stock.position.set(0, 0.025, 0.18);
    group.add(stock);
    // 托底板
    const buttPad = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.015), black);
    buttPad.position.set(0, 0.025, 0.27);
    group.add(buttPad);
    // 扳机护圈
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 4, 8, Math.PI), metal);
    guard.position.set(0, -0.01, 0.02);
    guard.rotation.y = Math.PI / 2;
    group.add(guard);
    // 准星珠
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 4), lightMetal);
    bead.position.set(0, 0.04, -0.4);
    group.add(bead);

    // 右臂+左臂作为camera子对象（霰弹枪双手持握）
    rightArmMesh = createArm(false, armMaterials);
    rightArmMesh.position.set(0.06, -0.04, 0.06);
    rightArmMesh.rotation.set(0.22, 0, -0.05);
    camera.add(rightArmMesh);
    rightArmGripOffset.pos.set(0.06, -0.04, 0.06);
    rightArmGripOffset.rot.set(0.22, 0, -0.05);
    // 左手拖住前部枪托：左手在泵动护木前方，托住枪管下方
    leftArmMesh = createLeftHand(armMaterials);
    camera.add(leftArmMesh);
    leftArmGripOffset.pos.set(-0.05, -0.01, -0.22);
    leftArmGripOffset.rot.set(0.0, 0, 0.15);
    _leftArmBasePos = null;

    group.position.set(0.08, -0.2, -0.4);
    barrelTipLocal = new THREE.Vector3(0, 0.025, -0.42);
  }

  // ============ 狙击枪 ============
  else if (w.name === '狙击枪') {
    // 枪管
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.5, 8), barrelMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.025, -0.28);
    group.add(barrel);
    // 制退器
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.014, 0.06, 8), darkMetal);
    brake.rotation.x = Math.PI / 2;
    brake.position.set(0, 0.025, -0.55);
    group.add(brake);
    // 机匣
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.18), metal);
    receiver.position.set(0, 0.03, 0.0);
    group.add(receiver);
    // 枪机
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), lightMetal);
    bolt.rotation.x = Math.PI / 2;
    bolt.position.set(0.03, 0.03, 0.02);
    group.add(bolt);
    const boltHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.04, 6), lightMetal);
    boltHandle.position.set(0.06, 0.03, 0.02);
    group.add(boltHandle);
    // 瞄准镜
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 8), darkMetal);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.078, -0.02);
    group.add(scopeTube);
    const scopeLens = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 12), black);
    scopeLens.rotation.x = Math.PI / 2;
    scopeLens.position.set(0, 0.078, -0.08);
    group.add(scopeLens);
    const scopeRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 6, 8), metal);
    scopeRing1.position.set(0, 0.078, 0.0);
    group.add(scopeRing1);
    const scopeRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.003, 6, 8), metal);
    scopeRing2.position.set(0, 0.078, -0.05);
    group.add(scopeRing2);
    // 弹匣（更靠下，避免与握把重叠）
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.10, 0.035), darkMetal);
    mag.position.set(0, -0.055, 0.0);
    mag.rotation.x = 0.12;
    group.add(mag);
    // 握把（更靠后，与弹匣错开）
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.033, 0.09, 0.04), wood);
    grip.position.set(0, -0.05, 0.08);
    grip.rotation.x = 0.22;
    group.add(grip);
    // 枪托
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.045, 0.2), wood);
    stock.position.set(0, 0.025, 0.18);
    group.add(stock);
    const cheekPiece = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.08), darkWood);
    cheekPiece.position.set(0, 0.055, 0.16);
    group.add(cheekPiece);
    const buttPad = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.05, 0.018), black);
    buttPad.position.set(0, 0.025, 0.29);
    group.add(buttPad);
    // 双脚架（折叠）
    const bipodLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 6), darkMetal);
    bipodLeg1.position.set(0.025, -0.05, -0.15);
    bipodLeg1.rotation.z = 0.3;
    group.add(bipodLeg1);
    const bipodLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 6), darkMetal);
    bipodLeg2.position.set(-0.025, -0.05, -0.15);
    bipodLeg2.rotation.z = -0.3;
    group.add(bipodLeg2);

    // 右臂+左臂（狙击枪双手持握）
    // 右手握握把：rotation.z=-0.08向内倾斜，前臂自然指向身体
    rightArmMesh = createArm(false, armMaterials);
    rightArmMesh.position.set(0.06, -0.04, 0.05);
    rightArmMesh.rotation.set(0.2, 0, -0.08);
    camera.add(rightArmMesh);
    rightArmGripOffset.pos.set(0.06, -0.04, 0.05);
    rightArmGripOffset.rot.set(0.2, 0, -0.08);
    // 左手握住前护木：标准狙击姿势，左手在双脚架附近稳定枪身
    leftArmMesh = createLeftHand(armMaterials);
    camera.add(leftArmMesh);
    leftArmGripOffset.pos.set(-0.10, -0.01, -0.20);
    leftArmGripOffset.rot.set(0.0, 0, 0.12);
    _leftArmBasePos = null;

    group.position.set(0.08, -0.18, -0.48);
    barrelTipLocal = new THREE.Vector3(0, 0.025, -0.58);
  }

  // ============ 手雷（M67式菠萝形） ============
  else if (w.isGrenade) {
    const grenadeMat = new THREE.MeshBasicMaterial({ color: 0x3a5a2a });
    const metalMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const darkMetalMat = new THREE.MeshBasicMaterial({ color: 0x555555 });

    // 主体：椭圆球体（菠萝形）
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 10),
      grenadeMat
    );
    body.scale.set(1, 0.75, 1.15);
    group.add(body);

    // 棱纹：横向环绕的凸起条纹（模拟菠萝纹）
    for (let i = 0; i < 6; i++) {
      const yPos = -0.025 + i * 0.012;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.038 - Math.abs(yPos) * 0.15, 0.003, 6, 16),
        new THREE.MeshBasicMaterial({ color: 0x335022 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = yPos;
      group.add(ring);
    }

    // 引信座：顶部圆柱形金属座
    const fuseBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.025, 10),
      darkMetalMat
    );
    fuseBase.position.y = 0.035;
    group.add(fuseBase);

    // 引信头：小圆柱
    const fuseHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.015, 0.015, 8),
      metalMat
    );
    fuseHead.position.y = 0.055;
    group.add(fuseHead);

    // 拉环：金属圆环，挂在引信侧面
    const pin = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.004, 8, 14, Math.PI * 1.3),
      new THREE.MeshBasicMaterial({ color: 0xcccccc })
    );
    pin.position.set(0.02, 0.045, 0.02);
    pin.rotation.set(0.3, 0.5, 0.8);
    group.add(pin);

    // 安全销杠杆：小金属杆
    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.008, 0.035),
      metalMat
    );
    lever.position.set(0, 0.04, -0.015);
    group.add(lever);

    // 握柄：底部方便握持的凸起
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.04, 8),
      new THREE.MeshBasicMaterial({ color: 0x4a3525 })
    );
    grip.position.y = -0.035;
    group.add(grip);

    // 右臂作为camera子对象（手雷单手持握）
    rightArmMesh = createArm(false, armMaterials);
    rightArmMesh.position.set(0.06, -0.04, 0);
    rightArmMesh.rotation.set(0.15, 0, -0.05);
    camera.add(rightArmMesh);
    rightArmGripOffset.pos.set(0.06, -0.04, 0);
    rightArmGripOffset.rot.set(0.15, 0, -0.05);
    leftArmMesh = null;

    group.position.set(0.08, -0.22, -0.35);
    barrelTipLocal = null; // 手雷没有枪口
  }

  // ============ 默认 ============
  else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.4), accent);
    group.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.3, 8), barrelMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.3);
    group.add(barrel);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.06), wood);
    grip.position.set(0, -0.08, 0.05);
    grip.rotation.x = 0.2;
    group.add(grip);
    rightArmMesh = createArm(false, armMaterials);
    rightArmMesh.position.set(0.06, -0.08, 0.05);
    rightArmMesh.rotation.set(0.2, 0, -0.05);
    camera.add(rightArmMesh);
    rightArmGripOffset.pos.set(0.06, -0.08, 0.05);
    rightArmGripOffset.rot.set(0.2, 0, -0.05);
    leftArmMesh = null;
    group.position.set(0.08, -0.22, -0.4);
    barrelTipLocal = new THREE.Vector3(0, 0.02, -0.45);
  }

  camera.add(group);
  weaponMesh = group;
  weaponMesh.visible = true;
  weaponMesh.updateMatrixWorld(true);
  // 手臂可见性
  if (rightArmMesh) rightArmMesh.visible = true;
  if (leftArmMesh) leftArmMesh.visible = true;

  // 创建枪口闪光（附加到武器group）
  initWeaponMuzzleFlash();
}

// 初始化武器枪口闪光 - 附加到weaponMesh子组
function initWeaponMuzzleFlash() {
  // 点光源
  muzzleFlashLight = new THREE.PointLight(0xffaa33, 0, 4);
  // 默认位置：如果barrelTipLocal存在则用其z值
  const flashZ = barrelTipLocal ? barrelTipLocal.z : -0.55;
  muzzleFlashLight.position.set(0, 0.02, flashZ);
  if (weaponMesh) {
    weaponMesh.add(muzzleFlashLight);
  } else {
    camera.add(muzzleFlashLight);
  }

  // 发光平面
  const flashGeo = new THREE.PlaneGeometry(0.1, 0.1);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffdd66,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
  muzzleFlashMesh.position.set(0, 0.02, flashZ);
  if (weaponMesh) {
    weaponMesh.add(muzzleFlashMesh);
  } else {
    camera.add(muzzleFlashMesh);
  }
}

// 触发枪口闪光
function triggerMuzzleFlash() {
  if (!muzzleFlashLight || !muzzleFlashMesh) return;
  muzzleFlashTimer = 0.05;
  muzzleFlashLight.intensity = 3;
  muzzleFlashMesh.material.opacity = 0.9;
  muzzleFlashMesh.rotation.z = Math.random() * Math.PI;
  const s = 0.8 + Math.random() * 0.6;
  muzzleFlashMesh.scale.set(s, s, s);
}

// 更新枪口闪光
function updateMuzzleFlash(dt) {
  if (muzzleFlashTimer > 0) {
    muzzleFlashTimer -= dt;
    if (muzzleFlashTimer <= 0) {
      muzzleFlashTimer = 0;
      if (muzzleFlashLight) muzzleFlashLight.intensity = 0;
      if (muzzleFlashMesh) muzzleFlashMesh.material.opacity = 0;
    }
  }
}

// 应用后坐力
function applyRecoil(intensity) {
  if (!weaponMesh) return;
  weaponRecoil.z = intensity * 0.08;      // 向后
  weaponRecoil.y = intensity * 0.03;      // 向上
  weaponRecoil.rotX = intensity * 0.15;   // 上抬旋转
  weaponRecoil.rotY = (Math.random() - 0.5) * intensity * 0.05; // 左右随机
  weaponRecoil.timer = 0.15; // 恢复时间
}

// 更新武器动画（呼吸 + 后坐力恢复 + 晃动 + 收起过渡 + 投弹 + 开镜）
function updateWeaponAnimation(dt, time) {
  // ====== 1. 处理收起/拿出过渡动画 ======
  if (holsterAnim.active) {
    holsterAnim.t += holsterAnim.dir * dt * 4; // 过渡速度
    if (holsterAnim.t >= 1) {
      holsterAnim.t = 1;
      holsterAnim.active = false;
      weaponHolstered = true;
      if (weaponMesh) weaponMesh.visible = false;
      if (rightArmMesh) rightArmMesh.visible = false;
      if (leftArmMesh) leftArmMesh.visible = false;
      // 创建并显示空手双手
      if (!handsMesh) createHandsModel();
      if (handsMesh) handsMesh.visible = true;
    } else if (holsterAnim.t <= 0) {
      holsterAnim.t = 0;
      holsterAnim.active = false;
      weaponHolstered = false;
      if (handsMesh) handsMesh.visible = false;
      if (weaponMesh) weaponMesh.visible = true;
      if (rightArmMesh) rightArmMesh.visible = true;
      if (leftArmMesh) leftArmMesh.visible = true;
    }
  }

  // 插值系数 (0=完全拿出, 1=完全收起)
  const holsterT = holsterAnim.t;

  // 保险：确保非换弹状态时清理临时左手（防止残留）
  if (!player.isReloading && _reloadLeftArm) {
    camera.remove(_reloadLeftArm);
    _reloadLeftArm = null;
  }

  // ====== 2. 更新武器模型位置和动画 ======
  if (weaponMesh && weaponMesh.visible) {
    const w = weapons[currentWeaponIndex];
    let basePos = { x: 0.10, y: -0.15, z: -0.4 };
    if (w.name === '手枪') basePos = { x: 0.10, y: -0.11, z: -0.28 };
    else if (w.name === '冲锋枪') basePos = { x: 0.10, y: -0.10, z: -0.32 };
    else if (w.name === '霰弹枪') basePos = { x: 0.10, y: -0.09, z: -0.38 };
    else if (w.name === '狙击枪') basePos = { x: 0.10, y: -0.08, z: -0.42 };
    else if (w.isGrenade) basePos = { x: 0.10, y: -0.15, z: -0.35 };

    // 呼吸效果
    const breatheX = Math.sin(time * 1.5) * 0.003;
    const breatheY = Math.cos(time * 1.2) * 0.004;

    // 移动时武器晃动
    const isMoving = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'];
    let swayX = 0, swayY = 0;
    if (isMoving) {
      swayX = Math.sin(time * 8) * 0.008;
      swayY = Math.cos(time * 6) * 0.006;
    }

    // 后坐力恢复
    if (weaponRecoil.timer > 0) {
      weaponRecoil.timer -= dt;
      weaponRecoil.z *= 0.85;
      weaponRecoil.y *= 0.85;
      weaponRecoil.rotX *= 0.85;
      weaponRecoil.rotY *= 0.85;
    } else {
      weaponRecoil.z = 0; weaponRecoil.y = 0;
      weaponRecoil.rotX = 0; weaponRecoil.rotY = 0;
    }

    // 狙击镜开镜武器动画（武器贴脸）
    let scopeOffset = { x: 0, y: 0, z: 0, rotX: 0 };
    if (isAiming && w.name === '狙击枪') {
      scopeOffset.x = -0.05;
      scopeOffset.y = 0.05;
      scopeOffset.z = -0.05;
      scopeOffset.rotX = 0.1;
    }

    // 换弹动画 - 逐武器类型（含手部独立动作）
    let reloadOffset = { x: 0, y: 0, z: 0, rotX: 0, rotZ: 0 };
    let reloadRightArmOff = { x: 0, y: 0, z: 0 }; // 右手换弹时独立偏移
    let reloadLeftArmOff = { x: 0, y: 0, z: 0 };  // 左手换弹时独立偏移
    if (player.isReloading && player.reloadTimer > 0 && w) {
      const reloadTotal = w.reloadTime * player.reloadMult / (1 + player.stats.reloadSpeed * 0.05);
      const progress = 1 - (player.reloadTimer / reloadTotal); // 0→1

      if (w.name === '手枪') {
        // === 手枪换弹：右手持枪倾斜 → 左手从下方插入弹匣 → 复位 ===
        // 创建临时左手（仅手枪需要，因为左手在正常持枪时不存在）
        if (!_reloadLeftArm && _lastArmMaterials) {
          _reloadLeftArm = createLeftHand(_lastArmMaterials);
          camera.add(_reloadLeftArm);
          _reloadLeftArm.visible = true;
        }
        if (progress < 0.3) {
          // Phase 1: 武器右倾，弹匣脱落，右手下移
          const t = progress / 0.3;
          reloadOffset.y = -0.08 * Math.sin(t * Math.PI);
          reloadOffset.rotX = 0.25 * Math.sin(t * Math.PI);
          reloadOffset.rotZ = 0.2 * Math.sin(t * Math.PI);
          reloadRightArmOff.y = -0.02 * Math.sin(t * Math.PI);
          // 左手在下方待命
          reloadLeftArmOff.y = -0.15 + 0.05 * t;
          reloadLeftArmOff.x = 0.02;
        } else if (progress < 0.65) {
          // Phase 2: 左手从下方推弹匣插入
          const t = (progress - 0.3) / 0.35;
          reloadOffset.y = -0.06;
          reloadOffset.rotX = 0.2;
          reloadOffset.rotZ = 0.15;
          reloadRightArmOff.y = -0.02;
          // 左手向上推弹匣
          reloadLeftArmOff.x = 0.01;
          reloadLeftArmOff.y = -0.10 + 0.08 * Math.sin(t * Math.PI);
          reloadLeftArmOff.z = -0.02 * Math.sin(t * Math.PI);
        } else {
          // Phase 3: 复位
          const t = (progress - 0.65) / 0.35;
          reloadOffset.y = -0.06 * (1 - t);
          reloadOffset.rotX = 0.2 * (1 - t);
          reloadOffset.rotZ = 0.15 * (1 - t);
          reloadRightArmOff.y = -0.02 * (1 - t);
          // 左手撤回下方并消失
          reloadLeftArmOff.y = -0.02 * (1 - t) - 0.08;
          reloadLeftArmOff.z *= (1 - t);
          if (t > 0.8 && _reloadLeftArm) {
            camera.remove(_reloadLeftArm);
            _reloadLeftArm = null;
          }
        }
      } else if (w.name === '冲锋枪') {
        // === 冲锋枪换弹：左手从护木位置移动到弹匣 → 拆弹匣 → 插新弹匣 → 拍底 → 复位 ===
        if (progress < 0.25) {
          // Phase 1: 武器侧倾露出弹匣，左手从握枪位置移到弹匣位置
          const t = progress / 0.25;
          reloadOffset.rotX = 0.2 * t;
          reloadOffset.rotZ = -0.18 * t;
          reloadOffset.y = -0.04 * Math.sin(t * Math.PI * 0.5);
          // 左手从护木位置移到弹匣底部
          reloadLeftArmOff.y = -0.08 * Math.sin(t * Math.PI);
          reloadLeftArmOff.z = 0.05 * Math.sin(t * Math.PI);
        } else if (progress < 0.4) {
          // Phase 2: 左手取下弹匣（向右下方抽出）
          const t = (progress - 0.25) / 0.15;
          reloadOffset.rotX = 0.2;
          reloadOffset.rotZ = -0.18;
          reloadOffset.y = -0.04;
          // 左手向右下方抽出 （模拟取下弹匣）
          reloadLeftArmOff.x = 0.06 * Math.sin(t * Math.PI);
          reloadLeftArmOff.y = -0.08 + 0.04 * Math.sin(t * Math.PI);
          reloadLeftArmOff.z = 0.05 + 0.03 * Math.sin(t * Math.PI);
        } else if (progress < 0.7) {
          // Phase 3: 左手从腰间取新弹匣并插入
          const t = (progress - 0.4) / 0.3;
          reloadOffset.rotX = 0.18 * (1 - t * 0.3);
          reloadOffset.rotZ = -0.15 * (1 - t * 0.2);
          reloadOffset.y = -0.03;
          // 左手从腰间位置回到弹匣并推入
          reloadLeftArmOff.x = 0.06 * (1 - t);
          reloadLeftArmOff.y = -0.04 * (1 - t) - 0.04;
          reloadLeftArmOff.z = 0.08 * (1 - Math.sin(t * Math.PI * 0.5));
        } else if (progress < 0.88) {
          // Phase 4: 左手拍弹匣底部
          const t = (progress - 0.7) / 0.18;
          reloadOffset.rotX = 0.12;
          reloadOffset.rotZ = -0.12;
          reloadOffset.y = -0.02;
          // 拍底：武器有个小抖动
          const slap = Math.sin(t * Math.PI * 3);
          reloadOffset.z = -0.025 * (slap > 0 ? slap : 0);
          reloadOffset.y += 0.01 * (slap > 0 ? slap : 0);
          // 左手拍底（向下再回弹）
          reloadLeftArmOff.y = -0.08 + 0.02 * slap;
          reloadLeftArmOff.x = 0.01;
          reloadLeftArmOff.z = 0.02;
        } else {
          // Phase 5: 复位
          const t = (progress - 0.88) / 0.12;
          reloadOffset.rotX *= (1 - t);
          reloadOffset.rotZ *= (1 - t);
          reloadOffset.y *= (1 - t);
          reloadOffset.z *= (1 - t);
          // 左手回到原位
          reloadLeftArmOff.x *= (1 - t);
          reloadLeftArmOff.y *= (1 - t);
          reloadLeftArmOff.z *= (1 - t);
        }
      } else if (w.name === '狙击枪') {
        // === 狙击枪换弹：左手移出画面左侧拿弹匣 → 插入 → 拍底 → 复位 ===
        if (progress < 0.3) {
          // Phase 1: 武器侧倾露出弹匣，左手移出画面左侧去拿弹匣
          const t = progress / 0.3;
          reloadOffset.rotX = 0.2 * t;
          reloadOffset.rotZ = -0.18 * t;
          reloadOffset.y = -0.04 * Math.sin(t * Math.PI * 0.5);
          // 左手向左移出画面（x=-0.3），稍微向下（y=-0.1）
          reloadLeftArmOff.x = -0.30 * Math.sin(t * Math.PI);
          reloadLeftArmOff.y = -0.10 * Math.sin(t * Math.PI);
          reloadLeftArmOff.z = 0.04 * Math.sin(t * Math.PI);
        } else if (progress < 0.45) {
          // Phase 2: 左手从画面外拿新弹匣回到弹匣位置插入
          const t = (progress - 0.3) / 0.15;
          reloadOffset.rotX = 0.2;
          reloadOffset.rotZ = -0.18;
          reloadOffset.y = -0.04;
          // 左手从左侧画面外回到弹匣位置
          reloadLeftArmOff.x = -0.30 * (1 - t);
          reloadLeftArmOff.y = -0.10 * (1 - t) - 0.02;
          reloadLeftArmOff.z = 0.04 * (1 - t);
        } else if (progress < 0.75) {
          // Phase 3: 左手推弹匣就位
          const t = (progress - 0.45) / 0.3;
          reloadOffset.rotX = 0.18 * (1 - t * 0.3);
          reloadOffset.rotZ = -0.15 * (1 - t * 0.2);
          reloadOffset.y = -0.03;
          // 左手在弹匣位置稍作停留并推入
          reloadLeftArmOff.x = 0.01;
          reloadLeftArmOff.y = -0.02 * (1 - t);
          reloadLeftArmOff.z = 0.02 * Math.sin(t * Math.PI * 0.5);
        } else if (progress < 0.88) {
          // Phase 4: 左手拍弹匣底部
          const t = (progress - 0.75) / 0.13;
          reloadOffset.rotX = 0.12;
          reloadOffset.rotZ = -0.12;
          reloadOffset.y = -0.02;
          const slap = Math.sin(t * Math.PI * 3);
          reloadOffset.z = -0.025 * (slap > 0 ? slap : 0);
          reloadOffset.y += 0.01 * (slap > 0 ? slap : 0);
          reloadLeftArmOff.y = -0.08 + 0.02 * slap;
          reloadLeftArmOff.x = 0.01;
          reloadLeftArmOff.z = 0.02;
        } else {
          // Phase 5: 复位
          const t = (progress - 0.88) / 0.12;
          reloadOffset.rotX *= (1 - t);
          reloadOffset.rotZ *= (1 - t);
          reloadOffset.y *= (1 - t);
          reloadOffset.z *= (1 - t);
          reloadLeftArmOff.x *= (1 - t);
          reloadLeftArmOff.y *= (1 - t);
          reloadLeftArmOff.z *= (1 - t);
        }
      } else if (w.name === '霰弹枪') {
        // === 霰弹枪换弹：左手从前部枪托位置移到弹仓区域塞弹 → 复位 ===
        if (progress < 0.3) {
          // Phase 1: 武器侧转露出装弹口，左手从前部枪托(z=-0.22)移向弹仓(z≈0.0)
          const t = progress / 0.3;
          reloadOffset.rotX = -0.1 * Math.sin(t * Math.PI);
          reloadOffset.rotZ = 0.25 * Math.sin(t * Math.PI);
          reloadOffset.y = -0.04 * Math.sin(t * Math.PI);
          // 左手从枪管前方收回弹仓区域（z偏移 +0.22 回到弹仓位置）
          reloadLeftArmOff.z = 0.22 * Math.sin(t * Math.PI);
          reloadLeftArmOff.x = 0.02 * Math.sin(t * Math.PI);
          reloadLeftArmOff.y = -0.04 * Math.sin(t * Math.PI);
        } else if (progress < 0.65) {
          // Phase 2: 左手在弹仓位置塞弹（模拟一颗颗塞入弹仓的动作）
          const t = (progress - 0.3) / 0.35;
          reloadOffset.rotX = -0.08;
          reloadOffset.rotZ = 0.2 + Math.sin(t * Math.PI * 3) * 0.03;
          reloadOffset.y = -0.03;
          // 左手在弹仓区域(z≈0.0)上下晃动模拟塞弹
          reloadLeftArmOff.z = 0.22 * (1 - t * 0.15);
          reloadLeftArmOff.x = 0.02 * (1 - t * 0.5);
          reloadLeftArmOff.y = -0.04 + 0.03 * Math.sin(t * Math.PI * 2);
        } else {
          // Phase 3: 复位（左手回到前部枪托位置）
          const t = (progress - 0.65) / 0.35;
          reloadOffset.rotX = -0.08 * (1 - t);
          reloadOffset.rotZ = 0.2 * (1 - t);
          reloadOffset.y = -0.03 * (1 - t);
          reloadLeftArmOff.x *= (1 - t);
          reloadLeftArmOff.y *= (1 - t);
          reloadLeftArmOff.z *= (1 - t);
        }
      } else {
        // 默认通用换弹动画
        const t = Math.sin(progress * Math.PI);
        reloadOffset.y = -0.06 * Math.sin(progress * Math.PI);
        reloadOffset.rotX = 0.2 * t;
      }
    }

    // 手雷投弹动画（四阶段：拉环准备 → 举肩蓄力 → 全力甩出 → 自然回落）
    let grenadeOffset = { x: 0, y: 0, z: 0, rotX: 0, rotZ: 0 };
    let grenadeRightArmOff = { x: 0, y: 0, z: 0, rotX: 0, rotZ: 0 };
    if (w.isGrenade && grenadeAnim.phase !== 'idle') {
      grenadeAnim.timer -= dt;
      if (grenadeAnim.phase === 'pullPin') {
        // Phase 1: 拉环准备（0.3s）
        // 手雷收至胸前，向身体侧倾，右臂弯曲握紧，模拟拇指勾住拉环
        const t = Math.min(1, 1 - grenadeAnim.timer / 0.3);
        const ease = t * t; // ease-in
        grenadeOffset.y = 0.04 * ease;
        grenadeOffset.z = 0.08 * ease;
        grenadeOffset.rotZ = -0.35 * ease;
        grenadeOffset.rotX = -0.15 * ease;
        // 右臂弯曲收至胸前
        grenadeRightArmOff.y = 0.06 * ease;
        grenadeRightArmOff.z = 0.10 * ease;
        grenadeRightArmOff.rotX = -0.35 * ease;
        grenadeRightArmOff.rotZ = -0.1 * ease;
        if (grenadeAnim.timer <= 0) {
          grenadeAnim.phase = 'raise';
          grenadeAnim.timer = 0.3;
        }
      } else if (grenadeAnim.phase === 'raise') {
        // Phase 2: 举肩蓄力（0.3s）
        // 手雷举到右肩后方，手臂大幅后拉，身体扭转准备投掷
        const t = Math.min(1, 1 - grenadeAnim.timer / 0.3);
        const ease = Math.sin(t * Math.PI * 0.5); // ease-out
        grenadeOffset.y = 0.04 + 0.10 * ease;
        grenadeOffset.z = 0.08 - 0.15 * ease;
        grenadeOffset.rotX = -0.15 - 0.35 * ease;
        grenadeOffset.rotZ = -0.35 + 0.1 * ease;
        // 右臂举高后伸
        grenadeRightArmOff.y = 0.06 + 0.14 * ease;
        grenadeRightArmOff.z = 0.10 - 0.20 * ease;
        grenadeRightArmOff.rotX = -0.35 - 0.30 * ease;
        grenadeRightArmOff.rotZ = -0.1 + 0.15 * ease;
        if (grenadeAnim.timer <= 0) {
          grenadeAnim.phase = 'throw';
          grenadeAnim.timer = 0.2;
          executeGrenadeThrow();
        }
      } else if (grenadeAnim.phase === 'throw') {
        // Phase 3: 全力甩出（0.2s）——手雷已脱手，缩放手雷模型为不可见，只动画手臂
        // 注意：必须用scale而不是visible，否则weaponMesh.visible=false会导致外层if条件中断动画
        if (weaponMesh) weaponMesh.scale.set(0.001, 0.001, 0.001);
        const t = Math.min(1, 1 - grenadeAnim.timer / 0.2);
        const arc = Math.sin(t * Math.PI);
        // 右臂全力前伸（手中已无手雷）
        grenadeRightArmOff.z = -0.10 - 0.30 * arc;
        grenadeRightArmOff.y = 0.20 - 0.08 * arc;
        grenadeRightArmOff.rotX = -0.65 + 0.90 * arc;
        grenadeRightArmOff.rotZ = 0.05 + 0.10 * (1 - t);
        if (grenadeAnim.timer <= 0) {
          grenadeAnim.phase = 'recover';
          grenadeAnim.timer = 0.35;
        }
      } else if (grenadeAnim.phase === 'recover') {
        // 恢复手中手雷大小（为下次投掷做准备）
        if (weaponMesh) weaponMesh.scale.set(1, 1, 1);
        // Phase 4: 自然回落（0.35s）
        // 手臂从伸展位置自然收回，带有轻微惯性晃动
        const t = Math.min(1, 1 - grenadeAnim.timer / 0.35);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
        grenadeOffset.y = -0.02 * (1 - ease);
        grenadeOffset.rotX = 0.10 * (1 - ease);
        // 右臂回落
        grenadeRightArmOff.z = -0.05 * (1 - ease);
        grenadeRightArmOff.y = 0.03 * (1 - ease);
        grenadeRightArmOff.rotX = -0.10 * (1 - ease);
        if (grenadeAnim.timer <= 0) {
          grenadeAnim.phase = 'idle';
          grenadeAnim.timer = 0;
        }
      }
    }

    // ====== 手雷投弹专用：动画手臂，手雷跟随手臂（不是手臂追武器） ======
    if (w.isGrenade && grenadeAnim.phase !== 'idle') {
      // 直接设置右手臂位置和旋转（基础位置 + 投弹偏移）
      const baseArmX = 0.06, baseArmY = -0.04, baseArmZ = 0;
      const baseArmRotX = 0.15, baseArmRotZ = -0.05;
      rightArmMesh.position.set(
        baseArmX + grenadeRightArmOff.x,
        baseArmY + grenadeRightArmOff.y,
        baseArmZ + grenadeRightArmOff.z
      );
      rightArmMesh.rotation.set(
        baseArmRotX + grenadeRightArmOff.rotX,
        0,
        baseArmRotZ + grenadeRightArmOff.rotZ
      );
      rightArmMesh.visible = true;
      // 手雷跟随右手位置（手雷在手掌中）
      weaponMesh.position.copy(rightArmMesh.position);
      weaponMesh.position.y += 0.03;
      weaponMesh.position.z += 0.04;
      weaponMesh.rotation.copy(rightArmMesh.rotation);
      weaponMesh.rotation.x += 0.15;
    } else {

    // 收起过渡偏移（武器向下移出屏幕）
    const holsterOffsetY = holsterT * -0.6;
    const holsterOffsetZ = holsterT * 0.3;
    const holsterRotX = holsterT * 0.5;

    // 应用最终变换
    weaponMesh.position.x = basePos.x + breatheX + swayX + weaponRecoil.rotY * 0.1 + scopeOffset.x + grenadeOffset.x + reloadOffset.x;
    weaponMesh.position.y = basePos.y + breatheY + swayY + weaponRecoil.y + scopeOffset.y + grenadeOffset.y + holsterOffsetY + reloadOffset.y;
    weaponMesh.position.z = basePos.z + weaponRecoil.z + scopeOffset.z + grenadeOffset.z + holsterOffsetZ + reloadOffset.z;
    weaponMesh.rotation.x = weaponRecoil.rotX + scopeOffset.rotX + grenadeOffset.rotX + holsterRotX + reloadOffset.rotX;
    weaponMesh.rotation.y = weaponRecoil.rotY + grenadeOffset.rotZ;
    weaponMesh.rotation.z = -swayX * 0.3 + grenadeOffset.rotZ + reloadOffset.rotZ;

    // 更新枪口闪光位置
    if (muzzleFlashLight && muzzleFlashMesh) {
      const flashZ = basePos.z - 0.15 + weaponRecoil.z + holsterOffsetZ;
      const flashY = basePos.y + 0.035 + weaponRecoil.y + holsterOffsetY;
      muzzleFlashLight.position.set(basePos.x, flashY, flashZ);
      muzzleFlashMesh.position.set(basePos.x, flashY, flashZ);
    }

    // ====== 3. 同步手臂位置跟随武器 ======
    if (weaponMesh && weaponMesh.visible) {
      if (rightArmMesh) {
        const rOff = rightArmGripOffset.pos.clone();
        rOff.applyEuler(weaponMesh.rotation);
        rightArmMesh.position.copy(weaponMesh.position).add(rOff);
        rightArmMesh.rotation.x = weaponMesh.rotation.x + rightArmGripOffset.rot.x;
        rightArmMesh.rotation.y = weaponMesh.rotation.y + rightArmGripOffset.rot.y;
        rightArmMesh.rotation.z = weaponMesh.rotation.z + rightArmGripOffset.rot.z;
        // 手雷投掷时右臂额外偏移（模拟投掷甩臂）
        rightArmMesh.position.x += grenadeRightArmOff.x;
        rightArmMesh.position.y += grenadeRightArmOff.y;
        rightArmMesh.position.z += grenadeRightArmOff.z;
        rightArmMesh.rotation.x += grenadeRightArmOff.rotX;
        rightArmMesh.rotation.z += grenadeRightArmOff.rotZ;
        rightArmMesh.visible = true;
      }
      // 左手跟随武器（与右臂同理，通过leftArmGripOffset）
      if (leftArmMesh) {
        const lOff = leftArmGripOffset.pos.clone();
        lOff.applyEuler(weaponMesh.rotation);
        leftArmMesh.position.copy(weaponMesh.position).add(lOff);
        leftArmMesh.rotation.x = weaponMesh.rotation.x + leftArmGripOffset.rot.x;
        leftArmMesh.rotation.y = weaponMesh.rotation.y + leftArmGripOffset.rot.y;
        leftArmMesh.rotation.z = weaponMesh.rotation.z + leftArmGripOffset.rot.z;
        leftArmMesh.visible = true;
      }
      // ====== 3.5 换弹时手臂独立偏移（手部执行换弹动作） ======
      if (player.isReloading && player.reloadTimer > 0) {
        if (rightArmMesh) {
          rightArmMesh.position.x += reloadRightArmOff.x;
          rightArmMesh.position.y += reloadRightArmOff.y;
          rightArmMesh.position.z += reloadRightArmOff.z;
        }
        if (leftArmMesh) {
          leftArmMesh.position.x += reloadLeftArmOff.x;
          leftArmMesh.position.y += reloadLeftArmOff.y;
          leftArmMesh.position.z += reloadLeftArmOff.z;
        }
        // 手枪换弹临时左手
        if (_reloadLeftArm && weaponMesh) {
          _reloadLeftArm.position.copy(weaponMesh.position);
          _reloadLeftArm.position.x += reloadLeftArmOff.x;
          _reloadLeftArm.position.y += reloadLeftArmOff.y;
          _reloadLeftArm.position.z += reloadLeftArmOff.z + 0.03;
          _reloadLeftArm.rotation.x = weaponMesh.rotation.x + 0.3;
          _reloadLeftArm.rotation.z = weaponMesh.rotation.z + 0.1;
          _reloadLeftArm.visible = true;
        }
      } else if (_reloadLeftArm) {
        // 换弹结束清理临时左手
        camera.remove(_reloadLeftArm);
        _reloadLeftArm = null;
      }
    } else {
      if (rightArmMesh) rightArmMesh.visible = false;
      if (leftArmMesh) leftArmMesh.visible = false;
      if (_reloadLeftArm) {
        camera.remove(_reloadLeftArm);
        _reloadLeftArm = null;
      }
    }
  }

  } // end else (non-grenade-throw)

  // ====== 4. 空手双手动画（跑步甩臂）v4 ======
  // 只有武器收起状态才显示空手双手
  if (handsMesh && handsMesh.children.length >= 2 && weaponHolstered) {
    const isMoving = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'];
    const leftArm = handsMesh.children[0];
    const rightArm = handsMesh.children[1];
    if (!leftArm || !rightArm) return;

    if (isMoving) {
      if (!handsMesh.visible) handsMesh.visible = true;
      // 跑步手臂摆动：前后伸缩为主，角度朝向左右下角
      const runCycle = time * 10;
      // rotation.x：前后大幅度摆动（正=向前伸，负=向后收），相位相反
      leftArm.rotation.x = -0.25 + Math.sin(runCycle) * 0.50;
      rightArm.rotation.x = -0.25 + Math.sin(runCycle + Math.PI) * 0.50;
      // rotation.z：向两侧倾斜，让手臂靠近左右下角
      leftArm.rotation.z = 0.22;   // 向左倾斜
      rightArm.rotation.z = -0.22; // 向右倾斜
      // 位置：固定在左右下角，只做前后伸缩（z方向）
      leftArm.position.x = -0.16;  // 靠左
      leftArm.position.y = -0.24;  // 靠下
      rightArm.position.x = 0.16;  // 靠右
      rightArm.position.y = -0.24; // 靠下
      // 前后伸缩位移配合摆臂
      leftArm.position.z = -0.20 + Math.sin(runCycle) * 0.10;
      rightArm.position.z = -0.20 + Math.sin(runCycle + Math.PI) * 0.10;
    } else {
      // 闲置：隐藏双手
      handsMesh.visible = false;
    }
  }
}

// 执行手雷投掷（从动画中分离的实际逻辑）
function executeGrenadeThrow() {
  if(window.AudioSystem) AudioSystem.playSound('grenade_throw');
  const dir = new THREE.Vector3(0, 0.3, -1);
  dir.applyQuaternion(camera.quaternion);
  dir.normalize();
  const throwSpeed = CONFIG.GRENADE_THROW_SPEED;
  const grenadeDmg = CONFIG.GRENADE_DAMAGE * player.dmgMult * (1 + player.stats.damage * 0.10);

  const grenadeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
  grenadeGeo.rotateX(Math.PI / 2);
  const grenadeMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
  const grenadeMesh = new THREE.Mesh(grenadeGeo, grenadeMat);
  grenadeMesh.position.copy(camera.position);
  scene.add(grenadeMesh);

  bullets.push({
    pos: camera.position.clone(),
    dir: dir.clone().multiplyScalar(throwSpeed),
    vel: dir.clone().multiplyScalar(throwSpeed),
    speed: throwSpeed,
    damage: grenadeDmg,
    life: CONFIG.GRENADE_FUSE_TIME,
    isCrit: false, fromPlayer: true, pierce: false,
    hitEnemies: null, isGrenade: true,
    mesh: grenadeMesh, rotationSpeed: 10,
  });

  // 自动换弹
  const w = weapons[currentWeaponIndex];
  if (w && w.isGrenade && w.currentMag <= 0 && w.reserve > 0 && !player.isReloading) {
    setTimeout(() => {
      if (currentWeaponIndex >= 0 && weapons[currentWeaponIndex] && weapons[currentWeaponIndex].isGrenade && weapons[currentWeaponIndex].currentMag <= 0) {
        reloadWeapon();
      }
    }, 300);
  }
}

// ============================================================
// 子弹系统
// ============================================================
function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    // 手雷特殊更新：抛物线运动
    if (b.isGrenade) {
      b.vel.y -= CONFIG.GRAVITY * dt; // 重力
      b.pos.addScaledVector(b.vel, dt);

      // 更新mesh位置和旋转
      if (b.mesh) {
        b.mesh.position.copy(b.pos);
        b.mesh.rotation.x += b.rotationSpeed * dt;
        b.mesh.rotation.z += b.rotationSpeed * 0.7 * dt;
      }

      b.life -= dt;

      // 引信到期或碰到地面 → 爆炸
      if (b.life <= 0 || b.pos.y <= 0.1) {
        // 爆炸
        createExplosion(b.pos.clone(), b.damage, CONFIG.GRENADE_RADIUS);
        if(window.AudioSystem)AudioSystem.playSound('grenade_explode');
        // 移除mesh
        if (b.mesh) scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
      continue;
    }

    // 普通子弹更新
    if (!b.pos || !b.pos.addScaledVector || !b.dir) {
      // 无效的子弹数据，移除
      if (b.mesh) scene.remove(b.mesh);
      bullets.splice(i, 1);
      continue;
    }
    // 记录上一帧位置（用于线段碰撞检测，防止隧穿）
    const prevPos = b.pos.clone();
    b.pos.addScaledVector(b.dir, b.speed * dt);
    b.life -= dt;

    // 更新队友子弹mesh位置（可视化）
    if (b.mesh) {
      b.mesh.position.copy(b.pos);
      // 让子弹朝向飞行方向
      if (b.allyType && b.allyType !== '战士') {
        b.mesh.lookAt(b.pos.clone().add(b.dir));
      }
    }

    if (b.life <= 0) {
      // 子弹过期时移除mesh、弹道并从数组删除
      cleanupBulletTrail(b);
      if (b.mesh) scene.remove(b.mesh);
      bullets.splice(i, 1);
      continue;
    }

    // 玩家/队友子弹击中敌人（使用线段碰撞检测防止隧穿）
    if (b.fromPlayer) {
      let hit = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e.dead || !e.mesh || !e.mesh.position) continue;
        // 检查是否已经击中过这个敌人（穿透用）
        if (b.hitEnemies && b.hitEnemies.includes(e)) continue;
        
        const hitR = (e.def && e.def.size) ? e.def.size * 0.8 : 1;
        // 线段-球体碰撞检测：检查子弹从prevPos到pos的线段是否与敌人球体相交
        // 使用敌人身体中心位置（y + size * 0.5）
        const ePos = e.mesh.position.clone();
        ePos.y += (e.def && e.def.size) ? e.def.size * 0.5 : 0.5;
        const segDir = new THREE.Vector3().subVectors(b.pos, prevPos);
        const segLen = segDir.length();
        if (segLen < 0.001) {
          // 子弹几乎没移动，用点检测
          if (b.pos.distanceTo(ePos) < hitR) {
            // 命中处理
            damageEnemy(e, b.damage, b.isCrit, b.pos, b.allyName || '玩家');
            if (b.allyType) createAllyHitEffect(b.pos.clone(), b.allyType, b.damage);
            else {
              if (player.explosiveRounds) createExplosion(b.pos.clone(), 20, 5);
              if (player.chainLightning) chainLightning(e, b.damage * 0.3, 3);
            }
            if (b.pierce) {
              if (!b.hitEnemies) b.hitEnemies = [];
              b.hitEnemies.push(e);
              if (b.hitEnemies.length >= b.pierceCount) { if (b.mesh) scene.remove(b.mesh); cleanupBulletTrail(b); bullets.splice(i, 1); }
              hit = true;
            } else {
              if (b.mesh) scene.remove(b.mesh); cleanupBulletTrail(b); bullets.splice(i, 1); hit = true; break;
            }
          }
          continue;
        }
        segDir.normalize();
        const toEnemy = new THREE.Vector3().subVectors(ePos, prevPos);
        const proj = toEnemy.dot(segDir);
        if (proj < 0 || proj > segLen) continue; // 敌人在线段范围外
        const closest = new THREE.Vector3().copy(prevPos).addScaledVector(segDir, proj);
        const dist = closest.distanceTo(ePos);
        if (dist < hitR) {
          // 命中！计算命中点
          const hitPos = closest.clone();
          damageEnemy(e, b.damage, b.isCrit, hitPos, b.allyName || '玩家');
          
          // 队友子弹使用职业特定的击中特效
          if (b.allyType) {
            createAllyHitEffect(hitPos, b.allyType, b.damage);
          } else {
            // 玩家子弹特效
            if (player.explosiveRounds) {
              createExplosion(hitPos, 20, 5);
            }
            if (player.chainLightning) {
              chainLightning(e, b.damage * 0.3, 3);
            }
          }
          
          // 穿透逻辑
          if (b.pierce) {
            if (!b.hitEnemies) b.hitEnemies = [];
            b.hitEnemies.push(e);
            if (b.hitEnemies.length >= b.pierceCount) {
              if (b.mesh) scene.remove(b.mesh);
              cleanupBulletTrail(b);
              bullets.splice(i, 1);
            }
            hit = true;
          } else {
            if (b.mesh) scene.remove(b.mesh);
            cleanupBulletTrail(b);
            bullets.splice(i, 1);
            hit = true;
            break;
          }
        }
      }
      // 雪山游荡僵尸碰撞
      if (window.SnowMap && SnowMap.active && SnowMap.wanderZombies.length > 0) {
        for (let w = SnowMap.wanderZombies.length - 1; w >= 0; w--) {
          const wz = SnowMap.wanderZombies[w];
          if (wz.state === 'dead' || !wz.mesh) continue;
          const wzPos = wz.mesh.position.clone();
          wzPos.y += 1;
          const wzDist = b.pos.distanceTo(wzPos);
          if (wzDist < 1.2) {
            const killed = SnowMap.damageWanderZombie(wz, b.damage);
            cleanupBulletTrail(b);
            if (b.mesh) { scene.remove(b.mesh); b.life = 0; }
            // 显示伤害数字
            if (window.createDamageNumber) {
              window.createDamageNumber(wzPos, Math.floor(b.damage));
            }
            if (killed) {
              // 击杀计数
              kills++;
              // 击杀通知
              if (typeof addKillFeed === 'function') {
                const zNames = ['冰冻僵尸', '壮硕冰尸', '瘦长冰鬼'];
                addKillFeed('玩家', zNames[Math.floor(Math.random() * zNames.length)]);
              }
              // 击杀奖励（含经验加成）
              let xpMult = 1 + (player.stats && player.stats.expGain ? player.stats.expGain * 0.10 : 0);
              const xpGain = Math.floor(15 * xpMult * (SNOW_MAP_CONFIG ? SNOW_MAP_CONFIG.XP_MULT : 1));
              player.xp += xpGain;
              xp = player.xp;
              if (typeof checkLevelUp === 'function') checkLevelUp();
              // 掉落物（25%概率）
              if (Math.random() < 0.25 && typeof spawnPickup === 'function') {
                spawnPickup(wzPos.clone());
              }
              // 不显示XP提醒（与城市地图一致，击杀通知已通过addKillFeed显示）
            }
            break;
          }
        }
      }
      // 沙漠怪物碰撞检测
      if (window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.length > 0) {
        for (let j = DesertMap.desertMonsters.length - 1; j >= 0; j--) {
          const m = DesertMap.desertMonsters[j];
          if (m.dead || !m.mesh || !m.mesh.position) continue;
          if (b.hitEnemies && b.hitEnemies.includes(m)) continue;

          const hitR = 1.5; // desert monster hit radius
          const mPos = m.mesh.position.clone();
          mPos.y += 0.5;

          // 线段-球体碰撞检测（与敌人检测相同逻辑）
          const segDir2 = new THREE.Vector3().subVectors(b.pos, prevPos);
          const segLen2 = segDir2.length();
          if (segLen2 < 0.001) {
            if (b.pos.distanceTo(mPos) < hitR) {
              m.hp -= b.damage;
              // 受击音效（30%概率播放，避免连续叫）
              if (window.AudioSystem && m.hp > 0 && Math.random() < 0.3) {
                AudioSystem.playSound('zombie_hit', 0.5);
              }
              if (m.hp <= 0) {
                if (typeof window.killDesertMonster === 'function') window.killDesertMonster(m, '玩家');
              }
              if (b.mesh) scene.remove(b.mesh);
              cleanupBulletTrail(b);
              bullets.splice(i, 1);
              hit = true;
              break;
            }
            continue;
          }
          segDir2.normalize();
          const toMonster = new THREE.Vector3().subVectors(mPos, prevPos);
          const proj2 = toMonster.dot(segDir2);
          if (proj2 < 0 || proj2 > segLen2) continue;
          const closest2 = new THREE.Vector3().copy(prevPos).addScaledVector(segDir2, proj2);
          const dist2 = closest2.distanceTo(mPos);
          if (dist2 < hitR) {
            m.hp -= b.damage;
            // 受击音效（30%概率播放，避免连续叫）
            if (window.AudioSystem && m.hp > 0 && Math.random() < 0.3) {
              AudioSystem.playSound('zombie_hit', 0.5);
            }
            if (m.hp <= 0) {
              if (typeof window.killDesertMonster === 'function') window.killDesertMonster(m, '玩家');
            }
            // 玩家子弹特效
            if (player.explosiveRounds) {
              createExplosion(closest2.clone(), 20, 5);
            }
            if (player.chainLightning) {
              chainLightning(null, b.damage * 0.3, 3); // sourceEnemy is null for desert monsters
            }
            if (b.pierce) {
              if (!b.hitEnemies) b.hitEnemies = [];
              b.hitEnemies.push(m);
              if (b.hitEnemies.length >= b.pierceCount) {
                if (b.mesh) scene.remove(b.mesh);
                cleanupBulletTrail(b);
                bullets.splice(i, 1);
              }
              hit = true;
            } else {
              if (b.mesh) scene.remove(b.mesh);
              cleanupBulletTrail(b);
              bullets.splice(i, 1);
              hit = true;
              break;
            }
          }
        }
      }
    }
    // 敌人子弹击中玩家
    else {
      // 更新子弹mesh位置（可视化）
      if (b.mesh) {
        b.mesh.position.copy(b.pos);
        // 添加轨迹效果
        if (Math.random() < 0.3) {
          particles.push({
            pos: b.pos.clone(),
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5),
            life: 0.3,
            color: b.color,
            size: 0.08,
          });
        }
      }
      
      const dist = b.pos.distanceTo(camera.position);
      if (dist < 1) {
        damagePlayer(b.damage);
        // 移除子弹mesh
        if (b.mesh) {
          scene.remove(b.mesh);
        }
        cleanupBulletTrail(b);
        bullets.splice(i, 1);
      } else if (b.life <= 0) {
        // 子弹过期时移除mesh、弹道并从数组删除
        cleanupBulletTrail(b);
        if (b.mesh) scene.remove(b.mesh);
        bullets.splice(i, 1);
      }
    }
  }
}

// 创建敌人子弹轨迹效果
function createEnemyBulletTrail(pos, color) {
  // 减少粒子数量以提高性能
  for (let i = 0; i < 2; i++) {
    particles.push({
      pos: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3)),
      vel: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
      life: 0.3,
      color: color,
      size: 0.1,
    });
  }
}

function createMuzzleFlash(pos) {
  if (window.EffectsSystem && EffectsSystem.initialized) {
    try {
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      EffectsSystem.createMuzzleFlash(pos, direction);
      return;
    } catch (e) {}
  }
  // Fallback
  const light = new THREE.PointLight(0xffaa00, 3, 8);
  light.position.copy(pos);
  scene.add(light);
  setTimeout(() => { if (light.parent) scene.remove(light); }, 50);
  for (let i = 0; i < 3; i++) {
    particles.push({
      pos: pos.clone(),
      vel: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 3, (Math.random() - 0.5) * 5),
      life: 0.2, color: 0xffaa00, size: 0.05,
    });
  }
}

function createExplosion(pos, damage, radius) {
  // 伤害范围内敌人
  enemies.forEach(e => {
    if (e.dead) return;
    const d = e.mesh.position.distanceTo(pos);
    if (d < radius) {
      damageEnemy(e, damage * (1 - d / radius), false, pos);
    }
  });
  // Also damage desert monsters
  if (window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.length > 0) {
    for (let j = DesertMap.desertMonsters.length - 1; j >= 0; j--) {
      const m = DesertMap.desertMonsters[j];
      if (m.dead || !m.mesh || !m.mesh.position) continue;
      const d = m.mesh.position.distanceTo(pos);
      if (d < radius) {
        m.hp -= damage * (1 - d / radius);
        if (m.hp <= 0) {
          if (typeof window.killDesertMonster === 'function') window.killDesertMonster(m, '爆炸');
        }
      }
    }
  }
  if (window.EffectsSystem && EffectsSystem.initialized) {
    try {
      EffectsSystem.createExplosion(pos, { count: 8, color: 0xff6600, size: 0.2 });
      EffectsSystem.createShockwave(pos, { color: 0xff4400, radius: radius * 0.5, duration: 0.3 });
    } catch (e) {}
  } else {
    // Fallback
    for (let i = 0; i < 8; i++) {
      particles.push({
        pos: pos.clone(),
        vel: new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 10),
        life: 0.5 + Math.random() * 0.5,
        color: Math.random() > 0.5 ? 0xff4400 : 0xffaa00,
        size: 0.1 + Math.random() * 0.2,
      });
    }
    const light = new THREE.PointLight(0xff4400, 5, 15);
    light.position.copy(pos);
    scene.add(light);
    setTimeout(() => scene.remove(light), 200);
  }
}

function chainLightning(sourceEnemy, damage, chains) {
  let current = sourceEnemy;
  let currentPos = current ? current.mesh.position : null;
  for (let i = 0; i < chains; i++) {
    let nearest = null, nearDist = 10;
    let nearestIsDesert = false;
    // Check regular enemies
    enemies.forEach(e => {
      if (e.dead || e === current) return;
      const d = e.mesh.position.distanceTo(currentPos || (current ? current.mesh.position : new THREE.Vector3()));
      if (d < nearDist) { nearDist = d; nearest = e; nearestIsDesert = false; }
    });
    // Also check desert monsters
    if (window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.length > 0) {
      for (const m of DesertMap.desertMonsters) {
        if (m.dead || !m.mesh || !m.mesh.position) continue;
        const d = m.mesh.position.distanceTo(currentPos || (current ? current.mesh.position : new THREE.Vector3()));
        if (d < nearDist) { nearDist = d; nearest = m; nearestIsDesert = true; }
      }
    }
    if (!nearest) break;
    if (nearestIsDesert) {
      nearest.hp -= damage;
      if (nearest.hp <= 0) {
        if (typeof window.killDesertMonster === 'function') window.killDesertMonster(nearest, '闪电链');
      }
    } else {
      damageEnemy(nearest, damage, false, nearest.mesh.position, '闪电链');
    }
    // 闪电特效
    const fromPos = currentPos || (current ? current.mesh.position : new THREE.Vector3());
    createLightningEffect(fromPos, nearest.mesh.position);
    current = nearest;
    currentPos = nearest.mesh.position;
  }
}

function createLightningEffect(from, to) {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const mat = new THREE.LineBasicMaterial({ color: 0x44aaff });
  const line = new THREE.Line(geo, mat);
  scene.add(line);
  setTimeout(() => scene.remove(line), 100);
}

// ============================================================
// 敌人系统
// ============================================================
function spawnEnemy(type, pos) {
  // type 可以是对象（ZOMBIE_DEFS元素）或字符串（僵尸名称）
  let def = type;
  if (typeof def === 'string') {
    def = ZOMBIE_DEFS.find(d => d.name === def || d.name.includes(def)) || ZOMBIE_DEFS[0];
  }
  if (!def) def = ZOMBIE_DEFS[Math.floor(Math.random() * Math.min(3 + Math.floor(wave / 2), ZOMBIE_DEFS.length))];
  const group = new THREE.Group();

  // 根据僵尸类型创建差异化外观
  if (def.desert) {
    // ===== 沙漠专属怪物外观 =====
    createDesertEnemyModel(group, def);
  } else if (def.crawl) {
    // 快速僵尸 - 四肢着地
    const bodyGeo = new THREE.BoxGeometry(def.size * 0.7, def.size * 0.4, def.size * 0.9);
    const bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = def.size * 0.4;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    
    // 头向前伸
    const headGeo = new THREE.BoxGeometry(def.size * 0.4, def.size * 0.35, def.size * 0.45);
    const headMat = new THREE.MeshLambertMaterial({ color: def.color + 0x111111 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, def.size * 0.6, def.size * 0.5);
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    
    // 发光的眼睛
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), eyeMat);
    eye1.position.set(-0.12, def.size * 0.65, def.size * 0.75);
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.x = 0.12;
    group.add(eye2);
    
    // 四肢（标记为leg，爬行时四肢都摆动）
    const limbGeo = new THREE.BoxGeometry(0.12, def.size * 0.5, 0.12);
    const limbMat = new THREE.MeshLambertMaterial({ color: def.color - 0x111111 });
    for (let i = 0; i < 4; i++) {
      const limb = new THREE.Mesh(limbGeo, limbMat);
      const angle = (i / 4) * Math.PI * 2;
      limb.position.set(Math.cos(angle) * def.size * 0.3, def.size * 0.25, Math.sin(angle) * def.size * 0.3);
      limb.userData.part = i < 2 ? 'arm' : 'leg';
      limb.userData.limbIndex = i;
      group.add(limb);
    }
  } else if (def.fat) {
    // 胖子僵尸 - 庞大身躯
    const bodyGeo = new THREE.BoxGeometry(def.size * 0.9, def.size * 0.9, def.size * 0.7);
    const bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = def.size * 0.75;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    
    // 大肚子
    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(def.size * 0.5, 8, 8),
      new THREE.MeshLambertMaterial({ color: def.color + 0x222222 })
    );
    belly.position.set(0, def.size * 0.7, def.size * 0.3);
    belly.scale.z = 0.6;
    group.add(belly);
    
    // 小头
    const headGeo = new THREE.BoxGeometry(def.size * 0.3, def.size * 0.3, def.size * 0.3);
    const headMat = new THREE.MeshLambertMaterial({ color: def.color + 0x111111 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = def.size * 1.35;
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    
    // 小眼睛
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), eyeMat);
    eye1.position.set(-0.08, def.size * 1.4, -def.size * 0.16);
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.x = 0.08;
    group.add(eye2);
    
    // 粗短手臂
    const armGeo = new THREE.BoxGeometry(0.25, def.size * 0.4, 0.25);
    const armMat = new THREE.MeshLambertMaterial({ color: def.color - 0x111111 });
    const arm1 = new THREE.Mesh(armGeo, armMat);
    arm1.position.set(-def.size * 0.6, def.size * 0.6, 0);
    arm1.userData.part = 'arm';
    group.add(arm1);
    const arm2 = arm1.clone();
    arm2.position.x = def.size * 0.6;
    arm2.userData.part = 'arm';
    group.add(arm2);
    
    // 短腿
    const legGeo = new THREE.BoxGeometry(0.25, def.size * 0.35, 0.25);
    const leg1 = new THREE.Mesh(legGeo, armMat);
    leg1.position.set(-0.2, def.size * 0.18, 0);
    leg1.userData.part = 'leg';
    group.add(leg1);
    const leg2 = leg1.clone();
    leg2.position.x = 0.2;
    leg2.userData.part = 'leg';
    group.add(leg2);
  } else if (def.tyrant) {
    // 暴君 - 巨型BOSS外观
    const bodyGeo = new THREE.BoxGeometry(def.size * 0.8, def.size * 0.9, def.size * 0.6);
    const bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = def.size * 0.65;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);

    // 肌肉纹理条纹
    const muscleGeo = new THREE.BoxGeometry(def.size * 0.82, def.size * 0.15, def.size * 0.62);
    const muscleMat = new THREE.MeshLambertMaterial({ color: 0x660000 });
    for (let i = 0; i < 3; i++) {
      const muscle = new THREE.Mesh(muscleGeo, muscleMat);
      muscle.position.y = def.size * 0.4 + i * def.size * 0.25;
      group.add(muscle);
    }

    // 巨大的手臂
    const armGeo = new THREE.BoxGeometry(def.size * 0.35, def.size * 0.8, def.size * 0.35);
    const armMat = new THREE.MeshLambertMaterial({ color: 0x770000 });
    const arm1 = new THREE.Mesh(armGeo, armMat);
    arm1.position.set(-def.size * 0.65, def.size * 0.6, 0);
    arm1.castShadow = true;
    arm1.userData.part = 'arm';
    group.add(arm1);
    const arm2 = arm1.clone();
    arm2.position.x = def.size * 0.65;
    arm2.userData.part = 'arm';
    group.add(arm2);

    // 巨拳
    const fistGeo = new THREE.BoxGeometry(def.size * 0.3, def.size * 0.3, def.size * 0.3);
    const fistMat = new THREE.MeshLambertMaterial({ color: 0x550000 });
    const fist1 = new THREE.Mesh(fistGeo, fistMat);
    fist1.position.set(-def.size * 0.65, def.size * 0.15, 0);
    group.add(fist1);
    const fist2 = fist1.clone();
    fist2.position.x = def.size * 0.65;
    group.add(fist2);

    // 头
    const headGeo = new THREE.BoxGeometry(def.size * 0.45, def.size * 0.45, def.size * 0.45);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x550000 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = def.size * 1.35;
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);

    // 发光红眼
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.08), eyeMat);
    eye1.position.set(-0.2, def.size * 1.4, -def.size * 0.23);
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.x = 0.2;
    group.add(eye2);

    // 限制器装甲（肩膀装甲板）
    const limiterGeo = new THREE.BoxGeometry(def.size * 0.4, def.size * 0.25, def.size * 0.4);
    const limiterMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const limiter1 = new THREE.Mesh(limiterGeo, limiterMat);
    limiter1.position.set(-def.size * 0.6, def.size * 1.1, 0);
    group.add(limiter1);
    const limiter2 = limiter1.clone();
    limiter2.position.x = def.size * 0.6;
    group.add(limiter2);

    // 腿
    const legGeo = new THREE.BoxGeometry(def.size * 0.3, def.size * 0.5, def.size * 0.3);
    const leg1 = new THREE.Mesh(legGeo, armMat);
    leg1.position.set(-def.size * 0.25, def.size * 0.2, 0);
    leg1.userData.part = 'leg';
    group.add(leg1);
    const leg2 = leg1.clone();
    leg2.position.x = def.size * 0.25;
    leg2.userData.part = 'leg';
    group.add(leg2);

    // PointLight 发光
    const tyrantLight = new THREE.PointLight(0xff2200, 2, 15);
    tyrantLight.position.y = def.size * 1.5;
    group.add(tyrantLight);
  } else if (def.licker) {
    // 舔食者外观 - 四足爬行（参考生化危机舔食者）
    // 身体（扁平爬行姿态）
    const bodyGeo = new THREE.BoxGeometry(def.size * 0.5, def.size * 0.35, def.size * 0.8);
    const bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = def.size * 0.3;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);

    // 裸露的大脑（头顶，一个粉红色的球）
    const brainGeo = new THREE.SphereGeometry(def.size * 0.18, 8, 8);
    const brainMat = new THREE.MeshLambertMaterial({ color: 0xFF9999 });
    const brain = new THREE.Mesh(brainGeo, brainMat);
    brain.position.y = def.size * 0.55;
    brain.position.z = -def.size * 0.1;
    brain.castShadow = true;
    group.add(brain);

    // 头（向前伸，没有眼睛）
    const headGeo = new THREE.BoxGeometry(def.size * 0.3, def.size * 0.25, def.size * 0.35);
    const headMat = new THREE.MeshLambertMaterial({ color: def.color - 0x111111 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, def.size * 0.35, def.size * 0.5);
    head.rotation.x = -0.2;
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);

    // 长舌头（可以动的）
    const tongueGeo = new THREE.BoxGeometry(0.04, 0.04, def.size * 1.5);
    const tongueMat = new THREE.MeshLambertMaterial({ color: 0xFF6666 });
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.position.set(0, def.size * 0.25, def.size * 0.85);
    tongue.userData.part = 'tongue';
    group.add(tongue);

    // 前肢（两对爪子）
    const clawGeo = new THREE.ConeGeometry(0.08, def.size * 0.35, 4);
    const clawMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    // 前左爪
    const clawFL = new THREE.Mesh(clawGeo, clawMat);
    clawFL.position.set(-def.size * 0.3, def.size * 0.05, def.size * 0.25);
    clawFL.rotation.x = -Math.PI / 4;
    clawFL.userData.part = 'claw';
    group.add(clawFL);
    // 前右爪
    const clawFR = new THREE.Mesh(clawGeo, clawMat);
    clawFR.position.set(def.size * 0.3, def.size * 0.05, def.size * 0.25);
    clawFR.rotation.x = -Math.PI / 4;
    clawFR.userData.part = 'claw';
    group.add(clawFR);
    // 后左爪
    const clawBL = new THREE.Mesh(clawGeo, clawMat);
    clawBL.position.set(-def.size * 0.25, def.size * 0.05, -def.size * 0.25);
    clawBL.rotation.x = -Math.PI / 4;
    clawBL.userData.part = 'claw';
    group.add(clawBL);
    // 后右爪
    const clawBR = new THREE.Mesh(clawGeo, clawMat);
    clawBR.position.set(def.size * 0.25, def.size * 0.05, -def.size * 0.25);
    clawBR.rotation.x = -Math.PI / 4;
    clawBR.userData.part = 'claw';
    group.add(clawBR);

    // 尾巴（长而细）
    const tailGeo = new THREE.CylinderGeometry(0.05, 0.12, def.size * 1.2, 6);
    const tailMat = new THREE.MeshLambertMaterial({ color: def.color });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, def.size * 0.25, -def.size * 0.9);
    tail.rotation.x = Math.PI / 3;
    group.add(tail);
  } else if (def.wyvern) {
    // 飞龙外观 - 飞行怪物
    // 身体（流线型）
    const bodyGeo = new THREE.BoxGeometry(def.size * 0.5, def.size * 0.4, def.size * 0.9);
    const bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = def.size * 0.5;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);

    // 头（带角）
    const headGeo = new THREE.ConeGeometry(def.size * 0.25, def.size * 0.5, 6);
    const headMat = new THREE.MeshLambertMaterial({ color: def.color + 0x111111 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, def.size * 0.6, def.size * 0.6);
    head.rotation.x = -Math.PI / 3;
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);

    // 发光的黄色眼睛
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFDD00 });
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), eyeMat);
    eye1.position.set(-0.12, def.size * 0.65, def.size * 0.45);
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.x = 0.12;
    group.add(eye2);

    // 翅膀（使用Group实现根部旋转）
    const wingMat = new THREE.MeshLambertMaterial({ color: def.color - 0x111111, transparent: true, opacity: 0.9 });
    
    // 左翼根节点（位于身体侧面）
    const wingRoot1 = new THREE.Group();
    wingRoot1.position.set(-def.size * 0.25, def.size * 0.6, -0.1);
    wingRoot1.userData.part = 'wingRoot';
    wingRoot1.userData.side = 'left';
    group.add(wingRoot1);
    
    // 左翼面（相对于根节点偏移，使根部成为旋转中心）
    const wingGeo = new THREE.BoxGeometry(def.size * 1.2, 0.05, def.size * 0.6);
    const wing1 = new THREE.Mesh(wingGeo, wingMat);
    wing1.position.set(-def.size * 0.6, 0, 0); // 向外偏移，根部在(0,0,0)
    wing1.userData.part = 'wing';
    wingRoot1.add(wing1);
    
    // 右翼根节点
    const wingRoot2 = new THREE.Group();
    wingRoot2.position.set(def.size * 0.25, def.size * 0.6, -0.1);
    wingRoot2.userData.part = 'wingRoot';
    wingRoot2.userData.side = 'right';
    group.add(wingRoot2);
    
    // 右翼面
    const wing2 = new THREE.Mesh(wingGeo, wingMat);
    wing2.position.set(def.size * 0.6, 0, 0);
    wing2.userData.part = 'wing';
    wingRoot2.add(wing2);

    // 尾巴
    const tailGeo = new THREE.ConeGeometry(def.size * 0.15, def.size * 0.8, 6);
    const tailMat = new THREE.MeshLambertMaterial({ color: def.color });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, def.size * 0.4, -def.size * 0.7);
    tail.rotation.x = Math.PI / 2;
    group.add(tail);

    // 爪子
    const clawGeo = new THREE.ConeGeometry(0.06, def.size * 0.3, 4);
    const clawMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const claw1 = new THREE.Mesh(clawGeo, clawMat);
    claw1.position.set(-0.15, def.size * 0.15, def.size * 0.3);
    claw1.rotation.x = -Math.PI / 4;
    group.add(claw1);
    const claw2 = claw1.clone();
    claw2.position.x = 0.15;
    group.add(claw2);

    // 设置飞行高度
    group.userData.flying = true;
    group.userData.flyHeight = 4 + Math.random() * 2; // 4-6米飞行高度
  } else if (def.elite) {
    // 精英僵尸 - 装甲外观
    const bodyGeo = new THREE.BoxGeometry(def.size * 0.65, def.size * 0.85, def.size * 0.45);
    const bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = def.size * 0.72;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    
    // 装甲板
    const armorGeo = new THREE.BoxGeometry(def.size * 0.7, def.size * 0.5, def.size * 0.5);
    const armorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const armor = new THREE.Mesh(armorGeo, armorMat);
    armor.position.set(0, def.size * 0.8, 0);
    group.add(armor);
    
    // 角
    const hornGeo = new THREE.ConeGeometry(0.08, 0.3, 6);
    const hornMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const horn1 = new THREE.Mesh(hornGeo, hornMat);
    horn1.position.set(-0.2, def.size * 1.5, 0);
    horn1.rotation.z = 0.3;
    group.add(horn1);
    const horn2 = horn1.clone();
    horn2.position.x = 0.2;
    horn2.rotation.z = -0.3;
    group.add(horn2);
    
    // 头
    const headGeo = new THREE.BoxGeometry(def.size * 0.4, def.size * 0.4, def.size * 0.4);
    const headMat = new THREE.MeshLambertMaterial({ color: def.color + 0x111111 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = def.size * 1.4;
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    
    // 发光红眼
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), eyeMat);
    eye1.position.set(-0.12, def.size * 1.45, -def.size * 0.2);
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.x = 0.12;
    group.add(eye2);
    
    // 带刺手臂
    const armGeo = new THREE.BoxGeometry(0.2, def.size * 0.6, 0.2);
    const armMat = new THREE.MeshLambertMaterial({ color: def.color - 0x111111 });
    const arm1 = new THREE.Mesh(armGeo, armMat);
    arm1.position.set(-def.size * 0.5, def.size * 0.65, 0);
    arm1.userData.part = 'arm';
    group.add(arm1);
    const arm2 = arm1.clone();
    arm2.position.x = def.size * 0.5;
    arm2.userData.part = 'arm';
    group.add(arm2);
    
    // 腿
    const legGeo = new THREE.BoxGeometry(0.22, def.size * 0.5, 0.22);
    const leg1 = new THREE.Mesh(legGeo, armMat);
    leg1.position.set(-0.18, def.size * 0.25, 0);
    leg1.userData.part = 'leg';
    group.add(leg1);
    const leg2 = leg1.clone();
    leg2.position.x = 0.18;
    leg2.userData.part = 'leg';
    group.add(leg2);
  } else {
    // 标准僵尸
    // 身体
    const bodyGeo = new THREE.BoxGeometry(def.size * 0.6, def.size * 0.8, def.size * 0.4);
    const bodyMat = new THREE.MeshLambertMaterial({ color: def.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = def.size * 0.7;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);

    // 头
    const headGeo = new THREE.BoxGeometry(def.size * 0.35, def.size * 0.35, def.size * 0.35);
    const headMat = new THREE.MeshLambertMaterial({ color: def.color + 0x111111 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = def.size * 1.3;
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);

    // 眼睛
    const eyeColor = def.poison ? 0x44ff44 : (def.ranged ? 0xffaa00 : 0xff0000);
    const eyeMat = new THREE.MeshBasicMaterial({ color: def.stealth ? 0x000000 : eyeColor });
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), eyeMat);
    eye1.position.set(-0.1, def.size * 1.35, -def.size * 0.18);
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.x = 0.1;
    group.add(eye2);

    // 手臂
    const armGeo = new THREE.BoxGeometry(0.15, def.size * 0.6, 0.15);
    const armMat = new THREE.MeshLambertMaterial({ color: def.color - 0x111111 });
    const arm1 = new THREE.Mesh(armGeo, armMat);
    arm1.position.set(-def.size * 0.45, def.size * 0.6, 0);
    arm1.rotation.z = 0.3;
    arm1.userData.part = 'arm';
    group.add(arm1);
    const arm2 = arm1.clone();
    arm2.position.x = def.size * 0.45;
    arm2.rotation.z = -0.3;
    arm2.userData.part = 'arm';
    group.add(arm2);

    // 腿
    const legGeo = new THREE.BoxGeometry(0.18, def.size * 0.5, 0.18);
    const leg1 = new THREE.Mesh(legGeo, armMat);
    leg1.position.set(-0.15, def.size * 0.25, 0);
    leg1.userData.part = 'leg';
    group.add(leg1);
    const leg2 = leg1.clone();
    leg2.position.x = 0.15;
    leg2.userData.part = 'leg';
    group.add(leg2);
  }

  // 发光效果（爆炸僵尸、毒液僵尸）
  if (def.glow) {
    const glowLight = new THREE.PointLight(def.glow, 1, 5);
    glowLight.position.y = def.size;
    group.add(glowLight);
  }

  if (def.stealth) {
    group.visible = false;
    group.userData.stealthCooldown = 0;
  }
  
  // 确保生成位置安全（不在建筑物内）
  let spawnPos = pos;
  if (!spawnPos) {
    spawnPos = getRandomSpawnPos();
  } else {
    // 验证传入的位置是否安全
    spawnPos = validateSpawnPos(spawnPos) || getRandomSpawnPos();
  }
  group.position.copy(spawnPos);
  
  // 雪地地图：调整生成高度到地形表面
  if (window.currentMap === 'snow' && window.SnowMap && SnowMap.getTerrainHeight) {
    const terrainH = SnowMap.getTerrainHeight(spawnPos.x, spawnPos.z);
    group.position.y = terrainH;
  }
  
  scene.add(group);

  // 波次加成 + 天气加成
  const waveHpMult = 1 + (wave - 1) * 0.15;
  const waveSpeedMult = Math.min(1 + (wave - 1) * 0.02, 1.3);
  
  // 应用天气效果倍率
  let weatherHpMult = 1, weatherSpeedMult = 1, weatherDamageMult = 1;
  if (window.WeatherSystem) {
    const weatherMults = WeatherSystem.getEnemyStatMult();
    weatherHpMult = weatherMults.health;
    weatherSpeedMult = weatherMults.speed;
    weatherDamageMult = weatherMults.damage;
  }
  
  const finalHpMult = waveHpMult * weatherHpMult;
  const finalSpeedMult = waveSpeedMult * weatherSpeedMult;
  
  const enemy = {
    mesh: group,
    def: def,
    hp: def.hp * finalHpMult,
    maxHp: def.hp * finalHpMult,
    speed: def.speed * finalSpeedMult,
    damageMult: weatherDamageMult, // 伤害倍率用于攻击计算
    attackTimer: 0,
    attackAnimTimer: 0,
    dead: false,
    animTimer: Math.random() * Math.PI * 2,
    poisonTimer: 0,
  };
  enemies.push(enemy);
  
  // 雪山冰霜僵尸：替换材质为冰霜色
  if (def.snow) {
    group.traverse(child => {
      if (child.isMesh && child.material) {
        if (child.material.isMeshBasicMaterial) {
          // 眼睛等发光材质 → 冰蓝发光
          child.material.color.setHex(0x00ccff);
        }
      }
    });
  }
  
  // 荒漠僵尸：替换材质为沙色
  if (def.desert) {
    group.traverse(child => {
      if (child.isMesh && child.material) {
        if (child.material.isMeshBasicMaterial) {
          // 眼睛等发光材质 → 橙红发光（沙漠热风）
          child.material.color.setHex(0xff6600);
        }
      }
    });
  }
  
  return enemy;
}

// ===== 沙漠专属怪物模型创建 =====
function createDesertEnemyModel(group, def) {
  const s = def.size;
  const c = def.color;
  const name = def.name;

  // 通用材质
  const skinMat = new THREE.MeshLambertMaterial({ color: c });
  const darkMat = new THREE.MeshLambertMaterial({ color: c - 0x222222 });
  const boneMat = new THREE.MeshLambertMaterial({ color: 0xDDCCAA });

  if (name === '干尸行者') {
    // 干尸行者：干瘪的人形，皮肤龟裂，关节突出
    // 身体（瘦长）
    const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.75, s * 0.35), skinMat);
    body.position.y = s * 0.65;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    // 肋骨突出（胸前几条线）
    for (let i = 0; i < 3; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(s * 0.4, 0.04, 0.04), boneMat);
      rib.position.set(0, s * (0.5 + i * 0.15), s * 0.18);
      group.add(rib);
    }
    // 头（干瘪，颧骨突出）
    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.3, s * 0.35, s * 0.3), skinMat);
    head.position.y = s * 1.25;
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    // 颧骨
    const cheekL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), boneMat);
    cheekL.position.set(-s * 0.12, s * 1.22, s * 0.16);
    group.add(cheekL);
    const cheekR = cheekL.clone();
    cheekR.position.x = s * 0.12;
    group.add(cheekR);
    // 眼睛（深陷，橙红色）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF6600 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.03), eyeMat);
    eyeL.position.set(-0.08, s * 1.28, s * 0.16);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.08;
    group.add(eyeR);
    // 手臂（细长，下垂）
    const armGeo = new THREE.BoxGeometry(0.1, s * 0.55, 0.1);
    const armL = new THREE.Mesh(armGeo, darkMat);
    armL.position.set(-s * 0.35, s * 0.55, 0);
    armL.userData.part = 'arm';
    group.add(armL);
    const armR = armL.clone();
    armR.position.x = s * 0.35;
    armR.userData.part = 'arm';
    group.add(armR);
    // 腿（细，关节突出）
    const legGeo = new THREE.BoxGeometry(0.12, s * 0.45, 0.12);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-s * 0.15, s * 0.22, 0);
    legL.userData.part = 'leg';
    group.add(legL);
    const legR = legL.clone();
    legR.position.x = s * 0.15;
    legR.userData.part = 'leg';
    group.add(legR);
    // 膝盖骨突出
    const kneeGeo = new THREE.SphereGeometry(0.06, 4, 4);
    const kneeL = new THREE.Mesh(kneeGeo, boneMat);
    kneeL.position.set(-s * 0.15, s * 0.38, 0.08);
    group.add(kneeL);
    const kneeR = kneeL.clone();
    kneeR.position.x = s * 0.15;
    group.add(kneeR);

  } else if (name === '毒蝎丧尸') {
    // 毒蝎丧尸：人形+蝎子尾巴，四足爬行姿态
    // 身体（扁平）
    const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.6, s * 0.3, s * 0.8), skinMat);
    body.position.y = s * 0.35;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    // 甲壳（背部）
    const shell = new THREE.Mesh(new THREE.BoxGeometry(s * 0.65, 0.08, s * 0.7), darkMat);
    shell.position.set(0, s * 0.52, -s * 0.05);
    group.add(shell);
    // 头（向前伸）
    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.25, s * 0.22, s * 0.3), skinMat);
    head.position.set(0, s * 0.4, s * 0.5);
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    // 钳子（大螯）
    const clawMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const clawGeo = new THREE.BoxGeometry(0.08, 0.2, 0.15);
    const clawL = new THREE.Mesh(clawGeo, clawMat);
    clawL.position.set(-s * 0.2, s * 0.25, s * 0.65);
    clawL.rotation.x = -0.5;
    group.add(clawL);
    const clawR = clawL.clone();
    clawR.position.x = s * 0.2;
    group.add(clawR);
    // 尾巴（分段，向上弯曲）
    const tailMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.08 - i * 0.01, 0.08, 0.12), tailMat);
      seg.position.set(0, s * (0.4 + i * 0.12), -s * (0.35 + i * 0.1));
      group.add(seg);
    }
    // 毒刺（尾端）
    const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 4), new THREE.MeshBasicMaterial({ color: 0x44FF44 }));
    stinger.position.set(0, s * 0.95, -s * 0.8);
    stinger.rotation.x = -0.3;
    group.add(stinger);
    // 四肢（爬行姿态）
    const limbGeo = new THREE.BoxGeometry(0.1, s * 0.25, 0.1);
    for (let i = 0; i < 4; i++) {
      const limb = new THREE.Mesh(limbGeo, darkMat);
      const side = i < 2 ? -1 : 1;
      const front = i % 2 === 0 ? 1 : -1;
      limb.position.set(side * s * 0.3, s * 0.15, front * s * 0.25);
      limb.userData.part = i < 2 ? 'arm' : 'leg';
      group.add(limb);
    }
    // 眼睛（绿色发光）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x44FF44 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.03), eyeMat);
    eyeL.position.set(-0.07, s * 0.45, s * 0.65);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.07;
    group.add(eyeR);

  } else if (name === '甲虫巨尸') {
    // 甲虫巨尸：庞大身躯，背部有厚重甲壳，正面几乎无敌
    // 身体（宽大）
    const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.8, s * 0.7, s * 0.6), skinMat);
    body.position.y = s * 0.6;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    // 肚子（浅色腹部面板，甲虫特征）——正面大面积可见
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xD4B896 });
    const belly = new THREE.Mesh(new THREE.BoxGeometry(s * 0.6, s * 0.5, 0.05), bellyMat);
    belly.position.set(0, s * 0.5, s * 0.32); // 正面中央，与身体前面齐平
    group.add(belly);
    // 腹部横纹（深色条纹，增加层次感）
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
    for (let i = 0; i < 5; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, 0.04, 0.06), stripeMat);
      stripe.position.set(0, s * (0.3 + i * 0.1), s * 0.35);
      group.add(stripe);
    }
    // 背部甲壳（多层，像甲虫背甲）
    const shellMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
    for (let i = 0; i < 3; i++) {
      const shell = new THREE.Mesh(new THREE.BoxGeometry(s * (0.7 - i * 0.05), 0.1, s * 0.4), shellMat);
      shell.position.set(0, s * (0.95 + i * 0.08), -i * s * 0.08);
      group.add(shell);
    }
    // 头（小，缩在甲壳下）
    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.25, s * 0.2, s * 0.25), skinMat);
    head.position.set(0, s * 0.85, s * 0.35);
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    // 大角（向前）
    const hornMat = new THREE.MeshLambertMaterial({ color: 0x4A3728 });
    const hornGeo = new THREE.ConeGeometry(0.08, s * 0.3, 6);
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-s * 0.12, s * 0.9, s * 0.5);
    hornL.rotation.x = -0.5;
    group.add(hornL);
    const hornR = hornL.clone();
    hornR.position.x = s * 0.12;
    group.add(hornR);
    // 粗短手臂（带刺）
    const armGeo = new THREE.BoxGeometry(0.2, s * 0.35, 0.2);
    const armL = new THREE.Mesh(armGeo, darkMat);
    armL.position.set(-s * 0.55, s * 0.5, s * 0.1);
    armL.userData.part = 'arm';
    group.add(armL);
    const armR = armL.clone();
    armR.position.x = s * 0.55;
    armR.userData.part = 'arm';
    group.add(armR);
    // 刺
    const spikeGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
    for (let side of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const spike = new THREE.Mesh(spikeGeo, hornMat);
        spike.position.set(side * s * 0.65, s * (0.4 + j * 0.12), 0);
        spike.rotation.z = side * Math.PI / 2;
        group.add(spike);
      }
    }
    // 粗腿
    const legGeo = new THREE.BoxGeometry(0.2, s * 0.35, 0.2);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-s * 0.25, s * 0.18, 0);
    legL.userData.part = 'leg';
    group.add(legL);
    const legR = legL.clone();
    legR.position.x = s * 0.25;
    legR.userData.part = 'leg';
    group.add(legR);
    // 眼睛（小，橙红色）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF4400 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.03), eyeMat);
    eyeL.position.set(-0.08, s * 0.9, s * 0.48);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.08;
    group.add(eyeR);

  } else if (name === '秃鹫腐尸') {
    // 秃鹫腐尸：人形+退化翅膀，可以喷射腐蚀性胃液（远程）
    // 身体（驼背）
    const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.65, s * 0.4), skinMat);
    body.position.y = s * 0.6;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    // 驼背（背部隆起）
    const hump = new THREE.Mesh(new THREE.SphereGeometry(s * 0.25, 6, 6), darkMat);
    hump.position.set(0, s * 0.85, -s * 0.1);
    hump.scale.z = 0.6;
    group.add(hump);
    // 退化翅膀（小，不能飞）
    const wingMat = new THREE.MeshLambertMaterial({ color: c - 0x333333, transparent: true, opacity: 0.7 });
    const wingGeo = new THREE.BoxGeometry(s * 0.5, 0.03, s * 0.25);
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-s * 0.35, s * 0.8, -s * 0.1);
    wingL.rotation.z = 0.3;
    group.add(wingL);
    const wingR = wingL.clone();
    wingR.position.x = s * 0.35;
    wingR.rotation.z = -0.3;
    group.add(wingR);
    // 头（秃鹫头，长喙）
    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.2, s * 0.22, s * 0.25), skinMat);
    head.position.set(0, s * 1.15, s * 0.15);
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    // 长喙
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, s * 0.2, 4), new THREE.MeshLambertMaterial({ color: 0x8B7355 }));
    beak.position.set(0, s * 1.1, s * 0.35);
    beak.rotation.x = -Math.PI / 2;
    group.add(beak);
    // 眼睛（黄色）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFDD00 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), eyeMat);
    eyeL.position.set(-0.07, s * 1.2, s * 0.28);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.07;
    group.add(eyeR);
    // 手臂（细长，爪子）
    const armGeo = new THREE.BoxGeometry(0.1, s * 0.5, 0.1);
    const armL = new THREE.Mesh(armGeo, darkMat);
    armL.position.set(-s * 0.35, s * 0.5, 0);
    armL.userData.part = 'arm';
    group.add(armL);
    const armR = armL.clone();
    armR.position.x = s * 0.35;
    armR.userData.part = 'arm';
    group.add(armR);
    // 爪子
    const clawGeo = new THREE.ConeGeometry(0.03, 0.1, 4);
    const clawMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    for (let side of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const claw = new THREE.Mesh(clawGeo, clawMat);
        claw.position.set(side * s * 0.35, s * 0.2, 0.05 + j * 0.04);
        claw.rotation.x = -0.5;
        group.add(claw);
      }
    }
    // 腿
    const legGeo = new THREE.BoxGeometry(0.12, s * 0.4, 0.12);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-s * 0.15, s * 0.2, 0);
    legL.userData.part = 'leg';
    group.add(legL);
    const legR = legL.clone();
    legR.position.x = s * 0.15;
    legR.userData.part = 'leg';
    group.add(legR);

  } else if (name === '自爆火甲虫') {
    // 自爆火甲虫：圆滚滚的身体，背部有发光的气囊，体内充满易燃气体
    // 身体（球形，圆滚滚）
    const body = new THREE.Mesh(new THREE.SphereGeometry(s * 0.35, 8, 8), skinMat);
    body.position.y = s * 0.45;
    body.scale.y = 0.8;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    // 背部发光气囊（多个）
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xFFAA00, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 4; i++) {
      const sac = new THREE.Mesh(new THREE.SphereGeometry(s * 0.1, 6, 6), glowMat);
      const angle = (i / 4) * Math.PI * 2;
      sac.position.set(Math.cos(angle) * s * 0.15, s * 0.65, Math.sin(angle) * s * 0.15);
      group.add(sac);
    }
    // 头（小）
    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.2, s * 0.18, s * 0.2), skinMat);
    head.position.set(0, s * 0.55, s * 0.3);
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    // 小角
    const hornGeo = new THREE.ConeGeometry(0.03, 0.1, 4);
    const hornMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.06, s * 0.65, s * 0.38);
    group.add(hornL);
    const hornR = hornL.clone();
    hornR.position.x = 0.06;
    group.add(hornR);
    // 短腿（6条，像甲虫）
    const legGeo = new THREE.BoxGeometry(0.06, s * 0.15, 0.06);
    for (let i = 0; i < 6; i++) {
      const leg = new THREE.Mesh(legGeo, darkMat);
      const side = i < 3 ? -1 : 1;
      const front = (i % 3) - 1;
      leg.position.set(side * s * 0.25, s * 0.2, front * s * 0.15);
      leg.userData.part = 'leg';
      group.add(leg);
    }
    // 眼睛（红色发光）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.03), eyeMat);
    eyeL.position.set(-0.06, s * 0.58, s * 0.4);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.06;
    group.add(eyeR);
    // 发光效果
    const glowLight = new THREE.PointLight(0xFFAA00, 1, 5);
    glowLight.position.y = s * 0.6;
    group.add(glowLight);

  } else if (name === '沙蛇潜行者') {
    // 沙蛇潜行者：蛇形下半身，人形上半身，鳞片覆盖
    // 下半身（蛇形，盘绕）
    const tailMat = new THREE.MeshLambertMaterial({ color: 0xC9B896 });
    for (let i = 0; i < 8; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(s * (0.18 - i * 0.015), 6, 6), tailMat);
      seg.position.set(Math.sin(i * 0.5) * s * 0.1, s * 0.15, -i * s * 0.08);
      seg.scale.y = 0.6;
      group.add(seg);
    }
    // 上半身（人形）
    const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.45, s * 0.5, s * 0.3), skinMat);
    body.position.y = s * 0.55;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    // 鳞片纹理（胸前）
    const scaleMat = new THREE.MeshLambertMaterial({ color: 0xB8A88A });
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const scale = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), scaleMat);
        scale.position.set((j - 0.5) * 0.12, s * (0.4 + i * 0.1), s * 0.16);
        group.add(scale);
      }
    }
    // 头（蛇头，扁平）
    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.22, s * 0.15, s * 0.25), skinMat);
    head.position.set(0, s * 0.95, s * 0.12);
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    // 蛇眼（黄色，竖瞳）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFDD00 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.03), eyeMat);
    eyeL.position.set(-0.08, s * 0.96, s * 0.24);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.08;
    group.add(eyeR);
    // 手臂（带鳞片）
    const armGeo = new THREE.BoxGeometry(0.1, s * 0.4, 0.1);
    const armL = new THREE.Mesh(armGeo, darkMat);
    armL.position.set(-s * 0.3, s * 0.5, 0);
    armL.userData.part = 'arm';
    group.add(armL);
    const armR = armL.clone();
    armR.position.x = s * 0.3;
    armR.userData.part = 'arm';
    group.add(armR);
    // 爪子
    const clawGeo = new THREE.ConeGeometry(0.03, 0.08, 4);
    const clawMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    for (let side of [-1, 1]) {
      const claw = new THREE.Mesh(clawGeo, clawMat);
      claw.position.set(side * s * 0.3, s * 0.25, 0.05);
      claw.rotation.x = -0.3;
      group.add(claw);
    }

  } else if (name === '荒漠暴君') {
    // 荒漠暴君：巨大人形狼，统领狼群，可召唤沙柱
    // 身体（健壮）
    const body = new THREE.Mesh(new THREE.BoxGeometry(s * 0.7, s * 0.8, s * 0.5), skinMat);
    body.position.y = s * 0.7;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    // 胸甲（沙漠狼王特征）
    const armorMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
    const chest = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 0.3, s * 0.1), armorMat);
    chest.position.set(0, s * 0.85, s * 0.26);
    group.add(chest);
    // 狼头
    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.3, s * 0.3, s * 0.35), skinMat);
    head.position.set(0, s * 1.35, s * 0.2);
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    // 狼嘴（向前突出）
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(s * 0.15, s * 0.12, s * 0.2), darkMat);
    muzzle.position.set(0, s * 1.3, s * 0.45);
    group.add(muzzle);
    // 尖牙
    const fangMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const fangGeo = new THREE.ConeGeometry(0.03, 0.08, 4);
    const fangL = new THREE.Mesh(fangGeo, fangMat);
    fangL.position.set(-0.05, s * 1.22, s * 0.52);
    fangL.rotation.x = Math.PI;
    group.add(fangL);
    const fangR = fangL.clone();
    fangR.position.x = 0.05;
    group.add(fangR);
    // 狼耳（尖）
    const earGeo = new THREE.ConeGeometry(0.05, 0.12, 4);
    const earMat = new THREE.MeshLambertMaterial({ color: c - 0x111111 });
    const earL = new THREE.Mesh(earGeo, earMat);
    earL.position.set(-s * 0.1, s * 1.55, 0);
    earL.rotation.z = 0.3;
    group.add(earL);
    const earR = earL.clone();
    earR.position.x = s * 0.1;
    earR.rotation.z = -0.3;
    group.add(earR);
    // 眼睛（红色发光）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), eyeMat);
    eyeL.position.set(-0.1, s * 1.38, s * 0.38);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.1;
    group.add(eyeR);
    // 粗壮手臂（带爪）
    const armGeo = new THREE.BoxGeometry(0.2, s * 0.55, 0.2);
    const armL = new THREE.Mesh(armGeo, darkMat);
    armL.position.set(-s * 0.5, s * 0.6, 0);
    armL.userData.part = 'arm';
    group.add(armL);
    const armR = armL.clone();
    armR.position.x = s * 0.5;
    armR.userData.part = 'arm';
    group.add(armR);
    // 大爪
    const clawGeo = new THREE.ConeGeometry(0.05, 0.15, 4);
    const clawMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    for (let side of [-1, 1]) {
      for (let j = 0; j < 3; j++) {
        const claw = new THREE.Mesh(clawGeo, clawMat);
        claw.position.set(side * s * 0.5, s * 0.2, 0.05 + j * 0.05);
        claw.rotation.x = -0.3;
        group.add(claw);
      }
    }
    // 粗腿
    const legGeo = new THREE.BoxGeometry(0.2, s * 0.45, 0.2);
    const legL = new THREE.Mesh(legGeo, darkMat);
    legL.position.set(-s * 0.25, s * 0.22, 0);
    legL.userData.part = 'leg';
    group.add(legL);
    const legR = legL.clone();
    legR.position.x = s * 0.25;
    legR.userData.part = 'leg';
    group.add(legR);
    // 尾巴
    const tailGeo = new THREE.CylinderGeometry(0.06, 0.03, s * 0.5, 6);
    const tail = new THREE.Mesh(tailGeo, earMat);
    tail.position.set(0, s * 0.4, -s * 0.4);
    tail.rotation.x = -0.5;
    group.add(tail);

  } else if (name === '沙虫巨兽') {
    // 沙虫巨兽：巨大的沙虫形态，多节身体，可钻入沙地
    // 主体（粗壮的前段）
    const body = new THREE.Mesh(new THREE.CylinderGeometry(s * 0.3, s * 0.4, s * 0.8, 8), skinMat);
    body.position.y = s * 0.5;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    // 多节身体（向后延伸）
    const segMat = new THREE.MeshLambertMaterial({ color: c - 0x111111 });
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(s * (0.3 - i * 0.04), s * (0.35 - i * 0.04), s * 0.25, 8), segMat);
      seg.position.set(0, s * 0.35, -s * (0.4 + i * 0.25));
      seg.rotation.x = -0.2;
      group.add(seg);
    }
    // 头（圆形大嘴）
    const head = new THREE.Mesh(new THREE.ConeGeometry(s * 0.25, s * 0.3, 8), skinMat);
    head.position.set(0, s * 1.0, s * 0.15);
    head.rotation.x = -Math.PI / 3;
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    // 牙齿（环绕嘴部）
    const toothMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const toothGeo = new THREE.ConeGeometry(0.04, 0.1, 4);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      tooth.position.set(Math.cos(angle) * s * 0.15, s * 1.05, s * 0.25 + Math.sin(angle) * s * 0.08);
      tooth.rotation.x = -0.5;
      tooth.rotation.z = angle;
      group.add(tooth);
    }
    // 眼睛（多个小眼）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eyeMat);
      eye.position.set(Math.cos(angle) * s * 0.12, s * 0.95, s * 0.1 + Math.sin(angle) * s * 0.06);
      group.add(eye);
    }
    // 侧鳍
    const finGeo = new THREE.BoxGeometry(s * 0.3, 0.05, s * 0.15);
    const finMat = new THREE.MeshLambertMaterial({ color: c - 0x222222 });
    const finL = new THREE.Mesh(finGeo, finMat);
    finL.position.set(-s * 0.35, s * 0.5, 0);
    finL.rotation.z = 0.3;
    group.add(finL);
    const finR = finL.clone();
    finR.position.x = s * 0.35;
    finR.rotation.z = -0.3;
    group.add(finR);
  }
}

// ===== 沙漠怪物专属动画系统 =====
function animateDesertEnemy(e, parts, isMoving, t, dt, dist) {
  const name = e.def.name;
  const s = e.def.size;

  // 通用：身体随呼吸轻微起伏
  if (parts.body) {
    const breathSpeed = name === '自爆火甲虫' ? 4 : 2;
    const breathAmp = name === '自爆火甲虫' ? 0.015 : 0.008;
    parts.body.position.y += Math.sin(t * breathSpeed) * breathAmp;
  }

  if (name === '干尸行者') {
    // 干尸行者：蹒跚步态，手臂下垂摆动，头部低垂左右晃动
    if (isMoving) {
      const staggerSpeed = 2.5;
      // 腿部蹒跚（一瘸一拐）
      parts.legs.forEach((leg, i) => {
        const offset = i === 0 ? 0 : Math.PI * 0.7;
        leg.rotation.x = Math.sin(t * staggerSpeed + offset) * 0.6;
        leg.rotation.z = Math.sin(t * staggerSpeed * 0.5 + offset) * 0.15;
      });
      // 手臂下垂摆动
      parts.arms.forEach((arm, i) => {
        const offset = i === 0 ? 0 : Math.PI;
        arm.rotation.x = Math.sin(t * staggerSpeed + offset) * 0.4 + 0.3;
        arm.rotation.z = Math.sin(t * staggerSpeed * 0.3 + offset) * 0.1;
      });
      // 头部低垂左右晃
      if (parts.head) {
        parts.head.rotation.x = 0.2 + Math.sin(t * staggerSpeed * 0.5) * 0.1;
        parts.head.rotation.y = Math.sin(t * staggerSpeed * 0.3) * 0.15;
      }
      // 身体左右摇晃
      if (parts.body) {
        parts.body.rotation.z = Math.sin(t * staggerSpeed * 0.5) * 0.08;
      }
      // 沙尘拖尾特效
      if (Math.random() < 0.15) {
        createSandParticle(e.mesh.position, 0.3);
      }
    } else {
      // 待机：轻微摇晃
      parts.legs.forEach(leg => { leg.rotation.x *= 0.95; leg.rotation.z *= 0.95; });
      parts.arms.forEach(arm => { arm.rotation.x *= 0.95; arm.rotation.z *= 0.95; });
      if (parts.head) {
        parts.head.rotation.x = 0.15 + Math.sin(t) * 0.05;
        parts.head.rotation.y *= 0.95;
      }
      if (parts.body) parts.body.rotation.z *= 0.95;
    }

  } else if (name === '毒蝎丧尸') {
    // 毒蝎丧尸：四足爬行，尾巴摇摆，毒刺闪烁
    if (isMoving) {
      const crawlSpeed = 6;
      // 四肢交替爬行
      parts.legs.forEach((leg, i) => {
        leg.rotation.x = Math.sin(t * crawlSpeed + i * Math.PI * 0.5) * 0.7;
      });
      // 手臂（螯）张开闭合
      parts.arms.forEach((arm, i) => {
        arm.rotation.x = Math.sin(t * crawlSpeed + i * Math.PI) * 0.3;
        arm.rotation.y = Math.sin(t * crawlSpeed * 0.5 + i * Math.PI) * 0.2;
      });
      // 尾巴S形摇摆
      e.mesh.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'BoxGeometry' && child.position.y > s * 0.5) {
          // 尾巴分段摆动
          const tailIdx = Math.floor((child.position.y - s * 0.4) / (s * 0.12));
          child.rotation.z = Math.sin(t * 4 + tailIdx * 0.5) * 0.3;
          child.rotation.x = Math.sin(t * 3 + tailIdx * 0.3) * 0.2;
        }
      });
      // 身体低伏
      if (parts.body) {
        parts.body.rotation.x = 0.1 + Math.sin(t * crawlSpeed) * 0.05;
      }
      // 沙尘特效
      if (Math.random() < 0.2) {
        createSandParticle(e.mesh.position, 0.4);
      }
    } else {
      // 待机：尾巴警戒竖起，螯张开
      parts.legs.forEach(leg => { leg.rotation.x *= 0.9; });
      parts.arms.forEach((arm, i) => {
        arm.rotation.x = 0.3 + Math.sin(t * 2 + i * Math.PI) * 0.1;
      });
      // 毒刺闪烁发光
      e.mesh.children.forEach(child => {
        if (child.material && child.material.color && child.material.color.getHex) {
          const hex = child.material.color.getHex();
          if (hex === 0x44FF44) {
            child.material.opacity = 0.5 + Math.sin(t * 8) * 0.5;
          }
        }
      });
    }

  } else if (name === '甲虫巨尸') {
    // 甲虫巨尸：沉重步伐，甲壳微微张开，角向前顶
    if (isMoving) {
      const heavySpeed = 2;
      // 粗腿沉重踏步
      parts.legs.forEach((leg, i) => {
        const offset = i === 0 ? 0 : Math.PI;
        leg.rotation.x = Math.sin(t * heavySpeed + offset) * 0.4;
        // 踏步时身体下沉
        if (Math.sin(t * heavySpeed + offset) > 0.5 && parts.body) {
          parts.body.position.y -= 0.005;
        }
      });
      // 手臂（带刺）前后摆动
      parts.arms.forEach((arm, i) => {
        const offset = i === 0 ? 0 : Math.PI;
        arm.rotation.x = Math.sin(t * heavySpeed + offset) * 0.35;
      });
      // 头部低垂冲锋姿态
      if (parts.head) {
        parts.head.rotation.x = 0.15 + Math.sin(t * heavySpeed) * 0.05;
      }
      // 甲壳微微振动
      e.mesh.children.forEach(child => {
        if (child.position.y > s * 0.9 && child.geometry && child.geometry.type === 'BoxGeometry') {
          child.position.y += Math.sin(t * heavySpeed * 2) * 0.003;
        }
      });
      // 地面震动特效（每步）
      if (Math.sin(t * heavySpeed) > 0.95 && Math.random() < 0.3) {
        createDustRing(e.mesh.position, 2, 0xC4A96B);
      }
    } else {
      // 待机：甲壳保护姿态
      parts.legs.forEach(leg => { leg.rotation.x *= 0.95; });
      parts.arms.forEach(arm => { arm.rotation.x *= 0.95; });
      if (parts.head) parts.head.rotation.x *= 0.95;
    }

  } else if (name === '秃鹫腐尸') {
    // 秃鹫腐尸：驼背蹒跚，翅膀抖动，喙部开合
    if (isMoving) {
      const hobbleSpeed = 2.8;
      // 腿蹒跚
      parts.legs.forEach((leg, i) => {
        const offset = i === 0 ? 0 : Math.PI * 0.8;
        leg.rotation.x = Math.sin(t * hobbleSpeed + offset) * 0.5;
      });
      // 翅膀抖动（退化翅膀无法飞但会抖）
      e.mesh.children.forEach(child => {
        if (child.material && child.material.transparent) {
          child.rotation.z += Math.sin(t * 10) * 0.02;
        }
      });
      // 手臂（爪子）抓挠动作
      parts.arms.forEach((arm, i) => {
        arm.rotation.x = Math.sin(t * hobbleSpeed + i * Math.PI) * 0.4 + 0.2;
      });
      // 头部啄击动作
      if (parts.head) {
        parts.head.rotation.x = Math.sin(t * hobbleSpeed * 1.5) * 0.15;
      }
      // 喙部开合
      e.mesh.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'ConeGeometry' && child.position.z > s * 0.3) {
          child.rotation.x = -Math.PI / 2 + Math.sin(t * hobbleSpeed) * 0.1;
        }
      });
    } else {
      // 待机：翅膀收拢，头部转动观察
      parts.legs.forEach(leg => { leg.rotation.x *= 0.95; });
      parts.arms.forEach(arm => { arm.rotation.x *= 0.95; });
      if (parts.head) {
        parts.head.rotation.y = Math.sin(t * 0.5) * 0.3;
      }
    }

  } else if (name === '自爆火甲虫') {
    // 自爆火甲虫：快速六足爬行，背部气囊脉动发光，身体左右摇摆
    if (isMoving) {
      const bugSpeed = 8;
      // 六足快速交替
      parts.legs.forEach((leg, i) => {
        const offset = i * Math.PI * 0.33;
        leg.rotation.x = Math.sin(t * bugSpeed + offset) * 0.8;
      });
      // 身体左右摇摆
      if (parts.body) {
        parts.body.rotation.z = Math.sin(t * bugSpeed * 0.5) * 0.1;
        parts.body.rotation.y = Math.sin(t * bugSpeed * 0.3) * 0.05;
      }
      // 背部气囊脉动
      e.mesh.children.forEach(child => {
        if (child.material && child.material.transparent && child.geometry && child.geometry.type === 'SphereGeometry') {
          const pulse = 0.7 + Math.sin(t * 6) * 0.3;
          child.scale.setScalar(pulse);
          if (child.material.opacity !== undefined) {
            child.material.opacity = 0.5 + Math.sin(t * 6) * 0.3;
          }
        }
      });
      // 头部小角晃动
      e.mesh.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'ConeGeometry' && child.position.y > s * 0.5) {
          child.rotation.z = Math.sin(t * bugSpeed + child.position.x * 10) * 0.1;
        }
      });
      // 火焰粒子
      if (Math.random() < 0.25) {
        createFireSpark(e.mesh.position, s * 0.6);
      }
    } else {
      // 待机：气囊缓慢脉动，六足微动
      parts.legs.forEach(leg => { leg.rotation.x *= 0.95; });
      // 气囊缓慢脉动
      e.mesh.children.forEach(child => {
        if (child.material && child.material.transparent && child.geometry && child.geometry.type === 'SphereGeometry') {
          const pulse = 0.85 + Math.sin(t * 2) * 0.15;
          child.scale.setScalar(pulse);
        }
      });
      if (parts.body) parts.body.rotation.z *= 0.95;
    }

  } else if (name === '沙蛇潜行者') {
    // 沙蛇潜行者：蛇形滑行，鳞片闪烁，尾巴S形摆动
    if (isMoving) {
      const slitherSpeed = 4;
      // 蛇形身体波浪运动（通过整体旋转模拟）
      e.mesh.rotation.z = Math.sin(t * slitherSpeed) * 0.08;
      // 手臂（人形上半身）摆动
      parts.arms.forEach((arm, i) => {
        const offset = i === 0 ? 0 : Math.PI;
        arm.rotation.x = Math.sin(t * slitherSpeed + offset) * 0.3;
      });
      // 蛇头左右探查
      if (parts.head) {
        parts.head.rotation.y = Math.sin(t * slitherSpeed * 0.5) * 0.25;
        parts.head.rotation.x = Math.sin(t * slitherSpeed) * 0.08;
      }
      // 鳞片闪烁效果
      e.mesh.children.forEach(child => {
        if (child.material && child.position.y > s * 0.3 && child.position.y < s * 0.7) {
          if (Math.random() < 0.05) {
            child.material.emissive = new THREE.Color(0x332211);
            setTimeout(() => { if (child.material) child.material.emissive = new THREE.Color(0x000000); }, 100);
          }
        }
      });
      // 沙尘滑行特效
      if (Math.random() < 0.3) {
        createSandParticle(e.mesh.position, 0.5);
      }
    } else {
      // 待机：隐身效果（半透明）
      e.mesh.traverse(child => {
        if (child.isMesh && child.material) {
          const targetOpacity = 0.4 + Math.sin(t * 1.5) * 0.2;
          if (child.material.transparent !== undefined) {
            child.material.transparent = true;
            child.material.opacity = targetOpacity;
          }
        }
      });
      parts.arms.forEach(arm => { arm.rotation.x *= 0.95; });
      if (parts.head) {
        parts.head.rotation.y = Math.sin(t * 0.8) * 0.2;
      }
    }

  } else if (name === '荒漠暴君') {
    // 荒漠暴君：霸气行走，狼头仰天长啸，尾巴甩动，爪子抓地
    if (isMoving) {
      const bossSpeed = 2.2;
      // 粗腿霸气踏步
      parts.legs.forEach((leg, i) => {
        const offset = i === 0 ? 0 : Math.PI;
        leg.rotation.x = Math.sin(t * bossSpeed + offset) * 0.5;
        // 爪子抓地
        e.mesh.children.forEach(child => {
          if (child.geometry && child.geometry.type === 'ConeGeometry' && child.position.y < s * 0.3) {
            child.rotation.x = -0.3 + Math.sin(t * bossSpeed + offset) * 0.2;
          }
        });
      });
      // 手臂大幅摆动
      parts.arms.forEach((arm, i) => {
        const offset = i === 0 ? 0 : Math.PI;
        arm.rotation.x = Math.sin(t * bossSpeed + offset) * 0.4;
        arm.rotation.z = (i === 0 ? 1 : -1) * 0.1;
      });
      // 狼头左右观察
      if (parts.head) {
        parts.head.rotation.y = Math.sin(t * bossSpeed * 0.4) * 0.2;
        parts.head.rotation.x = Math.sin(t * bossSpeed) * 0.05;
      }
      // 狼耳抖动
      e.mesh.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'ConeGeometry' && child.position.y > s * 1.4) {
          child.rotation.z = (child.position.x < 0 ? 1 : -1) * (0.3 + Math.sin(t * 8) * 0.05);
        }
      });
      // 尾巴甩动
      e.mesh.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'CylinderGeometry' && child.position.z < -s * 0.3) {
          child.rotation.z = Math.sin(t * bossSpeed * 1.5) * 0.3;
        }
      });
      // 霸气沙尘特效
      if (Math.random() < 0.2) {
        createDustRing(e.mesh.position, 3, 0x8B7355);
      }
    } else {
      // 待机：仰天长啸动画
      parts.legs.forEach(leg => { leg.rotation.x *= 0.95; });
      parts.arms.forEach(arm => { arm.rotation.x *= 0.95; });
      if (parts.head) {
        // 周期性仰天长啸
        const howlPhase = (t * 0.5) % (Math.PI * 2);
        if (howlPhase < 1) {
          parts.head.rotation.x = -0.3 - howlPhase * 0.3;
        } else {
          parts.head.rotation.x *= 0.95;
        }
      }
    }

  } else if (name === '沙虫巨兽') {
    // 沙虫巨兽：蠕动前行，多节身体波浪，牙齿咬合，侧鳍摆动
    if (isMoving) {
      const wormSpeed = 1.5;
      // 多节身体波浪蠕动
      e.mesh.children.forEach((child, idx) => {
        if (child.geometry && (child.geometry.type === 'CylinderGeometry' || child.geometry.type === 'SphereGeometry')) {
          if (child.position.z < s * 0.2) {
            // 身体段波浪
            const segIdx = Math.abs(Math.floor(child.position.z / (s * 0.2)));
            child.position.y = s * 0.35 + Math.sin(t * wormSpeed + segIdx * 0.8) * 0.08;
            child.rotation.z = Math.sin(t * wormSpeed + segIdx * 0.5) * 0.1;
          }
        }
      });
      // 头部上下探动
      if (parts.head) {
        parts.head.rotation.x = -Math.PI / 3 + Math.sin(t * wormSpeed) * 0.15;
        parts.head.rotation.y = Math.sin(t * wormSpeed * 0.3) * 0.1;
      }
      // 牙齿咬合
      e.mesh.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'ConeGeometry' && child.position.y > s * 0.9) {
          child.rotation.x = -0.5 + Math.sin(t * wormSpeed * 3) * 0.2;
        }
      });
      // 侧鳍摆动
      e.mesh.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'BoxGeometry' && child.position.y < s * 0.6) {
          if (Math.abs(child.position.x) > s * 0.2) {
            child.rotation.z = (child.position.x < 0 ? 1 : -1) * (0.3 + Math.sin(t * wormSpeed * 2) * 0.15);
          }
        }
      });
      // 眼睛闪烁
      e.mesh.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'SphereGeometry' && child.position.y > s * 0.8) {
          if (child.material && child.material.color && child.material.color.getHex() === 0xFF0000) {
            const pulse = 0.7 + Math.sin(t * 4 + child.position.x * 10) * 0.3;
            child.scale.setScalar(pulse);
          }
        }
      });
      // 破土沙尘特效
      if (Math.random() < 0.4) {
        createDustRing(e.mesh.position, 4, 0xC4A96B);
        createSandParticle(e.mesh.position, 0.8);
      }
    } else {
      // 待机：身体轻微蠕动，牙齿缓慢咬合
      e.mesh.children.forEach(child => {
        if (child.geometry && child.geometry.type === 'CylinderGeometry' && child.position.z < s * 0.2) {
          child.position.y = s * 0.35 + Math.sin(t * 1.5) * 0.03;
        }
      });
      if (parts.head) {
        parts.head.rotation.x = -Math.PI / 3 + Math.sin(t) * 0.05;
      }
    }
  }
}

// ===== 沙漠僵尸专属技能系统 =====
function executeDesertEnemySkill(e, dt, dist) {
  const name = e.def.name;
  
  // 初始化技能状态
  if (!e.desertSkill) {
    e.desertSkill = { timer: 0, cooldown: 0, phase: 'idle' };
  }
  const sk = e.desertSkill;
  sk.timer += dt;
  sk.cooldown = Math.max(0, sk.cooldown - dt);

  if (name === '毒蝎丧尸') {
    // 毒刺攻击：近战时附加中毒效果
    if (dist < e.def.attackRange && sk.cooldown <= 0) {
      sk.cooldown = 4;
      // 中毒效果（每秒5伤害，持续3秒）
      if (!window.playerPoison) window.playerPoison = { damage: 5, duration: 3, timer: 0 };
      else { window.playerPoison.damage = 5; window.playerPoison.duration = 3; window.playerPoison.timer = 0; }
      showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '中毒!', 0x44FF44);
      // 毒刺特效
      particles.push({
        pos: camera.position.clone().add(new THREE.Vector3(0, 1, 0)),
        vel: new THREE.Vector3(0, 0.1, 0),
        life: 0.8, color: 0x44FF44, size: 0.1
      });
    }

  } else if (name === '甲虫巨尸') {
    // 甲壳护甲：正面减伤25%（在damageEnemy中处理）
    // 额外技能：冲撞攻击
    if (dist < 8 && dist > 3 && sk.cooldown <= 0 && Math.random() < 0.01) {
      sk.cooldown = 6;
      sk.phase = 'charge';
      sk.chargeDir = new THREE.Vector3().subVectors(camera.position, e.mesh.position).normalize();
      sk.chargeDir.y = 0;
      sk.chargeTimer = 0;
      showFloatingText(e.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), '甲壳冲撞!', 0x8B7355);
    }
    if (sk.phase === 'charge') {
      sk.chargeTimer += dt;
      const chargeSpeed = e.def.speed * 4;
      e.mesh.position.x += sk.chargeDir.x * chargeSpeed * dt;
      e.mesh.position.z += sk.chargeDir.z * chargeSpeed * dt;
      // 使用实时距离检测碰撞
      const realDist = e.mesh.position.distanceTo(camera.position);
      if (realDist < 3) {
        damagePlayer(getEnemyDamage(e, 1.5));
        screenShake(1, 0.5);
        showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '冲撞!', 0x8B7355);
        sk.phase = 'idle';
      }
      if (sk.chargeTimer > 2) sk.phase = 'idle';
    }

  } else if (name === '秃鹫腐尸') {
    // 腐蚀喷吐：远程喷射胃液，命中致盲1.5秒
    if (dist < e.def.attackRange && sk.cooldown <= 0) {
      sk.cooldown = 5;
      // 创建腐蚀弹
      const dir = new THREE.Vector3().subVectors(camera.position, e.mesh.position).normalize();
      const bulletMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0x55AA00, emissive: 0x55AA00, emissiveIntensity: 0.3, transparent: true, opacity: 0.8 })
      );
      bulletMesh.position.copy(e.mesh.position).add(new THREE.Vector3(0, 1.2, 0));
      scene.add(bulletMesh);
      enemyBullets.push({
        mesh: bulletMesh,
        dir: dir,
        speed: 15,
        damage: e.def.damage * 0.6,
        life: 3,
        isDesert: true,
        effect: 'blind', // 致盲效果
        owner: e
      });
      showFloatingText(e.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), '腐蚀喷吐!', 0x55AA00);
    }

  } else if (name === '自爆火甲虫') {
    // 烈焰爆炸：死亡时爆炸并点燃（在enemy death中处理）
    // 额外：接近时加速
    if (dist < 6) {
      const speedBoost = 1 + (6 - dist) / 6;
      const toPlayer = new THREE.Vector3().subVectors(camera.position, e.mesh.position);
      toPlayer.y = 0;
      if (toPlayer.length() > 0.5) {
        toPlayer.normalize().multiplyScalar(e.def.speed * speedBoost * dt);
        e.mesh.position.x += toPlayer.x;
        e.mesh.position.z += toPlayer.z;
      }
    }

  } else if (name === '沙蛇潜行者') {
    // 沙潜：静止时隐身，移动时沙尘遮蔽
    if (sk.cooldown <= 0 && dist > 10 && Math.random() < 0.005) {
      // 隐身
      e.mesh.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = 0.15;
        }
      });
      sk.phase = 'hidden';
      sk.cooldown = 3;
    }
    if (sk.phase === 'hidden') {
      // 隐身时缓慢接近
      if (dist > 3) {
        const toPlayer = new THREE.Vector3().subVectors(camera.position, e.mesh.position);
        toPlayer.y = 0;
        if (toPlayer.length() > 0.5) {
          toPlayer.normalize().multiplyScalar(e.def.speed * 0.5 * dt);
          e.mesh.position.x += toPlayer.x;
          e.mesh.position.z += toPlayer.z;
        }
      }
      // 接近3米时显形并攻击
      const realDist = e.mesh.position.distanceTo(camera.position);
      if (realDist < 3) {
        e.mesh.traverse(child => {
          if (child.isMesh && child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
          }
        });
        sk.phase = 'idle';
        damagePlayer(getEnemyDamage(e, 1.8));
        screenShake(0.5, 0.3);
        showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '沙蛇突袭!', 0xC9B896);
        sk.cooldown = 5;
      }
      // 玩家离开15米后自动显形
      if (realDist > 15) {
        e.mesh.traverse(child => {
          if (child.isMesh && child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
          }
        });
        sk.phase = 'idle';
      }
    }

  } else if (name === '荒漠暴君') {
    // 沙柱召唤：每5秒在玩家脚下召唤沙柱
    if (sk.cooldown <= 0 && dist < 20) {
      sk.cooldown = 5;
      // 在玩家位置创建沙柱
      const pillarPos = camera.position.clone();
      pillarPos.y = 0;
      showFloatingText(pillarPos.clone().add(new THREE.Vector3(0, 3, 0)), '沙柱!', 0xC4A96B);
      // 延迟0.5秒后造成伤害（给玩家躲避时间）
      setTimeout(() => {
        const distToPillar = camera.position.distanceTo(pillarPos);
        if (distToPillar < 3) {
          damagePlayer(55);
          screenShake(1.5, 0.8);
          showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '沙柱命中!', 0xC4A96B);
        }
        // 沙柱特效
        for (let i = 0; i < 6; i++) {
          particles.push({
            pos: new THREE.Vector3(
              pillarPos.x + (Math.random() - 0.5) * 2,
              Math.random() * 4,
              pillarPos.z + (Math.random() - 0.5) * 2
            ),
            vel: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 3 + 1, (Math.random() - 0.5) * 2),
            life: 1, color: 0xC4A96B, size: 0.15
          });
        }
      }, 500);
    }

  } else if (name === '沙虫巨兽') {
    // 破土吞噬：钻入地下3秒后破土
    if (sk.cooldown <= 0 && dist < 15 && Math.random() < 0.008) {
      sk.cooldown = 12;
      sk.phase = 'underground';
      sk.undergroundTimer = 0;
      sk.targetPos = camera.position.clone();
      sk.targetPos.y = 0;
      showFloatingText(e.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), '钻入地下!', 0x5C4033);
      // 隐身（钻入地下）
      e.mesh.traverse(child => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          child.material.opacity = 0.1;
        }
      });
    }
    if (sk.phase === 'underground') {
      sk.undergroundTimer += dt;
      // 地下移动到目标位置
      const toTarget = new THREE.Vector3().subVectors(sk.targetPos, e.mesh.position);
      toTarget.y = 0;
      if (toTarget.length() > 0.5) {
        toTarget.normalize().multiplyScalar(e.def.speed * 2 * dt);
        e.mesh.position.x += toTarget.x;
        e.mesh.position.z += toTarget.z;
      }
      // 3秒后破土
      if (sk.undergroundTimer >= 3) {
        sk.phase = 'emerge';
        sk.emergeTimer = 0;
        // 显形
        e.mesh.traverse(child => {
          if (child.isMesh && child.material) {
            child.material.transparent = false;
            child.material.opacity = 1;
          }
        });
        showFloatingText(e.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), '破土吞噬!', 0xFF4400);
        screenShake(2, 1);
        // 破土伤害
        const distToEmerge = camera.position.distanceTo(e.mesh.position);
        if (distToEmerge < 5) {
          damagePlayer(getEnemyDamage(e, 2));
          showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '被吞噬!', 0xFF0000);
        }
        // 破土特效
        for (let i = 0; i < 10; i++) {
          particles.push({
            pos: new THREE.Vector3(
              e.mesh.position.x + (Math.random() - 0.5) * 4,
              Math.random() * 2,
              e.mesh.position.z + (Math.random() - 0.5) * 4
            ),
            vel: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 5 + 2, (Math.random() - 0.5) * 3),
            life: 1.2, color: 0x5C4033, size: 0.2
          });
        }
      }
    }
    if (sk.phase === 'emerge') {
      sk.emergeTimer += dt;
      if (sk.emergeTimer > 1) {
        sk.phase = 'idle';
      }
    }
  }
}

// ===== 沙漠特效辅助函数（推入particles数组统一更新，避免独立动画循环） =====
function createSandParticle(pos, intensity) {
  if (!scene) return;
  const count = Math.min(Math.floor(intensity * 2), 3);
  for (let i = 0; i < count; i++) {
    particles.push({
      pos: new THREE.Vector3(
        pos.x + (Math.random() - 0.5) * 0.5,
        pos.y + Math.random() * 0.3,
        pos.z + (Math.random() - 0.5) * 0.5
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.3 + 0.1,
        (Math.random() - 0.5) * 0.5
      ),
      life: 0.5 + Math.random() * 0.5,
      color: 0xC4A96B,
      size: 0.04 + Math.random() * 0.02,
    });
  }
}

function createDustRing(pos, radius, color) {
  if (!scene) return;
  // 使用粒子系统模拟尘土环，避免创建独立mesh和动画循环
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = radius * 0.5;
    particles.push({
      pos: new THREE.Vector3(
        pos.x + Math.cos(angle) * r,
        pos.y + 0.05,
        pos.z + Math.sin(angle) * r
      ),
      vel: new THREE.Vector3(
        Math.cos(angle) * radius * 0.5,
        0,
        Math.sin(angle) * radius * 0.5
      ),
      life: 0.8,
      color: color,
      size: 0.08,
    });
  }
}

function createFireSpark(pos, height) {
  if (!scene) return;
  particles.push({
    pos: new THREE.Vector3(
      pos.x + (Math.random() - 0.5) * 0.3,
      pos.y + height,
      pos.z + (Math.random() - 0.5) * 0.3
    ),
    vel: new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      Math.random() * 0.2 + 0.1,
      (Math.random() - 0.5) * 0.2
    ),
    life: 0.3 + Math.random() * 0.3,
    color: 0xFF6600,
    size: 0.06 + Math.random() * 0.04,
  });
}

function getRandomSpawnPos() {
  // 确保僵尸不在玩家太近的位置刷新，且不在建筑物内
  const minDist = CONFIG.ENEMY_SPAWN_DIST; // 40米
  const maxDist = minDist + 40;
  let attempts = 0;
  let pos;
  
  do {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    pos = new THREE.Vector3(
      camera.position.x + Math.cos(angle) * dist,
      0,
      camera.position.z + Math.sin(angle) * dist
    );
    attempts++;
    // 使用全局colliders检查是否在障碍物内（确保检测所有建筑物，不受区块加载限制）
    let blocked = false;
    for (const c of colliders) {
      if (!c.solid) continue;
      // 严格检查是否在碰撞器内部（建筑墙壁、楼梯等solid物体）
      if (Math.abs(pos.x - c.x) < c.hw && Math.abs(pos.z - c.z) < c.hd) {
        blocked = true;
        break;
      }
      // 宽松检查：靠近碰撞器也视为blocked（留出安全边界）
      if (c.type !== 'stair_shell' && 
          Math.abs(pos.x - c.x) < c.hw + 2 && Math.abs(pos.z - c.z) < c.hd + 2) {
        blocked = true;
        break;
      }
    }
    if (!blocked) break;
  } while (attempts < 100);
  
  // 确保位置在地图范围内（使用当前地图尺寸）
  const mapSize = (window.currentMap === 'snow' && window.SNOW_MAP_CONFIG) 
    ? SNOW_MAP_CONFIG.MAP_SIZE : CONFIG.MAP_SIZE;
  pos.x = Math.max(-mapSize + 5, Math.min(mapSize - 5, pos.x));
  pos.z = Math.max(-mapSize + 5, Math.min(mapSize - 5, pos.z));
  
  return pos;
}

// 飞龙专用生成位置 - 距离玩家30m外
function getWyvernSpawnPos() {
  // 飞龙在30m外生成
  const minDist = 30; // 30米外
  const maxDist = 60; // 最远60米
  let attempts = 0;
  let pos;
  
  do {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    pos = new THREE.Vector3(
      camera.position.x + Math.cos(angle) * dist,
      0,
      camera.position.z + Math.sin(angle) * dist
    );
    attempts++;
    // 检查是否在障碍物内
    let blocked = false;
    for (const c of colliders) {
      if (!c.solid) continue;
      if (Math.abs(pos.x - c.x) < c.hw && Math.abs(pos.z - c.z) < c.hd) {
        blocked = true;
        break;
      }
    }
    if (!blocked) break;
  } while (attempts < 50);
  
  // 确保位置在地图范围内（使用当前地图尺寸）
  const mapSize = (window.currentMap === 'snow' && window.SNOW_MAP_CONFIG) 
    ? SNOW_MAP_CONFIG.MAP_SIZE : CONFIG.MAP_SIZE;
  pos.x = Math.max(-mapSize + 5, Math.min(mapSize - 5, pos.x));
  pos.z = Math.max(-mapSize + 5, Math.min(mapSize - 5, pos.z));
  
  return pos;
}

// 验证给定位置是否安全（不在建筑物内）- 使用全局colliders确保检测所有建筑物
function validateSpawnPos(pos) {
  // 直接遍历所有碰撞器，不受区块加载限制
  for (const c of colliders) {
    if (!c.solid) continue;
    // 严格检查是否在碰撞器内部
    if (Math.abs(pos.x - c.x) < c.hw && Math.abs(pos.z - c.z) < c.hd) {
      return null; // 在墙内，不安全
    }
    // 检查是否太靠近墙壁（留出安全边界）
    if (c.type !== 'stair_shell' && 
        Math.abs(pos.x - c.x) < c.hw + 1.5 && Math.abs(pos.z - c.z) < c.hd + 1.5) {
      return null; // 太靠近墙，不安全
    }
  }
  return pos; // 安全
}

// 在玩家附近找一个安全的生成位置（用于传送卡住的僵尸）
function findSafeSpawnNearPlayer() {
  // 在玩家周围15-30米范围内找一个不在建筑物内的位置
  const minDist = 15;
  const maxDist = 30;
  
  for (let attempts = 0; attempts < 30; attempts++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const x = camera.position.x + Math.cos(angle) * dist;
    const z = camera.position.z + Math.sin(angle) * dist;
    
    // 检查是否在建筑物内
    let blocked = false;
    const nearbyColliders = getNearbyColliders(x, z, 15);
    for (const c of nearbyColliders) {
      if (c.solid && c.type !== 'stair_shell' && c.type !== 'stair_wall' &&
          Math.abs(x - c.x) < c.hw + 1 && Math.abs(z - c.z) < c.hd + 1) {
        blocked = true;
        break;
      }
    }
    
    if (!blocked) {
      // 确保在地图范围内
      const safeX = Math.max(-CONFIG.MAP_SIZE + 5, Math.min(CONFIG.MAP_SIZE - 5, x));
      const safeZ = Math.max(-CONFIG.MAP_SIZE + 5, Math.min(CONFIG.MAP_SIZE - 5, z));
      return new THREE.Vector3(safeX, 0, safeZ);
    }
  }
  
  // 如果找不到安全位置，返回玩家正后方20米
  const backAngle = Math.atan2(camera.position.z, camera.position.x) + Math.PI;
  return new THREE.Vector3(
    camera.position.x + Math.cos(backAngle) * 20,
    0,
    camera.position.z + Math.sin(backAngle) * 20
  );
}

function damageEnemy(enemy, damage, isCrit, hitPos, attackerName, skipInstakill) {
  // 追踪最后攻击者
  enemy.lastAttacker = attackerName || '玩家';

  // 检查一击必杀BUFF（炮塔等非玩家攻击可跳过）
  if (!skipInstakill && player.activeBuffs && player.activeBuffs.instakill) {
    enemy.hp = 0; // 直接秒杀
  } else {
    enemy.hp -= damage;
  }

  // 播放受击音效（30%概率，根据距离调整音量，1-3秒随机冷却）
  const now = Date.now();
  if (!enemy.lastHitSoundTime) enemy.lastHitSoundTime = 0;
  const hitCooldown = 1000 + Math.random() * 2000; // 1-3秒随机冷却
  if (now - enemy.lastHitSoundTime > hitCooldown && Math.random() < 0.3) {
    enemy.lastHitSoundTime = now;
    const dist = enemy.mesh.position.distanceTo(camera.position);
    const volume = Math.max(0.1, 1 - dist / 30); // 距离30米时音量降到0.1
    if (isCrit) {
      if(window.AudioSystem)AudioSystem.playSound('crit_hit', volume);
    } else {
      if(window.AudioSystem)AudioSystem.playSound('zombie_hit', volume);
    }
  }

  // 伤害数字特效
  createDamageNumber(hitPos || enemy.mesh.position.clone(), Math.floor(damage), isCrit);

  // 受击闪白
  enemy.mesh.children.forEach(c => {
    if (c.material && c.material.emissive) {
      c.material.emissive.setHex(0xffffff);
      setTimeout(() => c.material.emissive.setHex(0x000000), 100);
    }
  });

  // 血液粒子
  for (let i = 0; i < 5; i++) {
    particles.push({
      pos: (hitPos || enemy.mesh.position).clone(),
      vel: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4),
      life: 0.5,
      color: 0xaa0000,
      size: 0.06,
    });
  }

  if (enemy.hp <= 0) {
    killEnemy(enemy);
  }
}

// 暴露给工事系统和天气系统使用
window.damageEnemy = damageEnemy;
window.killEnemy = killEnemy;

// 沙漠怪物死亡统一处理（经验、音效、击杀统计）
window.killDesertMonster = function(monster, sourceName) {
  if (!monster || monster.dead) return;
  monster.dead = true;
  monster.deathTimer = 0.8;
  // 击杀统计
  if (typeof kills !== 'undefined') kills++;
  // 经验值
  const monsterXP = { scorpion: 20, sandworm: 40, vulture: 30 };
  const baseXp = monsterXP[monster.type] || 15;
  let xpMult = 1 + (player.stats && player.stats.expGain ? player.stats.expGain * 0.10 : 0);
  if (window.WeatherSystem) {
    const effects = WeatherSystem.getCurrentEffects();
    if (effects.xpMult) xpMult *= effects.xpMult;
  }
  const expGain = baseXp * xpMult;
  player.xp = (player.xp || 0) + expGain;
  xp = (xp || 0) + expGain;
  if (typeof checkLevelUp === 'function') checkLevelUp();
  // 击杀 feed
  if (typeof window.addKillFeed === 'function') {
    const names = { scorpion: '沙漠蝎子', sandworm: '沙虫', vulture: '秃鹫' };
    window.addKillFeed(sourceName || '玩家', names[monster.type] || monster.type);
  }
  // 死亡音效（映射到已有音效）
  if (window.AudioSystem) {
    AudioSystem.playSound('zombie_die', 0.6);
  }
  // 死亡爆炸特效
  if (window.DesertMap && DesertMap.createDeathExplosion) {
    let color1, color2, count = 18;
    if (monster.type === 'scorpion') { color1 = 0x44CC22; color2 = 0xC4A35A; }
    else if (monster.type === 'sandworm') { color1 = 0xB8860B; color2 = 0xC4A35A; }
    else { color1 = 0x2F2F2F; color2 = 0x111111; count = 22; }
    DesertMap.createDeathExplosion(monster.mesh.position.clone(), color1, color2, count);
  }
  // 悬赏任务统计
  if (window.DesertMap && DesertMap.onMonsterKilled) {
    DesertMap.onMonsterKilled(monster.type);
  }
  // 掉落物（25%概率）
  if (Math.random() < 0.25 && typeof spawnPickup === 'function') {
    spawnPickup(monster.mesh.position.clone());
  }
};

function killEnemy(enemy) {
  enemy.dead = true;
  enemy.state = 'dead'; // 兼容雪地僵尸
  kills++;

  // 兼容层：雪地僵尸没有 def 属性
  const def = enemy.def || {
    xp: 15,
    name: enemy.type === 'brute' ? '冰霜壮硕' : enemy.type === 'stalker' ? '冰霜迅捷' : '冰霜僵尸',
    color: 0x6688aa,
    explosive: false,
    crawl: false,
    fat: false,
    ranged: false,
    poison: false,
    elite: false,
    stealth: false,
    damage: enemy.damage || 10
  };

  xp += def.xp;
  
  // 击杀增加战场充能点
  const killCharge = 1; // 每个击杀给1充能点
  accumulateBattlefieldCharge(killCharge);
  
  // 只有波次内的僵尸才递减剩余计数（空投僵尸不属于波次）
  if (!enemy.isHordeZombie) {
    enemiesRemaining = Math.max(0, enemiesRemaining - 1);
  }

  // 玩家获得经验（含经验加成 + 天气加成）
  let xpMult = 1 + player.stats.expGain * 0.10;
  if (window.WeatherSystem) {
    const effects = WeatherSystem.getCurrentEffects();
    if (effects.xpMult) xpMult *= effects.xpMult;
  }
  const expGain = def.xp * xpMult;
  player.xp += expGain;
  xp += expGain;
  checkLevelUp();

  // 吸血（基础+属性）
  const totalLifeSteal = player.lifeSteal + player.stats.lifeSteal * 0.02;
  if (totalLifeSteal > 0) {
    player.hp = Math.min(player.hp + def.xp * totalLifeSteal, player.maxHp);
  }

  // 获得战场资源（建材+零件）
  if (window.FortificationSystem) {
    let partsGain = 1;
    if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getData) {
      try {
        const shelterData = ShelterSystem.getData();
        const defs = ShelterSystem.getDefs().survivors;
        const techEffects = ShelterSystem.getTechEffects();
        // 幸存者掉落加成（通用系统）
        shelterData.survivors.forEach(sur => {
          const def2 = defs[sur.type];
          if (def2 && def2.battlefieldEffect && def2.battlefieldEffect.resourceDrop) {
            const bonus = def2.battlefieldEffect.resourceDrop.bonus;
            partsGain *= (1 + bonus * (1 + (sur.skill - 1) * 0.10));
          }
        });
        // 科技加成：拾荒专精
        partsGain *= (1 + (techEffects.scavengerBoost || 0));
      } catch(e) {}
    }
    FortificationSystem.addParts(Math.floor(partsGain));
  }

  // 播放死亡音效（根据僵尸类型，距离衰减音量）
  let dieSound = 'zombie_die';
  if (def.crawl) dieSound = 'zombie_die_fast';
  else if (def.fat) dieSound = 'zombie_die_fat';
  else if (def.ranged && def.poison) dieSound = 'zombie_die_poison';
  else if (def.ranged) dieSound = 'zombie_die_ranged';
  else if (def.explosive) dieSound = 'zombie_die_explode';
  else if (def.elite) dieSound = 'zombie_die_elite';
  else if (def.stealth) dieSound = 'zombie_die_stealth';
  const dieDist = enemy.mesh.position.distanceTo(camera.position);
  const dieVol = Math.max(0.15, 0.5 - dieDist / 40);
  if(window.AudioSystem)AudioSystem.playSound(dieSound, dieVol);

  // 爆炸僵尸
  if (def.explosive) {
    createExplosion(enemy.mesh.position.clone(), def.damage, 5);
    if(window.AudioSystem)AudioSystem.playSound('explosion', dieVol * 0.6);
    // 沙漠自爆火甲虫：爆炸点燃5米内敌人
    if (def.desert && def.name === '自爆火甲虫') {
      const burnDist = 5;
      // 检查玩家是否在范围内
      const distToPlayer = enemy.mesh.position.distanceTo(camera.position);
      if (distToPlayer < burnDist) {
        if (!window.playerBurning) window.playerBurning = { damage: 8, duration: 4, timer: 0 };
        else { window.playerBurning.damage = 8; window.playerBurning.duration = 4; window.playerBurning.timer = 0; }
        showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '被点燃!', 0xFF4400);
      }
      // 检查范围内其他僵尸是否被点燃（对僵尸造成持续伤害）
      const allEnemies = (window.enemies || []).concat(window.DesertMap ? DesertMap.desertMonsters || [] : []);
      allEnemies.forEach(other => {
        if (other !== enemy && !other.dead && other.mesh) {
          const d = enemy.mesh.position.distanceTo(other.mesh.position);
          if (d < burnDist) {
            other.burning = { damage: 3, duration: 3, timer: 0 };
          }
        }
      });
    }
  }

  // 死亡特效
  for (let i = 0; i < 8; i++) {
    particles.push({
      pos: enemy.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)),
      vel: new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 5, (Math.random() - 0.5) * 5),
      life: 0.8,
      color: def.color,
      size: 0.15,
    });
  }

  scene.remove(enemy.mesh);
  addKillFeed(enemy.lastAttacker || '玩家', def.name);

  // 掉落
  if (Math.random() < 0.25) {
    console.log('[掉落] 僵尸死亡，生成掉落物');
    spawnPickup(enemy.mesh.position.clone());
  }

  updateHUD();
}

// 检查升级
function checkLevelUp() {
  while (player.xp >= player.xpToNextLevel) {
    player.xp -= player.xpToNextLevel;
    player.level++;
    player.xpToNextLevel = player.level * 100;
    player.hp = player.maxHp;

    // 检查基础属性是否全满，全满则属性点转为精通点
    if (areAllStatsMaxed()) {
      player.masteryPoints += 3;
      showLevelUpNotification(true);
    } else {
      player.statPoints += 3;
      showLevelUpNotification(false);
    }

    if(window.AudioSystem)AudioSystem.playSound('level_up');

    // 同时更新全局变量（兼容旧代码）
    level = player.level;
    xp = player.xp;
    xpToLevel = player.xpToNextLevel;

    // 显示升级选择面板
    upgradePoints++;
    showUpgradePanel();
  }
}

// 显示升级提示
function showLevelUpNotification(isMastery) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed; top: 30%; left: 50%; transform: translateX(-50%);
    background: linear-gradient(135deg, ${isMastery ? '#ff8800, #ff4400' : '#ffcc00, #ff8800'});
    color: #000; padding: 20px 40px; border-radius: 10px;
    font-size: 24px; font-weight: bold; z-index: 500;
    box-shadow: 0 0 30px rgba(255, 200, 0, 0.5);
    animation: levelUpAnim 2s ease-out forwards;
  `;
  const pointsInfo = isMastery
    ? '获得3点精通点 | 升级奖励：生命全满'
    : '获得3点属性点 | 升级奖励：生命全满';
  const title = isMastery ? `★ 精通升级！等级 ${player.level}` : `升级！等级 ${player.level}`;
  notif.innerHTML = `${isMastery ? '🌟' : '🎉'} ${title}<br><small>${pointsInfo}</small>`;
  document.body.appendChild(notif);
  
  setTimeout(() => notif.remove(), 2000);
}

// 属性上限定义 - 降低上限，提高单级收益，让每级升级都有明显感受
const STAT_LIMITS = {
  maxHp: 20,       // 最多+200生命 (每级+10)
  damage: 10,      // 最多+100%伤害 (每级+10%)
  speed: 10,       // 最多+50%速度 (每级+5%)
  critChance: 10,  // 最多+50%暴击率 (每级+5%)
  critDamage: 5,   // 最多+100%暴击伤害 (每级+20%)
  armor: 10,       // 最多+50%护甲 (每级+5%)
  lifeSteal: 10,   // 最多+20%吸血 (每级+2%)
  // 新增属性
  fireRate: 10,    // 最多+50%射速 (每级+5%)
  reloadSpeed: 10, // 最多+50%换弹速度 (每级+5%)
  ammoCapacity: 15,// 最多+75%弹匣容量 (每级+5%)
  quickDraw: 10,// 瞬发手铳 (10级上限)
  doubleJump: 10,  // 二段跳 (10级解锁)
  climbing: 10,    // 攀爬 (10级上限，每级+1秒攀爬时间)
  healthRegen: 10, // 生命恢复 (每级+1HP/秒)
  pickupRange: 5,  // 拾取范围 (每级+1米)
  expGain: 10,     // 经验获取 (每级+10%)
};

// 精通点上限定义（基础属性全满后解锁）
const MASTERY_LIMITS = {
  masteryDamage: 20,     // 伤害精通上限20级（+100%伤害）
  masteryDefense: 20,    // 防御精通上限20级（+100%防御）
  masteryEfficiency: 20, // 效率精通上限20级（+200%资源获取）
};

const MASTERY_NAMES = {
  masteryDamage: '🔥 伤害精通',
  masteryDefense: '🛡️ 防御精通',
  masteryEfficiency: '📦 效率精通',
};

const MASTERY_DESCS = {
  masteryDamage: '所有伤害+5%（可叠加）',
  masteryDefense: '所有防御+5%（可叠加）',
  masteryEfficiency: '资源获取+10%（可叠加）',
};

const MASTERY_VALUES = {
  masteryDamage: (lv) => `总伤害+${lv * 5}%`,
  masteryDefense: (lv) => `总防御+${lv * 5}%`,
  masteryEfficiency: (lv) => `资源获取+${lv * 10}%`,
};

// 检查所有基础属性是否已满
function areAllStatsMaxed() {
  if (!player || !player.stats) return false;
  for (const stat in STAT_LIMITS) {
    if (player.stats[stat] < STAT_LIMITS[stat]) return false;
  }
  return true;
}

// 分配精通点
function addMastery(masteryName) {
  if (!player || player.masteryPoints <= 0) return;
  if (player[masteryName] >= MASTERY_LIMITS[masteryName]) return;

  player.masteryPoints--;
  player[masteryName]++;

  applyStatEffects();
  updateHUD();
  updateStatPanel();
}

// 分配属性点
function addStat(statName) {
  if (!player || player.statPoints <= 0) return;
  if (!player.stats || player.stats[statName] >= STAT_LIMITS[statName]) return;
  
  player.statPoints--;
  player.stats[statName]++;
  
  applyStatEffects();
  updateHUD();
  updateStatPanel();
}

// 应用属性效果到玩家
// 注意：升级三选一面板也会修改 player.dmgMult/armor/speed 等，这里不能覆盖，要保留升级加成
function applyStatEffects() {
  // 生命上限（升级加成存储在 _upgradeMaxHpBonus 中）
  if (player._upgradeMaxHpBonus === undefined) player._upgradeMaxHpBonus = 0;
  const oldMaxHp = player.maxHp;
  const baseMaxHp = 100 + player.stats.maxHp * 10;
  player.maxHp = baseMaxHp + player._upgradeMaxHpBonus;
  if (player.hp === oldMaxHp) player.hp = player.maxHp;
  
  // 伤害倍率 = 基础属性 + 伤害精通加成 + 升级加成（存储在 _upgradeDmgBonus 中）
  if (player._upgradeDmgBonus === undefined) player._upgradeDmgBonus = 0;
  player.dmgMult = 1 + player.stats.damage * 0.1 + (player.masteryDamage || 0) * 0.05 + player._upgradeDmgBonus;
  
  // 暴击（critChanceUpgrade 已被正确保留，见第9026行）
  player.critChance = player.stats.critChance * 0.05 + (player.critChanceUpgrade || 0);
  player.critDamage = 1.5 + player.stats.critDamage * 0.2;
  
  // 护甲 = 基础属性 + 防御精通加成 + 升级加成（存储在 _upgradeArmorBonus 中）
  if (player._upgradeArmorBonus === undefined) player._upgradeArmorBonus = 0;
  player.armor = player.stats.armor * 0.05 + (player.masteryDefense || 0) * 0.05 + player._upgradeArmorBonus;
  
  // 吸血 = 基础属性 + 升级加成
  if (player._upgradeLifeStealBonus === undefined) player._upgradeLifeStealBonus = 0;
  player.lifeSteal = player.stats.lifeSteal * 0.02 + player._upgradeLifeStealBonus;
  
  // 速度 = 基础属性 + 升级加成
  if (player._upgradeSpeedBonus === undefined) player._upgradeSpeedBonus = 0;
  player.speed = CONFIG.PLAYER_SPEED * (1 + player.stats.speed * 0.05) * (1 + player._upgradeSpeedBonus);
  
  // 二段跳（10级解锁）+ 跳跃高度加成
  player.canDoubleJump = player.stats.doubleJump >= 10;
  player.jumpForceMult = 1 + player.stats.doubleJump * 0.05; // 每级+5%跳跃高度
  // 攀爬时间
  player.climbTime = player.stats.climbing;
  // 生命恢复
  player.regen = player.stats.healthRegen;
  // 效率精通加成（存储供其他系统使用）
  player.efficiencyMult = 1 + (player.masteryEfficiency || 0) * 0.1;
}

// 打开属性面板（暂停游戏，解锁鼠标）
function openStatPanel() {
  let panel = document.getElementById('stat-panel');
  if (!panel) {
    createStatPanel();
    panel = document.getElementById('stat-panel');
  }
  
  // 先设置状态，再解锁鼠标
  gameState = 'statPanel';
  
  // 确保鼠标解锁
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
  
  // 显示面板
  panel.style.display = 'flex';
  panel.style.cursor = 'default';
  
  // 设置body鼠标样式
  document.body.style.cursor = 'default';
  
  updateStatPanel();
}

// 关闭属性面板（恢复游戏，锁定鼠标）
function closeStatPanel() {
  const panel = document.getElementById('stat-panel');
  if (panel) {
    panel.style.display = 'none';
  }
  
  gameState = 'playing';
  document.body.style.cursor = 'none';
  
  // 延迟锁定鼠标，确保面板完全关闭
  setTimeout(() => {
    if (gameState === 'playing' && renderer && renderer.domElement) {
      renderer.domElement.requestPointerLock();
    }
  }, 100);
}

// 打开伙伴面板（查看队友和机器狗情况）
function openAllyPanel() {
  if (window.allyPanelState) return;
  window.allyPanelState = true;
  
  // 创建/显示面板
  let panel = document.getElementById('ally-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'ally-panel';
    panel.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.85); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      cursor: default;
    `;
    document.body.appendChild(panel);
  }
  
  // 确保P界面在最上层
  panel.style.display = 'flex';
  panel.style.zIndex = '9999';
  
  // 从工事系统获取机器狗数据
  const deployedDogs = window.deployedFortifications ? 
    window.deployedFortifications.filter(f => f && f.def && f.def.type === 'robo_dog') : [];
  
  // 生成面板内容
  let html = `
    <div style="
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #3498db; border-radius: 15px;
      padding: 25px 30px; min-width: 500px; max-width: 600px;
      max-height: 80vh; overflow-y: auto;
      box-shadow: 0 0 40px rgba(52, 152, 219, 0.3);
    ">
      <h2 style="margin-top: 0; color: #3498db; display: flex; align-items: center; gap: 10px;">
        👥 伙伴状态
      </h2>
      <div style="font-size: 12px; color: #888; margin-bottom: 15px;">
        按 P 键关闭 | 游戏已暂停
      </div>
  `;
  
  // 队友列表
  html += `<div style="margin-bottom: 25px;">
    <h3 style="color: #2ecc71; margin-bottom: 10px; font-size: 16px;">🤖 队友</h3>`;
  
  if (allies.length === 0) {
    html += `<div style="color: #888; font-size: 14px; text-align: center; padding: 20px;">
      暂无队友
    </div>`;
  } else {
    allies.forEach((ally, i) => {
      const hpPct = Math.floor((ally.hp / ally.maxHp) * 100);
      const hpColor = hpPct > 50 ? '#2ecc71' : hpPct > 25 ? '#f39c12' : '#e74c3c';
      const stateColor = ally.state === 'combat' ? '#e74c3c' : ally.state === 'heal' ? '#2ecc71' : '#3498db';
      const stateName = ally.state === 'combat' ? '战斗中' : ally.state === 'heal' ? '治疗中' : ally.state === 'stealth' ? '隐身' : ally.state === 'dodge' ? '闪避' : ally.state === 'patrol' ? '巡逻' : ally.state === 'follow' ? '跟随' : '待机';
      const isDead = ally.dead;
      
      const level = ally.level || 1;
      html += `
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 3px solid ${isDead ? '#555' : ally.color}; ${isDead ? 'opacity:0.4;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-size: 14px; font-weight: bold; color: ${isDead ? '#666' : '#ddd'};">
              ${ally.name} <span style="color:#ffd700;font-size:12px;">Lv.${level}</span> ${isDead ? '💀 已阵亡' : ''}
            </div>
            <div style="font-size: 12px; color: ${stateColor};">
              ${stateName}
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.3); border-radius: 4px; height: 6px; overflow: hidden;">
            <div style="width: ${hpPct}%; height: 100%; background: ${hpColor}; transition: width 0.3s;"></div>
          </div>
          <div style="font-size: 11px; color: #888; margin-top: 4px;">
            HP: ${Math.floor(ally.hp)} / ${Math.floor(ally.maxHp)} (${hpPct}%)
          </div>
          <div style="font-size: 10px; color: #666; margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px;">
            <span>⚔️ 伤害: ${Math.floor(ally.damage * ally.dmgMult)}</span>
            <span>🏃 速度: ${ally.speed.toFixed(1)}</span>
            <span>🔫 射速: ${ally.fireRate.toFixed(1)}/s</span>
            <span>🎯 射程: ${Math.floor(ally.attackRange || ally.classDef.attackRange || 25)}m</span>
          </div>
        </div>
      `;
    });
  }
  html += `</div>`;
  
  // 机器狗面板（从工事系统获取）
  html += `<div style="margin-bottom: 25px;">
    <h3 style="color: #e67e22; margin-bottom: 10px; font-size: 16px;">🐕 机器狗</h3>`;
  
  if (deployedDogs.length > 0) {
    deployedDogs.forEach((dog, idx) => {
      // 找到机器狗在数组中的索引
      const dogIndex = window.deployedFortifications.indexOf(dog);
      const hpPct = Math.floor((dog.health / dog.maxHealth) * 100);
      const hpColor = hpPct > 50 ? '#2ecc71' : hpPct > 25 ? '#f39c12' : '#e74c3c';
      const dogState = dog.dogState || 'patrol';
      const dogStateName = dogState === 'seek' ? '拾取中' : dogState === 'return' ? '返回中' : dogState === 'patrol' ? '巡逻中' : dogState === 'idle' ? '待机' : dogState;
      
      html += `
        <div style="background: rgba(230,126,34,0.1); border-radius: 8px; padding: 12px; margin-bottom: 10px; border: 1px solid rgba(230,126,34,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">🐕</span>
              <div>
                <div style="font-size: 14px; font-weight: bold; color: #ddd;">机器狗 #${dogIndex + 1}</div>
                <div style="font-size: 11px; color: #888;">自动拾取掉落物</div>
              </div>
            </div>
            <div style="font-size: 12px; color: #3498db;">${dogStateName}</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); border-radius: 4px; height: 8px; overflow: hidden; margin-bottom: 6px;">
            <div style="width: ${hpPct}%; height: 100%; background: ${hpColor}; transition: width 0.3s;"></div>
          </div>
          <div style="font-size: 11px; color: #888;">
            HP: ${Math.floor(dog.health)} / ${dog.maxHealth} (${hpPct}%)
          </div>
        </div>
        <button onclick="recycleDogFromPanel(${dogIndex})" style="
          padding: 10px 20px; background: #e74c3c; border: none; border-radius: 5px;
          color: white; cursor: pointer; font-size: 14px; width: 100%;
        ">🐕 收回机器狗</button>
      `;
    });
  } else {
    html += `
      <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 10px;">
        <div style="font-size: 14px; color: #888; margin-bottom: 8px;">
          当前未部署机器狗
        </div>
        <div style="font-size: 12px; color: #666;">
          按 V 键打开部署界面，选择机器狗部署
        </div>
      </div>
    `;
  }
  html += `</div>`;
  
  html += `
      <div style="margin-top: 20px; text-align: center;">
        <button onclick="closeAllyPanel()" style="
          padding: 10px 30px; background: #7f8c8d; border: none; border-radius: 5px;
          color: white; cursor: pointer; font-size: 14px;
        ">关闭</button>
      </div>
    </div>
  `;
  
  panel.innerHTML = html;
  panel.style.display = 'flex';
  
  // 暂停游戏
  gameState = 'paused';
  
  // 移除鼠标锁定
  document.exitPointerLock();
}

// 从P面板回收机器狗
function recycleDogFromPanel(index) {
  if (window.FortificationSystem && window.FortificationSystem.recycleByIndex) {
    const refund = window.FortificationSystem.recycleByIndex(index);
    if (refund > 0) {
      showToast(`机器狗已收回，获得 ${refund} 零件`, 'success');
    } else {
      showToast('收回失败，请重试', 'error');
    }
  }
  // 刷新界面
  openAllyPanel();
}

// 关闭伙伴面板
function closeAllyPanel() {
  if (!window.allyPanelState) return;
  window.allyPanelState = false;
  
  const panel = document.getElementById('ally-panel');
  if (panel) {
    panel.style.display = 'none';
  }
  
  // 恢复游戏
  gameState = 'playing';
  
  // 恢复鼠标锁定
  setTimeout(() => {
    if (gameState === 'playing' && renderer && renderer.domElement) {
      renderer.domElement.requestPointerLock();
    }
  }, 100);
}

// 创建属性面板（全屏平铺网格布局）
function createStatPanel() {
  const panel = document.createElement('div');
  panel.id = 'stat-panel';
  panel.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(135deg, #0f1729 0%, #1a1f35 50%, #0f1729 100%);
    z-index: 400; display: none; flex-direction: column;
    cursor: default;
  `;

  panel.innerHTML = `
    <div id="stat-panel-content" style="
      width: 100%; height: 100%; padding: 40px; box-sizing: border-box;
      display: flex; flex-direction: column; gap: 0; cursor: default;
    ">
      <!-- 顶部标题栏 -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.12); flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 5px; height: 36px; background: linear-gradient(180deg, #ffcc00, #ff8800); border-radius: 3px;"></div>
          <div>
            <div style="color: #e0e6f0; font-size: 26px; font-weight: bold; letter-spacing: 1px;">角色属性</div>
            <div style="color: #8b9bb4; font-size: 12px; margin-top: 3px; letter-spacing: 2px;">ATTRIBUTE PANEL</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="text-align: right;">
            <div style="color: #8b9bb4; font-size: 12px;">等级</div>
            <div id="stat-level" style="color: #ffcc00; font-size: 22px; font-weight: bold;">1</div>
          </div>
          <div style="width: 1px; height: 36px; background: rgba(255,255,255,0.12);"></div>
          <div style="text-align: right;">
            <div style="color: #8b9bb4; font-size: 12px;">属性点</div>
            <div id="stat-points" style="color: #44ff44; font-size: 22px; font-weight: bold;">0</div>
          </div>
          <div id="mastery-header" style="display: none; text-align: right;">
            <div style="width: 1px; height: 36px; background: rgba(255,255,255,0.12); display: inline-block; vertical-align: middle; margin: 0 14px;"></div>
            <div style="display: inline-block; text-align: right; vertical-align: middle;">
              <div style="color: #8b9bb4; font-size: 12px;">精通点</div>
              <div id="mastery-points" style="color: #ffaa00; font-size: 22px; font-weight: bold;">0</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 属性网格 -->
      <div id="stat-list" style="flex: 1; min-height: 0;"></div>

      <!-- 精通区域 -->
      <div id="mastery-section" style="display: none; flex-shrink: 0; margin-top: 16px;"></div>

      <!-- 底部关闭按钮 -->
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.12); text-align: center; flex-shrink: 0;">
        <button id="stat-close-btn" style="
          padding: 12px 56px; background: linear-gradient(135deg, rgba(255,204,0,0.2) 0%, rgba(255,136,0,0.15) 100%);
          color: #ffcc00; border: 1px solid rgba(255,204,0,0.4); border-radius: 10px;
          cursor: pointer; font-size: 15px; font-weight: bold;
          transition: all 0.2s; letter-spacing: 3px;
        ">关 闭</button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  const closeBtn = document.getElementById('stat-close-btn');
  if (closeBtn) {
    closeBtn.onmouseenter = () => { closeBtn.style.background = 'linear-gradient(135deg, rgba(255,204,0,0.35) 0%, rgba(255,136,0,0.25) 100%)'; };
    closeBtn.onmouseleave = () => { closeBtn.style.background = 'linear-gradient(135deg, rgba(255,204,0,0.2) 0%, rgba(255,136,0,0.15) 100%)'; };
    closeBtn.onclick = (e) => { e.stopPropagation(); closeStatPanel(); };
  }

  panel.onclick = (e) => { if (e.target === panel) closeStatPanel(); };
  updateStatPanel();
}

// 更新属性面板（全屏平铺网格布局）
function updateStatPanel() {
  const panel = document.getElementById('stat-panel');
  if (!panel) return;

  const pointsEl = document.getElementById('stat-points');
  const levelEl = document.getElementById('stat-level');
  const masteryPointsEl = document.getElementById('mastery-points');
  const masteryHeader = document.getElementById('mastery-header');
  if (pointsEl) pointsEl.textContent = player.statPoints;
  if (levelEl) levelEl.textContent = player.level;
  if (masteryPointsEl) masteryPointsEl.textContent = player.masteryPoints || 0;
  if (masteryHeader) masteryHeader.style.display = areAllStatsMaxed() ? 'block' : 'none';

  const statList = document.getElementById('stat-list');
  if (!statList) return;

  // 属性定义（使用统一风格，每组使用固定配色）
  const GROUP_COLORS = {
    combat:   { accent: '#ff8c5a', bg: 'rgba(255,100,60,0.14)', border: 'rgba(255,140,90,0.40)', label: '战斗属性', sub: 'COMBAT', textLight: '#ffb898' },
    defense:  { accent: '#5ac8fa', bg: 'rgba(80,180,250,0.14)', border: 'rgba(90,200,250,0.40)', label: '防御属性', sub: 'DEFENSE', textLight: '#97d8ff' },
    mobility: { accent: '#5ee8a8', bg: 'rgba(80,220,150,0.14)', border: 'rgba(94,232,168,0.40)', label: '移动属性', sub: 'MOBILITY', textLight: '#9af5c8' },
    utility:  { accent: '#e8d058', bg: 'rgba(220,200,70,0.14)', border: 'rgba(232,208,88,0.40)', label: '辅助属性', sub: 'UTILITY', textLight: '#f0e090' }
  };

  const statDefs = {
    maxHp:      { name: '生命上限', icon: '❤️', group: 'defense', desc: '+10生命/级', unit: 'HP', step: 10 },
    armor:      { name: '护甲', icon: '🛡️', group: 'defense', desc: '+5%护甲/级', unit: '%', step: 5 },
    lifeSteal:  { name: '生命偷取', icon: '🧛', group: 'defense', desc: '+2%吸血/级', unit: '%', step: 2 },
    healthRegen:{ name: '生命恢复', icon: '💚', group: 'defense', desc: '+1HP/秒/级', unit: 'HP/s', step: 1 },
    damage:     { name: '伤害加成', icon: '⚔️', group: 'combat', desc: '+10%伤害/级', unit: '%', step: 10 },
    critChance: { name: '暴击率', icon: '💥', group: 'combat', desc: '+5%暴击/级', unit: '%', step: 5 },
    critDamage: { name: '暴击伤害', icon: '🗡️', group: 'combat', desc: '+20%暴伤/级', unit: '%', step: 20 },
    fireRate:   { name: '射速', icon: '🔫', group: 'combat', desc: '+5%射速/级', unit: '%', step: 5 },
    reloadSpeed:{ name: '换弹速度', icon: '🔄', group: 'utility', desc: '+5%换弹/级', unit: '%', step: 5 },
    ammoCapacity:{ name: '弹匣容量', icon: '📦', group: 'utility', desc: '+5%弹匣/级', unit: '%', step: 5 },
    quickDraw:  { name: '瞬发手铳', icon: '⚡', group: 'utility', desc: '手枪+1发/级', unit: '', step: 1 },
    speed:      { name: '移动速度', icon: '🏃', group: 'mobility', desc: '+5%速度/级', unit: '%', step: 5 },
    doubleJump: { name: '二段跳', icon: '🦅', group: 'mobility', desc: '提高跳跃高度，10级解锁二段跳', unit: '级', step: 1 },
    climbing:   { name: '攀爬', icon: '🧗', group: 'mobility', desc: '每级+1秒攀爬时间，10级永久无时限', unit: '秒', step: 1 },
    pickupRange:{ name: '拾取范围', icon: '🧲', group: 'mobility', desc: '+1米/级', unit: '米', step: 1 },
    expGain:    { name: '经验加成', icon: '⭐', group: 'utility', desc: '+10%经验/级', unit: '%', step: 10 }
  };

  // 计算实际属性值
  const statValues = {
    maxHp: `${player.stats.maxHp * 10} (总${player.maxHp})`,
    damage: `+${player.stats.damage * 10}%`,
    speed: `+${player.stats.speed * 5}%`,
    critChance: `+${player.stats.critChance * 5}%`,
    critDamage: `+${player.stats.critDamage * 20}%`,
    armor: `+${player.stats.armor * 5}%`,
    lifeSteal: `+${player.stats.lifeSteal * 2}%`,
    fireRate: `+${player.stats.fireRate * 5}%`,
    reloadSpeed: `+${player.stats.reloadSpeed * 5}%`,
    ammoCapacity: `+${player.stats.ammoCapacity * 5}%`,
    quickDraw: player.stats.quickDraw > 0 ? `发射${1 + player.stats.quickDraw}发` : '未激活',
    doubleJump: player.stats.doubleJump >= 10 ? '已解锁' : `Lv.${player.stats.doubleJump}/10`,
    climbing: player.stats.climbing >= 10 ? 'Lv.10 (永久)' : player.stats.climbing > 0 ? `Lv.${player.stats.climbing} (${player.stats.climbing}秒)` : '未解锁',
    healthRegen: `+${player.stats.healthRegen}HP/秒`,
    pickupRange: `+${player.stats.pickupRange}米`,
    expGain: `+${player.stats.expGain * 10}%`
  };

  // 按分组组织属性
  const groups = { combat: [], defense: [], mobility: [], utility: [] };
  Object.keys(player.stats).forEach(stat => {
    const def = statDefs[stat];
    if (def && groups[def.group]) groups[def.group].push(stat);
  });

  // 渲染全屏分组网格
  statList.innerHTML = '';
  statList.style.display = 'grid';
  statList.style.gridTemplateColumns = 'repeat(4, 1fr)';
  statList.style.gap = '14px';
  statList.style.alignContent = 'start';
  statList.style.overflowY = 'auto';
  statList.style.overflowX = 'hidden';
  statList.style.scrollbarWidth = 'thin';
  statList.style.scrollbarColor = 'rgba(255,255,255,0.15) transparent';

  const groupOrder = ['combat', 'defense', 'mobility', 'utility'];

  groupOrder.forEach(gkey => {
    const stats = groups[gkey];
    if (stats.length === 0) return;
    const gc = GROUP_COLORS[gkey];

    // 分组标题（跨全列）
    const header = document.createElement('div');
    header.style.cssText = `
      grid-column: 1 / -1;
      display: flex; align-items: baseline; gap: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid ${gc.border};
      margin-top: 2px;
    `;
    header.innerHTML = `
      <span style="color: ${gc.accent}; font-size: 15px; font-weight: bold; letter-spacing: 1px; text-shadow: 0 0 10px ${gc.accent}44;">${gc.label}</span>
      <span style="color: ${gc.textLight}; font-size: 11px; letter-spacing: 2px; opacity: 0.8;">${gc.sub}</span>
    `;
    statList.appendChild(header);

    stats.forEach(stat => {
      const def = statDefs[stat];
      const current = player.stats[stat];
      const max = STAT_LIMITS[stat];
      const percent = (current / max * 100).toFixed(0);
      const canAdd = player.statPoints > 0 && current < max;
      const isMaxed = current >= max;
      const isUnlock = (stat === 'doubleJump' || stat === 'climbing');
      const accentColor = isMaxed ? '#5ea85e' : gc.accent;
      const borderColor = isMaxed ? 'rgba(94,168,94,0.35)' : gc.border;

      const card = document.createElement('div');
      card.style.cssText = `
        background: ${gc.bg};
        border: 1px solid ${borderColor};
        border-left: 4px solid ${accentColor};
        border-radius: 10px; padding: 12px 14px;
        position: relative; overflow: hidden;
        transition: all 0.3s ease;
        display: flex; flex-direction: column;
        min-height: 110px;
        cursor: pointer;
      `;
      
      // 添加光泽效果图层
      const shine = document.createElement('div');
      shine.style.cssText = `
        position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
        transition: left 0.5s ease; pointer-events: none;
      `;
      card.appendChild(shine);
      
      card.onmouseenter = () => { 
        card.style.borderColor = isMaxed ? 'rgba(94,168,94,0.6)' : 'rgba(255,255,255,0.3)'; 
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = `0 4px 16px ${accentColor}22`;
        shine.style.left = '100%';
      };
      card.onmouseleave = () => { 
        card.style.borderColor = borderColor; 
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
        shine.style.left = '-100%';
      };

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
            <span style="font-size: 20px; flex-shrink: 0; filter: drop-shadow(0 0 4px ${accentColor}66);">${def.icon}</span>
            <div style="min-width: 0;">
              <div style="color: #ffffff; font-size: 14px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${def.name}</div>
              <div style="color: ${gc.textLight}; font-size: 11px; margin-top: 2px; opacity: 0.9;">${def.desc}</div>
            </div>
          </div>
          <button class="stat-add-btn" data-stat="${stat}"
            style="width: 26px; height: 26px; border-radius: 6px; background: ${canAdd ? accentColor : 'rgba(255,255,255,0.08)'};
            color: ${canAdd ? '#0a0e1a' : '#8899aa'}; border: 1px solid ${canAdd ? 'transparent' : 'rgba(255,255,255,0.10)'};
            cursor: ${canAdd ? 'pointer' : 'not-allowed'};
            opacity: ${canAdd ? 1 : 0.5}; font-size: 15px; font-weight: bold;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s; pointer-events: ${canAdd ? 'auto' : 'none'};
            flex-shrink: 0;"
            ${canAdd ? '' : 'disabled'}>+</button>
        </div>
        <div style="margin-top: auto; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="color: #ffffff; font-size: 15px; font-weight: bold; text-shadow: 0 0 12px ${accentColor}66, 0 0 4px ${accentColor}33;">${statValues[stat]}</span>
            <span style="color: ${isMaxed ? '#7aff7a' : '#b8c8d8'}; font-size: 12px; font-weight: bold;">${isUnlock ? (isMaxed ? 'MAX' : `${current}/${max}`) : `${current}/${max}`}</span>
          </div>
          ${!isUnlock ? `<div style="background: rgba(0,0,0,0.25); height: 5px; border-radius: 3px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);">
            <div style="background: ${isMaxed ? 'linear-gradient(90deg, #5ea85e, #7acc7a)' : `linear-gradient(90deg, ${gc.accent}, ${gc.accent}dd)`}; height: 100%; border-radius: 3px; width: ${percent}%; transition: width 0.3s; box-shadow: 0 0 8px ${accentColor}55;"></div>
          </div>` : `<div style="background: rgba(0,0,0,0.25); height: 5px; border-radius: 3px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);">
            <div style="background: linear-gradient(90deg, ${gc.accent}88, ${gc.accent}55); height: 100%; border-radius: 3px; width: ${percent}%; transition: width 0.3s; box-shadow: 0 0 6px ${accentColor}44;"></div>
          </div>`}
        </div>
      `;

      const btn = card.querySelector('.stat-add-btn');
      if (btn && canAdd) {
        btn.onmouseenter = () => { btn.style.transform = 'scale(1.15)'; btn.style.boxShadow = `0 0 14px ${accentColor}66`; };
        btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = 'none'; };
        btn.onclick = (e) => { e.stopPropagation(); addStat(stat); };
      }

      statList.appendChild(card);
    });
  });

  // 精通区域
  const masterySection = document.getElementById('mastery-section');
  if (masterySection) {
    if (areAllStatsMaxed()) {
      masterySection.style.display = 'block';
      masterySection.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #ffcc00, transparent);"></div>
          <span style="color: #ffcc00; font-size: 16px; font-weight: bold; letter-spacing: 2px;">★ 精通天赋 ★</span>
          <div style="flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #ffcc00, transparent);"></div>
        </div>
        <div id="mastery-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;"></div>
      `;

      const mGrid = masterySection.querySelector('#mastery-grid');
      Object.keys(MASTERY_LIMITS).forEach(mastery => {
        const current = player[mastery] || 0;
        const max = MASTERY_LIMITS[mastery];
        const percent = (current / max * 100).toFixed(0);
        const canAdd = player.masteryPoints > 0 && current < max;
        const isMaxed = current >= max;

        const card = document.createElement('div');
        card.style.cssText = `
          background: rgba(255,204,0,0.08);
          border: 1px solid ${isMaxed ? 'rgba(255,136,0,0.5)' : 'rgba(255,204,0,0.2)'};
          border-left: 4px solid ${isMaxed ? '#ff8800' : '#ffcc00'};
          border-radius: 10px; padding: 14px;
          transition: all 0.2s;
        `;
        card.onmouseenter = () => { card.style.borderColor = isMaxed ? 'rgba(255,136,0,0.7)' : 'rgba(255,204,0,0.4)'; };
        card.onmouseleave = () => { card.style.borderColor = isMaxed ? 'rgba(255,136,0,0.5)' : 'rgba(255,204,0,0.2)'; };

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="color: #ffcc00; font-size: 14px; font-weight: bold;">${MASTERY_NAMES[mastery]}</span>
            <span style="color: ${isMaxed ? '#ff8800' : '#8b9bb4'}; font-size: 12px; font-weight: bold;">${current}/${max}</span>
          </div>
          <div style="color: #ffaa44; font-size: 11px; margin-bottom: 8px;">${MASTERY_DESCS[mastery]}</div>
          <div style="background: rgba(255,255,255,0.1); height: 5px; border-radius: 3px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #ffcc00, ${isMaxed ? '#ff8800' : '#ffaa00'}); height: 100%; width: ${percent}%; border-radius: 3px;"></div>
          </div>
          <div style="text-align: right; margin-top: 8px;">
            <button class="mastery-add-btn"
              style="padding: 4px 16px; background: ${canAdd ? '#ffaa00' : 'rgba(255,255,255,0.1)'}; color: ${canAdd ? '#000' : '#666'};
              border: none; border-radius: 6px; cursor: ${canAdd ? 'pointer' : 'not-allowed'};
              font-size: 13px; font-weight: bold; pointer-events: ${canAdd ? 'auto' : 'none'}; transition: all 0.2s;"
              ${canAdd ? '' : 'disabled'}>+</button>
          </div>
        `;

        const btn = card.querySelector('.mastery-add-btn');
        if (btn && canAdd) {
          btn.onmouseenter = () => { btn.style.transform = 'scale(1.05)'; btn.style.boxShadow = '0 0 10px rgba(255,170,0,0.4)'; };
          btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = 'none'; };
          btn.onclick = (e) => { e.stopPropagation(); addMastery(mastery); };
        }
        mGrid.appendChild(card);
      });
    } else {
      masterySection.style.display = 'none';
      masterySection.innerHTML = '';
    }
  }
}

// 辅助：hex颜色转rgb
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function updateEnemies(dt) {
  enemies.forEach(e => {
    if (e.dead) return;
    
    // EMP麻痹效果：无法移动、无法攻击、不造成伤害
    if (e.empParalyzed && e.empParalyzeTimer > 0) {
      e.empParalyzeTimer -= dt;
      if (e.empParalyzeTimer <= 0) {
        e.empParalyzed = false;
        e.empParalyzeTimer = 0;
      }
      // 麻痹状态：显示紫色粒子
      if (e.mesh && Math.random() < 0.1) {
        const sparkGeo = new THREE.SphereGeometry(0.2, 4, 4);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0x9b59b6, transparent: true, opacity: 0.8 });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        spark.position.copy(e.mesh.position);
        spark.position.y = 1 + Math.random() * 2;
        scene.add(spark);
        setTimeout(() => {
          if (spark.parent) scene.remove(spark);
          sparkGeo.dispose();
          sparkMat.dispose();
        }, 500);
      }
      return; // 不执行移动和攻击
    }

    // 晕眩效果：无法移动和攻击
    if (e.stunned && e.stunned > 0) {
      e.stunned -= dt;
      return;
    }

    // 燃烧效果（自爆火甲虫点燃）
    if (e.burning && e.burning.duration > 0) {
      e.burning.timer += dt;
      if (e.burning.timer >= 0.5) {
        e.burning.timer -= 0.5;
        e.burning.duration -= 0.5;
        e.hp -= e.burning.damage;
        showFloatingText(e.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), `-${e.burning.damage}`, 0xFF4400);
        // 火焰粒子
        particles.push({
          pos: e.mesh.position.clone().add(new THREE.Vector3((Math.random()-0.5)*0.5, 0.5, (Math.random()-0.5)*0.5)),
          vel: new THREE.Vector3((Math.random()-0.5)*0.5, Math.random()*1+0.5, (Math.random()-0.5)*0.5),
          life: 0.3, color: 0xFF4400, size: 0.08
        });
        if (e.hp <= 0) {
          killEnemy(e);
          return;
        }
      }
      if (e.burning.duration <= 0) {
        e.burning = null;
      }
    }

    e.animTimer += dt * e.speed;
    


    // 隐身僵尸逻辑
    if (e.def.stealth) {
      const distToPlayer = e.mesh.position.distanceTo(camera.position);
      if (distToPlayer < 8) {
        e.mesh.visible = true;
        e.mesh.userData.stealthCooldown = 2;
      } else if (e.mesh.userData.stealthCooldown > 0) {
        e.mesh.userData.stealthCooldown -= dt;
        if (e.mesh.userData.stealthCooldown <= 0) e.mesh.visible = false;
      }
    }

    // 寻路 - 使用流场寻路（非飞行怪物）
    // 雪地地图：波次僵尸朝信号塔移动
    let targetPos = camera.position;
    if (window.SnowMap && SnowMap.active && SnowMap.defenseWaveActive && SnowMap.towerMesh) {
      targetPos = SnowMap.towerMesh.position;
    }
    const toTarget = new THREE.Vector3().subVectors(targetPos, e.mesh.position);
    toTarget.y = 0;
    const dist = toTarget.length();

    // 兼容层：雪地僵尸没有 def 属性
    const attackRange = (e.def && e.def.attackRange) ? e.def.attackRange : 3;

    if (dist > attackRange * 0.8) {
      // 初始化避障状态
      if (!e.avoidData) {
        e.avoidData = {
          stuckTimer: 0,
          lastPos: e.mesh.position.clone(),
          attackFortCooldown: 0
        };
      }
      const ad = e.avoidData;

      // 检测是否卡住（位置几乎没变）
      const movedDist = e.mesh.position.distanceTo(ad.lastPos);
      if (movedDist < e.speed * dt * 0.3) {
        ad.stuckTimer += dt;
      } else {
        ad.stuckTimer = Math.max(0, ad.stuckTimer - dt * 2);
      }
      ad.lastPos.copy(e.mesh.position);

      // 卡住3秒强制传送到目标附近
      if (ad.stuckTimer > 3) {
        if (window.SnowMap && SnowMap.active && SnowMap.towerMesh) {
          // 雪地地图：传送到信号塔附近随机位置
          const angle = Math.random() * Math.PI * 2;
          const dist = 15 + Math.random() * 20;
          const tx = SnowMap.towerMesh.position.x + Math.cos(angle) * dist;
          const tz = SnowMap.towerMesh.position.z + Math.sin(angle) * dist;
          const ty = SnowMap.getTerrainHeight ? SnowMap.getTerrainHeight(tx, tz) : 0;
          e.mesh.position.set(tx, ty, tz);
        } else {
          const spawnPos = findSafeSpawnNearPlayer(5, 15);
          if (spawnPos) {
            e.mesh.position.copy(spawnPos);
          }
        }
        ad.stuckTimer = 0;
        console.log('[Zombie] Teleported stuck enemy');
      }

      // 计算移动方向
      let moveDir;
      const isFlying = (e.def && e.def.flying) && e.mesh.userData.flying;

      if (isFlying) {
        // 飞行怪物直接朝目标移动
        moveDir = toTarget.clone().normalize();
      } else if (window.FlowField && !(window.SnowMap && SnowMap.active)) {
        // 城市地图：地面怪物使用流场寻路
        moveDir = new THREE.Vector3(
          FlowField.getFlowDirection(e.mesh.position.x, e.mesh.position.z).x,
          0,
          FlowField.getFlowDirection(e.mesh.position.x, e.mesh.position.z).z
        );

        // 如果流场返回零向量（不可达区域），直接朝目标移动
        if (moveDir.length() < 0.01) {
          moveDir = toTarget.clone().normalize();
        }
      } else {
        // 雪地地图或流场未初始化，直接朝目标移动
        moveDir = toTarget.clone().normalize();
      }

      // 检查铁丝网减速效果（非飞行怪物）
      let speedMult = 1.0;
      if (!(e.def.flying && e.mesh.userData.flying)) {
        if (window.deployedFortifications) {
          for (const fort of window.deployedFortifications) {
            if (fort.def.type === 'barricade' && fort.def.effect?.slow && fort.health > 0) {
              const dx = Math.abs(e.mesh.position.x - fort.mesh.position.x);
              const dz = Math.abs(e.mesh.position.z - fort.mesh.position.z);
              if (dx < fort.def.size / 2 && dz < 0.5) {
                speedMult = fort.def.effect.slow;
                break;
              }
            }
          }
        }
      }

      // 计算新位置
      let newPos = e.mesh.position.clone().addScaledVector(moveDir, e.speed * speedMult * dt);

      // 检查新位置是否在墙内或工事障碍内（所有敌人都需要此函数，但飞行怪物不调用）
      const zombieRadius = e.def.size * 0.5;
      function isInsideWall(pos) {
        // 飞行怪物无视障碍物
        if (e.def.flying && e.mesh.userData.flying) return false;
        const checkColliders = getNearbyColliders(pos.x, pos.z, zombieRadius + 1);
        for (const c of checkColliders) {
          if (!c.solid || c.type === 'stair_shell') continue;
          if (c.type === 'stair_wall' && e.mesh.position.y >= c.topY - 0.5) continue;
          const dx = Math.abs(pos.x - c.x);
          const dz = Math.abs(pos.z - c.z);
          // 严格检测：中心点是否在墙内
          if (dx < c.hw && dz < c.hd) return true;
          // 检测边缘碰撞
          if (dx < c.hw + zombieRadius * 0.3 && dz < c.hd + zombieRadius * 0.3) return true;
        }
        // 检查是否与工事（路障）碰撞
        if (window.deployedFortifications) {
          for (const fort of window.deployedFortifications) {
            if (fort.def.type === 'barricade' && fort.health > 0) {
              const dx = Math.abs(pos.x - fort.mesh.position.x);
              const dz = Math.abs(pos.z - fort.mesh.position.z);
              const halfSize = fort.def.size / 2 + zombieRadius;
              if (dx < halfSize && dz < 0.5) return true; // 木栅栏和铁丝网阻挡
            }
          }
        }
        return false;
      }
      
      // 查找阻挡前进的工事
      function findBlockingFortification(pos, dir) {
        if (!window.deployedFortifications) return null;
        
        let closestFort = null;
        let closestDist = Infinity;
        
        for (const fort of window.deployedFortifications) {
          if (fort.health <= 0) continue; // 跳过已摧毁的工事
          
          const fortPos = fort.mesh.position;
          const toFort = new THREE.Vector3().subVectors(fortPos, pos);
          toFort.y = 0;
          const distToFort = toFort.length();
          
          // 只考虑前方的工事（在移动方向上）
          const dirToFort = toFort.clone().normalize();
          const dot = dir.dot(dirToFort);
          
          // 如果在正前方（夹角小于60度）且在攻击范围内
          if (dot > 0.5 && distToFort < 3) {
            // 检查工事类型（机器狗不阻挡也不可被攻击）
            if (fort.def.type === 'barricade' || fort.def.type === 'turret' || 
                fort.def.type === 'drone' || fort.def.type === 'trap') {
              if (distToFort < closestDist) {
                closestDist = distToFort;
                closestFort = fort;
              }
            }
          }
        }
        
        return closestFort;
      }
      
      // 攻击工事
      function attackFortification(enemy, fort, dt) {
        if (!fort || fort.health <= 0) return;
        
        // 计算伤害（含天气伤害倍率）
        const weatherDamageMult = enemy.damageMult || 1;
        const damage = enemy.def.damage * 0.5 * dt * weatherDamageMult;
        fort.health -= damage;
        
        // 显示伤害数字
        showFloatingText(fort.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), `-${Math.floor(damage)}`, 0xff0000);
        
        // 工事受击闪烁效果（使用emissive叠加，不改变基础颜色，跳过血条等UI元素）
        fort.mesh.traverse(child => {
          if (child.isMesh && child.material && child.material.emissive && child.parent && child.parent.name !== 'healthBar') {
            child.material.emissive.setHex(0xff0000);
            child.material.emissiveIntensity = 0.6;
            setTimeout(() => {
              if (child.material && child.material.emissive) {
                child.material.emissive.setHex(0x000000);
                child.material.emissiveIntensity = 0;
              }
            }, 100);
          }
        });
        
        // 检查工事是否被摧毁
        if (fort.health <= 0) {
          destroyFortByEnemy(fort);
        }
      }
      
      // 销毁工事（怪物攻击用）
      function destroyFortByEnemy(fort) {
        // 创建爆炸/碎片效果
        createHitEffect(fort.mesh.position.clone(), 0xff6600);
        
        // 播放破坏音效
        if(window.AudioSystem)AudioSystem.playSound('fort_destroy');
        
        // 显示浮动文字
        showFloatingText(fort.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), '工事被摧毁!', 0xff0000);
        
        // 从场景中移除
        scene.remove(fort.mesh);
        
        // 从数组中移除
        const index = window.deployedFortifications.indexOf(fort);
        if (index > -1) {
          window.deployedFortifications.splice(index, 1);
        }
      }
      
      // 如果目标位置在墙内，尝试滑动移动或攻击工事（只有非飞行怪物需要）
      let attackingFort = null;
      if (!(e.def.flying && e.mesh.userData.flying) && isInsideWall(newPos)) {
        // 尝试只移动X轴
        const tryX = e.mesh.position.clone();
        tryX.x = newPos.x;
        if (!isInsideWall(tryX)) {
          newPos = tryX;
        } else {
          // 尝试只移动Z轴
          const tryZ = e.mesh.position.clone();
          tryZ.z = newPos.z;
          if (!isInsideWall(tryZ)) {
            newPos = tryZ;
          } else {
            // 都不行，检查是否被工事阻挡，如果是则攻击工事
            attackingFort = findBlockingFortification(e.mesh.position, moveDir);
            if (attackingFort && ad.attackFortCooldown <= 0) {
              // 攻击工事
              attackFortification(e, attackingFort, dt);
              ad.attackFortCooldown = 1.0; // 攻击冷却1秒
            }
            // 保持原位
            newPos.copy(e.mesh.position);
            ad.stuckTimer += dt * 2; // 加速卡住计时
          }
        }
      }
      
      // 攻击工事冷却递减
      if (ad.attackFortCooldown > 0) {
        ad.attackFortCooldown -= dt;
      }
      
      // 僵尸主动攻击附近炮塔和工事（非飞行怪物，未被路障阻挡时）
      if (!(e.def.flying && e.mesh.userData.flying) && !attackingFort && ad.attackFortCooldown <= 0) {
        if (window.deployedFortifications && window.deployedFortifications.length > 0) {
          let nearestFort = null;
          let nearestFortDist = 4; // 4米内主动攻击
          
          for (const fort of window.deployedFortifications) {
            if (!fort || fort.health <= 0) continue;
            if (fort.def.type === 'robo_dog') continue; // 不攻击机器狗
            if (fort.def.type === 'trap') continue; // 不主动攻击地雷
            
            const dx = fort.mesh.position.x - e.mesh.position.x;
            const dz = fort.mesh.position.z - e.mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < nearestFortDist) {
              nearestFortDist = dist;
              nearestFort = fort;
            }
          }
          
          if (nearestFort) {
            attackFortification(e, nearestFort, dt);
            ad.attackFortCooldown = 1.0; // 攻击冷却1秒
          }
        }
      }
      
      // 最终验证：如果新位置仍在墙内，强制传送（飞行怪物除外）
      if (isInsideWall(newPos) && !(e.def.flying && e.mesh.userData.flying)) {
        const safePos = findSafeSpawnNearPlayer();
        if (safePos) {
          newPos.copy(safePos);
          ad.stuckTimer = 0;
          ad.insideTimer = 0;
          ad.avoidTimer = 0;
        }
      }

      e.mesh.position.x = newPos.x;
      e.mesh.position.z = newPos.z;
      // 怪物Y轴高度跟踪
      if (window.SnowMap && SnowMap.active && SnowMap.getTerrainHeight) {
        // 雪地地图：使用地形高度
        const terrainH = SnowMap.getTerrainHeight(e.mesh.position.x, e.mesh.position.z);
        e.mesh.position.y += (terrainH - e.mesh.position.y) * Math.min(1, dt * 5);
      } else if (window.DesertMap && DesertMap.active && DesertMap.getTerrainHeight) {
        // 沙漠地图：使用地形高度
        const terrainH = DesertMap.getTerrainHeight(e.mesh.position.x, e.mesh.position.z);
        e.mesh.position.y += (terrainH - e.mesh.position.y) * Math.min(1, dt * 5);
      } else {
        // 城市地图：楼梯高度或地面
        const stairHeight = getStairHeight(e.mesh.position.x, e.mesh.position.z, 0);
        if (stairHeight >= 0) {
          const targetY = stairHeight;
          e.mesh.position.y += (targetY - e.mesh.position.y) * Math.min(1, dt * 5);
        } else {
          e.mesh.position.y += (0 - e.mesh.position.y) * Math.min(1, dt * 5);
        }
      }
      e.mesh.lookAt(targetPos.x, e.mesh.position.y, targetPos.z);
    }

    // ========== 行走动画（按怪物类型细分）==========
    let parts = e.mesh.userData.parts;
    if (!parts) {
      parts = { arms: [], legs: [], head: null, body: null, tail: null, wings: [], claws: [] };
      e.mesh.userData.parts = parts;
      e.mesh.traverse(child => {
        if (child.isMesh && child.userData && child.userData.part) {
          if (child.userData.part === 'arm') parts.arms.push(child);
          else if (child.userData.part === 'leg') parts.legs.push(child);
          else if (child.userData.part === 'head') parts.head = child;
          else if (child.userData.part === 'body') parts.body = child;
          else if (child.userData.part === 'tail') parts.tail = child;
          else if (child.userData.part === 'wing') parts.wings.push(child);
          else if (child.userData.part === 'claw') parts.claws.push(child);
        }
      });
    }
    
    const hasParts = parts.arms.length > 0 || parts.legs.length > 0;
    const isMoving = dist > e.def.attackRange * 0.8;
    const t = e.animTimer;
    const name = e.def.name;
    
    // 沙漠怪物专属动画
    if (e.def.desert) {
      animateDesertEnemy(e, parts, isMoving, t, dt, dist);
    } else {
      // 通用动画（非沙漠怪物）
      const animSpeed = e.def.crawl ? 5 : 3;
      if (isMoving) {
        if (hasParts) {
          parts.legs.forEach((leg, i) => {
            leg.rotation.x = Math.sin(t * animSpeed + i * Math.PI) * 0.5;
          });
          parts.arms.forEach((arm, i) => {
            arm.rotation.x = Math.sin(t * animSpeed + i * Math.PI + Math.PI) * 0.3;
          });
          if (parts.body) parts.body.rotation.z = Math.sin(t * animSpeed * 2) * 0.05;
          if (parts.head) parts.head.rotation.x = Math.sin(t * animSpeed) * 0.08;
        }
      } else {
        if (hasParts) {
          parts.legs.forEach(leg => { leg.rotation.x *= 0.9; });
          parts.arms.forEach(arm => { arm.rotation.x *= 0.9; });
          if (parts.body) {
            parts.body.rotation.z *= 0.9;
            parts.body.position.y += Math.sin(t * 2) * 0.002;
          }
        }
      }
    }
    
    // 飞龙AI：持续飞行，翅膀始终拍打，远程吐息+近战俯冲攻击（在isMoving块外，始终执行）
    if (e.def.wyvern) {
        const wingRoots = e.mesh.children.filter(c => c.userData.part === 'wingRoot');
        if (!e.wyvernState) {
          e.wyvernState = {
            phase: 'circle', // circle=盘旋, approach=接近, overhead=头顶攻击, dive=俯冲, rise=拉起
            timer: 0,
            attackTimer: 0,
            breathTimer: 0,
            targetPos: null,
            currentHeight: 8 + Math.random() * 4,
            heightOffset: 0,
            attackCooldown: 0
          };
        }
        const ws = e.wyvernState;
        const toPlayer = new THREE.Vector3().subVectors(camera.position, e.mesh.position);
        toPlayer.y = 0;
        const distToPlayer = toPlayer.length();

        ws.timer += dt;
        ws.attackTimer += dt;
        ws.breathTimer += dt;
        ws.attackCooldown = Math.max(0, ws.attackCooldown - dt);

        // 持续忽高忽低飞行效果
        ws.heightOffset += dt * (1.5 + Math.sin(ws.timer * 1.5) * 0.5);
        const baseHeight = ws.currentHeight + Math.sin(ws.heightOffset) * 1.5;
        
        // 始终面向玩家
        e.mesh.lookAt(camera.position);
        
        if (ws.phase === 'circle') {
          // 盘旋：绕圈飞行，保持高度
          const circleRadius = Math.min(distToPlayer * 0.8, 15);
          const circleSpeed = 1.2;
          const circleAngle = ws.timer * circleSpeed;
          const targetX = camera.position.x + Math.cos(circleAngle) * circleRadius;
          const targetZ = camera.position.z + Math.sin(circleAngle) * circleRadius;
          
          e.mesh.position.x += (targetX - e.mesh.position.x) * dt * 1.5;
          e.mesh.position.z += (targetZ - e.mesh.position.z) * dt * 1.5;
          e.mesh.position.y += (baseHeight - e.mesh.position.y) * dt * 2;
          
          // 盘旋时翅膀持续扑动
          const wingAnimTime = Date.now() * 0.001;
          wingRoots.forEach((root, i) => {
            const dir = root.userData.side === 'left' ? 1 : -1;
            const flapAngle = Math.sin(wingAnimTime * 12) * 0.6 + 0.2;
            root.rotation.z = dir * flapAngle;
            root.rotation.x = Math.sin(wingAnimTime * 8 + i * Math.PI) * 0.1;
          });
          
          // 远程吐息攻击（持续移动中发射）
          if (distToPlayer < e.def.attackRange && ws.breathTimer > 2.0 && ws.attackCooldown <= 0) {
            // 吐息：连续发射多个毒液球
            const breathCount = 3;
            for (let i = 0; i < breathCount; i++) {
              setTimeout(() => {
                if (!e.mesh || e.health <= 0) return;
                const dir = toPlayer.clone().normalize();
                // 添加一些随机偏移
                dir.x += (Math.random() - 0.5) * 0.2;
                dir.z += (Math.random() - 0.5) * 0.2;
                dir.normalize();
                
                // 创建吐息特效
                const breathMesh = new THREE.Mesh(
                  new THREE.SphereGeometry(0.25, 8, 8),
                  new THREE.MeshBasicMaterial({ 
                    color: 0x44FF88, 
                    transparent: true, 
                    opacity: 0.8 
                  })
                );
                breathMesh.position.copy(e.mesh.position).add(new THREE.Vector3(0, -0.3, 0));
                scene.add(breathMesh);
                
                // 吐息拖尾粒子
                for (let j = 0; j < 3; j++) {
                  const trailGeo = new THREE.SphereGeometry(0.1, 4, 4);
                  const trailMat = new THREE.MeshBasicMaterial({ 
                    color: 0x66FFAA, 
                    transparent: true, 
                    opacity: 0.6 
                  });
                  const trail = new THREE.Mesh(trailGeo, trailMat);
                  trail.position.copy(breathMesh.position);
                  trail.position.x += (Math.random() - 0.5) * 0.3;
                  trail.position.z += (Math.random() - 0.5) * 0.3;
                  scene.add(trail);
                  setTimeout(() => {
                    if (trail.parent) scene.remove(trail);
                    trailGeo.dispose();
                    trailMat.dispose();
                  }, 300);
                }
                
                bullets.push({
                  pos: e.mesh.position.clone().add(new THREE.Vector3(0, -0.3, 0)),
                  dir: dir,
                  speed: 18,
                  damage: e.def.damage * 0.5,
                  life: 4,
                  isCrit: false,
                  fromPlayer: false,
                  pierce: false,
                  mesh: breathMesh,
                  color: 0x44FF88,
                  isBreath: true,
                  trailTimer: 0
                });
              }, i * 200);
            }
            
            // 吐息动画：翅膀大幅扑动
            wingRoots.forEach((root, i) => {
              const dir = root.userData.side === 'left' ? 1 : -1;
              root.rotation.z = dir * 1.2;
            });
            
            ws.breathTimer = 0;
            ws.attackCooldown = 1.5;
          }
          
          // 进入近战范围时飞到玩家头顶
          if (distToPlayer < e.def.attackRangeMelee * 3 && ws.attackCooldown <= 0) {
            ws.phase = 'approach';
            ws.timer = 0;
            ws.targetPos = camera.position.clone();
            ws.targetPos.y += 4; // 头顶高度
          }
          
        } else if (ws.phase === 'approach') {
          // 接近玩家头顶
          ws.timer += dt;
          const approachSpeed = e.def.speed * 2;
          const overheadPos = camera.position.clone();
          overheadPos.y += 4;
          
          const dirToOverhead = new THREE.Vector3().subVectors(overheadPos, e.mesh.position).normalize();
          e.mesh.position.add(dirToOverhead.multiplyScalar(approachSpeed * dt));
          
          // 快速扑动翅膀加速
          wingRoots.forEach((root, i) => {
            const dir = root.userData.side === 'left' ? 1 : -1;
            const wingAnimTime = Date.now() * 0.001;
            root.rotation.z = dir * (Math.sin(wingAnimTime * 25) * 0.9 + 0.3);
          });
          
          // 到达头顶开始攻击
          if (e.mesh.position.distanceTo(overheadPos) < 2.5 || ws.timer > 2.0) {
            ws.phase = 'overhead';
            ws.timer = 0;
          }
          
        } else if (ws.phase === 'overhead') {
          // 在玩家头顶盘旋攻击
          ws.timer += dt;
          
          // 保持在头顶位置
          const overheadPos = camera.position.clone();
          overheadPos.y += 3.5 + Math.sin(ws.timer * 3) * 0.5;
          overheadPos.x += Math.cos(ws.timer * 4) * 2;
          overheadPos.z += Math.sin(ws.timer * 4) * 2;
          
          e.mesh.position.lerp(overheadPos, dt * 3);
          
          // 爪击攻击
          if (ws.timer > 0.6) {
            damagePlayer(getEnemyDamage(e));
            screenShake(0.5, 0.3);
            showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '爪击!', 0xFF6644);
            createHitEffect(camera.position.clone(), 0xFF6644);
            
            // 爪击特效：翅膀向下猛拍
            wingRoots.forEach((root, i) => {
              const dir = root.userData.side === 'left' ? 1 : -1;
              root.rotation.z = dir * 1.5;
            });
            
            ws.timer = 0;
            ws.attackCooldown = 1.0;
            
            // 攻击2-3次后俯冲
            if (Math.random() < 0.4) {
              ws.phase = 'dive';
              ws.timer = 0;
              ws.targetPos = camera.position.clone();
            }
          }
          
          // 在头顶停留太久后拉起
          if (ws.timer > 4.0) {
            ws.phase = 'rise';
            ws.timer = 0;
          }
          
        } else if (ws.phase === 'dive') {
          // 俯冲攻击：快速冲向玩家
          ws.timer += dt;
          const diveSpeed = e.def.speed * 4;
          
          // 俯冲轨迹：先向上一点，然后猛冲
          if (ws.timer < 0.3) {
            e.mesh.position.y += dt * 3;
          } else {
            const dir3D = new THREE.Vector3().subVectors(ws.targetPos, e.mesh.position).normalize();
            e.mesh.position.add(dir3D.multiplyScalar(diveSpeed * dt));
            e.mesh.position.y += (1.5 - e.mesh.position.y) * dt * 8; // 俯冲到低空
          }
          
          // 俯冲时翅膀收拢
          wingRoots.forEach((root, i) => {
            const dir = root.userData.side === 'left' ? 1 : -1;
            root.rotation.z = dir * 0.3;
          });
          
          // 碰到玩家造成近战伤害
          if (distToPlayer < 2.5) {
            damagePlayer(getEnemyDamage(e, 2.0));
            screenShake(0.9, 0.5);
            showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '俯冲撕咬!', 0xFF4400);
            createHitEffect(camera.position.clone(), 0xFF4400);
            
            // 俯冲命中后快速拉起
            ws.phase = 'rise';
            ws.timer = 0;
            ws.currentHeight = 8 + Math.random() * 4;
            ws.attackCooldown = 2.0;
          }
          
          // 俯冲超过2秒或错过玩家后拉起
          if (ws.timer > 2.0 || e.mesh.position.distanceTo(ws.targetPos) < 1) {
            ws.phase = 'rise';
            ws.timer = 0;
          }
          
        } else if (ws.phase === 'rise') {
          // 拉起：快速上升到新高度
          ws.timer += dt;
          
          // 快速上升
          const riseSpeed = e.def.speed * 2.5;
          e.mesh.position.y += riseSpeed * dt;
          
          // 同时远离玩家一点
          const awayDir = new THREE.Vector3().subVectors(e.mesh.position, camera.position).normalize();
          awayDir.y = 0;
          e.mesh.position.x += awayDir.x * riseSpeed * dt * 0.5;
          e.mesh.position.z += awayDir.z * riseSpeed * dt * 0.5;
          
          // 拉起时翅膀快速扑动
          wingRoots.forEach((root, i) => {
            const dir = root.userData.side === 'left' ? 1 : -1;
            const wingAnimTime = Date.now() * 0.001;
            root.rotation.z = dir * (Math.sin(wingAnimTime * 20) * 0.8 + 0.2);
          });
          
          // 到达目标高度后回到盘旋
          if (e.mesh.position.y >= ws.currentHeight || ws.timer > 1.5) {
            ws.phase = 'circle';
            ws.timer = 0;
          }
        }
      }
      
      // 其他飞行怪物的动画（非飞龙）
      if (!e.def.wyvern && e.def.flying && e.mesh.userData.flying) {
        const flyHeight = e.mesh.userData.flyHeight || 5;
        e.mesh.position.y += (flyHeight - e.mesh.position.y) * dt * 2;
        const wings = e.mesh.children.filter(c => c.userData.part === 'wing');
        wings.forEach((wing, i) => {
          const dir = wing.userData.side === 'left' ? 1 : -1;
          wing.rotation.z = dir * (Math.sin(e.animTimer * 10) * 0.5 + 0.3);
        });
      }

    // 攻击 - 需要检查高度差
    e.attackTimer -= dt;
    const enemySize = (e.def && e.def.size) ? e.def.size : 1;
    const heightDiff = Math.abs(camera.position.y - (e.mesh.position.y + enemySize));
    const inRange = dist < attackRange && heightDiff < 2.5; // 高度差超过2.5米打不到
    
    // 雪山防御阶段：僵尸优先攻击信号塔
    let attackTower = false;
    if (window.SnowMap && SnowMap.active && SnowMap.phase === 'defend' && SnowMap.towerMesh) {
      const towerDist = e.mesh.position.distanceTo(SnowMap.towerMesh.position);
      if (towerDist < attackRange + 2) {
        attackTower = true;
      }
    }
    
    // 攻击动画状态
    if (e.attackAnimTimer > 0) {
      e.attackAnimTimer -= dt;
      if (hasParts) {
        // 攻击动画：手臂快速前伸
        const attackPhase = 1 - (e.attackAnimTimer / 0.3);
        parts.arms.forEach(arm => {
          arm.rotation.x = -Math.sin(attackPhase * Math.PI) * 1.2;
        });
        // 攻击时身体前倾
        if (parts.body) {
          parts.body.rotation.x = -Math.sin(attackPhase * Math.PI) * 0.15;
        }
        // 攻击时头前伸
        if (parts.head) {
          parts.head.rotation.x = -Math.sin(attackPhase * Math.PI) * 0.2;
        }
      }
    }
    
    if ((inRange || attackTower) && e.attackTimer <= 0) {
      e.attackTimer = (e.def && e.def.attackRate) ? e.def.attackRate : 1.2;
      e.attackAnimTimer = 0.3; // 触发攻击动画（0.3秒）
      
      // 雪山防御阶段：攻击信号塔
      if (attackTower && window.SnowMap) {
        const dmg = getEnemyDamage(e);
        SnowMap.damageTower(dmg);
        // 攻击提示（每3秒最多提示一次）
        if (!SnowMap._lastAttackWarning || Date.now() - SnowMap._lastAttackWarning > 3000) {
          SnowMap._lastAttackWarning = Date.now();
          if (typeof showToast === 'function') showToast('⚠️ 信号塔正在被攻击！', 'error');
        }
      } else {
      // 播放攻击音效（只有近战僵尸播放）
      if (!e.def.ranged) {
        if(window.AudioSystem)AudioSystem.playSound('zombie_attack');
      }
      
      // 暴君特殊攻击
      if (e.def.tyrant) {
        if (!e.tyrantState) {
          e.tyrantState = { phase: 'chase', timer: 0, chargeCooldown: 0, slamCooldown: 0, roarPlayed: false };
        }
        const ts = e.tyrantState;
        const distToPlayer = e.mesh.position.distanceTo(camera.position);
        
        // 蓄力冷却递减
        ts.chargeCooldown = Math.max(0, ts.chargeCooldown - dt);
        ts.slamCooldown = Math.max(0, ts.slamCooldown - dt);
        
        if (ts.phase === 'chase') {
          // 缓慢追击
          const toPlayer = new THREE.Vector3().subVectors(camera.position, e.mesh.position);
          toPlayer.y = 0;
          if (toPlayer.length() > 2) {
            toPlayer.normalize().multiplyScalar(e.def.speed * dt);
            e.mesh.position.x += toPlayer.x;
            e.mesh.position.z += toPlayer.z;
          }
          // 保持站立高度
          e.mesh.position.y += (0 - e.mesh.position.y) * dt * 3;
          
          // 蓄力攻击触发：距离8-20米时，冷却结束后随机触发
          if (distToPlayer > 8 && distToPlayer < 20 && ts.chargeCooldown <= 0 && Math.random() < 0.02) {
            ts.phase = 'windup';
            ts.timer = 0;
            ts.startPos = e.mesh.position.clone();
            ts.roarPlayed = false;
          }
          
          // 近身攻击
          if (distToPlayer < 4) {
            damagePlayer(getEnemyDamage(e));
            screenShake(0.5, 0.3);
            showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '重拳!', 0xff4444);
            ts.chargeCooldown = 2;
          }
          
          // 地板锤击：近身6米内，冷却结束后触发
          if (distToPlayer < 6 && ts.slamCooldown <= 0 && Math.random() < 0.015) {
            ts.phase = 'slam_windup';
            ts.timer = 0;
            ts.slamPos = e.mesh.position.clone();
            ts.roarPlayed = false;
          }
        } else if (ts.phase === 'windup') {
          // 蓄力阶段：完全静止，身体蓄力动画
          ts.timer += dt;
          // 保持静止，不移动
          e.mesh.position.y += (0 - e.mesh.position.y) * dt * 2;
          
          // 蓄力动画：身体膨胀、发光增强
          if (hasParts && parts.body) {
            parts.body.scale.y = 1.2 + Math.sin(ts.timer * 10) * 0.15;
            parts.body.position.y = -Math.abs(Math.sin(ts.timer * 10)) * 0.4;
          }
          
          // 蓄力震动效果
          if (Math.sin(ts.timer * 15) > 0.9) {
            e.mesh.position.y -= 0.05;
            screenShake(0.1, 0.05); // 轻微震动提示玩家
          }
          
          // 播放恐怖咆哮（蓄力中）
          if (!ts.roarPlayed && ts.timer > 0.5) {
            if(window.AudioSystem)AudioSystem.playSound('zombie_roar');
            ts.roarPlayed = true;
          }
          
          // 蓄力1.5秒后突然冲出
          if (ts.timer >= 1.5) {
            ts.phase = 'charge';
            ts.timer = 0;
            ts.targetPos = camera.position.clone();
            ts.chargeDir = new THREE.Vector3().subVectors(ts.targetPos, e.mesh.position).normalize();
            ts.chargeDir.y = 0;
            ts.chargeDir.normalize();
            ts.hasHit = false;
            // 冲击音效
            if(window.AudioSystem)AudioSystem.playSound('zombie_charge');
            // 特效：冲击波
            createShockwave(e.mesh.position.clone(), 0xff4400);
            showFloatingText(e.mesh.position.clone().add(new THREE.Vector3(0, 3, 0)), '蓄力完成!', 0xff0000);
          }
        } else if (ts.phase === 'charge') {
          // 冲击阶段：突然加速冲向目标（速度提高10倍）
          ts.timer += dt;
          const chargeSpeed = e.def.speed * 10; // 突然提高速度
          e.mesh.position.x += ts.chargeDir.x * chargeSpeed * dt;
          e.mesh.position.z += ts.chargeDir.z * chargeSpeed * dt;
          
          // 冲击时的跳跃效果
          e.mesh.position.y = Math.sin(ts.timer * 15) * 0.5;
          
          // 冲击过程中碰到玩家造成伤害和抖动
          const dist = e.mesh.position.distanceTo(camera.position);
          if (dist < 5 && !ts.hasHit) {
            damagePlayer(getEnemyDamage(e, 2.5)); // 蓄力攻击伤害更高
            screenShake(2, 1); // 强烈抖动
            showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '毁灭冲击!', 0xff0000);
            // 命中特效
            createHitEffect(camera.position.clone(), 0xff2200);
            createShockwave(camera.position.clone(), 0xff4400);
            ts.hasHit = true;
          }
          
          // 冲击结束（冲过目标位置或超时）
          const passedTarget = e.mesh.position.distanceTo(ts.startPos) > ts.targetPos.distanceTo(ts.startPos) + 3;
          if (ts.timer > 1.5 || passedTarget) {
            ts.phase = 'recover';
            ts.timer = 0;
            e.mesh.position.y = 0;
            ts.hasHit = false;
          }
        } else if (ts.phase === 'recover') {
          // 恢复阶段：喘息
          ts.timer += dt;
          e.mesh.position.y += (0 - e.mesh.position.y) * dt * 3;
          if (hasParts && parts.body) {
            parts.body.scale.y += (1 - parts.body.scale.y) * dt * 2;
            parts.body.position.y += (0 - parts.body.position.y) * dt * 2;
            parts.body.rotation.x *= 0.9;
          }
          if (ts.timer > 2) {
            ts.phase = 'chase';
            ts.timer = 0;
            ts.chargeCooldown = 5; // 蓄力攻击冷却5秒
          }
        } else if (ts.phase === 'slam_windup') {
          // 地板锤击蓄力：跳起
          ts.timer += dt;
          
          // 跳起动画（0.8秒内跳到3米高）
          const jumpHeight = Math.min(ts.timer / 0.8, 1) * 3;
          e.mesh.position.y = jumpHeight;
          
          // 身体下蹲蓄力效果
          if (hasParts && parts.body) {
            parts.body.scale.set(1 + ts.timer * 0.3, 1 - ts.timer * 0.2, 1 + ts.timer * 0.3);
          }
          
          // 咆哮提示
          if (!ts.roarPlayed && ts.timer > 0.3) {
            if(window.AudioSystem)AudioSystem.playSound('zombie_roar');
            showFloatingText(e.mesh.position.clone().add(new THREE.Vector3(0, 4, 0)), '砸地!', 0xff6600);
            ts.roarPlayed = true;
          }
          
          // 0.8秒后下砸
          if (ts.timer >= 0.8) {
            ts.phase = 'slam';
            ts.timer = 0;
          }
        } else if (ts.phase === 'slam') {
          // 下砸阶段（0.3秒）
          ts.timer += dt;
          const slamProgress = Math.min(ts.timer / 0.3, 1);
          
          // 快速下落
          e.mesh.position.y = 3 * (1 - slamProgress * slamProgress);
          
          // 着地时触发
          if (slamProgress >= 1) {
            e.mesh.position.y = 0;
            
            // 恢复身体缩放
            if (hasParts && parts.body) {
              parts.body.scale.set(1, 1, 1);
            }
            
            // 范围伤害（8米内）
            const slamDist = e.mesh.position.distanceTo(camera.position);
            if (slamDist < 8) {
              const falloff = 1 - (slamDist / 8) * 0.5; // 中心100%伤害，边缘50%
              damagePlayer(getEnemyDamage(e, 1.8 * falloff));
            }
            
            // 强烈屏幕震动
            screenShake(3, 1.5);
            
            // 冲击波特效（两层）
            createShockwave(e.mesh.position.clone(), 0xff4400);
            setTimeout(() => createShockwave(e.mesh.position.clone(), 0xff6600), 100);
            
            // 地面裂痕特效：从中心向外扩散的环形粒子
            createSlamEffect(e.mesh.position.clone());
            
            ts.phase = 'recover';
            ts.timer = 0;
            ts.slamCooldown = 8; // 地板锤击冷却8秒
          }
        }
      }
      
      // 舔食者特殊攻击：爬行+跳跃攻击+蓄力冲刺
      if (e.def.licker) {
        // 状态机：chase -> windup(蓄力) -> charge(冲刺) / leap(跳跃) -> recover -> chase
        if (!e.lickerState) {
          e.lickerState = { phase: 'chase', timer: 0, leapTarget: null, attackCooldown: 3, tongueCooldown: 0, chargeCooldown: 0 };
        }
        const ls = e.lickerState;
        const distToPlayer = e.mesh.position.distanceTo(camera.position);
        
        // 攻击冷却递减（更慢的攻速）
        ls.attackCooldown = Math.max(0, ls.attackCooldown - dt);
        ls.tongueCooldown = Math.max(0, ls.tongueCooldown - dt);
        ls.chargeCooldown = Math.max(0, ls.chargeCooldown - dt);
        
        // 舌头伸缩动画（始终进行，与攻击频率一致）
        const tongue = e.mesh.children.find(c => c.userData.part === 'tongue');
        if (tongue) {
          // 舌头动画频率与攻击频率一致（attackRate = 1.5秒）
          const tongueAnimSpeed = 1 / e.def.attackRate * 4; // 4次伸缩周期对应攻击周期
          tongue.scale.z = 1 + Math.sin(e.animTimer * tongueAnimSpeed) * 0.8; // 更明显的伸缩
          
          // 舌头伤害检测：只在舌头伸出时（scale.z > 1.3）进行，蓄力冲刺时不检测
          if (tongue.scale.z > 1.3 && ls.tongueCooldown <= 0 && ls.phase !== 'windup' && ls.phase !== 'charge') {
            // 计算舌头尖端位置
            const tongueTip = new THREE.Vector3();
            tongue.getWorldPosition(tongueTip);
            // 舌头向前延伸
            tongueTip.z += def.size * 0.75 * tongue.scale.z;
            
            const distToTongue = tongueTip.distanceTo(camera.position);
            if (distToTongue < 3.5) { // 增大检测范围
              damagePlayer(getEnemyDamage(e, 0.8)); // 舌头是主要伤害来源
              screenShake(0.3, 0.2);
              showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 1.5, 0)), '舌头舔击!', 0xff6666);
              createHitEffect(camera.position.clone(), 0xff6666);
              ls.tongueCooldown = e.def.attackRate; // 舌头攻击冷却与攻击频率一致
            }
          }
        }
        
        if (ls.phase === 'chase') {
          // 快速爬行接近（保持低姿态）
          const toPlayer = new THREE.Vector3().subVectors(camera.position, e.mesh.position);
          toPlayer.y = 0;
          if (toPlayer.length() > 2) {
            toPlayer.normalize().multiplyScalar(e.def.speed * dt);
            e.mesh.position.x += toPlayer.x;
            e.mesh.position.z += toPlayer.z;
          }
          // 保持低高度（舔食者趴着爬）
          e.mesh.position.y += (0.5 - e.mesh.position.y) * dt * 5;
          // 四肢快速摆动动画
          if (hasParts) {
            const claws = e.mesh.children.filter(c => c.userData.part === 'claw');
            claws.forEach((claw, i) => {
              claw.rotation.x = -Math.PI / 4 + Math.sin(e.animTimer * 15 + i * Math.PI / 2) * 0.5;
            });
          }
          
          ls.timer += dt;
          
          // 蓄力攻击触发：距离6-15米时，冷却结束后随机触发
          if (distToPlayer > 6 && distToPlayer < 15 && ls.chargeCooldown <= 0 && Math.random() < 0.015) {
            ls.phase = 'windup';
            ls.timer = 0;
            ls.startPos = e.mesh.position.clone();
          }
          
          // 跳跃攻击逻辑（降低频率）
          // 只有当攻击冷却结束且时间足够才考虑跳跃
          const shouldLeap = ls.attackCooldown <= 0 && ls.timer > 4 + Math.random() * 3 && distToPlayer < 10;
          
          if (shouldLeap) {
            ls.phase = 'leap';
            ls.timer = 0;
            ls.leapTarget = camera.position.clone();
            
            // 根据玩家高度计算跳跃高度（1-5倍当前高度）
            const heightDiff = camera.position.y - e.mesh.position.y;
            ls.jumpHeight = 3 + Math.random() * 12 + heightDiff * 1.5; // 基础3-15米
            
            // 随机决定跳跃方式：60%攻击，40%跳墙
            ls.leapType = Math.random() < 0.6 ? 'attack' : 'evade';
            
            if (ls.leapType === 'evade') {
              // 跳到最近的建筑物墙上
              const buildings = window.buildingMeshes || [];
              if (buildings && buildings.length > 0) {
                const nearest = buildings.reduce((best, b) => {
                  const bPos = b.position || b.mesh?.position;
                  if (!bPos) return best;
                  const d = e.mesh.position.distanceTo(bPos);
                  return d < best.dist ? { obj: b, dist: d } : best;
                }, { obj: null, dist: Infinity });
                if (nearest.obj && nearest.dist < 15) {
                  const bPos = nearest.obj.position || nearest.obj.mesh?.position;
                  ls.leapTarget = bPos.clone();
                  ls.leapTarget.y += 3 + Math.random() * 5;
                  ls.jumpHeight = ls.leapTarget.y - e.mesh.position.y + 2;
                } else {
                  ls.leapType = 'attack';
                }
              } else {
                ls.leapType = 'attack';
              }
            }
          }
          
          // 近身攻击（普通撕咬）- 降低频率，增加伤害
          if (distToPlayer < 4 && ls.attackCooldown <= 0) {
            damagePlayer(getEnemyDamage(e, 1.5));
            screenShake(0.5, 0.3);
            showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '利爪撕咬!', 0xff6644);
            createHitEffect(camera.position.clone(), 0xff6644);
            ls.attackCooldown = 3; // 攻击冷却3秒（大幅降低攻速）
          }
        } else if (ls.phase === 'windup') {
          // 蓄力阶段：完全静止，身体蓄力动画
          ls.timer += dt;
          // 保持静止，不移动
          e.mesh.position.y += (0.5 - e.mesh.position.y) * dt * 3;
          
          // 蓄力动画：身体膨胀、四肢收缩
          if (hasParts && parts.body) {
            parts.body.scale.y = 1.1 + Math.sin(ls.timer * 12) * 0.1;
            parts.body.position.y = -Math.abs(Math.sin(ls.timer * 12)) * 0.2;
          }
          // 四肢收缩准备冲刺
          const claws = e.mesh.children.filter(c => c.userData.part === 'claw');
          claws.forEach((claw, i) => {
            claw.rotation.x = -Math.PI / 6 + Math.sin(ls.timer * 8) * 0.1;
          });
          
          // 蓄力震动效果
          if (Math.sin(ls.timer * 20) > 0.95) {
            screenShake(0.05, 0.03); // 轻微震动提示玩家
          }
          
          // 蓄力1秒后突然冲出（舔食者蓄力更快）
          if (ls.timer >= 1) {
            ls.phase = 'charge';
            ls.timer = 0;
            ls.targetPos = camera.position.clone();
            ls.chargeDir = new THREE.Vector3().subVectors(ls.targetPos, e.mesh.position).normalize();
            ls.chargeDir.y = 0;
            ls.chargeDir.normalize();
            ls.hasHit = false;
            // 冲击音效
            if(window.AudioSystem)AudioSystem.playSound('zombie_charge');
            showFloatingText(e.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), '蓄力冲刺!', 0xff6600);
          }
        } else if (ls.phase === 'charge') {
          // 冲刺阶段：突然加速冲向目标（速度提高8倍）
          ls.timer += dt;
          const chargeSpeed = e.def.speed * 8; // 突然提高速度
          e.mesh.position.x += ls.chargeDir.x * chargeSpeed * dt;
          e.mesh.position.z += ls.chargeDir.z * chargeSpeed * dt;
          
          // 冲刺时保持低姿态
          e.mesh.position.y += (0.3 - e.mesh.position.y) * dt * 5;
          
          // 冲刺过程中碰到玩家造成伤害和抖动
          const dist = e.mesh.position.distanceTo(camera.position);
          if (dist < 4 && !ls.hasHit) {
            damagePlayer(getEnemyDamage(e, 2)); // 蓄力攻击伤害更高
            screenShake(1.5, 0.8); // 强烈抖动
            showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '冲刺撕咬!', 0xff4400);
            // 命中特效
            createHitEffect(camera.position.clone(), 0xff4400);
            ls.hasHit = true;
          }
          
          // 冲刺结束（冲过目标位置或超时）
          const passedTarget = ls.startPos && e.mesh.position.distanceTo(ls.startPos) > ls.targetPos.distanceTo(ls.startPos) + 2;
          if (ls.timer > 1 || passedTarget) {
            ls.phase = 'recover';
            ls.timer = 0;
            ls.hasHit = false;
            ls.startPos = null;
          }
        } else if (ls.phase === 'leap') {
          ls.timer += dt;
          const leapDuration = ls.leapType === 'attack' ? 0.4 : 0.6;
          const t = Math.min(ls.timer / leapDuration, 1);
          
          // 向目标移动
          const toTarget = new THREE.Vector3().subVectors(ls.leapTarget, e.mesh.position);
          e.mesh.position.add(toTarget.multiplyScalar(t * 0.4));
          
          // 跳跃弧线
          const startY = 0.5;
          e.mesh.position.y = startY + Math.sin(t * Math.PI) * ls.jumpHeight;
          
          // 空中旋转姿态
          if (hasParts && parts.body) {
            parts.body.rotation.x = Math.sin(t * Math.PI) * 0.4;
          }
          
          // 跳跃过程中碰到玩家造成伤害
          const dist = e.mesh.position.distanceTo(camera.position);
          if (dist < 4 && t > 0.3 && !ls.hasHit) {
            const damageMult = ls.leapType === 'attack' ? 3 : 1;
            damagePlayer(getEnemyDamage(e, damageMult));
            screenShake(ls.leapType === 'attack' ? 1 : 0.5, 0.5);
            if (ls.leapType === 'attack') {
              showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), '飞扑撕咬!', 0xff4444);
              createHitEffect(camera.position.clone(), 0xff4444);
            }
            ls.hasHit = true;
          }
          
          if (t >= 1) {
            ls.phase = 'recover';
            ls.timer = 0;
            ls.hasHit = false;
          }
        } else if (ls.phase === 'recover') {
          // 恢复阶段
          ls.timer += dt;
          // 落地后快速调整姿态
          e.mesh.position.y += (0.5 - e.mesh.position.y) * dt * 5;
          if (hasParts && parts.body) {
            parts.body.rotation.x *= 0.9;
            parts.body.scale.y += (1 - parts.body.scale.y) * dt * 2;
          }
          if (ls.timer > 1) {
            ls.phase = 'chase';
            ls.timer = 0;
            ls.attackCooldown = 2; // 跳跃后额外冷却2秒
            ls.chargeCooldown = 4; // 蓄力攻击冷却4秒
          }
        }
      }
      
      // ===== 沙漠僵尸专属技能 =====
      if (e.def.desert) {
        executeDesertEnemySkill(e, dt, dist);
      }
      
      if (e.def.ranged) {
        // 远程攻击 - 可以打到高处但精度降低
        const dir = new THREE.Vector3().subVectors(camera.position, e.mesh.position).normalize();
        // 高度差越大，散布越大
        const heightPenalty = Math.min(heightDiff * 0.05, 0.3);
        dir.x += (Math.random() - 0.5) * heightPenalty;
        dir.y += (Math.random() - 0.5) * heightPenalty;
        dir.z += (Math.random() - 0.5) * heightPenalty;
        dir.normalize();
        
        if (e.def.poison) {
          // 毒液僵尸：喷射毒液到地面形成范围伤害
          const targetPos = camera.position.clone();
          targetPos.y = 0;
          
          // 创建毒液喷射特效
          const poisonParticles = [];
          for (let i = 0; i < 12; i++) {
            const pGeo = new THREE.SphereGeometry(0.12, 6, 6);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.8 });
            const pMesh = new THREE.Mesh(pGeo, pMat);
            pMesh.position.copy(e.mesh.position).add(new THREE.Vector3(0, 1, 0));
            scene.add(pMesh);
            poisonParticles.push({
              mesh: pMesh,
              target: targetPos.clone(),
              progress: 0,
              delay: i * 0.03
            });
          }
          
          // 保存毒液喷射数据
          if (!window.poisonSprays) window.poisonSprays = [];
          window.poisonSprays.push({
            particles: poisonParticles,
            targetPos: targetPos,
            damage: e.def.damage * 0.5 * (1 + (wave - 1) * 0.1),
            duration: 3, // 毒液持续时间
            createdAt: surviveTime
          });
          
          // 创建毒液区域（命中地面时）
          createPoisonZone(targetPos, e.def.damage * 0.3 * (1 + (wave - 1) * 0.1));
          
        } else {
          // 普通远程攻击
          const bulletColor = 0xff4444;
          const bulletMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshLambertMaterial({ 
              color: bulletColor,
              emissive: bulletColor,
              emissiveIntensity: 0.5
            })
          );
          bulletMesh.position.copy(e.mesh.position).add(new THREE.Vector3(0, 1.2, 0));
          scene.add(bulletMesh);
          
          createEnemyBulletTrail(bulletMesh.position, bulletColor);
          
          bullets.push({
            pos: e.mesh.position.clone().add(new THREE.Vector3(0, 1.2, 0)),
            dir: dir,
            speed: 20,
            damage: getEnemyDamage(e),
            life: 3,
            fromPlayer: false,
            color: bulletColor,
            mesh: bulletMesh,
          });
        }
      } else {
        // 近战攻击 - 必须在高度范围内
        damagePlayer(getEnemyDamage(e));
      }
      } // end of attackTower else block
    }
  });

  // 清除死亡敌人
  enemies = enemies.filter(e => !e.dead);
}

// ============================================================
// 队友AI系统
// ============================================================
// 注意：ALLY_CLASSES 已从 config.js 加载

function spawnAlly(customPos, specificClass) {
  console.log('[SpawnAlly] Function called with:', customPos, specificClass);
  console.log('[SpawnAlly] Current ally count:', allies.length, 'MAX:', CONFIG.ALLY_MAX);
  
  // 选择职业类型
  let classDef;
  if (specificClass && typeof ALLY_CLASSES !== 'undefined') {
    classDef = ALLY_CLASSES.find(c => c.name === specificClass) ||
               ALLY_CLASSES.find(c => c.name.includes(specificClass)) ||
               ALLY_CLASSES.find(c => specificClass.includes(c.name));
    if (!classDef) {
      console.log('[SpawnAlly] Unknown class:', specificClass);
      return false;
    }
  } else {
    // 随机选择，但优先选择未拥有的类型
    const ownedTypes = new Set(allies.map(a => a.name));
    const availableTypes = ALLY_CLASSES.filter(c => !ownedTypes.has(c.name));
    if (availableTypes.length > 0) {
      classDef = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    } else {
      // 所有类型都已拥有，随机选择一个进行升级
      classDef = ALLY_CLASSES[Math.floor(Math.random() * ALLY_CLASSES.length)];
    }
  }
  
  // 检查是否已有同类型队友
  const existingAlly = allies.find(a => a.name === classDef.name);
  if (existingAlly) {
    // 升级现有队友：攻击和血量增加原始数值
    const level = (existingAlly.level || 1) + 1;
    existingAlly.level = level;
    existingAlly.damage += classDef.damage; // 攻击增加原始值
    existingAlly.maxHp += classDef.hp; // 血量上限增加原始值
    existingAlly.hp += classDef.hp; // 当前血量也增加
    console.log(`[SpawnAlly] Upgraded ${classDef.name} to level ${level}`);
    showToast(`👥 ${classDef.name} 升级到等级 ${level}！`, 'info');
    updateAllyHUD();
    return 'upgraded';
  }
  
  // 如果没有同类型队友但已满员，无法添加
  if (allies.length >= CONFIG.ALLY_MAX) {
    console.log('[SpawnAlly] Max allies reached, cannot add new type');
    showToast('👥 队友已满，无法添加新类型', 'warning');
    return false;
  }

  console.log('[SpawnAlly] Selected class:', classDef.name, classDef);
  const group = new THREE.Group();

  // 身体 - 根据职业颜色
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.7, 0.3),
    new THREE.MeshLambertMaterial({ color: classDef.color })
  );
  body.position.y = 0.65;
  body.castShadow = true;
  group.add(body);

  // 头
  const skinColors = [0xddaa77, 0xbb8855, 0xcc9966];
  const skin = skinColors[Math.floor(Math.random() * skinColors.length)];
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshLambertMaterial({ color: skin })
  );
  head.position.y = 1.2;
  head.castShadow = true;
  group.add(head);

  // 眼睛 - 职业特色颜色（正Z方向为正面）
  const eyeColors = { '战士': 0x4488ff, '射手': 0x44ff44, '医疗兵': 0xff4444, '突击手': 0xffff44, '侦察兵': 0xff44ff };
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColors[classDef.name] || 0x4488ff });
  const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.04), eyeMat);
  eye1.position.set(-0.08, 1.25, 0.16); // 正Z方向为正面
  group.add(eye1);
  const eye2 = eye1.clone();
  eye2.position.x = 0.08;
  group.add(eye2);

  // 腿
  const legMat = new THREE.MeshLambertMaterial({ color: 0x333355 });
  const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), legMat);
  leg1.position.set(-0.12, 0.25, 0);
  group.add(leg1);
  const leg2 = leg1.clone();
  leg2.position.x = 0.12;
  group.add(leg2);

  // 武器 - 根据职业创建独特武器模型（正Z方向为正面）
  const weaponGroup = new THREE.Group();
  weaponGroup.name = 'allyWeapon';
  weaponGroup.position.set(0.35, 0.65, 0.1); // 正Z方向为正面
  
  if (classDef.name === '狙击手') {
    // 狙击手：长管狙击枪（正Z方向为枪口方向）
    // 枪管
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    barrel.rotation.x = -Math.PI / 2; // 指向正Z方向
    barrel.position.z = 0.35;
    weaponGroup.add(barrel);
    // 瞄准镜
    const scope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    scope.rotation.x = -Math.PI / 2; // 指向正Z方向
    scope.position.set(0, 0.08, 0.2);
    weaponGroup.add(scope);
    // 枪托
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.25),
      new THREE.MeshLambertMaterial({ color: 0x4a3728 })
    );
    stock.position.set(0, -0.05, -0.15); // 枪托在负Z方向（后方）
    weaponGroup.add(stock);
    
  } else if (classDef.name === '突击手') {
    // 突击手：冲锋枪（正Z方向为枪口方向）
    // 枪身
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    body.position.z = 0.15; // 正Z方向为枪口方向
    weaponGroup.add(body);
    // 弹匣
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.18, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    mag.position.set(0, -0.12, 0.1);
    mag.rotation.x = -0.3;
    weaponGroup.add(mag);
    // 握把
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x2a1f15 })
    );
    grip.position.set(0, -0.1, -0.05);
    grip.rotation.x = 0.4;
    weaponGroup.add(grip);
    
  } else if (classDef.name === '炮兵') {
    // 炮兵：火箭筒（正Z方向为炮口方向）
    // 炮管
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    );
    tube.rotation.x = -Math.PI / 2; // 指向正Z方向
    tube.position.z = 0.25;
    weaponGroup.add(tube);
    // 瞄准器
    const sight = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.06, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    sight.position.set(0, 0.1, 0.15);
    weaponGroup.add(sight);
    // 握把
    const rpgGrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.1, 0.06),
      new THREE.MeshLambertMaterial({ color: 0x3d2e1f })
    );
    rpgGrip.position.set(0, -0.08, -0.05);
    weaponGroup.add(rpgGrip);
    
  } else if (classDef.name === '战士') {
    // 战士：霰弹枪（正Z方向为枪口方向）
    // 双枪管
    const barrel1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    barrel1.rotation.x = -Math.PI / 2; // 指向正Z方向
    barrel1.position.set(-0.06, 0, 0.2);
    weaponGroup.add(barrel1);
    const barrel2 = barrel1.clone();
    barrel2.position.set(0.06, 0, 0.2);
    weaponGroup.add(barrel2);
    // 枪身
    const shotgunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.1, 0.25),
      new THREE.MeshLambertMaterial({ color: 0x5c4033 })
    );
    shotgunBody.position.z = -0.05; // 枪身在后方
    weaponGroup.add(shotgunBody);
    // 泵动护木
    const pump = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.12),
      new THREE.MeshLambertMaterial({ color: 0x3d2e1f })
    );
    pump.position.set(0, -0.06, 0.15); // 护木在前方
    weaponGroup.add(pump);
    
  } else if (classDef.name === '医疗兵') {
    // 医疗兵：医疗枪（正Z方向为枪口方向）
    // 枪身
    const medBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.1, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    medBody.position.z = 0.1;
    weaponGroup.add(medBody);
    // 绿色医疗标识
    const medCross = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    medCross.position.set(0, 0.08, 0.1);
    weaponGroup.add(medCross);
    // 治疗光束发射口
    const medEmitter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.03, 0.08, 8),
      new THREE.MeshLambertMaterial({ color: 0x44ff44, emissive: 0x44ff44, emissiveIntensity: 0.5 })
    );
    medEmitter.rotation.x = -Math.PI / 2; // 指向正Z方向
    medEmitter.position.z = 0.3;
    weaponGroup.add(medEmitter);
    
  } else {
    // 射手：标准步枪（正Z方向为枪口方向）
    // 枪身
    const rifleBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.1, 0.45),
      new THREE.MeshLambertMaterial({ color: 0x4a5d23 })
    );
    rifleBody.position.z = 0.15;
    weaponGroup.add(rifleBody);
    // 枪管
    const rifleBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    rifleBarrel.rotation.x = -Math.PI / 2; // 指向正Z方向
    rifleBarrel.position.z = 0.45;
    weaponGroup.add(rifleBarrel);
    // 弹匣
    const rifleMag = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.12, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    rifleMag.position.set(0, -0.1, 0.1);
    rifleMag.rotation.x = -0.2;
    weaponGroup.add(rifleMag);
  }
  
  group.add(weaponGroup);

  // 职业标识 - 头顶图标
  const iconGeo = new THREE.BoxGeometry(0.2, 0.05, 0.2);
  const iconMat = new THREE.MeshBasicMaterial({ color: eyeColors[classDef.name] });
  const icon = new THREE.Mesh(iconGeo, iconMat);
  icon.position.y = 1.55;
  group.add(icon);
  
  // 队友血条（小型）
  const hpBarGroup = new THREE.Group();
  hpBarGroup.name = 'allyHealthBar';
  hpBarGroup.position.y = 1.75;
  
  const hpBgGeo = new THREE.PlaneGeometry(0.6, 0.06);
  const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
  const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
  hpBarGroup.add(hpBg);
  
  const hpFgGeo = new THREE.PlaneGeometry(0.56, 0.04);
  const hpFgMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, side: THREE.DoubleSide });
  const hpFg = new THREE.Mesh(hpFgGeo, hpFgMat);
  hpFg.name = 'allyHpFill';
  hpFg.position.z = 0.001;
  hpBarGroup.add(hpFg);
  
  // 血量数字
  const hpCanvas = document.createElement('canvas');
  hpCanvas.width = 64;
  hpCanvas.height = 32;
  const hpCtx = hpCanvas.getContext('2d');
  hpCtx.fillStyle = 'white';
  hpCtx.font = 'bold 14px Arial';
  hpCtx.textAlign = 'center';
  hpCtx.textBaseline = 'middle';
  hpCtx.fillText(`${classDef.hp}/${classDef.hp}`, 32, 16);
  const hpTextTexture = new THREE.CanvasTexture(hpCanvas);
  const hpTextGeo = new THREE.PlaneGeometry(0.5, 0.25);
  const hpTextMat = new THREE.MeshBasicMaterial({ map: hpTextTexture, transparent: true, side: THREE.DoubleSide });
  const hpTextMesh = new THREE.Mesh(hpTextGeo, hpTextMat);
  hpTextMesh.name = 'allyHpText';
  hpTextMesh.position.y = 0.2;
  hpBarGroup.add(hpTextMesh);
  
  group.add(hpBarGroup);

  // 设置位置：如果有自定义位置则使用，否则在玩家附近随机生成
  if (customPos && customPos.x !== undefined && customPos.z !== undefined) {
    group.position.set(customPos.x, 0, customPos.z);
  } else {
    group.position.copy(camera.position).add(new THREE.Vector3(
      (Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4
    ));
  }
  // 确保队友站在地面上（getGroundLevel返回眼睛高度，队友需脚底高度）
  group.position.y = getGroundLevel(group.position) - 1.7;
  scene.add(group);

  const ally = {
    mesh: group,
    name: classDef.name,
    classDef: classDef,
    level: 1, // 初始等级
    hp: classDef.hp, maxHp: classDef.maxHp,
    speed: classDef.speed,
    damage: classDef.damage,
    fireRate: classDef.fireRate,
    fireTimer: 0,
    dmgMult: window.allyDamageMult || 1,
    target: null,
    state: 'follow',
    animTimer: 0,
    dead: false,
    skillTimer: 0,
    isMedic: classDef.isMedic || false,
    healTimer: 0,
    stats: {},
  };
  // 应用全局队友血量倍率（来自"队友强化"升级）
  if (typeof window.allyHpMult !== 'undefined' && window.allyHpMult > 1) {
    ally.maxHp = Math.floor(ally.maxHp * window.allyHpMult);
    ally.hp = ally.maxHp;
  }
  allies.push(ally);
  console.log('[SpawnAlly] Successfully added ally, total:', allies.length);
  updateAllyHUD();
  return true;
}

function updateAllies(dt) {
  // 安全检查：验证敌人引用是否仍然有效
  function isValidEnemy(e) {
    return e && !e.dead && e.mesh && e.mesh.position;
  }
  // 安全获取敌人位置（返回身体中心，用于瞄准）
  function enemyPos(e) {
    if (!e || !e.mesh || !e.mesh.position) return null;
    const pos = e.mesh.position.clone();
    // 敌人身体中心高度约为 size * 0.5
    pos.y += (e.def && e.def.size) ? e.def.size * 0.5 : 0.5;
    return pos;
  }
  
  // 获取天气移速倍率（只获取一次）
  const weatherSpeedMult = window.WeatherSystem ? WeatherSystem.getPlayerSpeedMult() : 1;
  
  allies.forEach(ally => {
    // 死亡队友：缓慢回血复活（不受healthRegen加成）
    if (ally.dead) {
      ally.deadTimer += dt;
      ally.hp += ally.maxHp * 0.05 * dt; // 每秒恢复5%
      if (ally.hp >= ally.maxHp) {
        // 复活
        ally.hp = ally.maxHp;
        ally.dead = false;
        ally.deadTimer = 0;
        ally.fireTimer = 0;
        ally.target = null;
        ally.state = 'follow';
        // 在死亡位置复活
        if (ally.spawnPos) {
          ally.mesh.position.copy(ally.spawnPos);
        }
        ally.mesh.visible = true;
        console.log('[Ally] Respawned:', ally.name);
      }
      return;
    }
    
    ally.animTimer += dt * ally.speed;
    
    // 生命回复（升级技能加成）
    if (ally.stats && ally.stats.healthRegen > 0 && ally.hp < ally.maxHp) {
      ally.hp = Math.min(ally.maxHp, ally.hp + ally.stats.healthRegen * dt);
    }
    
    // 更新血条
    const hpBar = ally.mesh.getObjectByName('allyHealthBar');
    if (hpBar && camera) {
      hpBar.lookAt(camera.position);
      const hpFill = hpBar.getObjectByName('allyHpFill');
      if (hpFill) {
        const hpPercent = Math.max(0, ally.hp / ally.maxHp);
        hpFill.scale.x = hpPercent;
        hpFill.position.x = (hpPercent - 1) * 0.28;
        if (hpPercent > 0.5) hpFill.material.color.setHex(0x44ff44);
        else if (hpPercent > 0.25) hpFill.material.color.setHex(0xffff44);
        else hpFill.material.color.setHex(0xff4444);
      }
      // 更新血量数字
      const hpText = hpBar.getObjectByName('allyHpText');
      if (hpText && hpText.material && hpText.material.map) {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 32;
        const cx = c.getContext('2d');
        cx.fillStyle = 'white';
        cx.font = 'bold 14px Arial';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillText(`${Math.floor(ally.hp)}/${Math.floor(ally.maxHp)}`, 32, 16);
        hpText.material.map.image = c;
        hpText.material.map.needsUpdate = true;
      }
    }

    // 医疗兵特殊处理：持续治疗队友，不攻击
    if (ally.isMedic) {
      ally.state = 'heal';
      ally.target = null;
      
      // 寻找附近受伤的队友（包括玩家）
      let lowestHpPercent = 1;
      let healTarget = null;
      
      // 检查玩家
      if (player.hp < player.maxHp * 0.9) {
        const dist = ally.mesh.position.distanceTo(camera.position);
        if (dist < 15) {
          lowestHpPercent = player.hp / player.maxHp;
          healTarget = { isPlayer: true };
        }
      }
      
      // 检查其他队友
      allies.forEach(other => {
        if (other === ally || other.dead) return;
        const hpPercent = other.hp / other.maxHp;
        if (hpPercent < lowestHpPercent && hpPercent < 0.9) {
          const dist = ally.mesh.position.distanceTo(other.mesh.position);
          if (dist < 15) {
            lowestHpPercent = hpPercent;
            healTarget = other;
          }
        }
      });
      
      // 治疗逻辑
      ally.healTimer -= dt;
      if (ally.healTimer <= 0 && healTarget) {
        ally.healTimer = ally.fireRate; // 1秒治疗一次
        
        // 治疗目标
        const healAmount = 20;
        let healed = false;
        if (healTarget.isPlayer) {
          player.hp = Math.min(player.hp + healAmount, player.maxHp);
          healed = true;
          // 显示治疗数字（绿色）
          showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2.5, 0)), `+${healAmount} HP`, 0x44ff44);
        } else if (healTarget.hp) {
          healTarget.hp = Math.min(healTarget.hp + healAmount, healTarget.maxHp);
          healed = true;
          showFloatingText(healTarget.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), `+${healAmount} HP`, 0x44ff44);
        }
        
        if (healed) {
          // 医疗特效
          createHealEffect(healTarget.isPlayer ? camera.position.clone() : healTarget.mesh.position.clone());
        }
      }
      
      // 跟随玩家
      const toPlayer = new THREE.Vector3().subVectors(camera.position, ally.mesh.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();
      if (dist > 8) {
        toPlayer.normalize();
        ally.mesh.position.addScaledVector(toPlayer, ally.speed * weatherSpeedMult * dt);
        ally.mesh.lookAt(camera.position.x, ally.mesh.position.y, camera.position.z);
      }
      
      updateAllyHUD();
      return;
    }

    // 狙击手特殊处理：隐身，远程狙击
    if (ally.stealth) {
      ally.state = 'stealth';
      
      // 清除无效目标引用
      if (ally.target && !isValidEnemy(ally.target)) ally.target = null;
      
      const sniperRange = ally.attackRange || 300; // 狙击手攻击距离
      
      // 寻找最远的敌人（狙击手喜欢远程）
      let nearestEnemy = ally.target || null, nearDist = sniperRange;
      if (!nearestEnemy) {
        enemies.forEach(e => {
          if (!isValidEnemy(e)) return;
          const d = ally.mesh.position.distanceTo(e.mesh.position);
          if (d < nearDist) { nearDist = d; nearestEnemy = e; }
        });
      } else {
        nearDist = ally.mesh.position.distanceTo(nearestEnemy.mesh.position);
      }
      
      // 狙击手保持距离
      const toPlayer = new THREE.Vector3().subVectors(camera.position, ally.mesh.position);
      toPlayer.y = 0;
      const playerDist = toPlayer.length();
      
      if (nearestEnemy && isValidEnemy(nearestEnemy) && nearDist < sniperRange) {
        ally.state = 'combat';
        ally.target = nearestEnemy;
        
        // 保持远离敌人
        const ePos = enemyPos(nearestEnemy);
        if (!ePos) { ally.state = 'follow'; updateAllyHUD(); return; }
        const toEnemy = new THREE.Vector3().subVectors(ePos, ally.mesh.position);
        toEnemy.y = 0;
        const dist = toEnemy.length();
        
        // 狙击手保持30米以上距离
        if (dist < 30) {
          toEnemy.normalize();
          ally.mesh.position.addScaledVector(toEnemy, -ally.speed * weatherSpeedMult * dt);
        } else if (dist > 60) {
          toEnemy.normalize();
          ally.mesh.position.addScaledVector(toEnemy, ally.speed * weatherSpeedMult * dt);
        }
        
        // 面朝敌人
        ally.mesh.lookAt(ePos.x, ally.mesh.position.y, ePos.z);
        
        // 狙击射击
        ally.fireTimer -= dt;
        if (ally.fireTimer <= 0 && dist < sniperRange && isValidEnemy(nearestEnemy)) {
          ally.fireTimer = ally.fireRate;
          // 计算武器世界位置
          const weapon = ally.mesh.getObjectByName('allyWeapon');
          const bulletPos = weapon ? new THREE.Vector3().setFromMatrixPosition(weapon.matrixWorld).add(new THREE.Vector3(0, 0.3, 0)) : ally.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
          // 从武器位置指向敌人
          const dir = new THREE.Vector3().subVectors(enemyPos(nearestEnemy), bulletPos).normalize();
          const bullet = {
            pos: bulletPos,
            dir: dir,
            speed: 300, // 狙击子弹高速
            damage: ally.damage * ally.dmgMult,
            life: 3, // 300m需要更长存活时间
            fromPlayer: true,
            pierce: true,
            allyType: '狙击手',
            allyName: ally.name || '队友'
          };
          createAllyBulletMesh(bullet, '狙击手');
          createAllyMuzzleFlash(bullet.pos, dir, '狙击手');
          bullets.push(bullet);
          if(window.AudioSystem)AudioSystem.playSound('ally_shoot');
        }
      } else {
        // 跟随玩家
        if (playerDist > 10) {
          toPlayer.normalize();
          ally.mesh.position.addScaledVector(toPlayer, ally.speed * weatherSpeedMult * dt);
        }
      }
      
      // 狙击手隐身：不被敌人瞄准（但会被范围伤害攻击）
      updateAllyHUD();
      return;
    }
    
    // 突击手特殊处理：高速闪避
    if (ally.skill === 'dodge') {
      // 清除无效目标引用
      if (ally.target && !isValidEnemy(ally.target)) ally.target = null;
      
      let nearestEnemy = ally.target || null, nearDist = 15;
      if (!nearestEnemy) {
        enemies.forEach(e => {
          if (!isValidEnemy(e)) return;
          const d = ally.mesh.position.distanceTo(e.mesh.position);
          if (d < nearDist) { nearDist = d; nearestEnemy = e; }
        });
      } else {
        nearDist = ally.mesh.position.distanceTo(nearestEnemy.mesh.position);
      }
      
      // 突击手躲避敌人
      const toPlayer = new THREE.Vector3().subVectors(camera.position, ally.mesh.position);
      toPlayer.y = 0;
      const playerDist = toPlayer.length();
      
      if (nearestEnemy && isValidEnemy(nearestEnemy) && nearDist < 10) {
        ally.state = 'dodge';
        const ePos = enemyPos(nearestEnemy);
        if (!ePos) { ally.state = 'follow'; updateAllyHUD(); return; }
        const toEnemy = new THREE.Vector3().subVectors(ePos, ally.mesh.position);
        toEnemy.y = 0;
        toEnemy.normalize();
        ally.mesh.position.addScaledVector(toEnemy, -ally.speed * 1.5 * weatherSpeedMult * dt);
        ally.mesh.lookAt(ePos.x, ally.mesh.position.y, ePos.z);
      } else if (nearestEnemy && isValidEnemy(nearestEnemy) && nearDist < 20) {
        ally.state = 'combat';
        const ePos = enemyPos(nearestEnemy);
        if (!ePos) { ally.state = 'follow'; updateAllyHUD(); return; }
        const toEnemy = new THREE.Vector3().subVectors(ePos, ally.mesh.position);
        toEnemy.y = 0;
        const dist = toEnemy.length();
        if (dist < 5) {
          toEnemy.normalize();
          ally.mesh.position.addScaledVector(toEnemy, -ally.speed * weatherSpeedMult * dt);
        }
        ally.mesh.lookAt(ePos.x, ally.mesh.position.y, ePos.z);
        
        // 突击手快速射击
        ally.fireTimer -= dt;
        if (ally.fireTimer <= 0 && dist < 15 && isValidEnemy(nearestEnemy)) {
          ally.fireTimer = ally.fireRate;
          // 计算武器世界位置
          const weapon = ally.mesh.getObjectByName('allyWeapon');
          const bulletPos = weapon ? new THREE.Vector3().setFromMatrixPosition(weapon.matrixWorld).add(new THREE.Vector3(0, 0.3, 0)) : ally.mesh.position.clone().add(new THREE.Vector3(0, 1, 0));
          // 从武器位置指向敌人
          const dir = new THREE.Vector3().subVectors(enemyPos(nearestEnemy), bulletPos).normalize();
          const bullet = {
            pos: bulletPos,
            dir: dir,
            speed: 50,
            damage: ally.damage * ally.dmgMult,
            life: 1.5,
            fromPlayer: true,
            allyType: '突击手',
            allyName: ally.name || '队友'
          };
          createAllyBulletMesh(bullet, '突击手');
          createAllyMuzzleFlash(bullet.pos, dir, '突击手');
          bullets.push(bullet);
          if(window.AudioSystem)AudioSystem.playSound('ally_shoot');
        }
      } else {
        ally.state = 'follow';
        // 跟随玩家
        if (playerDist > 8) {
          toPlayer.normalize();
          ally.mesh.position.addScaledVector(toPlayer, ally.speed * weatherSpeedMult * dt);
          ally.mesh.lookAt(camera.position.x, ally.mesh.position.y, camera.position.z);
        }
      }
      
      updateAllyHUD();
      return;
    }
    
    // 炮兵特殊处理：发射导弹
    if (ally.isArtillery) {
      // 清除无效目标引用
      if (ally.target && !isValidEnemy(ally.target)) ally.target = null;
      
      let nearestEnemy = ally.target || null, nearDist = ally.attackRange || 40;
      if (!nearestEnemy) {
        enemies.forEach(e => {
          if (!isValidEnemy(e)) return;
          const d = ally.mesh.position.distanceTo(e.mesh.position);
          if (d < nearDist) { nearDist = d; nearestEnemy = e; }
        });
      } else {
        nearDist = ally.mesh.position.distanceTo(nearestEnemy.mesh.position);
      }
      
      if (nearestEnemy && isValidEnemy(nearestEnemy)) {
        ally.state = 'combat';
        ally.target = nearestEnemy;
        
        // 炮兵保持中等距离
        const ePos = enemyPos(nearestEnemy);
        const toEnemy = new THREE.Vector3().subVectors(ePos, ally.mesh.position);
        toEnemy.y = 0;
        const dist = toEnemy.length();
        
        if (dist < 10) {
          toEnemy.normalize();
          ally.mesh.position.addScaledVector(toEnemy, -ally.speed * weatherSpeedMult * dt);
        } else if (dist > 25) {
          toEnemy.normalize();
          ally.mesh.position.addScaledVector(toEnemy, ally.speed * weatherSpeedMult * dt);
        }
        ally.mesh.lookAt(ePos.x, ally.mesh.position.y, ePos.z);
        
        // 炮兵导弹发射
        ally.fireTimer -= dt;
        if (ally.fireTimer <= 0 && dist < 40 && isValidEnemy(nearestEnemy)) {
          ally.fireTimer = ally.fireRate;
          createArtilleryProjectile(ally.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), enemyPos(nearestEnemy).clone(), ally.damage * ally.dmgMult, ally.name || '炮兵');
          if(window.AudioSystem)AudioSystem.playSound('explosion');
        }
      } else {
        ally.state = 'follow';
        const toPlayer = new THREE.Vector3().subVectors(camera.position, ally.mesh.position);
        toPlayer.y = 0;
        const playerDist = toPlayer.length();
        if (playerDist > 10) {
          toPlayer.normalize();
          ally.mesh.position.addScaledVector(toPlayer, ally.speed * weatherSpeedMult * dt);
          ally.mesh.lookAt(camera.position.x, ally.mesh.position.y, camera.position.z);
        }
      }
      
      updateAllyHUD();
      return;
    }

    // 普通队友逻辑（战士、射手）
    const attackRange = ally.attackRange || 20;
    const searchRange = attackRange * 1.5; // 搜索范围比攻击范围大50%
    
    // 清除无效目标引用
    if (ally.target && !isValidEnemy(ally.target)) ally.target = null;
    
    // 积极搜索敌人（扩大搜索范围）
    let nearestEnemy = ally.target || null, nearDist = searchRange;
    if (!nearestEnemy) {
      enemies.forEach(e => {
        if (!isValidEnemy(e)) return;
        const d = ally.mesh.position.distanceTo(e.mesh.position);
        if (d < nearDist) { nearDist = d; nearestEnemy = e; }
      });
    } else {
      nearDist = ally.mesh.position.distanceTo(nearestEnemy.mesh.position);
    }

    // 发现敌人：进入战斗状态，主动接近
    if (nearestEnemy && isValidEnemy(nearestEnemy) && nearDist < searchRange) {
      ally.state = 'combat';
      ally.target = nearestEnemy;

      const ePos = enemyPos(nearestEnemy);
      if (!ePos) { ally.state = 'follow'; updateAllyHUD(); return; }
      const toEnemy = new THREE.Vector3().subVectors(ePos, ally.mesh.position);
      toEnemy.y = 0;
      const dist = toEnemy.length();

      // 主动接近敌人到理想距离
      const idealDist = ally.name === '战士' ? 3 : 8;
      if (dist > idealDist + 2) {
        toEnemy.normalize();
        ally.mesh.position.addScaledVector(toEnemy, ally.speed * weatherSpeedMult * dt);
      } else if (dist < idealDist - 1) {
        toEnemy.normalize();
        ally.mesh.position.addScaledVector(toEnemy, -ally.speed * 0.5 * weatherSpeedMult * dt);
      }

      ally.mesh.lookAt(ePos.x, ally.mesh.position.y, ePos.z);

      // 射击
      ally.fireTimer -= dt;
      if (ally.fireTimer <= 0 && dist < attackRange && isValidEnemy(nearestEnemy)) {
        ally.fireTimer = ally.fireRate;
        // 计算武器世界位置
        const weapon = ally.mesh.getObjectByName('allyWeapon');
        const bulletPos = weapon ? new THREE.Vector3().setFromMatrixPosition(weapon.matrixWorld).add(new THREE.Vector3(0, 0.3, 0)) : ally.mesh.position.clone().add(new THREE.Vector3(0, 1, 0));
        // 从武器位置指向敌人
        const dir = new THREE.Vector3().subVectors(enemyPos(nearestEnemy), bulletPos).normalize();
        dir.x += (Math.random() - 0.5) * 0.05;
        dir.y += (Math.random() - 0.5) * 0.03;
        dir.z += (Math.random() - 0.5) * 0.05;
        dir.normalize();
        if (ally.name === '战士') {
          const pelletCount = 5; // 5发弹丸
          for (let p = 0; p < pelletCount; p++) {
            const pelletDir = dir.clone();
            pelletDir.x += (Math.random() - 0.5) * 0.15;
            pelletDir.y += (Math.random() - 0.5) * 0.1;
            pelletDir.z += (Math.random() - 0.5) * 0.15;
            pelletDir.normalize();
            const bullet = {
              pos: bulletPos.clone(),
              dir: pelletDir,
              speed: 45,
              damage: ally.damage * ally.dmgMult / pelletCount,
              life: 1.0,
              fromPlayer: true,
              allyType: '战士',
              allyName: ally.name || '队友'
            };
            createAllyBulletMesh(bullet, '战士');
            bullets.push(bullet);
          }
          createAllyMuzzleFlash(bulletPos, dir, '战士');
        } else {
          // 射手单发
          const bullet = {
            pos: bulletPos.clone(),
            dir: dir,
            speed: 50,
            damage: ally.damage * ally.dmgMult,
            life: 1.5,
            fromPlayer: true,
            allyType: '射手',
            allyName: ally.name || '队友'
          };
          createAllyBulletMesh(bullet, '射手');
          createAllyMuzzleFlash(bulletPos, dir, '射手');
          bullets.push(bullet);
        }
        if(window.AudioSystem)AudioSystem.playSound('ally_shoot');
      }
    } else {
      ally.state = 'patrol';
      ally.target = null;

      // 在玩家周围巡逻
      const toPlayer = new THREE.Vector3().subVectors(camera.position, ally.mesh.position);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      // 保持与玩家8-12米的距离，围绕玩家巡逻
      if (dist > 12) {
        // 太远：靠近玩家
        toPlayer.normalize();
        ally.mesh.position.addScaledVector(toPlayer, ally.speed * weatherSpeedMult * dt);
      } else if (dist < 6) {
        // 太近：远离玩家
        toPlayer.normalize();
        ally.mesh.position.addScaledVector(toPlayer, -ally.speed * 0.5 * weatherSpeedMult * dt);
      } else {
        // 在合适距离：围绕玩家缓慢移动（巡逻）
        const patrolAngle = (surviveTime * 0.5 + allies.indexOf(ally) * Math.PI / 3) % (2 * Math.PI);
        const patrolOffset = new THREE.Vector3(
          Math.cos(patrolAngle) * 0.5,
          0,
          Math.sin(patrolAngle) * 0.5
        );
        ally.mesh.position.add(patrolOffset.multiplyScalar(ally.speed * weatherSpeedMult * dt));
      }
      
      // 面朝移动方向或玩家
      ally.mesh.lookAt(camera.position.x, ally.mesh.position.y, camera.position.z);
    }

    // 地面检测 - 确保队友在地上走
    // getGroundLevel 返回的是玩家眼睛高度（bestTop + 1.7），队友需要脚底高度
    const allyGroundLevel = getGroundLevel(ally.mesh.position) - 1.7;
    ally.mesh.position.y = allyGroundLevel;
    
    // 行走动画
    if (ally.mesh.children[4]) {
      ally.mesh.children[4].rotation.x = Math.sin(ally.animTimer * 3) * 0.5;
    }
    if (ally.mesh.children[5]) {
      ally.mesh.children[5].rotation.x = -Math.sin(ally.animTimer * 3) * 0.5;
    }

    // 检查敌人攻击队友（狙击手隐身不被攻击）
    if (!ally.stealth) {
      enemies.forEach(e => {
        if (e.dead) return;
        const d = e.mesh.position.distanceTo(ally.mesh.position);
        if (d < e.def.attackRange && e.attackTimer <= 0) {
          if (!e.def.ranged) {
            ally.hp -= e.def.damage * 0.5;
            e.attackTimer = e.def.attackRate;
            if (ally.hp <= 0) {
              ally.hp = 0;
              ally.dead = true;
              ally.deadTimer = 0;
              ally.spawnPos = ally.mesh.position.clone(); // 记录死亡位置用于复活
              ally.mesh.visible = false; // 隐藏而非移除
            }
          }
        }
      });
    }

    updateAllyHUD();
  });
}

// 创建医疗特效
function createHealEffect(pos) {
  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const geo = new THREE.SphereGeometry(0.1, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x44ff44, transparent: true, opacity: 0.8 });
    const particle = new THREE.Mesh(geo, mat);
    particle.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2));
    scene.add(particle);
    particles.push({
      mesh: particle,
      vel: new THREE.Vector3((Math.random() - 0.5) * 2, 3, (Math.random() - 0.5) * 2),
      life: 0.5
    });
  }
}

// 创建炮兵导弹
function createArtilleryProjectile(startPos, targetPos, damage, allyName) {
  // 导弹形状：圆柱体主体 + 尾部喷火效果
  const missileGroup = new THREE.Group();
  
  // 导弹主体（圆柱体）
  const bodyGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8);
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2; // 让圆柱体朝向前方
  missileGroup.add(body);
  
  // 导弹头部（红色尖端）
  const headGeo = new THREE.ConeGeometry(0.08, 0.2, 8);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.rotation.x = -Math.PI / 2;
  head.position.z = 0.4;
  missileGroup.add(head);
  
  // 尾部喷火效果（动态火焰）
  const flameGeo = new THREE.ConeGeometry(0.1, 0.3, 8);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.rotation.x = Math.PI / 2;
  flame.position.z = -0.35;
  flame.name = 'flame';
  missileGroup.add(flame);
  
  // 第二层火焰（更亮的内层）
  const flame2Geo = new THREE.ConeGeometry(0.06, 0.2, 8);
  const flame2Mat = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.9 });
  const flame2 = new THREE.Mesh(flame2Geo, flame2Mat);
  flame2.rotation.x = Math.PI / 2;
  flame2.position.z = -0.3;
  flame2.name = 'flame2';
  missileGroup.add(flame2);
  
  missileGroup.position.copy(startPos);
  scene.add(missileGroup);
  
  // 计算弹道（抛物线）
  const dir = new THREE.Vector3().subVectors(targetPos, startPos);
  const horizontalDist = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
  const flightTime = horizontalDist / 3; // 速度3
  const height = flightTime * flightTime * 2; // 抛物线高度
  
  missiles.push({
    mesh: missileGroup,
    startPos: startPos.clone(),
    targetPos: targetPos.clone(),
    damage: damage,
    speed: 3,
    flightTime: flightTime,
    elapsed: 0,
    exploded: false,
    explosionRadius: 8,
    allyName: allyName || '炮兵'
  });
}

// 更新导弹
function updateMissiles(dt) {
  for (let i = missiles.length - 1; i >= 0; i--) {
    const m = missiles[i];
    m.elapsed += dt;
    
    const progress = Math.min(m.elapsed / m.flightTime, 1);
    
    // 线性插值位置 + 抛物线高度
    m.mesh.position.lerpVectors(m.startPos, m.targetPos, progress);
    m.mesh.position.y += Math.sin(progress * Math.PI) * (m.flightTime * 2);
    
    // 让导弹朝向飞行方向
    const nextProgress = Math.min(progress + 0.01, 1);
    const nextPos = new THREE.Vector3().lerpVectors(m.startPos, m.targetPos, nextProgress);
    nextPos.y += Math.sin(nextProgress * Math.PI) * (m.flightTime * 2);
    m.mesh.lookAt(nextPos);
    
    // 动态火焰效果（闪烁）
    const flame = m.mesh.getObjectByName('flame');
    const flame2 = m.mesh.getObjectByName('flame2');
    if (flame) {
      flame.scale.setScalar(0.8 + Math.random() * 0.4);
      flame.material.opacity = 0.6 + Math.random() * 0.3;
    }
    if (flame2) {
      flame2.scale.setScalar(0.8 + Math.random() * 0.3);
    }
    
    if (progress >= 1 && !m.exploded) {
      m.exploded = true;
      // 爆炸效果
      createExplosion(m.targetPos, m.damage, m.explosionRadius);
      if(window.AudioSystem)AudioSystem.playSound('explosion');
      
      // 对范围内敌人造成伤害（使用damageEnemy正确记录击杀）
      enemies.forEach(e => {
        if (e.dead) return;
        const dist = e.mesh.position.distanceTo(m.targetPos);
        if (dist < m.explosionRadius) {
          const dmg = m.damage * (1 - dist / m.explosionRadius);
          damageEnemy(e, Math.floor(dmg), false, e.mesh.position.clone(), m.allyName);
          createHitEffect(e.mesh.position.clone(), 0xff6600);
        }
      });
      // Also damage desert monsters
      if (window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.length > 0) {
        for (let j = DesertMap.desertMonsters.length - 1; j >= 0; j--) {
          const dm = DesertMap.desertMonsters[j];
          if (dm.dead || !dm.mesh || !dm.mesh.position) continue;
          const dist = dm.mesh.position.distanceTo(m.targetPos);
          if (dist < m.explosionRadius) {
            const dmg = m.damage * (1 - dist / m.explosionRadius);
            dm.hp -= dmg;
            if (dm.hp <= 0) {
              if (typeof window.killDesertMonster === 'function') window.killDesertMonster(dm, '导弹');
            }
            createHitEffect(dm.mesh.position.clone(), 0xff6600);
          }
        }
      }
      
      scene.remove(m.mesh);
      missiles.splice(i, 1);
    }
  }
}

// ============================================================
// 粒子系统
// ============================================================
// 粒子系统 - 使用对象池避免内存泄漏
let particleMeshes = [];
let particlePool = [];
const MAX_PARTICLES = 100; // 减少最大粒子数以提高性能

function getParticleFromPool() {
  // 同时尝试从新EffectsSystem获取粒子
  if (window.EffectsSystem && EffectsSystem.particlePoolInitialized) {
    const p = EffectsSystem.getParticle();
    if (p) return p.mesh;
  }
  
  // 旧逻辑作为后备
  if (particlePool.length > 0) {
    return particlePool.pop();
  }
  // 使用更简单的几何体以提高性能
  const geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  const mat = new THREE.MeshBasicMaterial({ transparent: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
}

function returnParticleToPool(mesh) {
  // 同时尝试返回到新EffectsSystem
  if (window.EffectsSystem && EffectsSystem.particlePoolInitialized) {
    // 找到对应的粒子对象
    for (const p of EffectsSystem.particlePool) {
      if (p.mesh === mesh && p.active) {
        EffectsSystem.returnParticle(p);
        return;
      }
    }
  }
  
  // 旧逻辑作为后备
  mesh.visible = false;
  if (particlePool.length < MAX_PARTICLES) {
    particlePool.push(mesh);
  } else {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
}

function updateParticles(dt) {
  if (window.EffectsSystem && EffectsSystem.initialized) {
    try {
      EffectsSystem.updateParticles(dt);
    } catch (e) {}
  }
  // 旧粒子系统更新（处理遗留粒子和非EffectsSystem粒子）
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.isShockwave && p.mesh) {
      p.scale += dt * 15;
      p.mesh.scale.set(p.scale, p.scale, 1);
      p.mesh.material.opacity = p.life / 0.4 * 0.8;
    } else if (p.mesh) {
      p.vel.y -= 10 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.material && p.mesh.material.transparent) {
        p.mesh.material.opacity = Math.max(0, p.life);
      }
    } else if (p.pos) {
      p.pos.addScaledVector(p.vel, dt);
      p.vel.y -= 10 * dt;
    }
    p.life -= dt;
    if (p.life <= 0) {
      if (p.mesh && scene) {
        scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material) p.mesh.material.dispose();
      }
      particles.splice(i, 1);
    }
  }
}

function renderParticles() {
  // 隐藏所有现有粒子
  particleMeshes.forEach(m => { m.visible = false; });
  
  // 只显示活跃的粒子
  const activeCount = Math.min(particles.length, MAX_PARTICLES);
  let meshIndex = 0;
  for (let i = 0; i < activeCount; i++) {
    const p = particles[i];
    if (!p) continue;
    
    // 旧格式粒子（有mesh属性，由击中效果创建）
    if (p.mesh) {
      p.mesh.visible = true;
      continue;
    }
    
    // 新格式粒子（有pos属性）
    if (!p.pos || !p.pos.copy) continue; // 确保pos是Vector3
    
    let mesh;
    if (meshIndex < particleMeshes.length) {
      mesh = particleMeshes[meshIndex];
    } else {
      mesh = getParticleFromPool();
      particleMeshes.push(mesh);
    }
    meshIndex++;
    mesh.visible = true;
    mesh.position.copy(p.pos);
    mesh.scale.setScalar((p.size || 0.1) * 10);
    if (mesh.material) {
      mesh.material.color.setHex(p.color || 0xffffff);
      mesh.material.opacity = Math.min(1, p.life * 2);
    }
  }
}

// 伤害数字
let damageNumbers = [];
function createDamageNumber(pos, amount, isCrit) {
  damageNumbers.push({
    pos: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.5, 0)),
    amount: amount,
    life: 1,
    isCrit: isCrit,
    vel: new THREE.Vector3((Math.random() - 0.5) * 2, 3, 0),
  });
  
  // 同时调用新EffectsSystem（双轨并行）
  if (window.EffectsSystem && EffectsSystem.initialized) {
    try {
      EffectsSystem.createDamageNumber(amount, pos, isCrit);
    } catch (e) {
      console.warn('[game.js] EffectsSystem damage number failed:', e);
    }
  }
}

function updateDamageNumbers(dt) {
  // 旧伤害数字系统更新
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const dn = damageNumbers[i];
    dn.pos.addScaledVector(dn.vel, dt);
    dn.vel.y -= 5 * dt;
    dn.life -= dt;
    if (dn.life <= 0) damageNumbers.splice(i, 1);
  }
}

// ============================================================
// 空投救援事件系统
// ============================================================

// 生成空投信号（红色烟雾）
function spawnAirdropSignal() {
  if (airdropSystem.active) return; // 已有活跃空投
  
  // 同时调用新CombatSystem（双轨并行）
  if (window.CombatSystem && CombatSystem.initialized) {
    try {
      CombatSystem.spawnAirdropSignal();
    } catch (e) {
      console.warn('[game.js] CombatSystem spawnAirdropSignal failed:', e);
    }
  }
  
  // 随机位置（玩家周围30-80米，不在建筑内）
  let pos = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 50;
    const x = camera.position.x + Math.cos(angle) * dist;
    const z = camera.position.z + Math.sin(angle) * dist;
    
    // 限制在地图范围内
    if (Math.abs(x) > CONFIG.MAP_SIZE - 10 || Math.abs(z) > CONFIG.MAP_SIZE - 10) continue;
    
    // 检查是否在建筑内
    const nearby = getNearbyColliders(x, z, 10);
    let blocked = false;
    for (const c of nearby) {
      if (c.solid && Math.abs(x - c.x) < c.hw + 1 && Math.abs(z - c.z) < c.hd + 1) {
        blocked = true;
        break;
      }
    }
    if (!blocked) {
      pos = new THREE.Vector3(x, 0, z);
      break;
    }
  }
  if (!pos) return;
  
  // 创建信号标记（红色闪烁柱子）
  const group = new THREE.Group();
  
  // 底座
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.8, 0.3, 8),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  base.position.y = 0.15;
  group.add(base);
  
  // 信号灯（红色闪烁）
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xFF0000 })
  );
  light.position.y = 1.5;
  group.add(light);
  
  // 红色点光源
  const pointLight = new THREE.PointLight(0xFF0000, 3, 15);
  pointLight.position.y = 1.5;
  group.add(pointLight);
  
  group.position.copy(pos);
  scene.add(group);
  
  airdropSystem.active = {
    state: 'signal',
    mesh: group,
    light: light,
    pointLight: pointLight,
    pos: pos.clone(),
    timer: 0,
    smokeTimer: 0,
    crateMesh: null,
    crateY: 0,
    hordeSpawned: false,
  };
  
  // 提示
  showFloatingText(pos.clone().add(new THREE.Vector3(0, 3, 0)), '空投信号已出现!', 0xFF4444);
  console.log('[Airdrop] Signal spawned at', pos.x.toFixed(0), pos.z.toFixed(0));
}

// 更新空投系统（每帧调用）
function updateAirdrop(dt) {
  if (!CONFIG.AIRDROP.ENABLED) return;
  if (window.currentMap === 'island') return;

  // 同时更新新CombatSystem的空投系统（双轨并行）
  if (window.CombatSystem && CombatSystem.initialized) {
    try {
      CombatSystem.updateAirdrop(dt);
    } catch (e) {
      console.warn('[game.js] CombatSystem updateAirdrop failed:', e);
    }
  }

  // 获取通讯塔加成
  let radioBonus = 1; // 通讯塔频率加成
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getData) {
    try {
      const shelterData = ShelterSystem.getData();
      const radio = shelterData.facilities.find(f => f.type === 'radio');
      if (radio) radioBonus -= radio.level * 0.20; // 每级-20%间隔（即+25%频率）
    } catch(e) {}
  }
  const spawnInterval = CONFIG.AIRDROP.SPAWN_INTERVAL * radioBonus;

  // 没有活跃空投时，计时生成新信号
  if (!airdropSystem.active) {
    airdropSystem.timer += dt;
    if (airdropSystem.timer >= spawnInterval) {
      airdropSystem.timer = 0;
      spawnAirdropSignal();
    }
    return;
  }
  
  const ad = airdropSystem.active;
  ad.timer += dt;
  
  switch(ad.state) {
    case 'signal': {
      // 信号闪烁效果
      const blink = Math.sin(Date.now() * 0.005) > 0;
      ad.light.material.color.setHex(blink ? 0xFF0000 : 0x440000);
      ad.pointLight.intensity = blink ? 3 : 1;
      
      // 生成烟雾粒子
      ad.smokeTimer += dt;
      if (ad.smokeTimer > 0.3) {
        ad.smokeTimer = 0;
        particles.push({
          pos: ad.pos.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            1 + Math.random() * 2,
            (Math.random() - 0.5) * 0.5
          )),
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, 2 + Math.random() * 2, (Math.random() - 0.5) * 0.5),
          life: 2 + Math.random(),
          color: 0xFF3333,
          size: 0.3 + Math.random() * 0.3,
        });
      }
      
      // 检测玩家是否接近
      const dist = Math.sqrt(
        Math.pow(camera.position.x - ad.pos.x, 2) +
        Math.pow(camera.position.z - ad.pos.z, 2)
      );
      if (dist < CONFIG.AIRDROP.APPROACH_RADIUS) {
        // 玩家到达，触发空投
        ad.state = 'descending';
        ad.timer = 0;
        ad.crateY = CONFIG.AIRDROP.DESCENT_START_HEIGHT;
        
        // 移除信号
        scene.remove(ad.mesh);
        ad.mesh = null;
        
        // 创建空投箱
        ad.crateMesh = createAirdropCrate();
        ad.crateMesh.position.set(ad.pos.x, ad.crateY, ad.pos.z);
        scene.add(ad.crateMesh);
        
        showFloatingText(ad.pos.clone().add(new THREE.Vector3(0, 5, 0)), '空投已呼叫!', 0x44FF44);
        console.log('[Airdrop] Crate descending...');
      }
      
      // 信号超时
      if (ad.timer > CONFIG.AIRDROP.SIGNAL_LIFETIME) {
        cleanupAirdrop();
      }
      break;
    }
    
    case 'descending': {
      // 空投箱下降
      ad.crateY -= CONFIG.AIRDROP.DESCENT_SPEED * dt;
      ad.crateMesh.position.y = ad.crateY;
      
      // 降落伞旋转效果
      ad.crateMesh.rotation.y += dt * 0.5;
      
      // 落地
      if (ad.crateY <= 1) {
        ad.crateY = 1;
        ad.crateMesh.position.y = 1;
        ad.crateMesh.rotation.y = 0;
        ad.state = 'landing';
        ad.timer = 0;
        
        showFloatingText(ad.pos.clone().add(new THREE.Vector3(0, 3, 0)), '空投已到达! 按[E]开启', 0xFFAA00);
        console.log('[Airdrop] Crate landed!');
      }
      break;
    }
    
    case 'landing': {
      // 等待玩家开启
      const dist = Math.sqrt(
        Math.pow(camera.position.x - ad.pos.x, 2) +
        Math.pow(camera.position.z - ad.pos.z, 2)
      );
      
      // HUD提示
      if (dist < 8) {
        // 在updateHUD中处理提示显示
        airdropSystem.showPrompt = true;
        airdropSystem.promptDist = dist;
      } else {
        airdropSystem.showPrompt = false;
      }
      
      // 延迟后可开启
      if (ad.timer > CONFIG.AIRDROP.OPEN_TIME && dist < CONFIG.AIRDROP.APPROACH_RADIUS && keys['KeyE']) {
        openAirdropCrate();
        keys['KeyE'] = false;
      }
      
      // 超时
      if (ad.timer > CONFIG.AIRDROP.CRATE_LIFETIME) {
        cleanupAirdrop();
      }
      break;
    }
    
    case 'opened': {
      // 已开启，等待清理
      if (ad.timer > 5) {
        cleanupAirdrop();
      }
      break;
    }
  }
}

// 创建空投箱模型
function createAirdropCrate() {
  const group = new THREE.Group();
  
  // 箱体
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.5, 2),
    new THREE.MeshLambertMaterial({ color: 0x2A5A2A })
  );
  crate.position.y = 0.75;
  crate.castShadow = true;
  group.add(crate);
  
  // 金属边框
  const edgeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  const edges = [
    { pos: [0, 1.5, 0], size: [2.1, 0.1, 2.1] },  // 顶
    { pos: [0, 0, 0], size: [2.1, 0.1, 2.1] },    // 底
    { pos: [0, 0.75, 1], size: [2.1, 1.5, 0.1] },  // 前
    { pos: [0, 0.75, -1], size: [2.1, 1.5, 0.1] }, // 后
    { pos: [1, 0.75, 0], size: [0.1, 1.5, 2.1] },  // 右
    { pos: [-1, 0.75, 0], size: [0.1, 1.5, 2.1] }, // 左
  ];
  edges.forEach(e => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(e.size[0], e.size[1], e.size[2]),
      edgeMat
    );
    mesh.position.set(e.pos[0], e.pos[1], e.pos[2]);
    group.add(mesh);
  });
  
  // 红色十字标记
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.2), crossMat);
  crossH.position.set(0, 1.55, 0);
  group.add(crossH);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 1.2), crossMat);
  crossV.position.set(0, 1.55, 0);
  group.add(crossV);
  
  // 降落伞（下降时可见）
  const chute = new THREE.Group();
  const chuteMat = new THREE.MeshLambertMaterial({ color: 0xFF6600, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const chuteMesh = new THREE.Mesh(
    new THREE.CircleGeometry(3, 16),
    chuteMat
  );
  chuteMesh.rotation.x = -Math.PI / 2;
  chuteMesh.position.y = 3;
  chute.add(chuteMesh);
  
  // 伞绳
  const ropeMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const rope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 3),
      ropeMat
    );
    rope.position.set(Math.cos(angle) * 1.5, 1.5, Math.sin(angle) * 1.5);
    rope.lookAt(new THREE.Vector3(Math.cos(angle) * 2.5, 3, Math.sin(angle) * 2.5));
    chute.add(rope);
  }
  group.add(chute);
  group.userData.chute = chute;
  
  return group;
}

// 开启空投箱
function openAirdropCrate() {
  const ad = airdropSystem.active;
  if (!ad || ad.state !== 'landing') return;
  
  ad.state = 'opened';
  ad.timer = 0;
  
  // 移除降落伞
  if (ad.crateMesh.userData.chute) {
    ad.crateMesh.remove(ad.crateMesh.userData.chute);
  }
  
  // 改变箱子颜色表示已开启
  ad.crateMesh.children[0].material.color.setHex(0x1A3A1A);
  
  // 掉落丰富物品
  const cfg = CONFIG.AIRDROP;
  const lootTable = cfg.LOOT_TABLE;
  const totalWeight = lootTable.reduce((sum, item) => sum + item.weight, 0);
  
  for (let i = 0; i < cfg.LOOT_COUNT; i++) {
    // 根据权重随机选择物品类型
    let random = Math.random() * totalWeight;
    let selected = lootTable[0];
    for (const item of lootTable) {
      random -= item.weight;
      if (random <= 0) {
        selected = item;
        break;
      }
    }
    
    // 生成掉落位置（围绕空投箱）
    const angle = (i / cfg.LOOT_COUNT) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 1.5 + Math.random() * 1.5;
    const dropPos = ad.pos.clone().add(new THREE.Vector3(
      Math.cos(angle) * dist,
      0,
      Math.sin(angle) * dist
    ));
    
    // 根据类型创建不同外观的掉落物
    const loot = createAirdropLoot(selected.type, selected.value, dropPos);
    pickups.push(loot);
  }
  
  showFloatingText(ad.pos.clone().add(new THREE.Vector3(0, 3, 0)), '补给已获取!', 0x44FF44);
  console.log('[Airdrop] Crate opened! Dropped', cfg.LOOT_COUNT, 'items');
  
  // 立即引来僵尸围攻（延迟很短）
  setTimeout(() => {
    spawnAirdropHorde(ad.pos);
  }, cfg.HORDE_DELAY * 1000);
}

// 创建空投掉落物
function createAirdropLoot(type, value, pos) {
  const cfg = CONFIG.LOOT.AIRDROP.ITEMS[type] || CONFIG.LOOT.AIRDROP.ITEMS.health;
  
  // 创建mesh
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(cfg.size, cfg.size, cfg.size),
    new THREE.MeshBasicMaterial({ 
      color: cfg.color, 
      transparent: true, 
      opacity: 0.9 
    })
  );
  mesh.position.set(pos.x, 0.5, pos.z);
  
  // 添加发光效果
  const glow = new THREE.PointLight(cfg.color, 1, 3);
  glow.position.y = 0.3;
  mesh.add(glow);
  
  scene.add(mesh);
  
  return {
    mesh,
    type,
    value,
    name: cfg.name,
    life: CONFIG.LOOT.AIRDROP.LIFETIME,
    isAirdropLoot: true // 标记为空投特殊掉落
  };
}

// 生成僵尸围攻 - 僵尸围绕物资快速进攻
function spawnAirdropHorde(targetPos) {
  const cfg = CONFIG.AIRDROP;
  const count = Math.min(cfg.HORDE_COUNT, CONFIG.MAX_ENEMIES - enemies.length);
  if (count <= 0) return;
  
  const currentMap = window.currentMap || 'city';
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = cfg.HORDE_RADIUS * (0.5 + Math.random() * 0.5);
    const spawnPos = new THREE.Vector3(
      targetPos.x + Math.cos(angle) * dist,
      0,
      targetPos.z + Math.sin(angle) * dist
    );
    spawnPos.x = Math.max(-CONFIG.MAP_SIZE + 5, Math.min(CONFIG.MAP_SIZE - 5, spawnPos.x));
    spawnPos.z = Math.max(-CONFIG.MAP_SIZE + 5, Math.min(CONFIG.MAP_SIZE - 5, spawnPos.z));
    
    if (currentMap === 'desert') {
      // 沙漠地图：刷沙漠怪物
      if (window.DesertMap && DesertMap.active && typeof MonsterBones !== 'undefined') {
        const types = ['scorpion', 'sandworm', 'vulture'];
        const mType = types[Math.floor(Math.random() * types.length)];
        let model;
        if (mType === 'scorpion') model = MonsterBones.createScorpion();
        else if (mType === 'sandworm') model = MonsterBones.createSandworm();
        else model = MonsterBones.createVulture();
        
        let hp, speed, damage, attackRange, attackRate;
        if (mType === 'scorpion') { hp=800; speed=6; damage=150; attackRange=2.5; attackRate=1.5; }
        else if (mType === 'sandworm') { hp=600; speed=8; damage=200; attackRange=3; attackRate=2; }
        else { hp=500; speed=7; damage=120; attackRange=2; attackRate=1.2; }
        
        const monster = {
          mesh: model.group, bones: model.bones, type: mType,
          hp, maxHp: hp, speed, damage, attackRange, attackRate,
          spawnPos: spawnPos.clone(), state: 'chase',
          attackTimer: 0, animTimer: 0, targetPos: spawnPos.clone(),
          detectionRange: 30, chaseLimit: 60,
          flyHeight: mType === 'vulture' ? 6 + Math.random() * 4 : 0,
          burrowTimer: 0, diveTimer: 0, originalY: 0,
          dead: false, attackAnimTimer: 0, isAttacking: false,
          hitFlashTimer: 0, deathTimer: 0, wingSlapTimer: 0,
          originalMaterials: null, isAirdropMonster: true
        };
        if (mType === 'vulture') {
          monster.mesh.position.set(spawnPos.x, monster.flyHeight, spawnPos.z);
          monster.originalY = monster.flyHeight;
        }
        DesertMap.desertMonsters.push(monster);
        DesertMap.scene.add(monster.mesh);
      } else {
        // 回退：使用config中的沙漠僵尸
        const desertZombies = (window.ZOMBIE_DEFS || []).filter(z => z.desert);
        if (desertZombies.length > 0) {
          const def = desertZombies[Math.floor(Math.random() * desertZombies.length)];
          const enemy = spawnEnemy(def, spawnPos);
          if (enemy) { enemy.isHordeZombie = true; enemy.hordeTarget = targetPos.clone(); enemy.speed *= 1.3; }
        }
      }
    } else if (currentMap === 'snow') {
      // 雪地地图：刷雪地僵尸
      const snowZombies = (window.ZOMBIE_DEFS || []).filter(z => z.snow);
      if (snowZombies.length > 0) {
        const def = snowZombies[Math.floor(Math.random() * snowZombies.length)];
        const enemy = spawnEnemy(def, spawnPos);
        if (enemy) { enemy.isHordeZombie = true; enemy.hordeTarget = targetPos.clone(); enemy.speed *= 1.3; }
      } else {
        const enemy = spawnEnemy(null, spawnPos);
        if (enemy) { enemy.isHordeZombie = true; enemy.hordeTarget = targetPos.clone(); enemy.speed *= 1.3; }
      }
    } else {
      // 城市地图：刷绿色僵尸等（保持原逻辑）
      const enemy = spawnEnemy(null, spawnPos);
      if (enemy) { enemy.isHordeZombie = true; enemy.hordeTarget = targetPos.clone(); enemy.speed *= 1.3; enemy.aiState = 'surround'; }
    }
  }
  
  const mapNames = { city: '僵尸', snow: '雪地怪物', desert: '沙漠怪物' };
  showFloatingText(targetPos.clone().add(new THREE.Vector3(0, 4, 0)), 
    '⚠️ ' + (mapNames[currentMap] || '敌人') + '群来袭! 保护物资!', 0xFF4444);
}

// 清理空投
function cleanupAirdrop() {
  const ad = airdropSystem.active;
  if (!ad) return;
  
  // 正确dispose mesh资源
  [ad.mesh, ad.crateMesh].forEach(m => {
    if (m) {
      m.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.remove(m);
    }
  });
  
  airdropSystem.active = null;
  airdropSystem.showPrompt = false;
  console.log('[Airdrop] Cleaned up');
}

// ============================================================
// 掉落物系统
// ============================================================
function spawnPickup(pos) {
  // 同时调用新CombatSystem（双轨并行）
  if (window.CombatSystem && CombatSystem.initialized) {
    try {
      CombatSystem.spawnPickup(pos);
    } catch (e) {
      console.warn('[game.js] CombatSystem spawnPickup failed:', e);
    }
  }

  const cfg = CONFIG.LOOT.ZOMBIE_DROP;

  // 按权重随机选择掉落类型
  const totalWeight = cfg.TYPES.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;
  let selected = cfg.TYPES[0];
  for (const type of cfg.TYPES) {
    random -= type.weight;
    if (random <= 0) {
      selected = type;
      break;
    }
  }

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(selected.size, selected.size, selected.size),
    new THREE.MeshBasicMaterial({ color: selected.color, transparent: true, opacity: 0.8 })
  );
  mesh.position.copy(pos);
  mesh.position.y = 0.5;
  scene.add(mesh);

  pickups.push({ 
    mesh, 
    type: selected.type, 
    life: cfg.LIFETIME,
    config: selected // 保存配置供拾取时使用
  });
  console.log('[掉落] 掉落物已创建，类型:', selected.type, '当前总数:', pickups.length);
}

function checkPickups(dt) {
  // 同时更新新CombatSystem的补给品系统（双轨并行）
  if (window.CombatSystem && CombatSystem.initialized) {
    try {
      CombatSystem.checkPickups(dt);
    } catch (e) {
      console.warn('[game.js] CombatSystem checkPickups failed:', e);
    }
  }

  // 收集所有机器狗正在前往的掉落物（从工事系统获取）
  const dogTargets = new Set();
  if (window.deployedFortifications) {
    for (const fort of window.deployedFortifications) {
      if (fort && fort.dogTarget && fort.dogTarget.mesh) {
        dogTargets.add(fort.dogTarget);
      }
    }
  }

  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];

    // 如果掉落物被机器狗锁定，跳过玩家拾取，但仍递减生命（防止永久卡住）
    const isDogTarget = dogTargets.has(p);

    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      pickups.splice(i, 1);
      // 如果机器狗正在前往此掉落物，清除其目标
      if (isDogTarget && window.deployedFortifications) {
        for (const fort of window.deployedFortifications) {
          if (fort && fort.dogTarget === p) {
            fort.dogTarget = null;
            fort.dogState = 'idle';
          }
        }
      }
      continue;
    }

    // 被机器狗锁定的掉落物，玩家不能拾取
    if (isDogTarget) continue;

    // 旋转动画
    p.mesh.rotation.y += 0.02;
    p.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.2;

    const dist = camera.position.distanceTo(p.mesh.position);
    const pickupDist = CONFIG.LOOT.ZOMBIE_DROP.PICKUP_DIST + (player.stats ? player.stats.pickupRange : 0);
    if (dist < pickupDist) {
      // 处理空投特殊掉落物
      if (p.isAirdropLoot) {
        handleAirdropLoot(p);
      } else {
        // 普通掉落物（使用配置）
        const cfg = p.config;
        switch (p.type) {
          case 'ammo':
            weapons.forEach(w => { w.reserve += Math.floor(w.magSize * player.ammoMult); });
            addPickupFeed('弹药补给', '#ffaa00');
            break;
          case 'health':
            player.hp = Math.min(player.hp + cfg.value, player.maxHp);
            addPickupFeed(`${cfg.value} 生命`, '#44ff44');
            break;
          case 'building':
            const buildingAmount = cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1));
            if (typeof ShelterSystem !== 'undefined' && ShelterSystem.addBattleResources) {
              ShelterSystem.addBattleResources({ building: buildingAmount });
            }
            addPickupFeed(`${buildingAmount} 建材`, '#8B6914');
            break;
          case 'parts':
            const partsAmount = cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1));
            if (window.FortificationSystem) {
              FortificationSystem.addParts(partsAmount);
            }
            addPickupFeed(`${partsAmount} 零件`, '#6699CC');
            break;
        }
      }
      scene.remove(p.mesh);
      pickups.splice(i, 1);
      updateHUD();
    }
  }
}

// 处理空投特殊掉落物
function handleAirdropLoot(loot) {
  const value = loot.value;
  
  switch(loot.type) {
    case 'health':
      player.hp = Math.min(player.hp + value, player.maxHp);
      addPickupFeed(`${value} 生命 (空投)`, '#44ff44');
      break;
      
    case 'ammo':
      weapons.forEach(w => { w.reserve += Math.floor(value * player.ammoMult); });
      addPickupFeed(`${value} 弹药 (空投)`, '#ffaa00');
      break;
      
    case 'grenade':
      // 增加手雷武器的弹药
      const grenadeWeapon = weapons.find(w => w.isGrenade);
      if (grenadeWeapon) {
        grenadeWeapon.currentMag += value;
      }
      addPickupFeed(`${value} 手雷 (空投)`, '#ff4400');
      break;
      
    case 'speed_boost':
      activateBuff('speed', value, 1.5); // 1.5倍移速
      addPickupFeed('⚡ 移速提升!', '#00ffff');
      break;
      
    case 'damage_boost':
      activateBuff('damage', value, 2.0); // 2倍伤害
      addPickupFeed('💥 伤害翻倍!', '#ff00ff');
      break;
      
    case 'invincible':
      activateBuff('invincible', value, 1.0);
      addPickupFeed('🛡️ 无敌!', '#ffff00');
      break;
      
    case 'instakill':
      activateBuff('instakill', value, 1.0);
      addPickupFeed('☠️ 一击必杀!', '#ffffff');
      break;
      
    case 'building':
      if (typeof ShelterSystem !== 'undefined' && ShelterSystem.addBattleResources) {
        ShelterSystem.addBattleResources({ building: value });
      }
      addPickupFeed(`${value} 建材 (空投)`, '#8B6914');
      break;
      
    case 'parts':
      if (window.FortificationSystem) {
        FortificationSystem.addParts(value);
      }
      addPickupFeed(`${value} 零件 (空投)`, '#6699CC');
      break;
  }
}

// 激活BUFF
function activateBuff(type, duration, multiplier) {
  // 同时调用新PlayerSystem（双轨并行）
  if (window.PlayerSystem && PlayerSystem.initialized) {
    try {
      PlayerSystem.activateBuff(type, duration, multiplier);
    } catch (e) {
      console.warn('[game.js] PlayerSystem activateBuff failed:', e);
    }
  }

  if (!player.activeBuffs) player.activeBuffs = {};

  player.activeBuffs[type] = {
    timer: duration,
    multiplier: multiplier
  };
  
  // 应用效果
  switch(type) {
    case 'speed':
      player.speed = CONFIG.PLAYER_SPEED * multiplier;
      break;
    case 'damage':
      player.dmgMult *= multiplier;
      break;
    case 'invincible':
      // 无敌在 damagePlayer 中检查
      break;
    case 'instakill':
      // 一击必杀在 damageEnemy 中检查
      break;
  }
  
  console.log(`[Buff] ${type} activated for ${duration}s`);
}

// 更新BUFF（在updatePlayer中调用）
function updateBuffs(dt) {
  // 同时更新新PlayerSystem的BUFF（双轨并行）
  if (window.PlayerSystem && PlayerSystem.initialized) {
    try {
      PlayerSystem.updateBuffs(dt);
    } catch (e) {
      console.warn('[game.js] PlayerSystem updateBuffs failed:', e);
    }
  }

  if (!player.activeBuffs) return;

  for (const [type, buff] of Object.entries(player.activeBuffs)) {
    buff.timer -= dt;

    if (buff.timer <= 0) {
      // BUFF过期，恢复
      switch(type) {
        case 'speed':
          player.speed = CONFIG.PLAYER_SPEED * (1 + player.stats.speed * 0.05);
          break;
        case 'damage':
          player.dmgMult /= buff.multiplier;
          break;
      }
      delete player.activeBuffs[type];
      console.log(`[Buff] ${type} expired`);
    }
  }
}

// ============================================================
// 波次系统 - 修复版
// ============================================================
let waveSpawnTimer = 0;      // 波次生成计时器
let waveSpawned = 0;         // 当前波次已生成数
let waveEnemyCount = 0;      // 当前波次总敌人数
// 零件数据已统一由 ShelterSystem 管理，工事系统直接读写避难所数据

function startWave(num) {
  wave = num;
  waveActive = true;
  waveEnemyCount = 5 + wave * 4;
  enemiesRemaining = waveEnemyCount;
  waveSpawned = 0;
  waveSpawnTimer = 0;

  // 同时调用新CombatSystem（双轨并行）
  if (window.CombatSystem && CombatSystem.initialized) {
    try {
      CombatSystem.startWave(num);
    } catch (e) {
      console.warn('[game.js] CombatSystem startWave failed:', e);
    }
  }

  // 切换天气
  if (window.WeatherSystem) {
    if(window.WeatherSystem)WeatherSystem.changeWeatherForWave(wave);
  }

  // 20波后激活传送门
  if (wave >= 20 && !portalsActivated) {
    activateCityPortals();
  }

  // 公告
  const announce = document.getElementById('wave-announce');
  announce.textContent = `第 ${wave} 波`;
  announce.style.opacity = '1';
  setTimeout(() => { announce.style.opacity = '0'; }, 2000);

  updateHUD();
}

function updateWaveSystem(dt) {
  if (!waveActive) {
    waveTimer += dt;
    if (waveTimer > 3) {
      waveTimer = 0;
      startWave(wave + 1);
    }
    return;
  }

  // 同时更新新CombatSystem的波次系统（双轨并行）
  if (window.CombatSystem && CombatSystem.initialized) {
    try {
      CombatSystem.updateWaveSystem(dt);
    } catch (e) {
      console.warn('[game.js] CombatSystem updateWaveSystem failed:', e);
    }
  }

  // 分批生成敌人（使用帧计时器代替setInterval，更可靠）
  if (waveSpawned < waveEnemyCount) {
    waveSpawnTimer += dt;
    if (waveSpawnTimer >= 0.5) { // 每0.5秒生成一个
      waveSpawnTimer = 0;
      
      // 限制同时存活敌人数量
      if (enemies.length < CONFIG.MAX_ENEMIES) {
        // 根据波次解锁敌人类型
        let maxTypeIndex = 3 + Math.floor(wave / 2);
        // 新敌人解锁：暴君(8)需5波后，舔食者(9)需8波后，飞龙(10)需10波后
        if (wave > 5) maxTypeIndex = Math.max(maxTypeIndex, 9); // 暴君5波后解锁
        if (wave > 8) maxTypeIndex = Math.max(maxTypeIndex, 10); // 舔食者8波后解锁
        if (wave > 10) maxTypeIndex = Math.max(maxTypeIndex, 11); // 飞龙10波后解锁
        const availableTypes = ZOMBIE_DEFS.slice(0, Math.min(maxTypeIndex, ZOMBIE_DEFS.length));
        // Boss波
        if (wave % 5 === 0 && waveSpawned === waveEnemyCount - 1) {
          spawnEnemy(ZOMBIE_DEFS[5]); // 精英
        } else {
          const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
          spawnEnemy(type);
        }
        // 特殊敌人出现逻辑 - 从远处生成
        // 暴君：5波后出现，每5波一次
        if (wave > 5 && wave % 5 === 0 && waveSpawned === waveEnemyCount - 2) {
          const bossPos = getRandomSpawnPos();
          spawnEnemy(ZOMBIE_DEFS[8], bossPos); // 暴君
        }
        // 舔食者：8波后出现，25%概率
        if (wave > 8 && Math.random() < 0.25) {
          const lickerPos = getRandomSpawnPos();
          spawnEnemy(ZOMBIE_DEFS[9], lickerPos); // 舔食者
        }
        // 飞龙：10波后出现，35%概率，30m外刷新
        if (wave > 10 && Math.random() < 0.35) {
          const wyvernPos = getWyvernSpawnPos(); // 30m外生成
          const wyvern = spawnEnemy(ZOMBIE_DEFS[10], wyvernPos); // 飞龙
          // 飞龙初始高度设为飞行高度
          if (wyvern && wyvern.mesh) {
            wyvern.mesh.position.y = wyvern.mesh.userData.flyHeight || 8;
          }
        }
        waveSpawned++;
      }
    }
  }

  // 检查波次是否完成（所有敌人被消灭且全部生成完毕）
  if (waveSpawned >= waveEnemyCount && enemies.length === 0) {
    waveActive = false;
    waveTimer = 0;

    // 获取避难所设施效果
    let trainingBonus = 1; // 训练场经验加成
    let medicalHeal = 0;   // 医疗站治疗量
    let doctorHeal = 0;    // 医生治疗量
    if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getData) {
      try {
        const shelterData = ShelterSystem.getData();
        const defs = ShelterSystem.getDefs().survivors;
        const training = shelterData.facilities.find(f => f.type === 'training');
        const medical = shelterData.facilities.find(f => f.type === 'medical');
        if (training) trainingBonus += training.level * 0.10; // 每级+10%经验
        if (medical) medicalHeal = medical.level * 20; // 每级+20回血
        // 医生加成
        shelterData.survivors.forEach(sur => {
          const def = defs[sur.type];
          if (def && def.battlefieldEffect && def.battlefieldEffect.waveHealBonus) {
            const skillMult = 1 + (sur.skill - 1) * 0.10;
            doctorHeal += def.battlefieldEffect.waveHealBonus * skillMult;
          }
        });
      } catch(e) {}
    }

    // 波次奖励（含经验加成和训练场加成）
    const waveBonus = wave * 20 * (1 + player.stats.expGain * 0.10) * trainingBonus;
    player.xp += waveBonus;
    xp = player.xp;
    checkLevelUp();

    // 回复生命（基础20 + 医疗站 + 医生）
    const totalHeal = 20 + medicalHeal + doctorHeal;
    player.hp = Math.min(player.hp + totalHeal, player.maxHp);
    if (totalHeal > 20) {
      showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 2, 0)), `+${totalHeal}HP (医疗站)`, 0x44ff44);
    }
    
    // 波次完成：增加战场充能点
    const waveChargeAmount = Math.ceil(wave * 2); // 每波次给 wave*2 充能点
    accumulateBattlefieldCharge(waveChargeAmount);
    showFloatingText(camera.position.clone().add(new THREE.Vector3(0, 3, 0)), `⚡ +${waveChargeAmount} 充能点`, 0xf1c40f);
    
    updateHUD();

    // 零件数据已统一由 ShelterSystem 管理，无需额外同步
    // 工事系统直接读写避难所数据，保证唯一数据源

    return;
  }
}

// ============================================================
// 升级系统 - 委托给 UpgradeSystem
// ============================================================

function showUpgradePanel() {
  if (window.UpgradeSystem && UpgradeSystem.initialized) {
    UpgradeSystem.setPoints(upgradePoints);
    UpgradeSystem.showPanel();
    gameState = 'upgrading';
    document.exitPointerLock();
    document.body.style.cursor = 'default';
    return;
  }
  console.warn('[game.js] UpgradeSystem not available');
}

function closeUpgradePanel() {
  if (window.UpgradeSystem && UpgradeSystem.initialized) {
    UpgradeSystem.closePanel();
  }
  gameState = 'playing';
  setTimeout(() => {
    if (gameState === 'playing' && renderer && renderer.domElement) {
      renderer.domElement.requestPointerLock();
    }
  }, 100);
}

function selectUpgrade(upg, index) {
  if (window.UpgradeSystem && UpgradeSystem.initialized) {
    UpgradeSystem.selectUpgrade(upg, index);
    return;
  }
  console.warn('[game.js] UpgradeSystem not available for selectUpgrade');
}

function showUpgradeNotification(upg) {
  if (window.UpgradeSystem && UpgradeSystem.initialized) {
    UpgradeSystem._showNotification(upg);
    return;
  }
}

// ============================================================
// UI更新
// ============================================================
function updateHUD() {
  // 人物属性面板
  const hpBar = document.getElementById('hp-bar');
  const hpText = document.getElementById('hp-text');
  const xpBar = document.getElementById('xp-bar');
  const xpText = document.getElementById('xp-text');
  const levelText = document.getElementById('level-text');
  const shieldBar = document.getElementById('shield-bar');
  const shieldText = document.getElementById('shield-text');
  const statHint = document.getElementById('stat-hint');
  
  if (hpBar) hpBar.style.width = `${Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100))}%`;
  if (hpText) hpText.textContent = `${Math.ceil(player.hp)} / ${Math.ceil(player.maxHp)}`;
  if (xpBar) xpBar.style.width = `${Math.max(0, Math.min(100, (player.xp / player.xpToNextLevel) * 100))}%`;
  if (xpText) xpText.textContent = `${player.xp} / ${player.xpToNextLevel}`;
  if (levelText) levelText.textContent = `等级 ${player.level}`;
  
  // 护盾
  const currentShield = (typeof player.shield === 'number' && !isNaN(player.shield)) ? player.shield : 0;
  const maxShield = (typeof player.maxShield === 'number' && !isNaN(player.maxShield)) ? player.maxShield : 50;
  if (shieldBar) {
    const shieldPct = maxShield > 0 ? (currentShield / maxShield) * 100 : 0;
    shieldBar.style.width = `${Math.max(0, Math.min(100, shieldPct))}%`;
  }
  if (shieldText) shieldText.textContent = currentShield > 0 ? `${Math.ceil(currentShield)}` : '';
  
  // 属性点/精通点提示
  if (statHint) {
    const hasPoints = player.statPoints > 0 || (player.masteryPoints > 0 && areAllStatsMaxed());
    if (player.statPoints > 0) {
      statHint.textContent = `+${player.statPoints}`;
      statHint.style.color = '#44ff44';
    } else if (player.masteryPoints > 0 && areAllStatsMaxed()) {
      statHint.textContent = `★${player.masteryPoints}`;
      statHint.style.color = '#ffaa00';
    } else {
      statHint.textContent = '';
    }
    statHint.style.display = hasPoints ? 'block' : 'none';
  }

  const w = weapons[currentWeaponIndex];
  if (w) {
    const weaponNameEl = document.getElementById('weapon-name');
    if (weaponNameEl) {
      weaponNameEl.textContent = weaponHolstered ? `[未装备] ${w.name}` : w.name;
      weaponNameEl.style.color = weaponHolstered ? '#888888' : '';
    }
    const ammoCountEl = document.getElementById('ammo-count');
    if (ammoCountEl) {
      ammoCountEl.textContent = weaponHolstered ? '-- / --' : `${w.currentMag} / ${w.reserve}`;
      ammoCountEl.style.color = weaponHolstered ? '#888888' : '';
    }
  }

  // 检查是否在弹药补给站附近
  let nearAmmoStation = false;
  buildings.forEach(b => {
    if (b.userData && b.userData.type === 'ammo_station') {
      const dist = camera.position.distanceTo(b.position);
      if (dist < 4) nearAmmoStation = true;
    }
  });
  const ammoHintEl = document.getElementById('ammo-station-hint');
  if (ammoHintEl) ammoHintEl.textContent = nearAmmoStation ? '[E] 补充弹药' : '';

  // 空投提示
  const airdropHint = document.getElementById('airdrop-hint');
  if (airdropHint) {
    if (airdropSystem.showPrompt) {
      airdropHint.textContent = '[E] 开启空投';
      airdropHint.style.display = 'block';
    } else {
      airdropHint.style.display = 'none';
    }
  }

  const killCountEl = document.getElementById('kill-count');
  if (killCountEl) killCountEl.textContent = `击杀: ${kills}`;
  const mins = Math.floor(surviveTime / 60);
  const secs = Math.floor(surviveTime % 60);
  const surviveTimeEl = document.getElementById('survive-time');
  if (surviveTimeEl) surviveTimeEl.textContent = `存活: ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // 波次信息：雪山防御阶段使用SnowMap的波次
  let displayWave = wave;
  let aliveEnemies = enemies.filter(e => !e.dead).length;
  
  if (window.SnowMap && SnowMap.active && SnowMap.defenseWaveActive) {
    // 雪山防御阶段
    displayWave = SnowMap.defenseWave;
    // 剩余敌人 = 波次僵尸 + 游荡僵尸
    const waveEnemies = SnowMap.defenseEnemies ? SnowMap.defenseEnemies.filter(e => e.state !== 'dead').length : 0;
    const wanderEnemies = SnowMap.wanderZombies ? SnowMap.wanderZombies.filter(z => z.state !== 'dead').length : 0;
    aliveEnemies = waveEnemies + wanderEnemies;
  }
  // 沙漠防御阶段使用DesertMap的波次
  if (window.DesertMap && DesertMap.active && DesertMap.defenseWaveActive) {
    displayWave = DesertMap.defenseWave;
    const waveEnemies = DesertMap.defenseEnemies ? DesertMap.defenseEnemies.filter(e => e.state !== 'dead').length : 0;
    const wanderEnemies = DesertMap.wanderZombies ? DesertMap.wanderZombies.filter(z => z.state !== 'dead').length : 0;
    aliveEnemies = waveEnemies + wanderEnemies;
  }
  
  const waveNumEl = document.getElementById('wave-num');
  if (waveNumEl) waveNumEl.textContent = `第 ${displayWave} 波`;
  const enemyCountEl = document.getElementById('enemy-count');
  if (enemyCountEl) {
    enemyCountEl.textContent = `剩余敌人: ${aliveEnemies}`;
  }
  
  // HUDSystem 由 module-adapter 单独管理小地图和击杀提示
  // 不再调用 HUDSystem.update()，避免用错误数据覆盖旧 updateHUD 的正确值
}

function updateAllyHUD() {
  const container = document.getElementById('ally-info');
  if (allies.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = '';
  allies.forEach(a => {
    const div = document.createElement('div');
    div.className = 'ally-card';
    const displayName = a.name || a.classDef?.name || '未知';
    const level = a.level || 1;
    const hpPct = a.maxHp > 0 ? Math.max(0, Math.min(100, (a.hp / a.maxHp) * 100)) : 0;
    
    div.innerHTML = `
      <div class="ally-header">
        <span class="ally-name">${displayName} <span style="color:#ffd700;font-size:10px;">Lv.${level}</span></span>
        <span class="ally-hp-text">${Math.floor(a.hp)}/${Math.floor(a.maxHp)}</span>
      </div>
      <div class="ally-hp-bar">
        <div class="ally-hp-fill" style="width:${hpPct}%"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

function addKillFeed(killerName, victimName) {
  if (window.HUDSystem && HUDSystem.initialized) {
    try {
      HUDSystem.addKillFeed(killerName, victimName, killerName === '你');
      return;
    } catch (e) {}
  }
  const feed = document.getElementById('kill-feed');
  const msg = document.createElement('div');
  msg.className = 'kill-msg';
  msg.textContent = `${killerName} 击杀了 ${victimName}`;
  feed.appendChild(msg);
  setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 2500);
}

function addPickupFeed(text, color) {
  if (window.HUDSystem && HUDSystem.initialized) {
    try {
      HUDSystem.showMessage(`拾取了 ${text}`, 'info', 2500);
      return;
    } catch (e) {}
  }
  const feed = document.getElementById('kill-feed');
  const msg = document.createElement('div');
  msg.className = 'kill-msg';
  msg.textContent = `拾取了 ${text}`;
  if (color) msg.style.color = color;
  feed.appendChild(msg);
  setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 2500);
}

function updateMinimap() {
  const ctx = minimapCtx;
  if (!ctx) return;
  const size = 150;
  const scale = size / 80;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // 建筑
  ctx.fillStyle = 'rgba(100,100,100,0.5)';
  buildings.forEach(b => {
    if (!b.userData || b.userData.type !== 'building') return;
    const rx = (b.position.x - camera.position.x) * scale + cx;
    const ry = (b.position.z - camera.position.z) * scale + cy;
    if (rx < -10 || rx > size + 10 || ry < -10 || ry > size + 10) return;
    const w = b.userData.width * scale;
    const d = b.userData.depth * scale;
    ctx.fillRect(rx - w / 2, ry - d / 2, w, d);
  });

  // 敌人
  enemies.forEach(e => {
    if (e.dead || !e.mesh) return;
    const rx = (e.mesh.position.x - camera.position.x) * scale + cx;
    const ry = (e.mesh.position.z - camera.position.z) * scale + cy;
    const isOffscreen = rx < 0 || rx > size || ry < 0 || ry > size;
    
    if (!isOffscreen) {
      // 在屏幕内正常显示
      ctx.fillStyle = (e.def && e.def.stealth && !e.mesh.visible) ? 'rgba(100,100,100,0.3)' : '#ff4444';
      ctx.beginPath();
      ctx.arc(rx, ry, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 在屏幕外显示边缘指示器
      const angle = Math.atan2(ry - cy, rx - cx);
      const edgeDist = 8;
      const edgeX = cx + Math.cos(angle) * (size / 2 - edgeDist);
      const edgeY = cy + Math.sin(angle) * (size / 2 - edgeDist);
      
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(edgeX + Math.cos(angle) * 6, edgeY + Math.sin(angle) * 6);
      ctx.lineTo(edgeX + Math.cos(angle + 2.5) * 4, edgeY + Math.sin(angle + 2.5) * 4);
      ctx.lineTo(edgeX + Math.cos(angle - 2.5) * 4, edgeY + Math.sin(angle - 2.5) * 4);
      ctx.closePath();
      ctx.fill();
    }
  });

  // 雪地地图特殊标记
  if (window.SnowMap && SnowMap.active) {
    // 信号塔标记（始终显示，屏幕外显示边缘箭头）
    if (SnowMap.towerMesh) {
      const rx = (SnowMap.towerMesh.position.x - camera.position.x) * scale + cx;
      const ry = (SnowMap.towerMesh.position.z - camera.position.z) * scale + cy;
      const isOffscreen = rx < 0 || rx > size || ry < 0 || ry > size;
      
      if (!isOffscreen) {
        // 在屏幕内：绿色三角形
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(rx, ry - 6);
        ctx.lineTo(rx - 4, ry + 3);
        ctx.lineTo(rx + 4, ry + 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px sans-serif';
        ctx.fillText('塔', rx - 4, ry - 8);
      } else {
        // 在屏幕外：绿色箭头指向
        const angle = Math.atan2(ry - cy, rx - cx);
        const edgeDist = 10;
        const edgeX = cx + Math.cos(angle) * (size / 2 - edgeDist);
        const edgeY = cy + Math.sin(angle) * (size / 2 - edgeDist);
        
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(edgeX + Math.cos(angle) * 7, edgeY + Math.sin(angle) * 7);
        ctx.lineTo(edgeX + Math.cos(angle + 2.5) * 4, edgeY + Math.sin(angle + 2.5) * 4);
        ctx.lineTo(edgeX + Math.cos(angle - 2.5) * 4, edgeY + Math.sin(angle - 2.5) * 4);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 发电机标记（只在探索阶段和电源阶段显示，防御阶段不显示）
    if (SnowMap.powerNodes && SnowMap.phase !== 'defend' && SnowMap.phase !== 'complete') {
      SnowMap.powerNodes.forEach((node, i) => {
        if (node.activated) return; // 已激活的不显示
        const rx = (node.x - camera.position.x) * scale + cx;
        const ry = (node.z - camera.position.z) * scale + cy;
        if (rx >= 0 && rx <= size && ry >= 0 && ry <= size) {
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(rx, ry, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = '7px sans-serif';
          ctx.fillText('电' + (i + 1), rx - 6, ry - 6);
        }
      });
    }

    // 雪地僵尸（只在波次进行中显示波次僵尸红点，波次未开始时不显示游荡僵尸）
    if (SnowMap.defenseWaveActive && SnowMap.defenseEnemies) {
      SnowMap.defenseEnemies.forEach(z => {
        if (z.state === 'dead' || !z.mesh) return;
        const rx = (z.mesh.position.x - camera.position.x) * scale + cx;
        const ry = (z.mesh.position.z - camera.position.z) * scale + cy;
        const isOffscreen = rx < 0 || rx > size || ry < 0 || ry > size;
        
        if (!isOffscreen) {
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(rx, ry, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const angle = Math.atan2(ry - cy, rx - cx);
          const edgeX = cx + Math.cos(angle) * (size / 2 - 8);
          const edgeY = cy + Math.sin(angle) * (size / 2 - 8);
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.moveTo(edgeX + Math.cos(angle) * 6, edgeY + Math.sin(angle) * 6);
          ctx.lineTo(edgeX + Math.cos(angle + 2.5) * 4, edgeY + Math.sin(angle + 2.5) * 4);
          ctx.lineTo(edgeX + Math.cos(angle - 2.5) * 4, edgeY + Math.sin(angle - 2.5) * 4);
          ctx.closePath();
          ctx.fill();
        }
      });
    }
  }

  // 队友
  allies.forEach(a => {
    if (a.dead || !a.mesh) return;
    const rx = (a.mesh.position.x - camera.position.x) * scale + cx;
    const ry = (a.mesh.position.z - camera.position.z) * scale + cy;
    if (rx < 0 || rx > size || ry < 0 || ry > size) return;
    ctx.fillStyle = '#44aaff';
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // 掉落物
  pickups.forEach(p => {
    if (!p.mesh) return;
    const rx = (p.mesh.position.x - camera.position.x) * scale + cx;
    const ry = (p.mesh.position.z - camera.position.z) * scale + cy;
    if (rx < 0 || rx > size || ry < 0 || ry > size) return;
    ctx.fillStyle = p.type === 'health' ? '#44ff44' : '#ffaa00';
    ctx.fillRect(rx - 1.5, ry - 1.5, 3, 3);
  });

  // 弹药补给站
  buildings.forEach(b => {
    if (!b.userData || b.userData.type !== 'ammo_station') return;
    const rx = (b.position.x - camera.position.x) * scale + cx;
    const ry = (b.position.z - camera.position.z) * scale + cy;
    if (rx < 0 || rx > size || ry < 0 || ry > size) return;
    ctx.fillStyle = '#44ff44';
    ctx.beginPath();
    ctx.arc(rx, ry, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // 传送门（激活后显示）
  if (portalsActivated && cityPortals.length > 0) {
    cityPortals.forEach(portal => {
      if (!portal.userData.activated) return;
      const rx = (portal.position.x - camera.position.x) * scale + cx;
      const ry = (portal.position.z - camera.position.z) * scale + cy;
      const isOffscreen = rx < 0 || rx > size || ry < 0 || ry > size;
      
      if (!isOffscreen) {
        // 在小地图范围内：蓝色圆圈
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.arc(rx, ry, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#88ccff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 内部白色点
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 在小地图范围外：蓝色箭头指向
        const angle = Math.atan2(ry - cy, rx - cx);
        const edgeDist = 10;
        const edgeX = cx + Math.cos(angle) * (size / 2 - edgeDist);
        const edgeY = cy + Math.sin(angle) * (size / 2 - edgeDist);
        
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.moveTo(edgeX + Math.cos(angle) * 7, edgeY + Math.sin(angle) * 7);
        ctx.lineTo(edgeX + Math.cos(angle + 2.5) * 4, edgeY + Math.sin(angle + 2.5) * 4);
        ctx.lineTo(edgeX + Math.cos(angle - 2.5) * 4, edgeY + Math.sin(angle - 2.5) * 4);
        ctx.closePath();
        ctx.fill();
      }
    });
  }

  // 空投信号/空投箱
  if (airdropSystem.active && airdropSystem.active.pos) {
    const ad = airdropSystem.active;
    const rx = (ad.pos.x - camera.position.x) * scale + cx;
    const ry = (ad.pos.z - camera.position.z) * scale + cy;
    const isOffscreen = rx < 0 || rx > size || ry < 0 || ry > size;
    
    if (!isOffscreen) {
      // 在范围内显示
      const blink = Math.sin(Date.now() * 0.005) > 0;
      ctx.fillStyle = blink ? '#ff0000' : '#ff8800';
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      // 标注文字
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ad.state === 'signal' ? '信号' : '空投', rx, ry - 8);
    } else {
      // 屏幕外显示边缘指示器
      const angle = Math.atan2(ry - cy, rx - cx);
      const edgeX = cx + Math.cos(angle) * (size / 2 - 10);
      const edgeY = cy + Math.sin(angle) * (size / 2 - 10);
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.moveTo(edgeX + Math.cos(angle) * 6, edgeY + Math.sin(angle) * 6);
      ctx.lineTo(edgeX + Math.cos(angle + 2.5) * 4, edgeY + Math.sin(angle + 2.5) * 4);
      ctx.lineTo(edgeX + Math.cos(angle - 2.5) * 4, edgeY + Math.sin(angle - 2.5) * 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 玩家
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  // 方向指示
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - Math.sin(yaw) * 8, cy - Math.cos(yaw) * 8);
  ctx.stroke();
  
  // 同时更新新HUD系统的小地图（双轨并行）
  if (window.HUDSystem && HUDSystem.initialized) {
    try {
      HUDSystem.updateMinimap(enemies, allies, buildings, pickups);
    } catch (e) {
      console.warn('[game.js] HUDSystem minimap update failed:', e);
    }
  }
}

// ============================================================
// 游戏流程
// ============================================================
function startGame() {
  try {
  window._lastStartGameStep = 'check slot';
  // 确保已选择存档槽
  const currentSlot = window.ShelterSystem ? window.ShelterSystem.getCurrentSlot() : -1;
  if (currentSlot < 0) {
    // 如果未选择存档槽，提示用户
    alert('请先选择存档槽！');
    return;
  }
  window._lastStartGameStep = 'audio init';
  // 确保AudioContext已创建（用户点击时创建，避免suspended）
  if (window.AudioSystem) {
    AudioSystem.init();
    if (AudioSystem.audioCtx && AudioSystem.audioCtx.state === 'suspended') {
      AudioSystem.audioCtx.resume();
    }
  }
  window._lastStartGameStep = 'preload sounds';
  // 预加载外部音效文件
  AudioSystem.preloadSounds();
  // 播放背景音乐（延迟确保 AudioContext 已准备好）
  setTimeout(function() {
    if (window.AudioSystem) {
      AudioSystem.playBGM();
    }
  }, 500);
  window._lastStartGameStep = 'cleanup enemies';
  // 清除旧场景中的动态对象 - 彻底清理内存
  enemies.forEach(e => {
    if (e.mesh) {
      e.mesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.remove(e.mesh);
    }
  });
  allies.forEach(a => {
    if (a.mesh) {
      a.mesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.remove(a.mesh);
    }
  });
  pickups.forEach(p => {
    if (p.mesh) {
      p.mesh.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      scene.remove(p.mesh);
    }
  });
  
  // 清理粒子池
  particlePool.forEach(mesh => {
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  });
  particlePool = [];
  particleMeshes = [];
  
  // 清除残留粒子mesh（从场景中移除）
  particles.forEach(p => { if (p.mesh) scene.remove(p.mesh); });
  floatingTexts.forEach(ft => { if (ft.mesh) scene.remove(ft.mesh); });
  damageNumbers.forEach(dn => { if (dn.mesh) scene.remove(dn.mesh); });
  
  bullets.forEach(b => { if (b.mesh) scene.remove(b.mesh); });
  missiles.forEach(m => { if (m.mesh) scene.remove(m.mesh); });
  
  // 清除毒液喷射特效
  if (window.poisonSprays) {
    window.poisonSprays.forEach(spray => {
      if (spray.particles) {
        spray.particles.forEach(p => { if (p.mesh) scene.remove(p.mesh); });
      }
    });
    window.poisonSprays = [];
  }
  
  bullets = [];
  enemyBullets = [];
  missiles = [];
  particles = [];
  damageNumbers = [];
  floatingTexts = [];
  enemies = [];
  allies = [];
  window.allies = allies; // 重新同步引用，确保 config.js 升级系统能访问
  updateAllyHUD(); // 清空队友面板
  pickups = [];
  window.pickups = pickups; // 重新同步，确保 fortifications.js 能访问
  buildings = [];

  // 清理空投系统
  if (airdropSystem.active) {
    [airdropSystem.active.mesh, airdropSystem.active.crateMesh].forEach(m => {
      if (m) {
        m.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        scene.remove(m);
      }
    });
  }
  airdropSystem.timer = 0;
  airdropSystem.active = null;
  airdropSystem.showPrompt = false;

  // 清除场景（保留天气特效mesh）
  const weatherMeshes = [];
  if (window.WeatherEffects && WeatherEffects.rain && WeatherEffects.rain.mesh) {
    weatherMeshes.push(WeatherEffects.rain.mesh);
  }
  if (window.WeatherEffects && WeatherEffects.snow && WeatherEffects.snow.mesh) {
    weatherMeshes.push(WeatherEffects.snow.mesh);
  }
  if (window.WeatherEffects && WeatherEffects.splashes && WeatherEffects.splashes.mesh) {
    weatherMeshes.push(WeatherEffects.splashes.mesh);
  }
  if (window.WeatherEffects && WeatherEffects.ripples && WeatherEffects.ripples.mesh) {
    weatherMeshes.push(WeatherEffects.ripples.mesh);
  }
  if (window.WeatherEffects && WeatherEffects.sandstorm && WeatherEffects.sandstorm.mesh) {
    weatherMeshes.push(WeatherEffects.sandstorm.mesh);
  }
  
  // 清理场景：保留天气特效mesh和camera，移除其他所有对象
  // 使用倒序遍历避免索引问题
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const obj = scene.children[i];
    if (obj === camera || !weatherMeshes.includes(obj)) {
      if (obj !== camera) scene.remove(obj);
    }
  }
  
  // 确保天气mesh仍在场景中
  weatherMeshes.forEach(m => {
    if (!scene.children.includes(m)) {
      scene.add(m);
    }
  });

  // 安全检查：清理scene.children中parent为null的残留对象（防止raycaster崩溃）
  for (let i = scene.children.length - 1; i >= 0; i--) {
    if (!scene.children[i] || scene.children[i].parent !== scene) {
      scene.children.splice(i, 1);
    }
  }

  // 清理模块适配器
  if (window.ModuleAdapter) {
    ModuleAdapter.cleanup();
  }

  // 移除场景中已有的灯光（防止复活后灯光叠加导致地面过亮）
  const lightsToRemove = [];
  scene.traverse(obj => {
    if (obj.isLight) lightsToRemove.push(obj);
  });
  lightsToRemove.forEach(light => {
    if (light.parent) light.parent.remove(light);
  });

  // 重新添加灯光
  const ambient = new THREE.AmbientLight(0x334455, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffeedd, 0.8);
  dirLight.position.set(50, 80, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.camera.left = -80;
  dirLight.shadow.camera.right = 80;
  dirLight.shadow.camera.top = 80;
  dirLight.shadow.camera.bottom = -80;
  scene.add(dirLight);
  const hemiLight = new THREE.HemisphereLight(0x446688, 0x223322, 0.4);
  scene.add(hemiLight);
  window._lastStartGameStep = 'lights added';

  // 重新初始化昼夜系统（灯光已被清理，需要重建引用）
  initDayNightCycle();
  window._lastStartGameStep = 'daynight init';

  // 恢复场景雾效（防止沙漠地图的FogExp2残留导致城市/雪山雾效异常）
  scene.fog = new THREE.Fog(0x1a1a2e, 30, 120);
  window._lastStartGameStep = 'fog restored';

  // 重置状态
  kills = 0;
  surviveTime = 0;
  wave = 0;
  xp = 0;
  xpToLevel = 50;
  level = 1;
  upgradePoints = 0;
  yaw = 0;
  pitch = 0;
  waveActive = false;
  waveTimer = 0;
  onGround = true;
  jumpCount = 0;
  playerVelocity = new THREE.Vector3();
  footstepTimer = 0;
  spacePressed = false;
  window.shelterPauseState = false; // 重置避难所暂停状态，防止pointerLock被阻止
  window._lastStartGameStep = 'state reset';

  // 重置FPS武器动画状态（防止上轮残留状态导致异常）
  weaponHolstered = false;
  holsterAnim = { t: 0, dir: 0, active: false };
  grenadeAnim = { phase: 'idle', timer: 0 };
  scopeAnim = { t: 0, active: false };
  weaponRecoil = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, timer: 0 };
  muzzleFlashTimer = 0;
  isAiming = false;
  window._lastStartGameStep = 'fps state reset';

  createPlayer();
  window._lastStartGameStep = 'createPlayer done';
  createWeaponModel();
  window._lastStartGameStep = 'createWeaponModel done';
  createHandsModel();
  window._lastStartGameStep = 'createHandsModel done';

  // 恢复玩家技能等级
  try {
    const wmRaw = localStorage.getItem('worldMapData');
    if (wmRaw) {
      const wmData = JSON.parse(wmRaw);
      if (wmData.playerSkills && window.player) {
        player.skills = wmData.playerSkills;
      }
    }
  } catch(e) {}

  camera.position.set(0, 1.7, 0);
  camera.rotation.set(0, 0, 0);

  // 初始化工事系统
  if (window.FortificationSystem) {
    FortificationSystem.init();
    FortificationSystem.createUI();
  }

  // 初始化升级系统
  if (window.UpgradeSystem) {
    UpgradeSystem.init();
  }

  document.getElementById('start-screen').classList.add('hide');
  document.getElementById('death-screen').classList.remove('show');
  document.getElementById('upgrade-panel').classList.remove('show');
  document.body.style.cursor = 'none'; // 游戏中隐藏光标
  window._lastStartGameStep = 'ui updated';

  gameState = 'playing';
  window._lastStartGameStep = 'gameState playing';
  
  // 恢复地图：优先使用死亡前地图(_respawnMap)，其次使用存档槽，最后使用worldMapData
  let savedMap = 'city';
  
  // 优先级1：死亡复活（_respawnMap）
  if (window._respawnMap) {
    savedMap = window._respawnMap;
    window._respawnMap = null;
  } else {
    // 优先级2：从当前存档槽读取
    const currentSlot = window.ShelterSystem ? window.ShelterSystem.getCurrentSlot() : -1;
    if (currentSlot >= 0) {
      try {
        const slotRaw = localStorage.getItem('gameSave_v2_' + currentSlot);
        if (slotRaw) {
          const slotData = JSON.parse(slotRaw);
          if (slotData.currentMap === 'snow') {
            savedMap = 'snow';
          } else if (slotData.currentMap === 'desert') {
            savedMap = 'desert';
          } else if (slotData.currentMap === 'island') {
            savedMap = 'island';
          } else if (slotData.currentMap === 'swamp') {
            savedMap = 'swamp';
          }
        }
      } catch(e) {}
    }

    // 优先级3：从worldMapData读取（兼容旧存档）
    if (savedMap === 'city') {
      try {
        const wmRaw = localStorage.getItem('worldMapData');
        if (wmRaw) {
          const wmData = JSON.parse(wmRaw);
          if (wmData.currentMap === 'snow') {
            const snowNode = wmData.snow || wmData['snow'];
            if (snowNode && snowNode.unlocked) {
              savedMap = 'snow';
            }
          } else if (wmData.currentMap === 'island') {
            savedMap = 'island';
          } else if (wmData.currentMap === 'swamp') {
            savedMap = 'swamp';
          }
        }
      } catch(e) {
        console.warn('[startGame] 读取地图存档失败:', e);
      }
    }
  }
  
  if (savedMap === 'snow') {
    // 直接初始化雪山（不生成城市地图，避免重叠）
    window.currentMap = 'snow';
    // Clean up ALL maps first
    if (window.DesertMap) DesertMap.cleanup();
    if (window.IslandBase) IslandBase.cleanup();
    if (window.SnowMap) SnowMap.cleanup();
    if (window.SwampMap) SwampMap.cleanup();
    if (typeof clearCurrentMap === 'function') clearCurrentMap();
    if (window.SnowMap) {
      SnowMap.init(scene, camera);
      SnowMap.active = true;
      SnowMap.generateTerrain();
      
      // 安全检查：确保scene.children中没有parent为null的残留对象
      for (let i = scene.children.length - 1; i >= 0; i--) {
        if (!scene.children[i] || scene.children[i].parent !== scene) {
          scene.children.splice(i, 1);
        }
      }
      
      // 读取存档中的阶段
      let savedPhase = 'explore';
      let savedWave = 0;
      try {
        const wmRaw = localStorage.getItem('worldMapData');
        if (wmRaw) {
          const wmData = JSON.parse(wmRaw);
          if (wmData.snowPhase) savedPhase = wmData.snowPhase;
          if (wmData.snowWave !== undefined) savedWave = wmData.snowWave;
        }
      } catch(e) {}
      
      // 根据存档阶段恢复正确的状态
      if (savedPhase === 'defend') {
        // 恢复防御阶段
        SnowMap.phase = 'defend';
        SnowMap.defenseWave = savedWave;
        SnowMap.defenseWaveActive = false; // 等待手动触发下一波或自动触发
        SnowMap.towerHP = SnowMap.towerMaxHP;
        // 生成游荡僵尸
        SnowMap.spawnWanderZombies();
        console.log('[startGame] 恢复雪山防御阶段，波次:', savedWave);
      } else if (savedPhase === 'complete') {
        // 已完成，回到探索阶段但标记为完成
        SnowMap.phase = 'complete';
        SnowMap.spawnWanderZombies();
      } else {
        // 默认：探索阶段
        SnowMap.startExplore();
      }
    }
    // 设置暴雪天气
    try {
      if (window.WeatherSystem) WeatherSystem.changeWeather('snow');
    } catch(e) {}
    // 传送玩家到雪山出生点
    const spawnH = SnowMap ? SnowMap.getTerrainHeight(0, SNOW_MAP_CONFIG.MAP_SIZE - 30) : 2;
    camera.position.set(0, spawnH + 2, SNOW_MAP_CONFIG.MAP_SIZE - 30);
    if (typeof showToast === 'function') showToast('❄️ 已回到 霜寒禁区', 'info');
    switchMapHUD('snow');
    // 播放雪山地形的BGM
    if (window.AudioSystem) AudioSystem.playMapBGM('snow');
  } else if (savedMap === 'desert') {
    // 沙漠地图
    window.currentMap = 'desert';
    // Clean up ALL maps first
    if (window.SnowMap) SnowMap.cleanup();
    if (window.DesertMap) DesertMap.cleanup();
    if (window.IslandBase) IslandBase.cleanup();
    if (window.SwampMap) SwampMap.cleanup();
    if (typeof clearCurrentMap === 'function') clearCurrentMap();
    if (window.DesertMap) {
      DesertMap.init(scene, camera);
      DesertMap.generate();
    }
    // 安全检查：确保scene.children中没有parent为null的残留对象
    for (let i = scene.children.length - 1; i >= 0; i--) {
      if (!scene.children[i] || scene.children[i].parent !== scene) {
        scene.children.splice(i, 1);
      }
    }

    // 读取存档中的阶段和波次
    let savedPhase = 'explore';
    let savedWave = 0;
    try {
      const wmRaw = localStorage.getItem('worldMapData');
      if (wmRaw) {
        const wmData = JSON.parse(wmRaw);
        if (wmData.desertPhase) savedPhase = wmData.desertPhase;
        if (wmData.desertWave !== undefined) savedWave = wmData.desertWave;
      }
    } catch(e) {}

    // 根据存档阶段恢复正确的状态
    if (savedPhase === 'defend') {
      // 恢复防御阶段
      DesertMap.phase = 'defend';
      DesertMap.defenseWave = savedWave;
      DesertMap.defenseWaveActive = false; // 等待手动触发下一波或自动触发
      DesertMap.towerHP = DesertMap.towerMaxHP;
      // 重新生成游荡僵尸
      DesertMap.spawnWanderZombies();
      if (typeof showToast === 'function') showToast(`🏜️ 已回到 荒漠前哨 防御第 ${savedWave} 波`, 'info');
    } else if (savedPhase === 'complete') {
      DesertMap.phase = 'complete';
      DesertMap.spawnWanderZombies();
      if (typeof showToast === 'function') showToast('🏜️ 已回到 荒漠前哨（防御完成）', 'info');
    } else {
      // 默认：探索阶段
      DesertMap.phase = 'explore';
      DesertMap.spawnWanderZombies();
      if (typeof showToast === 'function') showToast('🏜️ 已回到 荒漠前哨', 'info');
    }

    // 沙漠天气：不覆盖DesertMap.generate()中设置的沙尘暴天气
    // 传送玩家到沙漠基地出生点
    const baseSize = window.DESERT_MAP_CONFIG ? DESERT_MAP_CONFIG.BASE_SIZE : 40;
    camera.position.set(0, 2, 0);
    switchMapHUD('desert');
  } else if (savedMap === 'island') {
    // 孤岛基地 - 使用MapManager统一切换
    if (window.MapManager && typeof MapManager.switchTo === 'function') {
      MapManager.switchTo('island');
    } else {
      // fallback: 直接初始化
      window.currentMap = 'island';
      if (window.SnowMap) SnowMap.cleanup();
      if (window.DesertMap) DesertMap.cleanup();
      if (window.SwampMap) SwampMap.cleanup();
      if (typeof clearCurrentMap === 'function') clearCurrentMap();
      if (window.IslandBase) {
        IslandBase.init();
        IslandBase.generate();
      }
    }
    // 设置晴朗天气
    try {
      if (window.WeatherSystem) WeatherSystem.changeWeather('clear');
    } catch(e) {}
    // 传送玩家到基地入口（眼睛高度1.7，地面在y=0）
    camera.position.set(0, 1.7, 0);
    if (typeof showToast === 'function') showToast('🏝️ 已回到 孤岛基地', 'info');
    switchMapHUD('island');
    // 播放海岛BGM
    if (window.AudioSystem) AudioSystem.playMapBGM('island');
  } else if (savedMap === 'swamp') {
    // 毒雾沼泽 - 使用MapManager统一切换
    if (window.MapManager && typeof MapManager.switchTo === 'function') {
      MapManager.switchTo('swamp');
    } else {
      // fallback: 直接初始化
      window.currentMap = 'swamp';
      if (window.SnowMap) SnowMap.cleanup();
      if (window.DesertMap) DesertMap.cleanup();
      if (window.IslandBase) IslandBase.cleanup();
      if (typeof clearCurrentMap === 'function') clearCurrentMap();
      if (window.SwampMap) {
        SwampMap.init(scene, camera, renderer);
        SwampMap.generate();
      }
    }

    // 读取存档中的阶段和波次
    let savedPhase = 'explore';
    let savedWave = 0;
    try {
      const wmRaw = localStorage.getItem('worldMapData');
      if (wmRaw) {
        const wmData = JSON.parse(wmRaw);
        if (wmData.swampPhase) savedPhase = wmData.swampPhase;
        if (wmData.swampWave !== undefined) savedWave = wmData.swampWave;
      }
    } catch(e) {}

    if (savedPhase === 'defend') {
      if (window.SwampMap) {
        SwampMap.phase = 'defend';
        SwampMap.defenseWave = savedWave;
        SwampMap.defenseWaveActive = false;
      }
      if (typeof showToast === 'function') showToast(`🌿 已回到 毒雾沼泽 防御第 ${savedWave} 波`, 'info');
    } else {
      if (window.SwampMap) {
        SwampMap.phase = 'explore';
        SwampMap.defenseStartTimer = 30;
      }
      if (typeof showToast === 'function') showToast('🌿 已回到 毒雾沼泽', 'info');
    }

    camera.position.set(0, 2, 0);
    switchMapHUD('swamp');
    // 播放沼泽BGM
    if (window.AudioSystem) AudioSystem.playMapBGM('swamp');
  } else {
    // 城市地图：正常生成
    window.currentMap = 'city';
    // Clean up ALL maps first
    if (window.SnowMap) SnowMap.cleanup();
    if (window.DesertMap) DesertMap.cleanup();
    if (window.IslandBase) IslandBase.cleanup();
    if (window.SwampMap) SwampMap.cleanup();
    if (typeof clearCurrentMap === 'function') clearCurrentMap();
    generateMap(); // 再生成城市（含碰撞体）
    // 读取存档中的城市波次
    try {
      const wmRaw = localStorage.getItem('worldMapData');
      if (wmRaw) {
        const wmData = JSON.parse(wmRaw);
        if (wmData.cityWave !== undefined) {
          wave = wmData.cityWave;
        }
      }
    } catch(e) {}
    // 恢复晴朗天气
    try {
      if (window.WeatherSystem) WeatherSystem.changeWeather('clear');
    } catch(e) {}
    switchMapHUD('city');
  }

  // 恢复队友（伙伴）到当前地图
  respawnSavedAllies();

  renderer.domElement.requestPointerLock();
  
  // 注册电力系统全局回调（供shelter-ui.js触发）
  window.onShieldChargeRequested = chargeShield;
  window.onEMPRequested = triggerEMP;
  window.onFortRepairRequested = repairAllFortifications;
  
  // 初始化音频系统并启动背景音乐
  AudioSystem.init();
  AudioSystem.startBackgroundMusic();

  // 关闭/刷新浏览器时自动保存当前地图
  window.addEventListener('beforeunload', () => {
    const slot = window.ShelterSystem ? window.ShelterSystem.getCurrentSlot() : -1;
    if (slot >= 0 && window.currentMap) {
      try {
        const raw = localStorage.getItem('gameSave_v2_' + slot);
        const data = raw ? JSON.parse(raw) : {};
        data.currentMap = window.currentMap;
        data.savedAt = Date.now();
        // 保存玩家数据
        if (window.player) {
          data.player = {
            hp: player.hp,
            maxHp: player.maxHp,
            xp: player.xp,
            level: player.level,
            skills: player.skills
          };
        }
        // 保存武器数据
        if (window.weapons) {
          data.weapons = weapons.map(w => ({
            id: w.id,
            ammo: w.ammo,
            reserve: w.reserve
          }));
        }
        localStorage.setItem('gameSave_v2_' + slot, JSON.stringify(data));
      } catch(e) {}
    }
    // 同步到worldMapData
    if (window.WorldMap && typeof WorldMap.saveData === 'function') {
      WorldMap.saveData();
    }
  });

  // 延迟开始第一波（仅城市地图）
  setTimeout(() => {
    if (gameState === 'playing' && window.currentMap === 'city') startWave(1);
  }, 2000);
  } catch(err) {
    console.error('[startGame] 致命错误:', err);
    console.error('[startGame] 错误堆栈:', err.stack);
    // 同时显示在页面上（用户可能打不开控制台）
    var errMsg = '[startGame] 最后执行步骤: ' + (window._lastStartGameStep || 'unknown') + '\n错误: ' + err.message;
    if (window._showError) {
      window._showError(errMsg);
      if (err.stack) window._showError('STACK:\n' + err.stack);
    }
    // 使用alert确保用户能看到错误信息
    setTimeout(function() {
      alert('游戏加载出错！\n\n最后执行步骤: ' + (window._lastStartGameStep || 'unknown') + '\n错误: ' + err.message + '\n\n请按确定后查看页面顶部的红色错误面板获取详细信息。');
    }, 100);
    // 确保UI至少恢复到可用状态
    gameState = 'menu';
    var startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.remove('hide');
    document.body.style.cursor = 'default';
  }
}

// 统一地图HUD切换函数：先隐藏所有特有HUD，再根据地图显示对应内容
function switchMapHUD(mapId) {
  // 0. 清理上一个地图的碰撞体调试可视化
  if (window._colliderDebugActive && typeof window.clearColliderDebugVisuals === 'function') {
    window.clearColliderDebugVisuals();
  }

  // 1. 隐藏所有地图特有HUD
  const snowHud = document.getElementById('snow-quest-hud');
  const towerHud = document.getElementById('tower-hp-hud');
  if (snowHud) snowHud.style.display = 'none';
  if (towerHud) towerHud.style.display = 'none';

  const desertHud = document.getElementById('desert-quest-hud');
  const baseHud = document.getElementById('base-hp-hud');
  const desertOverlay = document.getElementById('desert-mission-overlay');
  if (desertHud) desertHud.style.display = 'none';
  if (baseHud) baseHud.style.display = 'none';
  if (desertOverlay) desertOverlay.style.display = 'none';

  const swampHud = document.getElementById('swamp-quest-hud');
  if (swampHud) swampHud.style.display = 'none';

  // 2. 通用HUD默认显示
  const playerPanel = document.getElementById('player-panel');
  const allyInfo = document.getElementById('ally-info');
  const ammoPanel = document.getElementById('ammo-panel');
  const waveInfo = document.getElementById('wave-info');
  const minimap = document.getElementById('minimap');
  const killFeed = document.getElementById('kill-feed');

  if (playerPanel) playerPanel.style.display = 'block';
  if (allyInfo) allyInfo.style.display = 'flex';
  if (ammoPanel) ammoPanel.style.display = 'block';
  if (minimap) minimap.style.display = 'block';
  if (killFeed) killFeed.style.display = 'flex';

  // 3. 根据地图显示特有HUD
  if (mapId === 'city') {
    if (waveInfo) {
      waveInfo.style.display = 'block';
      // 保留原有的 wave-num 和 enemy-count 元素（updateHUD 依赖这些 ID）
      // 追加 wave-timer 用于波次倒计时
      if (!document.getElementById('enemy-count')) {
        waveInfo.innerHTML = '<div class="wave-num" id="wave-num">第 1 波</div><div id="enemy-count">剩余敌人: 0</div><div id="wave-timer"></div>';
      }
    }
  } else if (mapId === 'snow') {
    if (waveInfo) waveInfo.style.display = 'block';
    if (snowHud) snowHud.style.display = 'block';
  } else if (mapId === 'desert') {
    if (waveInfo) waveInfo.style.display = 'block';
    if (desertHud) desertHud.style.display = 'block';
    if (baseHud) baseHud.style.display = 'block';
  } else if (mapId === 'island') {
    if (waveInfo) waveInfo.style.display = 'block';
  } else if (mapId === 'swamp') {
    if (waveInfo) waveInfo.style.display = 'block';
    if (swampHud) swampHud.style.display = 'block';
  }
}

function gameOver() {
  gameState = 'dead';
  document.exitPointerLock();
  document.body.style.cursor = 'default'; // 死亡时显示光标
  AudioSystem.stopBackgroundMusic();
  
  // 隐藏游戏HUD面板
  document.getElementById('player-panel').style.display = 'none';
  document.getElementById('ally-info').style.display = 'none';
  document.getElementById('ammo-panel').style.display = 'none';
  document.getElementById('wave-info').style.display = 'none';
  document.getElementById('minimap').style.display = 'none';
  document.getElementById('kill-feed').style.display = 'none';
  // 隐藏雪山HUD
  const snowHud = document.getElementById('snow-quest-hud');
  const towerHud = document.getElementById('tower-hp-hud');
  if (snowHud) snowHud.style.display = 'none';
  if (towerHud) towerHud.style.display = 'none';
  // 隐藏沙漠HUD
  const desertHud = document.getElementById('desert-quest-hud');
  const baseHud = document.getElementById('base-hp-hud');
  const desertOverlay = document.getElementById('desert-mission-overlay');
  if (desertHud) desertHud.style.display = 'none';
  if (baseHud) baseHud.style.display = 'none';
  if (desertOverlay) desertOverlay.style.display = 'none';
  // 隐藏NPC对话面板
  const npcDialog = document.getElementById('npc-dialog-overlay');
  if (npcDialog) npcDialog.style.display = 'none';

  // 关闭所有弹窗和界面
  // 关闭避难所弹窗
  const shelterModal = document.getElementById('shelter-modal');
  if (shelterModal) shelterModal.style.display = 'none';
  // 关闭避难所主界面
  const shelterUI = document.getElementById('shelter-ui');
  if (shelterUI) shelterUI.style.display = 'none';
  // 关闭V键部署模式
  if (window.closeFortDeployMode) window.closeFortDeployMode();
  // 关闭命令面板
  const cmdPanel = document.getElementById('debug-command-panel');
  if (cmdPanel) cmdPanel.style.display = 'none';
  // 关闭P面板（暂停菜单）
  const pauseMenu = document.getElementById('pause-menu');
  if (pauseMenu) pauseMenu.style.display = 'none';
  // 关闭升级面板
  const upgradePanel = document.getElementById('upgrade-panel');
  if (upgradePanel) upgradePanel.style.display = 'none';
  // 关闭空投提示
  const airdropPrompt = document.getElementById('airdrop-prompt');
  if (airdropPrompt) airdropPrompt.style.display = 'none';
  
  // 解除指针锁定
  if (document.pointerLockElement) document.exitPointerLock();
  
  // 清空击杀信息
  const killFeed = document.getElementById('kill-feed');
  if (killFeed) killFeed.innerHTML = '';

  // 结算战场资源带回避难所
  let resourceGained = { building: 0, food: 0, parts: 0 };
  if (window.FortificationSystem && window.ShelterSystem) {
    const totalParts = FortificationSystem.cleanup(); // 回收工事
    resourceGained.parts = Math.floor(totalParts); // 取整
    resourceGained.building = Math.floor(kills); // 每个僵尸+1建材，取整
    
    // 零件已通过工事系统直接写入避难所，这里只同步建材和食物
    const result = ShelterSystem.addBattleResources(resourceGained);
    if (result.overflow) {
      showFloatingText(camera.position, '资源超过上限，部分已丢失', 0xFF0000);
    }
  }

  const stats = document.getElementById('death-stats');
  const mins = Math.floor(surviveTime / 60);
  const secs = Math.floor(surviveTime % 60);
  stats.innerHTML = `
    存活时间: ${mins}分${secs}秒<br>
    击杀数: ${kills}<br>
    到达波次: 第 ${wave} 波<br>
    等级: ${level}<br>
    队友: ${allies.filter(a => !a.dead).length} 人存活<br>
    <span style="color: #FFD700;">获得资源: 建材+${resourceGained.building} 零件+${resourceGained.parts}</span>
  `;
  document.getElementById('death-screen').classList.add('show');
}

// ============================================================
// 主循环
// ============================================================
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  // 更新昼夜循环
  if (dayNightCycle.sun) {
    updateDayNightCycle(dt);
  }

  if (gameState === 'playing' && !window.shelterPauseState) {
    try {
    surviveTime += dt;
    // 同时更新新PlayerSystem（双轨并行）
    if (window.PlayerSystem && PlayerSystem.initialized) {
      try {
        PlayerSystem.update(dt);
      } catch (e) {
        console.warn('[game.js] PlayerSystem update failed:', e);
      }
    }
    // 更新玩家移动、视角、跳跃、重力等核心逻辑
    updatePlayer(dt);
    // 更新流场寻路（所有地面僵尸共用）
    if (window.FlowField) {
      FlowField.update(camera.position.x, camera.position.z, surviveTime, dt);
    }
    updateEnemies(dt);
    // 同时更新新CombatSystem的敌人（双轨并行）
    if (window.CombatSystem && CombatSystem.initialized) {
      try {
        CombatSystem.updateEnemies(dt);
      } catch (e) {
        console.warn('[game.js] CombatSystem updateEnemies failed:', e);
      }
    }
    // 更新屏幕震动
    if (window.CameraSystem && CameraSystem.initialized) {
      CameraSystem.updateShake(dt, camera);
    }
    updateAllies(dt);
    // 同时更新新CombatSystem的盟友（双轨并行）
    if (window.CombatSystem && CombatSystem.initialized) {
      try {
        CombatSystem.updateAllies(dt);
      } catch (e) {
        console.warn('[game.js] CombatSystem updateAllies failed:', e);
      }
    }
    // 城市传送门更新
    if (window.currentMap === 'city' || !window.currentMap) {
      updateCityPortals(dt);
    }
    // 交互提示更新
    updateInteractionPrompt();
    // 地图管理器更新（统一处理所有地图更新）
    if (window.MapManager) {
      MapManager.update(dt);
    }

    // 模块适配器更新（新模块系统）
    if (window.ModuleAdapter) {
      ModuleAdapter.update(dt);
    }

    // 防御工事系统更新（炮塔/无人机/陷阱/路障）
    if (typeof updateFortifications === 'function') {
      try {
        updateFortifications(dt);
      } catch (e) {
        console.warn('[game.js] updateFortifications failed:', e);
      }
    }

    // 雪山地图更新（兼容旧代码）
    if (window.SnowMap && SnowMap.active) {
      SnowMap.update(dt);
      updateSnowQuestHUD();
    }
    // 沙漠地图更新
    if (window.DesertMap && DesertMap.active) {
      DesertMap.update(dt);
      updateDesertQuestHUD();
    }
    // 孤岛基地更新
    if (window.IslandBase && IslandBase.active) {
      IslandBase.update(dt);
    }
    updateBullets(dt);
    updateEnemyBullets(dt);
    // 同时更新新CombatSystem的子弹（双轨并行）
    if (window.CombatSystem && CombatSystem.initialized) {
      try {
        CombatSystem.updateBullets(dt);
      } catch (e) {
        console.warn('[game.js] CombatSystem updateBullets failed:', e);
      }
    }
    updateMissiles(dt);
    updateParticles(dt);
    updateDamageNumbers(dt);
    updateFloatingTexts(dt);
    updatePoisonZones(dt);
    updatePoisonSprays(dt);
    // 波次系统（仅城市地图自动推进，雪山和沙漠由各自任务系统控制）
    if (window.currentMap === 'city' || !window.currentMap) {
      updateWaveSystem(dt);
    }
    updateAirdrop(dt);
    
    // 更新天气系统
    if (window.WeatherSystem) {
      WeatherSystem.update(dt, player, enemies, window.deployedFortifications);
    }
    
    updateMinimap();
    updateHUD();

    // FPS武器动画更新（枪口闪光 + 后坐力 + 呼吸晃动 + 弹道轨迹）
    updateMuzzleFlash(dt);
    updateWeaponAnimation(dt, clock.elapsedTime || 0);
    updateBulletTrails(dt);

    // 狙击镜信息更新（距离 + 风速）
    if (isAiming && weapons[currentWeaponIndex] && weapons[currentWeaponIndex].name === '狙击枪') {
      updateScopeInfo(dt);
    }

    // 更新防御工事
    if (window.FortificationSystem) {
      // 定期同步避难所零件数到战场（每5秒同步一次）
      if (Math.floor(surviveTime) % 5 === 0) {
        FortificationSystem.syncPartsFromShelter();
      }
      // 调试：确认 update 被调用
      if (Math.random() < 0.001) {
        console.log('[game.js] 调用 FortificationSystem.update()');
      }
      FortificationSystem.update(dt);
      FortificationSystem.updatePreview();

      // 长按E移动工事：非部署模式下，长按E进入移动模式
      if (!window.deploymentMode && keys['KeyE'] && !window._eMoveTimer) {
        window._eMoveTimer = 0;
      }
      if (window._eMoveTimer !== undefined) {
        window._eMoveTimer += dt;
        if (window._eMoveTimer >= 0.5 && !window.FortificationSystem.isMovingFort()) {
          FortificationSystem.startMoveFort();
        }
      }
      if (!keys['KeyE']) {
        // 松开E：如果在移动模式且预览有效，确认移动
        if (window.FortificationSystem.isMovingFort()) {
          FortificationSystem.confirmMoveFort();
        }
        window._eMoveTimer = undefined;
      }
    }

    // 分区分片动态加载更新（仅城市地图）
    if (window.currentMap === 'city' || !window.currentMap) {
      chunkSystem.chunkUpdateTimer += dt;
      if (chunkSystem.chunkUpdateTimer >= CONFIG.CHUNK_UPDATE_INTERVAL) {
        chunkSystem.chunkUpdateTimer = 0;
        const currentChunk = getPlayerChunk();
        if (currentChunk.x !== chunkSystem.lastPlayerChunk.x ||
            currentChunk.z !== chunkSystem.lastPlayerChunk.z) {
          updateChunks();
        }
      }
    }
    } catch(err) {
      console.error('[animate] playing状态更新错误:', err);
      console.error('[animate] 错误堆栈:', err.stack);
      if (window._showError) {
        window._showError('[animate] 错误: ' + err.message);
        if (err.stack) window._showError('STACK:\n' + err.stack);
      }
    }
  }

  renderParticles();
  renderer.render(scene, camera);
}

// ============================================================
// 昼夜系统
// ============================================================

// 初始化昼夜系统
function initDayNightCycle() {
  // 环境光（基础亮度）
  dayNightCycle.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(dayNightCycle.ambientLight);
  
  // 太阳光（方向光）
  dayNightCycle.sun = new THREE.DirectionalLight(0xfffaed, 1.2);
  dayNightCycle.sun.position.set(100, 100, 50);
  dayNightCycle.sun.castShadow = false; // 关闭太阳阴影以提升性能（已有主灯光阴影）
  scene.add(dayNightCycle.sun);
  
  // 月光（方向光，较弱）
  dayNightCycle.moon = new THREE.DirectionalLight(0x6666ff, 0.3);
  dayNightCycle.moon.position.set(-100, 100, -50);
  dayNightCycle.moon.castShadow = false; // 关闭月亮阴影以提升性能
  dayNightCycle.moon.visible = false; // 白天隐藏
  scene.add(dayNightCycle.moon);
  
  // 初始时间设为早上8点
  dayNightCycle.time = 8;
}

// 更新昼夜循环
function updateDayNightCycle(dt) {
  // 同时更新新WeatherSystem的昼夜循环（双轨并行）
  if (window.WeatherSystem && WeatherSystem.updateDayNightCycle) {
    try {
      if(window.WeatherSystem)WeatherSystem.updateDayNightCycle(dt);
    } catch (e) {
      // WeatherSystem可能不存在或方法未实现，静默处理
    }
  }

  // 更新时间
  dayNightCycle.time += (dt / dayNightCycle.cycleDuration) * 24;
  if (dayNightCycle.time >= 24) dayNightCycle.time -= 24;

  const hour = dayNightCycle.time;
  
  // 计算太阳/月亮位置和光照强度
  // 6:00日出，18:00日落
  const isDay = hour >= 6 && hour < 18;
  const isNight = hour < 6 || hour >= 18;
  
  // 太阳角度：6点=0度（地平线），12点=90度（头顶），18点=180度（地平线）
  let sunAngle, sunIntensity, moonIntensity;
  let skyR, skyG, skyB;
  
  // 检查血月天气 - 覆盖天空颜色
  const isBloodMoon = window.WeatherSystem && WeatherSystem.currentWeather === 'bloodmoon';
  
  if (isBloodMoon) {
    // 血月：深红色天空
    sunIntensity = 0;
    moonIntensity = 0.5;
    skyR = 0.35;
    skyG = 0.05;
    skyB = 0.05;
  } else if (isDay) {
    // 白天
    sunAngle = ((hour - 6) / 12) * Math.PI; // 0到PI
    sunIntensity = Math.sin(sunAngle) * 1.2;
    if (sunIntensity < 0) sunIntensity = 0;
    moonIntensity = 0;
    
    // 天空颜色变化：早晨/傍晚偏橙，中午偏蓝
    const noonFactor = 1 - Math.abs(hour - 12) / 6; // 0到1，中午最高
    skyR = 0.2 + noonFactor * 0.3; // 0.2->0.5
    skyG = 0.3 + noonFactor * 0.4; // 0.3->0.7
    skyB = 0.5 + noonFactor * 0.3; // 0.5->0.8
  } else {
    // 夜晚
    sunIntensity = 0;
    moonIntensity = 0.3;
    
    // 夜空：深蓝/黑色
    skyR = 0.02;
    skyG = 0.02;
    skyB = 0.08;
  }
  
  // 应用光照
  dayNightCycle.sun.intensity = sunIntensity;
  dayNightCycle.moon.intensity = moonIntensity;
  dayNightCycle.moon.visible = moonIntensity > 0;
  
  // 更新太阳位置
  if (isDay && !isBloodMoon) {
    dayNightCycle.sun.position.set(
      Math.cos(sunAngle) * 100,
      Math.sin(sunAngle) * 100,
      50
    );
  }
  
  // 更新环境光（血月时增加环境光避免场景过暗）
  let ambientIntensity = isDay ? 0.3 + Math.sin(sunAngle) * 0.2 : 0.1;
  if (isBloodMoon) ambientIntensity = 0.35; // 血月时增加环境光，避免建筑过暗或渲染异常
  dayNightCycle.ambientLight.intensity = ambientIntensity;
  
  // 更新天空颜色
  dayNightCycle.skyColor.setRGB(skyR, skyG, skyB);
  scene.background = dayNightCycle.skyColor;
  if (scene.fog) {
    scene.fog.color = dayNightCycle.skyColor;
  }
  
  // 更新HUD显示时间
  updateTimeDisplay(hour);
}

// 更新时间显示
function updateTimeDisplay(hour) {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  const period = (hour >= 6 && hour < 18) ? '☀️' : '🌙';
  
  // 如果有时间显示元素就更新
  const timeEl = document.getElementById('time-display');
  if (timeEl) {
    timeEl.textContent = `${period} ${timeStr}`;
  }
}

// ============================================================
// 启动
// ============================================================

// ============================================================
// 调试命令系统（仅当前游戏有效，刷新/死亡后失效）
// 优化版：美观UI、自动补全、命令历史、执行反馈、音效
// ============================================================
let debugCommandInput = null;
let debugMode = true; // 调试模式（每次开游戏重置）
let debugResourceBonus = { building: 0, food: 0, parts: 0 }; // 临时资源加成（仅本场有效）
window.debugResourceBonus = debugResourceBonus; // 暴露到全局，供 shelter.js 读取
let gameStateBeforeDebug = null; // 保存打开面板前的游戏状态

// --- 命令历史 ---
let debugCommandHistory = [];
let debugHistoryIndex = -1;

// --- 可用命令定义（用于自动补全） ---
const DEBUG_COMMANDS = [
  // 天气
  { cmd: 'rain',      cat: 'weather', icon: '🌧️', desc: '雨天 - 移速-15%，散布+30%' },
  { cmd: 'fog',       cat: 'weather', icon: '🌫️', desc: '浓雾 - 视野30%' },
  { cmd: 'storm',     cat: 'weather', icon: '⛈️', desc: '雷暴 - 全体移速-10%，落雷' },
  { cmd: 'snow',      cat: 'weather', icon: '❄️', desc: '大雪 - 移速-30%，爆炸范围-50%' },
  { cmd: 'bloodmoon', cat: 'weather', icon: '🩸', desc: '血月 - 敌人全属性+20%，经验+50%' },
  { cmd: 'normal',    cat: 'weather', icon: '☀️', desc: '晴天 - 恢复正常天气' },
  // 游戏
  { cmd: 'kill',      cat: 'game', icon: '⚔️', desc: '清除所有敌人' },
  { cmd: 'wave',      cat: 'game', icon: '⏭️', desc: '跳转波次 (wave N)' },
  { cmd: 'spawn',     cat: 'game', icon: '👾', desc: '随机生成敌人 (spawn N)' },
  { cmd: 'add',       cat: 'game', icon: '👹', desc: '指定怪物 (add 名字 N)' },
  // 资源
  { cmd: 'bld',       cat: 'resource', icon: '📦', desc: '增加建材 (bld N)' },
  { cmd: 'food',      cat: 'resource', icon: '🍎', desc: '增加食物 (food N)' },
  { cmd: 'part',      cat: 'resource', icon: '🔩', desc: '增加零件 (part N)' },
  { cmd: 'xp',        cat: 'resource', icon: '✨', desc: '增加经验 (xp N)' },
  // 队友
  { cmd: 'ally',      cat: 'ally', icon: '👥', desc: '添加队友 (ally N / ally 名称)' },
  // 地图
  { cmd: 'goto',      cat: 'map', icon: '🗺️', desc: '传送到地图 (goto island/swamp/city/snow/desert)' },
  { cmd: 'unlocksnow',   cat: 'map', icon: '🔓', desc: '解锁雪山' },
  { cmd: 'unlockdesert', cat: 'map', icon: '🔓', desc: '解锁荒漠' },
  { cmd: 'unlockisland', cat: 'map', icon: '🔓', desc: '解锁孤岛' },
  { cmd: 'unlockswamp',  cat: 'map', icon: '🔓', desc: '解锁沼泽' },
  { cmd: 'skipsnow',     cat: 'map', icon: '⏭️', desc: '跳过雪山任务' },
  { cmd: 'skipdesert',   cat: 'map', icon: '⏭️', desc: '跳过荒漠任务' },
  { cmd: 'skipswamp',    cat: 'map', icon: '⏭️', desc: '跳过沼泽任务' },
  // 系统
  { cmd: 'god',       cat: 'system', icon: '🛡️', desc: '无敌模式开关' },
  { cmd: 'heal',      cat: 'system', icon: '💚', desc: '恢复满血（玩家+队友）' },
  { cmd: 'weather',   cat: 'system', icon: '📊', desc: '显示天气信息' },
  { cmd: 'rinfo',     cat: 'system', icon: '📋', desc: '显示临时资源状态' },
  { cmd: 'help',      cat: 'system', icon: '❓', desc: '显示帮助' }
];

const DEBUG_CATEGORIES = {
  weather:  { label: '天气', color: '#4fc3f7' },
  game:     { label: '游戏', color: '#ff9800' },
  resource: { label: '资源', color: '#8B6914' },
  ally:     { label: '队友', color: '#9c27b0' },
  map:      { label: '地图', color: '#66bb6a' },
  system:   { label: '系统', color: '#29b6f6' }
};

function openDebugCommandInput() {
  if (debugCommandInput) {
    closeDebugCommandInput();
    return;
  }

  // 暂停游戏并保存当前状态
  gameStateBeforeDebug = gameState;
  if (gameState === 'playing') {
    gameState = 'paused';
  }

  debugCommandInput = document.createElement('div');
  debugCommandInput.id = 'debug-command-panel';

  // 构建命令列表HTML
  const catGroups = {};
  DEBUG_COMMANDS.forEach(c => {
    if (!catGroups[c.cat]) catGroups[c.cat] = [];
    catGroups[c.cat].push(c);
  });

  let commandsHtml = '';
  Object.keys(catGroups).forEach(catKey => {
    const cat = DEBUG_CATEGORIES[catKey];
    const cmds = catGroups[catKey];
    commandsHtml += `
      <div class="debug-cat">
        <div class="debug-cat-title" style="color:${cat.color}">${cat.label}</div>
        <div class="debug-cat-list">
          ${cmds.map(c => `<span class="debug-cmd-item" data-cmd="${c.cmd}"><span class="debug-cmd-icon">${c.icon}</span><span class="debug-cmd-name">${c.cmd}</span><span class="debug-cmd-desc">${c.desc}</span></span>`).join('')}
        </div>
      </div>
    `;
  });

  debugCommandInput.innerHTML = `
    <style>
      #debug-command-panel {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 80px;
        z-index: 99999;
        font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
      }
      #debug-command-panel .debug-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4);
      }
      #debug-command-panel .debug-box {
        position: relative;
        width: 600px;
        max-height: 80vh;
        background: rgba(0,0,0,0.85);
        border: 2px solid #44aaff;
        border-radius: 8px;
        box-shadow: 0 0 40px rgba(68,170,255,0.25), 0 8px 32px rgba(0,0,0,0.6);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: debugFadeIn 0.2s ease-out;
      }
      @keyframes debugFadeIn {
        from { opacity: 0; transform: translateY(-20px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      #debug-command-panel .debug-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(68,170,255,0.3);
        background: rgba(68,170,255,0.08);
      }
      #debug-command-panel .debug-title {
        color: #44aaff;
        font-size: 15px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #debug-command-panel .debug-close {
        width: 28px; height: 28px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.05);
        color: #aaa;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.15s;
      }
      #debug-command-panel .debug-close:hover {
        background: rgba(255,80,80,0.2);
        color: #ff5555;
        border-color: rgba(255,80,80,0.4);
      }
      #debug-command-panel .debug-body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
      }
      #debug-command-panel .debug-input-wrap {
        position: relative;
      }
      #debug-command-panel #debug-input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid rgba(68,170,255,0.4);
        border-radius: 6px;
        background: #1a1a2e;
        color: #e0e0e0;
        font-size: 14px;
        box-sizing: border-box;
        outline: none;
        caret-color: #44aaff;
        transition: border-color 0.2s;
      }
      #debug-command-panel #debug-input:focus {
        border-color: #44aaff;
        box-shadow: 0 0 0 2px rgba(68,170,255,0.15);
      }
      #debug-command-panel #debug-input::placeholder {
        color: #666;
      }
      #debug-command-panel .debug-autocomplete {
        position: absolute;
        top: calc(100% + 4px);
        left: 0; right: 0;
        background: #1a1a2e;
        border: 1px solid rgba(68,170,255,0.3);
        border-radius: 6px;
        max-height: 180px;
        overflow-y: auto;
        z-index: 10;
        display: none;
      }
      #debug-command-panel .debug-autocomplete.active {
        display: block;
      }
      #debug-command-panel .debug-ac-item {
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ccc;
        font-size: 13px;
        transition: background 0.1s;
      }
      #debug-command-panel .debug-ac-item:hover,
      #debug-command-panel .debug-ac-item.selected {
        background: rgba(68,170,255,0.15);
        color: #fff;
      }
      #debug-command-panel .debug-ac-item .ac-cmd {
        color: #44aaff;
        font-weight: bold;
        min-width: 80px;
      }
      #debug-command-panel .debug-history {
        max-height: 120px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      #debug-command-panel .debug-history-title {
        color: #888;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 4px;
      }
      #debug-command-panel .debug-history-item {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', monospace;
      }
      #debug-command-panel .debug-history-item.success {
        color: #4caf50;
        background: rgba(76,175,80,0.08);
      }
      #debug-command-panel .debug-history-item.error {
        color: #ef5350;
        background: rgba(239,83,80,0.08);
      }
      #debug-command-panel .debug-commands {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      #debug-command-panel .debug-cat-title {
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 5px;
      }
      #debug-command-panel .debug-cat-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      #debug-command-panel .debug-cmd-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 4px;
        font-size: 12px;
        color: #bbb;
        cursor: pointer;
        transition: all 0.15s;
        user-select: none;
      }
      #debug-command-panel .debug-cmd-item:hover {
        background: rgba(68,170,255,0.12);
        border-color: rgba(68,170,255,0.3);
        color: #fff;
      }
      #debug-command-panel .debug-cmd-icon { font-size: 13px; }
      #debug-command-panel .debug-cmd-name {
        color: #44aaff;
        font-weight: bold;
        font-family: 'Consolas', monospace;
      }
      #debug-command-panel .debug-cmd-desc {
        color: #888;
        font-size: 11px;
      }
      #debug-command-panel .debug-footer {
        padding: 8px 16px;
        border-top: 1px solid rgba(255,255,255,0.06);
        color: #666;
        font-size: 11px;
        text-align: center;
      }
      #debug-command-panel .debug-kbd {
        display: inline-block;
        padding: 1px 5px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 3px;
        font-family: monospace;
        font-size: 10px;
        color: #999;
      }
    </style>
    <div class="debug-overlay"></div>
    <div class="debug-box">
      <div class="debug-header">
        <div class="debug-title">🔧 调试控制台 <span style="color:#888;font-size:12px;font-weight:normal;">(游戏已暂停)</span></div>
        <button class="debug-close" id="debug-close-btn">✕</button>
      </div>
      <div class="debug-body">
        <div class="debug-input-wrap">
          <input type="text" id="debug-input" placeholder="输入指令 (如: goto island, weather rain, kill)..." autocomplete="off" spellcheck="false">
          <div class="debug-autocomplete" id="debug-autocomplete"></div>
        </div>
        <div class="debug-history" id="debug-history" style="display:none;">
          <div class="debug-history-title">执行历史</div>
        </div>
        <div class="debug-commands">
          ${commandsHtml}
        </div>
      </div>
      <div class="debug-footer">
        <span class="debug-kbd">Enter</span> 执行 &nbsp;
        <span class="debug-kbd">Tab</span> 补全 &nbsp;
        <span class="debug-kbd">↑↓</span> 历史 &nbsp;
        <span class="debug-kbd">Esc</span> 关闭
      </div>
    </div>
  `;

  document.body.appendChild(debugCommandInput);

  // 渲染历史记录
  renderDebugHistory();

  // 绑定关闭按钮
  document.getElementById('debug-close-btn').addEventListener('click', closeDebugCommandInput);
  debugCommandInput.querySelector('.debug-overlay').addEventListener('click', closeDebugCommandInput);

  // 绑定命令项点击
  debugCommandInput.querySelectorAll('.debug-cmd-item').forEach(el => {
    el.addEventListener('click', () => {
      const input = document.getElementById('debug-input');
      input.value = el.dataset.cmd + ' ';
      input.focus();
      updateAutocomplete(input.value);
    });
  });

  const input = document.getElementById('debug-input');
  input.focus();

  let acSelectedIndex = -1;

  function updateAutocomplete(value) {
    const ac = document.getElementById('debug-autocomplete');
    const prefix = value.trim().toLowerCase().split(/\s+/)[0];
    if (!prefix || prefix.length < 1) {
      ac.classList.remove('active');
      return;
    }
    const matches = DEBUG_COMMANDS.filter(c => c.cmd.startsWith(prefix) || prefix.startsWith(c.cmd));
    if (matches.length === 0) {
      ac.classList.remove('active');
      return;
    }
    ac.innerHTML = matches.map((m, i) => `
      <div class="debug-ac-item ${i === 0 ? 'selected' : ''}" data-index="${i}" data-cmd="${m.cmd}">
        <span class="ac-cmd">${m.cmd}</span>
        <span>${m.icon} ${m.desc}</span>
      </div>
    `).join('');
    ac.classList.add('active');
    acSelectedIndex = 0;

    ac.querySelectorAll('.debug-ac-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.dataset.cmd + ' ';
        ac.classList.remove('active');
        input.focus();
      });
      item.addEventListener('mouseenter', () => {
        ac.querySelectorAll('.debug-ac-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        acSelectedIndex = parseInt(item.dataset.index);
      });
    });
  }

  input.addEventListener('input', () => {
    updateAutocomplete(input.value);
  });

  input.addEventListener('keydown', e => {
    e.stopPropagation();

    const ac = document.getElementById('debug-autocomplete');
    const items = ac.querySelectorAll('.debug-ac-item');

    if (e.code === 'Enter') {
      e.preventDefault();
      const cmd = input.value.trim().toLowerCase();
      if (cmd) {
        executeDebugCommand(cmd);
      }
      return;
    }

    if (e.code === 'Tab') {
      e.preventDefault();
      if (ac.classList.contains('active') && items.length > 0) {
        const selected = items[acSelectedIndex] || items[0];
        if (selected) {
          input.value = selected.dataset.cmd + ' ';
          ac.classList.remove('active');
        }
      }
      return;
    }

    if (e.code === 'ArrowUp') {
      e.preventDefault();
      if (ac.classList.contains('active') && items.length > 0) {
        acSelectedIndex = (acSelectedIndex - 1 + items.length) % items.length;
        items.forEach(el => el.classList.remove('selected'));
        items[acSelectedIndex].classList.add('selected');
        items[acSelectedIndex].scrollIntoView({ block: 'nearest' });
      } else if (debugCommandHistory.length > 0) {
        // 浏览历史
        if (debugHistoryIndex < 0) debugHistoryIndex = debugCommandHistory.length;
        debugHistoryIndex = Math.max(0, debugHistoryIndex - 1);
        input.value = debugCommandHistory[debugHistoryIndex].cmd;
        input.setSelectionRange(input.value.length, input.value.length);
      }
      return;
    }

    if (e.code === 'ArrowDown') {
      e.preventDefault();
      if (ac.classList.contains('active') && items.length > 0) {
        acSelectedIndex = (acSelectedIndex + 1) % items.length;
        items.forEach(el => el.classList.remove('selected'));
        items[acSelectedIndex].classList.add('selected');
        items[acSelectedIndex].scrollIntoView({ block: 'nearest' });
      } else if (debugCommandHistory.length > 0 && debugHistoryIndex >= 0) {
        debugHistoryIndex++;
        if (debugHistoryIndex >= debugCommandHistory.length) {
          debugHistoryIndex = -1;
          input.value = '';
        } else {
          input.value = debugCommandHistory[debugHistoryIndex].cmd;
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
      return;
    }

    if (e.code === 'Escape' || e.code === 'Slash') {
      e.preventDefault();
      closeDebugCommandInput();
      return;
    }
  });
}

function renderDebugHistory() {
  const container = document.getElementById('debug-history');
  if (!container) return;
  if (debugCommandHistory.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';
  // 清除旧项（保留标题）
  const title = container.querySelector('.debug-history-title');
  container.innerHTML = '';
  if (title) container.appendChild(title);

  // 显示最近10条
  const recent = debugCommandHistory.slice(-10);
  recent.forEach(h => {
    const div = document.createElement('div');
    div.className = 'debug-history-item ' + (h.success ? 'success' : 'error');
    div.textContent = (h.success ? '✓ ' : '✗ ') + h.cmd;
    container.appendChild(div);
  });
}

function addDebugHistory(cmd, success) {
  debugCommandHistory.push({ cmd, success, time: Date.now() });
  if (debugCommandHistory.length > 50) debugCommandHistory.shift();
  debugHistoryIndex = -1;
  renderDebugHistory();
}

function closeDebugCommandInput() {
  if (debugCommandInput) {
    debugCommandInput.remove();
    debugCommandInput = null;
    // 恢复游戏状态
    if (gameStateBeforeDebug === 'playing') {
      gameState = 'playing';
    }
    gameStateBeforeDebug = null;
  }
}

function playDebugSound(success) {
  if (window.AudioSystem && AudioSystem.audioCtx) {
    try {
      const ctx = AudioSystem.audioCtx;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (success) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }
}

function executeDebugCommand(cmd) {
  console.log('[Debug] Command:', cmd);
  let success = true;
  let message = '';
  let msgType = 'info';

  // ========== 天气命令（强制切换并触发所有效果）==========
  const weatherCmds = {
    'rain':     { type: 'rain',      label: '🌧️ 雨天',     desc: '移速-15%，散布+30%，雨滴特效+雨声BGM' },
    'fog':      { type: 'fog',       label: '🌫️ 浓雾',    desc: '视野30%，雾效+阴森BGM' },
    'storm':    { type: 'storm',     label: '⛈️ 雷暴',    desc: '全体移速-10%，落雷+雷暴BGM' },
    'snow':     { type: 'snow',      label: '❄️ 大雪',    desc: '移速-30%，爆炸范围-50%，雪花特效+暴风雪BGM' },
    'bloodmoon':{ type: 'bloodmoon', label: '🩸 血月',    desc: '敌人全属性+20%，经验+50%，血色特效+恐怖BGM' },
    'normal':   { type: 'clear',     label: '☀️ 晴天',    desc: '恢复正常天气' }
  };

  if (weatherCmds[cmd]) {
    console.log('[Debug] 匹配天气命令:', cmd, '->', weatherCmds[cmd]);
    if (window.WeatherSystem) {
      const w = weatherCmds[cmd];
      if(window.WeatherSystem)WeatherSystem.forceWeather(w.type);
      message = `切换天气: ${w.label} - ${w.desc}`;
      msgType = 'success';
    } else {
      success = false;
      message = 'WeatherSystem 不存在!';
      msgType = 'error';
    }
  }
  // 清除敌人（所有地图通用）
  else if (cmd === 'kill' || cmd === 'clear_enemies') {
    enemies.forEach(e => {
      if (e.mesh) scene.remove(e.mesh);
    });
    enemies = [];
    // 雪山：同时清理游荡僵尸和波次僵尸
    if (window.SnowMap && SnowMap.active) {
      if (SnowMap.wanderZombies) {
        SnowMap.wanderZombies.forEach(z => { if (z.mesh) scene.remove(z.mesh); });
        SnowMap.wanderZombies = [];
      }
      if (SnowMap.defenseEnemies) {
        SnowMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
        SnowMap.defenseEnemies = [];
      }
      SnowMap.defenseWaveActive = false;
    }
    // 沙漠：同时清理游荡僵尸和波次僵尸
    if (window.DesertMap && DesertMap.active) {
      if (DesertMap.wanderZombies) {
        DesertMap.wanderZombies.forEach(z => { if (z.mesh) scene.remove(z.mesh); });
        DesertMap.wanderZombies = [];
      }
      if (DesertMap.defenseEnemies) {
        DesertMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
        DesertMap.defenseEnemies = [];
      }
      DesertMap.defenseWaveActive = false;
    }
    // 沼泽：清理变异怪物和防御敌人
    if (window.SwampMap && SwampMap.active) {
      if (SwampMap.mutants) {
        SwampMap.mutants.forEach(m => { if (m.mesh) scene.remove(m.mesh); });
        SwampMap.mutants = [];
      }
      if (SwampMap.defenseEnemies) {
        SwampMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
        SwampMap.defenseEnemies = [];
      }
      SwampMap.defenseWaveActive = false;
    }
    updateHUD();
    message = '清除所有敌人';
    msgType = 'success';
  }
  // 跳到波次（所有地图通用）
  else if (cmd.startsWith('wave ')) {
    const n = parseInt(cmd.split(' ')[1]);
    if (n > 0 && n <= 100) {
      if (window.SnowMap && SnowMap.active && SnowMap.phase === 'defend') {
        // 雪山波次：先清理当前波次敌人，再跳转
        if (SnowMap.defenseEnemies) {
          SnowMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
          SnowMap.defenseEnemies = [];
        }
        SnowMap.defenseWave = n - 1; // nextDefenseWave会+1
        SnowMap.defenseWaveActive = false;
        SnowMap.nextDefenseWave();
        message = `⏭️ 雪山跳转防御波次 ${n}`;
        msgType = 'success';
      } else if (window.DesertMap && DesertMap.active && DesertMap.phase === 'defend') {
        // 沙漠波次：先清理当前波次敌人，再跳转
        if (DesertMap.defenseEnemies) {
          DesertMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
          DesertMap.defenseEnemies = [];
        }
        DesertMap.defenseWave = n - 1; // nextDefenseWave会+1
        DesertMap.defenseWaveActive = false;
        DesertMap.nextDefenseWave();
        message = `⏭️ 沙漠跳转防御波次 ${n}`;
        msgType = 'success';
      } else if (window.SwampMap && SwampMap.active && SwampMap.phase === 'defend') {
        // 沼泽波次：先清理当前波次敌人，再跳转
        if (SwampMap.defenseEnemies) {
          SwampMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
          SwampMap.defenseEnemies = [];
        }
        SwampMap.defenseWave = n - 1;
        SwampMap.defenseWaveActive = false;
        SwampMap.startDefenseWave();
        message = `⏭️ 沼泽跳转防御波次 ${n}`;
        msgType = 'success';
      } else {
        wave = n;
        waveTimer = 0;
        message = `跳转波次 ${n}，本场有效`;
        msgType = 'success';
      }
    } else {
      success = false;
      message = '波次必须在 1-100 之间';
      msgType = 'error';
    }
  }
  // 生成敌人（临时）
  else if (cmd.startsWith('spawn ')) {
    const n = parseInt(cmd.split(' ')[1]);
    if (n > 0 && n <= 50) {
      for (let i = 0; i < n; i++) spawnEnemy();
      message = `生成 ${n} 个敌人，本场有效`;
      msgType = 'success';
    } else {
      success = false;
      message = '生成数量必须在 1-50 之间';
      msgType = 'error';
    }
  }
  // ⚠️ bld/food/part/xp/add/ally 必须放在通用匹配之前，否则会被误拦截
  // 临时增加建材（直接加到避难所）
  else if (cmd.startsWith('bld ')) {
    const n = parseInt(cmd.split(' ')[1]);
    if (n > 0 && n <= 100000) {
      // 直接应用到避难所，不经过 debugResourceBonus
      if (typeof window.addBattleResources === 'function') {
        window.addBattleResources({ building: n });
      }
      message = `📦 增加 ${n} 建材到避难所`;
      msgType = 'success';
    } else {
      success = false;
      message = '数量必须在 1-100000 之间';
      msgType = 'error';
    }
  }
  // 临时增加食物（直接加到避难所）
  else if (cmd.startsWith('food ')) {
    const n = parseInt(cmd.split(' ')[1]);
    if (n > 0 && n <= 100000) {
      // 直接应用到避难所，不经过 debugResourceBonus
      if (typeof window.addBattleResources === 'function') {
        window.addBattleResources({ food: n });
      }
      message = `🍎 增加 ${n} 食物到避难所`;
      msgType = 'success';
    } else {
      success = false;
      message = '数量必须在 1-100000 之间';
      msgType = 'error';
    }
  }
  // 临时增加零件（直接加到避难所）
  else if (cmd.startsWith('part ')) {
    const n = parseInt(cmd.split(' ')[1]);
    if (n > 0 && n <= 100000) {
      // 直接应用到避难所，不经过 debugResourceBonus
      if (typeof window.addBattleResources === 'function') {
        window.addBattleResources({ parts: n });
      }
      message = `🔩 增加 ${n} 零件到避难所`;
      msgType = 'success';
    } else {
      success = false;
      message = '数量必须在 1-100000 之间';
      msgType = 'error';
    }
  }
  // 快速升级（临时）- 加玩家经验
  else if (cmd.startsWith('xp ')) {
    const n = parseInt(cmd.split(' ')[1]);
    if (n > 0 && n <= 1000000) {
      player.xp += n;
      checkLevelUp(); // 检查升级
      message = `✨ 获得 ${n} 经验，本场有效`;
      msgType = 'success';
    } else {
      success = false;
      message = '经验值必须在 1-1000000 之间';
      msgType = 'error';
    }
  }
  // 按名称生成怪物：add 怪物 N（如 "add 暴君 3"、"add 舔食者 1"）
  else if (cmd.startsWith('add ')) {
    const parts = cmd.split(/\s+/);
    if (parts.length >= 3) {
      const count = parseInt(parts[parts.length - 1]);
      const monsterName = parts.slice(1, -1).join('');

      if (count > 0 && count <= 50 && typeof ZOMBIE_DEFS !== 'undefined') {
        // 模糊匹配怪物名称
        const matched = ZOMBIE_DEFS.find(def => def.name === monsterName) ||
                        ZOMBIE_DEFS.find(def => def.name.includes(monsterName)) ||
                        ZOMBIE_DEFS.find(def => monsterName.includes(def.name));

        if (matched) {
          for (let i = 0; i < count; i++) {
            spawnEnemy(matched);
          }
          message = `生成 ${count} 个 ${matched.name}`;
          msgType = 'success';
        } else {
          success = false;
          // 显示可用怪物列表
          const names = ZOMBIE_DEFS.map(d => d.name).join('、');
          message = `未知怪物: ${monsterName}，可用: ${names}`;
          msgType = 'error';
        }
      } else {
        success = false;
        message = '数量必须在 1-50 之间';
        msgType = 'error';
      }
    } else {
      success = false;
      message = '格式错误，使用: add 怪物名 数量';
      msgType = 'error';
    }
  }
  // 添加队友：ally [名称] 或 ally N（数量）
  else if (cmd.startsWith('ally ')) {
    const arg = cmd.split(' ')[1];
    const n = parseInt(arg);

    if (!isNaN(n) && n > 0) {
      // ally N：添加N个随机队友（数字优先）
      let added = 0;
      for (let i = 0; i < Math.min(n, 50) && allies.length < CONFIG.ALLY_MAX; i++) {
        if (spawnAlly()) added++;
      }
      if (added > 0) {
        message = `👥 添加 ${added} 个随机队友`;
        msgType = 'success';
      } else {
        success = false;
        message = '⚠️ 队友数量已达上限';
        msgType = 'warning';
      }
    } else if (arg && typeof ALLY_CLASSES !== 'undefined') {
      // ally 名称：添加指定类型队友
      const matched = ALLY_CLASSES.find(c => c.name === arg) ||
                     ALLY_CLASSES.find(c => c.name.includes(arg)) ||
                     ALLY_CLASSES.find(c => arg.includes(c.name));
      if (matched) {
        if (spawnAlly(null, matched.name)) {
          message = `👥 添加队友: ${matched.name}`;
          msgType = 'success';
        } else {
          success = false;
          message = '⚠️ 队友数量已达上限';
          msgType = 'warning';
        }
      } else {
        success = false;
        const names = ALLY_CLASSES.map(c => c.name).join('、');
        message = `❓ 未知队友类型: ${arg}，可用: ${names}`;
        msgType = 'error';
      }
    } else {
      success = false;
      message = '格式错误，使用: ally N 或 ally 名称';
      msgType = 'error';
    }
  }
  // 无敌模式（临时）
  else if (cmd === 'god') {
    player.godMode = !player.godMode;
    message = player.godMode ? '🛡️ 无敌模式开启（本场有效）' : '🛡️ 无敌模式关闭';
    msgType = 'success';
  }
  // 满血
  else if (cmd === 'heal') {
    player.hp = player.maxHp;
    allies.forEach(a => { if (!a.dead) a.hp = a.maxHp; });
    message = '💚 已恢复满血（玩家+队友）';
    msgType = 'success';
  }
  // 显示天气信息
  else if (cmd === 'weather' || cmd === 'winfo') {
    if (window.WeatherSystem) {
      const mults = WeatherSystem.getEnemyStatMult();
      message = `天气: ${WeatherSystem.currentWeather} | 敌倍率: HP×${mults.health} SPD×${mults.speed} DMG×${mults.damage}`;
      msgType = 'info';
    } else {
      success = false;
      message = 'WeatherSystem 未加载';
      msgType = 'error';
    }
  }
  // 显示临时资源状态
  else if (cmd === 'rinfo' || cmd === 'resources') {
    const b = debugResourceBonus;
    message = `临时资源: 建材+${b.building} 食物+${b.food} 零件+${b.parts}，刷新失效`;
    msgType = 'info';
  }
  // 帮助
  else if (cmd === 'help' || cmd === '?') {
    message = '按 / 打开命令面板，所有命令仅本场有效';
    msgType = 'info';
  }
  // 解锁雪山地图节点
  else if (cmd === 'unlocksnow' || cmd === 'unlock_snow' || cmd === 'opensnow') {
    if (window.WorldMap) {
      WorldMap.unlockNode('snow');
      // 同时激活城市传送门
      if (!portalsActivated) activateCityPortals();
      message = '❄️ 雪山节点已解锁，传送门已激活！按M打开地图传送';
      msgType = 'success';
    } else {
      success = false;
      message = '世界地图系统未加载';
      msgType = 'error';
    }
  }
  // 跳过雪山任务，直接进入防御阶段
  else if (cmd === 'skipsnow' || cmd === 'skip_snow') {
    if (!window.SnowMap || !SnowMap.active) {
      success = false;
      message = '❌ 当前不在雪山地图';
      msgType = 'error';
    } else {
      // 关闭所有任务弹窗
      const overlay = document.getElementById('snow-mission-overlay');
      if (overlay) overlay.style.display = 'none';
      const closeBtn = document.getElementById('snow-mission-btn');

      // 清理游荡僵尸
      if (SnowMap.wanderZombies) {
        SnowMap.wanderZombies.forEach(z => { if (z.mesh) scene.remove(z.mesh); });
        SnowMap.wanderZombies = [];
      }
      // 清理旧的波次敌人
      if (SnowMap.defenseEnemies) {
        SnowMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
        SnowMap.defenseEnemies = [];
      }
      // 激活所有电源
      SnowMap.powerNodes.forEach(node => {
        node.activated = true;
        node.zombiesCleared = true;
        const light = node.mesh.getObjectByName('powerStatus');
        if (light) light.material.color.setHex(0x00ff00);
      });
      SnowMap.activatedPowers = SnowMap.powerNodes.length;
      SnowMap.radioInteracted = true;

      // 直接进入防御阶段（跳过所有任务交互）
      SnowMap.phase = 'defend';
      SnowMap.defenseWave = 0;
      SnowMap.defenseWaveActive = false;
      SnowMap.towerHP = SNOW_MAP_CONFIG.TOWER_HP;
      SnowMap.towerMaxHP = SNOW_MAP_CONFIG.TOWER_HP;
      SnowMap.shakeIntensity = 2;
      SnowMap.shakeTimer = 5;
      SnowMap.nextDefenseWave();

      // 恢复游戏状态（弹窗可能把游戏暂停了）
      gameState = 'playing';
      document.body.style.cursor = 'none';
      if (renderer && renderer.domElement) renderer.domElement.requestPointerLock();

      message = '⏭️ 已跳过雪山任务，进入防御阶段！';
      msgType = 'success';
    }
  }
  else if (cmd === 'skipdesert' || cmd === 'skip_desert') {
    if (!window.DesertMap || !DesertMap.active) {
      success = false;
      message = '❌ 当前不在荒漠地图';
      msgType = 'error';
    } else {
      // 关闭所有任务弹窗
      const overlay = document.getElementById('desert-mission-overlay');
      if (overlay) overlay.style.display = 'none';

      // 清理游荡僵尸
      if (DesertMap.wanderZombies) {
        DesertMap.wanderZombies.forEach(z => { if (z.mesh) scene.remove(z.mesh); });
        DesertMap.wanderZombies = [];
      }
      // 清理旧的波次敌人
      if (DesertMap.defenseEnemies) {
        DesertMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
        DesertMap.defenseEnemies = [];
      }

      // 直接进入防御阶段
      DesertMap.phase = 'defend';
      DesertMap.defenseWave = 0;
      DesertMap.defenseWaveActive = false;
      DesertMap.towerHP = DESERT_MAP_CONFIG.TOWER_HP;
      DesertMap.towerMaxHP = DESERT_MAP_CONFIG.TOWER_HP;
      DesertMap.shakeIntensity = 2;
      DesertMap.shakeTimer = 5;
      DesertMap.nextDefenseWave();

      // 恢复游戏状态
      gameState = 'playing';
      document.body.style.cursor = 'none';
      if (renderer && renderer.domElement) renderer.domElement.requestPointerLock();

      message = '⏭️ 已跳过荒漠任务，进入防御阶段！';
      msgType = 'success';
    }
  }
  else if (cmd === 'unlockdesert' || cmd === 'unlock_desert') {
    if (typeof WorldMap !== 'undefined') {
      WorldMap.unlockNode('desert');
      message = '🔓 已解锁灼热荒漠！';
      msgType = 'success';
    } else {
      success = false;
      message = '❌ 世界地图系统未加载';
      msgType = 'error';
    }
  }
  // 解锁孤岛基地
  else if (cmd === 'unlockisland' || cmd === 'unlock_island') {
    if (typeof WorldMap !== 'undefined') {
      WorldMap.unlockNode('island');
      message = '🏝️ 已解锁孤岛基地！';
      msgType = 'success';
    } else {
      success = false;
      message = '❌ 世界地图系统未加载';
      msgType = 'error';
    }
  }
  // 解锁毒雾沼泽
  else if (cmd === 'unlockswamp' || cmd === 'unlock_swamp') {
    if (typeof WorldMap !== 'undefined') {
      WorldMap.unlockNode('swamp');
      message = '🌿 已解锁毒雾沼泽！';
      msgType = 'success';
    } else {
      success = false;
      message = '❌ 世界地图系统未加载';
      msgType = 'error';
    }
  }
  // 传送到指定地图
  else if (cmd.startsWith('goto ')) {
    const mapId = cmd.split(' ')[1];
    const validMaps = ['city', 'snow', 'desert', 'island', 'swamp'];
    if (!validMaps.includes(mapId)) {
      success = false;
      message = `❌ 无效地图: ${mapId}。可用: ${validMaps.join(', ')}`;
      msgType = 'error';
    } else if (window.MapManager && typeof MapManager.switchTo === 'function') {
      MapManager.switchTo(mapId);
      message = `🗺️ 已传送到: ${mapId}`;
      msgType = 'success';
    } else {
      success = false;
      message = '❌ MapManager 未加载';
      msgType = 'error';
    }
  }
  // 跳过沼泽任务，直接进入防御阶段
  else if (cmd === 'skipswamp' || cmd === 'skip_swamp') {
    if (!window.SwampMap || !SwampMap.active) {
      success = false;
      message = '❌ 当前不在沼泽地图';
      msgType = 'error';
    } else {
      // 清理游荡怪物
      if (SwampMap.mutants) {
        SwampMap.mutants.forEach(m => { if (m.mesh) scene.remove(m.mesh); });
        SwampMap.mutants = [];
      }
      // 清理旧的波次敌人
      if (SwampMap.defenseEnemies) {
        SwampMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
        SwampMap.defenseEnemies = [];
      }
      // 直接进入防御阶段
      SwampMap.phase = 'defend';
      SwampMap.defenseWave = SwampMap.maxWaves - 1;
      SwampMap.defenseWaveActive = false;
      SwampMap.startDefenseWave();
      // 恢复游戏状态
      gameState = 'playing';
      document.body.style.cursor = 'none';
      if (renderer && renderer.domElement) renderer.domElement.requestPointerLock();
      message = '⏭️ 已跳过沼泽探索，进入最终防御波次！';
      msgType = 'success';
    }
  }
  // 未知命令
  else {
    success = false;
    message = '❓ 未知命令: ' + cmd;
    msgType = 'error';
  }

  // 播放音效反馈
  playDebugSound(success);

  // 显示Toast
  if (message) {
    showToast(message, msgType);
  }

  // 记录历史
  addDebugHistory(cmd, success);

  closeDebugCommandInput();
}
init();

// ==================== 雪山地图集成 ====================

// 当前地图状态
window.currentMap = 'city'; // 'city' | 'snow'

// 雪山任务弹窗系统
window.showSnowMissionDialog = function(type) {
  const overlay = document.getElementById('snow-mission-overlay');
  const title = document.getElementById('snow-mission-title');
  const text = document.getElementById('snow-mission-text');
  const btn = document.getElementById('snow-mission-btn');
  
  if (!overlay) return;
  
  // 暂停游戏并释放鼠标
  gameState = 'paused';
  document.body.style.cursor = 'default';
  if (document.pointerLockElement) document.exitPointerLock();
  
  switch(type) {
    case 'explore':
      title.textContent = '🏔️ 雪山探索任务';
      text.innerHTML = `
        <p>你来到了<span class="highlight">霜寒禁区</span>，一座被冰雪覆盖的雪山公路。</p>
        <br>
        <p>这里的<span class="highlight">信号塔</span>因电源故障停止了运转，一群幸存者被困在避难所中无法求救。</p>
        <br>
        <p>你需要在雪山公路附近找到<span class="highlight">3个电源节点</span>，清除守护的丧尸并激活它们。</p>
        <br>
        <p>每个电源旁有<strong>8个冻尸</strong>守护，靠近节点按 <span style="color:#ffaa00;">F</span> 激活。</p>
        <br>
        <p style="color:#88ccee;">全部激活后返回信号塔启动防御，抵御15波丧尸进攻！</p>
      `;
      btn.textContent = '🔍 开始探索';
      btn.onclick = function() { closeSnowMission(); };
      break;

    case 'radio':
      title.textContent = '📻 神秘无线电信号';
      text.innerHTML = `
        <p>收音机发出沙沙的电流声，一个断断续续的声音传来：</p>
        <br>
        <p style="color:#88ccee;font-style:italic;">"喂...喂...能听到吗？这里是<span class="highlight">幸存者基地</span>..."</p>
        <br>
        <p>"我们是一批被困在雪山中的幸存者。环境太恶劣了，无法联系到外界。而且...丧尸到处游荡，我们根本无法离开避难所。"</p>
        <br>
        <p>"这座<span class="highlight">信号塔</span>是唯一的希望！但它的电源已经被拆散，分布在地图的<span class="highlight">四个角落</span>。每个电源旁边都有一大群丧尸把守..."</p>
        <br>
        <p>"如果你能<span class="highlight">找到并开启全部四个电源</span>，我们就能启动信号塔，联系上外面的救援！拜托了！"</p>
      `;
      btn.textContent = '🔍 前往寻找电源';
      btn.onclick = function() { closeSnowMission(); };
      break;
      
    case 'allPowers':
      title.textContent = '⚡ 全部电源已激活！';
      text.innerHTML = `
        <p>收音机再次响起：</p>
        <br>
        <p style="color:#88ccee;font-style:italic;">"太好了！所有电源都上线了！"</p>
        <br>
        <p>"现在请<span class="highlight">回到信号塔</span>，启动主电源开关。信号塔一旦开启，会发出强烈的信号..."</p>
        <br>
        <p style="color:#ff8888;">"但要注意，信号会吸引周围所有的丧尸。你必须<span class="highlight">守住信号塔</span>，直到救援确认收到信号！"</p>
        <br>
        <p style="color:#ffaa44;">预计需要抵御 <span class="highlight">15波</span> 丧尸进攻。请利用你从城市带来的工事资源做好防御准备！</p>
      `;
      btn.textContent = '📡 返回信号塔启动';
      btn.onclick = function() { closeSnowMission(); };
      break;
      
    case 'towerStart':
      title.textContent = '📡 信号塔启动中...';
      text.innerHTML = `
        <p>你拉下了信号塔的主电源开关。</p>
        <br>
        <p>巨大的轰鸣声响彻雪山，信号塔顶端开始发出耀眼的蓝光。地面开始微微震动...</p>
        <br>
        <p style="color:#ff4444;">远处传来了丧尸的咆哮声——<span class="highlight">它们来了！</span></p>
        <br>
        <p>守住信号塔！<span class="highlight">15波</span>进攻后，救援就能收到信号！</p>
      `;
      btn.textContent = '⚔️ 准备战斗！';
      btn.onclick = function() {
        closeSnowMission();
        if (window.SnowMap) SnowMap.startDefense();
      };
      break;
      
    case 'complete':
      title.textContent = '🎉 信号塔防御成功！';
      text.innerHTML = `
        <p>第15波丧尸终于被击退了。信号塔发出了一阵稳定的脉冲信号...</p>
        <br>
        <p style="color:#88ccee;font-style:italic;">"收到了！我们收到你的信号了！"</p>
        <br>
        <p>"太棒了！信号塔已经稳定运行。我们终于可以联系外界了！"</p>
        <br>
        <p style="color:#44ff88;">"作为感谢，我们向你开放了<span class="highlight">新的区域坐标</span>。更多幸存者基地的信号已经被探测到..."</p>
        <br>
        <p>地图上新地点已解锁！</p>
      `;
      btn.textContent = '🗺️ 查看世界地图';
      btn.onclick = function() {
        closeSnowMission();
        if (window.WorldMap) {
          // 解锁下一个节点（灼热荒漠）
          WorldMap.unlockNode('desert');
          WorldMap.showWorldMap();
        }
      };
      break;
      
    case 'towerDestroyed':
      title.textContent = '💀 信号塔已被摧毁！';
      text.innerHTML = `
        <p style="color:#ff4444;">丧尸突破了防线，信号塔被摧毁了...</p>
        <br>
        <p>所有通讯中断，任务失败。</p>
        <br>
        <p style="color:#ffaa00;">需要重新启动防御任务，从第1波开始。</p>
      `;
      btn.textContent = '🔄 重新开始防御';
      btn.onclick = function() {
        closeSnowMission();
        if (window.SnowMap) {
          // 重置防御阶段
          SnowMap.phase = 'defend';
          SnowMap.defenseWave = 0;
          SnowMap.defenseWaveActive = false;
          SnowMap.towerHP = SNOW_MAP_CONFIG.TOWER_HP;
          SnowMap.towerMaxHP = SNOW_MAP_CONFIG.TOWER_HP;
          SnowMap.shakeIntensity = 0;
          SnowMap.shakeTimer = 0;
          SnowMap._nextWaveTimer = 0;
          // 清理旧敌人
          if (SnowMap.defenseEnemies) {
            SnowMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
            SnowMap.defenseEnemies = [];
          }
          // 恢复游戏状态
          window.gameState = 'playing';
          document.body.style.cursor = 'none';
          if (window.renderer && window.renderer.domElement) window.renderer.domElement.requestPointerLock();
          // 开始第一波
          SnowMap.nextDefenseWave();
          if (typeof showToast === 'function') showToast('🔄 防御任务重新开始', 'info');
        }
      };
      break;
  }
  
  overlay.style.display = 'flex';
};

window.closeSnowMission = function() {
  const overlay = document.getElementById('snow-mission-overlay');
  if (overlay) overlay.style.display = 'none';
  // 恢复游戏
  gameState = 'playing';
  document.body.style.cursor = 'none';
  if (renderer && renderer.domElement) renderer.domElement.requestPointerLock();
};

window.confirmSnowMission = function() {
  closeSnowMission();
};

// 更新雪山任务HUD
window.updateSnowQuestHUD = function() {
  const hud = document.getElementById('snow-quest-hud');
  const towerHud = document.getElementById('tower-hp-hud');
  
  if (!window.SnowMap || !SnowMap.active || window.currentMap !== 'snow') {
    if (hud) hud.style.display = 'none';
    if (towerHud) towerHud.style.display = 'none';
    return;
  }
  
  const questTitle = document.getElementById('snow-quest-title');
  const questObj = document.getElementById('snow-quest-objective');
  const questProg = document.getElementById('snow-quest-progress');
  
  if (hud) hud.style.display = 'block';
  
  switch(SnowMap.phase) {
    case 'explore':
      if (questTitle) questTitle.textContent = '❄️ 霜寒禁区 - 探索';
      if (questObj) questObj.textContent = SnowMap.radioInteracted ? '寻找电源' : '探索地图，找到信号塔';
      if (questProg) questProg.textContent = '';
      break;
    case 'power':
      if (questTitle) questTitle.textContent = '⚡ 寻找电源';
      if (questObj) questObj.textContent = `开启电源 ${SnowMap.activatedPowers}/${SNOW_MAP_CONFIG.POWER_COUNT}`;
      if (questProg) questProg.textContent = SnowMap.activatedPowers >= SNOW_MAP_CONFIG.POWER_COUNT ? '✅ 全部激活！返回信号塔' : '';
      break;
    case 'returnToTower':
      if (questTitle) questTitle.textContent = '📡 返回信号塔';
      if (questObj) questObj.textContent = '回到地图中央的信号塔';
      if (questProg) questProg.textContent = '';
      break;
    case 'defend':
      if (hud) hud.style.display = 'none'; // 防御时用塔血条
      // 更新塔血条HUD
      if (towerHud) {
        towerHud.style.display = 'block';
        const fill = document.getElementById('tower-hp-fill');
        const text = document.getElementById('tower-hp-text');
        if (fill) fill.style.width = (SnowMap.towerHP / SnowMap.towerMaxHP * 100) + '%';
        if (fill) {
          const pct = SnowMap.towerHP / SnowMap.towerMaxHP;
          fill.style.background = pct > 0.5 ? 'linear-gradient(90deg,#44ff44,#88ff88)' : pct > 0.25 ? 'linear-gradient(90deg,#ffaa00,#ffcc44)' : 'linear-gradient(90deg,#ff4444,#ff6666)';
        }
        if (text) text.textContent = `${Math.floor(SnowMap.towerHP)} / ${SnowMap.towerMaxHP}  |  波次 ${SnowMap.defenseWave} / ${SNOW_MAP_CONFIG.DEFENSE_WAVES}`;
      }
      return;
    case 'complete':
      if (questTitle) questTitle.textContent = '🎉 任务完成！';
      if (questObj) questObj.textContent = '信号塔已成功启动';
      if (questProg) questProg.textContent = '';
      break;
  }
  
  if (towerHud && SnowMap.phase !== 'defend') towerHud.style.display = 'none';
};

// ==================== 沙漠地图任务系统 ====================

// 沙漠任务弹窗系统
window.showDesertMissionDialog = function(type) {
  const overlay = document.getElementById('desert-mission-overlay');
  const title = document.getElementById('desert-mission-title');
  const text = document.getElementById('desert-mission-text');
  const btn = document.getElementById('desert-mission-btn');

  if (!overlay) return;

  // 暂停游戏并释放鼠标
  gameState = 'paused';
  document.body.style.cursor = 'default';
  if (document.pointerLockElement) document.exitPointerLock();

  switch(type) {
    case 'radio':
      title.textContent = '📻 前哨基地无线电';
      text.innerHTML = `
        <p>无线电中传来一个沙哑的声音：</p>
        <br>
        <p style="color:#eecc88;font-style:italic;">"这里是<span class="highlight">荒漠前哨基地</span>...我们被困住了..."</p>
        <br>
        <p>"沙漠中的怪物越来越多，我们的补给快耗尽了。基地外的<span class="highlight">联络塔</span>是唯一的对外通讯手段，但它已经损坏。"</p>
        <br>
        <p>"如果你能<span class="highlight">消灭周围的沙漠怪物</span>，保护基地完成防御，我们就能修复联络塔向外界求援！"</p>
        <br>
        <p style="color:#ffaa44;">📌 任务目标：与前哨基地的<span class="highlight">联络塔</span>交互，启动防御任务。</p>
        <p style="color:#888;font-size:12px;">提示：联络塔位于基地西南角 (-25, 25) 附近，靠近前哨站。</p>
      `;
      btn.textContent = '🔍 了解任务';
      btn.onclick = function() {
        closeDesertMission();
        // 显示任务引导标记
        if (window.DesertMap) DesertMap.showQuestMarker('tower');
        if (typeof showToast === 'function') showToast('📌 新任务：前往联络塔启动防御', 'info');
      };
      break;

    case 'defendStart':
      title.textContent = '🛡️ 基地防御开始！';
      text.innerHTML = `
        <p>你接受了前哨基地的防御任务。</p>
        <br>
        <p style="color:#ff8888;">沙漠怪物正在从四面八方涌来！它们的目标是摧毁<span class="highlight">前哨基地</span>...</p>
        <br>
        <p>你必须<span class="highlight">守住基地</span>，抵御 <span class="highlight">20波</span> 怪物进攻！</p>
        <br>
        <p style="color:#ffaa44;">利用工事资源做好防御准备，小心沙漠巨蝎的毒刺和沙虫的突袭！</p>
      `;
      btn.textContent = '⚔️ 准备战斗！';
      btn.onclick = function() {
        closeDesertMission();
        if (window.DesertMap) DesertMap.startDefense();
      };
      break;

    case 'complete':
      title.textContent = '🚁 直升机救援到达';
      text.innerHTML = `
        <p>第20波怪物终于被击退了。联络塔发出了一阵稳定的信号...</p>
        <br>
        <p style="color:#eecc88;font-style:italic;">"收到了！救援信号已发出！"</p>
        <br>
        <p>"太棒了！基地安全了。我们已联系到后方，<span class="highlight">直升机救援</span>正在赶来！"</p>
        <br>
        <p style="color:#44ff88;">请前往基地中心的<span class="highlight">停机坪</span>（绿色光圈标记处）等待直升机到达。</p>
      `;
      btn.textContent = '🚁 前往停机坪';
      btn.onclick = function() {
        closeDesertMission();
      };
      break;

    case 'towerDestroyed':
      title.textContent = '💀 前哨基地已被摧毁！';
      text.innerHTML = `
        <p style="color:#ff4444;">怪物突破了防线，前哨基地被摧毁了...</p>
        <br>
        <p>所有通讯中断，任务失败。</p>
        <br>
        <p style="color:#ffaa00;">需要重新启动防御任务，从第1波开始。</p>
      `;
      btn.textContent = '🔄 重新开始防御';
      btn.onclick = function() {
        closeDesertMission();
        if (window.DesertMap) {
          // 重置防御阶段
          DesertMap.phase = 'defend';
          DesertMap.defenseWave = 0;
          DesertMap.defenseWaveActive = false;
          DesertMap.towerHP = DESERT_MAP_CONFIG.TOWER_HP;
          DesertMap.towerMaxHP = DESERT_MAP_CONFIG.TOWER_HP;
          DesertMap.shakeIntensity = 0;
          DesertMap.shakeTimer = 0;
          DesertMap._nextWaveTimer = 0;
          // 清理旧敌人
          if (DesertMap.defenseEnemies) {
            DesertMap.defenseEnemies.forEach(e => { if (e.mesh) scene.remove(e.mesh); });
            DesertMap.defenseEnemies = [];
          }
          // 恢复游戏状态
          window.gameState = 'playing';
          document.body.style.cursor = 'none';
          if (window.renderer && window.renderer.domElement) window.renderer.domElement.requestPointerLock();
          // 开始第一波
          DesertMap.nextDefenseWave();
          if (typeof showToast === 'function') showToast('🔄 防御任务重新开始', 'info');
        }
      };
      break;
  }

  overlay.style.display = 'flex';
};

window.closeDesertMission = function() {
  const overlay = document.getElementById('desert-mission-overlay');
  if (overlay) overlay.style.display = 'none';
  // 恢复游戏
  gameState = 'playing';
  document.body.style.cursor = 'none';
  if (renderer && renderer.domElement) renderer.domElement.requestPointerLock();
};

// 关闭NPC对话面板（定义在game.js中以便访问局部变量gameState和renderer）
window.closeNPCDialog = function() {
  if (window.DesertMap) DesertMap.npcDialogOpen = false;
  const overlay = document.getElementById('npc-dialog-overlay');
  if (overlay) overlay.style.display = 'none';
  // 恢复游戏（与closeDesertMission完全一致）
  gameState = 'playing';
  document.body.style.cursor = 'none';
  if (renderer && renderer.domElement) renderer.domElement.requestPointerLock();
};

window.confirmDesertMission = function() {
  closeDesertMission();
};

// 更新沙漠任务HUD
window.updateDesertQuestHUD = function() {
  const hud = document.getElementById('desert-quest-hud');
  const baseHud = document.getElementById('base-hp-hud');

  if (!window.DesertMap || !DesertMap.active || window.currentMap !== 'desert') {
    if (hud) hud.style.display = 'none';
    if (baseHud) baseHud.style.display = 'none';
    return;
  }

  const questTitle = document.getElementById('desert-quest-title');
  const questObj = document.getElementById('desert-quest-objective');
  const questProg = document.getElementById('desert-quest-progress');

  if (hud) hud.style.display = 'block';

  switch(DesertMap.phase) {
    case 'explore':
      if (questTitle) questTitle.textContent = '🏜️ 荒漠前哨 - 探索';
      if (questObj) questObj.textContent = '探索沙漠，与NPC交互获取任务';
      if (questProg) questProg.textContent = '';
      break;
    case 'defend':
      if (hud) hud.style.display = 'none'; // 防御时用基地血条
      // 更新基地血条HUD
      if (baseHud) {
        baseHud.style.display = 'block';
        const fill = document.getElementById('base-hp-fill');
        const text = document.getElementById('base-hp-text');
        if (fill) fill.style.width = (DesertMap.towerHP / DesertMap.towerMaxHP * 100) + '%';
        if (fill) {
          const pct = DesertMap.towerHP / DesertMap.towerMaxHP;
          fill.style.background = pct > 0.5 ? 'linear-gradient(90deg,#44ff44,#88ff88)' : pct > 0.25 ? 'linear-gradient(90deg,#ffaa00,#ffcc44)' : 'linear-gradient(90deg,#ff4444,#ff6666)';
        }
        if (text) text.textContent = `${Math.floor(DesertMap.towerHP)} / ${DesertMap.towerMaxHP}  |  波次 ${DesertMap.defenseWave} / ${DESERT_MAP_CONFIG.DEFENSE_WAVES}`;
      }
      return;
    case 'complete':
      if (questTitle) questTitle.textContent = '🎉 任务完成！';
      if (questObj) questObj.textContent = '联络塔已成功修复';
      if (questProg) questProg.textContent = '';
      break;
    case 'failed':
      if (questTitle) questTitle.textContent = '💀 任务失败';
      if (questObj) questObj.textContent = '前哨基地已被摧毁';
      if (questProg) questProg.textContent = '';
      break;
  }

  if (baseHud && DesertMap.phase !== 'defend') baseHud.style.display = 'none';
};

// 雪山地图传送函数
// ==================== 地图传送系统 ====================

// 通用地图清理函数
function clearCurrentMap() {
  // 1. 清除敌人（含mesh和geometry）
  enemies.forEach(e => {
    if (e.mesh) {
      e.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) { if (Array.isArray(c.material)) c.material.forEach(m => m.dispose()); else c.material.dispose(); }});
      scene.remove(e.mesh);
    }
  });
  enemies = [];
  
  // 2. 清除子弹/导弹/敌人子弹
  bullets.forEach(b => { if (b.mesh) scene.remove(b.mesh); });
  bullets = [];
  enemyBullets.forEach(b => { if (b.mesh) scene.remove(b.mesh); });
  enemyBullets = [];
  missiles.forEach(m => { if (m.mesh) scene.remove(m.mesh); });
  missiles = [];
  
  // 3. 清除粒子/浮动文字/伤害数字
  particles.forEach(p => { if (p.mesh) scene.remove(p.mesh); });
  particles = [];
  floatingTexts.forEach(ft => { if (ft.mesh) scene.remove(ft.mesh); });
  floatingTexts = [];
  damageNumbers.forEach(dn => { if (dn.mesh) scene.remove(dn.mesh); });
  damageNumbers = [];
  
  // 4. 清除毒液区域
  if (window.poisonSprays) {
    window.poisonSprays.forEach(s => {
      if (s.particles) s.particles.forEach(p => { if (p.mesh) scene.remove(p.mesh); });
    });
    window.poisonSprays = [];
  }
  
  // 5. 清除拾取物
  pickups.forEach(p => { if (p.mesh) scene.remove(p.mesh); });
  pickups = [];
  window.pickups = pickups; // 同步引用，确保 fortifications.js 能访问
  
  // 6. 清除碰撞体
  clearColliders();
  
  // 6.5 清除区块系统（卸载所有城市建筑mesh）
  if (chunkSystem.chunks) {
    for (const [key, chunk] of chunkSystem.chunks) {
      if (chunk.meshes) chunk.meshes.forEach(mesh => scene.remove(mesh));
    }
    chunkSystem.chunks.clear();
  }
  
  // 7. 清除工事
  if (window.FortificationSystem && typeof FortificationSystem.cleanup === 'function') {
    FortificationSystem.cleanup();
  }
  window.deployedFortifications = [];
  
  // 8. 清除空投
  if (window.airdropCrates) {
    window.airdropCrates.forEach(c => { if (c.mesh) scene.remove(c.mesh); });
    window.airdropCrates = [];
  }
  
  // 9. 清除传送门
  cityPortals.forEach(p => scene.remove(p));
  cityPortals = [];
  portalsActivated = false;
  
  // 10. 清除城市建筑和道路（buildings数组）
  buildings.forEach(b => {
    if (b && b.parent) {
      b.traverse(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      });
      scene.remove(b);
    }
  });
  buildings = [];
  
  // 11. 清除城市地面mesh（如果有）
  scene.traverse(child => {
    if (child.name === 'cityGround' || child.name === 'cityRoad') {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
      scene.remove(child);
    }
  });
  
  // 12. 清理各地图专用怪物数组
  if (window.SnowMap && SnowMap.wanderZombies) {
    SnowMap.wanderZombies.forEach(z => {
      if (z && z.mesh && z.mesh.parent) {
        z.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) { if (Array.isArray(c.material)) c.material.forEach(m => m.dispose()); else c.material.dispose(); }});
        scene.remove(z.mesh);
      }
    });
    SnowMap.wanderZombies = [];
  }
  if (window.DesertMap && DesertMap.desertMonsters) {
    DesertMap.desertMonsters.forEach(m => {
      if (m && m.mesh && m.mesh.parent) {
        m.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) { if (Array.isArray(c.material)) c.material.forEach(mat => mat.dispose()); else c.material.dispose(); }});
        scene.remove(m.mesh);
      }
    });
    DesertMap.desertMonsters = [];
  }
  if (window.DesertMap && DesertMap.monsterParticles) {
    DesertMap.monsterParticles.forEach(p => { if (p && p.parent) scene.remove(p); });
    DesertMap.monsterParticles = [];
  }
  if (window.DesertMap && DesertMap.poisonPools) {
    DesertMap.poisonPools.forEach(p => { if (p && p.parent) scene.remove(p); });
    DesertMap.poisonPools = [];
  }
  if (window.SwampMap && SwampMap.mutants) {
    SwampMap.mutants.forEach(m => {
      if (m && m.mesh && m.mesh.parent) {
        m.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) { if (Array.isArray(c.material)) c.material.forEach(mat => mat.dispose()); else c.material.dispose(); }});
        scene.remove(m.mesh);
      }
    });
    SwampMap.mutants = [];
  }

  // 13. 保存并清理队友（伙伴）
  window._savedAlliesData = allies.map(a => ({
    name: a.name,
    level: a.level || 1,
    hp: a.hp,
    maxHp: a.maxHp,
    damage: a.damage,
    speed: a.speed,
    fireRate: a.fireRate,
    isMedic: a.isMedic || false,
    dead: a.dead || false,
    state: a.state || 'follow'
  }));
  allies.forEach(a => {
    if (a.mesh) {
      a.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) { if (Array.isArray(c.material)) c.material.forEach(m => m.dispose()); else c.material.dispose(); }});
      scene.remove(a.mesh);
    }
  });
  allies = [];
  window.allies = allies;

  // 14. 重置波次状态
  waveActive = false;
  waveTimer = 0;
}

// 恢复保存的队友到当前地图
function respawnSavedAllies() {
  if (!window._savedAlliesData || window._savedAlliesData.length === 0) return;
  const saved = window._savedAlliesData;
  window._savedAlliesData = null; // 清空，避免重复恢复

  for (const data of saved) {
    if (data.dead) continue; // 死亡的队友不恢复
    // 用保存的等级重新生成队友
    for (let i = 1; i < data.level; i++) {
      // 先创建1级队友，然后升级
      spawnAlly(null, data.name);
      // spawnAlly 如果返回 'upgraded' 说明升级了现有队友
    }
    // 创建最终等级的队友
    const result = spawnAlly(null, data.name);
    if (result === true || result === 'upgraded') {
      // 恢复血量（不超过maxHp）
      const ally = allies.find(a => a.name === data.name);
      if (ally) {
        ally.hp = Math.min(data.hp, ally.maxHp);
      }
    }
  }
}

// 强制移除所有已知地图mesh（城市+雪山+沙漠）
function forceRemoveAllMapMeshes() {
  // 先收集所有要移除的对象（避免遍历中修改）
  const toRemove = [];
  const collect = (obj) => {
    if (obj.name && (
      // 城市地图
      obj.name === 'cityGround' || obj.name === 'cityRoad' ||
      obj.name === 'ground' || obj.name === 'road' || obj.name === 'building' ||
      obj.name === 'chunk_building' || obj.name === 'cityPortal' || obj.name === 'rail' ||
      obj.name === 'cityCar' || obj.name === 'cityLamp' ||
      // 雪山地图
      obj.name === 'snowGround' || obj.name === 'signalTower' ||
      obj.name === 'radio' || obj.name === 'returnPortal' ||
      obj.name === 'snowRoad' || obj.name === 'snowRail' ||
      obj.name.startsWith('powerNode_') ||
      obj.name === 'wanderZombie' || obj.name === 'snowZombie' ||
      obj.name === 'snowPile' || obj.name === 'rock' ||
      obj.name === 'deadTree' || obj.name === 'abandonedCabin' ||
      obj.name === 'iceWall' || obj.name === 'fallenPole' ||
      obj.name === 'snowman' || obj.name === 'supplyCrate' ||
      obj.name === 'abandonedCar' || obj.name === 'gasStation' ||
      // 沙漠地图
      obj.name === 'desertTerrain' || obj.name === 'baseWall' ||
      obj.name === 'baseGate' || obj.name === 'contactTower' ||
      obj.name === 'waterPoint' || obj.name === 'supplyBox' ||
      obj.name === 'frontBuilding' || obj.name === 'desertZombie' ||
      obj.name === 'desertCactus' || obj.name === 'desertRock' ||
      obj.name === 'desertHouse' || obj.name === 'desertOutpost' || obj.name === 'building_block',
      // 海岛地图（使用startsWith匹配前缀）
      obj.name.startsWith('island') ||
      obj.name.startsWith('cmd_') || obj.name.startsWith('barracks_') ||
      obj.name.startsWith('warehouse_') || obj.name.startsWith('dock_') ||
      obj.name.startsWith('boat_') || obj.name.startsWith('hut_') ||
      obj.name.startsWith('pad_') || obj.name.startsWith('tower_') ||
      obj.name.startsWith('bunker_') || obj.name.startsWith('palm') ||
      obj.name.startsWith('pine') || obj.name.startsWith('npc_') ||
      obj.name.startsWith('frogman_') || obj.name.startsWith('fisherman_') ||
      obj.name.startsWith('bike_') || obj.name.startsWith('forklift_') ||
      // 沼泽地图（使用startsWith匹配前缀）
      obj.name.startsWith('swamp') || obj.name.startsWith('mud') ||
      obj.name.startsWith('rotting') || obj.name.startsWith('groundMoss') ||
      obj.name.startsWith('poisonFog') || obj.name.startsWith('deadTree') ||
      obj.name.startsWith('mutant_') || obj.name.startsWith('frogman_') ||
      obj.name.startsWith('spitter_') || obj.name.startsWith('zombie_') ||
      obj.name.startsWith('radiationSign') || obj.name.startsWith('treeMoss') ||
      obj.name.startsWith('vineFruit') || obj.name.startsWith('swampLightning')
    )) {
      toRemove.push(obj);
    }
    if (obj.children) {
      for (let i = 0; i < obj.children.length; i++) {
        collect(obj.children[i]);
      }
    }
  };
  collect(scene);

  toRemove.forEach(obj => {
    if (obj.parent) obj.parent.remove(obj);
    // 递归dispose所有子对象（Group内部的mesh也需要清理）
    obj.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
  });
  if (toRemove.length > 0) {
    console.log('[MapCleanup] 强制清理了', toRemove.length, '个地图对象');
  }
}

// 显示加载过渡界面
function showLoadingScreen(text) {
  let overlay = document.getElementById('map-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'map-loading-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:10000;display:flex;flex-direction:column;justify-content:center;align-items:center;';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="font-size:28px;color:#88ccee;margin-bottom:20px;">${text}</div>
    <div style="width:200px;height:4px;background:#333;border-radius:2px;overflow:hidden;">
      <div id="loading-bar-fill" style="width:0%;height:100%;background:linear-gradient(90deg,#4488aa,#88ccee);border-radius:2px;transition:width 0.3s;"></div>
    </div>
    <div id="loading-status" style="color:#668899;font-size:13px;margin-top:12px;">正在清理旧地图...</div>
  `;
  overlay.style.display = 'flex';
  return overlay;
}

function updateLoadingScreen(pct, status) {
  const fill = document.getElementById('loading-bar-fill');
  const text = document.getElementById('loading-status');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = status;
}

function hideLoadingScreen() {
  const overlay = document.getElementById('map-loading-overlay');
  if (overlay) overlay.style.display = 'none';
}

window.travelToSnowMap = function() {
  if (gameState !== 'playing') return;
  
  // 暂停游戏
  gameState = 'loading';
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.style.cursor = 'default';
  
  // 保存城市波次进度
  if (window.WorldMap) {
    const data = WorldMap.getData();
    const cityNode = data.nodes.find(n => n.id === 'city');
    if (cityNode) cityNode.currentWave = wave;
  }
  
  // 显示加载界面
  showLoadingScreen('❄️ 正在前往 霜寒禁区');
  
  // 分步清理和加载（使用setTimeout让UI有时间更新）
  setTimeout(() => {
    updateLoadingScreen(20, '正在清理旧地图...');
    
    setTimeout(() => {
      // 彻底清理旧地图（注意：不要设置active=false再调用cleanup，cleanup内部会处理）
      if (window.DesertMap) {
        DesertMap.cleanup();
      }
      if (window.IslandBase) {
        IslandBase.cleanup();
      }
      if (window.SwampMap) {
        SwampMap.cleanup();
      }
      clearCurrentMap();
      
      // 强制移除所有已知地图mesh
      forceRemoveAllMapMeshes();
      
      updateLoadingScreen(50, '正在生成雪山地形...');
      
      setTimeout(() => {
        // 切换地图状态
        window.currentMap = 'snow';
        wave = 0;
        
        // 初始化雪山
        if (window.SnowMap) {
          SnowMap.init();
          SnowMap.active = true;
          SnowMap.generateTerrain();
          SnowMap.startExplore();
        }
        
        updateLoadingScreen(80, '正在加载天气系统...');
        
        setTimeout(() => {
          // 设置天气为暴雪（延迟执行，避免阻塞）
          try {
            if (window.WeatherSystem) {
              WeatherSystem.changeWeather('snow');
            }
          } catch(e) {
            console.warn('[SnowMap] 天气设置跳过:', e);
          }
          
          // 传送玩家到雪山出生点
          const spawnH = SnowMap.getTerrainHeight(0, SNOW_MAP_CONFIG.MAP_SIZE - 30);
          camera.position.set(0, spawnH + 2, SNOW_MAP_CONFIG.MAP_SIZE - 30);
          
          // 统一切换HUD
          switchMapHUD('snow');

          // 显示雪地初始任务提示
          setTimeout(() => {
            if (typeof window.showSnowMissionDialog === 'function') {
              window.showSnowMissionDialog('explore');
            }
          }, 1500);

          updateLoadingScreen(100, '加载完成！');
          
          setTimeout(() => {
            hideLoadingScreen();
            gameState = 'playing';
            document.body.style.cursor = 'none';
            if (renderer && renderer.domElement) {
              renderer.domElement.requestPointerLock();
            }
            if (typeof showToast === 'function') {
              showToast('❄️ 已传送至 霜寒禁区', 'info');
            }
            // 保存当前地图到存档
          if (window.WorldMap && typeof WorldMap.saveData === 'function') {
            window.currentMap = 'snow';
            WorldMap.saveData();
          }

          // 停止当前BGM再播放
          if (window.AudioSystem) {
            AudioSystem.stopBGM();
            AudioSystem.stopBackgroundMusic();
            AudioSystem.playMapBGM('snow');
          }
        }, 300);
        }, 500);
        }, 300);
      }, 300);
  }, 100);
};

window.travelToCityMap = function() {
  if (gameState !== 'playing') return;
  
  // 暂停游戏
  gameState = 'loading';
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.style.cursor = 'default';
  
  // 保存雪山波次进度
  if (window.WorldMap && window.SnowMap) {
    const data = WorldMap.getData();
    const snowNode = data.nodes.find(n => n.id === 'snow');
    if (snowNode) snowNode.currentWave = SnowMap.defenseWave;
  }
  
  showLoadingScreen('🏙️ 正在返回 废弃城市');
  
  setTimeout(() => {
    updateLoadingScreen(20, '正在清理雪山...');
    
    setTimeout(() => {
      // 彻底清理旧地图（注意：不要设置active=false再调用cleanup，cleanup内部会处理）
      if (window.SnowMap) {
        SnowMap.cleanup();
      }
      if (window.DesertMap) {
        DesertMap.cleanup();
      }
      if (window.IslandBase) {
        IslandBase.cleanup();
      }
      if (window.SwampMap) {
        SwampMap.cleanup();
      }
      clearCurrentMap();
      forceRemoveAllMapMeshes();
      
      updateLoadingScreen(50, '正在恢复城市地图...');
      
      setTimeout(() => {
        // 重新生成城市地图（地面、道路、建筑）
        generateMap();
        
        // 重新生成城市传送门
        generateCityPortals();
        
        // 切换地图状态
        window.currentMap = 'city';
        
        // 恢复城市波次
        if (window.WorldMap) {
          const data = WorldMap.getData();
          const cityNode = data.nodes.find(n => n.id === 'city');
          if (cityNode && cityNode.currentWave > 0) {
            wave = cityNode.currentWave;
          }
        }
        
        updateLoadingScreen(80, '正在恢复天气...');
        
        setTimeout(() => {
          // 恢复天气
          try {
            if (window.WeatherSystem) WeatherSystem.changeWeather('clear');
          } catch(e) {
            console.warn('[CityMap] 天气恢复跳过:', e);
          }
          
          // 传送玩家回城市
          camera.position.set(0, 5, 0);
          
          // 统一切换HUD
          switchMapHUD('city');

          updateLoadingScreen(100, '加载完成！');
          
          setTimeout(() => {
            hideLoadingScreen();
            gameState = 'playing';
            document.body.style.cursor = 'none';
            if (renderer && renderer.domElement) {
              renderer.domElement.requestPointerLock();
            }
            if (typeof showToast === 'function') {
              showToast('🏙️ 已返回 废弃城市', 'info');
            }
            // 保存当前地图到存档
            if (window.WorldMap && typeof WorldMap.saveData === 'function') {
              window.currentMap = 'city';
              WorldMap.saveData();
            }

            // 停止当前BGM，播放城市BGM
            if (window.AudioSystem) {
              AudioSystem.stopBGM();
              AudioSystem.stopBackgroundMusic();
              setTimeout(() => AudioSystem.playBGM(), 300);
            }
          }, 500);
        }, 300);
      }, 300);
    }, 300);
  }, 100);
};

window.travelToDesertMap = function() {
  if (gameState !== 'playing') return;
  
  // 暂停游戏
  gameState = 'loading';
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.style.cursor = 'default';
  
  // 保存当前地图波次进度
  if (window.WorldMap) {
    const data = WorldMap.getData();
    if (window.SnowMap && window.SnowMap.active) {
      const snowNode = data.nodes.find(n => n.id === 'snow');
      if (snowNode) snowNode.currentWave = SnowMap.defenseWave;
    } else {
      const cityNode = data.nodes.find(n => n.id === 'city');
      if (cityNode) cityNode.currentWave = wave;
    }
  }
  
  // 显示加载界面
  showLoadingScreen('🏜️ 正在前往 灼热荒漠');
  
  // 分步清理和加载
  setTimeout(() => {
    updateLoadingScreen(20, '正在清理旧地图...');
    
    setTimeout(() => {
      // 清理旧地图（注意：不要设置active=false再调用cleanup，cleanup内部会处理）
      if (window.SnowMap) {
        SnowMap.cleanup();
      }
      if (window.DesertMap) {
        DesertMap.cleanup();
      }
      if (window.IslandBase) {
        IslandBase.cleanup();
      }
      if (window.SwampMap) {
        SwampMap.cleanup();
      }
      clearCurrentMap();
      forceRemoveAllMapMeshes();
      
      updateLoadingScreen(50, '正在生成荒漠地形...');
      
      setTimeout(() => {
        // 切换地图状态
        window.currentMap = 'desert';
        wave = 0;
        
        // 初始化荒漠
        console.log('[travelToDesertMap] scene=', typeof scene, 'DesertMap=', typeof DesertMap);
        if (window.DesertMap) {
          DesertMap.init(scene, camera);
          DesertMap.active = true;
          DesertMap.generateTerrain();
        }
        
        updateLoadingScreen(80, '正在加载环境...');
        
        setTimeout(() => {
          // 设置天气为晴朗（荒漠）
          try {
            if (window.WeatherSystem) {
              WeatherSystem.changeWeather('clear');
            }
          } catch(e) {
            console.warn('[DesertMap] 天气设置跳过:', e);
          }
          
          // 传送玩家到荒漠出生点（基地内部）
          camera.position.set(0, 2, 0);
          console.log('[travelToDesertMap] 玩家位置已设置:', camera.position.x, camera.position.y, camera.position.z);
          
          // 统一切换HUD
          switchMapHUD('desert');

          // 显示沙漠初始任务提示
          setTimeout(() => {
            if (typeof window.showDesertMissionDialog === 'function') {
              window.showDesertMissionDialog('radio');
            }
          }, 1500);

          updateLoadingScreen(100, '加载完成！');
          
          setTimeout(() => {
            hideLoadingScreen();
            gameState = 'playing';
            document.body.style.cursor = 'none';
            if (renderer && renderer.domElement) {
              renderer.domElement.requestPointerLock();
            }
            if (typeof showToast === 'function') {
              showToast('🏜️ 已传送至 灼热荒漠', 'info');
            }
            // 保存当前地图到存档
            if (window.WorldMap && typeof WorldMap.saveData === 'function') {
              window.currentMap = 'desert';
              WorldMap.saveData();
            }

            // 停止当前BGM并播放荒漠BGM
            if (window.AudioSystem) {
              AudioSystem.playMapBGM('desert');
            }
          }, 300);
        }, 500);
      }, 300);
    }, 300);
  }, 100);
};

// 前往孤岛基地
window.travelToIslandMap = function() {
  if (!window.IslandBase) {
    if (typeof showToast === 'function') showToast('❌ 孤岛基地未解锁', 'error');
    return;
  }
  gameState = 'loading';
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.style.cursor = 'default';
  showLoadingScreen('🏝️ 正在前往 孤岛基地');
  updateLoadingScreen(20, '正在清理旧地图...');

  setTimeout(() => {
    // 清理当前地图（注意：不要设置active=false再调用cleanup，cleanup内部会处理）
    if (window.SnowMap) { SnowMap.cleanup(); }
    if (window.DesertMap) { DesertMap.cleanup(); }
    if (window.SwampMap) { SwampMap.cleanup(); }
    if (typeof clearCurrentMap === 'function') clearCurrentMap();
    forceRemoveAllMapMeshes();

    updateLoadingScreen(50, '正在生成海岛地形...');

    setTimeout(() => {
      // 使用MapManager切换地图
      if (window.MapManager && typeof MapManager.switchTo === 'function') {
        MapManager.switchTo('island');
      } else {
        window.currentMap = 'island';
        IslandBase.init(scene, camera, renderer);
        IslandBase.generate();
      }

      updateLoadingScreen(80, '正在加载环境...');

      setTimeout(() => {
        // 设置天气为晴朗
        try {
          if (window.WeatherSystem) WeatherSystem.changeWeather('clear');
        } catch(e) {}

        // 传送玩家到海岛出生点（眼睛高度1.7，地面在y=0）
        camera.position.set(0, 1.7, 0);

        // 统一切换HUD
        switchMapHUD('island');

        updateLoadingScreen(100, '加载完成！');

        setTimeout(() => {
          hideLoadingScreen();
          gameState = 'playing';
          document.body.style.cursor = 'none';
          if (renderer && renderer.domElement) {
            renderer.domElement.requestPointerLock();
          }
          if (typeof showToast === 'function') {
            showToast('🏝️ 已传送至 孤岛基地', 'info');
          }
          if (window.WorldMap && typeof WorldMap.saveData === 'function') {
            window.currentMap = 'island';
            WorldMap.saveData();
          }
          // 播放海岛专属BGM（原子切换：一次性停止所有旧BGM并启动新BGM）
          if (window.AudioSystem) {
            AudioSystem.playMapBGM('island');
          }
        }, 300);
      }, 500);
    }, 300);
  }, 100);
};

// 前往毒雾沼泽
window.travelToSwampMap = function() {
  if (!window.SwampMap) {
    if (typeof showToast === 'function') showToast('❌ 毒雾沼泽未解锁', 'error');
    return;
  }
  gameState = 'loading';
  if (document.pointerLockElement) document.exitPointerLock();
  document.body.style.cursor = 'default';
  showLoadingScreen('🌿 正在前往 毒雾沼泽');
  updateLoadingScreen(20, '正在清理旧地图...');

  setTimeout(() => {
    // 清理当前地图（注意：不要设置active=false再调用cleanup，cleanup内部会处理）
    if (window.SnowMap) { SnowMap.cleanup(); }
    if (window.DesertMap) { DesertMap.cleanup(); }
    if (window.IslandBase) { IslandBase.cleanup(); }
    if (typeof clearCurrentMap === 'function') clearCurrentMap();
    forceRemoveAllMapMeshes();

    updateLoadingScreen(50, '正在生成沼泽地形...');

    setTimeout(() => {
      // 使用MapManager切换地图
      if (window.MapManager && typeof MapManager.switchTo === 'function') {
        MapManager.switchTo('swamp');
      } else {
        window.currentMap = 'swamp';
        SwampMap.init(scene, camera, renderer);
        SwampMap.generate();
      }

      updateLoadingScreen(80, '正在加载环境...');

      setTimeout(() => {
        // 设置天气为雾
        try {
          if (window.WeatherSystem) WeatherSystem.changeWeather('fog');
        } catch(e) {}

        // 传送玩家到沼泽出生点
        camera.position.set(0, 2, 0);

        // 统一切换HUD
        switchMapHUD('swamp');

        // 沼泽初始状态
        if (window.SwampMap) {
          SwampMap.phase = 'explore';
          SwampMap.defenseStartTimer = 30;
        }

        updateLoadingScreen(100, '加载完成！');

        setTimeout(() => {
          hideLoadingScreen();
          gameState = 'playing';
          document.body.style.cursor = 'none';
          if (renderer && renderer.domElement) {
            renderer.domElement.requestPointerLock();
          }
          if (typeof showToast === 'function') {
            showToast('🌿 已传送至 毒雾沼泽', 'info');
          }
          if (window.WorldMap && typeof WorldMap.saveData === 'function') {
            window.currentMap = 'swamp';
            WorldMap.saveData();
          }
          // 停止当前BGM，播放沼泽BGM
          if (window.AudioSystem) {
            AudioSystem.stopBGM();
            AudioSystem.stopBackgroundMusic();
            AudioSystem.playMapBGM('swamp');
          }
        }, 300);
      }, 500);
    }, 300);
  }, 100);
};

// 在animate循环中调用雪山更新
const _origAnimate = animate;
// 注意：不能覆盖animate，改为在updateAllies之后添加雪山更新调用