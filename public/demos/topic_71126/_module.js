
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* =========================================================
 * 户型布局配置（单位：米）
 * 坐标系：X 东，Z 南，Y 上
 * ROOMS.x / ROOMS.z 是相对 HOUSE 原点的局部坐标
 * 总尺寸：12m × 10m = 120㎡
 * HOUSE 世界坐标：x ∈ [-6, 6], z ∈ [-5, 5]
 * =======================================================*/
const HOUSE = {
  width: 12,
  depth: 10,
  height: 2.8,
  wallThickness: 0.2,
  origin: { x: -6, z: -5 }
};

/* 房间布局（x,z 为房间左上角在 HOUSE 局部坐标中的位置）
 *        z=0 ┌────────┬──────────────┬────────┐
 *            │ 主卧   │   客厅+餐厅    │ 次卧1  │
 *            │ 4×4=16 │    4×10=40    │ 4×4=16 │
 *        z=4 ├────────┤   公共区       ├────────┤
 *            │ 厨房   │   x:4~8       │ 次卧2  │
 *            │ 4×3=12│                │ 4×3=12│
 *        z=7 ├────────┤                ├────────┤
 *            │ 卫生间 │                │        │
 *            │ 4×3=12│                │        │
 *       z=10 └────────┴──────────────┴────────┘
 *                 x:0~4     x:4~8        x:8~12
 */
const ROOMS = [
  { id: 'living',  name: '客厅+餐厅', color: '#c9a063', x: 4, z: 0,  width: 4, depth: 10 },
  { id: 'master',  name: '主卧',     color: '#6ba3ff', x: 0, z: 0,  width: 4, depth: 4  },
  { id: 'kitchen', name: '厨房',     color: '#ff9f6b', x: 0, z: 4,  width: 4, depth: 3  },
  { id: 'bathroom',name: '卫生间',   color: '#a0a0c0', x: 0, z: 7,  width: 4, depth: 3  },
  { id: 'second',  name: '次卧1',    color: '#88d080', x: 8, z: 0,  width: 4, depth: 4  },
  { id: 'third',   name: '次卧2',    color: '#d68fd0', x: 8, z: 4,  width: 4, depth: 3  },
  { id: 'storage', name: '储物间',   color: '#c9a888', x: 8, z: 7,  width: 4, depth: 3  }
];

const DEVICE_TEMPLATES = {
  light:   { label: '灯',   icon: '💡', on: false, extra: { brightness: 0.8 } },
  ac:      { label: '空调', icon: '❄️', on: false, extra: { temperature: 24 } },
  music:   { label: '音乐', icon: '🎵', on: false, extra: { volume: 0.4 } },
  alarm:   { label: '闹钟', icon: '⏰', on: false, extra: { hour: 7, minute: 0 } }
};

const ROOM_DEVICES = {
  living:   ['light1', 'light2', 'ac', 'music'],
  master:   ['light', 'ac', 'music', 'alarm'],
  second:   ['light', 'ac', 'music', 'alarm'],
  third:    ['light', 'ac', 'music', 'alarm'],
  kitchen:  ['light', 'ac'],
  bathroom: ['light'],
  storage:  ['light']
};

// 设备在房间内的局部坐标（相对于房间中心的偏移）
const DEVICE_POSITIONS = {
  'living-light1':  { x: -1.5, y: 2.7, z: -2 },
  'living-light2':  { x:  1.5, y: 2.7, z:  2 },
  'living-ac':      { x: -1.8, y: 2.5, z: -4.5 },
  'living-music':   { x:  1.8, y: 1.0, z: -4.5 },
  'master-light':   { x:  0.0, y: 2.7, z:  0.0 },
  'master-ac':      { x: -1.8, y: 2.5, z: -1.8 },
  'master-music':   { x:  1.5, y: 1.2, z:  1.5 },
  'master-alarm':   { x: -1.5, y: 0.8, z:  1.8 },
  'second-light':   { x:  0.0, y: 2.7, z:  0.0 },
  'second-ac':      { x:  1.8, y: 2.5, z: -1.8 },
  'second-music':   { x: -1.5, y: 1.2, z:  1.5 },
  'second-alarm':   { x:  1.5, y: 0.8, z:  1.8 },
  'third-light':    { x:  0.0, y: 2.7, z:  0.0 },
  'third-ac':       { x:  1.8, y: 2.5, z: -1.2 },
  'third-music':    { x: -1.5, y: 1.2, z:  1.0 },
  'third-alarm':    { x:  1.5, y: 0.8, z:  1.0 },
  'kitchen-light':  { x:  0.0, y: 2.7, z:  0.0 },
  'kitchen-ac':     { x: -1.8, y: 2.5, z: -1.2 },
  'bathroom-light': { x:  0.0, y: 2.7, z:  0.0 },
  'storage-light':  { x:  0.0, y: 2.7, z:  0.0 }
};

/* =========================================================
 * 状态管理
 * =======================================================*/
const deviceState = {};
ROOMS.forEach(r => {
  (ROOM_DEVICES[r.id] || []).forEach(devId => {
    const baseType = devId.replace(/\d+$/, '');
    const tpl = DEVICE_TEMPLATES[baseType];
    if (tpl) {
      deviceState[`${r.id}-${devId}`] = {
        room: r.id,
        type: baseType,
        label: `${r.name}·${tpl.label}`,
        icon: tpl.icon,
        on: tpl.on,
        extra: { ...tpl.extra }
      };
    }
  });
});

/* =========================================================
 * Three.js 基础
 * =======================================================*/
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1620);
scene.fog = new THREE.Fog(0x0e1620, 30, 80);

const camera = new THREE.PerspectiveCamera(
  55, window.innerWidth / window.innerHeight, 0.1, 200
);
camera.position.set(14, 14, 14);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('scene').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

/* ---------- 环境光（基础照明，用于当灯全关时可见）---------- */
const ambientLight = new THREE.AmbientLight(0x556677, 0.35);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x88aaff, 0x443322, 0.25);
scene.add(hemiLight);

// 一束模拟窗外的日光，让地面有基本阴影
const sunLight = new THREE.DirectionalLight(0xffe4b5, 0.5);
sunLight.position.set(20, 30, 15);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.left = -20;
sunLight.shadow.camera.right = 20;
sunLight.shadow.camera.top = 20;
sunLight.shadow.camera.bottom = -20;
scene.add(sunLight);

/* =========================================================
 * 建模：地面 + 房间地板 + 外墙 + 内墙
 * =======================================================*/
const deviceMeshes = [];  // 用于 Raycaster 检测

// 地面（房子外的草地）
const groundGeo = new THREE.PlaneGeometry(60, 60);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x2a3a2a, roughness: 0.9
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
ground.receiveShadow = true;
scene.add(ground);

