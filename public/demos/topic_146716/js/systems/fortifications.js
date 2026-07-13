// 防御工事系统
// 版本: 1.0

// 确认脚本加载
console.log('[工事系统] fortifications.js 开始加载');

// 已部署的工事（暴露到window供game.js访问）
window.deployedFortifications = [];

// 子弹数组
let turretBullets = [];

// 无人机数组
let activeDrones = [];

// 预览工事相关
let previewMesh = null;
let previewValid = false;
let previewRotation = 0; // 预览旋转角度（弧度）
let previewFortType = null; // 当前预览的工事类型（切换时重建）

// 工事移动模式
let movingFort = null; // 正在移动的工事对象
let movingFortOrigPos = null; // 移动前的原始位置
let movingFortOrigRot = null; // 移动前的原始旋转
const SNAP_DISTANCE = 2.5; // 吸附距离

// 工事定义
const FORTIFICATION_DEFS = {
  barricade_wood: {
    name: '木栅栏',
    icon: '🧱',
    health: 500,
    cost: 20,
    type: 'barricade',
    description: '阻挡僵尸移动，可攀爬',
    size: 2,
    color: 0x8B4513
  },
  barricade_wire: {
    name: '铁丝网',
    icon: '🕸',
    health: 300,
    cost: 30,
    type: 'barricade',
    description: '减速50%+持续伤害',
    size: 2,
    color: 0x708090,
    effect: { slow: 0.5, damage: 2 }
  },
  mine: {
    name: '地雷',
    icon: '💥',
    health: 1,
    cost: 5,
    type: 'trap',
    description: '触发爆炸，150伤害，范围5米',
    size: 0.5,
    color: 0x8B0000,
    damage: 150,
    triggerRadius: 5
  },
  turret_mg: {
    name: '机枪塔',
    icon: '🔫',
    health: 800,
    cost: 80,
    type: 'turret',
    description: '自动射击最近敌人',
    size: 1.5,
    color: 0x2F4F4F,
    damage: 15,
    fireRate: 0.1,
    range: 25
  },
  turret_electric: {
    name: '激光塔',
    icon: '⚡',
    health: 600,
    cost: 100,
    type: 'turret',
    description: '低攻速高攻击，50%最大生命值伤害',
    size: 1.5,
    color: 0x4169E1,
    damage: 150,
    fireRate: 2.5,
    range: 20
  },
  turret_shotgun: {
    name: '霰弹塔',
    icon: '📦',
    health: 600,
    cost: 100,
    type: 'turret',
    description: '近距离范围伤害，12×6弹丸',
    size: 1.5,
    color: 0x8B4513,
    damage: 12,
    pelletCount: 6,
    fireRate: 0.8,
    range: 15
  },
  turret_sniper: {
    name: '狙击塔',
    icon: '🔭',
    health: 500,
    cost: 120,
    type: 'turret',
    description: '超远距离穿透攻击，60伤害',
    size: 1.5,
    color: 0x2E8B57,
    damage: 60,
    fireRate: 2.0,
    range: 60,
    pierce: true // 穿透攻击
  },
  turret_drone: {
    name: '无人机塔',
    icon: '🚁',
    health: 400,
    cost: 150,
    type: 'drone', // 特殊类型
    description: '生产无人机撞击僵尸造成范围伤害',
    size: 1.5,
    color: 0x9370DB,
    damage: 80, // 无人机撞击伤害
    fireRate: 8.0, // 生产间隔
    range: 40, // 无人机索敌范围
    droneSpeed: 15,
    blastRadius: 3
  },
  robo_dog: {
    name: '机器柴犬',
    icon: '🐕',
    health: 200,
    cost: 60,
    type: 'robo_dog', // 特殊类型：移动拾取
    description: '自动全图拾取资源，无视地形',
    size: 0.5,
    color: 0xD4A574, // 柴犬基础色 - 浅棕色
    speed: 5 // 移动速度降低到5
  }
};

// 已部署的工事使用 window.window.deployedFortifications

// ============================================================
// 统一零件管理 - 唯一数据源为 ShelterSystem
// ============================================================

// 获取当前零件数（从避难所读取，保证唯一数据源）
function getParts() {
  let base = 0;
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getData) {
    try {
      const shelterData = ShelterSystem.getData();
      if (shelterData && shelterData.resources) {
        base = shelterData.resources.parts || 0;
      }
    } catch(e) {}
  }
  // 加上调试命令的临时资源加成
  if (typeof debugResourceBonus !== 'undefined') {
    base += debugResourceBonus.parts || 0;
  }
  return base;
}

// 设置零件数（同步到避难所）
function setParts(amount) {
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getData && ShelterSystem.save) {
    try {
      const shelterData = ShelterSystem.getData();
      if (shelterData && shelterData.resources) {
        // 获取上限
        let maxParts = 500;
        if (typeof ShelterSystem.getMaxStorage === 'function') {
          const maxStorage = ShelterSystem.getMaxStorage();
          maxParts = maxStorage.parts || 500;
        }
        shelterData.resources.parts = Math.max(0, Math.min(amount, maxParts));
        ShelterSystem.save();
      }
    } catch(e) {}
  }
}

// 初始化工事系统
function initFortificationSystem() {
  window.deployedFortifications = [];
  // 零件数据直接从避难所读取，无需本地副本
}

// 获取工事定义
function getFortificationDefs() {
  return FORTIFICATION_DEFS;
}

// 添加零件（同步到避难所，受上限限制）
function addBattleParts(amount) {
  const current = getParts();
  setParts(current + amount);
  updateFortificationUI();
}

// 从避难所同步零件数到战场（已废弃，保留兼容）
function syncPartsFromShelter() {
  // 零件始终从避难所实时读取，无需同步
  updateFortificationUI();
}

// 部署工事
function deployFortification(type, position) {
  const def = FORTIFICATION_DEFS[type];
  if (!def) return { success: false, message: '未知工事类型' };
  
  // 检查零件
  if (getParts() < def.cost) {
    return { success: false, message: `零件不足，需要${def.cost}` };
  }
  
  // 检查距离（只比较水平距离，忽略Y轴差异）
  const playerPos = camera.position;
  const dx = position.x - playerPos.x;
  const dz = position.z - playerPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 0.5 || dist > 20) {
    return { success: false, message: '距离不合适（0.5-20米）' };
  }
  
  // 检查地形：y必须在-0.5到100米范围内（支持地面、屋顶、各种平台）
  if (position.y < -0.5 || position.y > 100) {
    return { success: false, message: '必须部署在地面或建筑物上' };
  }
  
  // 检查重叠（允许相邻，但不能完全重叠）
  for (const fort of window.deployedFortifications) {
    const dist = fort.mesh.position.distanceTo(position);
    if (dist < 0.5) {
      return { success: false, message: '位置已被占用' };
    }
  }
  
  // 扣除零件（同步到避难所）
  setParts(getParts() - def.cost);
  
  // 创建工事
  const fort = createFortificationMesh(type, position);
  // 应用预览旋转角度
  fort.mesh.rotation.y = previewRotation;
  window.deployedFortifications.push(fort);
  scene.add(fort.mesh);
  
  // 播放建造音效
  AudioSystem.playSound('build');
  
  updateFortificationUI();
  // 标记流场需要重建（障碍物变化）
  if (window.FlowField) FlowField.markDirty();
  return { success: true, message: '部署成功' };
}

