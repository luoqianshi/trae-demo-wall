/* =====================================================
 *  叮咚学 v3.1 · 乐园 3.1 真正的 3D 我的世界引擎 (world3d.js)
 *  纯前端 / ES5 语法 / IIFE 模块化
 *  依赖：window.THREE  （通过 CDN 引入 three@0.160.0）
 *        window.DD     （data.js 中的 MATERIALS 和 PARK_SCENES）
 *  暴露：window.World3D
 *
 *  功能总览：
 *    1. 3D 场景初始化（Scene / 透视相机 / WebGL 渲染器 / 雾 / 灯光阴影 / 渐变天空）
 *    2. 方块系统（1x1x1 BoxGeometry，顶面 emoji 纹理，侧面纯色纹理感）
 *    3. 20x20 地面网格（草地底色 + GridHelper 辅助定位）
 *    4. 自定义轨道相机（拖拽旋转 / 滚轮缩放 / 右键平移 / 触摸支持）
 *    5. 方块放置 / 移除（Raycaster 检测，点地面放方块，点侧面相邻放置）
 *    6. 悬停半透明预览方块
 *    7. 材料栏集成（onMaterialChange 回调 / setMaterial / 库存管理）
 *    8. 世界数据（序列化 / localStorage / base64 分享码）
 *    9. 性能优化（requestAnimationFrame 渲染循环 / 纹理缓存）
 *   10. 6 种场景背景（不同天空色和地面色）
 * ===================================================== */