// 房子地板（每个房间不同颜色）
if (!window.__roomFloors) window.__roomFloors = {};
ROOMS.forEach(r => {
  const floorGeo = new THREE.PlaneGeometry(r.width - 0.02, r.depth - 0.02);
  const floorMat = new THREE.MeshStandardMaterial({
    color: r.color, roughness: 0.7, metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(
    HOUSE.origin.x + r.x + r.width / 2,
    0,
    HOUSE.origin.z + r.z + r.depth / 2
  );
  floor.receiveShadow = true;
  scene.add(floor);

  // 保存原始 emissive 信息，供悬浮时用于"房间高亮
  floor.userData.roomId = r.id;
  floor.userData.originalEmissive = 0x000000;
  floor.userData.originalEmissiveIntensity = 0;
  window.__roomFloors[r.id] = floor;

  // 房间名称文字（使用 CanvasTexture）
  const label = makeTextSprite(r.name, '#ffffff');
  label.position.set(
    HOUSE.origin.x + r.x + r.width / 2,
    0.02,
    HOUSE.origin.z + r.z + r.depth / 2
  );
  scene.add(label);
});

/* ---------- 墙体 ---------- */
const wallMat = new THREE.MeshStandardMaterial({
  color: 0xe8e4d8, roughness: 0.8
});

function addWall(x, z, width, depth, height = HOUSE.height) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const wall = new THREE.Mesh(geo, wallMat);
  wall.position.set(
    HOUSE.origin.x + x,
    height / 2,
    HOUSE.origin.z + z
  );
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
}

/* ---------- 外墙（四周，墙中心对齐 HOUSE 边界） ---------- */
const t = HOUSE.wallThickness;
// 北墙（z = 0）：x 中心 = HOUSE.width/2 = 6，宽度覆盖全宽
addWall(HOUSE.width / 2, -t / 2, HOUSE.width + t, t);
// 南墙（z = HOUSE.depth = 10）
addWall(HOUSE.width / 2, HOUSE.depth + t / 2, HOUSE.width + t, t);
// 西墙（x = 0）
addWall(-t / 2, HOUSE.depth / 2, t, HOUSE.depth + t);
// 东墙（x = HOUSE.width = 12）
addWall(HOUSE.width + t / 2, HOUSE.depth / 2, t, HOUSE.depth + t);

/* ---------- 内墙（分隔房间，所有坐标均为 HOUSE 局部坐标） ---------- */
// 纵向内墙 x=4：分隔 左列房间 与 客厅
//   主卧区 z∈[0,4] 整段
addWall(4, 2, t, 4);
//   厨房区 z∈[4,7]：z∈[5,6] 留 1m 门洞
addWall(4, 4.5, t, 1);
addWall(4, 6.5, t, 1);
//   卫生间区 z∈[7,10]：z∈[8,9] 留 1m 门洞
addWall(4, 7.5, t, 1);
addWall(4, 9.5, t, 1);

// 纵向内墙 x=8：分隔 客厅 与 右列房间
//   次卧1区 z∈[0,4] 整段
addWall(8, 2, t, 4);
//   次卧2区 z∈[4,7]：z∈[5,6] 留 1m 门洞
addWall(8, 4.5, t, 1);
addWall(8, 6.5, t, 1);
//   次卧2南侧 z∈[7,10] 整段（次卧2 封闭到 z=10）
addWall(8, 8.5, t, 3);

// 横向内墙 z=4
//   主卧/厨房分隔：x∈[0,4]
addWall(2, 4, 4, t);
//   次卧1/次卧2 分隔：x∈[8,12]
addWall(10, 4, 4, t);
//   客厅 x∈[4,8] 保持贯通

// 横向内墙 z=7
//   厨房/卫生间分隔：x∈[0,4]
addWall(2, 7, 4, t);
//   次卧2 南边界：x∈[8,12],z=7，x∈[9,10] 留 1m 门洞
addWall(8.5, 7, 1, t);
addWall(11.5, 7, 1, t);

/* ---------- 窗户（简单矩形嵌入外墙） ---------- */
const windowMat = new THREE.MeshStandardMaterial({
  color: 0x88bbdd, emissive: 0x112233, transparent: true, opacity: 0.5
});
function addWindow(x, z, w, d, h) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const win = new THREE.Mesh(geo, windowMat);
  win.position.set(
    HOUSE.origin.x + x,
    HOUSE.height * 0.55,
    HOUSE.origin.z + z
  );
  scene.add(win);
}
// 主卧窗户（西墙 x≈0）
addWindow(0.1, 2, 1.5, 0.05, 1.2);
// 卫生间窗户（西墙 x≈0）
addWindow(0.1, 8.5, 1.2, 0.05, 1.0);
// 次卧1窗户（东墙 x≈12）
addWindow(11.9, 2, 1.5, 0.05, 1.2);
// 次卧2窗户（东墙 x≈12）
addWindow(11.9, 5.5, 1.5, 0.05, 1.2);
// 客厅北窗
addWindow(6, 0.1, 2.5, 0.05, 1.2);
// 厨房北窗
addWindow(2, 0.1, 1.2, 0.05, 1.0);

/* =========================================================
 * 设备建模：灯、空调、音乐、闹钟
 * =======================================================*/
const roomMap = {};
ROOMS.forEach(r => roomMap[r.id] = r);

