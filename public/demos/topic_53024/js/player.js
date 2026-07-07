// 玩家系统全局变量
var player;
var playerVelocity = new THREE.Vector3();
var isGrounded = false;
var canJump = true;
var yaw = 0, pitch = 0;
var keys = {};
var isPointerLocked = false;
var nearbyNPC = null;
var npcs = [];
var shards = [];
var collectibles = [];
var animationId;
var lastFrameTime = 0;
var isMoving = false; // 是否正在移动
var lastMoveYaw = 0; // 上次移动时的目标 yaw

// 第三人称相机参数
var CAMERA_DISTANCE = 14;   // 相机距离玩家的距离
var CAMERA_MIN_DIST = 6;    // 最小距离（防止穿模）

function createPlayer() {
    player = new THREE.Group();

    var bodyColor = 0x5DBDB6;
    var skinColor = 0xFFCCAA;
    var pantsColor = 0x4A6FA5;
    var shoeColor = 0x8D6E63;

    // === 腿部（Pivot 在臀部，方便做走路动画）===
    var legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.5, 6);
    var legMat = new THREE.MeshLambertMaterial({ color: pantsColor });
    var shoeGeo = new THREE.BoxGeometry(0.18, 0.1, 0.25);
    var shoeMat = new THREE.MeshLambertMaterial({ color: shoeColor });

    // 左腿 Pivot（旋转中心在臀部 y=0.5）
    var leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.15, 0.5, 0);
    var leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.y = -0.25; // 腿中心在 pivot 下方
    leftLeg.castShadow = true;
    leftLegPivot.add(leftLeg);
    var leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(0, -0.45, 0.05);
    leftLegPivot.add(leftShoe);
    player.add(leftLegPivot);

    // 右腿 Pivot
    var rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.15, 0.5, 0);
    var rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.y = -0.25;
    rightLeg.castShadow = true;
    rightLegPivot.add(rightLeg);
    var rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0, -0.45, 0.05);
    rightLegPivot.add(rightShoe);
    player.add(rightLegPivot);

    // === 身体（躯干）===
    var bodyGeo = new THREE.CylinderGeometry(0.35, 0.42, 0.7, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    body.castShadow = true;
    body.name = 'body';
    player.add(body);

    // === 手臂（Pivot 在肩膀，方便做摆臂动画）===
    var armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.5, 6);
    var armMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    var handGeo = new THREE.SphereGeometry(0.09, 6, 6);
    var handMat = new THREE.MeshLambertMaterial({ color: skinColor });

    // 左臂 Pivot（旋转中心在肩膀 y=1.0）
    var leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.42, 1.0, 0);
    var leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.y = -0.25;
    leftArmPivot.add(leftArm);
    var leftHand = new THREE.Mesh(handGeo, handMat);
    leftHand.position.y = -0.52;
    leftArmPivot.add(leftHand);
    player.add(leftArmPivot);

    // 右臂 Pivot
    var rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.42, 1.0, 0);
    var rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.y = -0.25;
    rightArmPivot.add(rightArm);
    var rightHand = new THREE.Mesh(handGeo, handMat);
    rightHand.position.y = -0.52;
    rightArmPivot.add(rightHand);
    player.add(rightArmPivot);

    // 保存动画引用
    player.userData.leftLegPivot = leftLegPivot;
    player.userData.rightLegPivot = rightLegPivot;
    player.userData.leftArmPivot = leftArmPivot;
    player.userData.rightArmPivot = rightArmPivot;
    player.userData.walkPhase = 0; // 走路动画相位

    // === 头 ===
    var headGeo = new THREE.SphereGeometry(0.32, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: skinColor });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    player.add(head);

    // === 眼睛 ===
    var eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0x333333 });

    var leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 1.4, 0.28);
    player.add(leftEye);

    var rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 1.4, 0.28);
    player.add(rightEye);

    // === 嘴巴（微笑）===
    var mouthGeo = new THREE.TorusGeometry(0.06, 0.015, 4, 8, Math.PI);
    var mouthMat = new THREE.MeshBasicMaterial({ color: 0xCC6666 });
    var mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 1.32, 0.28);
    mouth.rotation.x = Math.PI;
    player.add(mouth);

    // === 帽子（可自定义）===
    var hatGroup = new THREE.Group();
    hatGroup.name = 'hat';

    // 帽檐
    var brimGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.05, 8);
    var brimMat = new THREE.MeshLambertMaterial({ color: COLORS.npc[0] });
    var brim = new THREE.Mesh(brimGeo, brimMat);
    brim.position.y = 1.6;
    hatGroup.add(brim);

    // 帽顶
    var topGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.25, 8);
    var top = new THREE.Mesh(topGeo, brimMat);
    top.position.y = 1.75;
    hatGroup.add(top);

    // 帽顶装饰
    var decoGeo = new THREE.SphereGeometry(0.08, 6, 6);
    var decoMat = new THREE.MeshLambertMaterial({ color: 0xF5C542 });
    var deco = new THREE.Mesh(decoGeo, decoMat);
    deco.position.y = 1.92;
    hatGroup.add(deco);

    player.add(hatGroup);

    // === 背包 ===
    var bagGroup = new THREE.Group();
    bagGroup.name = 'bag';

    var bagBodyGeo = new THREE.BoxGeometry(0.4, 0.5, 0.25);
    var bagMat = new THREE.MeshLambertMaterial({ color: COLORS.shard });
    var bagBody = new THREE.Mesh(bagBodyGeo, bagMat);
    bagBody.position.y = 0.05;
    bagGroup.add(bagBody);

    // 背包盖
    var bagFlapGeo = new THREE.BoxGeometry(0.42, 0.15, 0.28);
    var bagFlap = new THREE.Mesh(bagFlapGeo, bagMat);
    bagFlap.position.y = 0.35;
    bagGroup.add(bagFlap);

    // 背包扣
    var buckleGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
    var buckleMat = new THREE.MeshLambertMaterial({ color: 0xF5C542 });
    var buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 0.2, 0.14);
    bagGroup.add(buckle);

    bagGroup.position.set(0, 0.75, -0.35);
    player.add(bagGroup);

    // 初始位置 - 一年级大陆
    var startLat = -65 * Math.PI / 180;
    var startLon = 0;
    var startPos = latLonToVector(startLat, startLon, PLANET_RADIUS + PLAYER_HEIGHT);
    player.position.copy(startPos);

    // 初始朝向：头顶朝外，面朝北
    var upDir = player.position.clone().normalize();
    var forwardDir = new THREE.Vector3(0, 0, -1);
    forwardDir.sub(upDir.clone().multiplyScalar(forwardDir.dot(upDir)));
    forwardDir.normalize();
    var rightDir = new THREE.Vector3().crossVectors(forwardDir, upDir).normalize();
    forwardDir.crossVectors(upDir, rightDir).normalize();
    var rotMatrix = new THREE.Matrix4();
    // 注意：新模型的局部 Y 是"上"（头），Z 是"前"（脸朝向）
    // makeBasis(xAxis, yAxis, zAxis) = right, up, forward
    rotMatrix.makeBasis(rightDir, upDir, forwardDir);
    player.quaternion.setFromRotationMatrix(rotMatrix);

    scene.add(player);

    // 创建玩家物理体（胶囊形碰撞）
    var playerShape = new CANNON.Sphere(0.6); // 碰撞半径略大于视觉模型
    playerBody = new CANNON.Body({
        mass: 1,
        shape: playerShape,
        linearDamping: 0.1,
        angularDamping: 0.99 // 阻止物理引擎旋转玩家
    });
    playerBody.position.set(player.position.x, player.position.y, player.position.z);
    playerBody.fixedRotation = true; // 禁止物理引擎控制旋转，由手动朝向控制
    physicsWorld.addBody(playerBody);

    // 相机初始位置
    updateCameraPosition();
}