// 创建工事模型
function createFortificationMesh(type, position) {
  const def = FORTIFICATION_DEFS[type];
  const group = new THREE.Group();
  
  // 根据类型创建不同模型
  if (def.type === 'barricade') {
    // 路障 - 长方体
    const geometry = new THREE.BoxGeometry(def.size, 1.5, 0.3);
    const material = new THREE.MeshLambertMaterial({ color: def.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.75;
    mesh.castShadow = true;
    group.add(mesh);
    
    // 铁丝网特效
    if (type === 'barricade_wire') {
      const wireGeo = new THREE.BoxGeometry(def.size + 0.2, 1.7, 0.4);
      const wireMat = new THREE.MeshBasicMaterial({ 
        color: 0xC0C0C0, 
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      wireMesh.position.y = 0.75;
      group.add(wireMesh);
    }
    
    // 路障血条
    const hpBarGroup = new THREE.Group();
    hpBarGroup.name = 'healthBar';
    hpBarGroup.position.y = 1.8;
    
    const hpBgGeo = new THREE.PlaneGeometry(def.size * 0.8, 0.08);
    const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
    const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
    hpBarGroup.add(hpBg);
    
    const hpFgGeo = new THREE.PlaneGeometry(def.size * 0.8 - 0.04, 0.06);
    const hpFgMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, side: THREE.DoubleSide });
    const hpFg = new THREE.Mesh(hpFgGeo, hpFgMat);
    hpFg.name = 'healthBarFill';
    hpFg.position.z = 0.001;
    hpBarGroup.add(hpFg);
    
    // 血量数字
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${def.health}/${def.health}`, 32, 16);
    const textTexture = new THREE.CanvasTexture(canvas);
    const textGeo = new THREE.PlaneGeometry(0.6, 0.3);
    const textMat = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, side: THREE.DoubleSide });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.name = 'healthText';
    textMesh.position.y = 0.25;
    hpBarGroup.add(textMesh);
    
    group.add(hpBarGroup);
  } else if (def.type === 'turret') {
    // 炮塔 - 圆柱体底座 + 长方体枪管
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 1, 8);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.5;
    base.castShadow = true;
    group.add(base);
    
    const gunGeo = new THREE.BoxGeometry(0.3, 0.3, 1.2);
    const gunMat = new THREE.MeshLambertMaterial({ color: def.color });
    const gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.y = 1;
    gun.position.z = 0.4;
    group.add(gun);
    
    // 炮塔头部（旋转部分）
    const headGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8);
    const headMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.1;
    group.add(head);
    
    // 炮塔血条（小型）
    const healthBarGroup = new THREE.Group();
    healthBarGroup.name = 'healthBar';
    healthBarGroup.position.y = 1.8;
    
    // 血条背景
    const bgGeo = new THREE.PlaneGeometry(0.8, 0.08);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    healthBarGroup.add(bgMesh);
    
    // 血条前景
    const fgGeo = new THREE.PlaneGeometry(0.76, 0.06);
    const fgMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, side: THREE.DoubleSide });
    const fgMesh = new THREE.Mesh(fgGeo, fgMat);
    fgMesh.name = 'healthBarFill';
    fgMesh.position.z = 0.001;
    healthBarGroup.add(fgMesh);
    
    // 血量数字（小型）
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${def.health}/${def.health}`, 64, 16);
    const textTexture = new THREE.CanvasTexture(canvas);
    const textGeo = new THREE.PlaneGeometry(0.6, 0.3);
    const textMat = new THREE.MeshBasicMaterial({ map: textTexture, transparent: true, side: THREE.DoubleSide });
    const textMesh = new THREE.Mesh(textGeo, textMat);
    textMesh.name = 'healthText';
    textMesh.position.y = 0.25;
    healthBarGroup.add(textMesh);
    
    group.add(healthBarGroup);
  } else if (def.type === 'trap') {
    // 陷阱 - 扁平圆柱体
    const geometry = new THREE.CylinderGeometry(def.size, def.size, 0.1, 16);
    const material = new THREE.MeshLambertMaterial({ color: def.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.05;
    group.add(mesh);

    // 地雷警示标志
    if (type === 'mine') {
      const signGeo = new THREE.ConeGeometry(0.15, 0.3, 4);
      const signMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.y = 0.2;
      group.add(sign);
    }
  } else if (def.type === 'drone') {
    // 无人机塔底座
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.8, 8);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.4;
    base.castShadow = true;
    group.add(base);

    // 停机坪
    const padGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 8);
    const padMat = new THREE.MeshLambertMaterial({ color: def.color });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.85;
    group.add(pad);

    // 天线
    const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4);
    const antMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const ant = new THREE.Mesh(antGeo, antMat);
    ant.position.y = 1.2;
    group.add(ant);

    // 信号灯
    const lightGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const lightMat = new THREE.MeshLambertMaterial({ color: 0x00FF00, emissive: 0x00FF00, emissiveIntensity: 0.5 });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.y = 1.5;
    group.add(light);

    // 无人机塔血条
    const droneHealthBarGroup = new THREE.Group();
    droneHealthBarGroup.name = 'healthBar';
    droneHealthBarGroup.position.y = 1.8;

    const dBgGeo = new THREE.PlaneGeometry(0.8, 0.08);
    const dBgMat = new THREE.MeshBasicMaterial({ color: 0x333333, side: THREE.DoubleSide });
    const dBgMesh = new THREE.Mesh(dBgGeo, dBgMat);
    droneHealthBarGroup.add(dBgMesh);

    const dFgGeo = new THREE.PlaneGeometry(0.76, 0.06);
    const dFgMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, side: THREE.DoubleSide });
    const dFgMesh = new THREE.Mesh(dFgGeo, dFgMat);
    dFgMesh.name = 'healthBarFill';
    dFgMesh.position.z = 0.001;
    droneHealthBarGroup.add(dFgMesh);

    const dCanvas = document.createElement('canvas');
    dCanvas.width = 128;
    dCanvas.height = 32;
    const dCtx = dCanvas.getContext('2d');
    dCtx.fillStyle = 'white';
    dCtx.font = 'bold 16px Arial';
    dCtx.textAlign = 'center';
    dCtx.textBaseline = 'middle';
    dCtx.fillText(`${def.health}/${def.health}`, 64, 16);
    const dTextTexture = new THREE.CanvasTexture(dCanvas);
    const dTextGeo = new THREE.PlaneGeometry(0.6, 0.3);
    const dTextMat = new THREE.MeshBasicMaterial({ map: dTextTexture, transparent: true, side: THREE.DoubleSide });
    const dTextMesh = new THREE.Mesh(dTextGeo, dTextMat);
    dTextMesh.name = 'healthText';
    dTextMesh.position.y = 0.25;
    droneHealthBarGroup.add(dTextMesh);

    group.add(droneHealthBarGroup);
  } else if (def.type === 'robo_dog') {
    // 机器柴犬外观 - 柴犬造型配色
    // 注意：模型朝向 -Z 方向（Three.js 默认朝向），这样 lookAt 和移动方向一致
    const shibaColors = {
      base: 0xD4A574,     // 柴犬基础浅棕色
      white: 0xF5F5DC,    // 柴犬白色（胸腹、脸颊）
      dark: 0x8B4513,     // 柴犬深棕色（耳朵、背部）
      black: 0x2C2C2C,    // 黑色鼻子
      eye: 0xFFAA00       // 琥珀色眼睛
    };
    
    // 身体（椭圆造型）- 头朝 -Z 方向
    const bodyGeo = new THREE.BoxGeometry(0.35, 0.32, 0.55); // 交换 X 和 Z
    const bodyMat = new THREE.MeshLambertMaterial({ color: shibaColors.base });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.42;
    body.castShadow = true;
    body.userData.part = 'body';
    group.add(body);
    
    // 胸腹白色区域（在前方，-Z方向）
    const chestGeo = new THREE.BoxGeometry(0.25, 0.2, 0.4);
    const chestMat = new THREE.MeshLambertMaterial({ color: shibaColors.white });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0, 0.35, -0.1); // 前方是 -Z
    group.add(chest);
    
    // 头部（在前方 -Z 方向）
    const headGeo = new THREE.BoxGeometry(0.3, 0.28, 0.28);
    const headMat = new THREE.MeshLambertMaterial({ color: shibaColors.base });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.58, -0.38); // 头在前方 (-Z)
    head.castShadow = true;
    head.userData.part = 'head';
    group.add(head);
    
    // 脸颊白色区域（柴犬特征）
    const cheekGeo = new THREE.BoxGeometry(0.32, 0.15, 0.15);
    const cheekMat = new THREE.MeshLambertMaterial({ color: shibaColors.white });
    const cheek = new THREE.Mesh(cheekGeo, cheekMat);
    cheek.position.set(0, 0.52, -0.45); // 脸颊在前方
    group.add(cheek);
    
    // 耳朵（三角形，深棕色）
    const earGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
    const earMat = new THREE.MeshLambertMaterial({ color: shibaColors.dark });
    const ear1 = new THREE.Mesh(earGeo, earMat);
    ear1.position.set(0.12, 0.75, -0.4); // 左耳
    ear1.rotation.z = 0.3;
    ear1.rotation.x = 0.2;
    group.add(ear1);
    const ear2 = ear1.clone();
    ear2.position.x = -0.12; // 右耳
    ear2.rotation.z = -0.3;
    ear2.rotation.x = -0.2;
    group.add(ear2);
    
    // 眼睛（琥珀色发光）
    const eyeMat = new THREE.MeshBasicMaterial({ color: shibaColors.eye });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
    eye1.position.set(0.08, 0.62, -0.5); // 左眼在前方
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.x = -0.08; // 右眼
    group.add(eye2);
    
    // 鼻子（黑色，在最前方）
    const noseGeo = new THREE.BoxGeometry(0.08, 0.04, 0.06);
    const noseMat = new THREE.MeshLambertMaterial({ color: shibaColors.black });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.55, -0.52); // 鼻子在前方
    group.add(nose);
    
    // 四条腿（白色爪子）- 头朝 -Z，前腿在 -Z 方向
    const legGeo = new THREE.BoxGeometry(0.07, 0.25, 0.07);
    const legMat = new THREE.MeshLambertMaterial({ color: shibaColors.base });
    const pawGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08);
    const pawMat = new THREE.MeshLambertMaterial({ color: shibaColors.white });
    // 腿部位置：前左、前右、后左、后右（头朝 -Z）
    const legPositions = [
      [0.14, 0.12, -0.18], [-0.14, 0.12, -0.18],  // 前腿（在 -Z 方向）
      [0.14, 0.12, 0.18], [-0.14, 0.12, 0.18]    // 后腿（在 +Z 方向）
    ];
    legPositions.forEach((pos, i) => {
      const legGroup = new THREE.Group();
      // 大腿（上部）
      const upperLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.15, 0.08),
        legMat
      );
      upperLeg.position.y = 0.15;
      upperLeg.userData.part = 'upperLeg';
      legGroup.add(upperLeg);
      
      // 小腿（下部）
      const lowerLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.12, 0.06),
        legMat
      );
      lowerLeg.position.y = 0.05;
      lowerLeg.userData.part = 'lowerLeg';
      legGroup.add(lowerLeg);
      
      // 爪子
      const paw = new THREE.Mesh(pawGeo, pawMat);
      paw.position.y = -0.02;
      paw.userData.part = 'paw';
      legGroup.add(paw);
      
      legGroup.position.set(...pos);
      legGroup.userData.part = 'leg';
      legGroup.userData.legIndex = i; // 0=前左, 1=前右, 2=后左, 3=后右
      legGroup.userData.isFront = i < 2;
      legGroup.userData.isLeft = i % 2 === 0;
      group.add(legGroup);
    });
    
    // 尾巴（在后方 +Z 方向）
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.55, 0.35); // 尾巴在后方 (+Z)
    
    // 尾巴根部
    const tailRoot = new THREE.Group();
    tailRoot.userData.part = 'tailRoot';
    
    const tailBaseGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.2, 6);
    const tailBaseMat = new THREE.MeshLambertMaterial({ color: shibaColors.base });
    const tailBase = new THREE.Mesh(tailBaseGeo, tailBaseMat);
    tailBase.rotation.x = Math.PI / 3; // 向后上方
    tailBase.position.set(0, 0.05, 0.08);
    tailRoot.add(tailBase);
    
    // 尾巴中段（可摆动）
    const tailMidGroup = new THREE.Group();
    tailMidGroup.position.set(0, 0.12, 0.15);
    tailMidGroup.userData.part = 'tailMid';
    
    const tailMidGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.15, 6);
    const tailMid = new THREE.Mesh(tailMidGeo, tailBaseMat);
    tailMid.rotation.x = Math.PI / 2.5;
    tailMid.position.set(0, 0.02, 0.06);
    tailMidGroup.add(tailMid);
    
    // 尾巴尖端（白色，可摆动）
    const tailTipGroup = new THREE.Group();
    tailTipGroup.position.set(0, 0.06, 0.12);
    tailTipGroup.userData.part = 'tailTip';
    
    const tailTipGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.1, 6);
    const tailTipMat = new THREE.MeshLambertMaterial({ color: shibaColors.white });
    const tailTip = new THREE.Mesh(tailTipGeo, tailTipMat);
    tailTip.rotation.x = Math.PI / 2;
    tailTip.position.set(0, 0.01, 0.04);
    tailTipGroup.add(tailTip);
    
    tailMidGroup.add(tailTipGroup);
    tailRoot.add(tailMidGroup);
    tailGroup.add(tailRoot);
    tailGroup.userData.part = 'tail';
    group.add(tailGroup);
    
    // 背包（资源存储）- 棕色皮革风格
    const packGeo = new THREE.BoxGeometry(0.28, 0.18, 0.22);
    const packMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(-0.05, 0.68, 0);
    group.add(pack);
    
    // 背包上的LED指示灯
    const ledGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const ledMat = new THREE.MeshLambertMaterial({ color: 0x00FF88, emissive: 0x00FF88, emissiveIntensity: 0.3 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(-0.05, 0.78, 0.12);
    group.add(led);
  }

  group.position.copy(position);
  // 使用传入位置的Y坐标，不再调用getGroundLevel避免错误
  // 确保工事不会陷入地下
  if (group.position.y < 0) group.position.y = 0;

  // 获取避难所科技+幸存者效果（工事耐久加成）
  let fortHealthMult = 1;
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getTechEffects) {
    try {
      const techEffects = ShelterSystem.getTechEffects();
      fortHealthMult = techEffects.fortHealthMult || 1;
      // 工程师/机械师加成
      const shelterData = ShelterSystem.getData();
      const defs = ShelterSystem.getDefs().survivors;
      shelterData.survivors.forEach(sur => {
        const def = defs[sur.type];
        if (def && def.battlefieldEffect && def.battlefieldEffect.fortHealthBonus) {
          const skillMult = 1 + (sur.skill - 1) * 0.10;
          fortHealthMult += def.battlefieldEffect.fortHealthBonus * skillMult;
        }
      });
    } catch(e) {}
  }

  // 应用科技加成后的生命值
  const finalHealth = Math.floor(def.health * fortHealthMult);

  return {
    type: type,
    def: def,
    mesh: group,
    health: finalHealth,
    maxHealth: finalHealth,
    lastFire: 0,
    triggered: false,
    // 机器狗专属状态 - 注意：不在创建时初始化，在 updateRoboDogs 中初始化
    // 这样可以确保所有状态都被正确设置
    isRoboDog: def.type === 'robo_dog'
  };
}

// ============================================================
// 机器狗AI系统
// ============================================================