Object.keys(deviceState).forEach(fullId => {
  const state = deviceState[fullId];
  const pos = DEVICE_POSITIONS[fullId];
  if (!pos) return;
  const room = roomMap[state.room];
  const worldX = HOUSE.origin.x + room.x + room.width / 2 + pos.x;
  const worldY = pos.y;
  const worldZ = HOUSE.origin.z + room.z + room.depth / 2 + pos.z;

  const group = new THREE.Group();
  group.userData = { deviceId: fullId, ...state };

  if (state.type === 'light') {
    // 灯泡：球形吊灯（更亮的暖黄光）
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 20, 20),
      new THREE.MeshStandardMaterial({
        color: 0xffe9b8,
        emissive: 0xffc968,
        emissiveIntensity: 0.6
      })
    );
    bulb.position.y = 0;

    // 吊线
    const lineGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6);
    const line = new THREE.Mesh(lineGeo, new THREE.MeshStandardMaterial({ color: 0x888888 }));
    line.position.y = 0.2;

    // 实际光照（更亮，范围更大）
    const light = new THREE.PointLight(0xffd98a, 0, 18, 1.4);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    light.shadow.bias = -0.003;

    group.add(line);
    group.add(bulb);
    group.add(light);
    group.userData.visualBulb = bulb;
    group.userData.light = light;
  }

  else if (state.type === 'ac') {
    // 空调：墙上矩形机壳 + 出风口
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.35, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xf0f6ff, roughness: 0.4, metalness: 0.1 })
    );
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.05, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x223344 })
    );
    vent.position.y = -0.18;
    group.add(body, vent);

    // 冷气粒子（从小点出发，向下飘，青蓝色）
    const particleGroup = new THREE.Group();
    const particles = [];
    // 让粒子从出风口下方一点点出生
    const AC_Y_OFFSET = -0.22;
    for (let i = 0; i < 28; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.05 + Math.random() * 0.03, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0xb8e3ff,
          emissive: 0x7ec8ff,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0
        })
      );
      // 粒子随机分布在出风口宽度上（±0.5），Z 方向轻微前后
      p.position.set(
        (Math.random() - 0.5) * 1.0,
        AC_Y_OFFSET - Math.random() * 0.1,
        (Math.random() - 0.5) * 0.15 + 0.05
      );
      // 速度：主要向下 (-Y)，小的左右/前后抖动
      p.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        -(0.35 + Math.random() * 0.35),   // 向下"吹气"
        (Math.random() - 0.5) * 0.15
      );
      p.userData.life = Math.random();
      p.userData.active = false;
      particleGroup.add(p);
      particles.push(p);
    }
    group.add(particleGroup);
    group.userData.particles = particles;
    group.userData.acYOffset = AC_Y_OFFSET;
  }

  else if (state.type === 'music') {
    // 音响：方块 + 出音口
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 })
    );
    const cone = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0x444444, side: THREE.DoubleSide })
    );
    cone.position.z = 0.21;
    group.add(body, cone);

    // 声波圆环（3 个）
    const waveGroup = new THREE.Group();
    const waves = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.25 + i * 0.15, 0.28 + i * 0.15, 24),
        new THREE.MeshBasicMaterial({
          color: 0x66ccff, transparent: true, opacity: 0, side: THREE.DoubleSide
        })
      );
      ring.position.z = 0.22;
      ring.userData.offset = i * 0.33;
      waveGroup.add(ring);
      waves.push(ring);
    }
    group.add(waveGroup);
    group.userData.waves = waves;
  }

  else if (state.type === 'alarm') {
    // 闹钟：圆柱体 + 两个"铃铛"
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.1, 20),
      new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 20),
      new THREE.MeshStandardMaterial({ color: 0xffeecc })
    );
    face.rotation.x = Math.PI / 2;
    face.position.y = 0.06;
    const bell1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    );
    bell1.position.set(-0.15, 0.08, 0);
    const bell2 = bell1.clone();
    bell2.position.x = 0.15;
    group.add(body, face, bell1, bell2);
    group.userData.baseY = 0;
  }

  // 点击热区：每个设备添加一个不可见但可被 Raycaster 检测的大盒子
  const hitGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBox = new THREE.Mesh(hitGeo, hitMat);
  hitBox.userData = group.userData;
  group.add(hitBox);

  group.position.set(worldX, worldY, worldZ);
  scene.add(group);
  deviceMeshes.push(hitBox);
  state._mesh = group;
});

/* =========================================================
 * 文字 Sprite
 * =======================================================*/
function makeTextSprite(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false
  }));
  sprite.scale.set(1.8, 0.45, 1);
  return sprite;
}

/* =========================================================
 * 场景预设（场景1：回家 / 睡眠 / 电影 / 离家）
 * devices: { 'roomId-type': { on, extra } }
 * =======================================================*/
const scenePresets = {
  home: {
    name: '回家',
    icon: '🏠',
    desc: '客厅主卧灯开，空调 24°C，音乐轻松',
    devices: {
      'living-light': { on: true, extra: { brightness: 1.0 } },
      'master-light': { on: true, extra: { brightness: 0.8 } },
      'kitchen-light': { on: true, extra: { brightness: 0.7 } },
      'second-light': { on: true, extra: { brightness: 0.8 } },
      'living-ac':    { on: true, extra: { temperature: 24 } },
      'master-ac': { on: true, extra: { temperature: 24 } },
      'living-music': { on: true, extra: { volume: 0.35 } }
    }
  },
  sleep: {
    name: '睡眠',
    icon: '😴',
    desc: '全关灯，仅主卧空调舒适睡眠 26°C',
    devices: {
      'living-light': { on: false },
      'kitchen-light': { on: false },
      'second-light': { on: false },
      'master-light': { on: false },
      'third-light': { on: false },
      'kitchen-ac': { on: false },
      'second-ac': { on: false },
      'third-ac': { on: false },
      'master-ac': { on: true, extra: { temperature: 26 } },
      'living-music': { on: false },
      'master-music': { on: false },
      'second-music': { on: false },
      'third-music': { on: false }
    }
  },
  movie: {
    name: '电影',
    icon: '🎬',
    desc: '客厅灯暗至 30%，其余关灯，空调 25°C',
    devices: {
      'living-light': { on: true, extra: { brightness: 0.3 } },
      'master-light': { on: false },
      'kitchen-light': { on: false },
      'second-light': { on: false },
      'third-light': { on: false },
      'master-ac': { on: true, extra: { temperature: 25 } },
      'living-ac': { on: true, extra: { temperature: 25 } },
      'living-music': { on: false }
    }
  },
  away: {
    name: '离家',
    icon: '🚪',
    desc: '全关，仅保留闹钟设置',
    devices: {}   // devices 为空会触发 "全关"
  }
};

/* =========================================================
 * 应用场景（带动画过渡）
 * =======================================================*/
function applyScene(sceneKey, animated = true) {
  const target = scenePresets[sceneKey];
  if (!target) return;

  // 针对"离家"：遍历所有设备
  // 先默认所有设备关闭（除闹钟外），再应用场景中指定的状态
  Object.keys(deviceState).forEach(id => {
    const st = deviceState[id];
    if (st.type === 'alarm') return;

    if (id in target.devices) {
      // 场景明确指定该设备的状态
      const target = deviceState[id];
      // 延迟，稍后统一处理
    }
  });

  // 实际执行：先关闭所有非闹钟设备，然后应用场景
  Object.keys(deviceState).forEach(id => {
    const st = deviceState[id];
    if (st.type === 'alarm') return;

    const spec = target.devices[id];
    // 离家模式：全部关闭
    if (sceneKey === 'away') {
      if (st.on) toggleDevice(id, false, animated);
      return;
    }
    // 其他场景：应用 spec 或保持不变
    if (spec) {
      if (spec.on !== undefined) {
        if (st.on !== spec.on) toggleDevice(id, spec.on, animated);
      }
      if (spec.extra) {
          Object.keys(spec.extra).forEach(k => {
              if (st.extra && k in st.extra) st.extra[k] = spec.extra[k];
          });
          // 应用设备更新
          applyByType(id);
      }
    }
  });

  renderPanel();
  renderSceneBar(sceneKey);
  if (window.audio && window.audio.speak) {
    try { window.audio.speak('已切换到' + target.name + '模式'); } catch(e) {}
  }
}

function applyByType(id) {
    const st = deviceState[id];
    if (st.type === 'light') applyLight(id);
    if (st.type === 'ac') applyAC(id);
    if (st.type === 'music') applyMusic(id);
    if (st.type === 'alarm') applyAlarm(id);
}

/* =========================================================
 * 渲染场景选择条
 * =======================================================*/