function updateCameraPosition() {
    if (!player) return;

    // 球面法线方向（从中心指向玩家 = "上方"）
    var up = player.position.clone().normalize();

    // 基于球面法线构建局部坐标系
    // forward = 玩家面朝方向（基于yaw），投影到切平面
    var localForward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    localForward.sub(up.clone().multiplyScalar(localForward.dot(up)));
    if (localForward.lengthSq() < 0.001) localForward.set(0, 0, -1);
    localForward.normalize();

    // right = forward × up
    var localRight = new THREE.Vector3().crossVectors(localForward, up).normalize();
    // 重新正交化 forward
    localForward.crossVectors(up, localRight).normalize();

    // 相机在玩家后方（-forward方向）+ 上方（+up方向）
    // pitch 控制俯仰：pitch=0 水平后方，pitch>0 抬高（俯视玩家），pitch<0 降低（仰视玩家）
    var cosPitch = Math.cos(pitch);
    var sinPitch = Math.sin(pitch);

    // 相机偏移：后方 + 上方
    var backDir = localForward.clone().multiplyScalar(-1); // 玩家后方
    var cameraOffset = backDir.clone().multiplyScalar(cosPitch)
        .add(up.clone().multiplyScalar(sinPitch + 0.3)); // +0.3 保证始终有一点高度
    cameraOffset.normalize();

    // 相机目标位置
    var targetCameraPos = player.position.clone().add(cameraOffset.multiplyScalar(CAMERA_DISTANCE));

    // 防止穿入星球内部：相机到星球中心的距离必须 >= 玩家到中心距离 + 最小距离
    var playerDistFromCenter = player.position.length();
    var cameraDistFromCenter = targetCameraPos.length();
    var minAllowedDist = playerDistFromCenter + CAMERA_MIN_DIST;

    if (cameraDistFromCenter < minAllowedDist) {
        // 将相机推远到最小允许距离
        var dirFromCenter = targetCameraPos.clone().normalize();
        targetCameraPos.copy(dirFromCenter.multiplyScalar(minAllowedDist));
    }

    // 平滑移动相机（只用于相机跟随，不用于鼠标响应）
    camera.position.lerp(targetCameraPos, 0.25);

    // 相机始终看向玩家头部位置
    var lookTarget = player.position.clone().add(up.clone().multiplyScalar(1.5));
    camera.lookAt(lookTarget);

    // 强制设置相机的 up 向量为球面法线
    camera.up.copy(up);
}