// 更新所有机器狗
function updateRoboDogs(dt) {
  if (!window.deployedFortifications) return;
  
  const dogs = window.deployedFortifications.filter(f => f && (f.isRoboDog || (f.def && f.def.type === 'robo_dog')) && f.health > 0);
  if (dogs.length === 0) return;
  
  for (const fort of dogs) {
    if (!fort.dogState) {
      // 初始化狗的状态
      fort.dogState = 'idle';
      fort.dogTimer = 0;
      fort.dogTarget = null;
      fort.dogSpeed = fort.def.speed || 18;
      fort.carrying = null;
      fort.currentSpeed = 0;
      fort.isMoving = false;
      fort.targetOffset = null;
      fort.standStillTimer = 0;
      
      // 初始化时让狗面向玩家（头朝 -Z，需要加 PI）
      const toPlayer = new THREE.Vector3().subVectors(camera.position, fort.mesh.position);
      toPlayer.y = 0;
      if (toPlayer.length() > 0.1) {
        fort.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z) + Math.PI;
      }
    }
    
    const dog = fort;
    const pos = dog.mesh.position;
    const speed = dog.dogSpeed;
    
    // 获取动画时间（使用更平滑的时间增量）
    const animTime = Date.now() * 0.001;
    const isMoving = dog.isMoving === true;
    
    // 身体起伏动画 - 模拟狗跑步时的身体上下起伏
    const body = dog.mesh.children.find(c => c.userData.part === 'body');
    if (body) {
      if (isMoving) {
        // 跑步时身体上下起伏，频率与腿部动画匹配
        const bounceFreq = dog.dogSpeed * 0.3; // 速度越快起伏越快
        const bounceHeight = 0.03; // 起伏高度
        body.position.y = 0.42 + Math.sin(animTime * bounceFreq * 2) * bounceHeight;
        // 身体轻微前后倾斜
        body.rotation.z = Math.sin(animTime * bounceFreq) * 0.05;
      } else {
        // 站立时缓慢恢复到默认位置
        body.position.y += (0.42 - body.position.y) * 0.1;
        body.rotation.z *= 0.9;
      }
    }
    
    // 腿部跑步动画 - 参考真实狗跑步姿势
    const legs = dog.mesh.children.filter(c => c.userData.part === 'leg');
    legs.forEach((leg, i) => {
      const isFront = leg.userData.isFront;
      const isLeft = leg.userData.isLeft;
      
      if (isMoving && dog.currentSpeed > 0.5) {
        // 跑步频率基于当前实际速度（不是最大速度）
        const runFreq = 15; // 基础步频
        // 对角腿同步：前左+后右 同步，前右+后左 同步
        const phase = (isFront === isLeft) ? 0 : Math.PI;
        const legCycle = animTime * runFreq + phase;
        
        // 大腿大幅度摆动（前后摆动）
        const thighSwing = Math.sin(legCycle) * 0.6; // 增大大腿摆动幅度
        leg.rotation.x = thighSwing;
        
        // 小腿弯曲（跑步时小腿向后弯曲）
        const lowerLeg = leg.children.find(c => c.userData.part === 'lowerLeg');
        if (lowerLeg) {
          // 当腿向后摆动时，小腿弯曲更多
          const bendAmount = Math.max(0, -Math.sin(legCycle + 0.5)) * 0.8;
          lowerLeg.rotation.x = bendAmount;
        }
        
        // 爪子调整 - 保持接触地面
        const paw = leg.children.find(c => c.userData.part === 'paw');
        if (paw) {
          // 爪子保持相对水平
          paw.rotation.x = -leg.rotation.x - (lowerLeg ? lowerLeg.rotation.x : 0);
        }
      } else {
        // 站立时平滑恢复到默认姿势
        leg.rotation.x *= 0.85;
        const lowerLeg = leg.children.find(c => c.userData.part === 'lowerLeg');
        if (lowerLeg) lowerLeg.rotation.x *= 0.85;
        const paw = leg.children.find(c => c.userData.part === 'paw');
        if (paw) paw.rotation.x *= 0.85;
      }
    });
    
    // 尾巴动画 - 根据状态不同有不同的摇摆方式
    const tail = dog.mesh.children.find(c => c.userData.part === 'tail');
    if (tail) {
      const tailRoot = tail.children.find(c => c.userData.part === 'tailRoot');
      const tailMid = tailRoot ? tailRoot.children.find(c => c.userData.part === 'tailMid') : null;
      const tailTip = tailMid ? tailMid.children.find(c => c.userData.part === 'tailTip') : null;
      
      if (isMoving) {
        // 跑步时尾巴快速摇摆（表示兴奋/专注）
        const wagFreq = 12; // 快速摇摆
        const wagAmp = 0.4; // 摇摆幅度
        
        if (tailRoot) {
          tailRoot.rotation.y = Math.sin(animTime * wagFreq) * wagAmp;
          tailRoot.rotation.z = Math.sin(animTime * wagFreq * 0.5) * 0.1; // 轻微上下摆动
        }
        if (tailMid) {
          tailMid.rotation.y = Math.sin(animTime * wagFreq - 0.5) * (wagAmp * 1.2);
          tailMid.rotation.z = 0.2 + Math.sin(animTime * wagFreq * 0.7) * 0.1;
        }
        if (tailTip) {
          tailTip.rotation.y = Math.sin(animTime * wagFreq - 1.0) * (wagAmp * 1.5);
        }
      } else {
        // 空闲时尾巴缓慢摇摆（表示放松）
        const idleWagFreq = 3;
        const idleWagAmp = 0.2;
        
        if (tailRoot) {
          tailRoot.rotation.y = Math.sin(animTime * idleWagFreq) * idleWagAmp;
          tailRoot.rotation.z *= 0.95;
        }
        if (tailMid) {
          tailMid.rotation.y = Math.sin(animTime * idleWagFreq - 0.3) * (idleWagAmp * 1.3);
          tailMid.rotation.z = 0.2;
        }
        if (tailTip) {
          tailTip.rotation.y = Math.sin(animTime * idleWagFreq - 0.6) * (idleWagAmp * 1.6);
        }
      }
    }
    
    // 头部轻微晃动（跟随身体运动）
    const head = dog.mesh.children.find(c => c.userData.part === 'head');
    if (head) {
      if (isMoving) {
        // 跑步时头部轻微上下晃动
        const headBob = Math.sin(animTime * dog.dogSpeed * 0.4) * 0.02;
        head.position.y = 0.58 + headBob;
        // 头部轻微前后调整保持平衡
        head.rotation.z = -Math.sin(animTime * dog.dogSpeed * 0.2) * 0.03;
      } else {
        head.position.y += (0.58 - head.position.y) * 0.1;
        head.rotation.z *= 0.9;
      }
    }
    
    switch (dog.dogState) {
      case 'idle':
        updateDogIdle(dog, dt);
        break;
      case 'seek':
        updateDogSeek(dog, dt);
        break;
      case 'pickup':
        updateDogPickup(dog, dt);
        break;
      case 'return':
        updateDogReturn(dog, dt);
        break;
    }
  }
}

// 空闲状态：在玩家身边走动，不围着转圈
function updateDogIdle(dog, dt) {
  dog.dogTimer += dt;

  // 每隔0.5秒检查附近是否有掉落物可拾取（搜索范围100米）
  if (!dog.pickupCheckTimer) dog.pickupCheckTimer = 0;
  dog.pickupCheckTimer += dt;
  if (dog.pickupCheckTimer > 0.5) {
    dog.pickupCheckTimer = 0;
    const allPickups = (pickups && pickups.length !== undefined ? pickups : window.pickups) || [];
    if (allPickups.length > 0) {
      const target = findNearestPickup(dog.mesh.position, 100);
      if (target) {
        console.log('[机器狗] 发现掉落物，距离:', dog.mesh.position.distanceTo(target.mesh.position).toFixed(1), '类型:', target.type, '位置:', target.mesh.position.x.toFixed(1), target.mesh.position.z.toFixed(1));
        dog.dogState = 'seek';
        dog.dogTarget = target;
        dog.targetOffset = null;
        return;
      } else {
        // 调试：有掉落物但都在100米外或被锁定
        console.log('[机器狗调试] 有', allPickups.length, '个掉落物但无可用目标(距离>100或被锁定)，狗位置:', dog.mesh.position.x.toFixed(1), dog.mesh.position.z.toFixed(1));
      }
    } else {
      console.log('[机器狗调试] pickups数组为空，狗位置:', dog.mesh.position.x.toFixed(1), dog.mesh.position.z.toFixed(1));
    }
  }

  const playerPos = camera.position;
  const dogPos = dog.mesh.position;

  // 计算狗当前位置相对于玩家的偏移和距离
  const currentOffsetX = dogPos.x - playerPos.x;
  const currentOffsetZ = dogPos.z - playerPos.z;
  const currentDist = Math.sqrt(currentOffsetX * currentOffsetX + currentOffsetZ * currentOffsetZ);

  // 初始化跟随位置（如果没有）
  if (!dog.targetOffset) {
    // 如果狗已经在玩家旁边（2-5米），就停在那里
    if (currentDist >= 2 && currentDist <= 5) {
      dog.targetOffset = { x: currentOffsetX, z: currentOffsetZ };
    } else if (currentDist > 5) {
      const angle = Math.atan2(currentOffsetX, currentOffsetZ);
      dog.targetOffset = {
        x: Math.cos(angle) * 3,
        z: Math.sin(angle) * 3
      };
    } else {
      const angle = Math.atan2(currentOffsetX, currentOffsetZ);
      dog.targetOffset = {
        x: Math.cos(angle) * 2.5,
        z: Math.sin(angle) * 2.5
      };
    }
    dog.standStillTimer = 0;
  }
  
  // 如果狗离玩家太远（>10米），重新计算目标位置
  if (currentDist > 10) {
    const angle = Math.atan2(currentOffsetX, currentOffsetZ);
    dog.targetOffset = {
      x: Math.cos(angle) * 3,
      z: Math.sin(angle) * 3
    };
  }
  
  // 计算目标位置（玩家位置 + 偏移）
  const targetX = playerPos.x + dog.targetOffset.x;
  const targetZ = playerPos.z + dog.targetOffset.z;
  
  // 计算到目标的距离
  const dx = targetX - dogPos.x;
  const dz = targetZ - dogPos.z;
  const distToTarget = Math.sqrt(dx * dx + dz * dz);
  
  // 如果到达目标位置，停留一段时间
  if (distToTarget < 0.5) {
    dog.standStillTimer += dt;
    dog.isMoving = false;
    dog.currentSpeed = 0; // 停止移动
    
    // 停留2-4秒后，选择新位置
    if (dog.standStillTimer > 2 + Math.random() * 2) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 2.5 + Math.random() * 1.5;
      dog.targetOffset = {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist
      };
      dog.standStillTimer = 0;
    }
  } else {
    // 向目标位置移动
    moveDogWithNaturalRun(dog, targetX, targetZ, dt);
  }
}

// 寻找资源：移动到目标掉落物
function updateDogSeek(dog, dt) {
  // 检查目标是否有效（被移除、过期、无mesh）
  if (!dog.dogTarget || !dog.dogTarget.mesh || dog.dogTarget.life <= 0) {
    dog.dogTarget = null;
    const newTarget = findNearestPickup(dog.mesh.position);
    if (newTarget) {
      dog.dogTarget = newTarget;
    } else {
      dog.dogState = 'idle';
      dog.dogTarget = null;
      dog.targetOffset = null; // 清除目标偏移
      dog.currentSpeed = 0; // 停止移动
      dog.isMoving = false;
      return;
    }
  }

  // 再次确认目标仍在 pickups 数组中（防止被其他狗拾取后从数组移除但引用还在）
  const allPickups = (pickups && pickups.length !== undefined ? pickups : window.pickups) || [];
  if (!allPickups.includes(dog.dogTarget)) {
    dog.dogTarget = null;
    const newTarget = findNearestPickup(dog.mesh.position);
    if (newTarget) {
      dog.dogTarget = newTarget;
    } else {
      dog.dogState = 'idle';
      dog.dogTarget = null;
      dog.targetOffset = null;
      dog.currentSpeed = 0;
      dog.isMoving = false;
      return;
    }
  }

  const targetPos = dog.dogTarget.mesh.position;
  const toTarget = new THREE.Vector3().subVectors(targetPos, dog.mesh.position);
  toTarget.y = 0;
  const dist = toTarget.length();

  if (dist < 2.5) {
    console.log('[机器狗调试] 到达目标，距离:', dist.toFixed(2), '进入pickup状态');
    dog.dogState = 'pickup';
    dog.dogTimer = 0;
    return;
  }

  // 使用自然跑步方式移动到目标
  moveDogWithNaturalRun(dog, targetPos.x, targetPos.z, dt);
}