function renderSceneBar(activeKey) {
  const bar = document.getElementById('scene-bar');
  if (!bar) return;
  bar.innerHTML = '';
  Object.keys(scenePresets).forEach(key => {
    const p = scenePresets[key];
    const btn = document.createElement('div');
    btn.className = 'scene-btn';
    btn.dataset.scene = key;
    if (key === activeKey) btn.style.boxShadow = '0 0 14px rgba(255, 210, 138, 0.45)';
    btn.innerHTML = `<span class="icon">${p.icon}</span>${p.name}`;
    btn.title = p.desc;
    btn.onclick = () => applyScene(key, true);
    bar.appendChild(btn);
  });
}

/* =========================================================
 * 房间高亮（鼠标悬浮卡片 → 3D 房间地板变色
 * =======================================================*/
const roomHighlight = {
  active: null,
  set(roomId, on) {
    // 找到地板 mesh 并改变 emissive
    if (!window.__roomFloors) return;
    const mesh = window.__roomFloors[roomId];
    if (!mesh) return;
    if (on) {
      mesh.material.emissive.setHex(0x8fd6f4);
      mesh.material.emissiveIntensity = 0.6;
    } else {
      // 恢复原颜色
      const original = mesh.userData.originalEmissive || 0x000000;
      mesh.material.emissive.setHex(original);
      mesh.material.emissiveIntensity = mesh.userData.originalEmissiveIntensity || 0;
    }
    const card = document.querySelector(`.room-card[data-room="${roomId}"]`);
    if (card) card.classList.toggle('highlighted', on);
  }
};

/* =========================================================
 * 定时任务管理
 * 支持两种：
 *   - "once"：N 分钟后执行一次
 *   - "daily"：每天 HH:MM 执行
 * tasks = [{ id, mode, minutes|hour, minute, deviceId, action } ]
 * =======================================================*/
let scheduledTasks = [];
let taskTickTimer = null;
const STORAGE_KEY = 'smartHome.tasks';

