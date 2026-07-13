// ============================================================
// 孤岛基地系统 - 海上安全区（游戏公司水准重构版）
// ============================================================

const IslandBase = {
  active: false,
  scene: null,
  camera: null,
  renderer: null,
  islandGroup: null,
  npcs: [],
  buildings: [],
  seaMesh: null,
  seaTime: 0,
  wallColliders: [],
  treeColliders: [],
  buildingColliders: [],
  animatedObjects: [],
  grassPatches: [],
  seagulls: [],
  fogIslands: [],

  // 浮动提示元素
  interactPrompt: null,

  // 按键状态跟踪
  keysPressed: {},

  // 士兵NPC配置
  soldierConfigs: [
    { name: '李军士', title: '巡逻队长', color: 0x4a6fa5 },
    { name: '王射手', title: '狙击手', color: 0x5a7fb5 },
    { name: '张医护', title: '医疗兵', color: 0x3a5f95 },
    { name: '赵工兵', title: '工程师', color: 0x6a8fc5 },
    { name: '孙通讯', title: '通讯员', color: 0x2a4f85 },
    { name: '周新兵', title: '新兵', color: 0x5a7fa5 }
  ],

  // 海上基地升级系统
  baseUpgrades: {
    weaponLevel: 1,    // 武器等级 1-5
    armorLevel: 1,     // 装甲等级 1-5
    allyCount: 0,      // 辅助潜艇数量 0-4
    allyWeaponLevel: 1 // 辅助潜艇武器等级 1-3
  },
  upgradeCosts: {
    weapon: [100, 200, 400, 800],
    armor: [100, 200, 400, 800],
    ally: [300, 500, 800, 1200],
    allyWeapon: [150, 300]
  },

  // ====== FBM噪声工具函数 ======
  _fbm(x, z, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this._noise2D(x * frequency, z * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  },

  _noise2D(x, z) {
    const n = Math.floor(x) + Math.floor(z) * 57;
    const nn = (n << 13) ^ n;
    return (1.0 - ((nn * (nn * nn * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0);
  },

  _smoothNoise2D(x, z) {
    const corners = (this._noise2D(x - 1, z - 1) + this._noise2D(x + 1, z - 1) + this._noise2D(x - 1, z + 1) + this._noise2D(x + 1, z + 1)) / 16;
    const sides = (this._noise2D(x - 1, z) + this._noise2D(x + 1, z) + this._noise2D(x, z - 1) + this._noise2D(x, z + 1)) / 8;
    const center = this._noise2D(x, z) / 4;
    return corners + sides + center;
  },

  init(scene, camera, renderer) {
    this.scene = scene || window.scene;
    this.camera = camera || window.camera;
    this.renderer = renderer || window.renderer;

    if (typeof clearCurrentMap === 'function') clearCurrentMap();
    if (typeof clearColliders === 'function') clearColliders();

    this.islandGroup = new THREE.Group();
    this.islandGroup.name = 'islandGroup';
    this.scene.add(this.islandGroup);

    this.createIsland();
    this.createBaseBuildings();
    this.createEnvironmentDecorations();
    this.createNPCs();
    this.createSea();
    this.createInteractPrompt();
    this.setupKeyListeners();

    this.active = true;
    window.currentMap = 'island';

    if (window.player && window.player.mesh) {
      window.player.mesh.position.set(0, 2, 0);
      this.camera.position.copy(window.player.mesh.position);
    }

    const waveInfo = document.getElementById('wave-info');
    if (waveInfo) {
      // 追加地图标签，不替换原有内容（保留 wave-num 和 enemy-count）
      let mapLabel = waveInfo.querySelector('.map-label');
      if (!mapLabel) {
        mapLabel = document.createElement('div');
        mapLabel.className = 'map-label';
        mapLabel.style.cssText = 'color:#44ff88;font-size:12px;';
        waveInfo.appendChild(mapLabel);
      }
      mapLabel.textContent = '孤岛基地 - 安全区';
    }
  },

  // ============================================================
  // 1. 地形系统深度优化
  // ============================================================
  createIsland() {
    // 主岛地面：PlaneGeometry + 墙内平坦水泥 + 墙外FBM噪声起伏绿色地形
    const islandGeo = new THREE.PlaneGeometry(200, 200, 64, 64);
    islandGeo.rotateX(-Math.PI / 2);
    const positions = islandGeo.attributes.position;
    const wallInnerRadius = 85; // 围墙半径
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      let height;
      if (dist < wallInnerRadius) {
        // 墙内：完全平坦水泥地面，y=0
        height = 0;
      } else {
        // 墙外：FBM噪声起伏地形
        height = this._fbm(x * 0.05, z * 0.05, 4, 0.5, 2.0) * 3;
        height += this._fbm(x * 0.1, z * 0.1, 3, 0.4, 2.5) * 1.5;
        height += this._fbm(x * 0.2, z * 0.2, 2, 0.3, 3.0) * 0.5;
        // 边缘衰减
        if (dist > 80) {
          height *= Math.max(0, 1 - (dist - 80) / 20);
        }
        height = Math.max(0, height);
      }
      positions.setY(i, height);
    }
    islandGeo.computeVertexNormals();
    // 墙内灰色水泥 + 墙外绿色草地（用顶点颜色混合）
    const colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      if (dist < wallInnerRadius) {
        // 墙内：灰色水泥色 0x7a7a7a
        colors[i * 3] = 0.478;     // R
        colors[i * 3 + 1] = 0.478; // G
        colors[i * 3 + 2] = 0.478; // B
      } else {
        // 墙外：绿色草地 0x4a7c2a
        colors[i * 3] = 0.290;     // R
        colors[i * 3 + 1] = 0.486; // G
        colors[i * 3 + 2] = 0.165; // B
      }
    }
    islandGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const islandMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.name = 'islandGround';
    island.position.y = 0; // 地面提升到 y=0，与建筑底部对齐
    island.receiveShadow = true;
    this.islandGroup.add(island);

    // 水泥地面纹理线条（模拟混凝土板块）
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
    for (let i = -8; i <= 8; i++) {
      const lineX = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 160), lineMat);
      lineX.position.set(i * 10, 0.02, 0); // 略高于地面
      this.islandGroup.add(lineX);
      const lineZ = new THREE.Mesh(new THREE.BoxGeometry(160, 0.02, 0.15), lineMat);
      lineZ.position.set(0, 0.02, i * 10);
      this.islandGroup.add(lineZ);
    }

    // 沙滩：RingGeometry + 噪声高度变化
    const sandGeo = new THREE.RingGeometry(90, 110, 64, 8);
    sandGeo.rotateX(-Math.PI / 2);
    const sandPositions = sandGeo.attributes.position;
    for (let i = 0; i < sandPositions.count; i++) {
      const x = sandPositions.getX(i);
      const z = sandPositions.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      let height = this._fbm(x * 0.08, z * 0.08, 3, 0.5, 2.0) * 0.8;
      // 边缘自然过渡
      const edgeFactor = (dist - 90) / 20;
      height *= (1 - edgeFactor * 0.5);
      sandPositions.setY(i, height + 0.1);
    }
    sandGeo.computeVertexNormals();
    const sandMat = new THREE.MeshLambertMaterial({ color: 0xd4c48a, side: THREE.DoubleSide });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.name = 'islandSand';
    sand.receiveShadow = true;
    this.islandGroup.add(sand);

    // 岩石底层
    const rockGeo = new THREE.CylinderGeometry(110, 85, 15, 64);
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.name = 'islandRockBase';
    rock.position.y = -10;
    this.islandGroup.add(rock);

    // 泥土路：基地内部灰色道路
    this.createDirtRoads();
  },

  createGrassPatches() {
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x5a9a3a, side: THREE.DoubleSide });
    let grassIdx = 0;
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 80;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // 避开建筑区域
      if (Math.abs(x) < 25 && Math.abs(z + 20) < 20) continue;
      if (Math.abs(Math.abs(x) - 35) < 8 && Math.abs(z + 10) < 15) continue;

      const grassGeo = new THREE.PlaneGeometry(0.8 + Math.random() * 0.6, 0.8 + Math.random() * 0.6);
      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.name = 'islandGrass_' + grassIdx++;
      grass.position.set(x, 0.3, z);
      grass.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      grass.rotation.z = Math.random() * Math.PI;
      grass.userData.baseRotation = grass.rotation.clone();
      grass.userData.swaySpeed = 0.5 + Math.random() * 1.5;
      grass.userData.swayOffset = Math.random() * Math.PI * 2;
      this.islandGroup.add(grass);
      this.grassPatches.push(grass);
    }
  },

  createDirtRoads() {
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
    // 主路：从大门到指挥中心
    const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), roadMat);
    mainRoad.name = 'islandRoad_main';
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.15, -10);
    mainRoad.receiveShadow = true;
    this.islandGroup.add(mainRoad);

    // 横路：连接兵营
    const crossRoad1 = new THREE.Mesh(new THREE.PlaneGeometry(50, 4), roadMat);
    crossRoad1.name = 'islandRoad_cross';
    crossRoad1.rotation.x = -Math.PI / 2;
    crossRoad1.position.set(0, 0.15, -10);
    crossRoad1.receiveShadow = true;
    this.islandGroup.add(crossRoad1);

    // 到停机坪的路
    const padRoad = new THREE.Mesh(new THREE.PlaneGeometry(4, 35), roadMat);
    padRoad.name = 'islandRoad_pad';
    padRoad.rotation.x = -Math.PI / 2;
    padRoad.position.set(-25, 0.15, 5);
    padRoad.receiveShadow = true;
    this.islandGroup.add(padRoad);

    // 到仓库的路
    const whRoad = new THREE.Mesh(new THREE.PlaneGeometry(4, 30), roadMat);
    whRoad.name = 'islandRoad_warehouse';
    whRoad.rotation.x = -Math.PI / 2;
    whRoad.position.set(20, 0.15, 10);
    whRoad.rotation.z = Math.PI / 2;
    whRoad.receiveShadow = true;
    this.islandGroup.add(whRoad);

    // 到码头的路
    const dockRoad = new THREE.Mesh(new THREE.PlaneGeometry(4, 40), roadMat);
    dockRoad.name = 'islandRoad_dock';
    dockRoad.rotation.x = -Math.PI / 2;
    dockRoad.position.set(0, 0.15, 55);
    dockRoad.receiveShadow = true;
    this.islandGroup.add(dockRoad);
  },

  // ============================================================
  // 2-9. 建筑系统深度设计
  // ============================================================
  createBaseBuildings() {
    this.createCommandCenter();
    this.createBarracks();
    // this.createWarehouse(); // 仓库已移除
    this.createHelipad();
    this.createDock();
    this.createWalls();
    this.createWatchTowers();
  },

  // 指挥中心深度设计
  createCommandCenter() {
    const cmdGroup = new THREE.Group();
    cmdGroup.name = 'islandBuilding_commandCenter';
    const concreteMat = new THREE.MeshLambertMaterial({ color: 0x6b7b8c });
    const darkConcreteMat = new THREE.MeshLambertMaterial({ color: 0x4a5560 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.7 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

    // 底层：Box(20,6,16)
    const floor1 = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 16), concreteMat);
    floor1.name = 'cmd_floor1';
    floor1.position.y = 3;
    floor1.castShadow = true;
    floor1.receiveShadow = true;
    cmdGroup.add(floor1);

    // 上层：Box(18,5,14)，有退台层次感
    const floor2 = new THREE.Mesh(new THREE.BoxGeometry(18, 5, 14), concreteMat);
    floor2.name = 'cmd_floor2';
    floor2.position.y = 8.5;
    floor2.castShadow = true;
    cmdGroup.add(floor2);

    // 窗户：12扇（每面3扇），浅蓝色玻璃材质，有窗框
    const windowPositions = [
      // 前面
      { x: -6, y: 3, z: 8.05, w: 3, h: 2.5 },
      { x: 0, y: 3, z: 8.05, w: 3, h: 2.5 },
      { x: 6, y: 3, z: 8.05, w: 3, h: 2.5 },
      { x: -6, y: 8.5, z: 7.05, w: 3, h: 2.5 },
      { x: 0, y: 8.5, z: 7.05, w: 3, h: 2.5 },
      { x: 6, y: 8.5, z: 7.05, w: 3, h: 2.5 },
      // 后面
      { x: -6, y: 3, z: -8.05, w: 3, h: 2.5 },
      { x: 0, y: 3, z: -8.05, w: 3, h: 2.5 },
      { x: 6, y: 3, z: -8.05, w: 3, h: 2.5 },
      { x: -6, y: 8.5, z: -7.05, w: 3, h: 2.5 },
      { x: 0, y: 8.5, z: -7.05, w: 3, h: 2.5 },
      { x: 6, y: 8.5, z: -7.05, w: 3, h: 2.5 },
    ];

    windowPositions.forEach((wp, wi) => {
      // 窗框
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(wp.w + 0.3, wp.h + 0.3, 0.15),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      frame.name = 'cmd_windowFrame_' + wi;
      frame.position.set(wp.x, wp.y, wp.z);
      cmdGroup.add(frame);
      // 玻璃
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(wp.w, wp.h, 0.1),
        glassMat
      );
      glass.name = 'cmd_windowGlass_' + wi;
      glass.position.set(wp.x, wp.y, wp.z);
      cmdGroup.add(glass);
    });

    // 大门：双开金属门，带门把手细节
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4.5, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    doorFrame.name = 'cmd_doorFrame';
    doorFrame.position.set(0, 2.25, 8.1);
    cmdGroup.add(doorFrame);

    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4, 0.15), metalMat);
    leftDoor.name = 'cmd_leftDoor';
    leftDoor.position.set(-1.2, 2, 8.2);
    cmdGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4, 0.15), metalMat);
    rightDoor.name = 'cmd_rightDoor';
    rightDoor.position.set(1.2, 2, 8.2);
    cmdGroup.add(rightDoor);

    // 门把手
    const handleGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const handleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const leftHandle = new THREE.Mesh(handleGeo, handleMat);
    leftHandle.name = 'cmd_leftHandle';
    leftHandle.position.set(-0.4, 2, 8.3);
    cmdGroup.add(leftHandle);
    const rightHandle = new THREE.Mesh(handleGeo, handleMat);
    rightHandle.name = 'cmd_rightHandle';
    rightHandle.position.set(0.4, 2, 8.3);
    cmdGroup.add(rightHandle);

    // 屋顶：斜顶（用旋转Box模拟），深灰色
    const roof = new THREE.Mesh(new THREE.BoxGeometry(19, 0.5, 15), darkConcreteMat);
    roof.name = 'cmd_roof1';
    roof.position.y = 11.5;
    roof.rotation.x = 0.1;
    roof.castShadow = true;
    cmdGroup.add(roof);

    const roof2 = new THREE.Mesh(new THREE.BoxGeometry(19, 0.5, 15), darkConcreteMat);
    roof2.name = 'cmd_roof2';
    roof2.position.y = 11.5;
    roof2.rotation.x = -0.1;
    roof2.castShadow = true;
    cmdGroup.add(roof2);

    // 天线阵列：5根不同高度的细圆柱体
    const antennaPositions = [
      { x: -5, z: -3, h: 6 },
      { x: -2, z: -4, h: 8 },
      { x: 0, z: -2, h: 10 },
      { x: 2, z: -4, h: 7 },
      { x: 5, z: -3, h: 5 }
    ];
    antennaPositions.forEach((ap, ai) => {
      const antenna = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, ap.h, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x777777 })
      );
      antenna.name = 'cmd_antenna_' + ai;
      antenna.position.set(ap.x, 11 + ap.h / 2, ap.z);
      cmdGroup.add(antenna);
    });

    // 顶部旋转雷达（圆盘+扫描动画）
    const radarGroup = new THREE.Group();
    radarGroup.name = 'cmd_radarGroup';
    const radarBase = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.3, 1),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    radarBase.name = 'cmd_radarBase';
    radarBase.position.y = 16;
    radarGroup.add(radarBase);

    const radarDish = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.2, 4),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    radarDish.name = 'cmd_radarDish';
    radarDish.position.y = 16.3;
    radarGroup.add(radarDish);

    // 雷达扫描线
    const scanLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.05, 2),
      new THREE.MeshBasicMaterial({ color: 0x44ff44 })
    );
    scanLine.name = 'cmd_radarScanLine';
    scanLine.position.set(0, 16.35, 1);
    radarGroup.add(scanLine);

    radarGroup.position.set(0, 0, 0);
    radarGroup.userData.isRadar = true;
    cmdGroup.add(radarGroup);
    this.animatedObjects.push(radarGroup);

    // 天线顶部红灯
    const lightGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.name = 'cmd_warningLight';
    light.position.set(0, 21, 0);
    light.userData.isBlinking = true;
    cmdGroup.add(light);

    // 周围：6个沙袋掩体（圆柱体堆叠）
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sx = Math.cos(angle) * 18;
      const sz = Math.sin(angle) * 14 - 20;
      const sandbagGroup = new THREE.Group();
      sandbagGroup.name = 'cmd_sandbagGroup_' + i;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4 - row; col++) {
          const sandbag = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.45, 0.6, 8),
            new THREE.MeshLambertMaterial({ color: 0x8a7a5a })
          );
          sandbag.name = 'cmd_sandbag_' + i + '_' + row + '_' + col;
          sandbag.position.set(col * 0.7 - (4 - row) * 0.35, row * 0.5 + 0.3, 0);
          sandbag.rotation.z = Math.PI / 2;
          sandbagGroup.add(sandbag);
        }
      }
      sandbagGroup.position.set(sx, 0, sz);
      sandbagGroup.lookAt(0, 0, -20);
      cmdGroup.add(sandbagGroup);
    }

    // 3个军用油桶（圆柱体+顶部黑色）
    for (let i = 0; i < 3; i++) {
      const barrelGroup = new THREE.Group();
      barrelGroup.name = 'cmd_barrelGroup_' + i;
      const barrelBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12),
        new THREE.MeshLambertMaterial({ color: 0x4a5a3a })
      );
      barrelBody.name = 'cmd_barrelBody_' + i;
      barrelBody.position.y = 0.6;
      barrelGroup.add(barrelBody);

      const barrelTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12),
        new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
      );
      barrelTop.name = 'cmd_barrelTop_' + i;
      barrelTop.position.y = 1.25;
      barrelGroup.add(barrelTop);

      barrelGroup.position.set(12 + i * 2, 0, -15 + i);
      barrelGroup.rotation.z = (Math.random() - 0.5) * 0.3;
      cmdGroup.add(barrelGroup);
    }

    // 1个旗杆（带旗帜飘动动画）
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 10),
      new THREE.MeshLambertMaterial({ color: 0x888888 })
    );
    flagPole.name = 'cmd_flagPole';
    flagPole.position.set(12, 5, -22);
    cmdGroup.add(flagPole);

    // 旗帜
    const flagGeo = new THREE.PlaneGeometry(3, 2, 8, 4);
    const flagMat = new THREE.MeshLambertMaterial({ color: 0xcc3333, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.name = 'cmd_flag';
    flag.position.set(13.5, 9, -22);
    flag.userData.isFlag = true;
    cmdGroup.add(flag);
    this.animatedObjects.push(flag);

    cmdGroup.position.set(0, 0, -20);
    this.islandGroup.add(cmdGroup);

    // 精确碰撞体：每层结构（只注册外墙轮廓，缩小碰撞范围）
    const bounds1 = new THREE.Box3().setFromObject(floor1);
    const bounds2 = new THREE.Box3().setFromObject(floor2);
    this.buildingColliders.push({ mesh: cmdGroup, type: 'command', bounds: bounds1 });
    this.buildingColliders.push({ mesh: cmdGroup, type: 'command', bounds: bounds2 });
    this.buildings.push({ mesh: cmdGroup, type: 'command', bounds: bounds1 });
    // 指挥中心不注册全局碰撞（避免超大building碰撞体）
    // this._registerBox3Collider(bounds1, 'building', true, 1.0);
    // this._registerBox3Collider(bounds2, 'building', true, 1.0);
  },

  // 兵营深度设计
  createBarracks() {
    for (let side = -1; side <= 1; side += 2) {
      const barracks = new THREE.Group();
      barracks.name = 'islandBuilding_barracks_' + (side > 0 ? 'east' : 'west');
      const wallMat = new THREE.MeshLambertMaterial({ color: 0x7a8a6a });

      // 主体：长条形Box(8,5,22)
      const barrBody = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 22), wallMat);
      barrBody.name = 'barracks_body_' + (side > 0 ? 'east' : 'west');
      barrBody.position.y = 2.5;
      barrBody.castShadow = true;
      barracks.add(barrBody);

      // 波纹铁皮屋顶（8个薄Box并排，有轻微颜色变化）
      for (let i = 0; i < 8; i++) {
        const shade = 0x5a6a4a + Math.floor(Math.random() * 0x101010);
        const roofPanel = new THREE.Mesh(
          new THREE.BoxGeometry(9, 0.15, 3),
          new THREE.MeshLambertMaterial({ color: shade })
        );
        roofPanel.name = 'barracks_roofPanel_' + (side > 0 ? 'e' : 'w') + '_' + i;
        roofPanel.position.set(0, 5.1, -9.5 + i * 3.2);
        roofPanel.castShadow = true;
        barracks.add(roofPanel);
      }

      // 窗户：侧面6扇小窗户
      for (let i = 0; i < 6; i++) {
        const windowFrame = new THREE.Mesh(
          new THREE.BoxGeometry(8.1, 1.2, 0.1),
          new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        windowFrame.name = 'barracks_sideWindowFrame_' + (side > 0 ? 'e' : 'w') + '_' + i;
        windowFrame.position.set(0, 3, -7.5 + i * 3);
        barracks.add(windowFrame);

        const windowGlass = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.8, 0.12),
          new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.6 })
        );
        windowGlass.name = 'barracks_sideWindowGlass_' + (side > 0 ? 'e' : 'w') + '_' + i;
        windowGlass.position.set(0, 3, -7.5 + i * 3);
        barracks.add(windowGlass);
      }

      // 前后各1扇窗户
      [-1, 1].forEach((dir, di) => {
        const windowFrame = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 1.2, 1.5),
          new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        windowFrame.name = 'barracks_endWindowFrame_' + (side > 0 ? 'e' : 'w') + '_' + di;
        windowFrame.position.set(dir * 4.05, 3, 0);
        barracks.add(windowFrame);

        const windowGlass = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.8, 1),
          new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.6 })
        );
        windowGlass.name = 'barracks_endWindowGlass_' + (side > 0 ? 'e' : 'w') + '_' + di;
        windowGlass.position.set(dir * 4.05, 3, 0);
        barracks.add(windowGlass);
      });

      // 门：前后各一扇金属门
      [-1, 1].forEach((dir, di) => {
        const doorFrame = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 3, 2.5),
          new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        doorFrame.name = 'barracks_doorFrame_' + (side > 0 ? 'e' : 'w') + '_' + di;
        doorFrame.position.set(dir * 4.1, 1.5, 8);
        barracks.add(doorFrame);

        const door = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 2.8, 2.2),
          new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        door.name = 'barracks_door_' + (side > 0 ? 'e' : 'w') + '_' + di;
        door.position.set(dir * 4.15, 1.4, 8);
        barracks.add(door);
      });

      // 晾衣绳（细线+小方块衣服）
      const clothesline = new THREE.Group();
      clothesline.name = 'barracks_clothesline_' + (side > 0 ? 'e' : 'w');
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 10),
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
      );
      rope.name = 'barracks_rope_' + (side > 0 ? 'e' : 'w');
      rope.rotation.z = Math.PI / 2;
      rope.position.y = 3;
      clothesline.add(rope);

      // 衣服
      const clothColors = [0xffffff, 0x4a6fa5, 0x7a8a6a, 0x8a6a4a];
      for (let i = 0; i < 4; i++) {
        const cloth = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 1, 0.05),
          new THREE.MeshLambertMaterial({ color: clothColors[i] })
        );
        cloth.name = 'barracks_cloth_' + (side > 0 ? 'e' : 'w') + '_' + i;
        cloth.position.set(-3 + i * 2, 2.3, 0);
        cloth.userData.isCloth = true;
        cloth.userData.swayOffset = i;
        clothesline.add(cloth);
        this.animatedObjects.push(cloth);
      }
      clothesline.position.set(side * 35, 0, -5);
      barracks.add(clothesline);

      // 军用储物箱（3个不同颜色）
      const boxColors = [0x4a5a3a, 0x5a4a3a, 0x3a4a5a];
      for (let i = 0; i < 3; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1, 1),
          new THREE.MeshLambertMaterial({ color: boxColors[i] })
        );
        box.name = 'barracks_storageBox_' + (side > 0 ? 'e' : 'w') + '_' + i;
        box.position.set(side * 42, 0.5, -8 + i * 2);
        box.castShadow = true;
        barracks.add(box);
      }

      // 自行车（简单几何体）
      const bikeGroup = new THREE.Group();
      bikeGroup.name = 'barracks_bike_' + (side > 0 ? 'e' : 'w');
      const bikeFrame = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.5),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
      );
      bikeFrame.name = 'bike_frame';
      bikeFrame.rotation.z = Math.PI / 2;
      bikeFrame.position.y = 0.6;
      bikeGroup.add(bikeFrame);

      const bikeSeat = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.1, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      bikeSeat.name = 'bike_seat';
      bikeSeat.position.set(-0.3, 1, 0);
      bikeGroup.add(bikeSeat);

      const bikeHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.5),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
      );
      bikeHandle.name = 'bike_handle';
      bikeHandle.rotation.x = Math.PI / 2;
      bikeHandle.position.set(0.5, 1, 0);
      bikeGroup.add(bikeHandle);

      // 轮子
      [-0.6, 0.6].forEach((wx, wi) => {
        const wheel = new THREE.Mesh(
          new THREE.TorusGeometry(0.3, 0.03, 8, 16),
          new THREE.MeshLambertMaterial({ color: 0x111111 })
        );
        wheel.name = 'bike_wheel_' + wi;
        wheel.position.set(wx, 0.3, 0);
        bikeGroup.add(wheel);
      });

      bikeGroup.position.set(side * 40, 0, 5);
      bikeGroup.rotation.y = Math.random() * Math.PI;
      barracks.add(bikeGroup);

      barracks.position.set(side * 35, 0, -10);
      this.islandGroup.add(barracks);

      const bounds = new THREE.Box3().setFromObject(barrBody);
      this.buildingColliders.push({ mesh: barracks, type: 'barracks', bounds });
      this.buildings.push({ mesh: barracks, type: 'barracks', bounds });
      // 兵营不注册全局碰撞
      // this._registerBox3Collider(bounds, 'building', true);
    }
  },

  // 仓库深度设计
  createWarehouse() {
    const warehouse = new THREE.Group();
    warehouse.name = 'islandBuilding_warehouse';
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });

    // 拱顶（半圆柱体，半径9，长16）
    const archGeo = new THREE.CylinderGeometry(9, 9, 16, 32, 1, false, 0, Math.PI);
    archGeo.rotateZ(Math.PI / 2);
    const arch = new THREE.Mesh(archGeo, metalMat);
    arch.name = 'warehouse_arch';
    arch.position.y = 9;
    arch.castShadow = true;
    warehouse.add(arch);

    // 两端半圆封口
    [-1, 1].forEach((dir, di) => {
      const endCap = new THREE.Mesh(
        new THREE.CircleGeometry(9, 32, 0, Math.PI),
        metalMat
      );
      endCap.name = 'warehouse_endCap_' + di;
      endCap.rotation.y = dir * Math.PI / 2;
      endCap.position.set(dir * 8, 9, 0);
      warehouse.add(endCap);

      // 垂直墙
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 9, 18),
        metalMat
      );
      wall.name = 'warehouse_wall_' + di;
      wall.position.set(dir * 8.25, 4.5, 0);
      warehouse.add(wall);
    });

    // 底部
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(16, 0.5, 18),
      new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
    );
    floor.name = 'warehouse_floor';
    floor.position.y = 0.25;
    warehouse.add(floor);

    // 大门：大型卷帘门（金属质感，有水平条纹）
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    doorFrame.name = 'warehouse_doorFrame';
    doorFrame.position.set(8.3, 4, 0);
    warehouse.add(doorFrame);

    for (let i = 0; i < 8; i++) {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.9, 7.5),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      stripe.name = 'warehouse_doorStripe_' + i;
      stripe.position.set(8.35, 0.5 + i, 0);
      warehouse.add(stripe);
    }

    // 周围：木箱堆（8个不同大小Box堆叠）
    const boxSizes = [
      { w: 1.5, h: 1.5, d: 1.5 }, { w: 1.2, h: 1, d: 1.2 },
      { w: 1, h: 0.8, d: 1 }, { w: 1.3, h: 1.2, d: 1.3 },
      { w: 0.8, h: 0.6, d: 0.8 }, { w: 1.5, h: 1, d: 1 },
      { w: 1, h: 1, d: 1.5 }, { w: 1.2, h: 0.9, d: 1.2 }
    ];
    boxSizes.forEach((size, i) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(size.w, size.h, size.d),
        new THREE.MeshLambertMaterial({ color: 0x8a6a4a + Math.floor(Math.random() * 0x202020) })
      );
      box.name = 'warehouse_crate_' + i;
      box.position.set(
        15 + (i % 3) * 2,
        size.h / 2 + Math.floor(i / 3) * 1.2,
        -5 + (i % 2) * 3
      );
      box.castShadow = true;
      warehouse.add(box);
    });

    // 叉车（简单几何体）
    const forklift = new THREE.Group();
    forklift.name = 'warehouse_forklift';
    const forkBody = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 1.2),
      new THREE.MeshLambertMaterial({ color: 0xffaa00 })
    );
    forkBody.name = 'forklift_body';
    forkBody.position.y = 1;
    forklift.add(forkBody);

    const forkMast = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 3, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    forkMast.name = 'forklift_mast';
    forkMast.position.set(1, 2.5, 0);
    forklift.add(forkMast);

    const forkPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.8, 1),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    forkPlate.name = 'forklift_plate';
    forkPlate.position.set(1.1, 2, 0);
    forklift.add(forkPlate);

    // 轮子
    [[-0.6, 0.3], [-0.6, -0.3], [0.6, 0.3], [0.6, -0.3]].forEach((pos, pi) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8),
        new THREE.MeshLambertMaterial({ color: 0x111111 })
      );
      wheel.name = 'forklift_wheel_' + pi;
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(pos[0], 0.25, pos[1]);
      forklift.add(wheel);
    });

    forklift.position.set(18, 0, 5);
    forklift.rotation.y = -0.5;
    warehouse.add(forklift);

    // 油桶（4个）
    for (let i = 0; i < 4; i++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 1, 12),
        new THREE.MeshLambertMaterial({ color: 0x4a5a3a })
      );
      barrel.name = 'warehouse_barrel_' + i;
      barrel.position.set(16 + i * 0.8, 0.5, 8);
      barrel.castShadow = true;
      warehouse.add(barrel);

      const barrelTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.05, 12),
        new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
      );
      barrelTop.name = 'warehouse_barrelTop_' + i;
      barrelTop.position.set(16 + i * 0.8, 1.02, 8);
      warehouse.add(barrelTop);
    }

    warehouse.position.set(25, 0, 25);
    this.islandGroup.add(warehouse);

    const bounds = new THREE.Box3().setFromObject(arch);
    this.buildingColliders.push({ mesh: warehouse, type: 'warehouse', bounds });
    this.buildings.push({ mesh: warehouse, type: 'warehouse', bounds });
    // 仓库不注册全局碰撞
    // this._registerBox3Collider(bounds, 'building', true);
  },

  // 围墙系统深度设计
  createWalls() {
    const wallHeight = 5;
    const wallThickness = 1;
    const baseRadius = 55;
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });

    // 四面围墙
    const wallPositions = [
      { x: 0, z: -baseRadius, w: baseRadius * 2, d: wallThickness },
      { x: 0, z: baseRadius, w: baseRadius * 2, d: wallThickness },
      { x: -baseRadius, z: 0, w: wallThickness, d: baseRadius * 2 },
      { x: baseRadius, z: 0, w: wallThickness, d: baseRadius * 2 }
    ];

    wallPositions.forEach((wp, idx) => {
      // 分段墙体，每段独立碰撞
      const segmentLength = idx < 2 ? wp.w : wp.d;
      const numSegments = Math.floor(segmentLength / 8);

      for (let s = 0; s < numSegments; s++) {
        const segment = new THREE.Mesh(
          new THREE.BoxGeometry(
            idx < 2 ? 8 : wallThickness,
            wallHeight,
            idx < 2 ? wallThickness : 8
          ),
          wallMat
        );
        segment.name = 'islandWall_segment_' + idx + '_' + s;
        const offset = (s - numSegments / 2 + 0.5) * 8;
        segment.position.set(
          idx < 2 ? offset : wp.x,
          wallHeight / 2,
          idx < 2 ? wp.z : offset
        );
        segment.castShadow = true;
        this.islandGroup.add(segment);
        // 围墙只保留视觉效果，不注册碰撞（避免空气墙）
        this.wallColliders.push(segment);

        // 射击孔：墙上每隔8米一个（小Box凹陷）
        const firingHole = new THREE.Mesh(
          new THREE.BoxGeometry(
            idx < 2 ? 1.5 : 0.3,
            1,
            idx < 2 ? 0.3 : 1.5
          ),
          new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        firingHole.name = 'islandWall_firingHole_' + idx + '_' + s;
        firingHole.position.set(
          idx < 2 ? offset : wp.x + (wp.x > 0 ? -0.3 : 0.3),
          3,
          idx < 2 ? wp.z + (wp.z > 0 ? -0.3 : 0.3) : offset
        );
        this.islandGroup.add(firingHole);

        // 顶部：3层铁丝网（用Line模拟，有轻微晃动动画）
        for (let layer = 0; layer < 3; layer++) {
          const wirePoints = [];
          for (let w = 0; w <= 8; w += 0.5) {
            const wx = idx < 2 ? offset - 4 + w : wp.x;
            const wz = idx < 2 ? wp.z : offset - 4 + w;
            wirePoints.push(new THREE.Vector3(wx, wallHeight + 0.3 + layer * 0.3, wz));
          }
          const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
          const wireMat = new THREE.LineBasicMaterial({ color: 0x888888 });
          const wire = new THREE.Line(wireGeo, wireMat);
          wire.userData.isWire = true;
          wire.userData.basePoints = wirePoints.map(p => p.clone());
          wire.userData.wireOffset = s * 0.5 + layer * 0.3;
          this.islandGroup.add(wire);
          this.animatedObjects.push(wire);
        }
      }

      // 大门（正面围墙）
      if (idx === 1) {
        // 门柱
        const pillarGeo = new THREE.BoxGeometry(2, 6, wallThickness + 1);
        const pillarMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

        // 门柱（放在通道外侧，不阻挡通道）
        // 使用更窄的碰撞体，确保通道足够宽
        const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
        leftPillar.name = 'islandWall_gateLeftPillar';
        leftPillar.position.set(-9, 3, baseRadius);
        leftPillar.castShadow = true;
        this.islandGroup.add(leftPillar);
        this.wallColliders.push(leftPillar);
        // 门柱不单独注册碰撞（由整体围墙碰撞覆盖）

        const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
        rightPillar.name = 'islandWall_gateRightPillar';
        rightPillar.position.set(9, 3, baseRadius);
        rightPillar.castShadow = true;
        this.islandGroup.add(rightPillar);
        this.wallColliders.push(rightPillar);

        // 拱形门楣（抬高到8米，确保不阻挡玩家头部）
        const archGeo = new THREE.CylinderGeometry(4, 4, wallThickness + 0.5, 16, 1, false, 0, Math.PI);
        archGeo.rotateZ(Math.PI / 2);
        archGeo.rotateX(Math.PI / 2);
        const archMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.name = 'islandWall_gateArch';
        arch.position.set(0, 8, baseRadius);
        arch.castShadow = true;
        this.islandGroup.add(arch);
        this.wallColliders.push(arch);

        // 门楣顶部横梁（抬高到8.5米）
        const beamGeo = new THREE.BoxGeometry(16, 1, wallThickness + 0.5);
        const beam = new THREE.Mesh(beamGeo, archMat);
        beam.name = 'islandWall_gateBeam';
        beam.position.set(0, 8.5, baseRadius);
        beam.castShadow = true;
        this.islandGroup.add(beam);
        this.wallColliders.push(beam);

        // 两侧矮墙（向外移，留出 12 米宽通道）
        const gateLeft = new THREE.Mesh(
          new THREE.BoxGeometry(10, 4, wallThickness + 0.5),
          new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
        );
        gateLeft.name = 'islandWall_gateLeft';
        gateLeft.position.set(-16, 2, baseRadius);
        gateLeft.castShadow = true;
        this.islandGroup.add(gateLeft);
        // 大门区域矮墙只保留视觉效果，不注册碰撞（避免阻挡通道）
        this.wallColliders.push(gateLeft);

        const gateRight = new THREE.Mesh(
          new THREE.BoxGeometry(10, 4, wallThickness + 0.5),
          new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
        );
        gateRight.name = 'islandWall_gateRight';
        gateRight.position.set(16, 2, baseRadius);
        gateRight.castShadow = true;
        this.islandGroup.add(gateRight);
        this.wallColliders.push(gateRight);

        // 双开金属门（完全敞开贴墙，无碰撞体）
        const leftDoor = new THREE.Mesh(
          new THREE.BoxGeometry(3.5, 3.8, 0.2),
          new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        leftDoor.name = 'islandWall_gateDoorLeft';
        leftDoor.position.set(-7, 2, baseRadius + 0.2);
        leftDoor.rotation.y = -Math.PI / 2;
        leftDoor.userData.isGateDoor = true;
        leftDoor.userData.gateSide = -1;
        this.islandGroup.add(leftDoor);

        const rightDoor = new THREE.Mesh(
          new THREE.BoxGeometry(3.5, 3.8, 0.2),
          new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        rightDoor.name = 'islandWall_gateDoorRight';
        rightDoor.position.set(7, 2, baseRadius + 0.2);
        rightDoor.rotation.y = Math.PI / 2;
        rightDoor.userData.isGateDoor = true;
        rightDoor.userData.gateSide = 1;
        this.islandGroup.add(rightDoor);

        // ====== 大门两侧高射炮（可攻击，有血量）======
        this._createAntiAirGun(-11, baseRadius + 2);
        this._createAntiAirGun(11, baseRadius + 2);
      }
    });

    // 角落碉堡：圆柱体塔楼（半径4，高6），带射击窗口和顶棚
    const towerPositions = [
      { x: -baseRadius + 3, z: -baseRadius + 3 },
      { x: baseRadius - 3, z: -baseRadius + 3 },
      { x: -baseRadius + 3, z: baseRadius - 3 },
      { x: baseRadius - 3, z: baseRadius - 3 }
    ];

    towerPositions.forEach((tp, ti) => {
      const bunker = new THREE.Group();
      bunker.name = 'islandBunker_' + ti;

      // 塔身
      const towerBody = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 4, 6, 16),
        wallMat
      );
      towerBody.name = 'bunker_body_' + ti;
      towerBody.position.y = 3;
      towerBody.castShadow = true;
      bunker.add(towerBody);

      // 射击窗口
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const windowHole = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 0.8, 0.5),
          new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        windowHole.name = 'bunker_windowHole_' + ti + '_' + i;
        windowHole.position.set(
          Math.cos(angle) * 3.8,
          3.5,
          Math.sin(angle) * 3.8
        );
        windowHole.lookAt(0, 3.5, 0);
        bunker.add(windowHole);
      }

      // 顶棚
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(5, 2, 16),
        new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
      );
      roof.name = 'bunker_roof_' + ti;
      roof.position.y = 7;
      bunker.add(roof);

      bunker.position.set(tp.x, 0, tp.z);
      this.islandGroup.add(bunker);

      const bounds = new THREE.Box3().setFromObject(towerBody);
      this.buildingColliders.push({ mesh: bunker, type: 'bunker', bounds });
      // 碉堡不注册碰撞（避免角落空气墙）
    });

    // ====== 统一围墙碰撞盒（只保留围墙+大门结构，避免碎片空气墙） ======
    // ====== 手动精确碰撞体注册（对齐模型位置） ======
    if (typeof addCollider === 'function') {
      const W = 5; // 围墙高度
      const R = 55; // 基地半径
      const halfT = 0.5; // 墙厚半宽

      // === 围墙 ===
      // 北墙（完整）
      addCollider(0, -R, R, halfT, W, 'wall', true);
      // 南墙左段（大门通道 x=-12~+12 留空）
      addCollider(-(R + 12) / 2, R, (R - 12) / 2, halfT, W, 'wall', true);
      // 南墙右段
      addCollider((R + 12) / 2, R, (R - 12) / 2, halfT, W, 'wall', true);
      // 西墙
      addCollider(-R, 0, halfT, R, W, 'wall', true);
      // 东墙
      addCollider(R, 0, halfT, R, W, 'wall', true);

      // === 指挥中心（两层合并） ===
      addCollider(0, -20, 10, 8, 11, 'building', true);

      // === 兵营（东西各一座） ===
      addCollider(-35, -10, 4, 11, 5, 'building', true);
      addCollider(35, -10, 4, 11, 5, 'building', true);

      // === 碉堡（4个角落，半径4圆柱→AABB 4x4） ===
      addCollider(-52, -52, 4, 4, 6, 'building', true);
      addCollider(52, -52, 4, 4, 6, 'building', true);
      addCollider(-52, 52, 4, 4, 6, 'building', true);
      addCollider(52, 52, 4, 4, 6, 'building', true);

      // === 瞭望塔（4个，立柱 footprint 3.3x3.3） ===
      addCollider(-50, -50, 1.65, 1.65, 18, 'building', true);
      addCollider(50, -50, 1.65, 1.65, 18, 'building', true);
      addCollider(-50, 50, 1.65, 1.65, 18, 'building', true);
      addCollider(50, 50, 1.65, 1.65, 18, 'building', true);
    }
  },

  // 瞭望塔深度设计
  createWatchTowers() {
    const towerPositions = [
      { x: -50, z: -50 },
      { x: 50, z: -50 },
      { x: -50, z: 50 },
      { x: 50, z: 50 }
    ];

    towerPositions.forEach((tp, idx) => {
      const tower = new THREE.Group();
      tower.name = 'islandTower_' + idx;
      const steelMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const glassMat = new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.5 });

      // 塔身：钢制框架结构（4根立柱+横梁）
      const pillarPositions = [
        { x: -1.5, z: -1.5 }, { x: 1.5, z: -1.5 },
        { x: -1.5, z: 1.5 }, { x: 1.5, z: 1.5 }
      ];

      pillarPositions.forEach((pp, pi) => {
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 15, 0.3),
          steelMat
        );
        pillar.name = 'tower_pillar_' + idx + '_' + pi;
        pillar.position.set(pp.x, 7.5, pp.z);
        pillar.castShadow = true;
        tower.add(pillar);
      });

      // 横梁
      for (let h = 2; h < 15; h += 3) {
        [-1.5, 1.5].forEach((offset, oi) => {
          const beam1 = new THREE.Mesh(
            new THREE.BoxGeometry(3.3, 0.2, 0.2),
            steelMat
          );
          beam1.name = 'tower_beamH_' + idx + '_' + h + '_' + oi;
          beam1.position.set(0, h, offset);
          tower.add(beam1);

          const beam2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 3.3),
            steelMat
          );
          beam2.name = 'tower_beamV_' + idx + '_' + h + '_' + oi;
          beam2.position.set(offset, h, 0);
          tower.add(beam2);
        });
      }

      // 瞭望室：封闭Box，带玻璃窗
      const room = new THREE.Mesh(
        new THREE.BoxGeometry(4, 3, 4),
        steelMat
      );
      room.name = 'tower_room_' + idx;
      room.position.y = 16.5;
      tower.add(room);
      // 玻璃窗
      [-1, 1].forEach((dir, di) => {
        const glass1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 2, 3),
          glassMat
        );
        glass1.name = 'tower_glass1_' + idx + '_' + di;
        glass1.position.set(dir * 2.02, 16.5, 0);
        tower.add(glass1);

        const glass2 = new THREE.Mesh(
          new THREE.BoxGeometry(3, 2, 0.05),
          glassMat
        );
        glass2.name = 'tower_glass2_' + idx + '_' + di;
        glass2.position.set(0, 16.5, dir * 2.02);
        tower.add(glass2);
      });

      // 顶棚：四棱锥屋顶
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(3.5, 2.5, 4),
        new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
      );
      roof.name = 'tower_roof_' + idx;
      roof.position.y = 19.25;
      roof.rotation.y = Math.PI / 4;
      tower.add(roof);

      // 探照灯（SpotLight，可旋转扫描动画）
      const spotLight = new THREE.SpotLight(0xffffee, 0.8, 80, Math.PI / 8, 0.3);
      spotLight.position.set(0, 18, 0);
      spotLight.target.position.set(tp.x > 0 ? -20 : 20, 0, tp.z > 0 ? -20 : 20);
      tower.add(spotLight);
      tower.add(spotLight.target);

      // 探照灯外壳
      const lightHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.5, 0.8),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
      );
      lightHousing.name = 'tower_searchlight_' + idx;
      lightHousing.position.set(0, 17.5, 1.5);
      lightHousing.rotation.x = Math.PI / 6;
      lightHousing.userData.isSearchlight = true;
      lightHousing.userData.lightIndex = idx;
      tower.add(lightHousing);
      this.animatedObjects.push(lightHousing);

      // 通讯天线
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.08, 4),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
      );
      antenna.name = 'tower_antenna_' + idx;
      antenna.position.y = 21;
      tower.add(antenna);

      // 梯子：侧面有梯子（多个小Box排列）
      for (let i = 0; i < 20; i++) {
        const rung = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.08, 0.15),
          steelMat
        );
        rung.name = 'tower_rung_' + idx + '_' + i;
        rung.position.set(2, 0.5 + i * 0.8, 0);
        tower.add(rung);
      }
      // 梯子立柱
      [-0.3, 0.3].forEach((lx, li) => {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 16, 0.1),
          steelMat
        );
        rail.name = 'tower_rail_' + idx + '_' + li;
        rail.position.set(2 + lx, 8, 0);
        tower.add(rail);
      });

      tower.position.set(tp.x, 0, tp.z);
      this.islandGroup.add(tower);

      const bounds = new THREE.Box3().setFromObject(room);
      this.buildingColliders.push({ mesh: tower, type: 'tower', bounds });
      // 瞭望塔不注册碰撞
    });
  },

  // 停机坪深度设计
  createHelipad() {
    const padGroup = new THREE.Group();
    padGroup.name = 'islandPad';

    // 平台：圆形混凝土，半径14
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 14, 0.5, 32),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    pad.name = 'pad_platform';
    pad.position.y = 0.25;
    pad.receiveShadow = true;
    padGroup.add(pad);

    // H标记：黄色，用Box拼成
    const hMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 10), hMat);
    hBar1.name = 'pad_hBar1';
    const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 10), hMat);
    hBar2.name = 'pad_hBar2';
    const hCross = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 3), hMat);
    hCross.name = 'pad_hCross';
    hBar1.position.set(-3, 0.55, 0);
    hBar2.position.set(3, 0.55, 0);
    hCross.position.set(0, 0.55, 0);
    padGroup.add(hBar1, hBar2, hCross);

    // 直升机加油设备（方块+软管）
    const fuelPump = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2, 1.2),
      new THREE.MeshLambertMaterial({ color: 0xcc3333 })
    );
    fuelPump.name = 'pad_fuelPump';
    fuelPump.position.set(10, 1, -8);
    padGroup.add(fuelPump);

    const hose = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.08, 8, 16, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    hose.name = 'pad_hose';
    hose.position.set(10, 0.3, -6);
    hose.rotation.x = Math.PI / 2;
    padGroup.add(hose);

    // 工具箱（2个）
    for (let i = 0; i < 2; i++) {
      const toolbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.8, 0.6),
        new THREE.MeshLambertMaterial({ color: i === 0 ? 0xcc3333 : 0x3333cc })
      );
      toolbox.name = 'pad_toolbox_' + i;
      toolbox.position.set(-10 + i * 3, 0.4, -8);
      padGroup.add(toolbox);
    }

    padGroup.position.set(-30, 0, 20);
    this.islandGroup.add(padGroup);

    const bounds = new THREE.Box3().setFromObject(pad);
    this.buildings.push({ mesh: padGroup, type: 'helipad', bounds });
    this.buildingColliders.push({ mesh: padGroup, type: 'helipad', bounds });
    // 停机坪不注册全局碰撞
    // this._registerBox3Collider(bounds, 'building', true, 1.0);
  },

  // 码头深度设计
  createDock() {
    const dockGroup = new THREE.Group();
    dockGroup.name = 'islandDock';

    // 平台：木质结构（棕色Box，有 planks 纹理效果）
    for (let i = 0; i < 5; i++) {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.3, 4.8),
        new THREE.MeshLambertMaterial({ color: 0x6a5a4a + Math.floor(Math.random() * 0x101010) })
      );
      plank.name = 'dock_plank_' + i;
      plank.position.set(0, 0.5, 5 + i * 5);
      plank.receiveShadow = true;
      dockGroup.add(plank);
    }

    // 支柱：8根木桩（圆柱体，有倾斜）
    for (let i = 0; i < 8; i++) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.35, 8),
        new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
      );
      pillar.name = 'dock_pillar_' + i;
      pillar.position.set(
        -4 + (i % 2) * 8 + (Math.random() - 0.5) * 0.3,
        -3,
        5 + Math.floor(i / 2) * 6.5
      );
      pillar.rotation.z = (Math.random() - 0.5) * 0.1;
      pillar.rotation.x = (Math.random() - 0.5) * 0.1;
      dockGroup.add(pillar);
    }

    // 系船柱：2个（短圆柱体）
    for (let i = 0; i < 2; i++) {
      const bollard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.25, 0.8),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      bollard.name = 'dock_bollard_' + i;
      bollard.position.set(-3 + i * 6, 0.9, 22);
      dockGroup.add(bollard);
    }

    // 小船：简单小船模型（船体+船舱）
    const boat = new THREE.Group();
    boat.name = 'dock_boat';
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 8),
      new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
    );
    hull.name = 'boat_hull';
    hull.position.y = 0.5;
    boat.add(hull);

    const hullBottom = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.5, 7.5),
      new THREE.MeshLambertMaterial({ color: 0x6a5a4a })
    );
    hullBottom.name = 'boat_hullBottom';
    hullBottom.position.y = 0.1;
    boat.add(hullBottom);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.5, 3),
      new THREE.MeshLambertMaterial({ color: 0xdddddd })
    );
    cabin.name = 'boat_cabin';
    cabin.position.set(0, 1.75, -1);
    boat.add(cabin);

    const cabinRoof = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 0.1, 3.2),
      new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
    );
    cabinRoof.name = 'boat_cabinRoof';
    cabinRoof.position.set(0, 2.55, -1);
    boat.add(cabinRoof);

    boat.position.set(2, -0.5, 25);
    boat.rotation.y = 0.2;
    dockGroup.add(boat);

    // 码头小屋
    const hutGroup = new THREE.Group();
    hutGroup.name = 'dock_hut';
    const hutBody = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 4),
      new THREE.MeshLambertMaterial({ color: 0x8a7a5a })
    );
    hutBody.name = 'hut_body';
    hutBody.position.y = 2;
    hutBody.castShadow = true;
    hutGroup.add(hutBody);

    const hutRoof = new THREE.Mesh(
      new THREE.ConeGeometry(4, 2, 4),
      new THREE.MeshLambertMaterial({ color: 0x6a5a4a })
    );
    hutRoof.name = 'hut_roof';
    hutRoof.position.y = 5;
    hutRoof.rotation.y = Math.PI / 4;
    hutGroup.add(hutRoof);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1.5, 0.8),
      new THREE.MeshLambertMaterial({ color: 0xaa8844 })
    );
    sign.name = 'hut_sign';
    sign.position.set(3, 1, 0);
    hutGroup.add(sign);

    hutGroup.position.set(8, 0, 72);
    dockGroup.add(hutGroup);

    dockGroup.position.set(0, 0, 75);
    this.islandGroup.add(dockGroup);

    const bounds = new THREE.Box3().setFromObject(hutBody);
    bounds.expandByPoint(new THREE.Vector3(0, 0, 100));
    this.buildingColliders.push({ mesh: dockGroup, type: 'dock', bounds });
    // 码头不注册碰撞
  },

  // ============================================================
  // 10. 环境装饰
  // ============================================================
  createEnvironmentDecorations() {
    this.createPalmTrees();
    this.createPineTrees();
  },

  createPalmTrees() {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 70 + Math.random() * 15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const tree = new THREE.Group();
      tree.name = 'islandTree_palm_' + i;

      // 树干圆柱体（有纹理色带）
      const trunkHeight = 6 + Math.random() * 4;
      for (let t = 0; t < 5; t++) {
        const segment = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.4 - t * 0.05,
            0.5 - t * 0.05,
            trunkHeight / 5
          ),
          new THREE.MeshLambertMaterial({
            color: 0x6a5a3a + Math.floor(Math.random() * 0x101010)
          })
        );
        segment.name = 'palmTrunk_' + i + '_' + t;
        segment.position.y = (t + 0.5) * (trunkHeight / 5);
        segment.castShadow = true;
        tree.add(segment);
      }

      // 6片扇形树叶（平面，有微风摆动）
      for (let l = 0; l < 6; l++) {
        const leafAngle = (l / 6) * Math.PI * 2;
        const leaf = new THREE.Mesh(
          new THREE.PlaneGeometry(1.5, 4),
          new THREE.MeshLambertMaterial({ color: 0x4a8a2a, side: THREE.DoubleSide })
        );
        leaf.name = 'palmLeaf_' + i + '_' + l;
        leaf.position.set(
          Math.cos(leafAngle) * 1.5,
          trunkHeight,
          Math.sin(leafAngle) * 1.5
        );
        leaf.rotation.x = -0.5;
        leaf.rotation.y = leafAngle;
        leaf.rotation.z = 0.3;
        leaf.userData.isPalmLeaf = true;
        leaf.userData.leafIndex = l;
        leaf.userData.baseRotation = leaf.rotation.clone();
        tree.add(leaf);
        this.animatedObjects.push(leaf);
      }

      tree.position.set(x, 0, z);
      tree.rotation.z = (Math.random() - 0.5) * 0.2;
      this.islandGroup.add(tree);

      // 树干碰撞体
      const trunkBounds = new THREE.Box3(
        new THREE.Vector3(x - 0.5, 0, z - 0.5),
        new THREE.Vector3(x + 0.5, trunkHeight, z + 0.5)
      );
      this.treeColliders.push({ mesh: tree, bounds: trunkBounds });
      // 树木不注册碰撞（避免空气墙）
    }
  },

  createPineTrees() {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
      const radius = 60 + Math.random() * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const tree = new THREE.Group();
      tree.name = 'islandTree_pine_' + i;
      const colors = [0x1a3a1a, 0x2a4a2a, 0x3a5a3a, 0x4a6a4a];

      // 4层圆锥堆叠（颜色从深到浅）
      for (let l = 0; l < 4; l++) {
        const layer = new THREE.Mesh(
          new THREE.ConeGeometry(3 - l * 0.6, 3, 8),
          new THREE.MeshLambertMaterial({ color: colors[l] })
        );
        layer.name = 'pineLayer_' + i + '_' + l;
        layer.position.y = 2 + l * 2;
        layer.castShadow = true;
        tree.add(layer);
      }

      // 树干
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.6, 3),
        new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
      );
      trunk.name = 'pineTrunk_' + i;
      trunk.position.y = 1.5;
      tree.add(trunk);

      tree.position.set(x, 0, z);
      this.islandGroup.add(tree);

      const trunkBounds = new THREE.Box3(
        new THREE.Vector3(x - 0.5, 0, z - 0.5),
        new THREE.Vector3(x + 0.5, 10, z + 0.5)
      );
      this.treeColliders.push({ mesh: tree, bounds: trunkBounds });
      // 树木不注册碰撞（避免空气墙）
    }
  },

  createRocks() {
    // 10块大型岩石（变形Dodecahedron）
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 75 + Math.random() * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(2 + Math.random() * 3, 0),
        new THREE.MeshLambertMaterial({ color: 0x5a5a5a + Math.floor(Math.random() * 0x202020) })
      );
      rock.name = 'islandRock_large_' + i;
      rock.position.set(x, 1, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.scale.set(1 + Math.random(), 0.5 + Math.random() * 0.5, 1 + Math.random());
      rock.castShadow = true;
      this.islandGroup.add(rock);
    }

    // 30块小型碎石
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const pebble = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.4, 0),
        new THREE.MeshLambertMaterial({ color: 0x6a6a6a + Math.floor(Math.random() * 0x101010) })
      );
      pebble.name = 'islandRock_pebble_' + i;
      pebble.position.set(x, 0.1, z);
      pebble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      this.islandGroup.add(pebble);
    }
  },


  // ============================================================
  // 11. 海洋深度设计
  // ============================================================
  createSea() {
    // 海面：800x800 Plane，32x32分段，顶点动画（3层正弦波叠加）
    const seaGeo = new THREE.PlaneGeometry(800, 800, 32, 32);
    seaGeo.rotateX(-Math.PI / 2);
    const seaMat = new THREE.MeshLambertMaterial({
      color: 0x0a3a5a,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.seaMesh = new THREE.Mesh(seaGeo, seaMat);
    this.seaMesh.name = 'islandSea';
    this.seaMesh.position.y = -5;
    this.scene.add(this.seaMesh);

    // 远处：5个雾效岛屿轮廓（模糊圆锥体）
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.5;
      const dist = 300 + Math.random() * 100;
      const fogIsland = new THREE.Mesh(
        new THREE.ConeGeometry(20 + Math.random() * 30, 40 + Math.random() * 20, 8),
        new THREE.MeshLambertMaterial({
          color: 0x1a3a4a,
          transparent: true,
          opacity: 0.3
        })
      );
      fogIsland.name = 'fogIsland_' + i;
      fogIsland.position.set(
        Math.cos(angle) * dist,
        -5,
        Math.sin(angle) * dist
      );
      this.scene.add(fogIsland);
      this.fogIslands.push(fogIsland);
    }

    // 海鸥：10只V形（用Line模拟），有飞行动画
    for (let i = 0; i < 10; i++) {
      const seagull = new THREE.Group();
      seagull.name = 'seagull_' + i;

      // V形翅膀
      const wingGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.5, 0, 0),
        new THREE.Vector3(0, 0.3, 0),
        new THREE.Vector3(1.5, 0, 0)
      ]);
      const wingMat = new THREE.LineBasicMaterial({ color: 0xffffff });
      const wings = new THREE.Line(wingGeo, wingMat);
      seagull.add(wings);

      seagull.position.set(
        (Math.random() - 0.5) * 200,
        20 + Math.random() * 30,
        (Math.random() - 0.5) * 200
      );
      seagull.userData.isSeagull = true;
      seagull.userData.flyRadius = 50 + Math.random() * 100;
      seagull.userData.flySpeed = 0.2 + Math.random() * 0.3;
      seagull.userData.flyAngle = Math.random() * Math.PI * 2;
      seagull.userData.flyHeight = seagull.position.y;
      seagull.userData.wingPhase = Math.random() * Math.PI * 2;
      this.scene.add(seagull);
      this.seagulls.push(seagull);
    }
  },

  // ============================================================
  // NPC系统（保持原有功能）
  // ============================================================
  createNPCs() {
    const patrolRoutes = [
      [{ x: -20, z: -20 }, { x: 20, z: -20 }, { x: 20, z: 20 }, { x: -20, z: 20 }],
      [{ x: -40, z: 0 }, { x: -20, z: 0 }],
      [{ x: 40, z: 0 }, { x: 20, z: 0 }],
      [{ x: 0, z: -40 }, { x: 0, z: -20 }],
      [{ x: 0, z: 40 }, { x: 0, z: 20 }],
      [{ x: -30, z: -30 }, { x: 30, z: 30 }]
    ];

    for (let i = 0; i < 6; i++) {
      const config = this.soldierConfigs[i];
      const npc = this.createNPCMesh(config.color);
      const startPos = patrolRoutes[i][0];
      npc.position.set(startPos.x, -0.15, startPos.z);
      this.islandGroup.add(npc);

      this.npcs.push({
        mesh: npc,
        route: patrolRoutes[i],
        currentPoint: 0,
        speed: 1.5 + Math.random() * 1.5,
        waitTime: 0,
        isWaiting: false,
        facingPlayer: false,
        index: i,
        isFishingNPC: false,
        name: config.name,
        title: config.title,
        dialogues: [
          '欢迎来到孤岛基地，这里是安全区。',
          '指挥官在指挥中心，有需要可以去找他。',
          '海上的风景不错吧？不过别游太远。',
          '我们24小时巡逻，确保基地安全。',
          '仓库里有补给，需要的话去领取。',
          '停机坪偶尔有直升机运送物资。'
        ]
      });
    }

    this.createFishingNPC();
  },

  fishingQuestState: 'not_started',
  fishingNPC: null,
  mutationQuestState: 'not_started',
  mutationNPC: null,

  createFishingNPC() {
    const npc = this.createFishermanMesh();
    npc.position.set(8, -0.15, 72);
    this.islandGroup.add(npc);

    this.fishingNPC = {
      mesh: npc,
      route: [{ x: 8, z: 72 }, { x: 5, z: 75 }],
      currentPoint: 0,
      speed: 0.8,
      waitTime: 0,
      isWaiting: false,
      facingPlayer: false,
      index: this.npcs.length,
      isFishingNPC: true,
      name: '老陈',
      title: '渔夫',
      dialogues: [
        '嗨，新来的！我是这里的渔夫老陈。',
        '基地的食物储备不太够了，需要补充些海鲜。',
        '码头有潜艇，你可以驾驶它去海里捕鱼。',
        '用渔网、鱼雷或者声呐都可以捕鱼，各有特色！'
      ]
    };
    this.npcs.push(this.fishingNPC);
  },

  createMutationNPC() {
    const npc = this.createNPCMesh(0xffffff);
    npc.position.set(-5, -0.15, -15);
    this.islandGroup.add(npc);

    this.mutationNPC = {
      mesh: npc,
      route: [{ x: -5, z: -15 }, { x: 5, z: -15 }, { x: 5, z: -10 }],
      currentPoint: 0,
      speed: 0.6,
      waitTime: 0,
      isWaiting: false,
      facingPlayer: false,
      index: this.npcs.length,
      isFishingNPC: false,
      isMutationNPC: true,
      name: '林博士',
      title: '研究员',
      dialogues: [
        '你捕回来的鱼确实有问题，它们的细胞发生了异常变异...',
        '经过分析，这些鱼体内有一种未知病毒，而且似乎在快速扩散。病毒源头在深海某处。',
        '我们已经派出侦察队，但大部分潜艇都失联了。我们需要更强大的装备。',
        '根据最后传回的数据，病毒源头在深海深处。你需要驾驶升级后的潜艇前往调查。',
        '准备好了吗？进入潜艇开始任务吧。'
      ]
    };
    this.npcs.push(this.mutationNPC);
  },

  createNPCMesh(color) {
    const group = new THREE.Group();
    group.name = 'islandNPC_soldier';

    const darkColor = new THREE.Color(color).multiplyScalar(0.7).getHex();
    const lightColor = new THREE.Color(color).multiplyScalar(1.2).getHex();

    // === 像素方块人形（参考沙漠地图像素NPC风格） ===

    // 底座阴影
    const shadow = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 1.4), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    shadow.position.y = 0.03;
    group.add(shadow);

    // === 腿部骨骼（Group层级：hip → thigh → calf） ===
    const hipGroup = new THREE.Group();
    hipGroup.position.y = 0.75;
    group.add(hipGroup);

    // 左腿
    const leftThighRoot = new THREE.Group();
    leftThighRoot.position.set(-0.2, 0, 0);
    hipGroup.add(leftThighRoot);
    const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.35), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
    leftThigh.position.y = -0.28;
    leftThigh.castShadow = true;
    leftThighRoot.add(leftThigh);
    const leftCalfRoot = new THREE.Group();
    leftCalfRoot.position.y = -0.55;
    leftThighRoot.add(leftCalfRoot);
    const leftCalf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.3), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    leftCalf.position.y = -0.28;
    leftCalf.castShadow = true;
    leftCalfRoot.add(leftCalf);
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.4), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
    leftBoot.position.y = -0.55;
    leftCalfRoot.add(leftBoot);

    // 右腿
    const rightThighRoot = new THREE.Group();
    rightThighRoot.position.set(0.2, 0, 0);
    hipGroup.add(rightThighRoot);
    const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.35), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
    rightThigh.position.y = -0.28;
    rightThigh.castShadow = true;
    rightThighRoot.add(rightThigh);
    const rightCalfRoot = new THREE.Group();
    rightCalfRoot.position.y = -0.55;
    rightThighRoot.add(rightCalfRoot);
    const rightCalf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.3), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    rightCalf.position.y = -0.28;
    rightCalf.castShadow = true;
    rightCalfRoot.add(rightCalf);
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.4), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
    rightBoot.position.y = -0.55;
    rightCalfRoot.add(rightBoot);

    // === 躯干（方块身体） ===
    const bodyOuter = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.6), new THREE.MeshLambertMaterial({ color: color }));
    bodyOuter.position.y = 1.55;
    bodyOuter.castShadow = true;
    group.add(bodyOuter);
    const bodyInner = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.95, 0.52), new THREE.MeshLambertMaterial({ color: darkColor }));
    bodyInner.position.y = 1.55;
    group.add(bodyInner);
    // 腰带
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.15, 0.65), new THREE.MeshLambertMaterial({ color: 0x3a3a2a }));
    belt.position.y = 1.02;
    group.add(belt);
    // 背包
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), new THREE.MeshLambertMaterial({ color: 0x4a3a2a }));
    backpack.position.set(0, 1.5, -0.35);
    backpack.castShadow = true;
    group.add(backpack);

    // === 手臂骨骼（Group层级：shoulder → upperArm → forearm → hand） ===
    // 左臂
    const leftShoulderRoot = new THREE.Group();
    leftShoulderRoot.position.set(-0.55, 1.95, 0);
    group.add(leftShoulderRoot);
    const leftUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), new THREE.MeshLambertMaterial({ color: color }));
    leftUpperArm.position.y = -0.25;
    leftUpperArm.castShadow = true;
    leftShoulderRoot.add(leftUpperArm);
    const leftForearmRoot = new THREE.Group();
    leftForearmRoot.position.y = -0.5;
    leftShoulderRoot.add(leftForearmRoot);
    const leftForearm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.25), new THREE.MeshLambertMaterial({ color: darkColor }));
    leftForearm.position.y = -0.22;
    leftForearm.castShadow = true;
    leftForearmRoot.add(leftForearm);
    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.22), new THREE.MeshLambertMaterial({ color: 0xccaa88 }));
    leftHand.position.y = -0.45;
    leftForearmRoot.add(leftHand);

    // 右臂
    const rightShoulderRoot = new THREE.Group();
    rightShoulderRoot.position.set(0.55, 1.95, 0);
    group.add(rightShoulderRoot);
    const rightUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), new THREE.MeshLambertMaterial({ color: color }));
    rightUpperArm.position.y = -0.25;
    rightUpperArm.castShadow = true;
    rightShoulderRoot.add(rightUpperArm);
    const rightForearmRoot = new THREE.Group();
    rightForearmRoot.position.y = -0.5;
    rightShoulderRoot.add(rightForearmRoot);
    const rightForearm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.45, 0.25), new THREE.MeshLambertMaterial({ color: darkColor }));
    rightForearm.position.y = -0.22;
    rightForearm.castShadow = true;
    rightForearmRoot.add(rightForearm);
    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.22), new THREE.MeshLambertMaterial({ color: 0xccaa88 }));
    rightHand.position.y = -0.45;
    rightForearmRoot.add(rightHand);

    // === 头部（方块头+头盔） ===
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), new THREE.MeshLambertMaterial({ color: 0xffccaa }));
    head.position.y = 2.35;
    head.castShadow = true;
    group.add(head);
    // 面部（前方薄方块）
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), new THREE.MeshBasicMaterial({ color: 0xffccaa }));
    face.position.set(0, 2.35, 0.28);
    group.add(face);
    // 眼睛
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    eyeL.position.set(-0.12, 2.4, 0.31);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    eyeR.position.set(0.12, 2.4, 0.31);
    group.add(eyeR);
    // 嘴巴
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.06), new THREE.MeshBasicMaterial({ color: 0xaa7755 }));
    mouth.position.set(0, 2.22, 0.31);
    group.add(mouth);
    // 头盔
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.65), new THREE.MeshLambertMaterial({ color: 0x3a4a3a }));
    helmet.position.y = 2.55;
    helmet.castShadow = true;
    group.add(helmet);
    const helmetBrim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.8), new THREE.MeshLambertMaterial({ color: 0x2a3a2a }));
    helmetBrim.position.set(0, 2.35, 0);
    group.add(helmetBrim);

    // === 步枪（方块化） ===
    const rifleGroup = new THREE.Group();
    rifleGroup.name = 'npc_rifle';
    const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 1.0), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
    rifleGroup.add(rifleBody);
    const rifleStock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.3), new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
    rifleStock.position.z = -0.6;
    rifleGroup.add(rifleStock);
    const rifleBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.3), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    rifleBarrel.position.z = 0.6;
    rifleGroup.add(rifleBarrel);
    const rifleMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    rifleMag.position.set(0, -0.15, 0.05);
    rifleGroup.add(rifleMag);
    const rifleScope = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.15), new THREE.MeshLambertMaterial({ color: 0x444444 }));
    rifleScope.position.set(0, 0.1, 0.1);
    rifleGroup.add(rifleScope);
    // 步枪挂在胸前（不是手臂上），枪管朝前下方
    rifleGroup.position.set(0.30, 1.35, 0.30);
    rifleGroup.rotation.x = -0.25;
    group.add(rifleGroup);

    // === 注册骨骼引用 ===
    group.userData.leftThigh = leftThighRoot;
    group.userData.leftCalf = leftCalfRoot;
    group.userData.rightThigh = rightThighRoot;
    group.userData.rightCalf = rightCalfRoot;
    group.userData.leftUpperArm = leftShoulderRoot;
    group.userData.leftForearm = leftForearmRoot;
    group.userData.rightUpperArm = rightShoulderRoot;
    group.userData.rightForearm = rightForearmRoot;
    group.userData.body = bodyOuter;
    group.userData.head = head;
    group.userData.rifle = rifleGroup;
    group.userData.origBodyY = 1.55; // 原始body Y，动画用相对偏移

    return group;
  },

  createFishermanMesh() {
    const group = new THREE.Group();
    group.name = 'islandNPC_fisherman';

    // ===== 材质定义 =====
    const skinColor = 0xcc9966;
    const hatColor = 0xd4b87a;
    const shirtColor = 0xdd8833;
    const pantsColor = 0x4a5a3a;
    const basketColor = 0x8a6a3a;
    const rodColor = 0x7a5a3a;
    const eyeWhiteColor = 0xf0e8d8;
    const eyePupilColor = 0x1a1208;
    const mouthColor = 0xaa6644;
    const beardColor = 0x888888;
    const darkBrown = 0x5a3a1a;
    const strawDark = 0xc4a86a;
    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });

    // ===== 头部组（可动画）y=1.78：头底贴身体顶 =====
    const headGroup = new THREE.Group();
    headGroup.name = 'fisherman_headGroup';
    headGroup.position.y = 1.78;
    group.add(headGroup);

    // 头：0.16×0.18×0.16（比身体窄）
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.16), skinMat);
    head.name = 'fisherman_head';
    head.castShadow = true;
    headGroup.add(head);

    // 脖子：加高加粗，明显可见
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.08), skinMat);
    neck.position.y = -0.14;
    headGroup.add(neck);

    // ---- 草帽帽顶 ----
    const hatTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.06, 0.13),
      new THREE.MeshLambertMaterial({ color: hatColor })
    );
    hatTop.position.y = 0.11;
    hatTop.castShadow = true;
    headGroup.add(hatTop);

    // 帽檐：4片倾斜拼接，模拟弧形（不再是一块平板）
    const brimMat = new THREE.MeshLambertMaterial({ color: strawDark });
    // 前檐
    const brimF = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.015, 0.06), brimMat);
    brimF.position.set(0, 0.07, 0.10);
    brimF.rotation.x = -0.25;
    headGroup.add(brimF);
    // 后檐
    const brimB = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.015, 0.06), brimMat);
    brimB.position.set(0, 0.07, -0.10);
    brimB.rotation.x = 0.15;
    headGroup.add(brimB);
    // 左檐
    const brimL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.20), brimMat);
    brimL.position.set(-0.10, 0.07, 0);
    brimL.rotation.z = 0.20;
    headGroup.add(brimL);
    // 右檐
    const brimR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.20), brimMat);
    brimR.position.set(0.10, 0.07, 0);
    brimR.rotation.z = -0.20;
    headGroup.add(brimR);

    const hatBand = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.015, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xcc5533 })
    );
    hatBand.position.y = 0.02;
    headGroup.add(hatBand);

    // ---- 面部细节 ----
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: eyeWhiteColor });
    const eyeWL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.012), eyeWhiteMat);
    eyeWL.position.set(-0.045, 0.01, 0.085);
    headGroup.add(eyeWL);
    const eyeWR = eyeWL.clone(); eyeWR.position.x = 0.045;
    headGroup.add(eyeWR);

    const pupilMat = new THREE.MeshBasicMaterial({ color: eyePupilColor });
    const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.015), pupilMat);
    pupilL.position.set(-0.045, 0.01, 0.092);
    headGroup.add(pupilL);
    const pupilR = pupilL.clone(); pupilR.position.x = 0.045;
    headGroup.add(pupilR);

    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.012, 0.008),
      new THREE.MeshBasicMaterial({ color: mouthColor })
    );
    mouth.position.set(0, -0.055, 0.085);
    headGroup.add(mouth);

    const beard = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.035, 0.015),
      new THREE.MeshLambertMaterial({ color: beardColor })
    );
    beard.position.set(0, -0.09, 0.082);
    headGroup.add(beard);

    // ===== 躯干 y=1.48（0.24×0.36×0.14，更修长不那么方） =====
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.14), shirtMat);
    body.name = 'fisherman_body';
    body.position.y = 1.48;
    body.castShadow = true;
    group.add(body);

    // 内层背心（深色，增加层次）
    const vest = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.22, 0.145),
      new THREE.MeshLambertMaterial({ color: 0xcc7722 })
    );
    vest.position.set(0, 1.50, 0);
    group.add(vest);

    // 领口
    const collar = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.025, 0.008),
      new THREE.MeshBasicMaterial({ color: 0xbb7733 })
    );
    collar.position.set(0, 1.62, 0.075);
    group.add(collar);

    // 腰带
    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.04, 0.16),
      new THREE.MeshLambertMaterial({ color: darkBrown })
    );
    belt.position.y = 1.28;
    group.add(belt);

    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.025, 0.012),
      new THREE.MeshBasicMaterial({ color: 0xcccc99 })
    );
    buckle.position.set(0, 1.28, 0.085);
    group.add(buckle);

    // ===== 鱼篓（后背，缩小避免穿模） =====
    const basketGroup = new THREE.Group();
    basketGroup.name = 'fisherman_basket';
    basketGroup.position.set(0, 1.38, -0.10);
    group.add(basketGroup);

    const basketBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.16, 0.05),
      new THREE.MeshLambertMaterial({ color: basketColor })
    );
    basketBody.castShadow = true;
    basketGroup.add(basketBody);

    const stripMat = new THREE.MeshLambertMaterial({ color: 0x7a5a2a });
    for (let i = -1; i <= 1; i++) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.06), stripMat);
      strip.position.y = i * 0.05;
      basketGroup.add(strip);
    }

    const rimTop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.07), new THREE.MeshLambertMaterial({ color: darkBrown }));
    rimTop.position.y = 0.09;
    basketGroup.add(rimTop);

    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.24, 0.012), new THREE.MeshLambertMaterial({ color: darkBrown }));
    strapL.position.set(-0.09, 0.06, 0.03);
    basketGroup.add(strapL);
    const strapR = strapL.clone(); strapR.position.x = 0.09;
    basketGroup.add(strapR);

    // ===== 左臂（肩膀x=±0.13，加长到0.45，自然下垂） =====
    const leftShoulder = new THREE.Group();
    leftShoulder.name = 'fisherman_leftShoulder';
    leftShoulder.position.set(-0.13, 1.62, 0);
    group.add(leftShoulder);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), skinMat);
    leftArm.position.y = -0.20;
    leftArm.castShadow = true;
    leftShoulder.add(leftArm);

    const leftSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.08), shirtMat);
    leftSleeve.position.y = 0.02;
    leftShoulder.add(leftSleeve);

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), skinMat);
    leftHand.position.y = -0.45;
    leftShoulder.add(leftHand);

    // ===== 右臂 =====
    const rightShoulder = new THREE.Group();
    rightShoulder.name = 'fisherman_rightShoulder';
    rightShoulder.position.set(0.13, 1.62, 0);
    group.add(rightShoulder);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), skinMat);
    rightArm.position.y = -0.20;
    rightArm.castShadow = true;
    rightShoulder.add(rightArm);

    const rightSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.08), shirtMat);
    rightSleeve.position.y = 0.02;
    rightShoulder.add(rightSleeve);

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), skinMat);
    rightHand.position.y = -0.45;
    rightShoulder.add(rightHand);

    // ===== 鱼竿（握在右手中） =====
    const rodGroup = new THREE.Group();
    rodGroup.name = 'fisherman_rodGroup';
    rodGroup.position.set(0, -0.45, 0);
    rightShoulder.add(rodGroup);

    const rod = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.90, 0.018),
      new THREE.MeshLambertMaterial({ color: rodColor })
    );
    rod.name = 'fisherman_rod';
    rod.position.set(0, 0.20, -0.18);
    rod.rotation.x = -0.80;
    rod.castShadow = true;
    rodGroup.add(rod);

    const rodTip = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.08, 0.012),
      new THREE.MeshLambertMaterial({ color: 0x8a6a3a })
    );
    rodTip.position.set(0, 0.65, -0.48);
    rodTip.rotation.x = -0.80;
    rodGroup.add(rodTip);

    const rodHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.10, 0.025),
      new THREE.MeshLambertMaterial({ color: 0x4a2a0a })
    );
    rodHandle.position.set(0, -0.02, -0.01);
    rodGroup.add(rodHandle);

    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.30, 0.003),
      new THREE.MeshBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.5 })
    );
    line.name = 'fisherman_line';
    line.position.set(0, 0.38, -0.54);
    rodGroup.add(line);

    const hook = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.025, 0.012),
      new THREE.MeshBasicMaterial({ color: 0x888888 })
    );
    hook.position.set(0, 0.22, -0.54);
    rodGroup.add(hook);

    // ===== 左腿（层级：hip -> thigh -> calf，与士兵一致） =====
    const leftHip = new THREE.Group();
    leftHip.name = 'fisherman_leftHip';
    leftHip.position.set(-0.07, 0.75, 0);
    group.add(leftHip);

    const leftThigh = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.50, 0.10), pantsMat);
    leftThigh.position.y = -0.25;
    leftThigh.castShadow = true;
    leftHip.add(leftThigh);

    const leftCalf = new THREE.Group();
    leftCalf.name = 'fisherman_leftCalf';
    leftCalf.position.y = -0.50;
    leftHip.add(leftCalf);

    const leftCalfMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.50, 0.09), pantsMat);
    leftCalfMesh.position.y = -0.25;
    leftCalfMesh.castShadow = true;
    leftCalf.add(leftCalfMesh);

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.07, 0.16), skinMat);
    leftFoot.position.y = -0.50;
    leftFoot.position.z = 0.02;
    leftCalf.add(leftFoot);

    // ===== 右腿（完全对称） =====
    const rightHip = new THREE.Group();
    rightHip.name = 'fisherman_rightHip';
    rightHip.position.set(0.07, 0.75, 0);
    group.add(rightHip);

    const rightThigh = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.50, 0.10), pantsMat);
    rightThigh.position.y = -0.25;
    rightThigh.castShadow = true;
    rightHip.add(rightThigh);

    const rightCalf = new THREE.Group();
    rightCalf.name = 'fisherman_rightCalf';
    rightCalf.position.y = -0.50;
    rightHip.add(rightCalf);

    const rightCalfMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.50, 0.09), pantsMat);
    rightCalfMesh.position.y = -0.25;
    rightCalfMesh.castShadow = true;
    rightCalf.add(rightCalfMesh);

    const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.07, 0.16), skinMat);
    rightFoot.position.y = -0.50;
    rightFoot.position.z = 0.02;
    rightCalf.add(rightFoot);

    // ===== 存储骨骼引用（兼容士兵动画系统） =====
    group.userData = {
      headGroup: headGroup,
      body: body,
      leftShoulder: leftShoulder,
      rightShoulder: rightShoulder,
      leftHip: leftHip,
      rightHip: rightHip,
      leftThigh: leftThigh,
      rightThigh: rightThigh,
      leftCalf: leftCalf,
      rightCalf: rightCalf,
      rodGroup: rodGroup,
      line: line,
      origBodyY: 1.48
    };

    return group;
  },

  createInteractPrompt() {
    this.interactPrompt = document.createElement('div');
    this.interactPrompt.id = 'npc-interact-prompt';
    this.interactPrompt.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);padding:8px 16px;background:rgba(0,0,0,0.7);border:1px solid #44ff88;border-radius:8px;color:#44ff88;font-family:"Microsoft YaHei",sans-serif;font-size:14px;z-index:5000;display:none;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(this.interactPrompt);
  },

  setupKeyListeners() {
    this._onKeyDown = (e) => {
      this.keysPressed[e.code] = true;
      if (e.code === 'KeyE') {
        this.handleInteractKey();
      }
    };
    this._onKeyUp = (e) => {
      this.keysPressed[e.code] = false;
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  },

  handleInteractKey() {
    if (!this.active) return;
    const playerPos = this.camera ? this.camera.position : new THREE.Vector3();
    for (const npc of this.npcs) {
      const dist = npc.mesh.position.distanceTo(playerPos);
      if (dist < 3 && typeof this.showNPCDialog === 'function') {
        this.showNPCDialog(npc.index);
        break;
      }
    }
  },

  // ============================================================
  // 更新系统
  // ============================================================
  update(dt) {
    if (!this.active) return;
    this.seaTime += dt;

    this.updateSea(dt);
    this.updateNPCs(dt);
    this.updateCollisions();
    this.updateBlinkingLights(dt);
    this.updateInteractPrompt();
    this.updateAnimations(dt);
    this.updateAntiAirGuns(dt);
  },

  updateSea(dt) {
    if (!this.seaMesh) return;

    // 3层正弦波叠加
    const positions = this.seaMesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const wave1 = Math.sin(x * 0.05 + this.seaTime * 1.5) * 0.8;
      const wave2 = Math.cos(z * 0.03 + this.seaTime * 1.0) * 0.5;
      const wave3 = Math.sin((x + z) * 0.02 + this.seaTime * 0.8) * 0.3;
      positions.setY(i, wave1 + wave2 + wave3);
    }
    positions.needsUpdate = true;

    // 反光效果：白色条纹动画
    const reflectIntensity = (Math.sin(this.seaTime * 0.5) + 1) * 0.1;
    this.seaMesh.material.emissive = new THREE.Color(0x0a3a5a);
    this.seaMesh.material.emissiveIntensity = reflectIntensity;
  },

  updateAnimations(dt) {
    const time = this.seaTime;

    this.animatedObjects.forEach(obj => {
      if (obj.userData.isRadar) {
        // 雷达旋转
        obj.rotation.y += dt * 2;
      } else if (obj.userData.isFlag) {
        // 旗帜飘动
        const positions = obj.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          if (x > 0) {
            const wave = Math.sin(x * 2 + time * 3) * 0.2 * (x / 3);
            positions.setZ(i, wave);
          }
        }
        positions.needsUpdate = true;
      } else if (obj.userData.isSearchlight) {
        // 探照灯扫描
        const idx = obj.userData.lightIndex || 0;
        const scanAngle = Math.sin(time * 0.5 + idx) * Math.PI / 3;
        obj.rotation.y = scanAngle;
      } else if (obj.userData.isNavLight) {
        // 导航灯闪烁
        const idx = obj.userData.lightIndex || 0;
        const blink = (Math.sin(time * 2 + idx * 0.8) + 1) / 2;
        obj.material.opacity = blink;
        obj.scale.setScalar(0.5 + blink * 0.5);
      } else if (obj.userData.isWire) {
        // 铁丝网晃动
        const basePoints = obj.userData.basePoints;
        if (basePoints && obj.geometry) {
          const positions = obj.geometry.attributes.position;
          for (let i = 0; i < positions.count; i++) {
            const bp = basePoints[i];
            const sway = Math.sin(time * 2 + obj.userData.wireOffset + i * 0.5) * 0.05;
            positions.setX(i, bp.x + sway);
          }
          positions.needsUpdate = true;
        }
      } else if (obj.userData.isPalmLeaf) {
        // 棕榈叶摆动
        const baseRot = obj.userData.baseRotation;
        obj.rotation.z = baseRot.z + Math.sin(time * 1.5 + obj.userData.leafIndex) * 0.1;
      } else if (obj.userData.isCloth) {
        // 衣服飘动
        obj.rotation.y = Math.sin(time * 2 + obj.userData.swayOffset) * 0.2;
      }
    });

    // 草地摆动
    this.grassPatches.forEach(grass => {
      const baseRot = grass.userData.baseRotation;
      grass.rotation.z = baseRot.z + Math.sin(time * grass.userData.swaySpeed + grass.userData.swayOffset) * 0.1;
    });

    // 海鸥飞行动画
    this.seagulls.forEach(gull => {
      gull.userData.flyAngle += gull.userData.flySpeed * dt;
      const r = gull.userData.flyRadius;
      gull.position.x = Math.cos(gull.userData.flyAngle) * r;
      gull.position.z = Math.sin(gull.userData.flyAngle) * r;
      gull.position.y = gull.userData.flyHeight + Math.sin(time + gull.userData.wingPhase) * 2;
      gull.rotation.y = -gull.userData.flyAngle;

      // 翅膀扇动
      const wingFlap = Math.sin(time * 5 + gull.userData.wingPhase) * 0.3;
      gull.children[0].rotation.z = wingFlap;
    });
  },

  // ====== 高射炮更新（扫描+发射效果） ======
  updateAntiAirGuns(dt) {
    if (!this.antiAirGuns) return;
    const time = this.seaTime;

    this.antiAirGuns.forEach(gun => {
      const data = gun.userData;
      if (data.destroyed) return;

      // 扫描动画：左右摆动
      data.scanAngle += data.scanSpeed * dt;
      gun.rotation.y = Math.sin(data.scanAngle) * Math.PI / 3;

      // 发射计时
      data.fireTimer += dt;
      if (data.fireTimer >= data.fireInterval) {
        data.fireTimer = 0;
        this._fireAntiAirGun(gun);
      }

      // 血量条始终面向相机
      if (data.hpBar) {
        data.hpBar.lookAt(this.camera.position);
        data.hpBar.rotateY(Math.PI);
      }
    });
  },

  _fireAntiAirGun(gun) {
    // 炮口闪光效果
    const flash = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 })
    );
    // 闪光位置在炮口
    const gunRot = gun.rotation.y;
    flash.position.set(
      gun.position.x + Math.sin(gunRot) * 1.5,
      gun.position.y + 2.8,
      gun.position.z + Math.cos(gunRot) * 1.5
    );
    this.islandGroup.add(flash);

    // 闪光快速消失
    let flashLife = 0.1;
    const flashInterval = setInterval(() => {
      flashLife -= 0.02;
      flash.scale.setScalar(1 + (0.1 - flashLife) * 10);
      flash.material.opacity = flashLife / 0.1;
      if (flashLife <= 0) {
        clearInterval(flashInterval);
        this.islandGroup.remove(flash);
      }
    }, 20);

    // 后坐力震动
    gun.position.y -= 0.05;
    setTimeout(() => { gun.position.y += 0.05; }, 100);
  },

  // ====== 高射炮受到伤害 ======
  damageAntiAirGun(gun, damage) {
    const data = gun.userData;
    if (data.destroyed) return;
    data.hp = Math.max(0, data.hp - damage);

    // 更新血量条
    if (data.hpBar) {
      const ratio = data.hp / data.maxHp;
      data.hpBar.scale.x = ratio;
      if (ratio > 0.5) data.hpBar.material.color.setHex(0x00ff00);
      else if (ratio > 0.25) data.hpBar.material.color.setHex(0xffaa00);
      else data.hpBar.material.color.setHex(0xff0000);
    }

    // 被摧毁
    if (data.hp <= 0) {
      data.destroyed = true;
      gun.rotation.x = Math.PI / 2; // 倒下
      gun.position.y -= 0.5;
      if (data.hpBar) data.hpBar.visible = false;
    }
  },

  updateNPCs(dt) {
    const playerPos = this.camera ? this.camera.position : new THREE.Vector3();

    this.npcs.forEach(npc => {
      // NPC跟随地形高度，脚贴合地面（靴子底部在中心下方约0.45）
      const terrainH = this.getTerrainHeight(npc.mesh.position.x, npc.mesh.position.z);
      npc.mesh.position.y = terrainH + 0.45;

      const distToPlayer = npc.mesh.position.distanceTo(playerPos);

      if (distToPlayer < 3) {
        npc.facingPlayer = true;
        npc.mesh.lookAt(playerPos.x, npc.mesh.position.y, playerPos.z);
        // 站立时播放待机动画（呼吸、头部微动）
        this._playNPCIdleAnimation(npc);
        return;
      } else {
        npc.facingPlayer = false;
      }

      if (npc.isWaiting) {
        npc.waitTime -= dt;
        if (npc.waitTime <= 0) {
          npc.isWaiting = false;
          npc.currentPoint = (npc.currentPoint + 1) % npc.route.length;
        }
        // 等待时播放待机动画
        this._playNPCIdleAnimation(npc);
        return;
      }

      const target = npc.route[npc.currentPoint];
      const targetPos = new THREE.Vector3(target.x, npc.mesh.position.y, target.z);
      const direction = new THREE.Vector3().subVectors(targetPos, npc.mesh.position);
      const distance = direction.length();

      if (distance < 0.5) {
        npc.isWaiting = true;
        npc.waitTime = 1 + Math.random() * 2;
        return;
      }

      direction.normalize();
      npc.mesh.position.add(direction.multiplyScalar(npc.speed * dt));
      npc.mesh.lookAt(targetPos.x, npc.mesh.position.y, targetPos.z);

      // 走路动画
      const walkCycle = Math.sin(Date.now() * 0.005 + npc.index) * 0.3;

      if (npc.mesh.userData.leftThigh && npc.mesh.userData.leftCalf) {
        npc.mesh.userData.leftThigh.rotation.x = walkCycle;
        npc.mesh.userData.leftCalf.rotation.x = walkCycle > 0 ? walkCycle * 0.5 : 0;
        npc.mesh.userData.rightThigh.rotation.x = -walkCycle;
        npc.mesh.userData.rightCalf.rotation.x = -walkCycle > 0 ? -walkCycle * 0.5 : 0;
      } else if (npc.mesh.userData.leftHip && npc.mesh.userData.rightHip) {
        // 老陈方块模型：髋关节摆动
        npc.mesh.userData.leftHip.rotation.x = walkCycle;
        npc.mesh.userData.rightHip.rotation.x = -walkCycle;
      } else if (npc.mesh.userData.leftLeg) {
        npc.mesh.userData.leftLeg.rotation.x = walkCycle;
        npc.mesh.userData.rightLeg.rotation.x = -walkCycle;
      }

      if (npc.mesh.userData.leftUpperArm && npc.mesh.userData.leftForearm) {
        npc.mesh.userData.leftUpperArm.rotation.x = -walkCycle * 0.5;
        npc.mesh.userData.leftForearm.rotation.x = -walkCycle * 0.3;
        npc.mesh.userData.rightUpperArm.rotation.x = walkCycle * 0.5;
        npc.mesh.userData.rightForearm.rotation.x = walkCycle * 0.3;
      } else if (npc.mesh.userData.leftShoulder && npc.mesh.userData.rightShoulder) {
        // 老陈方块模型：肩关节摆动 + 鱼竿跟随
        npc.mesh.userData.leftShoulder.rotation.x = -walkCycle * 0.5;
        npc.mesh.userData.rightShoulder.rotation.x = walkCycle * 0.5;
        // 鱼竿轻微晃动
        if (npc.mesh.userData.rodGroup) {
          npc.mesh.userData.rodGroup.rotation.z = 0.3 + Math.sin(Date.now() * 0.003) * 0.05;
        }
      } else if (npc.mesh.userData.leftArm) {
        npc.mesh.userData.leftArm.rotation.x = -walkCycle * 0.5;
        npc.mesh.userData.rightArm.rotation.x = walkCycle * 0.5;
      }

      // 头部轻微跟随步伐摆动
      if (npc.mesh.userData.headGroup) {
        npc.mesh.userData.headGroup.rotation.y = Math.sin(Date.now() * 0.002 + npc.index) * 0.05;
        npc.mesh.userData.headGroup.rotation.z = Math.sin(Date.now() * 0.004 + npc.index) * 0.02;
      }

      // body位置保持原始值（不同NPC模型原始Y不同）
      if (npc.mesh.userData.body && npc.mesh.userData.origBodyY) {
        npc.mesh.userData.body.position.y = npc.mesh.userData.origBodyY;
      }
    });
  },

  _resetNPCLimbRotation(npc) {
    if (npc.mesh.userData.leftThigh) npc.mesh.userData.leftThigh.rotation.x = 0;
    if (npc.mesh.userData.leftCalf) npc.mesh.userData.leftCalf.rotation.x = 0;
    if (npc.mesh.userData.rightThigh) npc.mesh.userData.rightThigh.rotation.x = 0;
    if (npc.mesh.userData.rightCalf) npc.mesh.userData.rightCalf.rotation.x = 0;
    if (npc.mesh.userData.leftHip) npc.mesh.userData.leftHip.rotation.x = 0;
    if (npc.mesh.userData.rightHip) npc.mesh.userData.rightHip.rotation.x = 0;
    if (npc.mesh.userData.leftLeg) npc.mesh.userData.leftLeg.rotation.x = 0;
    if (npc.mesh.userData.rightLeg) npc.mesh.userData.rightLeg.rotation.x = 0;
    if (npc.mesh.userData.leftUpperArm) npc.mesh.userData.leftUpperArm.rotation.x = 0;
    if (npc.mesh.userData.leftForearm) npc.mesh.userData.leftForearm.rotation.x = 0;
    if (npc.mesh.userData.rightUpperArm) npc.mesh.userData.rightUpperArm.rotation.x = 0;
    if (npc.mesh.userData.rightForearm) npc.mesh.userData.rightForearm.rotation.x = 0;
    if (npc.mesh.userData.leftShoulder) npc.mesh.userData.leftShoulder.rotation.x = 0;
    if (npc.mesh.userData.rightShoulder) npc.mesh.userData.rightShoulder.rotation.x = 0;
    if (npc.mesh.userData.leftArm) npc.mesh.userData.leftArm.rotation.x = 0;
    if (npc.mesh.userData.rightArm) npc.mesh.userData.rightArm.rotation.x = 0;
    if (npc.mesh.userData.headGroup) {
      npc.mesh.userData.headGroup.rotation.y = 0;
      npc.mesh.userData.headGroup.rotation.z = 0;
    }
    if (npc.mesh.userData.rodGroup) npc.mesh.userData.rodGroup.rotation.z = 0.3;
  },

  // 待机动画：呼吸、头部微动、鱼竿轻摆
  _playNPCIdleAnimation(npc) {
    const t = Date.now() * 0.001;
    const idx = npc.index || 0;

    // 呼吸：躯干轻微缩放
    if (npc.mesh.userData.body) {
      const breath = 1 + Math.sin(t * 2 + idx) * 0.008;
      npc.mesh.userData.body.scale.set(1, breath, 1);
    }

    // 头部微动：左右轻微转动 + 上下点头
    if (npc.mesh.userData.headGroup) {
      npc.mesh.userData.headGroup.rotation.y = Math.sin(t * 0.7 + idx) * 0.08;
      npc.mesh.userData.headGroup.rotation.x = Math.sin(t * 0.5 + idx * 2) * 0.03;
    }

    // 手臂自然下垂微摆
    if (npc.mesh.userData.leftShoulder && npc.mesh.userData.rightShoulder) {
      npc.mesh.userData.leftShoulder.rotation.x = Math.sin(t * 1.2 + idx) * 0.03;
      npc.mesh.userData.rightShoulder.rotation.x = Math.sin(t * 1.2 + idx + 1) * 0.03;
    } else if (npc.mesh.userData.leftArm && npc.mesh.userData.rightArm) {
      npc.mesh.userData.leftArm.rotation.x = Math.sin(t * 1.2 + idx) * 0.03;
      npc.mesh.userData.rightArm.rotation.x = Math.sin(t * 1.2 + idx + 1) * 0.03;
    }

    // 鱼竿轻摆
    if (npc.mesh.userData.rodGroup) {
      npc.mesh.userData.rodGroup.rotation.z = 0.3 + Math.sin(t * 1.5 + idx) * 0.08;
      npc.mesh.userData.rodGroup.rotation.x = Math.sin(t * 0.8 + idx) * 0.04;
    }

    // 身体整体轻微上下浮动（呼吸感），基于原始Y
    if (npc.mesh.userData.body && npc.mesh.userData.origBodyY) {
      npc.mesh.userData.body.position.y = npc.mesh.userData.origBodyY + Math.sin(t * 2 + idx) * 0.003;
    }
  },

  // ============================================================
  // 12. 碰撞体系统 - 注册到 game.js 全局碰撞系统
  // ============================================================
  _registerBox3Collider(bounds, type, solid, shrinkRatio) {
    if (!bounds || typeof addCollider !== 'function') return;
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    // shrinkRatio: 缩小碰撞体范围，使内部空间可通行（如 0.85 表示缩小到85%）
    const ratio = shrinkRatio || 1.0;
    addCollider(center.x, center.z, (size.x / 2) * ratio, (size.z / 2) * ratio, center.y + size.y / 2, type, solid);
  },

  _registerMeshCollider(mesh, type, solid) {
    if (!mesh || typeof addCollider !== 'function') return;
    const box = new THREE.Box3().setFromObject(mesh);
    this._registerBox3Collider(box, type, solid);
  },

  // ====== 高射炮创建 ======
  _createAntiAirGun(x, z) {
    const gunGroup = new THREE.Group();
    gunGroup.name = 'antiAirGun_' + x + '_' + z;
    gunGroup.position.set(x, 0, z);

    const greenMat = new THREE.MeshLambertMaterial({ color: 0x3d4a2e });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
    const concreteMat = new THREE.MeshLambertMaterial({ color: 0x777777 });

    // === 1. 混凝土底座（八角形，用方块堆叠） ===
    const base1 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.3, 3.0), concreteMat);
    base1.position.y = 0.15;
    base1.castShadow = true;
    gunGroup.add(base1);
    const base2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 2.6), concreteMat);
    base2.position.y = 0.45;
    base2.castShadow = true;
    gunGroup.add(base2);

    // === 2. 旋转平台（绿色方块） ===
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 2.0), greenMat);
    platform.position.y = 0.75;
    platform.castShadow = true;
    gunGroup.add(platform);

    // === 3. 炮塔主体（方块装甲） ===
    const turretBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.4), greenMat);
    turretBody.position.y = 1.30;
    turretBody.castShadow = true;
    gunGroup.add(turretBody);

    // === 4. 双管炮管（两根平行金属管，向上倾斜45度） ===
    // 左炮管
    const barrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.5, 6), darkMat);
    barrelL.rotation.x = Math.PI / 4;
    barrelL.position.set(-0.2, 2.2, -0.4);
    gunGroup.add(barrelL);
    // 右炮管
    const barrelR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.5, 6), darkMat);
    barrelR.rotation.x = Math.PI / 4;
    barrelR.position.set(0.2, 2.2, -0.4);
    gunGroup.add(barrelR);

    // 炮口制退器（左）
    const muzzleL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.12), metalMat);
    muzzleL.position.set(-0.2, 3.0, -1.0);
    gunGroup.add(muzzleL);
    // 炮口制退器（右）
    const muzzleR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.12), metalMat);
    muzzleR.position.set(0.2, 3.0, -1.0);
    gunGroup.add(muzzleR);

    // === 5. 炮管支架（连接双管的金属块） ===
    const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), metalMat);
    mount1.position.set(0, 1.85, -0.1);
    mount1.rotation.x = 0.3;
    gunGroup.add(mount1);
    const mount2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.3), metalMat);
    mount2.position.set(0, 2.0, -0.6);
    mount2.rotation.x = 0.6;
    gunGroup.add(mount2);

    // === 6. 弹药箱（炮塔后方） ===
    const ammoBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.8), greenMat);
    ammoBox.position.set(0, 1.0, 0.8);
    gunGroup.add(ammoBox);
    // 弹药箱盖
    const ammoLid = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.85), darkMat);
    ammoLid.position.set(0, 1.29, 0.8);
    gunGroup.add(ammoLid);

    // === 7. 装甲板（炮塔两侧） ===
    const armorL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.8), greenMat);
    armorL.position.set(-0.85, 1.35, 0.2);
    gunGroup.add(armorL);
    const armorR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, 0.8), greenMat);
    armorR.position.set(0.85, 1.35, 0.2);
    gunGroup.add(armorR);

    // === 8. 瞄准器（小块金属） ===
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), metalMat);
    sight.position.set(0, 1.75, -0.3);
    gunGroup.add(sight);

    // === 9. 血量条 ===
    const hpBg = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.2), new THREE.MeshBasicMaterial({ color: 0x330000 }));
    hpBg.position.set(0, 3.8, 0);
    hpBg.rotation.x = -Math.PI / 6;
    gunGroup.add(hpBg);

    const hpBar = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.15), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
    hpBar.position.set(0, 3.8, 0.01);
    hpBar.rotation.x = -Math.PI / 6;
    gunGroup.add(hpBar);

    // 注册属性
    gunGroup.userData = {
      isAntiAirGun: true,
      maxHp: 100,
      hp: 100,
      fireInterval: 2.5,
      fireTimer: 0,
      scanAngle: 0,
      scanSpeed: 0.8,
      hpBar: hpBar,
      destroyed: false
    };

    this.islandGroup.add(gunGroup);
    // 高射炮不注册碰撞体，避免阻挡大门通道
    if (!this.antiAirGuns) this.antiAirGuns = [];
    this.antiAirGuns.push(gunGroup);
  },

  updateCollisions() {
    // 海岛碰撞已集成到 game.js 全局碰撞系统，通过 addCollider 注册
    // 这里只处理岛屿边界和地面高度
    const playerPos = this.camera ? this.camera.position : new THREE.Vector3();

    // 地形高度由 game.js 的重力系统统一处理，这里只做边界和最低高度保护
    if (playerPos.y < 0.5) {
      playerPos.y = 0.5;
    }

    // 岛屿边界
    const baseRadius = 95;
    const distFromCenter = Math.sqrt(playerPos.x * playerPos.x + playerPos.z * playerPos.z);
    if (distFromCenter > baseRadius) {
      const angle = Math.atan2(playerPos.z, playerPos.x);
      playerPos.x = Math.cos(angle) * baseRadius;
      playerPos.z = Math.sin(angle) * baseRadius;
    }
  },

  updateBlinkingLights(dt) {
    this.islandGroup.traverse(child => {
      if (child.userData && child.userData.isBlinking) {
        const intensity = (Math.sin(Date.now() * 0.003) + 1) / 2;
        if (child.material) child.material.opacity = intensity;
        child.scale.setScalar(0.8 + intensity * 0.4);
      }
    });
  },

  updateInteractPrompt() {
    if (!this.interactPrompt || !this.camera) return;
    const playerPos = this.camera.position;
    let nearestNPC = null;
    let nearestDist = Infinity;

    for (const npc of this.npcs) {
      const dist = npc.mesh.position.distanceTo(playerPos);
      if (dist < 3 && dist < nearestDist) {
        nearestDist = dist;
        nearestNPC = npc;
      }
    }

    if (nearestNPC) {
      const displayName = nearestNPC.name || '士兵 #' + (nearestNPC.index + 1);
      this.interactPrompt.textContent = '[E] 与' + displayName + '对话';
      this.interactPrompt.style.display = 'block';
    } else {
      this.interactPrompt.style.display = 'none';
    }
  },

  // ============================================================
  // NPC对话系统
  // ============================================================
  showNPCDialog(npcIndex) {
    const npc = this.npcs[npcIndex];
    if (!npc) return;

    const overlay = document.getElementById('npc-dialog-overlay');
    const nameEl = document.getElementById('npc-dialog-name');
    const contentEl = document.getElementById('npc-dialog-content');
    const actionsEl = document.getElementById('npc-dialog-actions');

    if (!overlay || !nameEl || !contentEl) return;

    if (typeof window.pauseGameState === 'function') {
      window.pauseGameState();
    }
    document.exitPointerLock();
    document.body.style.cursor = 'default';

    if (npc.isFishingNPC) {
      nameEl.textContent = '渔夫老陈';
      let content = '';
      let buttons = '<button class="npc-dialog-btn" onclick="IslandBase.closeNPCDialog()">关闭</button>';

      switch (this.fishingQuestState) {
        case 'not_started':
          content = '嗨，新来的！基地的食物储备不够了，需要你去海里捕些鱼回来。码头有潜艇，驾驶它去捕鱼吧！';
          // 接受任务后直接启动游戏，无需再次对话
          buttons = '<button class="npc-dialog-btn" onclick="IslandBase.startFishingQuestAndEnter()">接受任务并出海</button>' + buttons;
          break;
        case 'active':
          content = '快去码头驾驶潜艇捕鱼吧！记得用不同的武器，渔网、鱼雷、声呐各有特色。时间有限，抓紧！';
          buttons = '<button class="npc-dialog-btn" onclick="IslandBase.enterFishingGame()">驾驶潜艇出海</button>' + buttons;
          break;
        case 'completed':
          content = '你回来了！让我看看你的收获...哇，捕到了这么多鱼！总共' +
            (window.lastFishingResult ? window.lastFishingResult.fishCaught : 0) +
            '条，得分' + (window.lastFishingResult ? window.lastFishingResult.score : 0) + '！太棒了！';
          buttons = '<button class="npc-dialog-btn" onclick="IslandBase.deliverFishingQuest()">交付任务</button>' + buttons;
          break;
        case 'delivered':
          content = '感谢你为基地做出的贡献！食物储备充足了。如果还想捕鱼消遣，随时可以去码头。';
          buttons = '<button class="npc-dialog-btn" onclick="IslandBase.showUpgradePanel()">升级基地</button>' +
            '<button class="npc-dialog-btn" onclick="IslandBase.enterFishingGame()">再去捕鱼</button>' + buttons;
          break;
      }

      contentEl.textContent = content;
      if (actionsEl) actionsEl.innerHTML = buttons;
    } else if (npc.isMutationNPC) {
      nameEl.textContent = '林博士';
      let content = '';
      let buttons = '<button class="npc-dialog-btn" onclick="IslandBase.closeNPCDialog()">关闭</button>';

      switch (this.mutationQuestState) {
        case 'discovered':
          content = '你捕回来的鱼确实有问题，它们的细胞发生了异常变异。我需要进一步分析才能确定原因。';
          buttons = '<button class="npc-dialog-btn" onclick="IslandBase.advanceMutationQuest(\'investigating\')">分析变异</button>' + buttons;
          break;
        case 'investigating':
          content = '经过分析，这些鱼体内有一种未知病毒，而且似乎在快速扩散。病毒源头在深海某处。我们需要派出侦察队。';
          buttons = '<button class="npc-dialog-btn" onclick="IslandBase.advanceMutationQuest(\'briefing\')">派出侦察队</button>' + buttons;
          break;
        case 'briefing':
          content = '我们已经派出侦察队，但大部分潜艇都失联了。我们需要更强大的装备。根据最后传回的数据，病毒源头在深海深处。你需要驾驶升级后的潜艇前往调查。';
          buttons = '<button class="npc-dialog-btn" onclick="IslandBase.advanceMutationQuest(\'ready\')">接受深海任务</button>' + buttons;
          break;
        case 'ready':
          content = '准备好了吗？进入潜艇开始任务吧。深海危险重重，务必小心。';
          buttons = '<button class="npc-dialog-btn" onclick="IslandBase.enterSubmarineGame()">驾驶潜艇出发</button>' + buttons;
          break;
      }

      contentEl.textContent = content;
      if (actionsEl) actionsEl.innerHTML = buttons;
    } else {
      const displayName = npc.name || '士兵 #' + (npcIndex + 1);
      nameEl.textContent = displayName;
      contentEl.textContent = npc.dialogues[npcIndex % npc.dialogues.length];
      if (actionsEl) {
        actionsEl.innerHTML = '<button class="npc-dialog-btn" onclick="IslandBase.closeNPCDialog()">关闭</button>';
      }
    }

    overlay.style.display = 'flex';
  },

  closeNPCDialog() {
    const overlay = document.getElementById('npc-dialog-overlay');
    if (overlay) overlay.style.display = 'none';
    if (typeof window.resumeGameState === 'function') {
      window.resumeGameState();
    }
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.requestPointerLock();
    }
    document.body.style.cursor = 'none';
  },

  startFishingQuest() {
    this.fishingQuestState = 'active';
    this.closeNPCDialog();
    if (typeof showToast === 'function') {
      showToast('已接受捕鱼任务！', 'success');
    }
    console.log('[IslandBase] 捕鱼任务已接受');
  },

  // 接受任务并直接进入游戏（合并为一步）
  startFishingQuestAndEnter() {
    this.fishingQuestState = 'active';
    this.closeNPCDialog();
    if (typeof showToast === 'function') {
      showToast('已接受捕鱼任务，准备出海！', 'success');
    }
    console.log('[IslandBase] 捕鱼任务已接受，直接进入游戏');
    // 直接进入捕鱼游戏
    setTimeout(() => {
      this.enterFishingGame();
    }, 500);
  },

  enterFishingGame() {
    this.closeNPCDialog();
    if (typeof window.enter2DGame === 'function') {
      window.enter2DGame();
    }
    if (window.FishingGame) {
      window.FishingGame.start();
    } else {
      console.error('[IslandBase] FishingGame 未加载');
      if (typeof showToast === 'function') {
        showToast('捕鱼游戏加载失败', 'error');
      }
    }
  },

  deliverFishingQuest() {
    this.fishingQuestState = 'delivered';
    this.closeNPCDialog();
    const result = window.lastFishingResult || { score: 0, fishCaught: 0 };
    if (window.player && window.player.xp !== undefined) {
      const xpReward = Math.floor(result.score / 10);
      window.player.xp += xpReward;
      if (typeof showToast === 'function') {
        showToast('任务完成！获得 ' + xpReward + ' 经验值！', 'success');
      }
    }
    console.log('[IslandBase] 捕鱼任务已交付，得分:', result.score);
    setTimeout(() => {
      if (typeof showToast === 'function') {
        showToast('有士兵报告说捕到的鱼有些异常...', 'warning');
      }
      this.triggerFishMutationEvent();
    }, 5000);
  },

  completeFishingQuest(result) {
    this.fishingQuestState = 'completed';
    window.lastFishingResult = result;
    if (typeof showToast === 'function') {
      showToast('捕鱼结束！捕获 ' + result.fishCaught + ' 条鱼，得分 ' + result.score + '！去找渔夫交付任务。', 'success');
    }
    console.log('[IslandBase] 捕鱼任务完成，结果:', result);
  },

  triggerFishMutationEvent() {
    if (this.mutationQuestState !== 'not_started') return;
    this.mutationQuestState = 'discovered';
    if (typeof showToast === 'function') {
      showToast('鱼类变异事件触发！指挥中心附近出现了一位研究员，快去看看。', 'warning');
    }
    this.createMutationNPC();
    console.log('[IslandBase] 鱼类变异事件已触发，研究员NPC已创建');
  },

  advanceMutationQuest(state) {
    this.mutationQuestState = state;
    this.closeNPCDialog();
    const stateMessages = {
      'investigating': '研究员开始分析鱼类变异样本...',
      'briefing': '侦察队已派出，等待情报回传...',
      'ready': '升级潜艇已准备就绪！'
    };
    if (typeof showToast === 'function' && stateMessages[state]) {
      showToast(stateMessages[state], 'info');
    }
    console.log('[IslandBase] 变异剧情推进至:', state);
  },

  // ====== 升级系统 ======
  getPlayerScore() {
    let totalScore = 0;
    if (window.player && window.player.score !== undefined) {
      totalScore += window.player.score;
    }
    if (window.lastFishingResult && window.lastFishingResult.score !== undefined) {
      totalScore += window.lastFishingResult.score;
    }
    if (window.lastSubmarineResult && window.lastSubmarineResult.score !== undefined) {
      totalScore += window.lastSubmarineResult.score;
    }
    return totalScore;
  },

  showUpgradePanel() {
    this.closeNPCDialog();
    const score = this.getPlayerScore();
    const up = this.baseUpgrades;
    const costs = this.upgradeCosts;

    const weaponDesc = [
      '伤害+20%, 射速+10%',
      '伤害+40%, 射速+20%',
      '伤害+60%, 射速+30%',
      '伤害+100%, 射速+50%'
    ];
    const armorDesc = [
      '血量+50',
      '血量+100',
      '血量+200',
      '血量+400'
    ];

    const weaponCost = up.weaponLevel <= 5 ? (up.weaponLevel <= 4 ? costs.weapon[up.weaponLevel - 1] : null) : null;
    const armorCost = up.armorLevel <= 5 ? (up.armorLevel <= 4 ? costs.armor[up.armorLevel - 1] : null) : null;
    const allyCost = up.allyCount < 4 ? costs.ally[up.allyCount] : null;
    const allyWeaponCost = up.allyCount > 0 && up.allyWeaponLevel <= 3 ? (up.allyWeaponLevel <= 2 ? costs.allyWeapon[up.allyWeaponLevel - 1] : null) : null;

    let overlay = document.getElementById('base-upgrade-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'base-upgrade-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9000;display:flex;justify-content:center;align-items:center;font-family:"Microsoft YaHei",sans-serif;';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML =
      '<div style="background:linear-gradient(135deg,#1a2a3a 0%,#0a1520 100%);border:2px solid #4488aa;border-radius:16px;width:600px;max-width:90vw;max-height:85vh;overflow-y:auto;padding:30px;box-shadow:0 0 40px rgba(68,136,170,0.3);">' +
      '<div style="text-align:center;margin-bottom:20px;">' +
      '<div style="color:#44ccff;font-size:28px;font-weight:bold;text-shadow:0 0 15px rgba(68,204,255,0.5);">海上基地升级</div>' +
      '<div style="color:#88bbcc;font-size:14px;margin-top:8px;">使用捕鱼和深海探险获得的分数进行升级</div>' +
      '<div style="color:#ffcc00;font-size:18px;margin-top:10px;">当前分数: ' + score + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">' +
      this._buildUpgradeCard('武器升级', up.weaponLevel, 5, weaponDesc, weaponCost, score, 'upgradeWeapon') +
      this._buildUpgradeCard('装甲升级', up.armorLevel, 5, armorDesc, armorCost, score, 'upgradeArmor') +
      this._buildAllyCard(up.allyCount, allyCost, score) +
      this._buildAllyWeaponCard(up, allyWeaponCost, score) +
      '</div>' +
      '<div style="text-align:center;margin-top:20px;">' +
      '<button onclick="IslandBase.closeUpgradePanel()" style="padding:10px 40px;background:linear-gradient(135deg,#444,#333);border:1px solid #666;border-radius:8px;color:#ccc;cursor:pointer;font-size:15px;">关闭</button>' +
      '</div>' +
      '</div>';

    overlay.style.display = 'flex';
    document.exitPointerLock();
    document.body.style.cursor = 'default';
  },

  _buildUpgradeCard(name, level, maxLevel, desc, cost, score, action) {
    if (level >= maxLevel) {
      return '<div style="background:rgba(68,136,170,0.15);border:1px solid rgba(68,136,170,0.4);border-radius:10px;padding:15px;">' +
        '<div style="color:#44ccff;font-size:16px;font-weight:bold;">' + name + '</div>' +
        '<div style="color:#aaccee;font-size:13px;margin-top:5px;">当前等级: ' + level + '/' + maxLevel + '</div>' +
        '<div style="color:#ffcc00;font-size:13px;margin-top:10px;">已满级</div>' +
        '</div>';
    }
    const canAfford = score >= cost;
    return '<div style="background:rgba(68,136,170,0.15);border:1px solid rgba(68,136,170,0.4);border-radius:10px;padding:15px;">' +
      '<div style="color:#44ccff;font-size:16px;font-weight:bold;">' + name + '</div>' +
      '<div style="color:#aaccee;font-size:13px;margin-top:5px;">当前等级: ' + level + '/' + maxLevel + '</div>' +
      '<div style="color:#88ddaa;font-size:12px;margin-top:5px;">下一级: ' + desc[level - 1] + '</div>' +
      '<div style="color:#ffcc00;font-size:13px;margin-top:5px;">费用: ' + cost + ' 分</div>' +
      '<button onclick="IslandBase.' + action + '()" style="margin-top:10px;width:100%;padding:8px;background:' + (canAfford ? 'linear-gradient(135deg,#22aa66,#118844)' : '#333') + ';border:1px solid ' + (canAfford ? '#44cc88' : '#555') + ';border-radius:6px;color:' + (canAfford ? '#fff' : '#888') + ';cursor:' + (canAfford ? 'pointer' : 'not-allowed') + ';font-size:14px;">' + (canAfford ? '升级' + name.replace('升级', '') : '分数不足') + '</button>' +
      '</div>';
  },

  _buildAllyCard(count, cost, score) {
    if (count >= 4) {
      return '<div style="background:rgba(68,136,170,0.15);border:1px solid rgba(68,136,170,0.4);border-radius:10px;padding:15px;">' +
        '<div style="color:#44ccff;font-size:16px;font-weight:bold;">辅助潜艇</div>' +
        '<div style="color:#aaccee;font-size:13px;margin-top:5px;">当前数量: ' + count + '/4</div>' +
        '<div style="color:#ffcc00;font-size:13px;margin-top:10px;">已满编</div>' +
        '</div>';
    }
    const canAfford = score >= cost;
    return '<div style="background:rgba(68,136,170,0.15);border:1px solid rgba(68,136,170,0.4);border-radius:10px;padding:15px;">' +
      '<div style="color:#44ccff;font-size:16px;font-weight:bold;">辅助潜艇</div>' +
      '<div style="color:#aaccee;font-size:13px;margin-top:5px;">当前数量: ' + count + '/4</div>' +
      '<div style="color:#88ddaa;font-size:12px;margin-top:5px;">增加1艘随行辅助潜艇</div>' +
      '<div style="color:#ffcc00;font-size:13px;margin-top:5px;">费用: ' + cost + ' 分</div>' +
      '<button onclick="IslandBase.addAlly()" style="margin-top:10px;width:100%;padding:8px;background:' + (canAfford ? 'linear-gradient(135deg,#22aa66,#118844)' : '#333') + ';border:1px solid ' + (canAfford ? '#44cc88' : '#555') + ';border-radius:6px;color:' + (canAfford ? '#fff' : '#888') + ';cursor:' + (canAfford ? 'pointer' : 'not-allowed') + ';font-size:14px;">' + (canAfford ? '添加潜艇' : '分数不足') + '</button>' +
      '</div>';
  },

  _buildAllyWeaponCard(up, cost, score) {
    if (up.allyCount === 0) {
      return '<div style="background:rgba(68,136,170,0.15);border:1px solid rgba(68,136,170,0.4);border-radius:10px;padding:15px;">' +
        '<div style="color:#44ccff;font-size:16px;font-weight:bold;">辅助武器</div>' +
        '<div style="color:#888;font-size:12px;margin-top:10px;">需要先添加辅助潜艇</div>' +
        '</div>';
    }
    if (up.allyWeaponLevel >= 3) {
      return '<div style="background:rgba(68,136,170,0.15);border:1px solid rgba(68,136,170,0.4);border-radius:10px;padding:15px;">' +
        '<div style="color:#44ccff;font-size:16px;font-weight:bold;">辅助武器</div>' +
        '<div style="color:#aaccee;font-size:13px;margin-top:5px;">当前等级: ' + up.allyWeaponLevel + '/3</div>' +
        '<div style="color:#ffcc00;font-size:13px;margin-top:10px;">已满级</div>' +
        '</div>';
    }
    const canAfford = score >= cost;
    return '<div style="background:rgba(68,136,170,0.15);border:1px solid rgba(68,136,170,0.4);border-radius:10px;padding:15px;">' +
      '<div style="color:#44ccff;font-size:16px;font-weight:bold;">辅助武器</div>' +
      '<div style="color:#aaccee;font-size:13px;margin-top:5px;">当前等级: ' + up.allyWeaponLevel + '/3</div>' +
      '<div style="color:#88ddaa;font-size:12px;margin-top:5px;">辅助潜艇伤害+30%</div>' +
      '<div style="color:#ffcc00;font-size:13px;margin-top:5px;">费用: ' + cost + ' 分</div>' +
      '<button onclick="IslandBase.upgradeAllyWeapon()" style="margin-top:10px;width:100%;padding:8px;background:' + (canAfford ? 'linear-gradient(135deg,#22aa66,#118844)' : '#333') + ';border:1px solid ' + (canAfford ? '#44cc88' : '#555') + ';border-radius:6px;color:' + (canAfford ? '#fff' : '#888') + ';cursor:' + (canAfford ? 'pointer' : 'not-allowed') + ';font-size:14px;">' + (canAfford ? '升级武器' : '分数不足') + '</button>' +
      '</div>';
  },

  closeUpgradePanel() {
    const overlay = document.getElementById('base-upgrade-overlay');
    if (overlay) overlay.style.display = 'none';
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.requestPointerLock();
    }
    document.body.style.cursor = 'none';
  },

  upgradeWeapon() {
    const up = this.baseUpgrades;
    if (up.weaponLevel >= 5) return;
    const cost = this.upgradeCosts.weapon[up.weaponLevel - 1];
    const score = this.getPlayerScore();
    if (score < cost) {
      if (typeof showToast === 'function') showToast('分数不足！', 'error');
      return;
    }
    this.deductScore(cost);
    up.weaponLevel++;
    if (typeof showToast === 'function') {
      showToast('武器升级到 ' + up.weaponLevel + ' 级！伤害和射速提升！', 'success');
    }
    console.log('[IslandBase] 武器升级到', up.weaponLevel, '级');
    this.showUpgradePanel();
  },

  upgradeArmor() {
    const up = this.baseUpgrades;
    if (up.armorLevel >= 5) return;
    const cost = this.upgradeCosts.armor[up.armorLevel - 1];
    const score = this.getPlayerScore();
    if (score < cost) {
      if (typeof showToast === 'function') showToast('分数不足！', 'error');
      return;
    }
    this.deductScore(cost);
    up.armorLevel++;
    if (window.player && window.player.maxHp !== undefined) {
      window.player.maxHp += [50, 100, 200, 400][up.armorLevel - 2];
      window.player.hp = Math.min(window.player.hp + [50, 100, 200, 400][up.armorLevel - 2], window.player.maxHp);
    }
    if (typeof showToast === 'function') {
      showToast('装甲升级到 ' + up.armorLevel + ' 级！血量上限提升！', 'success');
    }
    console.log('[IslandBase] 装甲升级到', up.armorLevel, '级');
    this.showUpgradePanel();
  },

  addAlly() {
    const up = this.baseUpgrades;
    if (up.allyCount >= 4) return;
    const cost = this.upgradeCosts.ally[up.allyCount];
    const score = this.getPlayerScore();
    if (score < cost) {
      if (typeof showToast === 'function') showToast('分数不足！', 'error');
      return;
    }
    this.deductScore(cost);
    up.allyCount++;
    if (typeof showToast === 'function') {
      showToast('辅助潜艇数量增加到 ' + up.allyCount + ' 艘！', 'success');
    }
    console.log('[IslandBase] 辅助潜艇数量:', up.allyCount);
    this.showUpgradePanel();
  },

  upgradeAllyWeapon() {
    const up = this.baseUpgrades;
    if (up.allyCount === 0 || up.allyWeaponLevel >= 3) return;
    const cost = this.upgradeCosts.allyWeapon[up.allyWeaponLevel - 1];
    const score = this.getPlayerScore();
    if (score < cost) {
      if (typeof showToast === 'function') showToast('分数不足！', 'error');
      return;
    }
    this.deductScore(cost);
    up.allyWeaponLevel++;
    if (typeof showToast === 'function') {
      showToast('辅助武器升级到 ' + up.allyWeaponLevel + ' 级！辅助潜艇伤害提升！', 'success');
    }
    console.log('[IslandBase] 辅助武器升级到', up.allyWeaponLevel, '级');
    this.showUpgradePanel();
  },

  deductScore(amount) {
    if (window.player && window.player.score !== undefined && window.player.score >= amount) {
      window.player.score -= amount;
      return;
    }
    if (window.lastFishingResult && window.lastFishingResult.score !== undefined && window.lastFishingResult.score > 0) {
      const deduct = Math.min(amount, window.lastFishingResult.score);
      window.lastFishingResult.score -= deduct;
      amount -= deduct;
    }
    if (amount > 0 && window.lastSubmarineResult && window.lastSubmarineResult.score !== undefined) {
      window.lastSubmarineResult.score = Math.max(0, window.lastSubmarineResult.score - amount);
    }
  },

  enterSubmarineGame() {
    this.closeNPCDialog();
    if (typeof window.enter2DGame === 'function') {
      window.enter2DGame();
    }
    if (window.SubmarineGame) {
      window.SubmarineGame.start(this.baseUpgrades);
    } else {
      console.error('[IslandBase] SubmarineGame 未加载');
      if (typeof showToast === 'function') {
        showToast('潜艇游戏加载失败', 'error');
      }
    }
  },

  completeSubmarineMission(result) {
    console.log('[IslandBase] 潜艇任务完成，结果:', result);
    if (typeof showToast === 'function') {
      showToast('潜艇任务完成！得分: ' + (result.score || 0), 'success');
    }
    if (result.bossDefeated) {
      setTimeout(() => {
        if (typeof showToast === 'function') {
          showToast('前方是一个新的大陆，曾经是某国排放核污水的地方，如今地面已经一片沼泽', 'warning');
        }
        setTimeout(() => {
          if (confirm('前方是一个新的大陆，曾经是某国排放核污水的地方，如今地面已经一片沼泽。\n\n是否前往毒雾沼泽？')) {
            if (window.MapManager && typeof MapManager.switchTo === 'function') {
              MapManager.switchTo('swamp');
            } else {
              console.error('[IslandBase] MapManager 不可用');
              if (typeof showToast === 'function') {
                showToast('地图切换失败', 'error');
              }
            }
          }
        }, 3000);
      }, 2000);
    }
  },

  // ====== MapManager接口 ======
  generate(options) {
    console.log('[IslandBase] generate() called - already initialized');
    this.active = true;
    window.currentMap = 'island';
  },

  getTerrainHeight(x, z) {
    const dist = Math.sqrt(x * x + z * z);
    const wallInnerRadius = 85;
    if (dist < wallInnerRadius) {
      // 墙内：平坦水泥地面，地面 mesh 在 y=0
      return 0;
    }
    // 墙外：FBM噪声起伏，减去0.5与PlaneGeometry对齐
    let h = this._fbm(x * 0.05, z * 0.05, 4, 0.5, 2.0) * 3 +
      this._fbm(x * 0.1, z * 0.1, 3, 0.4, 2.5) * 1.5 +
      this._fbm(x * 0.2, z * 0.2, 2, 0.3, 3.0) * 0.5;
    if (dist > 80) {
      h *= Math.max(0, 1 - (dist - 80) / 20);
    }
    return h - 0.5;
  },

  getMapBounds() {
    return { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
  },

  cleanup() {
    if (this._onKeyDown) {
      document.removeEventListener('keydown', this._onKeyDown);
    }
    if (this._onKeyUp) {
      document.removeEventListener('keyup', this._onKeyUp);
    }
    if (this.interactPrompt && this.interactPrompt.parentNode) {
      this.interactPrompt.parentNode.removeChild(this.interactPrompt);
    }

    if (typeof clearColliders === 'function') {
      clearColliders();
    }

    if (this.islandGroup) {
      this.islandGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(this.islandGroup);
    }

    if (this.seaMesh) {
      if (this.seaMesh.geometry) this.seaMesh.geometry.dispose();
      if (this.seaMesh.material) this.seaMesh.material.dispose();
      this.scene.remove(this.seaMesh);
    }

    this.fogIslands.forEach(fi => {
      if (fi.geometry) fi.geometry.dispose();
      if (fi.material) fi.material.dispose();
      this.scene.remove(fi);
    });

    this.seagulls.forEach(gull => {
      this.scene.remove(gull);
    });

    this.active = false;
    this.npcs = [];
    this.buildings = [];
    this.wallColliders = [];
    this.buildingColliders = [];
    this.treeColliders = [];
    this.antiAirGuns = [];
    this.animatedObjects = [];
    this.grassPatches = [];
    this.seagulls = [];
    this.fogIslands = [];
    this.seaMesh = null;
    this.islandGroup = null;
  }
};

window.IslandBase = IslandBase;