// 拾取资源
function updateDogPickup(dog, dt) {
  dog.dogTimer += dt;
  
  if (dog.dogTimer > 0.3) {
    if (dog.dogTarget && dog.dogTarget.life > 0) {
      const resourceType = dog.dogTarget.type;
      dog.carrying = resourceType;
      
      // 从掉落物数组中移除
      const allPickups = (pickups && pickups.length !== undefined ? pickups : window.pickups) || [];
      const idx = allPickups.indexOf(dog.dogTarget);
      if (idx > -1) {
        if (dog.dogTarget.mesh && dog.dogTarget.mesh.parent) {
          scene.remove(dog.dogTarget.mesh);
        }
        allPickups.splice(idx, 1);
      }
      
      dog.dogState = 'return';
      dog.dogTimer = 0;
      dog.dogTarget = null;
      console.log('[机器狗调试] 拾取成功! 类型:', resourceType, '当前携带:', dog.carrying, '剩余pickups:', allPickups.length);
    } else {
      console.log('[机器狗调试] 拾取失败：目标无效', dog.dogTarget ? 'life=' + dog.dogTarget.life : 'null');
      dog.dogState = 'idle';
      dog.dogTarget = null;
    }
  }
}

// 返回玩家：携带资源回到玩家身边
function updateDogReturn(dog, dt) {
  const playerPos = camera.position;
  const toPlayer = new THREE.Vector3().subVectors(playerPos, dog.mesh.position);
  toPlayer.y = 0;
  const dist = toPlayer.length();

  console.log('[机器狗] 返回玩家，距离:', dist.toFixed(1));

  if (dist < 2.5) {
    deliverDogResource(dog);
    dog.dogState = 'idle';
    dog.dogTimer = 0;
    dog.carrying = null;
    return;
  }
  
  // 使用自然跑步方式移动到玩家
  moveDogWithNaturalRun(dog, playerPos.x, playerPos.z, dt);
}

// 自然跑步移动 - 狗只能向它面朝的方向移动，不能平移
// 狗的模型头部朝向 -Z 方向（Three.js 默认朝向）
function moveDogWithNaturalRun(dog, targetX, targetZ, dt) {
  const pos = dog.mesh.position;
  const targetPos = new THREE.Vector3(targetX, pos.y, targetZ);
  
  // 计算到目标的方向和距离
  const toTarget = new THREE.Vector3().subVectors(targetPos, pos);
  toTarget.y = 0;
  const dist = toTarget.length();
  
  // 关键修复：狗头朝 -Z，所以目标角度需要加 PI
  // atan2(x, z) 计算的是面向 +Z 的角度，加 PI 才是面向 -Z 的角度
  const targetAngle = Math.atan2(toTarget.x, toTarget.z) + Math.PI;
  
  // 获取当前朝向角度
  let currentRotation = dog.mesh.rotation.y;
  
  // 标准化角度到 -PI 到 PI
  while (currentRotation > Math.PI) currentRotation -= Math.PI * 2;
  while (currentRotation < -Math.PI) currentRotation += Math.PI * 2;
  
  // 计算最短转向路径
  let angleDiff = targetAngle - currentRotation;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  // 转向速度限制
  const maxTurnRate = 6.0 * dt;
  const turnAmount = Math.max(-maxTurnRate, Math.min(maxTurnRate, angleDiff));
  dog.mesh.rotation.y += turnAmount;
  
  // 只有当基本面向目标时才移动
  const facingThreshold = Math.PI / 2; // 90度
  const isFacingTarget = Math.abs(angleDiff) < facingThreshold;

  if (dist < 0.5) {
    dog.currentSpeed = Math.max(0, (dog.currentSpeed || 0) - dog.dogSpeed * 5 * dt);
    dog.isMoving = false;
    if (dog.currentSpeed < 0.1) dog.currentSpeed = 0;
  } else if (isFacingTarget) {
    dog.isMoving = true;
    const accel = dog.dogSpeed * 3;
    dog.currentSpeed = Math.min(dog.dogSpeed, (dog.currentSpeed || 0) + accel * dt);
  } else {
    // 即使不面向目标，也保持缓慢移动，避免在边缘卡住
    dog.isMoving = true;
    dog.currentSpeed = Math.min(dog.dogSpeed * 0.3, (dog.currentSpeed || 0) + dog.dogSpeed * dt);
  }

  // 只能向面朝的方向移动 - rotation.y=0 时朝向 -Z
  if (dog.currentSpeed > 0.1) {
    const moveDir = new THREE.Vector3(
      -Math.sin(dog.mesh.rotation.y),
      0,
      -Math.cos(dog.mesh.rotation.y)
    );

    moveDir.multiplyScalar(dog.currentSpeed * dt);
    pos.x += moveDir.x;
    pos.z += moveDir.z;
  }
}

// 交付资源
function deliverDogResource(dog) {
  if (!dog.carrying) {
    console.log('[机器狗] 没有携带资源');
    return;
  }

  const type = dog.carrying;
  console.log('[机器狗] 交付资源:', type);

  // 播放拾取音效
  if (typeof window.playSound === 'function') AudioSystem.playSound('pickup');

  const _weapons = window.weapons || weapons;
  const _player = window.player || player;
  const _camera = window.camera || camera;
  const _CONFIG = window.CONFIG || CONFIG;

  // 从配置获取掉落物信息
  const lootConfig = _CONFIG?.LOOT?.ZOMBIE_DROP?.TYPES?.find(t => t.type === type);

  switch(type) {
    case 'ammo':
      if (_weapons) _weapons.forEach(w => { w.reserve += Math.floor(w.magSize * (_player ? _player.ammoMult || 1 : 1)); });
      if (typeof window.showFloatingText === 'function') window.showFloatingText(_camera.position.clone().add(new THREE.Vector3(0, 1.5, 0)), '机器狗: +弹药!', lootConfig?.color || 0xffaa00);
      if (typeof window.showToast === 'function') window.showToast('机器狗拾取: 弹药补给', 'success');
      console.log('[机器狗] 交付弹药');
      break;
    case 'health':
      if (_player) _player.hp = Math.min(_player.hp + (lootConfig?.value || 30), _player.maxHp);
      if (typeof window.showFloatingText === 'function') window.showFloatingText(_camera.position.clone().add(new THREE.Vector3(0, 1.5, 0)), '机器狗: +生命!', lootConfig?.color || 0x44ff44);
      if (typeof window.showToast === 'function') window.showToast('机器狗拾取: 医疗包', 'success');
      console.log('[机器狗] 交付生命');
      break;
    case 'building':
      const buildingAmount = lootConfig ? lootConfig.min + Math.floor(Math.random() * (lootConfig.max - lootConfig.min + 1)) : 10;
      if (typeof ShelterSystem !== 'undefined' && ShelterSystem.addBattleResources) {
        ShelterSystem.addBattleResources({ building: buildingAmount });
      }
      if (typeof window.showFloatingText === 'function') window.showFloatingText(_camera.position.clone().add(new THREE.Vector3(0, 1.5, 0)), `机器狗: +${buildingAmount} 建材!`, lootConfig?.color || 0x8B6914);
      if (typeof window.showToast === 'function') window.showToast(`机器狗拾取: ${buildingAmount} 建材`, 'success');
      console.log('[机器狗] 交付建材:', buildingAmount);
      break;
    case 'parts':
      const partsAmount = lootConfig ? lootConfig.min + Math.floor(Math.random() * (lootConfig.max - lootConfig.min + 1)) : 5;
      if (typeof addBattleParts === 'function') {
        addBattleParts(partsAmount);
      }
      if (typeof window.showFloatingText === 'function') window.showFloatingText(_camera.position.clone().add(new THREE.Vector3(0, 1.5, 0)), `机器狗: +${partsAmount} 零件!`, lootConfig?.color || 0x6699CC);
      if (typeof window.showToast === 'function') window.showToast(`机器狗拾取: ${partsAmount} 零件`, 'success');
      console.log('[机器狗] 交付零件:', partsAmount);
      break;
    default:
      console.log('[机器狗] 未知资源类型:', type);
  }

  dog.carrying = null;

  if (typeof window.updateHUD === 'function') window.updateHUD();
}

// 查找最近的掉落物
function findNearestPickup(pos, maxDist) {
  const allPickups = (pickups && pickups.length !== undefined ? pickups : window.pickups) || [];
  if (!allPickups || allPickups.length === 0) return null;

  // 收集所有已被机器狗锁定的掉落物（只添加有效的，防止无效引用阻塞拾取）
  const lockedPickups = new Set();
  if (window.deployedFortifications) {
    for (const fort of window.deployedFortifications) {
      if (fort && fort.dogTarget && fort.dogTarget.life > 0 && fort.dogTarget.mesh) {
        lockedPickups.add(fort.dogTarget);
      }
    }
  }

  let nearest = null;
  let nearestDist = maxDist || Infinity;

  for (const p of allPickups) {
    if (!p || p.life <= 0 || !p.mesh) continue;
    // 跳过已被其他机器狗锁定的掉落物
    if (lockedPickups.has(p)) continue;
    const dist = pos.distanceTo(p.mesh.position);

    // 只找搜索范围内的最近掉落物
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = p;
    }
  }

  return nearest;
}

// 更新工事（每帧调用）
function updateFortifications(dt) {
  // 调试：检查是否有部署的工事
  if (window.deployedFortifications && window.deployedFortifications.length > 0) {
    const dogCount = window.deployedFortifications.filter(f => f && (f.isRoboDog || (f.def && f.def.type === 'robo_dog'))).length;
    if (dogCount > 0 && Math.random() < 0.005) {
      console.log('[工事系统] 机器狗数量:', dogCount);
    }
  }
  
  // 更新所有炮塔子弹
  updateTurretBullets(dt);

  // 更新所有无人机
  updateDrones(dt);
  
  // 更新所有机器狗
  updateRoboDogs(dt);

  for (let i = window.deployedFortifications.length - 1; i >= 0; i--) {
    const fort = window.deployedFortifications[i];

    // 检查是否被摧毁
    if (!fort || fort.health <= 0) {
      destroyFortification(i);
      continue;
    }

    // 生命回复（升级技能加成）
    if (fort.stats && fort.stats.healthRegen > 0 && fort.health < (fort.maxHealth || fort.def.health)) {
      fort.health = Math.min(fort.maxHealth || fort.def.health, fort.health + fort.stats.healthRegen * dt);
    }

    // 炮塔逻辑
    if (fort.def && fort.def.type === 'turret') {
      updateTurret(fort, dt);
    }

    // 无人机塔逻辑
    if (fort.def && fort.def.type === 'drone') {
      updateDroneTower(fort, dt);
    }

    // 陷阱逻辑
    if (fort.def && fort.def.type === 'trap' && !fort.triggered) {
      updateTrap(fort);
    }

    // 路障特效（铁丝网伤害）
    if (fort.def.effect && fort.def.effect.damage) {
      updateBarricadeEffect(fort, dt);
    }

    // 所有非陷阱工事：更新血条面向玩家
    if (fort.def && fort.def.type !== 'trap') {
      updateFortHealthBar(fort);
    }
  }
}

