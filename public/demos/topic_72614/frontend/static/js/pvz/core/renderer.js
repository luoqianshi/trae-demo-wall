const THREE = window.THREE;

const SCENE_BACKGROUNDS = {
  lawn: 0x87CEEB,
  pool: 0x4A90D9,
  roof: 0xD4A574,
  fog_forest: 0x2D3B2D
};

const GRID_COLS = 9;
const GRID_ROWS = 5;
const CELL_SIZE = 100; // 从80增大到100
const HUD_HEIGHT = 120; // 从100增大到120
const GRID_OFFSET_X = 100; // 从80增大到100
const GRID_OFFSET_Y = HUD_HEIGHT;

const VIEW_WIDTH = GRID_COLS * CELL_SIZE + GRID_OFFSET_X; // 1000
const VIEW_HEIGHT = GRID_ROWS * CELL_SIZE + GRID_OFFSET_Y; // 720

// 贴图管理器 - 加载wiki贴图
const textureLoader = new THREE.TextureLoader();
const plantTextures = new Map();
const zombieTextures = new Map();

// 预加载植物贴图
const PLANT_TEXTURE_MAP = {
  peashooter: '/static/images/pvz/plants/peashooter.png',
  sunflower: '/static/images/pvz/plants/sunflower.png',
  cherry_bomb: '/static/images/pvz/plants/cherry_bomb.png',
  wall_nut: '/static/images/pvz/plants/wall_nut.png',
  potato_mine: '/static/images/pvz/plants/potato_mine.png',
  snow_pea: '/static/images/pvz/plants/snow_pea.png',
  repeater: '/static/images/pvz/plants/repeater.png',
  threepeater: '/static/images/pvz/plants/threepeater.png',
  puff_shroom: '/static/images/pvz/plants/puff_shroom.png',
  sun_shroom: '/static/images/pvz/plants/sun_shroom.png'
};

// 预加载僵尸贴图
const ZOMBIE_TEXTURE_MAP = {
  cone: '/static/images/pvz/zombies/conehead.png',
  bucket: '/static/images/pvz/zombies/buckethead.png'
};

// 加载所有贴图
function loadTextures() {
  // 加载植物贴图
  for (const [plantId, url] of Object.entries(PLANT_TEXTURE_MAP)) {
    textureLoader.load(
      url,
      (texture) => {
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        plantTextures.set(plantId, texture);
      },
      undefined,
      (err) => {
        console.warn(`Failed to load texture for ${plantId}:`, err);
      }
    );
  }

  // 加载僵尸贴图
  for (const [zombieId, url] of Object.entries(ZOMBIE_TEXTURE_MAP)) {
    textureLoader.load(
      url,
      (texture) => {
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        zombieTextures.set(zombieId, texture);
      },
      undefined,
      (err) => {
        console.warn(`Failed to load texture for ${zombieId}:`, err);
      }
    );
  }
}

// 初始化时加载贴图
loadTextures();

// Plant visual definitions: colors, shapes, emoji-like icons
const PLANT_VISUALS = {
  peashooter:    { body: '#4CAF50', accent: '#2E7D32', icon: '🌱', head: '#66BB6A', shape: 'round' },
  sunflower:     { body: '#FFD700', accent: '#FF8F00', icon: '🌻', head: '#FFEB3B', shape: 'flower' },
  cherry_bomb:   { body: '#F44336', accent: '#B71C1C', icon: '💣', head: '#EF5350', shape: 'round' },
  wall_nut:      { body: '#A1887F', accent: '#5D4037', icon: '🥜', head: '#BCAAA4', shape: 'round' },
  potato_mine:   { body: '#8D6E63', accent: '#4E342E', icon: '💥', head: '#A1887F', shape: 'round' },
  snow_pea:      { body: '#00BCD4', accent: '#006064', icon: '❄️', head: '#4DD0E1', shape: 'round' },
  chomper:       { body: '#9C27B0', accent: '#4A148C', icon: '👄', head: '#BA68C8', shape: 'round' },
  repeater:      { body: '#388E3C', accent: '#1B5E20', icon: '', head: '#4CAF50', shape: 'round' },
  puff_shroom:   { body: '#9E9E9E', accent: '#424242', icon: '🍄', head: '#BDBDBD', shape: 'mushroom' },
  sun_shroom:    { body: '#FFB300', accent: '#E65100', icon: '🍄', head: '#FFC107', shape: 'mushroom' },
  fume_shroom:   { body: '#7E57C2', accent: '#311B92', icon: '💨', head: '#9575CD', shape: 'mushroom' },
  doom_shroom:   { body: '#212121', accent: '#000000', icon: '️', head: '#424242', shape: 'mushroom' },
  ice_shroom:    { body: '#81D4FA', accent: '#01579B', icon: '🧊', head: '#B3E5FC', shape: 'mushroom' },
  jalapeno:      { body: '#FF5722', accent: '#BF360C', icon: '🌶️', head: '#FF8A65', shape: 'round' },
  lilypad:       { body: '#4CAF50', accent: '#2E7D32', icon: '🍃', head: '#66BB6A', shape: 'flat' },
  squash:        { body: '#FF9800', accent: '#E65100', icon: '🎃', head: '#FFB74D', shape: 'round' },
  threepeater:   { body: '#43A047', accent: '#1B5E20', icon: '🌿', head: '#66BB6A', shape: 'round' },
  tangle_kelp:   { body: '#009688', accent: '#004D40', icon: '🌊', head: '#4DB6AC', shape: 'flat' },
  spikeweed:     { body: '#795548', accent: '#3E2723', icon: '🌵', head: '#8D6E63', shape: 'flat' },
  torchwood:     { body: '#FF5722', accent: '#BF360C', icon: '🔥', head: '#FF8A65', shape: 'round' },
  tall_nut:      { body: '#8D6E63', accent: '#4E342E', icon: '🧱', head: '#A1887F', shape: 'tall' },
  sea_shroom:    { body: '#00BCD4', accent: '#006064', icon: '🍄', head: '#4DD0E1', shape: 'mushroom' },
  plantern:      { body: '#CDDC39', accent: '#827717', icon: '💡', head: '#D4E157', shape: 'round' },
  cactus:        { body: '#4CAF50', accent: '#1B5E20', icon: '🌵', head: '#66BB6A', shape: 'tall' },
  blover:        { body: '#03A9F4', accent: '#01579B', icon: '💨', head: '#4FC3F7', shape: 'round' },
  split_pea:     { body: '#388E3C', accent: '#1B5E20', icon: '🔀', head: '#4CAF50', shape: 'round' },
  starfruit:     { body: '#FFC107', accent: '#FF8F00', icon: '⭐', head: '#FFD54F', shape: 'round' },
  pumpkin:       { body: '#FF9800', accent: '#E65100', icon: '', head: '#FFB74D', shape: 'round' },
  magnet_shroom: { body: '#607D8B', accent: '#263238', icon: '🧲', head: '#78909C', shape: 'mushroom' },
  cabbage_pult:  { body: '#8BC34A', accent: '#33691E', icon: '🥬', head: '#AED581', shape: 'round' },
  flower_pot:    { body: '#795548', accent: '#3E2723', icon: '🪴', head: '#8D6E63', shape: 'flat' },
  kernel_pult:   { body: '#FFC107', accent: '#FF8F00', icon: '🌽', head: '#FFD54F', shape: 'round' },
  coffee_bean:   { body: '#5D4037', accent: '#3E2723', icon: '☕', head: '#795548', shape: 'round' },
  garlic:        { body: '#FAFAFA', accent: '#9E9E9E', icon: '🧄', head: '#F5F5F5', shape: 'round' },
  umbrella_leaf: { body: '#4CAF50', accent: '#2E7D32', icon: '☂️', head: '#66BB6A', shape: 'round' },
  marigold:      { body: '#FF9800', accent: '#E65100', icon: '🌼', head: '#FFB74D', shape: 'flower' },
  melon_pult:    { body: '#33691E', accent: '#1B5E20', icon: '🍉', head: '#558B2F', shape: 'round' },
  gatling_pea:   { body: '#2E7D32', accent: '#1B5E20', icon: '', head: '#388E3C', shape: 'round' },
  twin_sunflower:{ body: '#FFD700', accent: '#FF8F00', icon: '', head: '#FFEB3B', shape: 'flower' },
  gloom_shroom:  { body: '#7E57C2', accent: '#311B92', icon: '', head: '#9575CD', shape: 'mushroom' },
  cattail:       { body: '#009688', accent: '#004D40', icon: '🐱', head: '#4DB6AC', shape: 'round' },
  winter_melon:  { body: '#00BCD4', accent: '#006064', icon: '🍉', head: '#4DD0E1', shape: 'round' },
  gold_magnet:   { body: '#FFD700', accent: '#FF8F00', icon: '🧲', head: '#FFEB3B', shape: 'mushroom' },
  spikerock:     { body: '#616161', accent: '#212121', icon: '🌵', head: '#757575', shape: 'flat' },
  cob_cannon:    { body: '#FFC107', accent: '#FF8F00', icon: '🌽', head: '#FFD54F', shape: 'tall' },
  imitater:      { body: '#9E9E9E', accent: '#424242', icon: '👤', head: '#BDBDBD', shape: 'round' },
  hypno_shroom:  { body: '#E91E63', accent: '#880E4F', icon: '😵', head: '#F06292', shape: 'mushroom' },
  scaredy_shroom:{ body: '#9C27B0', accent: '#4A148C', icon: '', head: '#BA68C8', shape: 'mushroom' },
  grave_buster:  { body: '#424242', accent: '#212121', icon: '⚰️', head: '#616161', shape: 'round' }
};

