/**
 * Mini Room Designer - 核心应用逻辑
 * 纯原生 JavaScript + Three.js 实现
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==================== 配置与常量 ====================

const ROOM_SIZE = 10; // 房间尺寸 10m x 10m
const GRID_SIZE = 0.5; // 网格单元 0.5m
const GRID_COUNT = ROOM_SIZE / GRID_SIZE; // 20 x 20 网格

const FURNITURE_SIZES = {
  sofa:         { width: 2.0, depth: 0.9, height: 0.8, label: '沙发', icon: '🛋️' },
  chair:        { width: 0.6, depth: 0.6, height: 0.9, label: '椅子', icon: '🪑' },
  bed:          { width: 1.8, depth: 2.0, height: 0.5, label: '双人床', icon: '🛏️' },
  desk:         { width: 1.2, depth: 0.6, height: 0.75, label: '书桌', icon: '📝' },
  coffee_table: { width: 1.0, depth: 0.5, height: 0.45, label: '茶几', icon: '☕' }
};

const STYLE_CONFIGS = {
  nordic: {
    name: '北欧风',
    wallColor: '#F5F5F0',
    floorColor: '#D4C4A8',
    ambientLight: 0.6,
    directionalLight: 0.8,
    furnitureColors: {
      sofa: '#8B9A7C',
      chair: '#C4B9AC',
      bed: '#E8E0D5',
      desk: '#A0937D',
      coffee_table: '#C4B9AC'
    }
  },
  japanese: {
    name: '日式风',
    wallColor: '#F0EDE5',
    floorColor: '#C4A882',
    ambientLight: 0.5,
    directionalLight: 0.6,
    furnitureColors: {
      sofa: '#B8A99A',
      chair: '#8B7355',
      bed: '#D4C4B0',
      desk: '#6B5B4F',
      coffee_table: '#A0937D'
    }
  },
  industrial: {
    name: '工业风',
    wallColor: '#C0C0C0',
    floorColor: '#696969',
    ambientLight: 0.4,
    directionalLight: 1.0,
    furnitureColors: {
      sofa: '#4A4A4A',
      chair: '#2F4F4F',
      bed: '#5C5C5C',
      desk: '#3C3C3C',
      coffee_table: '#505050'
    }
  }
};

// ==================== 状态管理 ====================

const state = {
  items: [],
  currentStyle: 'nordic',
  selectedItemId: null,
  viewMode: '2d',
  nextId: 1,
  isDragging: false,
  dragItem: null,
  dragOffset: { x: 0, y: 0 },
  canvasOffset: { x: 0, y: 0 },
  scale: 1,
  canvasWidth: 0,
  canvasHeight: 0
};

// ==================== DOM 元素 ====================

const canvas2d = document.getElementById('canvas2d');
const ctx2d = canvas2d.getContext('2d');
const canvas2dContainer = document.getElementById('canvas2dContainer');
const scene3dContainer = document.getElementById('scene3dContainer');
const itemControls = document.getElementById('itemControls');
const tooltip = document.getElementById('tooltip');

// ==================== 工具函数 ====================

function generateId() {
  return 'item_' + (state.nextId++);
}

function snapToGrid(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function worldToCanvas(x, z) {
  const margin = 40;
  const availableWidth = state.canvasWidth - margin * 2;
  const availableHeight = state.canvasHeight - margin * 2;
  const scale = Math.min(availableWidth / ROOM_SIZE, availableHeight / ROOM_SIZE);
  const offsetX = (state.canvasWidth - ROOM_SIZE * scale) / 2;
  const offsetY = (state.canvasHeight - ROOM_SIZE * scale) / 2;

  return {
    x: offsetX + x * scale,
    y: offsetY + z * scale,
    scale: scale
  };
}

function canvasToWorld(cx, cy) {
  const margin = 40;
  const availableWidth = state.canvasWidth - margin * 2;
  const availableHeight = state.canvasHeight - margin * 2;
  const scale = Math.min(availableWidth / ROOM_SIZE, availableHeight / ROOM_SIZE);
  const offsetX = (state.canvasWidth - ROOM_SIZE * scale) / 2;
  const offsetY = (state.canvasHeight - ROOM_SIZE * scale) / 2;

  return {
    x: (cx - offsetX) / scale,
    z: (cy - offsetY) / scale
  };
}

function showTooltip(message, duration = 2000) {
  tooltip.textContent = message;
  tooltip.classList.add('visible');
  setTimeout(() => tooltip.classList.remove('visible'), duration);
}

// ==================== 2D 画布渲染 ====================

function resizeCanvas() {
  const rect = canvas2dContainer.getBoundingClientRect();
  canvas2d.width = rect.width;
  canvas2d.height = rect.height;
  state.canvasWidth = rect.width;
  state.canvasHeight = rect.height;
  drawCanvas();
}

function drawCanvas() {
  ctx2d.clearRect(0, 0, state.canvasWidth, state.canvasHeight);

  const margin = 40;
  const availableWidth = state.canvasWidth - margin * 2;
  const availableHeight = state.canvasHeight - margin * 2;
  const scale = Math.min(availableWidth / ROOM_SIZE, availableHeight / ROOM_SIZE);
  const offsetX = (state.canvasWidth - ROOM_SIZE * scale) / 2;
  const offsetY = (state.canvasHeight - ROOM_SIZE * scale) / 2;

  state.scale = scale;
  state.canvasOffset = { x: offsetX, y: offsetY };

  // 绘制房间背景
  const style = STYLE_CONFIGS[state.currentStyle];
  ctx2d.fillStyle = style.floorColor;
  ctx2d.fillRect(offsetX, offsetY, ROOM_SIZE * scale, ROOM_SIZE * scale);

  // 绘制网格
  ctx2d.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx2d.lineWidth = 0.5;
  for (let i = 0; i <= GRID_COUNT; i++) {
    const pos = i * GRID_SIZE * scale;
    ctx2d.beginPath();
    ctx2d.moveTo(offsetX + pos, offsetY);
    ctx2d.lineTo(offsetX + pos, offsetY + ROOM_SIZE * scale);
    ctx2d.stroke();

    ctx2d.beginPath();
    ctx2d.moveTo(offsetX, offsetY + pos);
    ctx2d.lineTo(offsetX + ROOM_SIZE * scale, offsetY + pos);
    ctx2d.stroke();
  }

  // 绘制房间边框
  ctx2d.strokeStyle = '#333';
  ctx2d.lineWidth = 2;
  ctx2d.strokeRect(offsetX, offsetY, ROOM_SIZE * scale, ROOM_SIZE * scale);

  // 绘制墙壁（3面墙）
  ctx2d.fillStyle = style.wallColor;
  ctx2d.fillRect(offsetX, offsetY - 8, ROOM_SIZE * scale, 8);
  ctx2d.fillRect(offsetX - 8, offsetY, 8, ROOM_SIZE * scale);
  ctx2d.fillRect(offsetX + ROOM_SIZE * scale, offsetY, 8, ROOM_SIZE * scale);

  // 绘制坐标轴标签
  ctx2d.fillStyle = '#888';
  ctx2d.font = '11px "Noto Sans SC", sans-serif';
  ctx2d.textAlign = 'center';
  for (let i = 0; i <= ROOM_SIZE; i += 2) {
    const pos = i * scale;
    ctx2d.fillText(i + 'm', offsetX + pos, offsetY + ROOM_SIZE * scale + 18);
    ctx2d.fillText(i + 'm', offsetX - 14, offsetY + pos + 4);
  }

  // 绘制家具
  state.items.forEach(item => {
    drawFurniture2D(item, scale, offsetX, offsetY);
  });
}

function drawFurniture2D(item, scale, offsetX, offsetY) {
  const size = FURNITURE_SIZES[item.type];
  const style = STYLE_CONFIGS[state.currentStyle];
  const color = style.furnitureColors[item.type];

  ctx2d.save();

  const cx = offsetX + item.position.x * scale;
  const cy = offsetY + item.position.z * scale;

  ctx2d.translate(cx, cy);
  ctx2d.rotate(item.rotation * Math.PI / 180);

  const w = size.width * scale;
  const d = size.depth * scale;

  // 绘制阴影
  ctx2d.fillStyle = 'rgba(0,0,0,0.15)';
  ctx2d.fillRect(-w/2 + 3, -d/2 + 3, w, d);

  // 绘制家具主体
  ctx2d.fillStyle = color;
  ctx2d.fillRect(-w/2, -d/2, w, d);

  // 选中高亮
  if (item.id === state.selectedItemId) {
    ctx2d.strokeStyle = '#d4a843';
    ctx2d.lineWidth = 3;
    ctx2d.strokeRect(-w/2 - 2, -d/2 - 2, w + 4, d + 4);

    // 绘制旋转指示器
    ctx2d.beginPath();
    ctx2d.arc(0, 0, 6, 0, Math.PI * 2);
    ctx2d.fillStyle = '#d4a843';
    ctx2d.fill();
  } else {
    ctx2d.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx2d.lineWidth = 1;
    ctx2d.strokeRect(-w/2, -d/2, w, d);
  }

  // 绘制家具图标
  ctx2d.rotate(-item.rotation * Math.PI / 180);
  ctx2d.font = `${Math.min(w, d) * 0.5}px Arial`;
  ctx2d.textAlign = 'center';
  ctx2d.textBaseline = 'middle';
  ctx2d.fillText(size.icon, 0, 0);

  ctx2d.restore();
}

// ==================== 3D 场景 ====================

let scene, camera, renderer, controls;
let furnitureMeshes = {};
let floorMesh, wallMeshes = [];
let ambientLight, directionalLight;

// 3D 交互相关
let gridHelper;
let selected3DObject = null;
let axesHelper = null;
let rotationGizmo = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let isDragging3D = false;
let isRotating3D = false;
let dragPlane = null;
let lightGizmo = null;
let isDraggingLight = false;

function init3D() {
  const container = document.getElementById('scene3dContainer');
  const width = container.clientWidth;
  const height = container.clientHeight;

  // 场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);

  // 相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(8, 12, 12);
  camera.lookAt(5, 0, 5);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas3d'), antialias: true });
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(5, 0, 5);
  controls.maxPolarAngle = Math.PI / 2.2;

  // 灯光
  ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  scene.add(directionalLight);

  // 创建拖拽平面（用于3D拖拽）
  const planeGeometry = new THREE.PlaneGeometry(ROOM_SIZE * 2, ROOM_SIZE * 2);
  const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
  dragPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  dragPlane.rotation.x = -Math.PI / 2;
  dragPlane.position.set(ROOM_SIZE / 2, 0, ROOM_SIZE / 2);
  scene.add(dragPlane);

  // 创建房间
  createRoom();

  // 添加网格 - 只在房间外部显示，不覆盖地板
  const gridSize = ROOM_SIZE * 3;
  const gridDivisions = GRID_COUNT * 3;
  const gridOffset = (gridSize - ROOM_SIZE) / 2;
  
  // 创建四个边界的网格线
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });
  
  // 前方网格（z > ROOM_SIZE）
  const frontGrid = new THREE.GridHelper(gridSize, gridDivisions, 0xaaaaaa, 0xcccccc);
  frontGrid.position.set(ROOM_SIZE / 2, 0.01, ROOM_SIZE + gridOffset);
  scene.add(frontGrid);
  
  // 后方网格（z < 0）
  const backGrid = new THREE.GridHelper(gridSize, gridDivisions, 0xaaaaaa, 0xcccccc);
  backGrid.position.set(ROOM_SIZE / 2, 0.01, -gridOffset);
  scene.add(backGrid);
  
  // 左方网格（x < 0）
  const leftGrid = new THREE.GridHelper(gridSize, gridDivisions, 0xaaaaaa, 0xcccccc);
  leftGrid.position.set(-gridOffset, 0.01, ROOM_SIZE / 2);
  scene.add(leftGrid);
  
  // 右方网格（x > ROOM_SIZE）
  const rightGrid = new THREE.GridHelper(gridSize, gridDivisions, 0xaaaaaa, 0xcccccc);
  rightGrid.position.set(ROOM_SIZE + gridOffset, 0.01, ROOM_SIZE / 2);
  scene.add(rightGrid);
  
  // 保存引用以便更新
  gridHelper = { frontGrid, backGrid, leftGrid, rightGrid };

  // 添加光源可视化球体（可拖拽）
  createLightGizmo();

  // 3D 画布事件
  const canvas3d = document.getElementById('canvas3d');
  canvas3d.addEventListener('mousedown', on3DMouseDown);
  canvas3d.addEventListener('mousemove', on3DMouseMove);
  canvas3d.addEventListener('mouseup', on3DMouseUp);

  // 3D 画布拖拽放置家具
  canvas3d.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvas3d.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedType) return;

    const rect = canvas3d.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(dragPlane);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      const x = snapToGrid(Math.max(0, Math.min(ROOM_SIZE, point.x)));
      const z = snapToGrid(Math.max(0, Math.min(ROOM_SIZE, point.z)));
      
      const item = addItem(draggedType, x, z);
      select3DObject(item.id);
      showTooltip(`已添加 ${FURNITURE_SIZES[draggedType].label}`);
    }

    draggedType = null;
  });

  // 渲染循环
  animate3D();
}

function createLightGizmo() {
  // 光源位置指示器
  const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const sphereMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffeb3b, 
    transparent: true, 
    opacity: 0.8 
  });
  lightGizmo = new THREE.Mesh(sphereGeometry, sphereMaterial);
  lightGizmo.position.copy(directionalLight.position);
  
  // 光源连线
  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    directionalLight.position.clone()
  ]);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffeb3b, transparent: true, opacity: 0.3 });
  const lightLine = new THREE.Line(lineGeometry, lineMaterial);
  lightGizmo.userData.line = lightLine;
  scene.add(lightLine);
  
  // 光源光晕
  const glowGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffeb3b, 
    transparent: true, 
    opacity: 0.2 
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  lightGizmo.add(glow);
  
  scene.add(lightGizmo);
}

function updateLightLine() {
  if (lightGizmo && lightGizmo.userData.line) {
    const positions = lightGizmo.userData.line.geometry.attributes.position.array;
    positions[3] = lightGizmo.position.x;
    positions[4] = lightGizmo.position.y;
    positions[5] = lightGizmo.position.z;
    lightGizmo.userData.line.geometry.attributes.position.needsUpdate = true;
  }
}

function createRoom() {
  const style = STYLE_CONFIGS[state.currentStyle];

  // 地板
  const floorGeometry = new THREE.PlaneGeometry(ROOM_SIZE, ROOM_SIZE);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(style.floorColor),
    roughness: 0.8,
    metalness: 0.1
  });
  floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(ROOM_SIZE / 2, 0, ROOM_SIZE / 2);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // 墙壁
  const wallHeight = 3;
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(style.wallColor),
    roughness: 0.9,
    metalness: 0.0
  });

  // 后墙
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_SIZE, wallHeight),
    wallMaterial.clone()
  );
  backWall.position.set(ROOM_SIZE / 2, wallHeight / 2, 0);
  backWall.receiveShadow = true;
  scene.add(backWall);
  wallMeshes.push(backWall);

  // 左墙
  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_SIZE, wallHeight),
    wallMaterial.clone()
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(0, wallHeight / 2, ROOM_SIZE / 2);
  leftWall.receiveShadow = true;
  scene.add(leftWall);
  wallMeshes.push(leftWall);

  // 右墙
  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_SIZE, wallHeight),
    wallMaterial.clone()
  );
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(ROOM_SIZE, wallHeight / 2, ROOM_SIZE / 2);
  rightWall.receiveShadow = true;
  scene.add(rightWall);
  wallMeshes.push(rightWall);
}

function darkenColor(color, factor) {
  const c = color.clone();
  c.r *= (1 - factor);
  c.g *= (1 - factor);
  c.b *= (1 - factor);
  return c;
}

function createFurniture3D(item) {
  const size = FURNITURE_SIZES[item.type];
  const style = STYLE_CONFIGS[state.currentStyle];
  const color = new THREE.Color(style.furnitureColors[item.type]);

  const group = new THREE.Group();
  group.userData.itemId = item.id;
  group.userData.isFurniture = true;

  switch (item.type) {
    case 'sofa':
      // 主体
      group.add(createBox(size.width, size.height * 0.6, size.depth, color, 0, size.height * 0.3, 0));
      // 靠背
      group.add(createBox(size.width, size.height * 0.5, size.depth * 0.2, darkenColor(color, 0.1), 0, size.height * 0.75, -size.depth * 0.35));
      // 左扶手
      group.add(createBox(size.width * 0.15, size.height, size.depth, darkenColor(color, 0.05), -size.width * 0.425, size.height * 0.5, 0));
      // 右扶手
      group.add(createBox(size.width * 0.15, size.height, size.depth, darkenColor(color, 0.05), size.width * 0.425, size.height * 0.5, 0));
      break;

    case 'chair':
      // 座面
      group.add(createBox(size.width, size.height * 0.1, size.depth, color, 0, size.height * 0.55, 0));
      // 靠背
      group.add(createBox(size.width, size.height * 0.5, size.depth * 0.1, darkenColor(color, 0.1), 0, size.height * 0.8, -size.depth * 0.4));
      // 四条腿
      const legColor = darkenColor(color, 0.2);
      const legW = size.width * 0.08;
      const legH = size.height * 0.55;
      group.add(createBox(legW, legH, legW, legColor, -size.width * 0.4, legH / 2, -size.depth * 0.4));
      group.add(createBox(legW, legH, legW, legColor, size.width * 0.4, legH / 2, -size.depth * 0.4));
      group.add(createBox(legW, legH, legW, legColor, -size.width * 0.4, legH / 2, size.depth * 0.4));
      group.add(createBox(legW, legH, legW, legColor, size.width * 0.4, legH / 2, size.depth * 0.4));
      break;

    case 'bed':
      // 床垫
      group.add(createBox(size.width, size.height * 0.5, size.depth, color, 0, size.height * 0.35, 0));
      // 床头板
      group.add(createBox(size.width, size.height * 1.5, size.depth * 0.1, darkenColor(color, 0.1), 0, size.height * 0.85, -size.depth * 0.45));
      // 床腿
      const bedLegColor = darkenColor(color, 0.2);
      const bedLegW = size.width * 0.05;
      const bedLegH = size.height * 0.2;
      group.add(createBox(bedLegW, bedLegH, bedLegW, bedLegColor, -size.width * 0.45, bedLegH / 2, -size.depth * 0.45));
      group.add(createBox(bedLegW, bedLegH, bedLegW, bedLegColor, size.width * 0.45, bedLegH / 2, -size.depth * 0.45));
      group.add(createBox(bedLegW, bedLegH, bedLegW, bedLegColor, -size.width * 0.45, bedLegH / 2, size.depth * 0.45));
      group.add(createBox(bedLegW, bedLegH, bedLegW, bedLegColor, size.width * 0.45, bedLegH / 2, size.depth * 0.45));
      break;

    case 'desk':
      // 桌面
      group.add(createBox(size.width, size.height * 0.08, size.depth, color, 0, size.height * 0.96, 0));
      // 桌腿
      const deskLegColor = darkenColor(color, 0.15);
      const deskLegW = size.width * 0.05;
      const deskLegH = size.height * 0.92;
      group.add(createBox(deskLegW, deskLegH, size.depth * 0.08, deskLegColor, -size.width * 0.4, deskLegH / 2, -size.depth * 0.4));
      group.add(createBox(deskLegW, deskLegH, size.depth * 0.08, deskLegColor, size.width * 0.4, deskLegH / 2, -size.depth * 0.4));
      group.add(createBox(deskLegW, deskLegH, size.depth * 0.08, deskLegColor, -size.width * 0.4, deskLegH / 2, size.depth * 0.4));
      group.add(createBox(deskLegW, deskLegH, size.depth * 0.08, deskLegColor, size.width * 0.4, deskLegH / 2, size.depth * 0.4));
      break;

    case 'coffee_table':
      // 桌面
      group.add(createBox(size.width, size.height * 0.1, size.depth, color, 0, size.height * 0.95, 0));
      // 圆柱腿
      const tableLegColor = darkenColor(color, 0.2);
      const tableLegR = size.width * 0.04;
      const tableLegH = size.height * 0.9;
      group.add(createCylinder(tableLegR, tableLegH, tableLegColor, -size.width * 0.35, tableLegH / 2, -size.depth * 0.35));
      group.add(createCylinder(tableLegR, tableLegH, tableLegColor, size.width * 0.35, tableLegH / 2, -size.depth * 0.35));
      group.add(createCylinder(tableLegR, tableLegH, tableLegColor, -size.width * 0.35, tableLegH / 2, size.depth * 0.35));
      group.add(createCylinder(tableLegR, tableLegH, tableLegColor, size.width * 0.35, tableLegH / 2, size.depth * 0.35));
      break;
  }

  group.position.set(item.position.x, item.position.y, item.position.z);
  group.rotation.y = -item.rotation * Math.PI / 180;
  group.castShadow = true;
  group.receiveShadow = true;

  scene.add(group);
  furnitureMeshes[item.id] = group;
}

function createBox(w, h, d, color, x, y, z) {
  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createCylinder(r, h, color, x, y, z) {
  const geometry = new THREE.CylinderGeometry(r, r, h, 16);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ==================== 3D 选中与坐标轴 ====================

function select3DObject(itemId) {
  // 清除之前的选中状态
  clear3DSelection();
  
  if (!itemId) return;
  
  const mesh = furnitureMeshes[itemId];
  if (!mesh) return;
  
  selected3DObject = mesh;
  state.selectedItemId = itemId;
  
  // 添加坐标轴辅助器
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  axesHelper = new THREE.AxesHelper(maxSize * 0.8);
  axesHelper.position.copy(mesh.position);
  axesHelper.position.y += size.y / 2;
  scene.add(axesHelper);
  
  // 添加旋转环
  createRotationGizmo(mesh, maxSize);
  
  // 同步2D选中
  drawCanvas();
  itemControls.classList.add('visible');
}

function clear3DSelection() {
  if (axesHelper) {
    scene.remove(axesHelper);
    axesHelper = null;
  }
  if (rotationGizmo) {
    scene.remove(rotationGizmo);
    rotationGizmo = null;
  }
  selected3DObject = null;
}

function createRotationGizmo(mesh, size) {
  const ringGeometry = new THREE.RingGeometry(size * 0.6, size * 0.7, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xd4a843, 
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  });
  rotationGizmo = new THREE.Mesh(ringGeometry, ringMaterial);
  rotationGizmo.rotation.x = -Math.PI / 2;
  rotationGizmo.position.copy(mesh.position);
  rotationGizmo.position.y = 0.05;
  rotationGizmo.userData.isRotationGizmo = true;
  scene.add(rotationGizmo);
}

function updateRotationGizmo() {
  if (rotationGizmo && selected3DObject) {
    rotationGizmo.position.x = selected3DObject.position.x;
    rotationGizmo.position.z = selected3DObject.position.z;
  }
  if (axesHelper && selected3DObject) {
    axesHelper.position.x = selected3DObject.position.x;
    axesHelper.position.z = selected3DObject.position.z;
    axesHelper.rotation.y = selected3DObject.rotation.y;
  }
}

// ==================== 3D 鼠标交互 ====================

function on3DMouseDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  // 检查是否点击了光源
  const lightIntersects = raycaster.intersectObject(lightGizmo);
  if (lightIntersects.length > 0) {
    isDraggingLight = true;
    controls.enabled = false;
    showTooltip('拖动以移动光源位置');
    return;
  }
  
  // 检查是否点击了旋转环
  if (rotationGizmo) {
    const gizmoIntersects = raycaster.intersectObject(rotationGizmo);
    if (gizmoIntersects.length > 0) {
      isRotating3D = true;
      controls.enabled = false;
      return;
    }
  }
  
  // 检查是否点击了家具
  const furnitureGroups = Object.values(furnitureMeshes);
  const intersects = raycaster.intersectObjects(furnitureGroups, true);
  
  if (intersects.length > 0) {
    // 找到所属的group
    let target = intersects[0].object;
    while (target.parent && !target.userData.isFurniture) {
      target = target.parent;
    }
    
    if (target.userData.isFurniture) {
      select3DObject(target.userData.itemId);
      isDragging3D = true;
      controls.enabled = false;
      return;
    }
  }
  
  // 点击空白处取消选中
  selectItem(null);
  clear3DSelection();
  drawCanvas();
}

function on3DMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  // 更新鼠标样式
  raycaster.setFromCamera(mouse, camera);
  
  // 检查悬停状态
  const furnitureGroups = Object.values(furnitureMeshes);
  const intersects = raycaster.intersectObjects(furnitureGroups, true);
  const lightIntersects = raycaster.intersectObject(lightGizmo);
  
  if (lightIntersects.length > 0) {
    renderer.domElement.style.cursor = 'move';
  } else if (rotationGizmo && raycaster.intersectObject(rotationGizmo).length > 0) {
    renderer.domElement.style.cursor = 'grab';
  } else if (intersects.length > 0) {
    renderer.domElement.style.cursor = 'pointer';
  } else {
    renderer.domElement.style.cursor = 'default';
  }
  
  // 拖拽光源
  if (isDraggingLight && lightGizmo) {
    raycaster.setFromCamera(mouse, camera);
    const planeIntersects = raycaster.intersectObject(dragPlane);
    if (planeIntersects.length > 0) {
      const point = planeIntersects[0].point;
      lightGizmo.position.x = Math.max(0, Math.min(ROOM_SIZE, point.x));
      lightGizmo.position.z = Math.max(0, Math.min(ROOM_SIZE, point.z));
      directionalLight.position.copy(lightGizmo.position);
      updateLightLine();
    }
    return;
  }
  
  // 旋转家具
  if (isRotating3D && selected3DObject) {
    raycaster.setFromCamera(mouse, camera);
    const planeIntersects = raycaster.intersectObject(dragPlane);
    if (planeIntersects.length > 0) {
      const point = planeIntersects[0].point;
      const dx = point.x - selected3DObject.position.x;
      const dz = point.z - selected3DObject.position.z;
      const angle = Math.atan2(dx, dz);
      selected3DObject.rotation.y = angle;
      
      // 同步到数据
      const item = state.items.find(i => i.id === selected3DObject.userData.itemId);
      if (item) {
        item.rotation = Math.round((-angle * 180 / Math.PI) / 90) * 90;
        if (item.rotation < 0) item.rotation += 360;
      }
      
      updateRotationGizmo();
      drawCanvas();
    }
    return;
  }
  
  // 拖拽家具
  if (isDragging3D && selected3DObject) {
    raycaster.setFromCamera(mouse, camera);
    const planeIntersects = raycaster.intersectObject(dragPlane);
    if (planeIntersects.length > 0) {
      const point = planeIntersects[0].point;
      const newX = snapToGrid(Math.max(0, Math.min(ROOM_SIZE, point.x)));
      const newZ = snapToGrid(Math.max(0, Math.min(ROOM_SIZE, point.z)));
      
      selected3DObject.position.x = newX;
      selected3DObject.position.z = newZ;
      
      // 同步到数据
      const item = state.items.find(i => i.id === selected3DObject.userData.itemId);
      if (item) {
        item.position.x = newX;
        item.position.z = newZ;
      }
      
      updateRotationGizmo();
      drawCanvas();
    }
    return;
  }
}

function on3DMouseUp() {
  isDragging3D = false;
  isRotating3D = false;
  isDraggingLight = false;
  controls.enabled = true;
}

function updateFurniture3D(item) {
  const mesh = furnitureMeshes[item.id];
  if (mesh) {
    mesh.position.set(item.position.x, item.position.y, item.position.z);
    mesh.rotation.y = -item.rotation * Math.PI / 180;
  }
}

function removeFurniture3D(itemId) {
  const mesh = furnitureMeshes[itemId];
  if (mesh) {
    if (selected3DObject === mesh) {
      clear3DSelection();
    }
    scene.remove(mesh);
    delete furnitureMeshes[itemId];
  }
}

function updateSceneStyle() {
  const style = STYLE_CONFIGS[state.currentStyle];

  // 更新灯光
  ambientLight.intensity = style.ambientLight;
  directionalLight.intensity = style.directionalLight;

  // 更新地板
  if (floorMesh) {
    floorMesh.material.color.set(style.floorColor);
  }

  // 更新墙壁
  wallMeshes.forEach(wall => {
    wall.material.color.set(style.wallColor);
  });

  // 更新家具颜色
  state.items.forEach(item => {
    const mesh = furnitureMeshes[item.id];
    if (mesh) {
      const color = new THREE.Color(style.furnitureColors[item.type]);
      mesh.traverse(child => {
        if (child.isMesh) {
          child.material.color.set(color);
        }
      });
    }
  });
}

function animate3D() {
  requestAnimationFrame(animate3D);
  controls.update();
  
  // 旋转环动画
  if (rotationGizmo) {
    const time = Date.now() * 0.001;
    rotationGizmo.material.opacity = 0.4 + Math.sin(time * 2) * 0.2;
  }
  
  // 光源动画
  if (lightGizmo) {
    const time = Date.now() * 0.002;
    lightGizmo.children[0].scale.setScalar(1 + Math.sin(time * 3) * 0.1);
  }
  
  // 更新左上角坐标轴指示器
  updateAxisIndicator();
  
  renderer.render(scene, camera);
}

// ==================== 左上角可交互坐标轴指示器 (使用 AxesHelper) ====================

let axisIndicatorCamera, axisIndicatorRenderer, axisIndicatorScene;

function initAxisIndicator() {
  const canvas = document.getElementById('axisIndicator');
  if (!canvas) return;
  
  const width = 80;
  const height = 80;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  
  // 创建独立的场景
  axisIndicatorScene = new THREE.Scene();
  axisIndicatorScene.background = new THREE.Color(0xffffff);
  
  // 创建相机 - 使用正交相机更适合坐标轴指示器
  const frustumSize = 2.5;
  axisIndicatorCamera = new THREE.OrthographicCamera(
    frustumSize / -2, frustumSize / 2,
    frustumSize / 2, frustumSize / -2,
    0.1, 100
  );
  axisIndicatorCamera.position.set(2, 2, 2);
  axisIndicatorCamera.lookAt(0, 0, 0);
  
  // 使用 Three.js 内置的 AxesHelper
  const axesHelper = new THREE.AxesHelper(1.5);
  axisIndicatorScene.add(axesHelper);
  
  // 创建渲染器
  axisIndicatorRenderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true,
    alpha: false
  });
  axisIndicatorRenderer.setSize(width, height);
  axisIndicatorRenderer.setPixelRatio(window.devicePixelRatio);
  
  // 添加交互控制 - 拖拽旋转主场景相机
  let isDraggingAxis = false;
  let lastMousePos = { x: 0, y: 0 };
  
  canvas.style.cursor = 'grab';
  
  canvas.addEventListener('mousedown', (e) => {
    isDraggingAxis = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
    e.stopPropagation();
  });
  
  canvas.addEventListener('mousemove', (e) => {
    if (!isDraggingAxis) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    // 旋转主场景相机
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position.clone().sub(controls.target));
    
    spherical.theta -= deltaX * 0.01;
    spherical.phi += deltaY * 0.01;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
    
    camera.position.setFromSpherical(spherical).add(controls.target);
    camera.lookAt(controls.target);
    
    lastMousePos = { x: e.clientX, y: e.clientY };
  });
  
  canvas.addEventListener('mouseup', () => {
    isDraggingAxis = false;
    canvas.style.cursor = 'grab';
  });
  
  canvas.addEventListener('mouseleave', () => {
    isDraggingAxis = false;
    canvas.style.cursor = 'grab';
  });
  
  // 触摸支持
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isDraggingAxis = true;
      lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      e.stopPropagation();
    }
  }, { passive: false });
  
  canvas.addEventListener('touchmove', (e) => {
    if (!isDraggingAxis || e.touches.length !== 1) return;
    e.preventDefault();
    
    const deltaX = e.touches[0].clientX - lastMousePos.x;
    const deltaY = e.touches[0].clientY - lastMousePos.y;
    
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position.clone().sub(controls.target));
    
    spherical.theta -= deltaX * 0.01;
    spherical.phi += deltaY * 0.01;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
    
    camera.position.setFromSpherical(spherical).add(controls.target);
    camera.lookAt(controls.target);
    
    lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: false });
  
  canvas.addEventListener('touchend', () => {
    isDraggingAxis = false;
  });
}

function updateAxisIndicator() {
  if (!axisIndicatorRenderer || !axisIndicatorScene || !axisIndicatorCamera || !camera) return;
  
  // 让指示器相机跟随主相机旋转方向
  const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion);
  axisIndicatorCamera.rotation.copy(rotation);
  
  axisIndicatorRenderer.render(axisIndicatorScene, axisIndicatorCamera);
}

function resize3D() {
  if (!renderer) return;
  const container = document.getElementById('scene3dContainer');
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// ==================== 交互逻辑 ====================

function addItem(type, x, z) {
  const item = {
    id: generateId(),
    type: type,
    position: {
      x: snapToGrid(x),
      y: 0,
      z: snapToGrid(z)
    },
    rotation: 0,
    style: state.currentStyle
  };

  state.items.push(item);
  createFurniture3D(item);
  updateStatus();
  drawCanvas();

  return item;
}

function selectItem(itemId) {
  state.selectedItemId = itemId;
  itemControls.classList.toggle('visible', itemId !== null);
  updatePropertiesPanel(itemId);
  drawCanvas();
}

// ==================== 属性面板 ====================

const propertiesPanel = document.getElementById('propertiesPanel');
const propX = document.getElementById('propX');
const propY = document.getElementById('propY');
const propZ = document.getElementById('propZ');
const propRotation = document.getElementById('propRotation');
const propWidth = document.getElementById('propWidth');
const propDepth = document.getElementById('propDepth');
const propHeight = document.getElementById('propHeight');
const propType = document.getElementById('propType');
const propId = document.getElementById('propId');

function updatePropertiesPanel(itemId) {
  if (!itemId) {
    propertiesPanel.classList.remove('visible');
    return;
  }
  
  const item = state.items.find(i => i.id === itemId);
  if (!item) {
    propertiesPanel.classList.remove('visible');
    return;
  }
  
  const size = FURNITURE_SIZES[item.type];
  
  propX.value = item.position.x;
  propY.value = item.position.y;
  propZ.value = item.position.z;
  propRotation.value = item.rotation;
  propWidth.value = size.width;
  propDepth.value = size.depth;
  propHeight.value = size.height;
  propType.textContent = size.label;
  propId.textContent = item.id;
  
  propertiesPanel.classList.add('visible');
}

// 属性面板输入事件
propX.addEventListener('change', () => updateItemFromPanel('x', parseFloat(propX.value)));
propZ.addEventListener('change', () => updateItemFromPanel('z', parseFloat(propZ.value)));
propRotation.addEventListener('change', () => updateItemFromPanel('rotation', parseFloat(propRotation.value)));

function updateItemFromPanel(prop, value) {
  if (!state.selectedItemId) return;
  
  const item = state.items.find(i => i.id === state.selectedItemId);
  if (!item) return;
  
  if (prop === 'x' || prop === 'z') {
    item.position[prop] = snapToGrid(Math.max(0, Math.min(ROOM_SIZE, value)));
  } else if (prop === 'rotation') {
    item.rotation = ((value % 360) + 360) % 360;
  }
  
  // 同步3D模型
  updateFurniture3D(item);
  
  // 更新3D选中状态
  if (selected3DObject && selected3DObject.userData.itemId === item.id) {
    updateRotationGizmo();
  }
  
  // 更新面板显示（可能经过snap处理）
  updatePropertiesPanel(item.id);
  
  drawCanvas();
}

function deleteSelectedItem() {
  if (!state.selectedItemId) return;

  const index = state.items.findIndex(i => i.id === state.selectedItemId);
  if (index !== -1) {
    removeFurniture3D(state.items[index].id);
    state.items.splice(index, 1);
    selectItem(null);
    updateStatus();
    drawCanvas();
  }
}

function rotateSelectedItem() {
  if (!state.selectedItemId) return;

  const item = state.items.find(i => i.id === state.selectedItemId);
  if (item) {
    item.rotation = (item.rotation + 90) % 360;
    updateFurniture3D(item);
    
    // 更新3D选中状态
    if (selected3DObject && selected3DObject.userData.itemId === item.id) {
      updateRotationGizmo();
    }
    
    drawCanvas();
  }
}

function updateStatus() {
  document.getElementById('itemCount').textContent = state.items.length;
  document.getElementById('currentStyleName').textContent = STYLE_CONFIGS[state.currentStyle].name;
}

// ==================== 事件处理 ====================

// 风格切换
document.querySelectorAll('.style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.currentStyle = btn.dataset.style;
    updateSceneStyle();
    updateStatus();
    drawCanvas();
  });
});

// 视图切换
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.viewMode = btn.dataset.view;

    if (state.viewMode === '2d') {
      canvas2dContainer.style.display = 'block';
      scene3dContainer.classList.remove('active');
      resizeCanvas();
    } else {
      canvas2dContainer.style.display = 'none';
      scene3dContainer.classList.add('active');
      resize3D();
    }
  });
});

// 家具库拖拽
let draggedType = null;

document.querySelectorAll('.furniture-item').forEach(item => {
  item.addEventListener('dragstart', (e) => {
    draggedType = item.dataset.type;
    e.dataTransfer.effectAllowed = 'copy';
  });
});

canvas2d.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

canvas2d.addEventListener('drop', (e) => {
  e.preventDefault();
  if (!draggedType) return;

  const rect = canvas2d.getBoundingClientRect();
  const worldPos = canvasToWorld(e.clientX - rect.left, e.clientY - rect.top);

  if (worldPos.x >= 0 && worldPos.x <= ROOM_SIZE && worldPos.z >= 0 && worldPos.z <= ROOM_SIZE) {
    const item = addItem(draggedType, worldPos.x, worldPos.z);
    selectItem(item.id);
    showTooltip(`已添加 ${FURNITURE_SIZES[draggedType].label}`);
  }

  draggedType = null;
});

// 2D 画布点击/拖拽
let isMouseDown = false;
let mouseDownPos = { x: 0, y: 0 };
let draggedItem = null;

canvas2d.addEventListener('mousedown', (e) => {
  const rect = canvas2d.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const worldPos = canvasToWorld(x, y);

  // 检查是否点击了家具
  let clickedItem = null;
  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];
    const size = FURNITURE_SIZES[item.type];

    // 考虑旋转后的碰撞检测
    const dx = worldPos.x - item.position.x;
    const dz = worldPos.z - item.position.z;
    const rad = -item.rotation * Math.PI / 180;
    const rx = Math.abs(dx * Math.cos(rad) - dz * Math.sin(rad));
    const rz = Math.abs(dx * Math.sin(rad) + dz * Math.cos(rad));

    if (rx <= size.width / 2 && rz <= size.depth / 2) {
      clickedItem = item;
      break;
    }
  }

  if (clickedItem) {
    selectItem(clickedItem.id);
    draggedItem = clickedItem;
    isMouseDown = true;
    mouseDownPos = { x, y };
    state.dragOffset = {
      x: worldPos.x - clickedItem.position.x,
      z: worldPos.z - clickedItem.position.z
    };
  } else {
    selectItem(null);
  }
});

canvas2d.addEventListener('mousemove', (e) => {
  if (!isMouseDown || !draggedItem) return;

  const rect = canvas2d.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const worldPos = canvasToWorld(x, y);

  draggedItem.position.x = snapToGrid(Math.max(0, Math.min(ROOM_SIZE, worldPos.x - state.dragOffset.x)));
  draggedItem.position.z = snapToGrid(Math.max(0, Math.min(ROOM_SIZE, worldPos.z - state.dragOffset.z)));

  drawCanvas();
});

canvas2d.addEventListener('mouseup', () => {
  if (draggedItem) {
    updateFurniture3D(draggedItem);
  }
  isMouseDown = false;
  draggedItem = null;
});

canvas2d.addEventListener('mouseleave', () => {
  if (draggedItem) {
    updateFurniture3D(draggedItem);
  }
  isMouseDown = false;
  draggedItem = null;
});

// 操作按钮
document.getElementById('rotateBtn').addEventListener('click', rotateSelectedItem);
document.getElementById('deleteBtn').addEventListener('click', deleteSelectedItem);

// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteSelectedItem();
  } else if (e.key === 'r' || e.key === 'R') {
    rotateSelectedItem();
  }
});

// 底部操作按钮
document.getElementById('clearBtn').addEventListener('click', () => {
  state.items.forEach(item => removeFurniture3D(item.id));
  state.items = [];
  selectItem(null);
  updateStatus();
  drawCanvas();
  showTooltip('已清空房间');
});

document.getElementById('randomBtn').addEventListener('click', () => {
  // 清空现有
  state.items.forEach(item => removeFurniture3D(item.id));
  state.items = [];

  const types = Object.keys(FURNITURE_SIZES);
  const count = Math.floor(Math.random() * 5) + 3;

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const size = FURNITURE_SIZES[type];
    const x = snapToGrid(Math.random() * (ROOM_SIZE - size.width) + size.width / 2);
    const z = snapToGrid(Math.random() * (ROOM_SIZE - size.depth) + size.depth / 2);
    const rotation = Math.floor(Math.random() * 4) * 90;

    const item = {
      id: generateId(),
      type: type,
      position: { x, y: 0, z },
      rotation: rotation,
      style: state.currentStyle
    };

    state.items.push(item);
    createFurniture3D(item);
  }

  selectItem(null);
  updateStatus();
  drawCanvas();
  showTooltip('随机生成完成');
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (state.viewMode === '2d') {
    const link = document.createElement('a');
    link.download = 'room-design-2d.png';
    link.href = canvas2d.toDataURL();
    link.click();
  } else {
    renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download = 'room-design-3d.png';
    link.href = renderer.domElement.toDataURL();
    link.click();
  }
  showTooltip('截图已导出');
});

// 窗口大小调整
window.addEventListener('resize', () => {
  resizeCanvas();
  resize3D();
});

// ==================== 初始化 ====================

function init() {
  resizeCanvas();
  init3D();
  initAxisIndicator();
  updateStatus();

  // 尝试加载保存的数据
  try {
    const saved = localStorage.getItem('room_design');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
          item.id = generateId();
          state.items.push(item);
          createFurniture3D(item);
        });
        if (data.currentStyle) {
          state.currentStyle = data.currentStyle;
          document.querySelectorAll('.style-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === state.currentStyle);
          });
          updateSceneStyle();
        }
        updateStatus();
        drawCanvas();
      }
    }
  } catch (e) {
    console.log('加载保存数据失败', e);
  }

  // 自动保存
  setInterval(() => {
    localStorage.setItem('room_design', JSON.stringify({
      items: state.items,
      currentStyle: state.currentStyle
    }));
  }, 5000);

  showTooltip('拖拽左侧家具到画布开始设计', 3000);
}

// 启动
init();