// 更新工事血条显示（炮塔和路障）
function updateFortHealthBar(fort) {
  if (!fort || !fort.mesh) return;
  if (fort.def.type === 'trap') return; // 陷阱不显示血条
  
  const healthBar = fort.mesh.getObjectByName('healthBar');
  if (!healthBar) return;
  
  // 计算血量百分比（使用maxHealth，包含科技加成）
  const maxHp = fort.maxHealth || fort.def.health;
  const hpPercent = Math.max(0, fort.health / maxHp);
  
  // 更新血条填充
  const fill = healthBar.getObjectByName('healthBarFill');
  if (fill) {
    fill.scale.x = hpPercent;
    // 根据工事类型调整左对齐偏移
    const barWidth = fort.def.type === 'turret' ? 0.38 : (fort.def.size * 0.8 - 0.04) / 2;
    fill.position.x = (hpPercent - 1) * barWidth;
    // 根据血量改变颜色
    if (hpPercent > 0.5) fill.material.color.setHex(0x44ff44);
    else if (hpPercent > 0.25) fill.material.color.setHex(0xffff44);
    else fill.material.color.setHex(0xff4444);
  }
  
  // 更新血量数字（仅炮塔有文字）
  const textMesh = healthBar.getObjectByName('healthText');
  if (textMesh && textMesh.material && textMesh.material.map) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // 加宽以容纳大数字
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    // 背景透明
    ctx.clearRect(0, 0, 128, 32);
    // 黑色描边
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = `${Math.floor(fort.health)}/${maxHp}`;
    ctx.strokeText(text, 64, 16); // 描边
    ctx.fillStyle = 'white';
    ctx.fillText(text, 64, 16); // 填充白色文字
    textMesh.material.map.image = canvas;
    textMesh.material.map.needsUpdate = true;
  }
  
  // 血条始终面向相机
  if (camera) {
    healthBar.lookAt(camera.position);
  }
}

// 辅助函数：获取所有可攻击目标（城市敌人 + 雪地僵尸 + 沙漠怪物）
function getAllTargets() {
  let allTargets = [];
  if (enemies && enemies.length > 0) {
    allTargets = allTargets.concat(enemies.filter(e => !e.dead));
  }
  // 添加雪地僵尸（游荡僵尸和波次僵尸）
  if (window.SnowMap && SnowMap.active) {
    if (SnowMap.wanderZombies) {
      allTargets = allTargets.concat(SnowMap.wanderZombies.filter(z => z.state !== 'dead'));
    }
    if (SnowMap.defenseEnemies) {
      allTargets = allTargets.concat(SnowMap.defenseEnemies.filter(e => e.state !== 'dead'));
    }
  }
  // 添加沙漠怪物
  if (window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.length > 0) {
    allTargets = allTargets.concat(DesertMap.desertMonsters.filter(m => !m.dead && m.mesh));
  }
  return allTargets;
}

// 辅助函数：对沙漠怪物造成伤害
function damageDesertMonster(m, damage, sourceName) {
  if (!m || m.dead || !m.mesh) return;
  const wasAlive = m.hp > 0;
  m.hp -= damage;
  // 受击音效（30%概率播放，避免连续叫）
  if (wasAlive && m.hp > 0 && window.AudioSystem && Math.random() < 0.3) {
    AudioSystem.playSound('zombie_hit', 0.5);
  }
  if (m.hp <= 0 && wasAlive) {
    if (typeof window.killDesertMonster === 'function') {
      window.killDesertMonster(m, sourceName || '炮塔');
    }
  }
  if (typeof createHitEffect === 'function') {
    createHitEffect(m.mesh.position.clone(), 0xff6600);
  }
}

// 更新炮塔
function updateTurret(fort, dt) {
  // 寻找最近敌人
  let nearest = null;
  let nearestDist = fort.def.range;

  const allTargets = getAllTargets();

  if (allTargets.length === 0) {
    return;
  }

  for (const enemy of allTargets) {
    const dist = enemy.mesh.position.distanceTo(fort.mesh.position);
    if (dist < nearestDist) {
      nearest = enemy;
      nearestDist = dist;
    }
  }

  if (nearest) {
    // 旋转炮塔朝向敌人（只水平旋转）
    const targetPos = nearest.mesh.position.clone();
    targetPos.y = fort.mesh.position.y;
    fort.mesh.lookAt(targetPos);

    // 开火 - 使用简单计数器
    fort.fireCooldown = (fort.fireCooldown || 0) - dt;
    if (fort.fireCooldown <= 0) {
      fireTurret(fort, nearest);
      fort.fireCooldown = fort.def.fireRate || 0.5;
    }
  }
}

// 炮塔开火
function fireTurret(fort, target) {
  const def = fort.def;

  // 计算子弹起点（炮塔位置+高度）
  const firePos = fort.mesh.position.clone();
  firePos.y += 1.2;

  // 计算方向
  const targetCenter = target.mesh.position.clone();
  targetCenter.y += 0.8;
  const direction = targetCenter.sub(firePos);
  const dist = direction.length();

  if (dist < 0.01) return;
  direction.normalize();

  // 霰弹塔：多发弹丸
  if (def.pelletCount && def.pelletCount > 1) {
    const spreadAngle = 0.3; // 扩散角度（弧度）
    // 获取科技弹丸加成
    let techBonus = 0;
    try { techBonus = ShelterSystem.getTechEffects().shotgunPelletBonus || 0; } catch(e) {}
    const totalPellets = def.pelletCount + techBonus;
    for (let i = 0; i < totalPellets; i++) {
      // 计算扩散方向
      const angleOffset = (Math.random() - 0.5) * spreadAngle * 2;
      const pelletDir = direction.clone();
      // 在水平面添加随机偏移
      const perp = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
      pelletDir.add(perp.multiplyScalar(Math.sin(angleOffset) * 0.3));
      pelletDir.y += (Math.random() - 0.5) * 0.1;
      pelletDir.normalize();
      
      createBullet(fort, pelletDir, def.damage, 0xFFA500, 50); // 橙色子弹，速度50
    }
  } else if (fort.type === 'turret_electric') {
    // 激光塔：激光柱攻击
    createElectricBeam(fort, target, def.damage);
  } else {
    // 普通/狙击塔：单发
    const isSniper = def.range >= 50;
    const color = isSniper ? 0x00FF00 : 0xFFFF00;
    const speed = isSniper ? 80 : 30; // 狙击塔子弹速度80，普通30
    createBullet(fort, direction, def.damage, color, speed);
  }

  // 播放音效
  try { AudioSystem.playSound('turret_fire', 0.5); } catch(e) {}
}

// 创建子弹
function createBullet(fort, direction, damage, color, speed = 30) {
  const bulletGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const bulletMat = new THREE.MeshBasicMaterial({ color: color });
  const bullet = new THREE.Mesh(bulletGeo, bulletMat);

  bullet.position.copy(fort.mesh.position);
  bullet.position.y += 1.2;

  bullet.userData = { direction: direction.clone(), speed: speed, damage: damage, life: 3.0, fortType: fort.type, fort: fort };

  scene.add(bullet);
  turretBullets.push(bullet);
}

// 激光塔激光柱攻击
function createElectricBeam(fort, target, damage) {
  const startPos = fort.mesh.position.clone();
  startPos.y += 1.5;
  const endPos = target.mesh.position.clone();
  endPos.y += 0.8;

  // 创建激光柱
  const beamGroup = new THREE.Group();

  // 主激光柱
  const distance = startPos.distanceTo(endPos);
  const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, distance, 8, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x00FFFF,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, distance / 2, 0);
  beamGroup.add(beam);

  // 外层光晕
  const glowGeo = new THREE.CylinderGeometry(0.25, 0.25, distance, 8, 1, true);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x0088FF,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, distance / 2, 0);
  beamGroup.add(glow);

  // 电流粒子效果
  for (let i = 0; i < 5; i++) {
    const sparkGeo = new THREE.SphereGeometry(0.08, 4, 4);
    const sparkMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    spark.position.set(
      (Math.random() - 0.5) * 0.3,
      Math.random() * distance,
      (Math.random() - 0.5) * 0.3
    );
    beamGroup.add(spark);
  }

  // 定位激光柱
  beamGroup.position.copy(startPos);
  beamGroup.lookAt(endPos);
  beamGroup.rotateX(Math.PI / 2);

  scene.add(beamGroup);

  // 对目标造成伤害（50%最大生命值，低于50%则秒杀）
  if (typeof damageEnemy === 'function' && target.hp !== undefined && target.maxHp !== undefined) {
    const percentDmg = target.maxHp * 0.5; // 50%最大生命值
    const finalDamage = Math.max(percentDmg, target.hp); // 如果hp<50%则秒杀
    damageEnemy(target, finalDamage, false, null, '激光塔', true); // skipInstakill=true，激光塔有自己的秒杀逻辑
  }
  // 沙漠怪物（激光塔）
  if (window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.length > 0) {
    for (const m of DesertMap.desertMonsters) {
      if (m.dead || !m.mesh) continue;
      const dist = m.mesh.position.distanceTo(startPos);
      if (dist < 1.5) {
        damageDesertMonster(m, m.hp, '激光塔');
      }
    }
  }

  // 0.2秒后移除激光
  setTimeout(() => {
    scene.remove(beamGroup);
  }, 200);
}

// 更新所有炮塔子弹
function updateTurretBullets(dt) {
  for (let i = turretBullets.length - 1; i >= 0; i--) {
    const bullet = turretBullets[i];

    if (!bullet.parent) {
      turretBullets.splice(i, 1);
      continue;
    }

    // 移动子弹
    bullet.position.x += bullet.userData.direction.x * bullet.userData.speed * dt;
    bullet.position.y += bullet.userData.direction.y * bullet.userData.speed * dt;
    bullet.position.z += bullet.userData.direction.z * bullet.userData.speed * dt;
    bullet.userData.life -= dt;

    // 生命结束
    if (bullet.userData.life <= 0) {
      scene.remove(bullet);
      turretBullets.splice(i, 1);
      continue;
    }

    // 检测命中敌人（城市敌人 + 雪地僵尸 + 沙漠怪物）
    const allTargets = getAllTargets();

    for (const enemy of allTargets) {
      const dist = enemy.mesh.position.distanceTo(bullet.position);
      if (dist < 1.5) {
        // 判断是否是沙漠怪物
        const isDesertMonster = window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.includes(enemy);
        if (isDesertMonster) {
          damageDesertMonster(enemy, bullet.userData.damage, bullet.userData.fortType === 'turret_shotgun' ? '霰弹塔' : bullet.userData.fortType === 'turret_electric' ? '激光塔' : '炮塔');
        } else if (typeof damageEnemy === 'function') {
          damageEnemy(enemy, bullet.userData.damage, false, enemy.mesh.position.clone(), bullet.userData.fortType === 'turret_shotgun' ? '霰弹塔' : bullet.userData.fortType === 'turret_electric' ? '激光塔' : '炮塔');
        }

        // 霰弹塔击退效果（仅对普通敌人）
        if (!isDesertMonster && (bullet.userData.fortType === 'turret_shotgun' || (bullet.userData.fort && bullet.userData.fort.def && bullet.userData.fort.def.pelletCount > 1))) {
          const knockDir = bullet.userData.direction ? bullet.userData.direction.clone() : new THREE.Vector3().subVectors(bullet.position, bullet.userData.fort.mesh.position).normalize();
          knockDir.y = 0;
          knockDir.normalize();
          const oldPos = enemy.mesh.position.clone();
          enemy.mesh.position.addScaledVector(knockDir, 1.0); // 击退1M

          // 碰撞检测：检查新位置是否与工事/建筑物碰撞
          let collided = false;
          if (typeof window.deployedFortifications !== 'undefined') {
            for (const f of window.deployedFortifications) {
              if (f === bullet.userData.fort || !f.mesh || !f.mesh.position) continue;
              const fDist = enemy.mesh.position.distanceTo(f.mesh.position);
              const fSize = (f.def && f.def.size) ? f.def.size * 0.8 : 1;
              if (fDist < fSize) {
                collided = true;
                break;
              }
            }
          }
          if (collided) {
            enemy.stunned = 1.0; // 晕眩1秒
            enemy.mesh.position.copy(oldPos); // 碰撞后不移动
          }
        }

        scene.remove(bullet);
        turretBullets.splice(i, 1);
        break;
      }
    }
  }
}