function onMouseMove(e) {
    if (!isPointerLocked) return;
    yaw += e.movementX * MOUSE_SENSITIVITY_X;
    pitch -= e.movementY * MOUSE_SENSITIVITY_Y;
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
}

function onKeyDown(e) {
    keys[e.code] = true;

    if (e.code === 'KeyE') {
        if (nearbyNPC && !GameState.questionOpen && !GameState.levelComplete && !GameState.dialogueOpen) {
            startDialogue(nearbyNPC);
        }
    }

    // 跳跃
    if (e.code === 'Space' && isGrounded && canJump && !GameState.questionOpen && !GameState.dialogueOpen) {
        var jumpDir = player.position.clone().normalize();
        playerVelocity.add(jumpDir.multiplyScalar(JUMP_FORCE));
        canJump = false;
        isGrounded = false;
    }

    if (e.code === 'KeyC' && !GameState.questionOpen && !GameState.dialogueOpen) {
        openCustomize();
    }

    // M键切换静音
    if (e.code === 'KeyM') {
        var bgMusic = document.getElementById('bg-music');
        var muteBtn = document.getElementById('mute-btn');
        if (bgMusic && muteBtn) {
            bgMusic.muted = !bgMusic.muted;
            muteBtn.classList.toggle('muted', bgMusic.muted);
            muteBtn.innerHTML = bgMusic.muted ? '&#128263;' : '&#128264;';
        }
    }
}

