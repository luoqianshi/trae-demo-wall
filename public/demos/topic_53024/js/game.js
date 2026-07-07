// ============================================================
// 主游戏逻辑 - 初始化和游戏循环
// ============================================================

var scene, camera, renderer;
var animationId, lastFrameTime = 0;

// 点击事件处理（用于请求 Pointer Lock）
function onClick() {
    if (!isPointerLocked && !GameState.questionOpen && !GameState.dialogueOpen && !GameState.levelComplete) {
        document.body.requestPointerLock();
    }
}

function initGame() {
    var canvas = document.getElementById('game-canvas');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.sky);
    scene.fog = new THREE.Fog(COLORS.sky, 80, 350);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 环境光 + 方向光（柔和）
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    var sun = new THREE.DirectionalLight(0xfff5e6, 0.7);
    sun.position.set(100, 150, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    scene.add(sun);

    // 半球光（模拟天空反射）
    var hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x7CB342, 0.3);
    scene.add(hemiLight);

    initPhysics();
    createPlanet();
    createPlayer();
    spawnNPCs(0);
    spawnShards(0);
    spawnCollectibles(0);

    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', function(e) { keys[e.code] = false; });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', function() {
        isPointerLocked = document.pointerLockElement === document.body;
    });

    // 移动端检测
    if ('ontouchstart' in window) {
        initMobileControls();
    }

    animate();
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    // 使用 performance.now() 计算真实帧间隔（秒）
    var now = performance.now();
    var dt = lastFrameTime === 0 ? 0.016 : Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;
    updatePlayer(dt);
    renderer.render(scene, camera);
}