const ZOMBIE_VISUALS = {
  normal:    { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', clothes: '#4E342E' },
  cone:      { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', cone: '#FF6F00' },
  bucket:    { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', bucket: '#78909C' },
  flag:      { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', flag: '#D32F2F' },
  football:  { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', helmet: '#C62828' },
  newspaper: { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', paper: '#ECEFF1' },
  screen:    { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', screen: '#37474F' },
  pole:      { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', pole: '#6D4C41' },
  diver:     { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', goggles: '#1976D2' },
  dancer:    { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', disco: '#E91E63' },
  backup:    { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', outfit: '#9C27B0' },
  balloon:   { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', balloon: '#F44336' },
  pogo:      { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', pogo: '#455A64' },
  yeti:      { body: '#ECEFF1', accent: '#B0BEC5', head: '#FFFFFF', eye: '#FF0000', fur: '#CFD8DC' },
  bungee:    { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', rope: '#212121' },
  ladder:    { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', ladder: '#8D6E63' },
  catapult:  { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', machine: '#616161' },
  gargantuar:{ body: '#3E2723', accent: '#1B0000', head: '#4E342E', eye: '#FF0000', weapon: '#5D4037' },
  imp:       { body: '#558B2F', accent: '#33691E', head: '#7CB342', eye: '#FF0000', skin: '#689F38' },
  miner:     { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', helmet: '#FFC107' },
  zamboni:   { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', vehicle: '#4FC3F7' },
  jack_in_box: { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', box: '#9C27B0', spring: '#FFD700' },
  chicken_wrangler: { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', cage: '#795548', chicken: '#FFEB3B' },
  ghost:     { body: '#B3E5FC', accent: '#81D4FA', head: '#E1F5FE', eye: '#FF0000', aura: '#4FC3F7' },
  ricochet:  { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', spring: '#FF5722' },
  treasure_hunter: { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', shovel: '#8D6E63', treasure: '#FFD700' },
  wizard:    { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', hat: '#673AB7', staff: '#795548' },
  octo:      { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', octopus: '#E91E63' },
  all_star:  { body: '#5D4037', accent: '#3E2723', head: '#8D6E63', eye: '#FF0000', armor: '#FFC107', helmet: '#FF5722' },
  smurf:     { body: '#2196F3', accent: '#1565C0', head: '#64B5F6', eye: '#FF0000' },
  boss:      { body: '#1B0000', accent: '#000000', head: '#3E2723', eye: '#FF0000', armor: '#424242' }
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.webglRenderer = null;
    this.gridMeshes = [];
    this.entitySprites = new Map();
    this.hoverHighlight = null;
    this.lawnMowerSprites = [];
    this.craterMeshes = [];
    this._sceneDecorations = [];
    this._menuBackgroundSprites = [];
    this._sunAnimations = [];
    this._waveProgressBar = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE_BACKGROUNDS.lawn);

    this.camera = new THREE.OrthographicCamera(
      0, 1000, 720, 0, 0.1, 1000
    );
    this.camera.position.z = 100;

    this.webglRenderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });
    this.webglRenderer.setSize(1000, 720);
    this.webglRenderer.setPixelRatio(window.devicePixelRatio);

    this._buildGrid();
    this._buildMenuBackground();
    this.webglRenderer.render(this.scene, this.camera);
  }

  _buildGrid() {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        // Alternating lawn texture
        const isEven = (row + col) % 2 === 0;
        const baseColor = isEven ? 0x4CAF50 : 0x43A047;

        const geometry = new THREE.PlaneGeometry(CELL_SIZE - 2, CELL_SIZE - 2);
        const material = new THREE.MeshBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        const worldX = GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
        const worldY = 720 - (GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2);
        mesh.position.set(worldX, worldY, 0);
        mesh.userData = { row, col };

        // Add subtle texture overlay (grass tufts / dirt patches)
        this._addGridTextureOverlay(mesh, row, col);

        this.scene.add(mesh);
        this.gridMeshes.push(mesh);
      }
    }

    // Add grid lines
    this._buildGridLines();
  }

  _buildGridLines() {
    // Horizontal lines
    for (let row = 0; row <= GRID_ROWS; row++) {
      const worldY = 720 - (GRID_OFFSET_Y + row * CELL_SIZE);
      const geometry = new THREE.PlaneGeometry(GRID_COLS * CELL_SIZE + 4, 1);
      const material = new THREE.MeshBasicMaterial({
        color: 0x2E7D32,
        transparent: true,
        opacity: 0.4
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(GRID_OFFSET_X + GRID_COLS * CELL_SIZE / 2, worldY, 0.1);
      this.scene.add(mesh);
    }

    // Vertical lines
    for (let col = 0; col <= GRID_COLS; col++) {
      const worldX = GRID_OFFSET_X + col * CELL_SIZE;
      const geometry = new THREE.PlaneGeometry(1, GRID_ROWS * CELL_SIZE + 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0x2E7D32,
        transparent: true,
        opacity: 0.4
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(worldX, 720 - GRID_OFFSET_Y - GRID_ROWS * CELL_SIZE / 2, 0.1);
      this.scene.add(mesh);
    }
  }

  _addGridTextureOverlay(mesh, row, col) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Add random grass tufts or dirt patches
    const seed = (row * GRID_COLS + col) % 3;
    ctx.globalAlpha = 0.3;

    if (seed === 0) {
      // Grass tufts
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const x = 10 + Math.random() * 44;
        const y = 50 + Math.random() * 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y - 8);
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y - 8);
        ctx.stroke();
      }
    } else if (seed === 1) {
      // Dirt patches
      ctx.fillStyle = '#5D4037';
      for (let i = 0; i < 3; i++) {
        const x = 15 + Math.random() * 34;
        const y = 45 + Math.random() * 15;
        ctx.beginPath();
        ctx.arc(x, y, 2 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Small flowers
      ctx.fillStyle = '#FFEB3B';
      for (let i = 0; i < 2; i++) {
        const x = 20 + Math.random() * 24;
        const y = 48 + Math.random() * 12;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    const overlayMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });

    const overlay = new THREE.Mesh(mesh.geometry.clone(), overlayMaterial);
    overlay.position.copy(mesh.position);
    overlay.position.z = 0.01;
    overlay.userData = { isOverlay: true, parentMesh: mesh };

    this.scene.add(overlay);
    mesh.userData.overlay = overlay;
  }

  _drawCloud(ctx, x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTree(ctx, x, y, height) {
    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x - 8, y, 16, height * 0.4);

    // Foliage
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.arc(x, y - height * 0.1, height * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - height * 0.15, y + height * 0.05, height * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + height * 0.15, y + height * 0.05, height * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawFence(ctx, x, y, width, height) {
    ctx.fillStyle = '#8D6E63';
    // Horizontal bars
    ctx.fillRect(x, y, width, 4);
    ctx.fillRect(x, y + height * 0.6, width, 4);

    // Vertical posts
    const postCount = Math.floor(width / 20);
    for (let i = 0; i <= postCount; i++) {
      const postX = x + (i * width / postCount);
      ctx.fillRect(postX, y, 6, height);
      // Pointed top
      ctx.beginPath();
      ctx.moveTo(postX, y);
      ctx.lineTo(postX + 3, y - 6);
      ctx.lineTo(postX + 6, y);
      ctx.fill();
    }
  }

  _drawHouse(ctx, x, y, width, height) {
    // Main body
    ctx.fillStyle = '#795548';
    ctx.fillRect(x, y, width, height);

    // Roof
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + width / 2, y - height * 0.4);
    ctx.lineTo(x + width + 10, y);
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(x + width * 0.4, y + height * 0.5, width * 0.2, height * 0.5);

    // Windows
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(x + width * 0.15, y + height * 0.2, width * 0.2, height * 0.2);
    ctx.fillRect(x + width * 0.65, y + height * 0.2, width * 0.2, height * 0.2);
  }

  _buildMenuBackground() {
    // Sky gradient background
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1000;
    skyCanvas.height = 720;
    const skyCtx = skyCanvas.getContext('2d');

    const gradient = skyCtx.createLinearGradient(0, 0, 0, 720);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#5DADE2');
    gradient.addColorStop(1, '#2E86AB');
    skyCtx.fillStyle = gradient;
    skyCtx.fillRect(0, 0, 1000, 720);

    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    const skyMaterial = new THREE.SpriteMaterial({ map: skyTexture, transparent: false });
    const skySprite = new THREE.Sprite(skyMaterial);
    skySprite.scale.set(1000, 720, 1);
    skySprite.position.set(500, 360, -10);
    this.scene.add(skySprite);
    this._menuBackgroundSprites.push(skySprite);

    // Clouds
    const cloudPositions = [
      { x: 100, y: 80, size: 40 },
      { x: 300, y: 60, size: 50 },
      { x: 550, y: 90, size: 45 },
      { x: 650, y: 70, size: 35 }
    ];

    for (const pos of cloudPositions) {
      const cloudCanvas = document.createElement('canvas');
      cloudCanvas.width = 128;
      cloudCanvas.height = 64;
      const cloudCtx = cloudCanvas.getContext('2d');
      this._drawCloud(cloudCtx, 20, 32, pos.size);

      const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
      const cloudMaterial = new THREE.SpriteMaterial({ map: cloudTexture, transparent: true });
      const cloudSprite = new THREE.Sprite(cloudMaterial);
      cloudSprite.scale.set(128, 64, 1);
      cloudSprite.position.set(pos.x, 720 - pos.y, -5);
      this.scene.add(cloudSprite);
      this._menuBackgroundSprites.push(cloudSprite);
    }

    // Ground/grass strip
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 1000;
    groundCanvas.height = 80;
    const groundCtx = groundCanvas.getContext('2d');

    const groundGradient = groundCtx.createLinearGradient(0, 0, 0, 80);
    groundGradient.addColorStop(0, '#4CAF50');
    groundGradient.addColorStop(1, '#2E7D32');
    groundCtx.fillStyle = groundGradient;
    groundCtx.fillRect(0, 0, 1000, 80);

    // Grass blades
    groundCtx.strokeStyle = '#1B5E20';
    groundCtx.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * 1000;
      const y = Math.random() * 60;
      groundCtx.beginPath();
      groundCtx.moveTo(x, y + 10);
      groundCtx.lineTo(x - 2, y);
      groundCtx.moveTo(x, y + 10);
      groundCtx.lineTo(x + 2, y);
      groundCtx.stroke();
    }

    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    const groundMaterial = new THREE.SpriteMaterial({ map: groundTexture, transparent: false });
    const groundSprite = new THREE.Sprite(groundMaterial);
    groundSprite.scale.set(1000, 80, 1);
    groundSprite.position.set(500, 40, -8);
    this.scene.add(groundSprite);
    this._menuBackgroundSprites.push(groundSprite);

    // Fence on left
    const fenceCanvas = document.createElement('canvas');
    fenceCanvas.width = 120;
    fenceCanvas.height = 100;
    const fenceCtx = fenceCanvas.getContext('2d');
    this._drawFence(fenceCtx, 10, 20, 100, 60);

    const fenceTexture = new THREE.CanvasTexture(fenceCanvas);
    const fenceMaterial = new THREE.SpriteMaterial({ map: fenceTexture, transparent: true });
    const fenceSprite = new THREE.Sprite(fenceMaterial);
    fenceSprite.scale.set(120, 100, 1);
    fenceSprite.position.set(60, 150, -6);
    this.scene.add(fenceSprite);
    this._menuBackgroundSprites.push(fenceSprite);

    // House on right
    const houseCanvas = document.createElement('canvas');
    houseCanvas.width = 160;
    houseCanvas.height = 140;
    const houseCtx = houseCanvas.getContext('2d');
    this._drawHouse(houseCtx, 10, 40, 140, 90);

    const houseTexture = new THREE.CanvasTexture(houseCanvas);
    const houseMaterial = new THREE.SpriteMaterial({ map: houseTexture, transparent: true });
    const houseSprite = new THREE.Sprite(houseMaterial);
    houseSprite.scale.set(160, 140, 1);
    houseSprite.position.set(900, 220, -6);
    this.scene.add(houseSprite);
    this._menuBackgroundSprites.push(houseSprite);

    // Trees on sides
    const treePositions = [
      { x: 40, y: 250, height: 100 },
      { x: 960, y: 280, height: 110 }
    ];

    for (const pos of treePositions) {
      const treeCanvas = document.createElement('canvas');
      treeCanvas.width = 80;
      treeCanvas.height = 120;
      const treeCtx = treeCanvas.getContext('2d');
      this._drawTree(treeCtx, 40, 80, pos.height);

      const treeTexture = new THREE.CanvasTexture(treeCanvas);
      const treeMaterial = new THREE.SpriteMaterial({ map: treeTexture, transparent: true });
      const treeSprite = new THREE.Sprite(treeMaterial);
      treeSprite.scale.set(80, 120, 1);
      treeSprite.position.set(pos.x, 720 - pos.y, -7);
      this.scene.add(treeSprite);
      this._menuBackgroundSprites.push(treeSprite);
    }
  }

  _clearSceneDecorations() {
    for (const sprite of this._sceneDecorations) {
      this.scene.remove(sprite);
      if (sprite.material.map) sprite.material.map.dispose();
      sprite.material.dispose();
    }
    this._sceneDecorations = [];

    for (const sprite of this._menuBackgroundSprites) {
      this.scene.remove(sprite);
      if (sprite.material.map) sprite.material.map.dispose();
      sprite.material.dispose();
    }
    this._menuBackgroundSprites = [];
  }

  _buildSceneDecorations(sceneType) {
    this._clearSceneDecorations();

    if (sceneType === 'lawn') {
      // Sky background with gradient
      const skyCanvas = document.createElement('canvas');
      skyCanvas.width = 1000;
      skyCanvas.height = 720;
      const skyCtx = skyCanvas.getContext('2d');
      const gradient = skyCtx.createLinearGradient(0, 0, 0, 720);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.5, '#5DADE2');
      gradient.addColorStop(1, '#4A90D9');
      skyCtx.fillStyle = gradient;
      skyCtx.fillRect(0, 0, 1000, 720);

      // Add clouds
      skyCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 5; i++) {
        const x = 100 + i * 120;
        const y = 50 + Math.random() * 80;
        const size = 30 + Math.random() * 20;
        skyCtx.beginPath();
        skyCtx.arc(x, y, size, 0, Math.PI * 2);
        skyCtx.arc(x + size * 0.8, y, size * 0.9, 0, Math.PI * 2);
        skyCtx.arc(x + size * 1.5, y, size * 0.7, 0, Math.PI * 2);
        skyCtx.fill();
      }

      const skyTexture = new THREE.CanvasTexture(skyCanvas);
      const skyMaterial = new THREE.SpriteMaterial({ map: skyTexture });
      const skySprite = new THREE.Sprite(skyMaterial);
      skySprite.scale.set(1000, 720, 1);
      skySprite.position.set(500, 360, -10);
      this.scene.add(skySprite);
      this._sceneDecorations.push(skySprite);

      // Left side - House with detailed design
      const houseCanvas = document.createElement('canvas');
      houseCanvas.width = 120;
      houseCanvas.height = 720;
      const houseCtx = houseCanvas.getContext('2d');

      // House body
      houseCtx.fillStyle = '#8B4513';
      houseCtx.fillRect(10, 200, 100, 320);
      
      // Roof
      houseCtx.fillStyle = '#654321';
      houseCtx.beginPath();
      houseCtx.moveTo(5, 200);
      houseCtx.lineTo(60, 150);
      houseCtx.lineTo(115, 200);
      houseCtx.closePath();
      houseCtx.fill();

      // Door
      houseCtx.fillStyle = '#5D4037';
      houseCtx.fillRect(40, 400, 40, 120);
      houseCtx.fillStyle = '#FFD700';
      houseCtx.beginPath();
      houseCtx.arc(70, 460, 3, 0, Math.PI * 2);
      houseCtx.fill();

      // Windows
      houseCtx.fillStyle = '#87CEEB';
      houseCtx.fillRect(25, 250, 30, 30);
      houseCtx.fillRect(65, 250, 30, 30);
      houseCtx.fillRect(25, 320, 30, 30);
      houseCtx.fillRect(65, 320, 30, 30);

      // Window frames
      houseCtx.strokeStyle = '#5D4037';
      houseCtx.lineWidth = 2;
      houseCtx.strokeRect(25, 250, 30, 30);
      houseCtx.strokeRect(65, 250, 30, 30);
      houseCtx.strokeRect(25, 320, 30, 30);
      houseCtx.strokeRect(65, 320, 30, 30);

      const houseTexture = new THREE.CanvasTexture(houseCanvas);
      const houseMaterial = new THREE.SpriteMaterial({ map: houseTexture, transparent: true });
      const houseSprite = new THREE.Sprite(houseMaterial);
      houseSprite.scale.set(120, 720, 1);
      houseSprite.position.set(60, 360, -5);
      this.scene.add(houseSprite);
      this._sceneDecorations.push(houseSprite);

      // Right side - Fence and bushes
      const fenceCanvas = document.createElement('canvas');
      fenceCanvas.width = 100;
      fenceCanvas.height = 720;
      const fenceCtx = fenceCanvas.getContext('2d');

      // Wooden fence
      for (let i = 0; i < 8; i++) {
        const y = 100 + i * 80;
        fenceCtx.fillStyle = '#8B4513';
        fenceCtx.fillRect(20, y, 8, 70);
        fenceCtx.fillRect(70, y, 8, 70);

        // Horizontal bars
        fenceCtx.fillStyle = '#A0522D';
        fenceCtx.fillRect(15, y + 20, 70, 6);
        fenceCtx.fillRect(15, y + 48, 70, 6);
      }

      // Bushes at bottom
      fenceCtx.fillStyle = '#2E7D32';
      for (let i = 0; i < 4; i++) {
        const x = 10 + i * 25;
        const y = 670 + Math.random() * 20;
        fenceCtx.beginPath();
        fenceCtx.arc(x, y, 15, 0, Math.PI * 2);
        fenceCtx.arc(x + 10, y - 5, 12, 0, Math.PI * 2);
        fenceCtx.fill();
      }

      const fenceTexture = new THREE.CanvasTexture(fenceCanvas);
      const fenceMaterial = new THREE.SpriteMaterial({ map: fenceTexture, transparent: true });
      const fenceSprite = new THREE.Sprite(fenceMaterial);
      fenceSprite.scale.set(100, 720, 1);
      fenceSprite.position.set(950, 360, -5);
      this.scene.add(fenceSprite);
      this._sceneDecorations.push(fenceSprite);

      // Bottom - Path/road
      const pathCanvas = document.createElement('canvas');
      pathCanvas.width = 1000;
      pathCanvas.height = 60;
      const pathCtx = pathCanvas.getContext('2d');

      // Dirt path
      pathCtx.fillStyle = '#8B6F47';
      pathCtx.fillRect(0, 0, 1000, 60);

      // Path texture
      pathCtx.fillStyle = '#7A5C3A';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 1000;
        const y = Math.random() * 60;
        pathCtx.beginPath();
        pathCtx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2);
        pathCtx.fill();
      }

      const pathTexture = new THREE.CanvasTexture(pathCanvas);
      const pathMaterial = new THREE.SpriteMaterial({ map: pathTexture });
      const pathSprite = new THREE.Sprite(pathMaterial);
      pathSprite.scale.set(1000, 60, 1);
      pathSprite.position.set(500, 30, -8);
      this.scene.add(pathSprite);
      this._sceneDecorations.push(pathSprite);

    } else if (sceneType === 'pool') {
      // Sky background
      const skyCanvas = document.createElement('canvas');
      skyCanvas.width = 1000;
      skyCanvas.height = 720;
      const skyCtx = skyCanvas.getContext('2d');
      const gradient = skyCtx.createLinearGradient(0, 0, 0, 720);
      gradient.addColorStop(0, '#4FC3F7');
      gradient.addColorStop(1, '#0288D1');
      skyCtx.fillStyle = gradient;
      skyCtx.fillRect(0, 0, 1000, 720);

      const skyTexture = new THREE.CanvasTexture(skyCanvas);
      const skyMaterial = new THREE.SpriteMaterial({ map: skyTexture });
      const skySprite = new THREE.Sprite(skyMaterial);
      skySprite.scale.set(1000, 720, 1);
      skySprite.position.set(500, 360, -10);
      this.scene.add(skySprite);
      this._sceneDecorations.push(skySprite);

      // Water shimmer effect on pool rows (2, 3)
      const waterRows = [2, 3];
      for (const row of waterRows) {
        const waterCanvas = document.createElement('canvas');
        waterCanvas.width = GRID_COLS * CELL_SIZE;
        waterCanvas.height = CELL_SIZE;
        const waterCtx = waterCanvas.getContext('2d');

        const waterGradient = waterCtx.createLinearGradient(0, 0, 0, CELL_SIZE);
        waterGradient.addColorStop(0, 'rgba(33, 150, 243, 0.3)');
        waterGradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.4)');
        waterGradient.addColorStop(1, 'rgba(33, 150, 243, 0.3)');
        waterCtx.fillStyle = waterGradient;
        waterCtx.fillRect(0, 0, GRID_COLS * CELL_SIZE, CELL_SIZE);

        // Shimmer lines
        waterCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        waterCtx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          const y = 10 + Math.random() * (CELL_SIZE - 20);
          waterCtx.beginPath();
          waterCtx.moveTo(i * 80, y);
          waterCtx.lineTo(i * 80 + 40, y);
          waterCtx.stroke();
        }

        const waterTexture = new THREE.CanvasTexture(waterCanvas);
        const waterMaterial = new THREE.SpriteMaterial({ map: waterTexture, transparent: true });
        const waterSprite = new THREE.Sprite(waterMaterial);
        waterSprite.scale.set(GRID_COLS * CELL_SIZE, CELL_SIZE, 1);
        const worldY = 720 - (GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2);
        waterSprite.position.set(GRID_OFFSET_X + GRID_COLS * CELL_SIZE / 2, worldY, 0.05);
        this.scene.add(waterSprite);
        this._sceneDecorations.push(waterSprite);
      }

    } else if (sceneType === 'roof') {
      // Sky background
      const skyCanvas = document.createElement('canvas');
      skyCanvas.width = 1000;
      skyCanvas.height = 720;
      const skyCtx = skyCanvas.getContext('2d');
      const gradient = skyCtx.createLinearGradient(0, 0, 0, 720);
      gradient.addColorStop(0, '#FFB74D');
      gradient.addColorStop(1, '#FF8A65');
      skyCtx.fillStyle = gradient;
      skyCtx.fillRect(0, 0, 1000, 720);

      const skyTexture = new THREE.CanvasTexture(skyCanvas);
      const skyMaterial = new THREE.SpriteMaterial({ map: skyTexture });
      const skySprite = new THREE.Sprite(skyMaterial);
      skySprite.scale.set(1000, 720, 1);
      skySprite.position.set(500, 360, -10);
      this.scene.add(skySprite);
      this._sceneDecorations.push(skySprite);

      // Tile pattern overlay
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = GRID_COLS * CELL_SIZE;
      tileCanvas.height = GRID_ROWS * CELL_SIZE;
      const tileCtx = tileCanvas.getContext('2d');

      tileCtx.fillStyle = 'rgba(141, 110, 99, 0.3)';
      tileCtx.fillRect(0, 0, tileCanvas.width, tileCanvas.height);

      // Tile lines
      tileCtx.strokeStyle = 'rgba(93, 64, 55, 0.4)';
      tileCtx.lineWidth = 2;
      for (let row = 0; row <= GRID_ROWS; row++) {
        tileCtx.beginPath();
        tileCtx.moveTo(0, row * CELL_SIZE);
        tileCtx.lineTo(GRID_COLS * CELL_SIZE, row * CELL_SIZE);
        tileCtx.stroke();
      }
      for (let col = 0; col <= GRID_COLS; col++) {
        tileCtx.beginPath();
        tileCtx.moveTo(col * CELL_SIZE, 0);
        tileCtx.lineTo(col * CELL_SIZE, GRID_ROWS * CELL_SIZE);
        tileCtx.stroke();
      }

      const tileTexture = new THREE.CanvasTexture(tileCanvas);
      const tileMaterial = new THREE.SpriteMaterial({ map: tileTexture, transparent: true });
      const tileSprite = new THREE.Sprite(tileMaterial);
      tileSprite.scale.set(GRID_COLS * CELL_SIZE, GRID_ROWS * CELL_SIZE, 1);
      tileSprite.position.set(
        GRID_OFFSET_X + GRID_COLS * CELL_SIZE / 2,
        720 - GRID_OFFSET_Y - GRID_ROWS * CELL_SIZE / 2,
        0.05
      );
      this.scene.add(tileSprite);
      this._sceneDecorations.push(tileSprite);

    } else if (sceneType === 'fog_forest') {
      // Dark forest background
      const forestCanvas = document.createElement('canvas');
      forestCanvas.width = 1000;
      forestCanvas.height = 720;
      const forestCtx = forestCanvas.getContext('2d');

      const gradient = forestCtx.createLinearGradient(0, 0, 0, 720);
      gradient.addColorStop(0, '#1B5E20');
      gradient.addColorStop(0.5, '#2E7D32');
      gradient.addColorStop(1, '#1B5E20');
      forestCtx.fillStyle = gradient;
      forestCtx.fillRect(0, 0, 1000, 720);

      // Trees in background
      for (let i = 0; i < 10; i++) {
        const x = 50 + i * 100;
        const y = 150 + Math.random() * 150;
        this._drawTree(forestCtx, x, y, 80 + Math.random() * 60);
      }

      const forestTexture = new THREE.CanvasTexture(forestCanvas);
      const forestMaterial = new THREE.SpriteMaterial({ map: forestTexture });
      const forestSprite = new THREE.Sprite(forestMaterial);
      forestSprite.scale.set(1000, 720, 1);
      forestSprite.position.set(500, 360, -10);
      this.scene.add(forestSprite);
      this._sceneDecorations.push(forestSprite);

      // Fog overlay
      const fogCanvas = document.createElement('canvas');
      fogCanvas.width = 1000;
      fogCanvas.height = 720;
      const fogCtx = fogCanvas.getContext('2d');
      fogCtx.fillStyle = 'rgba(200, 230, 200, 0.3)';
      fogCtx.fillRect(0, 0, 1000, 720);

      // Fog patches
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 1000;
        const y = Math.random() * 720;
        const radius = 30 + Math.random() * 50;
        fogCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        fogCtx.beginPath();
        fogCtx.arc(x, y, radius, 0, Math.PI * 2);
        fogCtx.fill();
      }

      const fogTexture = new THREE.CanvasTexture(fogCanvas);
      const fogMaterial = new THREE.SpriteMaterial({ map: fogTexture, transparent: true });
      const fogSprite = new THREE.Sprite(fogMaterial);
      fogSprite.scale.set(1000, 720, 1);
      fogSprite.position.set(500, 360, -5);
      this.scene.add(fogSprite);
      this._sceneDecorations.push(fogSprite);
    }
  }

  setSceneBackground(sceneType) {
    const bgColor = SCENE_BACKGROUNDS[sceneType] || SCENE_BACKGROUNDS.lawn;
    this.scene.background = new THREE.Color(bgColor);

    const colors = {
      lawn: [0x4CAF50, 0x43A047],
      pool: [0x4CAF50, 0x43A047],
      roof: [0x8D6E63, 0x795548],
      fog_forest: [0x556B2F, 0x4A5D23]
    };
    const [c1, c2] = colors[sceneType] || colors.lawn;

    for (let i = 0; i < this.gridMeshes.length; i++) {
      const mesh = this.gridMeshes[i];
      const isEven = (mesh.userData.row + mesh.userData.col) % 2 === 0;
      mesh.material.color.set(isEven ? c1 : c2);
    }

    if (sceneType === 'pool') {
      const waterRows = [2, 3];
      for (const mesh of this.gridMeshes) {
        if (waterRows.includes(mesh.userData.row)) {
          mesh.material.color.set(0x1976D2);
          mesh.material.opacity = 0.7;
        }
      }
    }

    // Build scene-specific decorations
    this._buildSceneDecorations(sceneType);
  }

  addSprite(entity) {
    if (!entity) return;

    // 始终使用程序化绘制（贴图无法实现原版动画效果）
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (entity.data) {
      this._drawPlantSprite(ctx, entity);
    } else if (entity.isElite !== undefined || entity.isBoss !== undefined) {
      this._drawZombieSprite(ctx, entity);
    } else if (entity.value !== undefined || entity.amount !== undefined) {
      this._drawSunSprite(ctx, entity);
    } else if (entity.damage !== undefined && entity.speed !== undefined) {
      this._drawProjectileSprite(ctx, entity);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    // 阳光实体使用更大的尺寸，方便看清与点击；按数值区分大小
    const isSun = entity && (entity.value !== undefined || entity.amount !== undefined);
    let sunScale = CELL_SIZE;
    if (isSun) {
      const amount = entity.amount !== undefined ? entity.amount : (entity.value || 25);
      if (amount >= 150) sunScale = CELL_SIZE * 1.6;
      else if (amount >= 75) sunScale = CELL_SIZE * 1.4;
      else if (amount >= 50) sunScale = CELL_SIZE * 1.2;
      else sunScale = CELL_SIZE;
    }
    sprite.scale.set(sunScale, sunScale, 1);

    this._positionSprite(sprite, entity);

    this.scene.add(sprite);
    this.entitySprites.set(entity, sprite);
    entity.sprite = sprite;
  }

  removeSprite(entity) {
    if (!entity) return;
    const sprite = this.entitySprites.get(entity);
    if (sprite) {
      this.scene.remove(sprite);
      sprite.material.map.dispose();
      sprite.material.dispose();
      this.entitySprites.delete(entity);
      entity.sprite = null;
    }
  }

  // 重绘 sprite 纹理（HP/护盾/状态变化时调用）
  redrawSprite(entity) {
    if (!entity) return;
    const sprite = this.entitySprites.get(entity);
    if (!sprite) return;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (entity.data) {
      this._drawPlantSprite(ctx, entity);
    } else if (entity.isElite !== undefined || entity.isBoss !== undefined || entity.type !== undefined) {
      this._drawZombieSprite(ctx, entity);
    } else if (entity.value !== undefined || entity.amount !== undefined) {
      this._drawSunSprite(ctx, entity);
    }

    // 释放旧纹理，设置新纹理
    if (sprite.material.map) {
      sprite.material.map.dispose();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    sprite.material.map = texture;
  }

  _positionSprite(sprite, entity) {
    let worldX, worldY;

    if (entity.data) {
      worldX = GRID_OFFSET_X + entity.col * CELL_SIZE + CELL_SIZE / 2;
      worldY = 720 - (GRID_OFFSET_Y + entity.row * CELL_SIZE + CELL_SIZE / 2);
    } else if (entity.row !== undefined && entity.x !== undefined) {
      worldX = entity.x;
      worldY = 720 - (GRID_OFFSET_Y + entity.row * CELL_SIZE + CELL_SIZE / 2);
    } else if (entity.value !== undefined || entity.amount !== undefined) {
      // 阳光实体（value 或 amount 任一存在）
      worldX = entity.x;
      worldY = 720 - entity.y;
    } else {
      worldX = 0;
      worldY = 0;
    }

    sprite.position.set(worldX, worldY, 1);
  }

  // ===== 植物绘制入口 =====
  _drawPlantSprite(ctx, plant) {
    // 杂交植物走多形态渲染
    if (plant.data && plant.data.isHybrid) {
      return this._drawHybridSprite(ctx, plant);
    }
    // 基础植物
    ctx.save();
    ctx.scale(2, 2);
    this._drawShadow(ctx);
    this._drawSinglePlantBody(ctx, plant.data.id, plant);
    this._drawPlantNameAndHp(ctx, plant);
    this._drawPlantStateOverlay(ctx, plant);
    ctx.restore();
  }

  // 地面阴影
  _drawShadow(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(32, 56, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 名称标签 + 血条 + 南瓜护盾条
  _drawPlantNameAndHp(ctx, plant) {
    const plantId = plant.data ? plant.data.id : plant.id;
    const name = plant.data ? (plant.data.name_cn || plantId) : plantId;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 50, 44, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const shortName = name.length >= 2 ? name.substring(0, 2) : name;
    ctx.fillText(shortName, 32, 56);

    if (plant.pumpkinHp !== undefined && plant.pumpkinMaxHp !== undefined && plant.pumpkinMaxHp > 0) {
      this._drawShieldBar(ctx, plant.pumpkinHp, plant.pumpkinMaxHp, (64-50)/2, 4, 50, 6, '#FF9800');
    }
    if (plant.hp !== undefined && plant.maxHp !== undefined) {
      this._drawHealthBar(ctx, plant.hp, plant.maxHp);
    }
  }

  // 状态覆盖层（冻结/灼烧/武装/引信）
  _drawPlantStateOverlay(ctx, plant) {
    // 冻结状态
    if (plant.frozenTimer && plant.frozenTimer > 0) {
      ctx.fillStyle = 'rgba(100, 200, 255, 0.35)';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const x = 10 + i * 14;
        ctx.beginPath();
        ctx.moveTo(x, 8); ctx.lineTo(x + 4, 12);
        ctx.moveTo(x + 4, 8); ctx.lineTo(x, 12);
        ctx.stroke();
      }
    }
    // 灼烧状态
    if (plant.burningTimer && plant.burningTimer > 0) {
      for (let i = 0; i < 3; i++) {
        const x = 16 + i * 16;
        const flicker = 0.6 + 0.4 * Math.sin(Date.now() / 80 + i);
        ctx.fillStyle = `rgba(255, ${80 + i * 30}, 0, ${flicker * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(x, 8);
        ctx.quadraticCurveTo(x + 4, 2, x + 8, 8);
        ctx.fill();
      }
    }
    // 土豆地雷未武装提示
    if (plant.id === 'potato_mine' && plant.isArmed === false) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
      ctx.fillRect(0, 0, 64, 64);
    }
  }

  // 可复用的植物本体绘制（不画阴影/血条/名称）
  // state 用于传递状态参数（如 plant.isArmed / plant.state / plant.frozenTimer 等）
  _drawSinglePlantBody(ctx, plantId, state = {}) {
    const visual = PLANT_VISUALS[plantId] || PLANT_VISUALS.peashooter;
    const shape = visual.shape || 'round';

    // 窝瓜动画变换（仅对 squash 生效）
    let squashTransform = null;
    if (plantId === 'squash' && state.state && state.state !== 'idle') {
      if (state.state === 'targeting') {
        const shake = Math.sin(Date.now() / 50) * 2;
        squashTransform = { x: shake, y: 0, scaleY: 1 };
      } else if (state.state === 'jumping') {
        const progress = 1 - (state.stateTimer / 0.35);
        const jumpHeight = Math.sin(progress * Math.PI) * 30;
        squashTransform = { x: 0, y: -jumpHeight, scaleY: 1 };
      } else if (state.state === 'squashed') {
        squashTransform = { x: 0, y: 8, scaleY: 0.4 };
      }
    }
    if (squashTransform) {
      ctx.save();
      ctx.translate(squashTransform.x, squashTransform.y);
      ctx.scale(1, squashTransform.scaleY);
    }

    // 茎和叶（蘑菇和 flat 类不画；可见于身体下方，解决"头大无脚"问题）
    if (shape !== 'flat' && shape !== 'mushroom') {
      // 主茎（细长，从身体下方延伸到地面）
      ctx.fillStyle = '#2E7D32';
      ctx.fillRect(30, 36, 4, 20);
      // 左叶
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.ellipse(22, 46, 8, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // 左叶脉络
      ctx.strokeStyle = '#2E7D32';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(28, 47); ctx.lineTo(16, 45);
      ctx.stroke();
      // 右叶
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.ellipse(42, 46, 8, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // 右叶脉络
      ctx.beginPath();
      ctx.moveTo(36, 47); ctx.lineTo(48, 45);
      ctx.stroke();
    }

    // === 1. 基础身体形状 ===
    if (shape === 'mushroom') {
      this._drawMushroomBody(ctx, plantId, visual, state);
    } else if (shape === 'flower') {
      this._drawFlowerBody(ctx, plantId, visual);
    } else if (shape === 'tall') {
      this._drawTallBody(ctx, plantId, visual);
    } else if (shape === 'flat') {
      this._drawFlatBody(ctx, plantId, visual);
    } else {
      this._drawRoundBody(ctx, plantId, visual);
    }

    // === 2. 眼睛（部分植物无眼；位置随身体上移到 y=22 附近） ===
    const noEyes = ['wall_nut', 'tall_nut', 'flower_pot', 'lilypad', 'spikeweed', 'spikerock',
                    'tangle_kelp', 'pumpkin', 'cob_cannon', 'imitater', 'coffee_bean'];
    if (!noEyes.includes(plantId)) {
      // 不同 shape 的眼睛 y 坐标
      let eyeY = 22;
      if (shape === 'mushroom') eyeY = 22;
      else if (shape === 'flower') eyeY = 22;
      else if (shape === 'tall') eyeY = 26;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(26, eyeY, 5, 0, Math.PI * 2);
      ctx.arc(38, eyeY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(27, eyeY, 2.5, 0, Math.PI * 2);
      ctx.arc(39, eyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // === 3. 植物专属特征 ===
    this._drawPlantFeature(ctx, plantId, visual, state);

    if (squashTransform) {
      ctx.restore();
    }
  }

  // 蘑菇身体 — 缩小盖并上移，柄可见
  _drawMushroomBody(ctx, plantId, visual, state) {
    let capColor = visual.body;
    // 胆小菇畏缩时颜色变暗
    if (plantId === 'scaredy_shroom' && state.isScared) {
      capColor = '#6A1B9A';
    }
    // 蘑菇盖（半径 18，中心 y=22，原 22/26）
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.arc(32, 22, 18, Math.PI, 0);
    ctx.fill();
    // 盖下沿
    ctx.fillStyle = visual.accent;
    ctx.fillRect(14, 20, 36, 4);
    // 白色斑点（多数蘑菇）
    if (['puff_shroom', 'sun_shroom', 'ice_shroom', 'hypno_shroom', 'scaredy_shroom'].includes(plantId)) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(24, 18, 3, 0, Math.PI * 2);
      ctx.arc(38, 16, 2.5, 0, Math.PI * 2);
      ctx.arc(30, 12, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // 蘑菇柄（可见，从 y=24 到 y=44）
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(27, 24, 10, 20);
    // 柄底色阴影
    ctx.fillStyle = visual.accent;
    ctx.fillRect(27, 42, 10, 2);
  }

  // 向日葵/花朵身体 — 缩小并上移，茎叶可见
  _drawFlowerBody(ctx, plantId, visual) {
    const petalCount = (plantId === 'twin_sunflower') ? 12 : 8;
    const petalRadius = 13;  // 原 16
    const petalSize = 7;     // 原 8
    const flowerCenterY = 22; // 原 28
    ctx.fillStyle = visual.body;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const px = 32 + Math.cos(angle) * petalRadius;
      const py = flowerCenterY + Math.sin(angle) * petalRadius;
      ctx.beginPath();
      ctx.arc(px, py, petalSize, 0, Math.PI * 2);
      ctx.fill();
    }
    // 花心
    ctx.fillStyle = visual.accent;
    ctx.beginPath();
    ctx.arc(32, flowerCenterY, 9, 0, Math.PI * 2);
    ctx.fill();
    // 双子向日葵：两个花心
    if (plantId === 'twin_sunflower') {
      ctx.fillStyle = visual.accent;
      ctx.beginPath();
      ctx.arc(28, 20, 5, 0, Math.PI * 2);
      ctx.arc(36, 20, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // 金盏花多色花瓣
    if (plantId === 'marigold') {
      const colors = ['#FF9800', '#FFC107', '#FF5722'];
      for (let i = 0; i < 8; i++) {
        if (i % 3 === 0) {
          const angle = (i / 8) * Math.PI * 2;
          const px = 32 + Math.cos(angle) * petalRadius;
          const py = flowerCenterY + Math.sin(angle) * petalRadius;
          ctx.fillStyle = colors[i % 3];
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // 高个身体
  _drawTallBody(ctx, plantId, visual) {
    ctx.fillStyle = visual.body;
    ctx.fillRect(22, 8, 20, 42);
    ctx.fillStyle = visual.accent;
    ctx.fillRect(24, 10, 16, 38);
    // 顶部
    ctx.fillStyle = visual.head;
    ctx.beginPath();
    ctx.arc(32, 12, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 地被身体
  _drawFlatBody(ctx, plantId, visual) {
    ctx.fillStyle = visual.body;
    ctx.beginPath();
    ctx.ellipse(32, 48, 24, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = visual.accent;
    ctx.beginPath();
    ctx.ellipse(32, 48, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 圆形身体（默认）— 缩小并上移，留出空间给可见的茎和叶
  _drawRoundBody(ctx, plantId, visual) {
    // 主体（半径 16，中心 y=22，留出 y=38-56 给茎叶）
    ctx.fillStyle = visual.body;
    ctx.beginPath();
    ctx.arc(32, 22, 16, 0, Math.PI * 2);
    ctx.fill();
    // 高光
    ctx.fillStyle = visual.head;
    ctx.beginPath();
    ctx.arc(27, 17, 8, 0, Math.PI * 2);
    ctx.fill();
    // 底部阴影
    ctx.fillStyle = visual.accent;
    ctx.beginPath();
    ctx.arc(32, 32, 11, 0, Math.PI);
    ctx.fill();
  }

  // 植物专属特征（按 plantId 分发）
  _drawPlantFeature(ctx, plantId, visual, state) {
    switch (plantId) {
      // ===== 豌豆系 =====
      case 'peashooter':
      case 'snow_pea':
      case 'repeater':
      case 'gatling_pea':
        this._drawPeaMouth(ctx, visual, plantId);
        break;
      case 'threepeater':
        // 三头：左中右三个嘴（位置上移配合新身体）
        this._drawPeaMouth(ctx, visual, 'peashooter', 32, 18);
        this._drawPeaMouth(ctx, visual, 'peashooter', 16, 26);
        this._drawPeaMouth(ctx, visual, 'peashooter', 48, 26);
        break;
      case 'split_pea':
        // 前后双头
        this._drawPeaMouth(ctx, visual, 'peashooter', 32, 22);
        // 后头反向嘴
        ctx.fillStyle = visual.accent;
        ctx.fillRect(8, 19, 7, 7);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(11, 22.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      // ===== 向日葵系 =====
      case 'sunflower':
      case 'twin_sunflower':
      case 'marigold':
        // 笑脸（位置随花心上移到 y=22）
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(32, 25, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        break;

      // ===== 防御系 =====
      case 'wall_nut':
      case 'tall_nut':
        // 坚果是 tall 形态，眼睛由 _drawTallBody 位置决定，这里画裂纹
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(24, 20); ctx.lineTo(28, 30); ctx.lineTo(22, 40);
        ctx.moveTo(40, 18); ctx.lineTo(36, 28);
        ctx.stroke();
        // 坚果眼睛（独立画，因为 noEyes 列表包含）
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(26, 26, 5, 0, Math.PI * 2);
        ctx.arc(38, 26, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(27, 26, 2.5, 0, Math.PI * 2);
        ctx.arc(39, 26, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'pumpkin':
        // 南瓜棱纹
        ctx.strokeStyle = '#E65100';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(32 + i * 8, 14);
          ctx.quadraticCurveTo(32 + i * 12, 30, 32 + i * 8, 46);
          ctx.stroke();
        }
        // 顶部茎
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(30, 8, 4, 8);
        break;
      case 'garlic':
        // 蒜瓣
        ctx.strokeStyle = '#9E9E9E';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(32 + i * 6, 16);
          ctx.lineTo(32 + i * 6, 44);
          ctx.stroke();
        }
        // 顶部芽
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(30, 8, 4, 8);
        break;
      case 'flower_pot':
        // 花盆梯形
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.moveTo(18, 20);
        ctx.lineTo(46, 20);
        ctx.lineTo(42, 48);
        ctx.lineTo(22, 48);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(18, 18, 28, 4);
        // 内部土壤
        ctx.fillStyle = '#795548';
        ctx.fillRect(22, 20, 20, 3);
        break;
      case 'lilypad':
        // 荷叶缺口
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(32, 48);
        ctx.lineTo(40, 44);
        ctx.lineTo(46, 48);
        ctx.fill();
        // 放射纹
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(32, 48);
          ctx.lineTo(32 + Math.cos(angle) * 18, 48 + Math.sin(angle) * 6);
          ctx.stroke();
        }
        break;
      case 'umbrella_leaf':
        // 伞叶顶
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.moveTo(16, 36);
        ctx.quadraticCurveTo(32, 8, 48, 36);
        ctx.fill();
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(20, 36);
        ctx.quadraticCurveTo(32, 14, 44, 36);
        ctx.fill();
        break;
      case 'spikeweed':
        // 尖刺
        ctx.fillStyle = '#3E2723';
        for (let i = 0; i < 5; i++) {
          const x = 16 + i * 8;
          ctx.beginPath();
          ctx.moveTo(x, 48);
          ctx.lineTo(x + 2, 36);
          ctx.lineTo(x + 4, 48);
          ctx.fill();
        }
        break;
      case 'spikerock':
        // 金属尖刺
        ctx.fillStyle = '#616161';
        for (let i = 0; i < 5; i++) {
          const x = 16 + i * 8;
          ctx.beginPath();
          ctx.moveTo(x, 48);
          ctx.lineTo(x + 2, 32);
          ctx.lineTo(x + 4, 48);
          ctx.fill();
        }
        // 金属高光
        ctx.fillStyle = '#9E9E9E';
        for (let i = 0; i < 5; i++) {
          const x = 16 + i * 8;
          ctx.fillRect(x + 1, 36, 1, 10);
        }
        break;
      case 'tangle_kelp':
        // 海带丝
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const x = 18 + i * 10;
          ctx.beginPath();
          ctx.moveTo(x, 20);
          ctx.quadraticCurveTo(x + 4, 35, x - 2, 50);
          ctx.stroke();
        }
        break;

      // ===== 投掷系 =====
      case 'cabbage_pult':
        // 投掷臂 + 卷心菜弹丸
        ctx.fillStyle = '#33691E';
        ctx.fillRect(30, 16, 4, 14);
        ctx.fillStyle = '#8BC34A';
        ctx.beginPath();
        ctx.arc(32, 14, 6, 0, Math.PI * 2);
        ctx.fill();
        // 卷心菜纹
        ctx.strokeStyle = '#558B2F';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(32, 14, 4, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'kernel_pult':
        // 玉米投掷臂
        ctx.fillStyle = '#33691E';
        ctx.fillRect(30, 16, 4, 14);
        ctx.fillStyle = '#FFC107';
        ctx.fillRect(28, 10, 8, 8);
        // 玉米粒
        ctx.fillStyle = '#FFD54F';
        ctx.beginPath();
        ctx.arc(30, 12, 1.5, 0, Math.PI * 2);
        ctx.arc(34, 12, 1.5, 0, Math.PI * 2);
        ctx.arc(32, 15, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'melon_pult':
        // 西瓜投掷臂
        ctx.fillStyle = '#33691E';
        ctx.fillRect(30, 16, 4, 14);
        ctx.fillStyle = '#33691E';
        ctx.beginPath();
        ctx.arc(32, 14, 7, 0, Math.PI * 2);
        ctx.fill();
        // 西瓜纹
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 7); ctx.lineTo(32, 21);
        ctx.stroke();
        break;
      case 'winter_melon':
        // 冰西瓜
        ctx.fillStyle = '#33691E';
        ctx.fillRect(30, 16, 4, 14);
        ctx.fillStyle = '#4DD0E1';
        ctx.beginPath();
        ctx.arc(32, 14, 7, 0, Math.PI * 2);
        ctx.fill();
        // 冰晶
        ctx.fillStyle = '#E1F5FE';
        ctx.beginPath();
        ctx.arc(30, 12, 1, 0, Math.PI * 2);
        ctx.arc(34, 14, 1, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'cob_cannon':
        // 大型玉米加农炮
        ctx.fillStyle = '#FFC107';
        ctx.fillRect(8, 24, 40, 22);
        // 玉米粒纹理
        ctx.fillStyle = '#FFD54F';
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 7; col++) {
            ctx.beginPath();
            ctx.arc(12 + col * 6, 28 + row * 6, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // 加农炮管
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(48, 30, 14, 8);
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(62, 34, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      // ===== 爆炸系 =====
      case 'cherry_bomb':
        // 双樱桃（位置上移到 y=22）
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(24, 22, 11, 0, Math.PI * 2);
        ctx.arc(40, 22, 11, 0, Math.PI * 2);
        ctx.fill();
        // 引信（剩余时间越短越亮）
        const fuseRatio = state.fuseTimer !== undefined ? Math.max(0, state.fuseTimer / 1.5) : 1;
        const flashIntensity = (1 - fuseRatio) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 0, ${flashIntensity})`;
        ctx.beginPath();
        ctx.arc(24, 22, 3, 0, Math.PI * 2);
        ctx.arc(40, 22, 3, 0, Math.PI * 2);
        ctx.fill();
        // 茎（连接两樱桃）
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(24, 12);
        ctx.quadraticCurveTo(32, 4, 40, 12);
        ctx.stroke();
        break;
      case 'potato_mine':
        // 顶部红/灰灯
        const isArmed = state.isArmed !== undefined ? state.isArmed : false;
        ctx.fillStyle = isArmed ? '#FF0000' : '#666666';
        ctx.beginPath();
        ctx.arc(32, 16, 5, 0, Math.PI * 2);
        ctx.fill();
        if (isArmed) {
          // 武装时闪烁
          const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 100);
          ctx.fillStyle = `rgba(255, 100, 100, ${pulse})`;
          ctx.beginPath();
          ctx.arc(32, 16, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        // 电线
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 21); ctx.lineTo(26, 30);
        ctx.moveTo(32, 21); ctx.lineTo(38, 30);
        ctx.stroke();
        break;
      case 'jalapeno':
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(28, 8, 8, 10);
        ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(32, 30, 24, 0, Math.PI * 2);
        ctx.fill();
        // 火焰
        const f = 0.6 + 0.4 * Math.sin(Date.now() / 80);
        ctx.fillStyle = `rgba(255, 150, 0, ${f})`;
        ctx.beginPath();
        ctx.moveTo(22, 12); ctx.quadraticCurveTo(24, 4, 28, 12);
        ctx.moveTo(36, 12); ctx.quadraticCurveTo(40, 4, 42, 12);
        ctx.fill();
        break;
      case 'squash':
        // 窝瓜脸（位置上移）
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(32, 26, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        // 顶部小藤
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(30, 6, 4, 6);
        break;

      // ===== 蘑菇系专属（基础蘑菇盖已由 _drawMushroomBody 处理） =====
      case 'puff_shroom':
        // 小尺寸无需额外，70% 缩放视觉感由整体大小决定（这里靠默认）
        break;
      case 'sun_shroom':
        // 顶部阳光圆盘
        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.arc(32, 14, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF176';
        ctx.beginPath();
        ctx.arc(30, 12, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'fume_shroom':
        // 前方喷射孔
        ctx.fillStyle = '#311B92';
        ctx.fillRect(40, 24, 8, 6);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(44, 27, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'doom_shroom':
        // 红色裂纹
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 16); ctx.lineTo(26, 22); ctx.lineTo(22, 28);
        ctx.moveTo(44, 16); ctx.lineTo(38, 22); ctx.lineTo(42, 28);
        ctx.stroke();
        // 顶部蘑菇云
        ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(32, 8, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ice_shroom':
        // 冰晶装饰
        ctx.fillStyle = '#E1F5FE';
        for (let i = 0; i < 4; i++) {
          const x = 18 + i * 8;
          ctx.beginPath();
          ctx.moveTo(x, 12); ctx.lineTo(x + 2, 18);
          ctx.lineTo(x - 2, 18); ctx.closePath();
          ctx.fill();
        }
        break;
      case 'sea_shroom':
        // 水波纹
        ctx.strokeStyle = '#4DD0E1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(32, 50, 14, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(32, 52, 18, 0, Math.PI);
        ctx.stroke();
        break;
      case 'gloom_shroom':
        // 八孔喷射
        ctx.fillStyle = '#311B92';
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const px = 32 + Math.cos(angle) * 18;
          const py = 26 + Math.sin(angle) * 8;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'hypno_shroom':
        // 螺旋纹
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let a = 0; a < 4 * Math.PI; a += 0.2) {
          const r = a * 1.2;
          const x = 32 + Math.cos(a) * r;
          const y = 26 + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      case 'scaredy_shroom':
        // 畏缩时画泪眼
        if (state.isScared) {
          ctx.fillStyle = '#4FC3F7';
          ctx.beginPath();
          ctx.arc(26, 30, 2, 0, Math.PI * 2);
          ctx.arc(38, 30, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'magnet_shroom':
      case 'gold_magnet':
        // U 形磁铁
        ctx.strokeStyle = '#F44336';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(32, 34, 10, 0, Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(22, 30, 6, 8);
        ctx.fillRect(36, 30, 6, 8);
        // 金磁铁颜色
        if (plantId === 'gold_magnet') {
          ctx.strokeStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(32, 34, 10, 0, Math.PI);
          ctx.stroke();
        }
        break;

      // ===== 特殊系 =====
      case 'chomper':
        // 大嘴（位置上移到 y=20）
        ctx.fillStyle = '#4A148C';
        ctx.beginPath();
        ctx.ellipse(32, 20, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // 牙齿
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 5; i++) {
          const x = 20 + i * 6;
          ctx.beginPath();
          ctx.moveTo(x, 18); ctx.lineTo(x + 3, 22); ctx.lineTo(x + 6, 18);
          ctx.fill();
        }
        // 顶部小芽
        ctx.fillStyle = '#7B1FA2';
        ctx.fillRect(30, 6, 4, 8);
        break;
      case 'cactus':
        // 刺
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          const y = 14 + i * 6;
          ctx.beginPath();
          ctx.moveTo(22, y); ctx.lineTo(16, y - 3);
          ctx.moveTo(42, y); ctx.lineTo(48, y - 3);
          ctx.stroke();
        }
        break;
      case 'starfruit':
        // 五角星
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x = 32 + Math.cos(angle) * 18;
          const y = 28 + Math.sin(angle) * 18;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
      case 'torchwood':
        // 火焰
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.moveTo(24, 14); ctx.quadraticCurveTo(32, 2, 40, 14);
        ctx.fill();
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.moveTo(28, 14); ctx.quadraticCurveTo(32, 6, 36, 14);
        ctx.fill();
        break;
      case 'plantern':
        // 顶部灯泡光晕
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(32, 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
        ctx.beginPath();
        ctx.arc(32, 10, 10, 0, Math.PI * 2);
        ctx.fill();
        // 灯泡线
        ctx.strokeStyle = '#9E9E9E';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 16); ctx.lineTo(32, 24);
        ctx.stroke();
        break;
      case 'blover':
        // 三叶草
        ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.ellipse(32 + Math.cos(angle) * 8, 24 + Math.sin(angle) * 8, 6, 10, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'coffee_bean':
        // 中线裂纹
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 28); ctx.quadraticCurveTo(32, 22, 44, 28);
        ctx.stroke();
        break;
      case 'grave_buster':
        // 墓碑形
        ctx.fillStyle = '#616161';
        ctx.fillRect(20, 18, 24, 30);
        ctx.fillRect(24, 14, 16, 6);
        // 嘴
        ctx.fillStyle = '#000';
        ctx.fillRect(28, 30, 8, 4);
        // RIP 文字（简化为线）
        ctx.strokeStyle = '#9E9E9E';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(24, 22); ctx.lineTo(40, 22);
        ctx.stroke();
        break;
      case 'imitater':
        // 问号
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 32, 32);
        break;
      case 'cattail':
        // 猫耳
        ctx.fillStyle = '#009688';
        ctx.beginPath();
        ctx.moveTo(20, 18); ctx.lineTo(24, 8); ctx.lineTo(28, 18);
        ctx.moveTo(36, 18); ctx.lineTo(40, 8); ctx.lineTo(44, 18);
        ctx.fill();
        // 猫脸鼻子和嘴
        ctx.fillStyle = '#FFC107';
        ctx.beginPath();
        ctx.arc(32, 32, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 34); ctx.lineTo(32, 36);
        ctx.moveTo(32, 36); ctx.lineTo(28, 38);
        ctx.moveTo(32, 36); ctx.lineTo(36, 38);
        ctx.stroke();
        break;
      default:
        break;
    }
  }

  // 豌豆嘴绘制（可指定位置）— 默认 cy=22 配合上移的身体
  _drawPeaMouth(ctx, visual, plantId, cx = 32, cy = 22) {
    const accent = visual.accent || '#2E7D32';
    ctx.fillStyle = accent;
    // 嘴位置在头右侧
    const mouthX = cx + 10;
    ctx.fillRect(mouthX, cy - 3, 8, 7);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(mouthX + 6, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // repeater 双嘴
    if (plantId === 'repeater') {
      ctx.fillStyle = accent;
      ctx.fillRect(mouthX, cy + 5, 7, 5);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(mouthX + 5, cy + 7.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // gatling_pea 四嘴
    if (plantId === 'gatling_pea') {
      for (let i = -1; i <= 2; i++) {
        ctx.fillStyle = accent;
        ctx.fillRect(mouthX, cy + i * 5 - 2, 7, 4);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(mouthX + 5, cy + i * 5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // snow_pea 冰晶
    if (plantId === 'snow_pea') {
      ctx.fillStyle = '#E1F5FE';
      ctx.beginPath();
      ctx.arc(mouthX + 10, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ===== 杂交植物多形态渲染 =====
  _drawHybridSprite(ctx, plant) {
    const data = plant.data;
    const level = data.hybridLevel || 2;
    const parents = data.hybridParents || [];
    const subspecies = data.subspecies;

    ctx.save();
    ctx.scale(2, 2);

    // 阴影（杂交稍大）
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(32, 56, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 按等级分发
    switch (level) {
      case 3:
        this._drawTripleHeadHybrid(ctx, parents);
        this._drawTripleHalo(ctx);
        break;
      case 4:
        this._drawQuadHeadHybrid(ctx, parents);
        this._drawQuadHalo(ctx);
        break;
      case 5:
        this._drawPentaHeadHybrid(ctx, parents);
        this._drawPentaHalo(ctx);
        break;
      default: // 2
        this._drawDualHeadHybrid(ctx, parents);
        if (subspecies === 'reinforced') this._drawReinforcedHalo(ctx);
        else if (subspecies === 'supreme') this._drawSupremeHalo(ctx);
        break;
    }

    // 名称 + 血条
    this._drawPlantNameAndHp(ctx, plant);
    this._drawPlantStateOverlay(ctx, plant);
    ctx.restore();
  }

  // 双头杂交：左 A 70% + 右 B 70%
  _drawDualHeadHybrid(ctx, parents) {
    if (parents.length >= 1) {
      ctx.save();
      ctx.translate(-12, 0);
      ctx.scale(0.7, 0.7);
      this._drawSinglePlantBody(ctx, parents[0]);
      ctx.restore();
    }
    if (parents.length >= 2) {
      ctx.save();
      ctx.translate(12, 0);
      ctx.scale(0.7, 0.7);
      this._drawSinglePlantBody(ctx, parents[1]);
      ctx.restore();
    } else if (parents.length === 1) {
      // 单父本时也画第二份，避免单边
      ctx.save();
      ctx.translate(12, 0);
      ctx.scale(0.7, 0.7);
      this._drawSinglePlantBody(ctx, parents[0]);
      ctx.restore();
    }
  }

  // 三头杂交：55% 缩放，并排 3 个
  _drawTripleHeadHybrid(ctx, parents) {
    const positions = [-16, 0, 16];
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(positions[i], 0);
      ctx.scale(0.55, 0.55);
      const pid = parents[i] || parents[0] || 'peashooter';
      this._drawSinglePlantBody(ctx, pid);
      ctx.restore();
    }
  }

  // 四头杂交：45% 缩放，并排 4 个
  _drawQuadHeadHybrid(ctx, parents) {
    const positions = [-20, -7, 7, 20];
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(positions[i], 0);
      ctx.scale(0.45, 0.45);
      const pid = parents[i] || parents[0] || 'peashooter';
      this._drawSinglePlantBody(ctx, pid);
      ctx.restore();
    }
  }

  // 五头杂交：35% 缩放，并排 5 个
  _drawPentaHeadHybrid(ctx, parents) {
    const positions = [-22, -11, 0, 11, 22];
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.translate(positions[i], 0);
      ctx.scale(0.35, 0.35);
      const pid = parents[i] || parents[0] || 'peashooter';
      this._drawSinglePlantBody(ctx, pid);
      ctx.restore();
    }
  }

  // ===== 光环系列 =====
  _drawReinforcedHalo(ctx) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + pulse * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 255, 200, ${0.4 + pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(32, 32, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawSupremeHalo(ctx) {
    this._drawReinforcedHalo(ctx);
    ctx.strokeStyle = 'rgba(156, 39, 176, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(32, 32, 34, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawTripleHalo(ctx) {
    this._drawSupremeHalo(ctx);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(32, 32, 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawQuadHalo(ctx) {
    this._drawTripleHalo(ctx);
    ctx.strokeStyle = 'rgba(244, 67, 54, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(32, 32, 42, 0, Math.PI * 2);
    ctx.stroke();
  }

  _drawPentaHalo(ctx) {
    const colors = ['#F44336', '#FFD700', '#9C27B0', '#00BCD4'];
    for (let i = 0; i < colors.length; i++) {
      ctx.strokeStyle = colors[i];
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 300 + i);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(32, 32, 36 + i * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  _drawZombieSprite(ctx, zombie) {
    const type = zombie.type || 'normal';
    const visual = ZOMBIE_VISUALS[type] || ZOMBIE_VISUALS.normal;

    // 放大僵尸绘制：将 0-64 坐标系放大到 0-112，填满 128 画布
    ctx.save();
    ctx.translate(8, 8);  // 居中偏移
    ctx.scale(1.75, 1.75);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(32, 56, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // === SPECIAL CASES: Gargantuar (larger), Imp (smaller), Boss (larger) ===
    if (type === 'gargantuar') {
      this._drawGargantuar(ctx, visual, zombie);
    } else if (type === 'imp') {
      this._drawImp(ctx, visual, zombie);
    } else if (type === 'boss') {
      this._drawBoss(ctx, visual, zombie);
    } else {
      // === STANDARD ZOMBIE BODY ===
      // Body with slight hunch for normal zombie
      const bodyOffsetY = type === 'normal' ? 2 : 0;
      ctx.fillStyle = visual.body;
      ctx.fillRect(22, 32 + bodyOffsetY, 20, 24);

      // Tattered clothing for normal zombie
      if (type === 'normal') {
        ctx.fillStyle = visual.clothes || '#4E342E';
        ctx.fillRect(22, 32 + bodyOffsetY, 20, 12);
        // Torn edges
        ctx.fillStyle = visual.body;
        ctx.beginPath();
        ctx.moveTo(22, 44 + bodyOffsetY);
        ctx.lineTo(26, 42 + bodyOffsetY);
        ctx.lineTo(30, 45 + bodyOffsetY);
        ctx.lineTo(34, 41 + bodyOffsetY);
        ctx.lineTo(38, 44 + bodyOffsetY);
        ctx.lineTo(42, 42 + bodyOffsetY);
        ctx.lineTo(42, 46 + bodyOffsetY);
        ctx.lineTo(22, 46 + bodyOffsetY);
        ctx.fill();
      }

      // Head
      ctx.fillStyle = visual.head;
      ctx.beginPath();
      ctx.arc(32, 24, 16, 0, Math.PI * 2);
      ctx.fill();

      // Eyes (red glowing)
      ctx.fillStyle = visual.eye;
      ctx.beginPath();
      ctx.arc(26, 22, 4, 0, Math.PI * 2);
      ctx.arc(38, 22, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(27, 22, 1.5, 0, Math.PI * 2);
      ctx.arc(39, 22, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Arms
      ctx.fillStyle = visual.body;
      ctx.fillRect(14, 34, 8, 18);
      ctx.fillRect(42, 34, 8, 18);

      // === TYPE-SPECIFIC ACCESSORIES ===

      // CONE ZOMBIE - Traffic cone on head
      if (type === 'cone') {
        // Cone body
        ctx.fillStyle = visual.cone || '#FF6F00';
        ctx.beginPath();
        ctx.moveTo(24, 16);
        ctx.lineTo(32, 0);
        ctx.lineTo(40, 16);
        ctx.closePath();
        ctx.fill();
        // Cone stripes
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(26, 8, 12, 3);
        ctx.fillRect(28, 4, 8, 2);
        // Cone base
        ctx.fillStyle = '#E65100';
        ctx.fillRect(22, 14, 20, 4);
      }

      // BUCKET ZOMBIE - Metal bucket with handle
      else if (type === 'bucket') {
        // Bucket body
        ctx.fillStyle = visual.bucket || '#78909C';
        ctx.fillRect(20, 8, 24, 16);
        // Bucket darker interior
        ctx.fillStyle = '#546E7A';
        ctx.fillRect(22, 10, 20, 12);
        // Bucket rim
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(18, 6, 28, 4);
        // Handle
        ctx.strokeStyle = '#455A64';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(32, 6, 10, Math.PI, 0);
        ctx.stroke();
        // Handle attachment points
        ctx.fillStyle = '#37474F';
        ctx.beginPath();
        ctx.arc(22, 8, 2, 0, Math.PI * 2);
        ctx.arc(42, 8, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // FLAG ZOMBIE - Flag on stick
      else if (type === 'flag') {
        // Flag pole in right hand
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(48, 20, 3, 36);
        // Flag
        ctx.fillStyle = visual.flag || '#D32F2F';
        ctx.beginPath();
        ctx.moveTo(51, 20);
        ctx.lineTo(62, 24);
        ctx.lineTo(51, 32);
        ctx.closePath();
        ctx.fill();
        // Flag wave detail
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.moveTo(51, 26);
        ctx.lineTo(58, 28);
        ctx.lineTo(51, 30);
        ctx.closePath();
        ctx.fill();
      }

      // FOOTBALL ZOMBIE - Helmet with face guard
      else if (type === 'football') {
        // Helmet
        ctx.fillStyle = visual.helmet || '#C62828';
        ctx.beginPath();
        ctx.arc(32, 18, 16, Math.PI, 0);
        ctx.fill();
        // Helmet top
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.arc(32, 14, 14, Math.PI, 0);
        ctx.fill();
        // Face guard bars
        ctx.strokeStyle = '#9E9E9E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 24);
        ctx.lineTo(44, 24);
        ctx.moveTo(22, 28);
        ctx.lineTo(42, 28);
        ctx.moveTo(24, 32);
        ctx.lineTo(40, 32);
        ctx.stroke();
        // Face guard vertical bars
        ctx.beginPath();
        ctx.moveTo(26, 22);
        ctx.lineTo(26, 32);
        ctx.moveTo(38, 22);
        ctx.lineTo(38, 32);
        ctx.stroke();
      }

      // NEWSPAPER ZOMBIE - Newspaper in hand
      else if (type === 'newspaper') {
        // Newspaper
        ctx.fillStyle = visual.paper || '#ECEFF1';
        ctx.fillRect(44, 36, 16, 14);
        // Newspaper text lines
        ctx.fillStyle = '#90A4AE';
        ctx.fillRect(46, 38, 12, 1);
        ctx.fillRect(46, 41, 10, 1);
        ctx.fillRect(46, 44, 12, 1);
        ctx.fillRect(46, 47, 8, 1);
        // Angry face when enraged (low health)
        if (zombie.hp !== undefined && zombie.maxHp !== undefined && zombie.hp < zombie.maxHp * 0.5) {
          ctx.strokeStyle = '#D32F2F';
          ctx.lineWidth = 2;
          // Angry eyebrows
          ctx.beginPath();
          ctx.moveTo(22, 18);
          ctx.lineTo(28, 20);
          ctx.moveTo(42, 18);
          ctx.lineTo(36, 20);
          ctx.stroke();
        }
      }

      // SCREEN ZOMBIE - TV/Computer screen on head
      else if (type === 'screen') {
        // Screen frame
        ctx.fillStyle = visual.screen || '#37474F';
        ctx.fillRect(18, 8, 28, 20);
        // Screen display
        ctx.fillStyle = '#4FC3F7';
        ctx.fillRect(20, 10, 24, 16);
        // Static effect
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(22 + Math.random() * 18, 12 + Math.random() * 12, 4, 1);
        }
        // Antenna
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(32, 8);
        ctx.lineTo(32, 2);
        ctx.stroke();
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.arc(32, 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // POLE ZOMBIE - Vaulting pole
      else if (type === 'pole') {
        // Pole
        ctx.fillStyle = visual.pole || '#6D4C41';
        ctx.fillRect(8, 10, 4, 50);
        // Pole grip
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(7, 30, 6, 8);
        // Pole tip
        ctx.fillStyle = '#9E9E9E';
        ctx.beginPath();
        ctx.moveTo(8, 10);
        ctx.lineTo(10, 4);
        ctx.lineTo(12, 10);
        ctx.closePath();
        ctx.fill();
      }

      // DIVER ZOMBIE - Diving goggles and swim trunks
      else if (type === 'diver') {
        // Goggles
        ctx.fillStyle = visual.goggles || '#1976D2';
        ctx.beginPath();
        ctx.arc(26, 22, 6, 0, Math.PI * 2);
        ctx.arc(38, 22, 6, 0, Math.PI * 2);
        ctx.fill();
        // Goggle lenses
        ctx.fillStyle = '#B3E5FC';
        ctx.beginPath();
        ctx.arc(26, 22, 4, 0, Math.PI * 2);
        ctx.arc(38, 22, 4, 0, Math.PI * 2);
        ctx.fill();
        // Goggle strap
        ctx.strokeStyle = '#0D47A1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 22);
        ctx.lineTo(16, 22);
        ctx.moveTo(44, 22);
        ctx.lineTo(48, 22);
        ctx.stroke();
        // Swim trunks
        ctx.fillStyle = '#1976D2';
        ctx.fillRect(22, 48, 20, 8);
        ctx.fillStyle = '#0D47A1';
        ctx.fillRect(22, 48, 20, 2);
      }

      // DANCER ZOMBIE - Disco ball accessory, colorful
      else if (type === 'dancer') {
        // Disco ball above head
        ctx.fillStyle = '#9E9E9E';
        ctx.beginPath();
        ctx.arc(32, 4, 6, 0, Math.PI * 2);
        ctx.fill();
        // Disco ball facets
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(29, 2, 2, 2);
        ctx.fillRect(33, 2, 2, 2);
        ctx.fillRect(31, 5, 2, 2);
        // Sparkles
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(24, 6, 1.5, 0, Math.PI * 2);
        ctx.arc(40, 8, 1.5, 0, Math.PI * 2);
        ctx.arc(28, 10, 1, 0, Math.PI * 2);
        ctx.fill();
        // Colorful outfit
        ctx.fillStyle = '#E91E63';
        ctx.fillRect(22, 32, 20, 12);
        ctx.fillStyle = '#9C27B0';
        ctx.fillRect(22, 44, 20, 12);
      }

      // BACKUP DANCER - Similar to dancer but purple
      else if (type === 'backup') {
        // Purple outfit
        ctx.fillStyle = visual.outfit || '#9C27B0';
        ctx.fillRect(22, 32, 20, 24);
        // Hair accessory
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.arc(32, 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // BALLOON ZOMBIE - Balloon floating above
      else if (type === 'balloon') {
        // Balloon string
        ctx.strokeStyle = '#757575';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 8);
        ctx.lineTo(32, 20);
        ctx.stroke();
        // Balloon
        ctx.fillStyle = visual.balloon || '#F44336';
        ctx.beginPath();
        ctx.arc(32, 4, 8, 0, Math.PI * 2);
        ctx.fill();
        // Balloon highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(29, 2, 3, 0, Math.PI * 2);
        ctx.fill();
        // Balloon knot
        ctx.fillStyle = '#B71C1C';
        ctx.beginPath();
        ctx.moveTo(30, 12);
        ctx.lineTo(32, 14);
        ctx.lineTo(34, 12);
        ctx.closePath();
        ctx.fill();
      }

      // POGO ZOMBIE - Pogo stick
      else if (type === 'pogo') {
        // Pogo stick pole
        ctx.fillStyle = visual.pogo || '#455A64';
        ctx.fillRect(30, 40, 4, 20);
        // Pogo stick handle
        ctx.fillStyle = '#263238';
        ctx.fillRect(26, 38, 12, 4);
        // Pogo stick base/spring
        ctx.fillStyle = '#78909C';
        ctx.fillRect(28, 56, 8, 4);
        // Spring coils
        ctx.strokeStyle = '#546E7A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(28, 48);
        ctx.lineTo(36, 50);
        ctx.moveTo(28, 52);
        ctx.lineTo(36, 54);
        ctx.stroke();
      }

      // YETI ZOMBIE - White fur, icicles
      else if (type === 'yeti') {
        // Fur texture on body
        ctx.fillStyle = visual.fur || '#CFD8DC';
        ctx.fillRect(22, 32, 20, 24);
        // Fur tufts
        ctx.fillStyle = '#ECEFF1';
        ctx.beginPath();
        ctx.moveTo(22, 32);
        ctx.lineTo(24, 30);
        ctx.lineTo(26, 32);
        ctx.lineTo(28, 30);
        ctx.lineTo(30, 32);
        ctx.lineTo(32, 30);
        ctx.lineTo(34, 32);
        ctx.lineTo(36, 30);
        ctx.lineTo(38, 32);
        ctx.lineTo(40, 30);
        ctx.lineTo(42, 32);
        ctx.fill();
        // Icicles hanging from head
        ctx.fillStyle = '#B3E5FC';
        ctx.beginPath();
        ctx.moveTo(24, 36);
        ctx.lineTo(26, 42);
        ctx.lineTo(28, 36);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(36, 36);
        ctx.lineTo(38, 44);
        ctx.lineTo(40, 36);
        ctx.fill();
      }

      // BUNGEE ZOMBIE - Rope/bungee cord
      else if (type === 'bungee') {
        // Bungee rope going up
        ctx.strokeStyle = visual.rope || '#212121';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(32, 8);
        ctx.lineTo(32, 0);
        ctx.stroke();
        // Rope texture
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, 2);
        ctx.lineTo(34, 4);
        ctx.moveTo(30, 6);
        ctx.lineTo(34, 8);
        ctx.stroke();
        // Hook at top
        ctx.strokeStyle = '#9E9E9E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(32, 0, 3, Math.PI, 0);
        ctx.stroke();
      }

      // LADDER ZOMBIE - Carrying ladder
      else if (type === 'ladder') {
        // Ladder side rails
        ctx.fillStyle = visual.ladder || '#8D6E63';
        ctx.fillRect(46, 20, 3, 40);
        ctx.fillRect(56, 20, 3, 40);
        // Ladder rungs
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(46, 28, 13, 2);
        ctx.fillRect(46, 36, 13, 2);
        ctx.fillRect(46, 44, 13, 2);
        ctx.fillRect(46, 52, 13, 2);
      }

      // CATAPULT ZOMBIE - Machine body
      else if (type === 'catapult') {
        // Vehicle body
        ctx.fillStyle = visual.machine || '#616161';
        ctx.fillRect(16, 40, 32, 16);
        // Wheels
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.arc(22, 56, 5, 0, Math.PI * 2);
        ctx.arc(42, 56, 5, 0, Math.PI * 2);
        ctx.fill();
        // Catapult arm
        ctx.fillStyle = '#795548';
        ctx.fillRect(40, 30, 4, 16);
        ctx.fillRect(36, 28, 12, 4);
        // Basket
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(48, 28, 4, 0, Math.PI);
        ctx.fill();
      }
    }

    // Elite/Boss indicators
    if (zombie.isBoss) {
      ctx.fillStyle = '#FF0000';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', 32, 12);
    } else if (zombie.isElite) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('★', 32, 10);
    }

    // 恢复放大变换，血条/护甲条在原始坐标系绘制以保持清晰
    ctx.restore();

    // Slow/frozen indicator (全画布覆盖)
    if (zombie.slowed) {
      ctx.fillStyle = 'rgba(0, 188, 212, 0.3)';
      ctx.fillRect(0, 0, 128, 128);
    }
    if (zombie.frozen) {
      ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
      ctx.fillRect(0, 0, 128, 128);
    }

    // 护甲/护盾血条（灰色护甲 / 青色护盾，显示在生命条上方）
    const barWidth = 80;
    const barHeight = 6;
    const barX = (128 - barWidth) / 2;
    let barY = 6;

    if (zombie.armorHp !== undefined && zombie.armorMaxHp !== undefined && zombie.armorMaxHp > 0) {
      this._drawShieldBar(ctx, zombie.armorHp, zombie.armorMaxHp, barX, barY, barWidth, barHeight, '#9E9E9E');
      barY += barHeight + 2;
    }
    if (zombie.shieldHp !== undefined && zombie.shieldMaxHp !== undefined && zombie.shieldMaxHp > 0) {
      this._drawShieldBar(ctx, zombie.shieldHp, zombie.shieldMaxHp, barX, barY, barWidth, barHeight, '#00BCD4');
      barY += barHeight + 2;
    }

    // 生命条
    if (zombie.hp !== undefined && zombie.maxHp !== undefined) {
      this._drawHealthBar(ctx, zombie.hp, zombie.maxHp, barX, barY, barWidth, barHeight);
    }
  }

  // === GARGANTUAR - Much larger, telephone pole weapon, imp on back ===
  _drawGargantuar(ctx, visual, zombie) {
    // Larger shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(32, 58, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Massive body
    ctx.fillStyle = visual.body;
    ctx.fillRect(14, 28, 36, 32);

    // Head (smaller relative to body)
    ctx.fillStyle = visual.head;
    ctx.beginPath();
    ctx.arc(32, 20, 14, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyes
    ctx.fillStyle = visual.eye;
    ctx.beginPath();
    ctx.arc(26, 18, 5, 0, Math.PI * 2);
    ctx.arc(38, 18, 5, 0, Math.PI * 2);
    ctx.fill();

    // Thick arms
    ctx.fillStyle = visual.body;
    ctx.fillRect(6, 30, 10, 24);
    ctx.fillRect(48, 30, 10, 24);

    // Telephone pole weapon in right hand
    ctx.fillStyle = visual.weapon || '#5D4037';
    ctx.fillRect(52, 10, 6, 50);
    // Wood grain
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(53, 20);
    ctx.lineTo(57, 22);
    ctx.moveTo(53, 35);
    ctx.lineTo(57, 37);
    ctx.moveTo(53, 50);
    ctx.lineTo(57, 52);
    ctx.stroke();

    // Imp on back (small green figure)
    ctx.fillStyle = '#7CB342';
    ctx.beginPath();
    ctx.arc(32, 28, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#558B2F';
    ctx.fillRect(28, 34, 8, 8);
    // Imp eyes
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(30, 26, 1.5, 0, Math.PI * 2);
    ctx.arc(34, 26, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // === IMP - Small size, green skin ===
  _drawImp(ctx, visual, zombie) {
    // Small shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(32, 54, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Small body
    ctx.fillStyle = visual.body;
    ctx.fillRect(26, 40, 12, 14);

    // Head (green)
    ctx.fillStyle = visual.head;
    ctx.beginPath();
    ctx.arc(32, 34, 10, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = visual.eye;
    ctx.beginPath();
    ctx.arc(28, 32, 3, 0, Math.PI * 2);
    ctx.arc(36, 32, 3, 0, Math.PI * 2);
    ctx.fill();

    // Small arms
    ctx.fillStyle = visual.body;
    ctx.fillRect(20, 42, 6, 10);
    ctx.fillRect(38, 42, 6, 10);

    // Angry mouth
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(32, 38, 4, 0, Math.PI);
    ctx.stroke();
  }

  // === BOSS - Crown, larger size, armor details ===
  _drawBoss(ctx, visual, zombie) {
    // Large shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(32, 60, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Massive armored body
    ctx.fillStyle = visual.armor || '#424242';
    ctx.fillRect(12, 26, 40, 34);

    // Armor plates
    ctx.fillStyle = visual.body;
    ctx.fillRect(14, 28, 36, 10);
    ctx.fillRect(14, 42, 36, 10);

    // Armor rivets
    ctx.fillStyle = '#757575';
    ctx.beginPath();
    ctx.arc(18, 33, 2, 0, Math.PI * 2);
    ctx.arc(46, 33, 2, 0, Math.PI * 2);
    ctx.arc(18, 47, 2, 0, Math.PI * 2);
    ctx.arc(46, 47, 2, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = visual.head;
    ctx.beginPath();
    ctx.arc(32, 18, 16, 0, Math.PI * 2);
    ctx.fill();

    // Crown
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(18, 12);
    ctx.lineTo(22, 4);
    ctx.lineTo(26, 10);
    ctx.lineTo(30, 2);
    ctx.lineTo(34, 10);
    ctx.lineTo(38, 4);
    ctx.lineTo(42, 10);
    ctx.lineTo(46, 4);
    ctx.lineTo(46, 12);
    ctx.closePath();
    ctx.fill();

    // Crown jewels
    ctx.fillStyle = '#E91E63';
    ctx.beginPath();
    ctx.arc(24, 8, 2, 0, Math.PI * 2);
    ctx.arc(32, 6, 2, 0, Math.PI * 2);
    ctx.arc(40, 8, 2, 0, Math.PI * 2);
    ctx.fill();

    // Glowing red eyes
    ctx.fillStyle = visual.eye;
    ctx.beginPath();
    ctx.arc(24, 18, 5, 0, Math.PI * 2);
    ctx.arc(40, 18, 5, 0, Math.PI * 2);
    ctx.fill();

    // Eye glow effect
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(24, 18, 7, 0, Math.PI * 2);
    ctx.arc(40, 18, 7, 0, Math.PI * 2);
    ctx.fill();

    // Heavy arms with armor
    ctx.fillStyle = visual.armor || '#424242';
    ctx.fillRect(4, 28, 10, 26);
    ctx.fillRect(50, 28, 10, 26);

    // Armor shoulder pads
    ctx.fillStyle = '#616161';
    ctx.beginPath();
    ctx.arc(9, 30, 6, 0, Math.PI * 2);
    ctx.arc(55, 30, 6, 0, Math.PI * 2);
    ctx.fill();

    // BOSS label
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', 32, 64);
  }

  _drawHealthBar(ctx, currentHp, maxHp, x, y, barWidth, barHeight) {
    // 兼容旧调用：若未传 x/y/barWidth/barHeight，使用默认值
    if (x === undefined) { barWidth = 50; barHeight = 6; x = (64 - barWidth) / 2; y = 4; }
    else if (barWidth === undefined) { barWidth = 50; barHeight = 6; }
    const hpPercent = Math.max(0, currentHp / maxHp);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

    // Bar color
    let color;
    if (hpPercent > 0.6) {
      color = '#4CAF50';
    } else if (hpPercent > 0.3) {
      color = '#FFC107';
    } else {
      color = '#F44336';
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  // 护盾/护甲条：灰色(护甲)或青色(护盾)，显示在生命条上方
  _drawShieldBar(ctx, currentHp, maxHp, x, y, barWidth, barHeight, color) {
    const hpPercent = Math.max(0, currentHp / maxHp);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

    // Bar
    ctx.fillStyle = color;
    ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  _drawSunSprite(ctx, sun) {
    // 阳光按数值区分大小：25=小, 50=中, 100=大, 150+=特大
    const amount = sun.amount !== undefined ? sun.amount : (sun.value || 25);
    let bodyRadius, glowRadius, rayOuter, rayCount, rayWidth;
    if (amount >= 150) {
      bodyRadius = 50; glowRadius = 62; rayOuter = 58; rayCount = 16; rayWidth = 6;
    } else if (amount >= 75) {
      bodyRadius = 42; glowRadius = 54; rayOuter = 50; rayCount = 14; rayWidth = 5;
    } else if (amount >= 50) {
      bodyRadius = 36; glowRadius = 48; rayOuter = 44; rayCount = 12; rayWidth = 4;
    } else {
      bodyRadius = 28; glowRadius = 40; rayOuter = 36; rayCount = 10; rayWidth = 3;
    }

    const cx = 64;
    const cy = 64;
    const rayInner = bodyRadius;

    // 外层光晕
    const gradient = ctx.createRadialGradient(cx, cy, bodyRadius * 0.4, cx, cy, glowRadius);
    gradient.addColorStop(0, 'rgba(255, 235, 59, 0.95)');
    gradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.45)');
    gradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 阳光本体
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
    ctx.fill();

    // 边缘描边
    ctx.strokeStyle = '#FFA000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, bodyRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 光芒射线
    ctx.strokeStyle = '#FFA000';
    ctx.lineWidth = rayWidth;
    ctx.lineCap = 'round';
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * rayInner, cy + Math.sin(angle) * rayInner);
      ctx.lineTo(cx + Math.cos(angle) * rayOuter, cy + Math.sin(angle) * rayOuter);
      ctx.stroke();
    }

    // 内部高光
    ctx.fillStyle = '#FFF9C4';
    ctx.beginPath();
    ctx.arc(cx - bodyRadius * 0.3, cy - bodyRadius * 0.3, bodyRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawProjectileSprite(ctx, proj) {
    const colorMap = {
      pea: '#4CAF50',
      ice: '#00BCD4',
      fire: '#FF5722',
      poison: '#689F38',
      spike: '#795548',
      catapult: '#8BC34A'
    };

    const color = colorMap[proj.type] || '#4CAF50';

    // Glow
    ctx.fillStyle = color.replace(')', ', 0.3)').replace('rgb', 'rgba');
    ctx.beginPath();
    ctx.arc(32, 32, 16, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(32, 32, 10, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(29, 29, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  update(deltaTime) {
    const now = performance.now() / 1000;

    // Update sprite positions
    for (const [entity, sprite] of this.entitySprites) {
      if (entity.data) {
        // 植物：基础位置 + 轻微摇摆动画
        const worldX = GRID_OFFSET_X + entity.col * CELL_SIZE + CELL_SIZE / 2;
        const baseY = 720 - (GRID_OFFSET_Y + entity.row * CELL_SIZE + CELL_SIZE / 2);

        // 每个植物用不同相位，避免同步摇摆
        const phaseOffset = (entity.col * 7 + entity.row * 13) * 0.5;
        const swayY = Math.sin(now * 1.5 + phaseOffset) * 1.5;  // 上下浮动 ±1.5px
        const swayX = Math.sin(now * 1.2 + phaseOffset) * 0.8;  // 左右轻微摇摆 ±0.8px

        // 窝瓜状态动画覆盖（jumping 时向上偏移）
        let extraY = 0;
        if (entity.id === 'squash' && entity.state) {
          if (entity.state === 'jumping') {
            const progress = 1 - (entity.stateTimer / 0.35);
            extraY = -Math.sin(progress * Math.PI) * 30;
          } else if (entity.state === 'squashed') {
            // 压扁：缩小纵向尺寸
            sprite.scale.set(CELL_SIZE, CELL_SIZE * 0.4, 1);
          } else {
            sprite.scale.set(CELL_SIZE, CELL_SIZE, 1);
          }
        }

        sprite.position.set(worldX + swayX, baseY + swayY + extraY, 1);
      } else if (entity.x !== undefined && entity.row !== undefined && !entity.data) {
        // 僵尸等：按 x 和 row 定位
        const worldX = entity.x;
        const worldY = 720 - (GRID_OFFSET_Y + entity.row * CELL_SIZE + CELL_SIZE / 2);
        sprite.position.set(worldX, worldY, 1);
      } else if (entity.value !== undefined && entity.x !== undefined && entity.y !== undefined) {
        // 阳光
        sprite.position.set(entity.x, 720 - entity.y, 1);
      }
    }

    this.webglRenderer.render(this.scene, this.camera);
  }

  resize(width, height) {
    const aspect = 1000 / 720;
    let newWidth = width;
    let newHeight = height;

    if (width / height > aspect) {
      newWidth = height * aspect;
    } else {
      newHeight = width / aspect;
    }

    this.webglRenderer.setSize(newWidth, newHeight);
  }

  getScene() { return this.scene; }
  getCamera() { return this.camera; }

  addExplosionEffect(x, y, type, param) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (type === 'row') {
      ctx.fillStyle = 'rgba(255, 87, 34, 0.8)';
      ctx.fillRect(0, 40, 128, 48);
      ctx.fillStyle = 'rgba(255, 193, 7, 0.6)';
      ctx.fillRect(0, 50, 128, 28);
    } else {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 193, 7, 0.9)');
      gradient.addColorStop(0.6, 'rgba(255, 87, 34, 0.7)');
      gradient.addColorStop(1, 'rgba(244, 67, 54, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });
    const sprite = new THREE.Sprite(spriteMaterial);

    let worldX, worldY;
    if (type === 'row') {
      worldX = GRID_OFFSET_X + GRID_COLS * CELL_SIZE / 2;
      worldY = 720 - (GRID_OFFSET_Y + param * CELL_SIZE + CELL_SIZE / 2);
      sprite.scale.set(GRID_COLS * CELL_SIZE, CELL_SIZE, 1);
    } else {
      worldX = x;
      worldY = 720 - y;
      const size = param * CELL_SIZE * 2;
      sprite.scale.set(size, size, 1);
    }

    sprite.position.set(worldX, worldY, 10);
    this.scene.add(sprite);

    const fadeDuration = 500;
    const startTime = Date.now();
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / fadeDuration;
      if (progress >= 1) {
        clearInterval(fadeInterval);
        this.scene.remove(sprite);
        spriteMaterial.map.dispose();
        spriteMaterial.dispose();
      } else {
        spriteMaterial.opacity = 1 - progress;
      }
    }, 50);
  }

  showPlacementFeedback(screenX, screenY, message, color) {
    // Create a floating text sprite at the click position
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.font = 'bold 24px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(120, 30, 1);
    sprite.position.set(screenX, 720 - screenY, 20);

    this.scene.add(sprite);

    // Animate: float up and fade out
    const duration = 1500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(sprite);
        spriteMaterial.dispose();
        texture.dispose();
        return;
      }

      sprite.position.y += 0.5;
      spriteMaterial.opacity = 1 - progress;

      requestAnimationFrame(animate);
    };
    animate();
  }

  updateHoverHighlight(row, col, isValid, selectedPlant) {
    if (this.hoverHighlight) {
      this.scene.remove(this.hoverHighlight);
      this.hoverHighlight.material.dispose();
      this.hoverHighlight = null;
    }

    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS || !selectedPlant) {
      return;
    }

    const geometry = new THREE.PlaneGeometry(CELL_SIZE - 2, CELL_SIZE - 2);
    const material = new THREE.MeshBasicMaterial({
      color: isValid ? 0x81C784 : 0xEF5350,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    const worldX = GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
    const worldY = 720 - (GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2);
    mesh.position.set(worldX, worldY, 0.5);

    this.scene.add(mesh);
    this.hoverHighlight = mesh;
  }

  showWaveWarning(waveNumber) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(139, 0, 0, 0.85)';
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 508, 124);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${waveNumber} 波来袭!`, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(400, 100, 1);
    sprite.position.set(500, 360, 20);

    this.scene.add(sprite);

    const fadeDuration = 2000;
    const startTime = Date.now();
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / fadeDuration;
      if (progress >= 1) {
        clearInterval(fadeInterval);
        this.scene.remove(sprite);
        spriteMaterial.map.dispose();
        spriteMaterial.dispose();
      } else {
        spriteMaterial.opacity = 1 - progress;
      }
    }, 50);
  }

  addLawnMowerSprite(mower) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Mower body
    ctx.fillStyle = '#F44336';
    ctx.fillRect(10, 20, 44, 28);
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(12, 22, 40, 24);

    // Wheels
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(18, 50, 8, 0, Math.PI * 2);
    ctx.arc(46, 50, 8, 0, Math.PI * 2);
    ctx.fill();

    // Blade
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(8, 16, 48, 6);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(50, 50, 1);

    const worldY = 720 - (GRID_OFFSET_Y + mower.row * CELL_SIZE + CELL_SIZE / 2);
    sprite.position.set(mower.x, worldY, 2);

    this.scene.add(sprite);
    this.lawnMowerSprites.push({ sprite, mower, material: spriteMaterial });
    mower.sprite = sprite;
  }

  updateLawnMowers() {
    for (const item of this.lawnMowerSprites) {
      if (item.mower.active) {
        item.sprite.position.x = item.mower.x;
      }
    }
  }

  clearLawnMowers() {
    for (const item of this.lawnMowerSprites) {
      this.scene.remove(item.sprite);
      item.material.map.dispose();
      item.material.dispose();
    }
    this.lawnMowerSprites = [];
  }

  // ─ Sun Collection Animation ──────────────────────────────────
  addSunCollectAnimation(sunX, sunY, targetX, targetY, value) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Draw sun icon
    const gradient = ctx.createRadialGradient(32, 32, 8, 32, 32, 28);
    gradient.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(32, 32, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+' + value, 32, 33);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(60, 60, 1);
    sprite.position.set(sunX, 720 - sunY, 15);

    this.scene.add(sprite);

    const duration = 600;
    const startTime = Date.now();
    const anim = {
      sprite,
      material: spriteMaterial,
      startX: sunX,
      startY: 720 - sunY,
      endX: targetX,
      endY: 720 - targetY,
      startTime,
      duration
    };

    this._sunAnimations.push(anim);
  }

  updateSunAnimations() {
    const now = Date.now();
    for (let i = this._sunAnimations.length - 1; i >= 0; i--) {
      const anim = this._sunAnimations[i];
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      // Move towards target
      anim.sprite.position.x = anim.startX + (anim.endX - anim.startX) * ease;
      anim.sprite.position.y = anim.startY + (anim.endY - anim.startY) * ease;

      // Scale down and fade out
      const scale = 1 - progress * 0.5;
      anim.sprite.scale.set(60 * scale, 60 * scale, 1);
      anim.material.opacity = 1 - progress;

      if (progress >= 1) {
        this.scene.remove(anim.sprite);
        anim.material.map.dispose();
        anim.material.dispose();
        this._sunAnimations.splice(i, 1);
      }
    }
  }

  // ── Wave Progress Bar ────────────────────────────────────────
  buildWaveProgressBar(totalWaves) {
    // Remove existing bar
    if (this._waveProgressBar) {
      this.scene.remove(this._waveProgressBar.sprite);
      this._waveProgressBar.material.map.dispose();
      this._waveProgressBar.material.dispose();
    }

    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 200, 20);

    // Border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 198, 18);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(200, 20, 1);
    sprite.position.set(500, 690, 15);

    this.scene.add(sprite);

    this._waveProgressBar = {
      sprite,
      material: spriteMaterial,
      texture,
      ctx,
      canvas,
      totalWaves
    };
  }

  updateWaveProgressBar(currentWave) {
    if (!this._waveProgressBar) return;

    const { ctx, canvas, texture, totalWaves } = this._waveProgressBar;

    // Clear
    ctx.clearRect(0, 0, 200, 20);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 200, 20);

    // Progress fill
    const progress = currentWave / totalWaves;
    const fillWidth = 196 * progress;

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, fillWidth, 0);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(0.5, '#8BC34A');
    gradient.addColorStop(1, '#CDDC39');
    ctx.fillStyle = gradient;
    ctx.fillRect(2, 2, fillWidth, 16);

    // Wave markers
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${currentWave}/${totalWaves}`, 100, 10);

    // Border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 198, 18);

    texture.needsUpdate = true;
  }

  clearWaveProgressBar() {
    if (this._waveProgressBar) {
      this.scene.remove(this._waveProgressBar.sprite);
      this._waveProgressBar.material.map.dispose();
      this._waveProgressBar.material.dispose();
      this._waveProgressBar = null;
    }
  }

  showDamageNumber(x, y, damage, color = '#FFD700') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`-${damage}`, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(60, 30, 1);
    sprite.position.set(x, 720 - y, 15);
    this.scene.add(sprite);

    const duration = 1000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(sprite);
        material.dispose();
        texture.dispose();
        return;
      }

      sprite.position.y += 1;
      material.opacity = 1 - progress;

      requestAnimationFrame(animate);
    };
    animate();
  }

  addHitSpark(x, y) {
    const particleCount = 8;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(8, 8, 8, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(10, 10, 1);
      sprite.position.set(x, 720 - y, 12);

      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.scene.add(sprite);
      particles.push({ sprite, material, texture, vx, vy, life: 0 });
    }

    const duration = 500;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        particles.forEach(p => {
          this.scene.remove(p.sprite);
          p.material.dispose();
          p.texture.dispose();
        });
        return;
      }

      particles.forEach(p => {
        p.sprite.position.x += p.vx;
        p.sprite.position.y += p.vy;
        p.material.opacity = 1 - progress;
      });

      requestAnimationFrame(animate);
    };
    animate();
  }

  addDeathExplosion(x, y) {
    const particleCount = 12;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createRadialGradient(12, 12, 0, 12, 12, 12);
      gradient.addColorStop(0, 'rgba(139, 69, 19, 1)');
      gradient.addColorStop(0.5, 'rgba(101, 67, 33, 0.8)');
      gradient.addColorStop(1, 'rgba(60, 40, 20, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(12, 12, 12, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(15, 15, 1);
      sprite.position.set(x, 720 - y, 10);

      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 1.5 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.scene.add(sprite);
      particles.push({ sprite, material, texture, vx, vy });
    }

    const duration = 800;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        particles.forEach(p => {
          this.scene.remove(p.sprite);
          p.material.dispose();
          p.texture.dispose();
        });
        return;
      }

      particles.forEach(p => {
        p.sprite.position.x += p.vx;
        p.sprite.position.y += p.vy;
        p.material.opacity = 1 - progress;
      });

      requestAnimationFrame(animate);
    };
    animate();
  }

  addPlantAttackEffect(x, y, plantType) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    let color = 'rgba(144, 238, 144, 0.8)';
    if (plantType === 'peashooter') {
      color = 'rgba(144, 238, 144, 0.8)';
    } else if (plantType === 'snow_pea') {
      color = 'rgba(173, 216, 230, 0.8)';
    } else if (plantType === 'repeater') {
      color = 'rgba(60, 179, 113, 0.8)';
    }

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(40, 40, 1);
    sprite.position.set(x, 720 - y, 8);
    this.scene.add(sprite);

    const duration = 300;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        this.scene.remove(sprite);
        material.dispose();
        texture.dispose();
        return;
      }

      const scale = 40 + progress * 20;
      sprite.scale.set(scale, scale, 1);
      material.opacity = 1 - progress;

      requestAnimationFrame(animate);
    };
    animate();
  }
}