// 更新无人机塔
function updateDroneTower(fort, dt) {

  // 检查是否已有该塔的无人机
  const existingDrone = activeDrones.find(d => d.tower === fort);
  if (existingDrone) return;

  // 冷却计时（无人机损毁后重新生成）
  fort.droneCooldown = (fort.droneCooldown || 0) - dt;
  if (fort.droneCooldown > 0) return;

  // 冷却结束，生成新无人机
  createDrone(fort);
  fort.droneCooldown = fort.def.fireRate;
}

// 创建无人机
function createDrone(fort) {
  const droneGroup = new THREE.Group();

  // 机身
  const bodyGeo = new THREE.BoxGeometry(0.4, 0.15, 0.4);
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x9370DB });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.1;
  droneGroup.add(body);

  // 四个螺旋桨
  const propGeo = new THREE.BoxGeometry(0.25, 0.02, 0.05);
  const propMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const positions = [[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]];
  positions.forEach(([x, z]) => {
    const prop = new THREE.Mesh(propGeo, propMat);
    prop.position.set(x, 0.2, z);
    droneGroup.add(prop);
  });

  // 初始位置（塔顶上方）
  droneGroup.position.copy(fort.mesh.position);
  droneGroup.position.y += 2;

  scene.add(droneGroup);

  activeDrones.push({
    mesh: droneGroup,
    tower: fort,
    target: null, // 初始无目标
    state: 'idle', // idle | attacking | returning
    speed: fort.def.droneSpeed,
    damage: fort.def.damage,
    blastRadius: fort.def.blastRadius,
    life: 30.0, // 最大存活时间30秒
    idleAngle: 0, // 盘旋角度
    idleRadius: 3 // 盘旋半径
  });
}

// 更新所有无人机
function updateDrones(dt) {
  for (let i = activeDrones.length - 1; i >= 0; i--) {
    const drone = activeDrones[i];

    if (!drone.mesh.parent) {
      activeDrones.splice(i, 1);
      continue;
    }

    // 旋转螺旋桨
    drone.mesh.children.forEach((child, idx) => {
      if (idx > 0) child.rotation.y += 20 * dt;
    });

    drone.life -= dt;

    // 生命结束或塔被摧毁
    if (drone.life <= 0 || !drone.tower || drone.tower.health <= 0) {
      explodeDrone(drone);
      scene.remove(drone.mesh);
      activeDrones.splice(i, 1);
      continue;
    }

    // 寻找目标（范围内最近敌人）
    let nearest = null;
    let nearestDist = drone.tower.def.range;
    const allTargets = getAllTargets();
    for (const enemy of allTargets) {
      const dist = enemy.mesh.position.distanceTo(drone.mesh.position);
      if (dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }

    if (nearest) {
      // 发现目标，进入攻击模式
      drone.state = 'attacking';
      drone.target = nearest;
    } else if (drone.state === 'attacking' && (!drone.target || drone.target.dead)) {
      // 目标丢失，返回盘旋
      drone.state = 'returning';
      drone.target = null;
    }

    // 根据状态移动
    if (drone.state === 'attacking' && drone.target) {
      // 向目标俯冲
      const targetPos = drone.target.mesh.position.clone();
      targetPos.y += 1; // 瞄准身体
      const direction = targetPos.sub(drone.mesh.position).normalize();
      drone.mesh.position.add(direction.multiplyScalar(drone.speed * dt));
      drone.mesh.lookAt(targetPos);

      // 碰撞检测
      const dist = drone.mesh.position.distanceTo(drone.target.mesh.position);
      if (dist < 1.0) {
        explodeDrone(drone);
        scene.remove(drone.mesh);
        activeDrones.splice(i, 1);
        continue;
      }
    } else {
      // 空闲盘旋（围绕塔顶）
      drone.state = 'idle';
      drone.idleAngle += dt * 1.5; // 盘旋速度
      const center = drone.tower.mesh.position.clone();
      center.y += 3; // 盘旋高度
      const orbitX = center.x + Math.cos(drone.idleAngle) * drone.idleRadius;
      const orbitZ = center.z + Math.sin(drone.idleAngle) * drone.idleRadius;
      const targetPos = new THREE.Vector3(orbitX, center.y, orbitZ);
      
      // 平滑移动到目标位置
      const direction = targetPos.sub(drone.mesh.position).normalize();
      drone.mesh.position.add(direction.multiplyScalar(drone.speed * 0.3 * dt));
      drone.mesh.lookAt(targetPos);
    }
  }
}

// 无人机爆炸
function explodeDrone(drone) {
  // 范围伤害（普通敌人）
  enemies.forEach(enemy => {
    const dist = enemy.mesh.position.distanceTo(drone.mesh.position);
    if (dist < drone.blastRadius) {
      const damage = Math.floor(drone.damage * (1 - dist / drone.blastRadius));
      if (typeof damageEnemy === 'function' && damage > 0) {
        damageEnemy(enemy, damage, false, enemy.mesh.position.clone(), '无人机');
      }
    }
  });
  // 范围伤害（沙漠怪物）
  if (window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.length > 0) {
    for (const m of DesertMap.desertMonsters) {
      if (m.dead || !m.mesh) continue;
      const dist = m.mesh.position.distanceTo(drone.mesh.position);
      if (dist < drone.blastRadius) {
        const damage = Math.floor(drone.damage * (1 - dist / drone.blastRadius));
        if (damage > 0) damageDesertMonster(m, damage, '无人机');
      }
    }
  }

  // 爆炸特效
  if (typeof createExplosion === 'function') {
    createExplosion(drone.mesh.position, 0x9370DB, 1.5);
  }

  // 音效
  try { AudioSystem.playSound('explosion', 0.4); } catch(e) {}
}

// 更新陷阱
function updateTrap(fort) {
  const allTargets = getAllTargets();
  for (const enemy of allTargets) {
    const dist = enemy.mesh.position.distanceTo(fort.mesh.position);
    if (dist < fort.def.triggerRadius) {
      // 触发陷阱
      triggerTrap(fort, enemy);
      fort.triggered = true;
      fort.health = 0; // 地雷一次性
      break;
    }
  }
}

// 触发陷阱
function triggerTrap(fort, triggerEnemy) {
  // 爆炸效果
  createExplosionEffect(fort.mesh.position, fort.def.triggerRadius);

  // 范围伤害（普通敌人）
  for (const enemy of enemies) {
    const dist = enemy.mesh.position.distanceTo(fort.mesh.position);
    if (dist < fort.def.triggerRadius) {
      damageEnemy(enemy, fort.def.damage, false, enemy.mesh.position.clone(), '地雷');
    }
  }
  // 范围伤害（沙漠怪物）
  if (window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.length > 0) {
    for (const m of DesertMap.desertMonsters) {
      if (m.dead || !m.mesh) continue;
      const dist = m.mesh.position.distanceTo(fort.mesh.position);
      if (dist < fort.def.triggerRadius) {
        damageDesertMonster(m, fort.def.damage, '地雷');
      }
    }
  }

  // 播放音效
  AudioSystem.playSound('explosion', 0.6);
}

// 更新路障特效
function updateBarricadeEffect(fort, dt) {
  const allTargets = getAllTargets();
  for (const enemy of allTargets) {
    const dist = enemy.mesh.position.distanceTo(fort.mesh.position);
    if (dist < fort.def.size && Math.abs(enemy.mesh.position.y - fort.mesh.position.y) < 1) {
      // 判断是否是沙漠怪物
      const isDesertMonster = window.DesertMap && DesertMap.desertMonsters && DesertMap.desertMonsters.includes(enemy);
      // 造成伤害
      if (fort.def.effect.damage) {
        if (isDesertMonster) {
          damageDesertMonster(enemy, fort.def.effect.damage * dt, '路障');
        } else {
          damageEnemy(enemy, fort.def.effect.damage * dt, false, enemy.mesh.position.clone(), '路障');
        }
      }
      // 减速（仅对普通敌人）
      if (!isDesertMonster && fort.def.effect.slow) {
        enemy.slowed = true;
        enemy.slowFactor = fort.def.effect.slow;
      }
    }
  }
}

// 创建爆炸效果
function createExplosionEffect(position, radius) {
  // 粒子效果
  const particleCount = 20;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  
  for (let i = 0; i < particleCount; i++) {
    positions.push(position.x, position.y, position.z);
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    color: 0xFF6600,
    size: 0.5,
    transparent: true
  });
  
  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  
  // 动画
  const velocities = [];
  for (let i = 0; i < particleCount; i++) {
    velocities.push({
      x: (Math.random() - 0.5) * 10,
      y: Math.random() * 10,
      z: (Math.random() - 0.5) * 10
    });
  }
  
  let life = 1.0;
  const animate = () => {
    life -= 0.05;
    if (life <= 0) {
      scene.remove(particles);
      return;
    }
    
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities[i].x * 0.016;
      positions[i * 3 + 1] += velocities[i].y * 0.016;
      positions[i * 3 + 2] += velocities[i].z * 0.016;
      velocities[i].y -= 9.8 * 0.016; // 重力
    }
    particles.geometry.attributes.position.needsUpdate = true;
    material.opacity = life;
    
    requestAnimationFrame(animate);
  };
  animate();
}

// 摧毁工事
function destroyFortification(index) {
  const fort = window.deployedFortifications[index];
  scene.remove(fort.mesh);
  window.deployedFortifications.splice(index, 1);
  // 标记流场需要重建（障碍物变化）
  if (window.FlowField) FlowField.markDirty();
}

// 回收工事
function recycleFortification(index) {
  const fort = window.deployedFortifications[index];
  const refund = Math.floor(fort.def.cost * (fort.health / fort.def.health) * 0.8);
  addBattleParts(refund);
  
  destroyFortification(index);
  updateFortificationUI();
  return refund;
}

// 更新工事UI
// 进入部署模式
function enterDeploymentMode() {
  let ui = document.getElementById('fortification-ui');
  if (!ui) {
    // 如果元素不存在，创建它
    ui = document.createElement('div');
    ui.id = 'fortification-ui';
    document.body.appendChild(ui);
  }
  // 默认选中第一个已研发的工事（按零件消耗排序）
  let allTypes = Object.keys(FORTIFICATION_DEFS);
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getResearchedFortifications) {
    try {
      const researched = ShelterSystem.getResearchedFortifications();
      allTypes = allTypes.filter(type => researched.includes(type));
    } catch(e) {}
  }
  allTypes.sort((a, b) => {
    return (FORTIFICATION_DEFS[a].cost || 0) - (FORTIFICATION_DEFS[b].cost || 0);
  });
  if (allTypes.length > 0) {
    window.selectedFortIndex = 0;
    window.selectedFortification = allTypes[0];
  } else {
    window.selectedFortification = null;
  }
  updateFortificationUI();
}

// 退出部署模式
function exitDeploymentMode() {
  const ui = document.getElementById('fortification-ui');
  if (ui) {
    ui.style.display = 'none';
    ui.innerHTML = '';
  }
  window.selectedFortification = null;
  window.selectedFortIndex = -1;
  
  // 恢复PointerLock，让玩家可以立即移动视角
  if (gameState === 'playing' && renderer && renderer.domElement) {
    renderer.domElement.requestPointerLock();
  }
}

