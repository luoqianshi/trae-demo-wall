// ============================================================
// 沙漠怪物骨骼动画系统 - 包含三种怪物的模型构建器和动画更新
// ============================================================
// 使用Three.js Group层级结构模拟骨骼动画
// 每个模型返回 { group, bones, updateAnim(dt, state, speed) }

const MonsterBones = {

  // ============================================================
  // 1. 沙漠巨蝎 - Scorpion with walking animation
  // ============================================================
  createScorpion() {
    const group = new THREE.Group();
    const bones = {};

    const matBody = new THREE.MeshLambertMaterial({ color: 0xC4A35A });
    const matBodyDark = new THREE.MeshLambertMaterial({ color: 0xB8935A });
    const matLeg = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
    const matPincer = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const matTail = new THREE.MeshLambertMaterial({ color: 0xA07840 });
    const matTailMid = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const matTailTip = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
    const matStinger = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const matEye = new THREE.MeshLambertMaterial({ color: 0x111111 });

    function addBox(w, h, d, x, y, z, mat, parent) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      (parent || group).add(mesh);
      return mesh;
    }

    // === 身体主体 (扁平) ===
    // 中心在Y=0.6，底部在Y=0.1，被腿支撑
    addBox(2.8, 0.7, 2.2, 0, 0.65, 0, matBody);
    // 腹部后端
    addBox(2.2, 0.6, 0.8, 0, 0.6, -1.4, matBodyDark);
    addBox(1.8, 0.5, 0.7, 0, 0.55, -2.1, matBodyDark);
    addBox(1.4, 0.45, 0.6, 0, 0.525, -2.7, matBody);

    // === 尾巴骨骼链 - 5节 + 毒刺 ===
    const tailRoot = new THREE.Group();
    tailRoot.position.set(0, 0.55, -3.0);
    group.add(tailRoot);
    bones.tailRoot = tailRoot;

    const tailSegments = [];
    let tailParent = tailRoot;
    const tailSizes = [0.5, 0.45, 0.4, 0.35, 0.3];
    const tailColors = [matTail, matTail, matTailMid, matTailMid, matTailTip];
    const tailAngles = [0.3, 0.35, 0.4, 0.45, 0.5]; // 弧度

    for (let i = 0; i < 5; i++) {
      const segGroup = new THREE.Group();
      // 每节相对于父节点的位置
      segGroup.position.set(0, tailSizes[i] * 0.6, -tailSizes[i] * 0.3);
      segGroup.rotation.x = -tailAngles[i];
      tailParent.add(segGroup);

      const s = tailSizes[i];
      addBox(s, s, s * 1.2, 0, 0, 0, tailColors[i], segGroup);

      tailSegments.push(segGroup);
      tailParent = segGroup;
    }
    bones.tailSegments = tailSegments;

    // 毒刺
    const stingerGroup = new THREE.Group();
    stingerGroup.position.set(0, 0.15, -0.2);
    tailParent.add(stingerGroup);
    addBox(0.12, 0.35, 0.12, 0, 0.15, -0.1, matStinger, stingerGroup);
    addBox(0.08, 0.2, 0.08, 0, 0.4, -0.15, matStinger, stingerGroup);
    bones.stinger = stingerGroup;

    // === 钳子 - 左右各一个，可开合 ===
    function createPincer(side) {
      const pincerRoot = new THREE.Group();
      pincerRoot.position.set(side * 1.2, 0.6, 1.0);
      group.add(pincerRoot);

      // 上臂
      addBox(0.5, 0.4, 1.2, side * 0.3, 0, 0.5, matPincer, pincerRoot);
      // 下臂
      addBox(0.4, 0.35, 1.0, side * 0.3, -0.2, 0.5, matPincer, pincerRoot);
      // 关节
      addBox(0.45, 0.45, 0.45, side * 0.3, 0, 1.2, matPincer, pincerRoot);

      // 上爪 - 可旋转
      const upperClaw = new THREE.Group();
      upperClaw.position.set(side * 0.3, 0.1, 1.4);
      pincerRoot.add(upperClaw);
      addBox(0.3, 0.12, 1.0, 0, 0.1, 0.4, matPincer, upperClaw);
      addBox(0.25, 0.1, 0.3, 0, 0.05, 0.9, matPincer, upperClaw);

      // 下爪 - 可旋转
      const lowerClaw = new THREE.Group();
      lowerClaw.position.set(side * 0.3, -0.1, 1.4);
      pincerRoot.add(lowerClaw);
      addBox(0.3, 0.12, 1.0, 0, -0.1, 0.4, matPincer, lowerClaw);
      addBox(0.25, 0.1, 0.3, 0, -0.05, 0.9, matPincer, lowerClaw);

      return { root: pincerRoot, upper: upperClaw, lower: lowerClaw };
    }

    const leftPincer = createPincer(-1);
    const rightPincer = createPincer(1);
    bones.leftPincer = leftPincer;
    bones.rightPincer = rightPincer;

    // === 8条腿 - 每侧4条，每腿2段骨骼 ===
    // 腿布局: 前2条较长(捕食用)，后2条较短(支撑用)
    const legs = [];
    function createLeg(side, zPos, isFront) {
      const legRoot = new THREE.Group();
      legRoot.position.set(side * 1.4, 0.3, zPos);
      group.add(legRoot);

      // 上腿 (coxa+trochanter+femur) - 向外上方
      const upperLen = isFront ? 1.0 : 0.8;
      const upperAngle = isFront ? 0.6 : 0.4;
      const upperLeg = new THREE.Group();
      upperLeg.position.set(0, 0, 0);
      upperLeg.rotation.z = side * upperAngle;
      legRoot.add(upperLeg);
      addBox(0.12, 0.12, upperLen, 0, 0, upperLen * 0.5, matLeg, upperLeg);

      // 下腿 (tibia+tarsus) - 向下到地面
      const lowerLeg = new THREE.Group();
      lowerLeg.position.set(0, 0, upperLen);
      lowerLeg.rotation.z = side * -1.0; // 向下折
      upperLeg.add(lowerLeg);
      const lowerLen = isFront ? 0.7 : 0.6;
      addBox(0.1, 0.1, lowerLen, 0, 0, lowerLen * 0.5, matLeg, lowerLeg);

      // 脚尖
      const foot = new THREE.Group();
      foot.position.set(0, 0, lowerLen);
      lowerLeg.add(foot);
      addBox(0.08, 0.08, 0.15, 0, 0, 0.08, matLeg, foot);

      return { root: legRoot, upper: upperLeg, lower: lowerLeg, foot };
    }

    const legZPositions = [0.6, 0.1, -0.5, -1.0];
    const legIsFront = [true, true, false, false];
    for (let i = 0; i < 4; i++) {
      legs.push(createLeg(1, legZPositions[i], legIsFront[i]));
      legs.push(createLeg(-1, legZPositions[i], legIsFront[i]));
    }
    bones.legs = legs;

    // === 眼睛 ===
    addBox(0.1, 0.1, 0.1, -0.25, 1.05, 1.0, matEye);
    addBox(0.1, 0.1, 0.1, 0.25, 1.05, 1.0, matEye);

    group.name = 'desertMonster_scorpion';

    // === 动画更新函数 ===
    bones.updateAnim = function(dt, state, speed, animTimer, isAttacking, attackAnimTimer, attackType) {
      const t = animTimer;

      // --- 行走动画: 8条腿交替 ---
      // 三足步态: 左前+右中+左后 与 右前+左中+右后 交替
      const walkSpeed = speed * 3;
      const legPhases = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5];

      for (let i = 0; i < 8; i++) {
        const leg = legs[i];
        const side = i % 2 === 0 ? 1 : -1; // 右/左
        const pairIdx = Math.floor(i / 2); // 0=前, 1=中前, 2=中后, 3=后
        const phase = legPhases[pairIdx] + (side > 0 ? 0 : Math.PI);

        // 上腿前后摆动
        const swing = Math.sin(t * walkSpeed + phase) * 0.25;
        leg.upper.rotation.z = side * (0.5 + swing);

        // 下腿随上腿联动
        const lift = Math.max(0, Math.sin(t * walkSpeed + phase));
        leg.lower.rotation.z = side * (-0.8 + lift * 0.3);

        // 脚尖微动
        leg.foot.rotation.x = Math.sin(t * walkSpeed + phase) * 0.1;
      }

      // --- 身体轻微起伏 ---
      group.position.y = Math.sin(t * walkSpeed * 2) * 0.03;

      // --- 钳子轻微开合 ( idle 时 ) ---
      const pincerOpen = Math.sin(t * 2) * 0.08;
      leftPincer.upper.rotation.x = -0.1 + pincerOpen;
      leftPincer.lower.rotation.x = 0.1 - pincerOpen;
      rightPincer.upper.rotation.x = -0.1 + pincerOpen;
      rightPincer.lower.rotation.x = 0.1 - pincerOpen;

      // --- 尾巴自然摇摆 ---
      if (!isAttacking) {
        const tailSway = Math.sin(t * 1.5) * 0.08;
        tailRoot.rotation.z = tailSway;
        tailRoot.rotation.y = Math.sin(t * 0.8) * 0.05;

        // 各节微动
        tailSegments.forEach((seg, i) => {
          seg.rotation.z = Math.sin(t * 1.5 + i * 0.3) * 0.03;
        });
      } else {
        // 攻击动画时长 0.35 秒
        const attackDuration = 0.35;
        if (attackType === 'pincer') {
          // === 钳子攻击: 张开蓄力 -> 猛夹 -> 收回 ===
          const pinchPhase = Math.min(1.0, attackAnimTimer / attackDuration);
          if (pinchPhase < 0.35) {
            // 蓄力: 钳子张开到最大
            const windup = pinchPhase / 0.35;
            leftPincer.upper.rotation.x = -0.1 - windup * 0.3;   // -0.1 -> -0.4
            leftPincer.lower.rotation.x = 0.1 + windup * 0.3;    // 0.1 -> 0.4
            rightPincer.upper.rotation.x = -0.1 - windup * 0.3;
            rightPincer.lower.rotation.x = 0.1 + windup * 0.3;
            // 身体前 thrust
            leftPincer.root.position.z = 1.0 + windup * 0.5;
            rightPincer.root.position.z = 1.0 + windup * 0.5;
            leftPincer.root.position.x = -1.2 - windup * 0.15;
            rightPincer.root.position.x = 1.2 + windup * 0.15;
          } else if (pinchPhase < 0.55) {
            // 猛夹: 快速闭合
            const snap = (pinchPhase - 0.35) / 0.2;
            leftPincer.upper.rotation.x = -0.4 + snap * 0.6;   // -0.4 -> 0.2
            leftPincer.lower.rotation.x = 0.4 - snap * 0.6;    // 0.4 -> -0.2
            rightPincer.upper.rotation.x = -0.4 + snap * 0.6;
            rightPincer.lower.rotation.x = 0.4 - snap * 0.6;
            // 身体前冲
            group.position.z += 0.3;
          } else {
            // 收回
            const retract = (pinchPhase - 0.55) / 0.45;
            leftPincer.upper.rotation.x = 0.2 - retract * 0.3;  // 0.2 -> -0.1
            leftPincer.lower.rotation.x = -0.2 + retract * 0.3; // -0.2 -> 0.1
            rightPincer.upper.rotation.x = 0.2 - retract * 0.3;
            rightPincer.lower.rotation.x = -0.2 + retract * 0.3;
            leftPincer.root.position.z = 1.5 - retract * 0.5;
            rightPincer.root.position.z = 1.5 - retract * 0.5;
            leftPincer.root.position.x = -1.35 + retract * 0.15;
            rightPincer.root.position.x = 1.35 - retract * 0.15;
          }
          // 攻击时尾巴收起
          tailRoot.rotation.x = 0.3;
        } else {
          // === 尾巴攻击: 蓄力后摆 -> 极速前刺 -> 回弹 ===
          const stabPhase = Math.min(1.0, attackAnimTimer / attackDuration);
          if (stabPhase < 0.30) {
            // 蓄力: 尾巴向后卷到最大
            const windup = stabPhase / 0.30;
            tailRoot.rotation.x = windup * 0.5;  // 0 -> +0.5
            tailRoot.rotation.z = Math.sin(windup * Math.PI) * 0.12;
            // 身体微微后撤
            group.position.z -= windup * 0.1;
          } else if (stabPhase < 0.60) {
            // 极速前刺
            const snap = (stabPhase - 0.30) / 0.30;
            tailRoot.rotation.x = 0.5 - snap * 1.7;  // +0.5 -> -1.2
            tailRoot.rotation.z = 0;
            // 身体前冲
            group.position.z += snap * 0.3;
            // 屏幕震动 (在冲刺峰值时触发一次)
            if (snap > 0.45 && snap < 0.55 && typeof window.shakeCamera === 'function') {
              window.shakeCamera(0.3, 0.1);
            }
          } else {
            // 回弹恢复
            const retract = (stabPhase - 0.60) / 0.40;
            tailRoot.rotation.x = -1.2 + retract * 1.2;  // -1.2 -> 0
          }
          // 各节跟随摆动加剧
          tailSegments.forEach((seg, i) => {
            seg.rotation.z = Math.sin(stabPhase * Math.PI * 2 + i * 0.5) * 0.10;
          });
        }
      }
    };

    return { group, bones };
  },

  // ============================================================
  // 2. 沙漠沙虫 - Sandworm with peristaltic movement
  // ============================================================
  createSandworm() {
    const group = new THREE.Group();
    const bones = {};

    const matBody = new THREE.MeshLambertMaterial({ color: 0xB8860B });
    const matBodyDark = new THREE.MeshLambertMaterial({ color: 0xA07840 });
    const matRing = new THREE.MeshLambertMaterial({ color: 0x6B4226 });
    const matMouth = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    const matInterior = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const matTooth = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });

    function addBox(w, h, d, x, y, z, mat, parent) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      (parent || group).add(mesh);
      return mesh;
    }

    // === 头部 - 大立方体，前端有嘴 ===
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.2, 0);
    group.add(headGroup);
    bones.head = headGroup;

    // 头主体
    addBox(1.8, 1.6, 1.8, 0, 0, 0, matBody, headGroup);
    // 头顶
    addBox(1.4, 0.3, 1.4, 0, 0.95, 0, matBodyDark, headGroup);

    // === 嘴部 - 可张合 ===
    const jawUpper = new THREE.Group();
    jawUpper.position.set(0, 0.2, 0.95);
    headGroup.add(jawUpper);
    bones.jawUpper = jawUpper;

    const jawLower = new THREE.Group();
    jawLower.position.set(0, -0.2, 0.95);
    headGroup.add(jawLower);
    bones.jawLower = jawLower;

    // 上颚板
    addBox(1.6, 0.25, 0.4, 0, 0.1, 0.15, matMouth, jawUpper);
    // 下颚板
    addBox(1.6, 0.25, 0.4, 0, -0.1, 0.15, matMouth, jawLower);

    // 口腔内部
    addBox(1.2, 0.4, 0.15, 0, 0, 0.2, matInterior, jawUpper);
    addBox(1.2, 0.4, 0.15, 0, 0, 0.2, matInterior, jawLower);

    // 牙齿 - 上下各4颗
    for (let i = 0; i < 4; i++) {
      const tx = -0.45 + i * 0.3;
      addBox(0.08, 0.15, 0.08, tx, 0.05, 0.35, matTooth, jawUpper);
      addBox(0.08, 0.15, 0.08, tx, -0.05, 0.35, matTooth, jawLower);
    }

    // === 身体分节 - 每节独立Group，可蠕动 ===
    const segments = [];
    const segmentData = [
      { w: 1.6, h: 1.6, d: 1.0, color: matBody },
      { w: 1.5, h: 1.5, d: 1.0, color: matBodyDark },
      { w: 1.4, h: 1.4, d: 1.0, color: matBody },
      { w: 1.3, h: 1.3, d: 0.9, color: matBodyDark },
      { w: 1.2, h: 1.2, d: 0.9, color: matBody },
      { w: 1.1, h: 1.1, d: 0.8, color: matBodyDark },
      { w: 1.0, h: 1.0, d: 0.8, color: matBody },
      { w: 0.85, h: 0.85, d: 0.7, color: matBodyDark },
      { w: 0.7, h: 0.7, d: 0.7, color: matBody },
      { w: 0.55, h: 0.55, d: 0.6, color: matBodyDark },
    ];

    let segZ = -1.4;
    segmentData.forEach((data, i) => {
      const segGroup = new THREE.Group();
      segGroup.position.set(0, data.h * 0.4, segZ);
      group.add(segGroup);

      // 节主体
      addBox(data.w, data.h, data.d, 0, 0, 0, data.color, segGroup);

      // 环纹 - 前后各一
      addBox(data.w + 0.08, data.h + 0.08, 0.06, 0, 0, -data.d * 0.5 + 0.05, matRing, segGroup);
      addBox(data.w + 0.08, data.h + 0.08, 0.06, 0, 0, data.d * 0.5 - 0.05, matRing, segGroup);

      segments.push(segGroup);
      segZ -= data.d + 0.05;
    });
    bones.segments = segments;

    // === 尾巴尖 ===
    const tailTip = new THREE.Group();
    tailTip.position.set(0, 0.2, segZ + 0.3);
    group.add(tailTip);
    addBox(0.4, 0.4, 0.5, 0, 0, 0, matBodyDark, tailTip);
    addBox(0.25, 0.25, 0.4, 0, 0, -0.4, matBody, tailTip);
    bones.tailTip = tailTip;

    group.name = 'desertMonster_sandworm';

    // === 动画更新函数 ===
    bones.updateAnim = function(dt, state, speed, animTimer, isAttacking, attackAnimTimer) {
      const t = animTimer;
      const waveSpeed = speed * 2;

      // --- 蠕动动画: 身体分节波浪式收缩 ---
      // 模拟环节动物的蠕动: 从头到尾的收缩波
      segments.forEach((seg, i) => {
        const phase = i * 0.5;
        // 径向收缩
        const contract = 1.0 + Math.sin(t * waveSpeed + phase) * 0.06;
        seg.scale.set(contract, contract, 1.0);
        // 轻微上下摆动
        seg.position.y = seg.userData?.baseY || (segmentData[i].h * 0.4);
        if (!seg.userData) seg.userData = {};
        if (seg.userData.baseY === undefined) seg.userData.baseY = seg.position.y;
        seg.position.y = seg.userData.baseY + Math.sin(t * waveSpeed + phase) * 0.05;
      });

      // --- 头部引导运动 ---
      headGroup.rotation.x = Math.sin(t * waveSpeed) * 0.05;
      headGroup.rotation.y = Math.sin(t * waveSpeed * 0.5) * 0.03;

      // --- 嘴部轻微张合 (呼吸感) ---
      if (!isAttacking) {
        const breathe = Math.sin(t * 3) * 0.05;
        jawUpper.rotation.x = -0.1 + breathe;
        jawLower.rotation.x = 0.1 - breathe;
      } else {
        // 毒液喷射攻击: 头部前 thrust, 嘴大张, 然后"吐"的动作
        const sprayPhase = attackAnimTimer / 0.5; // 0~1, 0.5秒动画
        if (sprayPhase < 0.3) {
          // 蓄力: 头向后仰, 嘴开始张开
          const windup = sprayPhase / 0.3;
          headGroup.rotation.x = -windup * 0.4; // 后仰
          jawUpper.rotation.x = -0.1 - windup * 0.6;
          jawLower.rotation.x = 0.1 + windup * 0.6;
        } else if (sprayPhase < 0.5) {
          // 猛向前 thrust, 嘴张到最大
          const thrust = (sprayPhase - 0.3) / 0.2;
          headGroup.rotation.x = -0.4 + thrust * 0.8; // 后仰 -> 前 thrust
          jawUpper.rotation.x = -0.7 - thrust * 0.3; // 张到最大
          jawLower.rotation.x = 0.7 + thrust * 0.3;
        } else if (sprayPhase < 0.7) {
          // 保持前伸, 嘴开始闭合 (喷射中)
          const hold = (sprayPhase - 0.5) / 0.2;
          headGroup.rotation.x = 0.4 - hold * 0.2;
          jawUpper.rotation.x = -1.0 + hold * 0.5;
          jawLower.rotation.x = 1.0 - hold * 0.5;
        } else {
          // 收回
          const retract = (sprayPhase - 0.7) / 0.3;
          headGroup.rotation.x = 0.2 - retract * 0.2;
          jawUpper.rotation.x = -0.5 + retract * 0.4;
          jawLower.rotation.x = 0.5 - retract * 0.4;
        }
      }

      // --- 尾巴跟随摆动 ---
      tailTip.rotation.x = Math.sin(t * waveSpeed - segments.length * 0.5) * 0.1;
    };

    return { group, bones };
  },

  // ============================================================
  // 3. 沙漠秃鹫 - Vulture with wing flapping
  // ============================================================
  createVulture() {
    const group = new THREE.Group();
    const bones = {};

    const matBody = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
    const matHead = new THREE.MeshLambertMaterial({ color: 0x7B8FA1 });
    const matNeck = new THREE.MeshLambertMaterial({ color: 0x6B7B8D });
    const matRuff = new THREE.MeshLambertMaterial({ color: 0xC4B49A });
    const matBeak = new THREE.MeshLambertMaterial({ color: 0x3E2723 });
    const matEye = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
    const matWing1 = new THREE.MeshLambertMaterial({ color: 0x3B2F2F });
    const matWing2 = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
    const matWing3 = new THREE.MeshLambertMaterial({ color: 0x1A1A2E });
    const matWingTip = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const matTail = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
    const matLeg = new THREE.MeshLambertMaterial({ color: 0x808080 });

    function addBox(w, h, d, x, y, z, mat, parent) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      (parent || group).add(mesh);
      return mesh;
    }

    // === 身体 ===
    addBox(1.0, 0.9, 1.3, 0, 0, 0, matBody);
    // 胸部
    addBox(0.9, 0.8, 0.5, 0, 0.05, 0.7, matBody);

    // === 颈部 ===
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 0.3, 0.9);
    group.add(neckGroup);
    bones.neck = neckGroup;

    addBox(0.25, 0.7, 0.25, 0, 0.2, 0.15, matNeck, neckGroup);

    // === 头部 ===
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.6, 0.3);
    neckGroup.add(headGroup);
    bones.head = headGroup;

    addBox(0.5, 0.6, 0.7, 0, 0, 0, matHead, headGroup);
    // 眼睛
    addBox(0.08, 0.08, 0.08, -0.22, 0.1, 0.15, matEye, headGroup);
    addBox(0.08, 0.08, 0.08, 0.22, 0.1, 0.15, matEye, headGroup);

    // === 喙 - 3段钩状 ===
    addBox(0.2, 0.18, 0.25, 0, -0.05, 0.5, matBeak, headGroup);
    addBox(0.16, 0.14, 0.2, 0, -0.15, 0.7, matBeak, headGroup);
    addBox(0.12, 0.1, 0.15, 0, -0.25, 0.85, matBeak, headGroup);

    // === 羽毛领 ===
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rx = Math.cos(angle) * 0.4;
      const ry = Math.sin(angle) * 0.3 + 0.1;
      addBox(0.2, 0.15, 0.1, rx, ry, -0.1, matRuff, neckGroup);
    }

    // === 翅膀 - 每侧3段骨骼 ===
    function createWing(side) {
      const wingRoot = new THREE.Group();
      wingRoot.position.set(side * 0.6, 0.15, 0.1);
      group.add(wingRoot);

      // 第一段 (肱骨) - 粗短，连接身体
      const seg1 = new THREE.Group();
      wingRoot.add(seg1);
      addBox(1.2, 0.12, 0.7, side * 0.6, 0, 0, matWing1, seg1);

      // 第二段 (桡骨+尺骨) - 较长
      const seg2 = new THREE.Group();
      seg2.position.set(side * 1.2, 0, -0.1);
      seg1.add(seg2);
      addBox(1.4, 0.1, 0.6, side * 0.7, 0, 0, matWing2, seg2);

      // 第三段 (掌骨+指骨) - 最长，带飞羽
      const seg3 = new THREE.Group();
      seg3.position.set(side * 1.4, 0, -0.05);
      seg2.add(seg3);
      addBox(1.6, 0.08, 0.5, side * 0.8, 0, 0, matWing3, seg3);

      // 翼尖
      const tip = new THREE.Group();
      tip.position.set(side * 1.6, 0, 0);
      seg3.add(tip);
      addBox(0.8, 0.06, 0.12, side * 0.4, 0, -0.05, matWingTip, tip);
      addBox(0.5, 0.06, 0.1, side * 0.25, 0, 0.05, matWingTip, tip);

      return { root: wingRoot, seg1, seg2, seg3, tip };
    }

    const leftWing = createWing(-1);
    const rightWing = createWing(1);
    bones.leftWing = leftWing;
    bones.rightWing = rightWing;

    // === 尾巴 ===
    addBox(0.6, 0.12, 0.4, 0, 0.05, -0.9, matTail);
    addBox(0.45, 0.1, 0.35, 0, 0.08, -1.2, matTail);
    addBox(0.3, 0.08, 0.25, 0, 0.1, -1.45, matTail);

    // === 腿 ===
    addBox(0.1, 0.8, 0.1, -0.18, -0.4, 0.1, matLeg);
    addBox(0.12, 0.08, 0.1, -0.18, -0.85, 0.15, matLeg);
    addBox(0.1, 0.8, 0.1, 0.18, -0.4, 0.1, matLeg);
    addBox(0.12, 0.08, 0.1, 0.18, -0.85, 0.15, matLeg);

    group.name = 'desertMonster_vulture';

    // === 动画更新函数 ===
    bones.updateAnim = function(dt, state, speed, animTimer, isAttacking, attackAnimTimer, wingSlapTimer) {
      const t = animTimer;

      // --- 翅膀扇动 ---
      let flapFreq, flapAmp;
      if (state === 'wander') {
        flapFreq = 4; flapAmp = 0.3; // 滑翔，慢扇
      } else if (state === 'chase') {
        flapFreq = 8; flapAmp = 0.5; // 追击，快扇
      } else if (state === 'dive') {
        flapFreq = 10; flapAmp = 0.2; // 俯冲，翅膀收拢
      } else {
        flapFreq = 6; flapAmp = 0.4;
      }

      const wingAngle = Math.sin(t * flapFreq) * flapAmp;
      const wingAngle2 = Math.sin(t * flapFreq - 0.3) * flapAmp * 0.7;
      const wingAngle3 = Math.sin(t * flapFreq - 0.6) * flapAmp * 0.5;

      // 左翼
      leftWing.root.rotation.z = -0.2 + wingAngle;
      leftWing.seg2.rotation.z = wingAngle2;
      leftWing.seg3.rotation.z = wingAngle3;

      // 右翼 (镜像)
      rightWing.root.rotation.z = 0.2 - wingAngle;
      rightWing.seg2.rotation.z = -wingAngle2;
      rightWing.seg3.rotation.z = -wingAngle3;

      // --- 俯冲拍击特效 ---
      if (wingSlapTimer > 0) {
        const slapPhase = wingSlapTimer / 0.3;
        const slapScale = 1.0 + Math.sin(slapPhase * Math.PI) * 0.5;
        leftWing.seg3.scale.x = slapScale;
        rightWing.seg3.scale.x = slapScale;
      } else {
        leftWing.seg3.scale.x = 1.0;
        rightWing.seg3.scale.x = 1.0;
      }

      // --- 身体随翅膀起伏 ---
      group.position.y += Math.sin(t * flapFreq * 2) * 0.01;

      // --- 头部轻微转动 ---
      headGroup.rotation.y = Math.sin(t * 1.2) * 0.08;
      headGroup.rotation.x = Math.sin(t * 0.8) * 0.03;

      // --- 颈部微动 ---
      neckGroup.rotation.x = Math.sin(t * 1.5) * 0.05;
    };

    return { group, bones };
  }
};

// 导出到全局
if (typeof window !== 'undefined') {
  window.MonsterBones = MonsterBones;
}