function updatePlayer(dt) {
    if (!player || GameState.questionOpen || GameState.levelComplete || GameState.dialogueOpen) return;

    // 鼠标直接映射到 yaw/pitch，无需平滑
    var playerUp = player.position.clone().normalize();
    var distFromCenter = player.position.length();
    var groundHeight = PLANET_RADIUS + PLAYER_HEIGHT;

    // === 重力 ===
    // 重力始终指向星球中心
    var gravityDir = playerUp.clone().multiplyScalar(-1);
    playerVelocity.add(gravityDir.multiplyScalar(GRAVITY * dt));

    // === 地面检测 ===
    if (distFromCenter <= groundHeight + 0.1) {
        // 在地面上
        if (playerVelocity.dot(playerUp) < 0) {
            // 速度朝向星球内部，停止垂直速度
            var verticalSpeed = playerVelocity.dot(playerUp);
            playerVelocity.sub(playerUp.clone().multiplyScalar(verticalSpeed));
        }

        // 贴地
        player.position.normalize().multiplyScalar(groundHeight);
        isGrounded = true;
        canJump = true;
    } else {
        // 在空中
        isGrounded = false;
    }

    // === 水平移动（基于球面切平面）===
    var speed = isGrounded ? 8 : 4;

    // 基于玩家当前朝向构建球面局部坐标系
    // forwardLocal: 玩家面朝方向在切平面上的投影
    var worldForward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    var forwardLocal = worldForward.clone().sub(playerUp.clone().multiplyScalar(worldForward.dot(playerUp)));
    if (forwardLocal.lengthSq() < 0.001) {
        // 如果 forward 和 up 平行（极点），使用默认方向
        forwardLocal.set(1, 0, 0);
        forwardLocal.sub(playerUp.clone().multiplyScalar(forwardLocal.dot(playerUp)));
    }
    forwardLocal.normalize();

    // rightLocal = forwardLocal × up（右手坐标系）
    var rightLocal = new THREE.Vector3().crossVectors(forwardLocal, playerUp).normalize();

    var moveDir = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp']) moveDir.add(forwardLocal);
    if (keys['KeyS'] || keys['ArrowDown']) moveDir.sub(forwardLocal);
    if (keys['KeyA'] || keys['ArrowLeft']) moveDir.sub(rightLocal);
    if (keys['KeyD'] || keys['ArrowRight']) moveDir.add(rightLocal);

    if (moveDir.length() > 0) {
        moveDir.normalize();

        // === 自动视角切换：按键时 yaw 平滑旋转到移动方向 ===
        // moveDir 在世界空间中，计算其对应的 yaw
        var targetYaw = Math.atan2(-moveDir.x, -moveDir.z);
        // 计算最短旋转角度差
        var yawDiff = targetYaw - yaw;
        // 归一化到 [-PI, PI]
        while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
        while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;
        // 平滑旋转（每秒旋转 5 弧度 ≈ 约 1.2 秒转 90 度）
        yaw += yawDiff * Math.min(5 * dt, 1); // 使用 lerp 而非固定速度，更平滑
        isMoving = true;

        // moveDir 已经在切平面上了（因为 forwardLocal 和 rightLocal 都垂直于 up）
        var moveOnSurface = moveDir.clone().multiplyScalar(speed * dt);

        // 如果是地面行走，直接设置水平速度；如果是空中，累加
        if (isGrounded) {
            // 保留垂直速度，替换水平速度
            var verticalVel = playerVelocity.dot(playerUp);
            playerVelocity.copy(playerUp.clone().multiplyScalar(verticalVel));
            playerVelocity.add(moveOnSurface.multiplyScalar(15)); // 地面移动
        } else {
            playerVelocity.add(moveOnSurface.multiplyScalar(5));
        }

        // === 走路动画 ===
        player.userData.walkPhase += dt * 10; // 动画速度
        var swingAngle = Math.sin(player.userData.walkPhase) * 0.6; // 腿摆动幅度 ±0.6 弧度
        player.userData.leftLegPivot.rotation.x = swingAngle;
        player.userData.rightLegPivot.rotation.x = -swingAngle;
        // 手臂与腿反向摆动
        player.userData.leftArmPivot.rotation.x = -swingAngle * 0.5;
        player.userData.rightArmPivot.rotation.x = swingAngle * 0.5;
    } else if (isGrounded) {
        // 没有输入时，地面摩擦力减速
        playerVelocity.multiplyScalar(0.85);

        // === 站立姿态：恢复默认 ===
        player.userData.leftLegPivot.rotation.x *= 0.85;
        player.userData.rightLegPivot.rotation.x *= 0.85;
        player.userData.leftArmPivot.rotation.x *= 0.85;
        player.userData.rightArmPivot.rotation.x *= 0.85;
    }

    // === 应用速度 ===
    player.position.add(playerVelocity.clone().multiplyScalar(dt));

    // === cannon-es 物理步进（碰撞检测）===
    // 同步位置和速度到物理体
    playerBody.position.set(player.position.x, player.position.y, player.position.z);
    playerBody.velocity.set(playerVelocity.x, playerVelocity.y, playerVelocity.z);

    // 手动施加球面重力到物理体
    var gravDir = player.position.clone().normalize().multiplyScalar(-GRAVITY);
    playerBody.force.set(gravDir.x, gravDir.y, gravDir.z);

    // 步进物理世界
    physicsWorld.step(1 / 60, dt, 3);

    // 从物理体读取碰撞修正后的位置
    player.position.set(playerBody.position.x, playerBody.position.y, playerBody.position.z);
    playerVelocity.set(playerBody.velocity.x, playerBody.velocity.y, playerBody.velocity.z);

    // 重新做球面约束（碰撞可能把玩家推离球面）
    var postDist = player.position.length();
    if (postDist < groundHeight) {
        // 碰撞把玩家推入星球内部，推回地面
        player.position.normalize().multiplyScalar(groundHeight);
    }

    // === 更新朝向 ===
    // 让玩家的"头顶"指向星球外侧（法线方向），"正面"朝向行走方向
    var upDir = player.position.clone().normalize();
    var forwardDir = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    // 将 forward 投影到切平面（垂直于 upDir）
    forwardDir.sub(upDir.clone().multiplyScalar(forwardDir.dot(upDir)));
    if (forwardDir.lengthSq() > 0.001) {
        forwardDir.normalize();
        // 计算 right 方向（注意叉积顺序：up × forward = right，这样左右才正确）
        var rightDir = new THREE.Vector3().crossVectors(upDir, forwardDir).normalize();
        // 重新计算正交的 forward
        forwardDir.crossVectors(rightDir, upDir).normalize();
        // 构建旋转矩阵
        var rotMatrix = new THREE.Matrix4();
        // 新模型：Y 轴向上（头），Z 轴向前（脸朝向）
        rotMatrix.makeBasis(rightDir, upDir, forwardDir);
        player.quaternion.setFromRotationMatrix(rotMatrix);
    }

    // === 更新相机 ===
    // 归一化 yaw 到 [-PI, PI]
    while (yaw > Math.PI) yaw -= 2 * Math.PI;
    while (yaw < -Math.PI) yaw += 2 * Math.PI;

    updateCameraPosition();

    // === NPC检测 ===
    nearbyNPC = null;
    var minDist = Infinity;
    npcs.forEach(function(npc) {
        var dist = player.position.distanceTo(npc.position);
        if (dist < 8 && dist < minDist) { minDist = dist; nearbyNPC = npc; }
    });

    var hint = document.getElementById('npc-hint');
    if (nearbyNPC) {
        hint.textContent = '按 E 与 ' + nearbyNPC.userData.name + ' 对话';
        hint.classList.add('visible');
    } else {
        hint.classList.remove('visible');
    }

    // === 碎片检测 ===
    shards.forEach(function(shard) {
        if (!shard.userData.collected && player.position.distanceTo(shard.position) < 3) {
            shard.userData.collected = true;
            shard.visible = false;
            GameState.energyShards++;
            updateEnergyHUD();
            showShardPopup();
        }
    });

    // === 收集品检测 ===
    collectibles.forEach(function(item) {
        if (!item.userData.collected && player.position.distanceTo(item.position) < 3) {
            item.userData.collected = true;
            item.visible = false;
            showCollectibleHint(item.userData.text + ' - ' + item.userData.fact);
            GameState.score += 20;
            updateHUD();
        }
    });

    // === 更新NPC动画 ===
    npcs.forEach(function(npc, i) {
        npc.rotation.y += 0.01;
        var floatY = Math.sin(Date.now() * 0.002 + i * 1.5) * 0.2;
        npc.position.add(npc.position.clone().normalize().multiplyScalar(floatY * 0.01));
    });

    // === 更新碎片动画 ===
    shards.forEach(function(shard, i) {
        if (!shard.userData.collected) {
            shard.rotation.y += 0.02;
            shard.rotation.x += 0.01;
            var pulse = 1 + Math.sin(Date.now() * 0.003 + i) * 0.2;
            shard.scale.setScalar(pulse);
        }
    });

    // === 更新收集品动画 ===
    collectibles.forEach(function(item, i) {
        if (!item.userData.collected) {
            item.rotation.y += 0.015;
        }
    });

    // === 更新云层 ===
    scene.children.forEach(function(child) {
        if (child.userData && child.userData.speed) {
            child.userData.lon += child.userData.speed;
            var newPos = latLonToVector(child.userData.lat, child.userData.lon, PLANET_RADIUS + 25);
            child.position.copy(newPos);
        }
    });
}