function updateFortificationUI() {
  const ui = document.getElementById('fortification-ui');
  if (!ui) {
    return;
  }

  // 非部署模式隐藏UI
  if (!window.deploymentMode) {
    ui.style.display = 'none';
    ui.innerHTML = '';
    return;
  }

  // 部署模式显示UI
  ui.style.display = 'block';

  // 获取已研发的工事类型，按零件消耗排序
  let allTypes = Object.keys(FORTIFICATION_DEFS);
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getResearchedFortifications) {
    try {
      const researched = ShelterSystem.getResearchedFortifications();
      allTypes = allTypes.filter(type => researched.includes(type));
    } catch(e) {}
  }
  allTypes.sort((a, b) => {
    return (FORTIFICATION_DEFS[a].cost || 0) - (FORTIFICATION_DEFS[b].cost || 0);
  });

  const selIdx = window.selectedFortIndex || 0;
  const selectedName = FORTIFICATION_DEFS[window.selectedFortification]?.name || '无';

  let slotsHtml = '';
  if (allTypes.length === 0) {
    slotsHtml = '<div style="color: #ff6666; font-size: 12px;">请在避难所研发工事</div>';
  } else {
    allTypes.forEach((type, idx) => {
      const def = FORTIFICATION_DEFS[type];
      if (def) {
        const isSelected = window.selectedFortification === type;
        const canAfford = getParts() >= def.cost;
        slotsHtml += `
          <div id="fort-slot-${idx}" style="position: relative; width: 56px; height: 56px; background: ${isSelected ? 'rgba(255,200,0,0.4)' : canAfford ? 'rgba(255,255,255,0.12)' : 'rgba(255,0,0,0.12)'}; border: ${isSelected ? '3px solid #FFD700' : '1px solid rgba(255,255,255,0.2)'}; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; transition: all 0.15s; box-shadow: ${isSelected ? '0 0 10px rgba(255,200,0,0.3)' : 'none'};" onclick="selectFortificationToDeploy('${type}')">
            <span style="position: absolute; top: 2px; left: 4px; font-size: 10px; color: #888; font-weight: bold;">${idx + 1}</span>
            <span style="font-size: 24px; margin-top: 2px;">${def.icon}</span>
            <span style="font-size: 10px; color: #bbb; margin-top: 2px;">${def.cost}P</span>
          </div>
        `;
      }
    });
  }

  let html = `
    <div style="position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.85); padding: 14px 28px; border-radius: 10px; color: white; font-family: 'Microsoft YaHei', sans-serif; display: flex; flex-direction: column; align-items: center; gap: 12px; border: 1px solid rgba(255,200,0,0.5); z-index: 50; min-width: 600px; max-width: 90vw;">
      <!-- 第一行：标题、零件、选中名称 -->
      <div style="display: flex; align-items: center; gap: 32px; width: 100%; justify-content: center;">
        <div style="font-size: 15px; font-weight: bold; color: #FFD700;">部署模式</div>
        <div style="font-size: 14px; color: #aaa;">零件: <span style="color:#FFD700;">${Math.floor(getParts())}</span></div>
        <div style="font-size: 14px; color: #FFD700; min-width: 80px; text-align: center;">${selectedName}</div>
      </div>
      <!-- 第二行：工事槽位（8个全部展示） -->
      <div style="display: flex; gap: 10px; flex-wrap: nowrap; justify-content: center; padding: 4px 8px;">
        ${slotsHtml}
      </div>
      <!-- 第三行：操作提示 -->
      <div style="font-size: 12px; color: #aaa; display: flex; gap: 20px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); width: 100%; justify-content: center;">
        <span>[Q] 切换</span>
        <span>[E] 放置</span>
        <span>[R] 旋转</span>
        <span>[G] 回收</span>
        <span>[V] 退出</span>
        <span>[Tab] 取消</span>
      </div>
    </div>
  `;

  ui.innerHTML = html;
}

// 选中的待部署工事（暴露到window供game.js访问）
window.selectedFortification = null;

// 选择要部署的工事
function selectFortificationToDeploy(type) {
  window.selectedFortification = type;
  let allTypes = Object.keys(FORTIFICATION_DEFS);
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getResearchedFortifications) {
    try {
      const researched = ShelterSystem.getResearchedFortifications();
      allTypes = allTypes.filter(t => researched.includes(t));
    } catch(e) {}
  }
  allTypes.sort((a, b) => {
    return (FORTIFICATION_DEFS[a].cost || 0) - (FORTIFICATION_DEFS[b].cost || 0);
  });
  window.selectedFortIndex = allTypes.indexOf(type);
  updateFortificationUI();
}

// 获取携带的工事列表
function getLoadoutList() {
  let loadout = [];
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getLoadout) {
    try { 
      loadout = ShelterSystem.getLoadout(); 
    } catch(e) {
    }
  } else {
  }
  return loadout;
}

// 按索引选择工事（数字键1-8）
function selectFortificationByIndex(idx) {
  // 获取已研发的工事列表
  let allTypes = Object.keys(FORTIFICATION_DEFS);
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getResearchedFortifications) {
    try {
      const researched = ShelterSystem.getResearchedFortifications();
      allTypes = allTypes.filter(type => researched.includes(type));
    } catch(e) {}
  }
  allTypes.sort((a, b) => {
    return (FORTIFICATION_DEFS[a].cost || 0) - (FORTIFICATION_DEFS[b].cost || 0);
  });

  // 检查索引是否有效
  if (idx < 0 || idx >= allTypes.length) {
    return;
  }

  window.selectedFortIndex = idx;
  window.selectedFortification = allTypes[idx];
  updateFortificationUI();
}

// Q键循环切换工事类型（只遍历已研发的工事）
function cycleFortification() {
  let allTypes = Object.keys(FORTIFICATION_DEFS);
  if (typeof ShelterSystem !== 'undefined' && ShelterSystem.getResearchedFortifications) {
    try {
      const researched = ShelterSystem.getResearchedFortifications();
      allTypes = allTypes.filter(type => researched.includes(type));
    } catch(e) {}
  }
  allTypes.sort((a, b) => {
    return (FORTIFICATION_DEFS[a].cost || 0) - (FORTIFICATION_DEFS[b].cost || 0);
  });

  if (allTypes.length === 0) {
    showDeploymentMessage('请在避难所研发工事');
    return;
  }

  let currentIdx = allTypes.indexOf(window.selectedFortification);
  if (currentIdx < 0) currentIdx = -1;
  let nextIdx = (currentIdx + 1) % allTypes.length;
  window.selectedFortIndex = nextIdx;
  window.selectedFortification = allTypes[nextIdx];
  updateFortificationUI();
}

// 处理部署点击（鼠标左键）
// 直接使用 previewMesh.position，不再重新做射线检测
// preview 已经做了实体表面检测、平滑处理、有效性验证
function handleDeploymentClick(event) {
  if (!window.selectedFortification) return;
  if (!previewMesh || !previewValid) {
    showDeploymentMessage('位置无效');
    return;
  }

  const result = deployFortification(window.selectedFortification, previewMesh.position);
  if (result.success) {
    updateFortificationUI();
  } else {
    window.selectedFortification = null;
    window.selectedFortIndex = -1;
    updateFortificationUI();
    showDeploymentMessage(result.message);
  }
}

// 显示部署消息（替代alert）
function showDeploymentMessage(msg) {
  const hint = document.getElementById('deployment-hint');
  if (hint) {
    hint.textContent = msg;
    hint.style.display = 'block';
    // 1.5秒后自动隐藏，不再恢复默认提示
    setTimeout(() => {
      hint.style.display = 'none';
    }, 1500);
  }
}

// 更新预览工事（每帧调用）
// _previewSmoothPos: 帧间平滑位置，消除射线跳动导致的闪屏
let _previewSmoothPos = null;
function updatePreview() {
  // 移动工事模式下也需要预览
  const isActive = window.deploymentMode || movingFort;
  if (!isActive || !window.selectedFortification) {
    if (previewMesh) {
      scene.remove(previewMesh);
      previewMesh = null;
      previewFortType = null;
    }
    _previewSmoothPos = null;
    return;
  }

  const def = FORTIFICATION_DEFS[window.selectedFortification];
  if (!def) return;

  // 如果切换了工事类型，重建预览模型
  if (previewFortType !== window.selectedFortification) {
    if (previewMesh) {
      scene.remove(previewMesh);
    }
    previewMesh = createPreviewMesh(window.selectedFortification);
    scene.add(previewMesh);
    previewFortType = window.selectedFortification;
    previewRotation = 0; // 切换时重置旋转
    _previewSmoothPos = null; // 切换类型时重置平滑
  }

  // 获取准星指向位置（优先检测实体表面：建筑、地面等）
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  let target = new THREE.Vector3();
  let hitSolid = false;

  // 模式1：优先检测场景中的实体表面
  const intersects = raycaster.intersectObjects(scene.children, true);
  // 预先收集已部署工事的mesh用于快速排除
  const deployedMeshSet = new Set();
  if (window.deployedFortifications) {
    for (const fort of window.deployedFortifications) {
      deployedMeshSet.add(fort.mesh);
      fort.mesh.traverse(c => deployedMeshSet.add(c));
    }
  }
  for (const hit of intersects) {
    // 排除预览mesh自身及其子对象
    let obj = hit.object;
    let isPreview = false;
    while (obj) {
      if (obj === previewMesh) { isPreview = true; break; }
      obj = obj.parent;
    }
    if (isPreview) continue;
    // 排除已部署工事的mesh（射线打到它们会导致位置跳动）
    if (deployedMeshSet.has(hit.object)) continue;
    // 排除非实体对象
    const name = hit.object.name || '';
    if (name.includes('healthBar') || name.includes('particle') || name.includes('fog') ||
        name.includes('sprite') || name.includes('trail') || name.includes('bullet') ||
        name.includes('colliderDebug') || name.includes('damageNum') || name.includes('floatingText') ||
        name.includes('minimap') || name.includes('hud') || name.includes('crosshair')) continue;
    if (hit.point.y >= -1 && hit.point.y <= 100) {
      target.copy(hit.point);
      hitSolid = true;
      break;
    }
  }

  // 模式2：如果没有打到实体，回落到地面平面
  if (!hitSolid) {
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    if (raycaster.ray.intersectPlane(groundPlane, target)) {
      if (target.y < -0.5) {
        // 射线指向地下，无效
        target = null;
      }
    } else {
      target = null;
    }
  }

  if (!target) return;

  // 自动吸附：查找同类型工事
  let snapTarget = null;
  let minDist = SNAP_DISTANCE;
  for (const fort of window.deployedFortifications) {
    if (fort.type === window.selectedFortification && fort.health > 0) {
      const dist = Math.sqrt(
        Math.pow(target.x - fort.mesh.position.x, 2) +
        Math.pow(target.z - fort.mesh.position.z, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        snapTarget = fort;
      }
    }
  }

  // 计算最终位置
  let finalPos = target.clone();
  if (snapTarget) {
    const dx = target.x - snapTarget.mesh.position.x;
    const dz = target.z - snapTarget.mesh.position.z;
    const angle = Math.atan2(dz, dx);
    const snapDist = def.size + 0.1;
    finalPos.x = snapTarget.mesh.position.x + Math.cos(angle) * snapDist;
    finalPos.z = snapTarget.mesh.position.z + Math.sin(angle) * snapDist;
    finalPos.y = Math.max(0, target.y);
  }

  // 帧间位置平滑（lerp factor=0.3），消除射线在两个面之间跳动导致的闪屏
  if (_previewSmoothPos) {
    _previewSmoothPos.lerp(finalPos, 0.3);
  } else {
    _previewSmoothPos = finalPos.clone();
  }

  // 检查位置是否有效：距离0.5-20米，高度-0.5到100米
  const playerPos = camera.position;
  const distToPlayer = Math.sqrt(
    Math.pow(_previewSmoothPos.x - playerPos.x, 2) +
    Math.pow(_previewSmoothPos.z - playerPos.z, 2)
  );
  previewValid = distToPlayer >= 0.5 && distToPlayer <= 20 && _previewSmoothPos.y >= -0.5 && _previewSmoothPos.y <= 100;

  // 创建或更新预览网格
  if (!previewMesh) {
    previewMesh = createPreviewMesh(window.selectedFortification);
    scene.add(previewMesh);
    previewFortType = window.selectedFortification;
  }

  previewMesh.position.copy(_previewSmoothPos);
  previewMesh.rotation.y = previewRotation; // 应用旋转
  previewMesh.visible = true;

  // 根据有效性改变颜色叠加（保留原始模型颜色，用emissive叠加）
  previewMesh.traverse(child => {
    if (child.isMesh && child.material) {
      if (!child.material._origColor) {
        child.material._origColor = child.material.color.getHex();
      }
      child.material.color.setHex(child.material._origColor);
      child.material.opacity = 0.5;
      child.material.transparent = true;
    }
  });
}

// 创建预览网格（使用实际模型外观）
function createPreviewMesh(type) {
  const def = FORTIFICATION_DEFS[type];
  if (!def) return new THREE.Group();

  const group = new THREE.Group();

  if (def.type === 'barricade') {
    const geometry = new THREE.BoxGeometry(def.size, 1.5, 0.3);
    const material = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.75;
    group.add(mesh);

    if (type === 'barricade_wire') {
      const wireGeo = new THREE.BoxGeometry(def.size + 0.2, 1.7, 0.4);
      const wireMat = new THREE.MeshBasicMaterial({ color: 0xC0C0C0, wireframe: true, transparent: true, opacity: 0.4 });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      wireMesh.position.y = 0.75;
      group.add(wireMesh);
    }
  } else if (def.type === 'turret') {
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.8, 1, 8);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0x4a4a4a, transparent: true, opacity: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.5;
    group.add(base);

    const gunGeo = new THREE.BoxGeometry(0.3, 0.3, 1.2);
    const gunMat = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5 });
    const gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.y = 1;
    gun.position.z = 0.4;
    group.add(gun);

    const headGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x3a3a3a, transparent: true, opacity: 0.5 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.1;
    group.add(head);
  } else if (def.type === 'trap') {
    const geometry = new THREE.CylinderGeometry(def.size, def.size, 0.1, 16);
    const material = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.05;
    group.add(mesh);

    if (type === 'mine') {
      const signGeo = new THREE.ConeGeometry(0.15, 0.3, 4);
      const signMat = new THREE.MeshBasicMaterial({ color: 0xFF0000, transparent: true, opacity: 0.5 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.y = 0.2;
      group.add(sign);
    }
  } else if (def.type === 'drone') {
    // 无人机塔底座
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.7, 0.8, 8);
    const baseMat = new THREE.MeshBasicMaterial({ color: 0x4a4a4a, transparent: true, opacity: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.4;
    group.add(base);

    // 停机坪
    const padGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 8);
    const padMat = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.85;
    group.add(pad);

    // 小型无人机预览
    const droneBodyGeo = new THREE.BoxGeometry(0.3, 0.1, 0.3);
    const droneBodyMat = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5 });
    const droneBody = new THREE.Mesh(droneBodyGeo, droneBodyMat);
    droneBody.position.y = 1.1;
    group.add(droneBody);
  } else if (def.type === 'robo_dog') {
    // 机器柴犬预览 - 柴犬配色
    const shibaColors = {
      base: 0xD4A574,
      white: 0xF5F5DC,
      dark: 0x8B4513,
      eye: 0xFFAA00
    };
    
    const bodyGeo = new THREE.BoxGeometry(0.55, 0.32, 0.35);
    const bodyMat = new THREE.MeshBasicMaterial({ color: shibaColors.base, transparent: true, opacity: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.42;
    group.add(body);
    
    // 胸腹白色
    const chestGeo = new THREE.BoxGeometry(0.4, 0.2, 0.25);
    const chestMat = new THREE.MeshBasicMaterial({ color: shibaColors.white, transparent: true, opacity: 0.5 });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0.1, 0.35, 0);
    group.add(chest);
    
    // 头部
    const headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.3);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0.38, 0.58, 0);
    group.add(head);
    
    // 耳朵（深棕色）
    const earGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
    const earMat = new THREE.MeshBasicMaterial({ color: shibaColors.dark, transparent: true, opacity: 0.5 });
    const ear1 = new THREE.Mesh(earGeo, earMat);
    ear1.position.set(0.4, 0.75, 0.12);
    ear1.rotation.z = -0.3;
    group.add(ear1);
    const ear2 = ear1.clone();
    ear2.position.z = -0.12;
    group.add(ear2);
    
    // 琥珀色眼睛
    const eyeMat = new THREE.MeshBasicMaterial({ color: shibaColors.eye, transparent: true, opacity: 0.7 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
    eye1.position.set(0.5, 0.62, 0.08);
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.z = -0.08;
    group.add(eye2);
  }

  return group;
}