(function (window) {
  'use strict';

  // 如果 THREE 没有加载，直接退出（不报错，方便 2D 版继续可用）
  if (!window.THREE) {
    console.warn('[World3D] THREE 未加载，3D 引擎不可用');
    return;
  }

  var THREE = window.THREE;

  // ===================================================
  // 0. 常量
  // ===================================================

  var GRID_SIZE = 20;          // 地面网格大小 20 x 20
  var MAX_UNDO = 50;           // 撤销 / 重做栈最多 50 步
  var STORAGE_KEY = 'dd.world3d';        // 3D 世界存档 key
  var INVENTORY_KEY = 'dd.world.inv';    // 库存 key（与 2D 版共享）
  var TEX_SIZE = 64;           // Canvas 纹理尺寸

  // 6 种场景对应的天空色 / 地面色 / 雾色
  // 对应 DD.PARK_SCENES：street / city / cn / rural / food / free
  var SCENE_STYLE = {
    street: { sky: '#8EC5FC', ground: '#7CB342', fog: '#8EC5FC' },  // 街道：蓝色天空
    city:   { sky: '#B0BEC5', ground: '#90A4AE', fog: '#B0BEC5' },  // 高楼：灰色城市天空
    cn:     { sky: '#FFCC80', ground: '#A1887F', fog: '#FFCC80' },  // 国风：暖色天空
    rural:  { sky: '#AED581', ground: '#9CCC65', fog: '#AED581' },  // 乡村：绿色田园天空
    food:   { sky: '#FFAB91', ground: '#8D6E63', fog: '#FFAB91' },  // 美食：橙色暖天
    free:   { sky: '#CE93D8', ground: '#7E57C2', fog: '#CE93D8' }   // 自由：紫色梦幻天空
  };

  // ===================================================
  // 1. 工具函数
  // ===================================================

  /** 把数值限制在 [a, b] 范围内 */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /** 安全地从 localStorage 读取 JSON */
  function safeGet(key, def) {
    try {
      var v = localStorage.getItem(key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }

  /** 安全地把 JSON 写入 localStorage */
  function safeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }

  /** base64 编码（支持中文，先 encodeURIComponent 再转） */
  function b64Encode(str) {
    try {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (m, p) {
        return String.fromCharCode('0x' + p);
      }));
    } catch (e) { return ''; }
  }

  /** base64 解码（支持中文） */
  function b64Decode(b64) {
    try {
      var str = atob(b64);
      return decodeURIComponent(str.split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) { return ''; }
  }

  /** #RRGGBB → {r,g,b} */
  function hexToRgb(hex) {
    if (!hex) return null;
    var m = /^#([0-9a-fA-F]{6})$/.exec(hex);
    if (m) {
      return {
        r: parseInt(m[1].substring(0, 2), 16),
        g: parseInt(m[1].substring(2, 4), 16),
        b: parseInt(m[1].substring(4, 6), 16)
      };
    }
    return null;
  }

  /** 把 #RRGGBB 颜色变暗，amt 是变暗比例 0~1，返回 #RRGGBB */
  function darkenHex(hex, amt) {
    var c = hexToRgb(hex);
    if (!c) return hex;
    var r = Math.floor(c.r * (1 - amt));
    var g = Math.floor(c.g * (1 - amt));
    var b = Math.floor(c.b * (1 - amt));
    return '#' + ('00' + r.toString(16)).slice(-2) +
                 ('00' + g.toString(16)).slice(-2) +
                 ('00' + b.toString(16)).slice(-2);
  }

  /** 把方块坐标转成 map 的 key 字符串 */
  function keyOf(x, y, z) { return x + ',' + y + ',' + z; }

  // ===================================================
  // 2. 引擎状态（把所有变量集中管理）
  // ===================================================

  var engine = {
    container: null,        // 外层 div 容器
    scene: null,            // Three.js 场景
    camera: null,           // 透视相机
    renderer: null,         // WebGL 渲染器
    ground: null,           // 地面网格 Mesh（用于射线检测）
    gridHelper: null,       // 网格辅助线
    skyMesh: null,          // 天空球
    ambient: null,          // 环境光
    directional: null,      // 方向光（带阴影）
    raycaster: null,        // 射线检测器
    pointer: null,          // 存储鼠标 / 触摸的 NDC 坐标
    // 方块数据
    blockMap: null,         // map: "x,y,z" -> mesh
    textureCache: null,     // matId -> { top:CanvasTexture, side:CanvasTexture }
    previewMesh: null,      // 悬停预览方块
    previewMat: null,       // 预览材质（用于变色）
    // 当前场景
    sceneId: 'street',
    // 当前操作模式与选中材料
    mode: 'place',          // 'place' | 'erase'
    curMatId: 'grass',
    // 撤销 / 重做栈
    undoStack: [],
    redoStack: [],
    // 库存：{ matId: count }
    inventory: {},
    // 外部回调
    opts: {},
    // 状态标志
    viewOnly: false,
    destroyed: false,
    // 渲染循环
    rafId: 0,
    // 轨道相机参数
    cameraTarget: null,     // 相机注视点
    cameraDistance: 28,     // 距离
    cameraAngleH: Math.PI / 4,  // 水平角（方位角）
    cameraAngleV: Math.PI / 3.5,// 垂直角（俯仰角）
    // 交互状态
    dragging: false,        // 是否正在拖拽
    dragButton: 0,          // 当前拖拽的鼠标键（0=左 2=右）
    dragStartX: 0,
    dragStartY: 0,
    dragMoved: false,       // 是否真的移动了（区分点击和拖拽）
    panStartX: 0,           // 右键平移起点
    panStartY: 0,
    // 触摸双指
    lastTouchDist: 0,
    lastTouchCenter: null,
    // 悬停的格子（预览方块位置）
    hoverCell: null
  };

  // ===================================================
  // 3. 数据查找辅助
  // ===================================================

  /** 根据 matId 查材料 */
  function findMaterial(matId) {
    if (!window.DD || !DD.MATERIALS) return null;
    for (var i = 0; i < DD.MATERIALS.length; i++) {
      if (DD.MATERIALS[i].id === matId) return DD.MATERIALS[i];
    }
    return null;
  }

  /** 根据 sceneId 查场景 */
  function findScene(sceneId) {
    if (!window.DD || !DD.PARK_SCENES) return null;
    for (var i = 0; i < DD.PARK_SCENES.length; i++) {
      if (DD.PARK_SCENES[i].id === sceneId) return DD.PARK_SCENES[i];
    }
    return null;
  }

  /** 获取某场景的配色，找不到就用街道默认 */
  function getSceneStyle(sceneId) {
    return SCENE_STYLE[sceneId] || SCENE_STYLE.street;
  }

  // ===================================================
  // 4. 纹理生成（用 Canvas 画 emoji 纹理，缓存起来）
  // ===================================================

  /**
   * 生成方块顶面纹理：背景填 material.color，中间画 emoji
   * 按任务要求实现
   */
  function createBlockTexture(material) {
    var canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE; canvas.height = TEX_SIZE;
    var ctx = canvas.getContext('2d');
    // 背景填充材料颜色
    ctx.fillStyle = material.color;
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // 中间画 emoji
    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(material.emoji, TEX_SIZE / 2, TEX_SIZE / 2 + 2);
    var tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;  // 像素风，更清晰
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  /**
   * 生成方块侧面纹理：纯色 + 细微的边框线条，增加纹理感
   * 侧面比顶面稍暗一点，模拟光影
   */
  function createSideTexture(material) {
    var canvas = document.createElement('canvas');
    canvas.width = TEX_SIZE; canvas.height = TEX_SIZE;
    var ctx = canvas.getContext('2d');
    // 侧面用稍暗的颜色
    ctx.fillStyle = darkenHex(material.color, 0.18);
    ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
    // 画一个内边框，增加纹理感
    ctx.strokeStyle = darkenHex(material.color, 0.35);
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, TEX_SIZE - 4, TEX_SIZE - 4);
    // 中间画一条分隔线，像砖块的接缝
    ctx.strokeStyle = darkenHex(material.color, 0.30);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, TEX_SIZE / 2);
    ctx.lineTo(TEX_SIZE, TEX_SIZE / 2);
    ctx.stroke();
    var tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  /** 获取某材料的纹理（带缓存，避免重复创建） */
  function getTextures(matId) {
    if (engine.textureCache[matId]) return engine.textureCache[matId];
    var mat = findMaterial(matId);
    if (!mat) return null;
    var top = createBlockTexture(mat);
    var side = createSideTexture(mat);
    engine.textureCache[matId] = { top: top, side: side };
    return engine.textureCache[matId];
  }

  // ===================================================
  // 5. 方块 Mesh 创建与管理
  // ===================================================

  /**
   * 创建一个方块的 Mesh
   * BoxGeometry 的 6 个面材质顺序：[+X, -X, +Y, -Y, +Z, -Z]
   * 也就是 [右, 左, 顶, 底, 前, 后]
   * 顶面（index 2）用 emoji 纹理，其余面用侧面纹理
   */
  function createBlockMesh(matId) {
    var tex = getTextures(matId);
    var topTex = tex ? tex.top : null;
    var sideTex = tex ? tex.side : null;
    var mat = findMaterial(matId);
    var baseColor = mat ? mat.color : '#cccccc';

    // 6 个面的材质
    var sideMaterial = new THREE.MeshLambertMaterial({
      map: sideTex,
      color: 0xffffff
    });
    var topMaterial = new THREE.MeshLambertMaterial({
      map: topTex,
      color: 0xffffff
    });
    var bottomMaterial = new THREE.MeshLambertMaterial({
      color: new THREE.Color(darkenHex(baseColor, 0.4))
    });
    var materials = [
      sideMaterial, sideMaterial,  // 右、左
      topMaterial,                 // 顶（emoji）
      bottomMaterial,              // 底（暗色）
      sideMaterial, sideMaterial   // 前、后
    ];

    var geo = new THREE.BoxGeometry(1, 1, 1);
    var mesh = new THREE.Mesh(geo, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.matId = matId;
    return mesh;
  }

  /** 把方块放到网格坐标 (x, y, z)，返回是否成功 */
  function addBlockAt(x, y, z, matId) {
    var k = keyOf(x, y, z);
    if (engine.blockMap[k]) return false;  // 该位置已有方块
    var mesh = createBlockMesh(matId);
    // 方块占 1x1x1，中心在 (x+0.5, y+0.5, z+0.5)
    mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    mesh.userData.x = x;
    mesh.userData.y = y;
    mesh.userData.z = z;
    engine.scene.add(mesh);
    engine.blockMap[k] = mesh;
    return true;
  }

  /** 移除 (x, y, z) 处的方块，返回被移除的 matId（或 null） */
  function removeBlockAt(x, y, z) {
    var k = keyOf(x, y, z);
    var mesh = engine.blockMap[k];
    if (!mesh) return null;
    var matId = mesh.userData.matId;
    engine.scene.remove(mesh);
    // 释放几何体和材质资源
    disposeMesh(mesh);
    delete engine.blockMap[k];
    return matId;
  }

  /** 释放 mesh 的 GPU 资源 */
  function disposeMesh(mesh) {
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        for (var i = 0; i < mesh.material.length; i++) {
          if (mesh.material[i].map) mesh.material[i].map.dispose();
          mesh.material[i].dispose();
        }
      } else {
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.dispose();
      }
    }
  }

  /** 清空所有方块 */
  function clearAllBlocks() {
    for (var k in engine.blockMap) {
      var mesh = engine.blockMap[k];
      engine.scene.remove(mesh);
      disposeMesh(mesh);
    }
    engine.blockMap = {};
  }

  // ===================================================
  // 6. 场景搭建（场景 / 相机 / 渲染器 / 灯光 / 天空 / 地面）
  // ===================================================

  /** 创建渐变天空球（一个大球，内表面贴渐变纹理） */
  function createSky(skyColor) {
    var canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 128;
    var ctx = canvas.getContext('2d');
    // 从顶部更深的颜色渐变到地平线较亮的颜色
    var top = darkenHex(skyColor, 0.25);
    var grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, top);
    grad.addColorStop(1, skyColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 128);
    var tex = new THREE.CanvasTexture(canvas);
    var geo = new THREE.SphereGeometry(300, 16, 8);
    var mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,   // 渲染内表面
      fog: false,             // 天空不受雾影响
      depthWrite: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  /** 创建地面（一个可射线检测的平面） */
  function createGround(groundColor) {
    var geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    var mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(groundColor),
      transparent: true,
      opacity: 0.92
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;  // 水平放置
    mesh.position.set(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    mesh.receiveShadow = true;
    return mesh;
  }

  /** 创建网格辅助线 */
  function createGridHelper() {
    var helper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x000000, 0x000000);
    helper.position.set(GRID_SIZE / 2, 0.01, GRID_SIZE / 2);  // 略高于地面防闪烁
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    return helper;
  }

  /** 创建悬停预览方块（半透明） */
  function createPreviewMesh() {
    var geo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    var mat = new THREE.MeshBasicMaterial({
      color: 0x7C5CFF,
      transparent: true,
      opacity: 0.45,
      wireframe: false
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    return mesh;
  }

  /** 根据当前场景配色，刷新天空 / 地面 / 雾 */
  function applySceneStyle() {
    var style = getSceneStyle(engine.sceneId);

    // 雾：增加深度感
    if (engine.scene.fog) {
      engine.scene.fog.color.set(style.fog);
    } else {
      engine.scene.fog = new THREE.Fog(style.fog, 30, 120);
    }

    // 天空背景色
    engine.scene.background = new THREE.Color(style.sky);

    // 重建天空球
    if (engine.skyMesh) {
      engine.scene.remove(engine.skyMesh);
      disposeMesh(engine.skyMesh);
    }
    engine.skyMesh = createSky(style.sky);
    engine.skyMesh.position.copy(engine.cameraTarget);
    engine.scene.add(engine.skyMesh);

    // 地面颜色
    if (engine.ground) {
      engine.ground.material.color.set(style.ground);
    }
  }

  // ===================================================
  // 7. 轨道相机控制（自己实现，不依赖 OrbitControls）
  // ===================================================

  /** 根据球坐标更新相机位置 */
  function updateCamera() {
    var t = engine.cameraTarget;
    var d = engine.cameraDistance;
    var h = engine.cameraAngleH;
    var v = engine.cameraAngleV;
    engine.camera.position.x = t.x + d * Math.cos(v) * Math.sin(h);
    engine.camera.position.z = t.z + d * Math.cos(v) * Math.cos(h);
    engine.camera.position.y = t.y + d * Math.sin(v);
    engine.camera.lookAt(t);
    // 天空球跟随相机目标移动
    if (engine.skyMesh) engine.skyMesh.position.copy(t);
  }

  /** 以鼠标位置为中心缩放 */
  function zoomBy(ratio) {
    var newD = clamp(engine.cameraDistance * ratio, 6, 80);
    if (newD === engine.cameraDistance) return;
    engine.cameraDistance = newD;
    updateCamera();
  }

  /** 旋转视角（水平 dH，垂直 dV，单位弧度） */
  function rotateView(dH, dV) {
    engine.cameraAngleH += dH;
    engine.cameraAngleV = clamp(engine.cameraAngleV + dV, 0.15, Math.PI / 2 - 0.05);
    updateCamera();
  }

  /** 平移视角（在地面平面上移动 cameraTarget）
   *  dx, dy 是屏幕上的像素位移 */
  function panView(dx, dy) {
    // 相机的水平朝向（投影到 XZ 平面）
    var h = engine.cameraAngleH;
    // 前向（相机看向目标的方向，在地面的投影）
    var forwardX = -Math.sin(h);
    var forwardZ = -Math.cos(h);
    // 右向
    var rightX = Math.cos(h);
    var rightZ = -Math.sin(h);
    // 平移量与距离成正比，远处移动更快
    var speed = engine.cameraDistance * 0.0015;
    engine.cameraTarget.x -= rightX * dx * speed + forwardX * dy * speed;
    engine.cameraTarget.z -= rightZ * dx * speed + forwardZ * dy * speed;
    // 限制目标点在合理范围
    engine.cameraTarget.x = clamp(engine.cameraTarget.x, -10, GRID_SIZE + 10);
    engine.cameraTarget.z = clamp(engine.cameraTarget.z, -10, GRID_SIZE + 10);
    updateCamera();
  }

  // ===================================================
  // 8. 事件处理（鼠标 + 触摸）
  // ===================================================

  /** 从鼠标 / 触摸事件取出相对容器的坐标 */
  function getEventPos(e) {
    var rect = engine.renderer.domElement.getBoundingClientRect();
    var t;
    if (e.touches && e.touches.length) {
      t = e.touches[0];
    } else if (e.changedTouches && e.changedTouches.length) {
      t = e.changedTouches[0];
    } else {
      t = e;
    }
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  /** 把屏幕坐标转成 NDC（-1 ~ 1），存入 engine.pointer */
  function updatePointerNDC(px, py) {
    var rect = engine.renderer.domElement.getBoundingClientRect();
    engine.pointer.x = (px / rect.width) * 2 - 1;
    engine.pointer.y = -(py / rect.height) * 2 + 1;
  }

  /** 双指距离 */
  function touchDist(e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** 双指中点（相对容器） */
  function touchCenter(e) {
    var rect = engine.renderer.domElement.getBoundingClientRect();
    var x = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
    var y = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
    return { x: x, y: y };
  }

  function onPointerDown(e) {
    // 双指 → 缩放 + 平移
    if (e.touches && e.touches.length === 2) {
      engine.lastTouchDist = touchDist(e);
      engine.lastTouchCenter = touchCenter(e);
      engine.dragging = false;
      if (e.cancelable) e.preventDefault();
      return;
    }
    var p = getEventPos(e);
    engine.dragging = true;
    engine.dragButton = (e.button !== undefined) ? e.button : 0;
    engine.dragStartX = p.x;
    engine.dragStartY = p.y;
    engine.panStartX = p.x;
    engine.panStartY = p.y;
    engine.dragMoved = false;
    if (e.cancelable) e.preventDefault();
  }

  function onPointerMove(e) {
    // 双指：捏合缩放 + 单指拖拽旋转（这里用双指做缩放和平移）
    if (e.touches && e.touches.length === 2) {
      var d = touchDist(e);
      var c = touchCenter(e);
      if (engine.lastTouchDist > 0) {
        zoomBy(engine.lastTouchDist / d);  // 距离变大 → 缩小相机距离 → 放大
      }
      if (engine.lastTouchCenter) {
        panView(c.x - engine.lastTouchCenter.x, c.y - engine.lastTouchCenter.y);
      }
      engine.lastTouchDist = d;
      engine.lastTouchCenter = c;
      if (e.cancelable) e.preventDefault();
      return;
    }

    var p = getEventPos(e);

    // 拖拽中
    if (engine.dragging) {
      var dx = p.x - engine.dragStartX;
      var dy = p.y - engine.dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) engine.dragMoved = true;

      if (engine.dragButton === 2) {
        // 右键 → 平移
        panView(p.x - engine.panStartX, p.y - engine.panStartY);
        engine.panStartX = p.x;
        engine.panStartY = p.y;
      } else {
        // 左键 / 单指 → 旋转
        rotateView(dx * 0.005, dy * 0.005);
        engine.dragStartX = p.x;
        engine.dragStartY = p.y;
      }
      // 拖拽时隐藏预览
      if (engine.previewMesh) engine.previewMesh.visible = false;
      if (e.cancelable) e.preventDefault();
      return;
    }

    // 没在拖拽 → 更新悬停预览（只读模式不需要）
    if (!engine.viewOnly) {
      updateHoverPreview(p.x, p.y);
    }
  }

  function onPointerUp(e) {
    var wasDragging = engine.dragging;
    var moved = engine.dragMoved;
    engine.dragging = false;
    engine.lastTouchDist = 0;
    engine.lastTouchCenter = null;
    // 只读模式不处理点击
    if (engine.viewOnly) return;
    // 没有真正移动 → 视为点击
    if (wasDragging && !moved) {
      var p = getEventPos(e);
      handleClick(p.x, p.y);
    }
  }

  function onWheel(e) {
    var delta = e.deltaY > 0 ? 1.1 : 0.9;
    zoomBy(delta);
    if (e.cancelable) e.preventDefault();
  }

  // ===================================================
  // 9. 射线检测：悬停预览 + 点击放置/移除
  // ===================================================

  /** 收集所有可被射线检测的物体（地面 + 所有方块） */
  function getPickTargets() {
    var list = [engine.ground];
    for (var k in engine.blockMap) {
      list.push(engine.blockMap[k]);
    }
    return list;
  }

  /**
   * 从屏幕坐标 (px, py) 发射射线，返回命中信息
   * 返回 { type:'ground'|'block', point, normal, cell:{x,y,z}, block:{x,y,z,matId} }
   * 其中 cell 是「将要放置的格子」，block 是「被点中的方块」
   */
  function pickAt(px, py) {
    updatePointerNDC(px, py);
    engine.raycaster.setFromCamera(engine.pointer, engine.camera);
    var targets = getPickTargets();
    var hits = engine.raycaster.intersectObjects(targets, false);
    if (!hits.length) return null;

    var hit = hits[0];
    var obj = hit.object;
    var point = hit.point;
    var normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);

    // 命中地面
    if (obj === engine.ground) {
      var gx = Math.floor(point.x);
      var gz = Math.floor(point.z);
      gx = clamp(gx, 0, GRID_SIZE - 1);
      gz = clamp(gz, 0, GRID_SIZE - 1);
      return {
        type: 'ground',
        cell: { x: gx, y: 0, z: gz },
        block: null
      };
    }

    // 命中方块：根据法线算出相邻格子
    var bx = obj.userData.x;
    var by = obj.userData.y;
    var bz = obj.userData.z;
    var nx = Math.round(normal.x);
    var ny = Math.round(normal.y);
    var nz = Math.round(normal.z);
    var cell = { x: bx + nx, y: by + ny, z: bz + nz };
    return {
      type: 'block',
      cell: cell,
      block: { x: bx, y: by, z: bz, matId: obj.userData.matId },
      normal: { x: nx, y: ny, z: nz }
    };
  }

  /** 判断格子是否可以放置方块（在网格范围内、y >= 0、且该位置为空） */
  function canPlaceAt(cell) {
    if (!cell) return false;
    if (cell.x < 0 || cell.x >= GRID_SIZE) return false;
    if (cell.z < 0 || cell.z >= GRID_SIZE) return false;
    if (cell.y < 0 || cell.y > 30) return false;  // 高度限制 30 层
    if (engine.blockMap[keyOf(cell.x, cell.y, cell.z)]) return false;
    return true;
  }

  /** 更新悬停预览方块 */
  function updateHoverPreview(px, py) {
    var pick = pickAt(px, py);
    if (!pick) {
      if (engine.previewMesh) engine.previewMesh.visible = false;
      engine.hoverCell = null;
      return;
    }

    if (engine.mode === 'erase' && pick.block) {
      // 橡皮擦模式：预览高亮在被擦除的方块上
      engine.previewMesh.visible = true;
      engine.previewMesh.position.set(
        pick.block.x + 0.5, pick.block.y + 0.5, pick.block.z + 0.5
      );
      engine.previewMat.color.set(0xF44336);  // 红色
      engine.hoverCell = { erase: true, x: pick.block.x, y: pick.block.y, z: pick.block.z };
      return;
    }

    // 放置模式：预览在将要放置的格子
    if (canPlaceAt(pick.cell)) {
      engine.previewMesh.visible = true;
      engine.previewMesh.position.set(
        pick.cell.x + 0.5, pick.cell.y + 0.5, pick.cell.z + 0.5
      );
      // 预览颜色跟随当前材料
      var mat = findMaterial(engine.curMatId);
      engine.previewMat.color.set(mat ? mat.color : 0x7C5CFF);
      engine.hoverCell = { place: true, x: pick.cell.x, y: pick.cell.y, z: pick.cell.z };
    } else {
      engine.previewMesh.visible = false;
      engine.hoverCell = null;
    }
  }

  /** 处理点击事件 */
  function handleClick(px, py) {
    var pick = pickAt(px, py);
    if (!pick) return;

    if (engine.mode === 'erase' && pick.block) {
      // 橡皮擦：移除方块
      eraseBlock(pick.block.x, pick.block.y, pick.block.z);
      return;
    }

    if (engine.mode === 'place' && canPlaceAt(pick.cell)) {
      placeBlock(pick.cell.x, pick.cell.y, pick.cell.z, engine.curMatId);
    }
  }

  // ===================================================
  // 10. 方块操作（放置 / 移除 / 撤销 / 重做）
  // ===================================================

  /** 放置方块（会扣库存；如果格子已有方块则忽略） */
  function placeBlock(x, y, z, matId) {
    if (engine.blockMap[keyOf(x, y, z)]) return;
    // 检查库存
    var inv = getInventoryCount(matId);
    if (inv <= 0) {
      notify('warn', '库存不足，请先到商店购买');
      return;
    }
    if (!addBlockAt(x, y, z, matId)) return;
    spendInventory(matId, 1);
    pushUndo({ type: 'place', x: x, y: y, z: z, matId: matId });
    refreshPreviewColor();
  }

  /** 移除方块（返还库存） */
  function eraseBlock(x, y, z) {
    var k = keyOf(x, y, z);
    var mesh = engine.blockMap[k];
    if (!mesh) return;
    var matId = mesh.userData.matId;
    removeBlockAt(x, y, z);
    addInventory(matId, 1);
    pushUndo({ type: 'erase', x: x, y: y, z: z, matId: matId });
    refreshPreviewColor();
  }

  /** 把操作压入撤销栈（超过 50 步丢弃最旧的） */
  function pushUndo(op) {
    engine.undoStack.push(op);
    if (engine.undoStack.length > MAX_UNDO) engine.undoStack.shift();
    engine.redoStack = [];  // 新操作清空重做栈
  }

  function undo() {
    if (engine.viewOnly) return;
    var op = engine.undoStack.pop();
    if (!op) { notify('warn', '没有可撤销的操作'); return; }
    applyOp(op, true);
    engine.redoStack.push(op);
    notify('info', '已撤销');
  }

  function redo() {
    if (engine.viewOnly) return;
    var op = engine.redoStack.pop();
    if (!op) { notify('warn', '没有可重做的操作'); return; }
    applyOp(op, false);
    engine.undoStack.push(op);
    notify('info', '已重做');
  }

  /** 应用操作（undo 时反向，redo 时正向） */
  function applyOp(op, isUndo) {
    if (op.type === 'place') {
      if (isUndo) {
        // 撤销放置 = 移除方块 + 返还库存
        removeBlockAt(op.x, op.y, op.z);
        addInventory(op.matId, 1);
      } else {
        // 重做放置 = 放回方块 + 扣库存
        if (addBlockAt(op.x, op.y, op.z, op.matId)) {
          spendInventory(op.matId, 1);
        }
      }
    } else if (op.type === 'erase') {
      if (isUndo) {
        // 撤销移除 = 放回方块 + 扣库存
        if (addBlockAt(op.x, op.y, op.z, op.matId)) {
          spendInventory(op.matId, 1);
        }
      } else {
        // 重做移除 = 再次移除 + 返还库存
        removeBlockAt(op.x, op.y, op.z);
        addInventory(op.matId, 1);
      }
    }
  }

  // ===================================================
  // 11. 通知 / 库存回调（与外部 app.js 解耦）
  // ===================================================

  function notify(type, msg) {
    var cb = engine.opts.onNotify;
    if (cb) { try { cb(type, msg); } catch (e) {} }
  }

  /** 获取某材料库存数量（优先用回调，否则读 localStorage） */
  function getInventoryCount(matId) {
    var cb = engine.opts.getInventory;
    if (cb) {
      try {
        var inv = cb();
        return (inv && inv[matId]) || 0;
      } catch (e) {}
    }
    return engine.inventory[matId] || 0;
  }

  /** 增加库存（返还） */
  function addInventory(matId, n) {
    var cb = engine.opts.addInventory;
    if (cb) { try { cb(matId, n); return; } catch (e) {} }
    engine.inventory[matId] = (engine.inventory[matId] || 0) + n;
    persistInventory();
  }

  /** 扣除库存 */
  function spendInventory(matId, n) {
    var cb = engine.opts.spendInventory;
    if (cb) { try { cb(matId, n); return; } catch (e) {} }
    engine.inventory[matId] = (engine.inventory[matId] || 0) - n;
    persistInventory();
  }

  function persistInventory() {
    safeSet(INVENTORY_KEY, engine.inventory);
  }

  function loadInventory() {
    engine.inventory = safeGet(INVENTORY_KEY, {});
    // 新用户首次进入赠送一些基础材料
    if (!engine.inventory._init) {
      engine.inventory._init = 1;
      engine.inventory.grass = (engine.inventory.grass || 0) + 50;
      engine.inventory.dirt = (engine.inventory.dirt || 0) + 50;
      engine.inventory.stone = (engine.inventory.stone || 0) + 30;
      engine.inventory.wood = (engine.inventory.wood || 0) + 20;
      persistInventory();
    }
  }

  /** 通知外部当前材料变化 */
  function emitMaterialChange() {
    var cb = engine.opts.onMaterialChange;
    if (cb) { try { cb(engine.curMatId); } catch (e) {} }
  }

  /** 刷新预览方块颜色（材料 / 模式变化后调用） */
  function refreshPreviewColor() {
    if (!engine.previewMesh) return;
    if (engine.mode === 'erase') {
      engine.previewMat.color.set(0xF44336);
    } else {
      var mat = findMaterial(engine.curMatId);
      engine.previewMat.color.set(mat ? mat.color : 0x7C5CFF);
    }
  }

  // ===================================================
  // 12. 序列化与分享码
  // ===================================================

  /** 把当前世界序列化成可保存 / 可分享的数据 */
  function serialize() {
    var blocks = [];
    for (var k in engine.blockMap) {
      var mesh = engine.blockMap[k];
      blocks.push({
        x: mesh.userData.x,
        y: mesh.userData.y,
        z: mesh.userData.z,
        matId: mesh.userData.matId
      });
    }
    return {
      scene: engine.sceneId,
      blocks: blocks,
      inventory: engine.inventory
    };
  }

  function save() {
    var data = serialize();
    safeSet(STORAGE_KEY, data);
    notify('ok', '世界已保存');
    return data;
  }

  function load() {
    var data = safeGet(STORAGE_KEY, null);
    if (!data) { notify('warn', '没有存档'); return false; }
    loadFromData(data);
    notify('ok', '已加载存档');
    return true;
  }

  /** 从数据对象恢复世界（不弹通知） */
  function loadFromData(data) {
    if (!data) return;
    clearAllBlocks();
    if (data.scene) setScene(data.scene);
    if (data.blocks) {
      for (var i = 0; i < data.blocks.length; i++) {
        var b = data.blocks[i];
        if (b.x >= 0 && b.x < GRID_SIZE && b.z >= 0 && b.z < GRID_SIZE && b.y >= 0) {
          addBlockAt(b.x, b.y, b.z, b.matId);
        }
      }
    }
    if (data.inventory) {
      engine.inventory = data.inventory;
      persistInventory();
    }
    engine.undoStack = [];
    engine.redoStack = [];
  }

  /** 生成分享码（base64 编码，只含场景和方块，不含库存） */
  function getShareCode() {
    var data = serialize();
    var mini = { s: data.scene, b: data.blocks };
    return b64Encode(JSON.stringify(mini));
  }

  /** 从分享码加载世界 */
  function loadFromShareCode(code) {
    if (!code) { notify('warn', '分享码为空'); return false; }
    var json = b64Decode(code);
    if (!json) { notify('warn', '分享码无效'); return false; }
    try {
      var mini = JSON.parse(json);
      if (!mini.s || !mini.b) { notify('warn', '分享码格式错误'); return false; }
      loadFromData({ scene: mini.s, blocks: mini.b, inventory: engine.inventory });
      notify('ok', '已从分享码加载');
      return true;
    } catch (e) {
      notify('warn', '分享码解析失败');
      return false;
    }
  }

  // ===================================================
  // 13. 场景 / 模式 / 材料切换
  // ===================================================

  function setScene(sceneId) {
    if (!SCENE_STYLE[sceneId]) { notify('warn', '场景不存在'); return; }
    engine.sceneId = sceneId;
    applySceneStyle();
  }

  function setMaterial(matId) {
    if (!findMaterial(matId)) { notify('warn', '材料不存在'); return; }
    engine.curMatId = matId;
    refreshPreviewColor();
    emitMaterialChange();
  }

  function setMode(mode) {
    if (mode !== 'place' && mode !== 'erase') return;
    engine.mode = mode;
    refreshPreviewColor();
  }

  // ===================================================
  // 14. 渲染循环 / 窗口大小适配
  // ===================================================

  function animate() {
    engine.rafId = requestAnimationFrame(animate);
    if (engine.destroyed) return;
    engine.renderer.render(engine.scene, engine.camera);
  }

  /** 重新设置画布尺寸（适配高分屏和窗口缩放） */
  function resize() {
    if (!engine.container || !engine.renderer) return;
    var w = engine.container.clientWidth || 600;
    var h = engine.container.clientHeight || 400;
    engine.camera.aspect = w / h;
    engine.camera.updateProjectionMatrix();
    engine.renderer.setSize(w, h, false);
    // 高分屏适配
    var dpr = window.devicePixelRatio || 1;
    engine.renderer.setPixelRatio(Math.min(dpr, 2));
  }

  // ===================================================
  // 15. 事件绑定 / 解绑
  // ===================================================

  function bindEvents() {
    var el = engine.renderer.domElement;
    el.addEventListener('mousedown', onPointerDown);
    el.addEventListener('mousemove', onPointerMove);
    el.addEventListener('mouseup', onPointerUp);
    el.addEventListener('mouseleave', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onPointerDown, { passive: false });
    el.addEventListener('touchmove', onPointerMove, { passive: false });
    el.addEventListener('touchend', onPointerUp);
    // 右键菜单屏蔽（方便右键平移）
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    window.addEventListener('resize', onResize);
  }

  function unbindEvents() {
    var el = engine.renderer ? engine.renderer.domElement : null;
    if (!el) return;
    el.removeEventListener('mousedown', onPointerDown);
    el.removeEventListener('mousemove', onPointerMove);
    el.removeEventListener('mouseup', onPointerUp);
    el.removeEventListener('mouseleave', onPointerUp);
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('touchstart', onPointerDown);
    el.removeEventListener('touchmove', onPointerMove);
    el.removeEventListener('touchend', onPointerUp);
    el.removeEventListener('contextmenu', function (e) { e.preventDefault(); });
    window.removeEventListener('resize', onResize);
  }

  function onResize() {
    resize();
  }

  // ===================================================
  // 16. 初始化 / 销毁
  // ===================================================

  /**
   * 初始化 3D 场景
   * @param {HTMLElement} container  外层 div 容器，canvas 会自动填充
   * @param {Object} opts            配置项
   *   opts.scene          初始场景 id（默认 'street'）
   *   opts.material       初始材料 id（默认 'grass'）
   *   opts.mode           初始模式（默认 'place'）
   *   opts.autoLoad       是否自动加载存档（默认 true）
   *   opts.onNotify       通知回调 (type, msg)
   *   opts.onMaterialChange 材料变化回调 (matId)
   *   opts.getInventory   获取库存回调 () => {matId:count}
   *   opts.spendInventory 扣库存回调 (matId, n)
   *   opts.addInventory   加库存回调 (matId, n)
   */
  function init(container, opts) {
    if (!container) return false;
    if (engine.destroyed === false && engine.renderer) {
      destroy();  // 防止重复初始化
    }

    engine.container = container;
    engine.opts = opts || {};
    engine.viewOnly = false;
    engine.destroyed = false;
    engine.blockMap = {};
    engine.textureCache = {};
    engine.undoStack = [];
    engine.redoStack = [];
    engine.hoverCell = null;

    // 初始化库存（与 2D 版共享）
    loadInventory();

    // 当前场景 / 材料 / 模式
    engine.sceneId = engine.opts.scene || 'street';
    engine.curMatId = engine.opts.material || 'grass';
    engine.mode = engine.opts.mode || 'place';

    // 相机注视点：地面中心
    engine.cameraTarget = new THREE.Vector3(GRID_SIZE / 2, 0, GRID_SIZE / 2);

    // ---- 创建场景 ----
    engine.scene = new THREE.Scene();

    // ---- 透视相机 ----
    var w = container.clientWidth || 600;
    var h = container.clientHeight || 400;
    engine.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);

    // ---- WebGL 渲染器 ----
    engine.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    engine.renderer.setSize(w, h, false);
    engine.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    engine.renderer.shadowMap.enabled = true;
    engine.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    engine.renderer.domElement.style.display = 'block';
    engine.renderer.domElement.style.width = '100%';
    engine.renderer.domElement.style.height = '100%';
    engine.renderer.domElement.style.touchAction = 'none';  // 触摸时不触发滚动
    container.appendChild(engine.renderer.domElement);

    // ---- 灯光：环境光 + 方向光（带阴影）----
    engine.ambient = new THREE.AmbientLight(0xffffff, 0.65);
    engine.scene.add(engine.ambient);

    engine.directional = new THREE.DirectionalLight(0xffffff, 0.85);
    engine.directional.position.set(15, 25, 12);
    engine.directional.castShadow = true;
    // 阴影范围覆盖整个地面
    engine.directional.shadow.mapSize.width = 1024;
    engine.directional.shadow.mapSize.height = 1024;
    engine.directional.shadow.camera.near = 1;
    engine.directional.shadow.camera.far = 80;
    engine.directional.shadow.camera.left = -20;
    engine.directional.shadow.camera.right = 30;
    engine.directional.shadow.camera.top = 30;
    engine.directional.shadow.camera.bottom = -10;
    engine.directional.shadow.bias = -0.0005;
    engine.scene.add(engine.directional);
    // 方向光目标设为地面中心
    engine.directional.target.position.copy(engine.cameraTarget);
    engine.scene.add(engine.directional.target);

    // ---- 地面 + 网格辅助线 ----
    engine.ground = createGround(getSceneStyle(engine.sceneId).ground);
    engine.scene.add(engine.ground);
    engine.gridHelper = createGridHelper();
    engine.scene.add(engine.gridHelper);

    // ---- 应用场景配色（天空 / 雾 / 地面色）----
    applySceneStyle();

    // ---- 悬停预览方块 ----
    engine.previewMesh = createPreviewMesh();
    engine.previewMat = engine.previewMesh.material;
    engine.scene.add(engine.previewMesh);
    refreshPreviewColor();

    // ---- 射线检测器 ----
    engine.raycaster = new THREE.Raycaster();
    engine.pointer = new THREE.Vector2();

    // ---- 更新相机位置 ----
    updateCamera();

    // ---- 绑定事件 ----
    bindEvents();

    // ---- 适配尺寸 ----
    resize();

    // ---- 自动加载存档 ----
    if (engine.opts.autoLoad !== false) {
      var data = safeGet(STORAGE_KEY, null);
      if (data) loadFromData(data);
    }

    // ---- 启动渲染循环 ----
    animate();

    return true;
  }

  /** 销毁 3D 场景，释放资源 */
  function destroy() {
    engine.destroyed = true;
    if (engine.rafId) { cancelAnimationFrame(engine.rafId); engine.rafId = 0; }
    unbindEvents();
    clearAllBlocks();
    // 释放纹理缓存
    for (var k in engine.textureCache) {
      if (engine.textureCache[k].top) engine.textureCache[k].top.dispose();
      if (engine.textureCache[k].side) engine.textureCache[k].side.dispose();
    }
    engine.textureCache = {};
    // 释放天空 / 地面 / 预览
    if (engine.skyMesh) { engine.scene.remove(engine.skyMesh); disposeMesh(engine.skyMesh); }
    if (engine.ground) { engine.scene.remove(engine.ground); disposeMesh(engine.ground); }
    if (engine.gridHelper) {
      engine.scene.remove(engine.gridHelper);
      if (engine.gridHelper.geometry) engine.gridHelper.geometry.dispose();
      if (engine.gridHelper.material) engine.gridHelper.material.dispose();
    }
    if (engine.previewMesh) { engine.scene.remove(engine.previewMesh); disposeMesh(engine.previewMesh); }
    // 移除 canvas
    if (engine.renderer) {
      if (engine.renderer.domElement && engine.renderer.domElement.parentNode) {
        engine.renderer.domElement.parentNode.removeChild(engine.renderer.domElement);
      }
      engine.renderer.dispose();
    }
    engine.scene = null;
    engine.camera = null;
    engine.renderer = null;
    engine.ground = null;
    engine.gridHelper = null;
    engine.skyMesh = null;
    engine.previewMesh = null;
    engine.previewMat = null;
    engine.container = null;
  }

  // ===================================================
  // 17. 只读浏览模式（浏览他人世界）
  // ===================================================

  /** 进入只读浏览模式（浏览他人世界） */
  function enterViewOnly(data) {
    if (!data) { notify('warn', '世界数据为空'); return false; }
    engine.viewOnly = true;
    engine.mode = 'place';  // 只读模式下不会真正放置（点击被屏蔽）
    clearAllBlocks();
    if (data.scene) setScene(data.scene);
    if (data.blocks) {
      for (var i = 0; i < data.blocks.length; i++) {
        var b = data.blocks[i];
        if (b.x >= 0 && b.x < GRID_SIZE && b.z >= 0 && b.z < GRID_SIZE && b.y >= 0) {
          addBlockAt(b.x, b.y, b.z, b.matId);
        }
      }
    }
    engine.undoStack = [];
    engine.redoStack = [];
    if (engine.previewMesh) engine.previewMesh.visible = false;
    return true;
  }

  /** 退出只读模式 */
  function exitViewOnly() {
    engine.viewOnly = false;
    engine.mode = 'place';
  }

  // ===================================================
  // 18. 辅助接口
  // ===================================================

  /** 获取当前方块总数 */
  function getBlockCount() {
    var n = 0;
    for (var k in engine.blockMap) n++;
    return n;
  }

  /** 获取当前材料 id */
  function getMaterial() { return engine.curMatId; }

  /** 获取当前模式 */
  function getMode() { return engine.mode; }

  /** 获取当前场景 id */
  function getScene() { return engine.sceneId; }

  /** 是否只读模式 */
  function isViewOnly() { return engine.viewOnly; }

  /** 重置视角到默认位置 */
  function resetView() {
    engine.cameraTarget = new THREE.Vector3(GRID_SIZE / 2, 0, GRID_SIZE / 2);
    engine.cameraDistance = 28;
    engine.cameraAngleH = Math.PI / 4;
    engine.cameraAngleV = Math.PI / 3.5;
    updateCamera();
  }

  // ===================================================
  // 19. 暴露 window.World3D 接口
  // ===================================================
  window.World3D = {
    // 核心
    init: init,
    setScene: setScene,
    setMaterial: setMaterial,
    setMode: setMode,
    undo: undo,
    redo: redo,
    save: save,
    load: load,
    getShareCode: getShareCode,
    loadFromShareCode: loadFromShareCode,
    resize: resize,
    destroy: destroy,
    getBlockCount: getBlockCount,
    enterViewOnly: enterViewOnly,
    // 额外辅助接口（方便 UI 调用）
    exitViewOnly: exitViewOnly,
    isViewOnly: isViewOnly,
    serialize: serialize,
    loadFromData: loadFromData,
    getMaterial: getMaterial,
    getMode: getMode,
    getScene: getScene,
    resetView: resetView,
    GRID_SIZE: GRID_SIZE
  };

})(window);