function saveTasks() {
  const data = scheduledTasks.map(t => ({
    mode: t.mode, minutes: t.minutes, hour: t.hour, minute: t.minute,
    action: t.action, deviceId: t.deviceId, _fired: false
  }));
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
}
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch(e) { return []; }
}
function addTask(task) {
  task.id = 't' + Date.now() + Math.floor(Math.random() * 1000);
  task._fired = false;
  if (task.mode === 'once') {
    task._fireAt = Date.now() + (task.minutes || 1) * 60 * 1000;
  }
  scheduledTasks.push(task);
  saveTasks();
  startTaskTimer();
  renderSchedule();
}
function removeTask(id) {
  scheduledTasks = scheduledTasks.filter(t => t.id !== id);
  saveTasks();
  renderSchedule();
}
function startTaskTimer() {
  if (taskTickTimer) return;
  taskTickTimer = setInterval(() => {
    taskTick();
    renderSchedule();   // 每 15 秒刷新一下倒计时文本
  }, 15 * 1000);
}
function taskTick() {
  const now = new Date();
  const nowTs = Date.now();
  scheduledTasks.forEach(t => {
    if (t.mode === 'once') {
      if (!t._fired && nowTs >= (t._fireAt) {
        executeTask(t);
        t._fired = true;
        saveTasks();
        renderSchedule();
      }
    } else if (t.mode === 'daily') {
      const key = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate();
      if (t._firedOn !== key && now.getHours() === t.hour && now.getMinutes() === t.minute) {
        executeTask(t);
        t._firedOn = key;
        saveTasks();
        renderSchedule();
      }
    }
  });
  // 清理已经执行完的 once 任务（保留在列表中让用户看到"已执行"）
}
function executeTask(task) {
  const { deviceId: id, action } = task;
  if (id === '__scene__') {
    if (window.audio && window.audio.speak) {
      try { window.audio.speak('定时任务：切换到' + (scenePresets[action]?.name || action)); } catch(e){}
    }
    applyScene(action, true);
    return;
  }
  if (!deviceState[id]) return;
  const st = deviceState[id];
  const shouldOn = (action === 'on');
  if (st.on !== shouldOn) toggleDevice(id, shouldOn, true);
  if (window.audio && window.audio.speak) {
    try { window.audio.speak('定时任务已执行：' + st.label); } catch(e){}
  }
}

/* =========================================================
 * 渲染定时任务区块
 * =======================================================*/
function renderSchedule() {
  const block = document.getElementById('schedule-block');
  if (!block) return;
  block.innerHTML = '';
  const h = document.createElement('h2');
  h.textContent = '⏰ 定时任务';
  block.appendChild(h);

  // 添加表单
  const form = document.createElement('div');
  form.className = 'task-add';
  form.innerHTML = `
    <select id="task-mode">
      <option value="once">N 分钟后</option>
      <option value="daily">每天</option>
    </select>
    <input type="number" id="task-minutes" placeholder="分钟" min="1" min="1" style="width:60px" />
    <input type="time" id="task-time" style="display:none" />
    →
    <select id="task-target">
      <option value="scene-home">切换到：回家</option>
      <option value="scene-sleep">切换到：睡眠</option>
      <option value="scene-movie">切换到：电影</option>
      <option value="scene-away">切换到：离家</option>
    </select>
    <select id="task-action">
      <option value="on">打开</option>
      <option value="off">关闭</option>
    </select>
    <button id="task-add-btn">+ 添加</button>
  `;
  block.appendChild(form);

  // mode 切换时显示对应输入
  const modeSel = form.querySelector('#task-mode');
  const minutesInput = form.querySelector('#task-minutes');
  const timeInput = form.querySelector('#task-time');
  const targetSel = form.querySelector('#task-target');
  modeSel.addEventListener('change', () => {
    if (modeSel.value === 'once') {
      minutesInput.style.display = '';
      timeInput.style.display = 'none';
    } else {
      minutesInput.style.display = 'none';
      timeInput.style.display = '';
    }
  });

  // 目标下拉：添加所有设备
  Object.keys(deviceState).forEach(fullId => {
    const st = deviceState[fullId];
    if (st.type === 'alarm') return;
    const opt = document.createElement('option');
    opt.value = 'device-' + fullId;
    opt.textContent = st.label;
    targetSel.appendChild(opt);
  });

  form.querySelector('#task-add-btn').onclick = () => {
    const mode = modeSel.value;
    const target = targetSel.value;
    const action = form.querySelector('#task-action').value;
    if (mode === 'once') {
      const mins = parseInt(minutesInput.value);
      if (!mins || mins < 1) { alert('请输入分钟数'); return; }
      if (target.startsWith('scene-')) {
        addTask({ mode, minutes: mins, action: target.substring(6), deviceId: '__scene__' });
      } else {
        addTask({ mode, minutes: mins, action: action, deviceId: target.substring(7) });
      }
    } else {
      const [h, m] = timeInput.value.split(':').map(x => parseInt(x));
      if (isNaN(h) || isNaN(m)) { alert('请选择时间'); return; }
      if (target.startsWith('scene-')) {
        addTask({ mode, hour: h, minute: m, action: target.substring(6), deviceId: '__scene__' });
      } else {
        addTask({ mode, hour: h, minute: m, action: action, deviceId: target.substring(7) });
      }
    }
  };

  // 任务列表
  const list = document.createElement('div');
  list.className = 'task-list';
  if (scheduledTasks.length === 0) {
    list.innerHTML = '<div class="task-empty">暂无定时任务。添加上方设置吧～</div>';
  } else {
    scheduledTasks.forEach(t => {
      const row = document.createElement('div');
      row.className = 'task-row';
      let whenText, whatText;
      if (t.mode === 'once') {
        const remain = Math.max(0, Math.ceil(((t._fireAt - Date.now()) / 60000));
        whenText = t._fired ? '已执行' : `${remain} 分钟后`;
      } else {
        whenText = `每天 ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
      }
      if (t.deviceId === '__scene__') {
        whatText = `切换到 "${scenePresets[t.action]?.name || t.action}" 模式`;
      } else {
        const st = deviceState[t.deviceId];
        whatText = `${st ? st.label : t.deviceId} → ${t.action === 'on' ? '打开' : '关闭'}`;
      }
      row.innerHTML = `<span class="when">${whenText}</span> → <span class="what">${whatText}</span>`;
      if (t._fired) {
        const done = document.createElement('span');
        done.style.color = '#7a8ba0';
        done.textContent = ' ✓';
        row.appendChild(done);
      }
      const del = document.createElement('button');
      del.className = 'del';
      del.textContent = '×';
      del.onclick = () => removeTask(t.id);
      row.appendChild(del);
      list.appendChild(row);
    });
  }
  block.appendChild(list);
}

/* =========================================================
 * 右侧面板 UI 生成（重构为房间卡片 + 悬浮高亮 + 房间尺寸
 * =======================================================*/
const panelRoot = document.getElementById('rooms');
function renderPanel() {
  panelRoot.innerHTML = '';
  ROOMS.forEach(r => {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.dataset.room = r.id;
    const sizeText = `${r.width.toFixed(1)}m × ${r.depth.toFixed(1)}m · ${(r.width * r.depth).toFixed(1)}㎡`;
    card.innerHTML = `<h2>${r.name}<span class="room-size">${sizeText}</span></h2>`;

    // 悬浮卡片 → 3D 场景高亮
    card.onmouseenter = () => roomHighlight.set(r.id, true);
    card.onmouseleave = () => roomHighlight.set(r.id, false);

    (ROOM_DEVICES[r.id] || []).forEach(devId => {
      const fullId = `${r.id}-${devId}`;
      const st = deviceState[fullId];
      if (!st) return;

      const row = document.createElement('div');
      row.className = 'device-row';
      row.innerHTML = `
        <div class="label">
          <span class="icon">${st.icon}</span>
          <span>${st.label.split('·')[1] || st.label}</span>
        </div>
        <label class="switch">
          <input type="checkbox" ${st.on ? 'checked' : ''} data-device="${fullId}" />
          <span class="slider"></span>
        </label>
      `;
      card.appendChild(row);

      // 附加参数
      if (st.extra) {
        const extra = document.createElement('div');
        extra.className = 'extra';
        if (st.type === 'light' && 'brightness' in st.extra) {
          extra.innerHTML = `
            亮度 <input type="range" min="0.1" max="1" step="0.1"
                    value="${st.extra.brightness}" data-extra-brightness="${fullId}" />
            <span>${Math.round(st.extra.brightness * 100)}%</span>
          `;
        }
        if (st.type === 'ac' && 'temperature' in st.extra) {
          extra.innerHTML = `
            温度 <input type="range" min="16" max="30" step="1"
                    value="${st.extra.temperature}" data-extra-temp="${fullId}" />
            <span>${st.extra.temperature}°C</span>
          `;
        }
        if (st.type === 'music' && 'volume' in st.extra) {
          extra.innerHTML = `
            音量 <input type="range" min="0" max="1" step="0.05"
                    value="${st.extra.volume}" data-extra-vol="${fullId}" />
            <span>${Math.round(st.extra.volume * 100)}%</span>
          `;
        }
        if (st.type === 'alarm' && 'hour' in st.extra) {
          extra.innerHTML = `
            <input type="number" min="0" max="23" value="${st.extra.hour}"
                   class="alarm-input" data-extra-hour="${fullId}" /> :
            <input type="number" min="0" max="59" value="${st.extra.minute}"
                   class="alarm-input" data-extra-min="${fullId}" />
            ${st._ringing ? '<span class="alarm-badge">响铃中</span>' : ''}
          `;
        }
        card.appendChild(extra);
      }
    });
    panelRoot.appendChild(card);
  });

  // 事件绑定
  panelRoot.querySelectorAll('input[data-device]').forEach(inp => {
    inp.addEventListener('change', e => {
      const id = e.target.dataset.device;
      toggleDevice(id, e.target.checked);
    });
  });
  panelRoot.querySelectorAll('[data-extra-brightness]').forEach(inp => {
    inp.addEventListener('input', e => {
      const id = e.target.dataset.extraBrightness;
      deviceState[id].extra.brightness = parseFloat(e.target.value);
      if (deviceState[id].on) applyLight(id);
      renderPanel();
    });
  });
  panelRoot.querySelectorAll('[data-extra-temp]').forEach(inp => {
    inp.addEventListener('input', e => {
      const id = e.target.dataset.extraTemp;
      deviceState[id].extra.temperature = parseInt(e.target.value);
      renderPanel();
    });
  });
  panelRoot.querySelectorAll('[data-extra-vol]').forEach(inp => {
    inp.addEventListener('input', e => {
      const id = e.target.dataset.extraVol;
      deviceState[id].extra.volume = parseFloat(e.target.value);
      if (deviceState[id].on) applyMusic(id);
      renderPanel();
    });
  });
  panelRoot.querySelectorAll('[data-extra-hour]').forEach(inp => {
    inp.addEventListener('change', e => {
      const id = e.target.dataset.extraHour;
      deviceState[id].extra.hour = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
    });
  });
  panelRoot.querySelectorAll('[data-extra-min]').forEach(inp => {
    inp.addEventListener('change', e => {
      const id = e.target.dataset.extraMin;
      deviceState[id].extra.minute = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
    });
  });
}

/* ====== 场景 + 定时任务初始化 ====== */
renderSceneBar();
// 恢复本地存储的定时任务
try {
    const restored = loadTasks();
    restored.forEach(t => {
        if (t.mode === 'once') {
            const remain = (t._fireAt || (Date.now() + t.minutes * 60000)) - Date.now();
            if (remain > 0) {
                scheduledTasks.push({
                    id: 't' + Date.now() + Math.floor(Math.random() * 1000),
                    mode: t.mode, minutes: t.minutes,
                    action: t.action, deviceId: t.deviceId,
                    _fireAt: t._fireAt, _fired: false
                });
            }
        } else {
            scheduledTasks.push({
                id: 't' + Date.now() + Math.floor(Math.random() * 1000),
                mode: t.mode, hour: t.hour, minute: t.minute,
                action: t.action, deviceId: t.deviceId,
                _fired: false
            });
        }
    });
    if (scheduledTasks.length > 0) startTaskTimer();
} catch(e) {}
renderSchedule();

renderPanel();

/* =========================================================
 * 设备状态切换 + 视觉应用
 * =======================================================*/
function toggleDevice(id, forceState) {
  const st = deviceState[id];
  if (!st) return;
  const newOn = (forceState !== undefined) ? forceState : !st.on;
  st.on = newOn;

  if (st.type === 'light') applyLight(id);
  if (st.type === 'ac')    applyAC(id);
  if (st.type === 'music') applyMusic(id);
  if (st.type === 'alarm') applyAlarm(id);

  audio.playClick();
  renderPanel();
}

function applyLight(id) {
  const st = deviceState[id];
  const mesh = st._mesh;
  const light = mesh.userData.light;
  const bulb = mesh.userData.visualBulb;
  if (st.on) {
    light.intensity = 2.4 * st.extra.brightness;
    light.distance = 20;
    bulb.material.emissive.setHex(0xffd480);
    bulb.material.emissiveIntensity = 1.6;
    bulb.material.color.setHex(0xfff1d0);
  } else {
    light.intensity = 0;
    bulb.material.emissive.setHex(0x222222);
    bulb.material.emissiveIntensity = 0.15;
    bulb.material.color.setHex(0x888888);
  }
}

function applyAC(id) {
  const st = deviceState[id];
  const mesh = st._mesh;
  const particles = mesh.userData.particles;
  if (particles) {
    particles.forEach(p => {
      p.userData.active = st.on;
    });
  }
}

function applyMusic(id) {
  const st = deviceState[id];
  const mesh = st._mesh;
  const waves = mesh.userData.waves;
  if (waves) {
    waves.forEach(w => w.userData.active = st.on);
  }
  if (st.on) audio.startMusic(id, st.extra.volume);
  else audio.stopMusic(id);
}

function applyAlarm(id) {
  const st = deviceState[id];
  st._ringing = st.on;
}

/* =========================================================
 * Web Audio API：点击音效 + 音乐合成 + 空调白噪 + 闹钟
 * =======================================================*/
const audio = {
  ctx: null,
  musicNodes: {},  // id -> { osc, gain, lfo }
  acNodes: {},     // id -> { noise, filter, gain }
  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext 不可用：', e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  playClick() {
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  },
  startMusic(id, volume) {
    this.ensure();
    if (!this.ctx) return;
    this.stopMusic(id);
    const ctx = this.ctx;

    // === 主音量（柔和，适合钢琴曲） ===
    const master = ctx.createGain();
    master.gain.value = Math.max(0.0001, volume * 0.55);
    master.connect(ctx.destination);

    // 全局低通滤波，让整体有"黑胶/柔和钢琴"质感
    const globalFilter = ctx.createBiquadFilter();
    globalFilter.type = 'lowpass';
    globalFilter.frequency.value = 4200;
    globalFilter.Q.value = 0.3;
    globalFilter.connect(master);

    // === 播放单个钢琴音符（三角波 + ADSR） ===
    const playNote = (freq, dur, startOffset, vol = 0.22) => {
      const t = ctx.currentTime + startOffset;
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;

      // 每个音加一点细颤音，模拟钢琴的自然波动
      const vlfo = ctx.createOscillator();
      vlfo.frequency.value = 5.5;
      const vgain = ctx.createGain();
      vgain.gain.value = freq * 0.0025;
      vlfo.connect(vgain).connect(o.frequency);

      // --- ADSR 包络：钢琴音的典型形状 ---
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.015);              // Attack
      g.gain.exponentialRampToValueAtTime(vol * 0.4, t + 0.12);     // Decay
      g.gain.setValueAtTime(vol * 0.4, t + Math.max(0.12, dur - 0.35)); // Sustain
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);         // Release

      o.connect(g).connect(globalFilter);
      o.start(t);
      vlfo.start(t);
      o.stop(t + dur + 0.05);
      vlfo.stop(t + dur + 0.05);
    };

    // === 播放和弦 Pad（3~4 个低音，柔和的背景和声） ===
    const playPad = (freqs, dur, startOffset, vol = 0.06) => {
      const t = ctx.currentTime + startOffset;
      freqs.forEach(f => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.6);   // 渐入
        g.gain.setValueAtTime(vol, t + Math.max(0.6, dur - 0.6));
        g.gain.linearRampToValueAtTime(0.0001, t + dur); // 渐出
        o.connect(g).connect(globalFilter);
        o.start(t);
        o.stop(t + dur + 0.05);
      });
    };

    // === 音符频率表（Hz） ===
    const C4 = 261.63,  D4 = 293.66, E4 = 329.63,  F4 = 349.23,
          Fs4 = 369.99, G4 = 392.0, A4 = 440.0,    Bb4 = 466.16,
          B4 = 493.88, C5 = 523.25, D5 = 587.33,   E5 = 659.25,
          F5 = 698.46, G5 = 783.99;
    // 低音（配合和弦 Pad）
    const C3 = 130.81, D3 = 146.83, F3 = 174.61, G3 = 196.0,
          A3 = 220.0,  Bb3 = 233.08, D2 = 73.42, F2 = 87.31;

    // === 节拍（约 80 BPM，慢速抒情） ===
    const beat = 60 / 80;          // 一拍 0.75 秒
    const q = beat;                // 四分音符
    const e = beat / 2;            // 八分音符
    const h = beat * 2;            // 二分音符
    const dotq = beat * 1.5;       // 附点四分

    // ================================================
    // 《夜曲》副歌旋律（简化版） - 周杰伦
    // 主调 D 小调，核心乐句反复
    // 主旋律音符 [频率, 时值]
    // ================================================
    const melody = [
      // 「一群嗜血的蚂蚁 被腐肉所吸引」
      [A4, e],  [G4, e], [F4, e],   [G4, q],
      [A4, e],  [A4, e], [G4, dotq],
      // 「我面无表情 看孤独的风景」
      [F4, e],  [E4, e], [D4, q],   [E4, e], [F4, q],
      // 「失去你 爱恨开始分明」
      [G4, q],  [A4, q], [G4, q],   [E4, q],
      // 「失去你 还有什么事好关心」
      [D4, h],

      // 「当鸽子不再象征和平」
      [F4, e], [G4, e], [A4, q],   [A4, e], [G4, q],
      // 「我终于被提醒 广场上喂食的是秃鹰」
      [F4, q], [E4, e], [F4, q], [D4, q], [F4, q],
      // 「我用漂亮的押韵 形容被掠夺一空的爱情」
      [E4, h],
    ];

    // === 和弦 Pad 配合（每 4 拍换一个和弦，营造背景） ===
    const chords = [
      // [和弦频率数组, 持续时长(秒), 起始偏移(小节序号 × 4)]
      [[D3, A3, D4],     4 * beat],   // Dm
      [[F3, C4, F4],     4 * beat],   // F
      [[G3, D4, G4],     4 * beat],   // Gm
      [[D3, A3, D4],     4 * beat],   // Dm
      [[Bb3, F4, Bb4],   4 * beat],   // Bb
      [[F3, C4, F4],     4 * beat],   // F
      [[A3, E4, A4],     4 * beat],   // Am
      [[D3, A3, D4],     4 * beat],   // Dm
    ];

    // === 计算整段总时长 ===
    const melodyTotal = melody.reduce((s, [, d]) => s + d, 0);
    const padTotal = chords.reduce((s, [, d]) => s + d, 0);
    const loopDuration = Math.max(melodyTotal, padTotal);

    // === 调度：主旋律 + 和弦 Pad ===
    const scheduleAll = (startOffset) => {
      let cursor = startOffset;
      melody.forEach(([f, d]) => {
        playNote(f, d * 0.95, cursor);
        cursor += d;
      });

      // Pad 和弦：从 startOffset 开始依次铺满整段
      let pCursor = startOffset;
      chords.forEach(([chordFreqs, d]) => {
        playPad(chordFreqs, d * 0.95, pCursor, 0.055);
        pCursor += d;
      });
    };

    scheduleAll(0.35);

    const state = { running: true };
    const loopTimer = setInterval(() => {
      if (!state.running) return;
      scheduleAll(0.1);
    }, loopDuration * 1000);

    this.musicNodes[id] = { master, loopTimer, state };
  },
  stopMusic(id) {
    if (this.musicNodes[id]) {
      const n = this.musicNodes[id];
      clearInterval(n.loopTimer);
      n.state.running = false;
      if (this.ctx) {
        const t = this.ctx.currentTime;
        n.master.gain.cancelScheduledValues(t);
        n.master.gain.setValueAtTime(n.master.gain.value, t);
        n.master.gain.linearRampToValueAtTime(0.0001, t + 0.5);
      }
      delete this.musicNodes[id];
    }
  },
  playAlarm(id) {
    this.ensure();
    if (!this.ctx) return;
    if (this.musicNodes['__alarm_' + id]) return;
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0.3;
    g.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 880;
    // 哔-哔-哔 节奏
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain).connect(g.gain);

    osc.connect(g);
    osc.start();
    lfo.start();
    this.musicNodes['__alarm_' + id] = { nodes: [{ osc, gain: g }], master: g, lfo };
  },
  stopAlarm(id) {
    const key = '__alarm_' + id;
    if (this.musicNodes[key]) {
      const n = this.musicNodes[key];
      try { n.nodes.forEach(x => x.osc.stop(this.ctx.currentTime + 0.1)); } catch(e) {}
      if (n.lfo) { try { n.lfo.stop(this.ctx.currentTime + 0.1); } catch(e) {} }
      delete this.musicNodes[key];
    }
  },

  // ============= 语音控制 =============
  voice: {
    recognition: null,
    active: false,
    supported() {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      return !!SR;
    },
    // 解析用户说的话，返回 { action: 'on' | 'off', rooms: ['master', ...] | 'all', type: 'light' | 'ac' | 'music' | 'alarm' | 'all' }
    parseCommand(text) {
      const t = text.toLowerCase().replace(/[，。！？,.]/g, ' ').replace(/\s+/g, ' ').trim();

      // 识别设备类型
      let type = 'light';
      if (/灯|灯光|light/i.test(t)) type = 'light';
      else if (/空调|冷气|ac|air/i.test(t)) type = 'ac';
      else if (/音乐|歌|播放|music/i.test(t)) type = 'music';
      else if (/闹钟|alarm/i.test(t)) type = 'alarm';
      else if (/全部|所有|全部设备|all/i.test(t)) type = 'all';

      // 识别房间
      let rooms = 'all';
      if (/客厅|大厅|living/i.test(t)) rooms = 'living';
      else if (/主卧|卧室|主卧室|master/i.test(t)) rooms = 'master';
      else if (/次卧|次卧室|second/i.test(t)) rooms = 'second';
      else if (/次卧2|小房间|third/i.test(t)) rooms = 'third';
      else if (/厨房|kitchen/i.test(t)) rooms = 'kitchen';
      else if (/卫生间|厕所|bathroom/i.test(t)) rooms = 'bathroom';

      // 识别 ON / OFF
      let action = null;
      if (/开|打开|开启|启动|on|yes/i.test(t)) action = 'on';
      if (/关|关闭|关掉|停止|off|no/i.test(t)) action = 'off';

      // 若只是"打开/关闭"但没提具体设备，默认控制灯
      if (action && !/灯|光|空调|歌|音乐|闹钟/.test(t)) {
        type = 'light';
      }

      if (!action) return null;
      return { action, rooms, type };
    },
    start(onStatus) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        alert('当前浏览器不支持语音识别，请使用 Chrome/Edge 浏览器');
        return;
      }
      if (this.active) {
        this.stop();
        return;
      }
      const rec = new SR();
      rec.lang = 'zh-CN';
      rec.continuous = true;     // 持续监听
      rec.interimResults = false; // 只取最终结果

      rec.onstart = () => {
        this.active = true;
        if (onStatus) onStatus('listening');
      };
      rec.onresult = (ev) => {
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const transcript = ev.results[i][0].transcript.trim();
          this.handleCommand(transcript);
        }
      };
      rec.onerror = (e) => {
        console.warn('语音识别错误:', e.error);
        if (e.error === 'not-allowed') {
          alert('请允许麦克风权限');
        }
      };
      rec.onend = () => {
        // 如果用户没主动停，自动重启（支持长时间监听）
        if (this.active) {
          try { rec.start(); } catch (e) { /* ignore */ }
        } else {
          if (onStatus) onStatus('idle');
        }
      };
      this.recognition = rec;
      try { rec.start(); } catch (e) { console.warn(e); }
    },
    stop() {
      this.active = false;
      if (this.recognition) {
        try { this.recognition.stop(); } catch (e) {}
        this.recognition = null;
      }
    },
    handleCommand(text) {
      console.log('识别到语音:', text);
      const cmd = this.parseCommand(text);
      if (!cmd) {
        this.speak('抱歉，没听清。');
        return;
      }
      // 根据房间 + 类型 控制设备
      let matched = 0;
      const ids = Object.keys(deviceState);
      ids.forEach(id => {
        const st = deviceState[id];
        const typeMatch = (cmd.type === 'all' || st.type === cmd.type);
        const roomMatch = (cmd.rooms === 'all' || st.room === cmd.rooms);
        if (typeMatch && roomMatch) {
          const targetOn = (cmd.action === 'on');
          if (st.on !== targetOn) toggleDevice(id, targetOn);
          matched++;
        }
      });
      const actionText = cmd.action === 'on' ? '打开' : '关闭';
      const typeText = { light: '灯', ac: '空调', music: '音乐', alarm: '闹钟', all: '所有设备' }[cmd.type] || '设备';
      const roomText = cmd.rooms === 'all' ? '所有房间' : (roomNames[cmd.rooms] || cmd.rooms);
      if (matched > 0) {
        this.speak(`已${actionText}${roomText}的${typeText}`);
      } else {
        this.speak(`没有找到可控制的${typeText}`);
      }
    },
    speak(text) {
      if (!window.speechSynthesis) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.rate = 1.05;
        u.pitch = 1.0;
        u.volume = 1.0;
        // 尝试选中文语音
        const voices = window.speechSynthesis.getVoices();
        const zh = voices.find(v => /zh|Chinese|Mandarin/i.test(v.lang + ' ' + v.name));
        if (zh) u.voice = zh;
        window.speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    }
  }
};

/* =========================================================
 * 全局按钮 & 工具
 * =======================================================*/
const roomNames = {
  living: '客厅+餐厅',
  master: '主卧',
  kitchen: '厨房',
  bathroom: '卫生间',
  second: '次卧1',
  third: '次卧2',
  storage: '储物间'
};

window.globalAction = function(mode) {
  const on = (mode === 'allOn');
  Object.keys(deviceState).forEach(id => {
    const st = deviceState[id];
    if (st.type === 'alarm') return;  // 闹钟不随全局
    if (st.on !== on) toggleDevice(id, on);
  });
  renderPanel();
};

/* =========================================================
 * 点击检测
 * =======================================================*/
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', e => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(deviceMeshes, false);
  if (hits.length > 0) {
    const id = hits[0].object.userData.deviceId;
    toggleDevice(id);
  }
});

/* =========================================================
 * 闹钟逻辑
 * =======================================================*/
const clockEl = document.getElementById('clock');
function checkAlarms() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${hh}:${mm}:${ss}`;

  Object.keys(deviceState).forEach(id => {
    const st = deviceState[id];
    if (st.type !== 'alarm') return;
    if (st.on && st.extra.hour === now.getHours()
        && st.extra.minute === now.getMinutes()
        && now.getSeconds() < 3) {
      if (!st._ringing) {
        st._ringing = true;
        audio.playAlarm(id);
        // 同时打开灯作为"唤醒光"
        const lightId = id.replace('-alarm', '-light');
        if (deviceState[lightId] && !deviceState[lightId].on) {
          deviceState[lightId].on = true;
          applyLight(lightId);
        }
        renderPanel();
      }
    } else if (!st.on && st._ringing) {
      st._ringing = false;
      audio.stopAlarm(id);
      renderPanel();
    }
  });
}

/* =========================================================
 * 动画循环
 * =======================================================*/
let lastTick = 0;
function animate(t) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (t - lastTick) / 1000 || 0);
  lastTick = t;

  controls.update();

  // 设备动效
  Object.keys(deviceState).forEach(id => {
    const st = deviceState[id];
    const mesh = st._mesh;
    if (!mesh) return;

    if (st.type === 'light' && st.on) {
      mesh.rotation.y += dt * 0.3;
    }
    if (st.type === 'ac') {
      const particles = mesh.userData.particles;
      const originY = mesh.userData.acYOffset || -0.22;
      if (particles) {
        particles.forEach(p => {
          if (!st.on) {
            p.material.opacity = 0;
            return;
          }
          p.userData.life += dt * 1.3;
          if (p.userData.life >= 1) {
            // 重置到出风口位置，重新喷出
            p.userData.life = 0;
            p.position.set(
              (Math.random() - 0.5) * 1.0,
              originY - Math.random() * 0.05,
              (Math.random() - 0.5) * 0.15 + 0.05
            );
            p.userData.velocity.set(
              (Math.random() - 0.5) * 0.12,
              -(0.35 + Math.random() * 0.4),
              (Math.random() - 0.5) * 0.12
            );
          }
          p.position.addScaledVector(p.userData.velocity, dt);
          // 越往下透明度越低（模拟冷气扩散消散）
          p.material.opacity = (1 - p.userData.life) * 0.85;
        });
      }
    }
    if (st.type === 'music') {
      const waves = mesh.userData.waves;
      if (waves) {
        const scale = (Date.now() % 2000) / 2000;
        waves.forEach((w, i) => {
          const s = ((scale + w.userData.offset) % 1);
          w.scale.setScalar(1 + s * 3);
          w.material.opacity = w.userData.active ? (1 - s) * 0.8 : 0;
        });
      }
    }
    if (st.type === 'alarm' && st._ringing) {
      mesh.position.y = DEVICE_POSITIONS[id].y + Math.sin(Date.now() * 0.02) * 0.05;
      mesh.rotation.z = Math.sin(Date.now() * 0.025) * 0.15;
    } else if (st.type === 'alarm') {
      mesh.position.y = DEVICE_POSITIONS[id].y;
      mesh.rotation.z = 0;
    }
  });

  checkAlarms();
  renderer.render(scene, camera);
}

/* =========================================================
 * 响应窗口大小
 * =======================================================*/
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* 首次用户交互解锁音频上下文（浏览器策略） */
window.addEventListener('click', function unlock() {
  audio.ensure();
  window.removeEventListener('click', unlock);
}, { once: true });

/* ====== 语音控制按钮事件 ====== */
(function initVoice() {
  const btn = document.getElementById('voice-btn');
  const statusEl = document.getElementById('voice-status');
  if (!btn || !statusEl) return;

  if (!audio.voice.supported()) {
    btn.textContent = '⚠️ 浏览器不支持语音识别';
    btn.disabled = true;
    btn.style.opacity = '0.6';
    statusEl.textContent = '请使用最新的 Chrome 或 Edge 浏览器。';
    return;
  }

  const setStatus = (mode, text) => {
    if (mode === 'listening') {
      btn.classList.add('active');
      btn.textContent = '🔴 正在聆听（点击停止）';
      statusEl.textContent = text || '正在聆听，请说出指令…';
    } else {
      btn.classList.remove('active');
      btn.textContent = '🎤 点击开始语音控制';
      statusEl.textContent = text || '已停止';
    }
  };

  btn.addEventListener('click', () => {
    audio.ensure();
    if (audio.voice.active) {
      audio.voice.stop();
      setStatus('idle', '已停止');
    } else {
      audio.voice.start(setStatus);
    }
  });

  // 每次成功识别命令后，在状态框里显示最近的命令
  const _old = audio.voice.handleCommand.bind(audio.voice);
  audio.voice.handleCommand = function(text) {
    if (statusEl) {
      statusEl.textContent = '识别到："' + text + '"';
    }
    _old(text);
  };
})();

/* ====== 暴露到全局（module 作用域中，HTML onclick 需要全局） ====== */
window.globalAction = globalAction;
window.applyScene = applyScene;
window.toggleDevice = toggleDevice;
window.deviceState = deviceState;
window.scenePresets = scenePresets;
window.audio = audio;
window.renderPanel = renderPanel;
window.renderSceneBar = renderSceneBar;
window.renderSchedule = renderSchedule;
window.roomHighlight = roomHighlight;
window.scheduledTasks = scheduledTasks;
window.addTask = addTask;
window.removeTask = removeTask;
window.ROOMS = ROOMS;
window.ROOM_DEVICES = ROOM_DEVICES;

animate(0);