// E键放置工事（使用预览位置）
function placeFortification() {
  if (!window.deploymentMode || !window.selectedFortification || !previewMesh || !previewValid) {
    if (!previewValid) showDeploymentMessage('位置无效');
    return;
  }

  const result = deployFortification(window.selectedFortification, previewMesh.position);
  if (result.success) {
    // 应用旋转到刚放置的工事
    const lastFort = window.deployedFortifications[window.deployedFortifications.length - 1];
    if (lastFort) {
      lastFort.mesh.rotation.y = previewRotation;
    }
    showDeploymentMessage('部署成功');
  } else {
    showDeploymentMessage(result.message);
  }
}

// 键盘部署
// handleFortificationKey 已废弃，改用 cycleFortification

// 回收准星所指工事
function recycleFortificationAtCursor() {
  // 找到准星最近的工事
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const raycaster = new THREE.Raycaster(camera.position, forward);
  
  const fortMeshes = window.deployedFortifications.map(f => f.mesh);
  const intersects = raycaster.intersectObjects(fortMeshes, true);
  
  if (intersects.length > 0) {
    const hitMesh = intersects[0].object.parent || intersects[0].object;
    const index = window.deployedFortifications.findIndex(f => f.mesh === hitMesh);
    if (index >= 0) {
      const refund = recycleFortification(index);
      showFloatingText(camera.position.clone().add(forward.clone().multiplyScalar(5)), `回收 +${refund}零件`, 0xFFD700);
    }
  }
}

// 创建工事UI
function createFortificationUI() {
  // 主UI容器（如果不存在则创建）
  let ui = document.getElementById('fortification-ui');
  if (!ui) {
    ui = document.createElement('div');
    ui.id = 'fortification-ui';
    document.body.appendChild(ui);
  }
  
  // 部署提示（底部显示，不遮挡视线）
  const hint = document.createElement('div');
  hint.id = 'deployment-hint';
  hint.style.cssText = `
    position: fixed;
    bottom: 140px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.75);
    color: white;
    padding: 8px 24px;
    border-radius: 6px;
    font-size: 14px;
    display: none;
    z-index: 100;
    pointer-events: none;
  `;
  document.body.appendChild(hint);
  
  updateFortificationUI();
}

// R键旋转预览模型90度
function rotatePreview() {
  previewRotation += Math.PI / 2; // 每次旋转90度
}

// 长按E：开始移动工事
function startMoveFort() {
  if (movingFort) return; // 已在移动中
  
  // 查找准星指向的工事
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  
  for (const fort of window.deployedFortifications) {
    if (fort.health <= 0) continue;
    const meshes = [];
    fort.mesh.traverse(c => { if (c.isMesh) meshes.push(c); });
    const intersects = raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      // 找到目标工事，进入移动模式
      movingFort = fort;
      movingFortOrigPos = fort.mesh.position.clone();
      movingFortOrigRot = fort.mesh.rotation.y;
      
      // 设置预览为该工事类型
      previewFortType = null; // 强制重建预览
      window.selectedFortification = fort.type;
      previewRotation = fort.mesh.rotation.y;
      
      // 隐藏原工事
      fort.mesh.visible = false;
      return;
    }
  }
}

// 确认移动工事位置
function confirmMoveFort() {
  if (!movingFort || !previewMesh || !previewValid) return;
  
  movingFort.mesh.position.copy(previewMesh.position);
  movingFort.mesh.rotation.y = previewRotation;
  movingFort.mesh.visible = true;
  
  movingFort = null;
  movingFortOrigPos = null;
  movingFortOrigRot = null;
  
  // 清理预览
  if (previewMesh) {
    scene.remove(previewMesh);
    previewMesh = null;
    previewFortType = null;
  }
}

// Tab取消移动，回到原位
function cancelMoveFort() {
  if (!movingFort) return;
  
  movingFort.mesh.visible = true;
  
  movingFort = null;
  movingFortOrigPos = null;
  movingFortOrigRot = null;
  
  if (previewMesh) {
    scene.remove(previewMesh);
    previewMesh = null;
    previewFortType = null;
  }
}

// 检查是否在移动工事
function isMovingFort() {
  return !!movingFort;
}

// 战后清理
function cleanupFortifications() {
  // 回收所有工事（80%返还）
  let totalRefund = 0;
  window.deployedFortifications.forEach(fort => {
    const refund = Math.floor(fort.def.cost * 0.8);
    totalRefund += refund;
  });
  addBattleParts(totalRefund);

  // 清除所有工事
  while (window.deployedFortifications.length > 0) {
    destroyFortification(0);
  }
  
  return getParts();
}

// 导出
window.FortificationSystem = {
  init: initFortificationSystem,
  getDefs: getFortificationDefs,
  addParts: addBattleParts,
  deploy: deployFortification,
  update: updateFortifications,
  updatePreview: updatePreview,
  cycleFortification: cycleFortification,
  selectFortificationByIndex: selectFortificationByIndex,
  placeFortification: placeFortification,
  recycleFortificationAtCursor: recycleFortificationAtCursor,
  handleClick: handleDeploymentClick,
  createUI: createFortificationUI,
  cleanup: cleanupFortifications,
  enterDeploymentMode: enterDeploymentMode,
  exitDeploymentMode: exitDeploymentMode,
  getBattleResources: () => ({ parts: getParts() }),
  getParts: getParts,
  setParts: setParts,
  syncPartsFromShelter: syncPartsFromShelter,
  rotatePreview: rotatePreview,
  startMoveFort: startMoveFort,
  confirmMoveFort: confirmMoveFort,
  cancelMoveFort: cancelMoveFort,
  isMovingFort: isMovingFort,
  recycleByIndex: function(index) {
    if (!window.deployedFortifications || index < 0 || index >= window.deployedFortifications.length) {
      console.warn('[工事系统] recycleByIndex: 无效索引', index);
      return 0;
    }
    const fort = window.deployedFortifications[index];
    if (!fort) {
      console.warn('[工事系统] recycleByIndex: 工事不存在', index);
      return 0;
    }
    if (fort.def && fort.def.type === 'robo_dog') {
      const refund = recycleFortification(index);
      return refund;
    }
    console.warn('[工事系统] recycleByIndex: 不是机器狗', fort.def ? fort.def.type : 'no def');
    return 0;
  },
  // 电力系统：全部工事紧急修复
  repairAll: function(percent) {
    if (!window.deployedFortifications) return 0;
    let repaired = 0;
    window.deployedFortifications.forEach(fort => {
      if (!fort || fort.destroyed) return;
      const maxHP = fort.maxHealth || 100;
      fort.health = Math.min(maxHP, fort.health + maxHP * percent);
      repaired++;
      // 修复特效
      if (fort.mesh) {
        const sparkGeo = new THREE.SphereGeometry(0.3, 4, 4);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0x27ae60, transparent: true, opacity: 0.8 });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        spark.position.copy(fort.mesh.position);
        spark.position.y = 1;
        scene.add(spark);
        setTimeout(() => { scene.remove(spark); sparkGeo.dispose(); sparkMat.dispose(); }, 800);
      }
    });
    return repaired;
  }
};

// 确认导出成功
console.log('[工事系统] FortificationSystem 已导出，update 函数:', typeof window.FortificationSystem.update);
