// NPC系统
var npcs = [];
var shards = [];
var collectibles = [];

// ============================================================
// NPC外形构建器 — 每种NPC类型独特设计
// NPC总高约4.0（主角的2倍），直立站在星球表面
// ============================================================

function buildNPCModel(name, index) {
    var group = new THREE.Group();
    var mainColor = COLORS.npc[index % COLORS.npc.length];
    var skinColor = 0xFFCCAA;
    var eyeColor = 0x333333;

    // 根据NPC名称选择外形
    if (name.indexOf('图形') >= 0) {
        buildShapeNPC(group, mainColor);
    } else if (name.indexOf('数字') >= 0) {
        buildNumberNPC(group, mainColor);
    } else if (name.indexOf('加法') >= 0) {
        buildAdditionNPC(group, mainColor);
    } else if (name.indexOf('减法') >= 0) {
        buildSubtractionNPC(group, mainColor);
    } else if (name.indexOf('乘法') >= 0 || name.indexOf('口诀') >= 0) {
        buildMultiplicationNPC(group, mainColor);
    } else if (name.indexOf('除法') >= 0) {
        buildDivisionNPC(group, mainColor);
    } else if (name.indexOf('比较') >= 0) {
        buildCompareNPC(group, mainColor);
    } else if (name.indexOf('时间') >= 0) {
        buildTimeNPC(group, mainColor);
    } else if (name.indexOf('长度') >= 0 || name.indexOf('单位') >= 0) {
        buildMeasureNPC(group, mainColor);
    } else if (name.indexOf('角') >= 0) {
        buildAngleNPC(group, mainColor);
    } else if (name.indexOf('应用') >= 0) {
        buildWordProblemNPC(group, mainColor);
    } else if (name.indexOf('大数') >= 0) {
        buildBigNumberNPC(group, mainColor);
    } else if (name.indexOf('周长') >= 0) {
        buildPerimeterNPC(group, mainColor);
    } else if (name.indexOf('分数') >= 0) {
        buildFractionNPC(group, mainColor);
    } else if (name.indexOf('混合') >= 0) {
        buildMixedNPC(group, mainColor);
    } else if (name.indexOf('面积') >= 0) {
        buildAreaNPC(group, mainColor);
    } else if (name.indexOf('小数') >= 0) {
        buildDecimalNPC(group, mainColor);
    } else if (name.indexOf('四则') >= 0) {
        buildArithmeticNPC(group, mainColor);
    } else if (name.indexOf('平均') >= 0) {
        buildAverageNPC(group, mainColor);
    } else if (name.indexOf('因数') >= 0 || name.indexOf('倍数') >= 0) {
        buildFactorNPC(group, mainColor);
    } else if (name.indexOf('方程') >= 0) {
        buildEquationNPC(group, mainColor);
    } else if (name.indexOf('体积') >= 0) {
        buildVolumeNPC(group, mainColor);
    } else if (name.indexOf('百分') >= 0) {
        buildPercentNPC(group, mainColor);
    } else if (name.indexOf('比例') >= 0) {
        buildRatioNPC(group, mainColor);
    } else if (name.indexOf('负数') >= 0) {
        buildNegativeNPC(group, mainColor);
    } else if (name.indexOf('圆') >= 0) {
        buildCircleNPC(group, mainColor);
    } else if (name.indexOf('统计') >= 0) {
        buildStatsNPC(group, mainColor);
    } else if (name.indexOf('浓度') >= 0) {
        buildConcentrationNPC(group, mainColor);
    } else if (name.indexOf('行程') >= 0) {
        buildTravelNPC(group, mainColor);
    } else {
        buildDefaultNPC(group, mainColor);
    }

    // 添加眼睛（所有NPC通用）
    addNPCEyes(group, eyeColor);
    // 添加名字标签
    addNPCLabel(group, name);

    return group;
}

// ============================================================
// 通用部件
// ============================================================
function addNPCEyes(group, color) {
    var eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    var eyeMat = new THREE.MeshLambertMaterial({ color: color });
    var leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 3.2, 0.85);
    group.add(leftEye);
    var rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 3.2, 0.85);
    group.add(rightEye);

    // 眼睛高光
    var highlightGeo = new THREE.SphereGeometry(0.04, 6, 6);
    var highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var lh = new THREE.Mesh(highlightGeo, highlightMat);
    lh.position.set(-0.23, 3.23, 0.95);
    group.add(lh);
    var rh = new THREE.Mesh(highlightGeo, highlightMat);
    rh.position.set(0.27, 3.23, 0.95);
    group.add(rh);
}

function addNPCLabel(group, name) {
    var labelGeo = new THREE.PlaneGeometry(2.2, 0.5);
    var labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    var label = new THREE.Mesh(labelGeo, labelMat);
    label.position.y = 4.5;
    group.add(label);
}

// ============================================================
// 图形小精灵 — 多个几何形状组合体
// ============================================================
function buildShapeNPC(group, color) {
    // 身体：大正方体
    var bodyGeo = new THREE.BoxGeometry(1.2, 1.5, 1.0);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.5;
    group.add(body);

    // 头：大球体
    var headGeo = new THREE.SphereGeometry(0.7, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.0;
    group.add(head);

    // 头顶：旋转的三角形
    var triGeo = new THREE.ConeGeometry(0.5, 0.8, 3);
    var triMat = new THREE.MeshLambertMaterial({ color: 0x5DBDB6 });
    var tri = new THREE.Mesh(triGeo, triMat);
    tri.position.y = 3.9;
    group.add(tri);

    // 左肩：圆形
    var circleGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
    var circleMat = new THREE.MeshLambertMaterial({ color: 0x7CB342 });
    var circle = new THREE.Mesh(circleGeo, circleMat);
    circle.position.set(-1.0, 2.5, 0);
    circle.rotation.y = Math.PI / 2;
    group.add(circle);

    // 右肩：菱形（旋转的正方形）
    var diamondGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    var diamondMat = new THREE.MeshLambertMaterial({ color: 0xFF8FAB });
    var diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.set(1.0, 2.5, 0);
    diamond.rotation.z = Math.PI / 4;
    group.add(diamond);

    // 腿：两个圆柱
    var legGeo = new THREE.CylinderGeometry(0.15, 0.18, 1.2, 6);
    var legMat = new THREE.MeshLambertMaterial({ color: color });
    var leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.3, 0.6, 0);
    group.add(leftLeg);
    var rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.3, 0.6, 0);
    group.add(rightLeg);

    // 脚：两个小球
    var footGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var footMat = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    var leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.3, 0.05, 0.05);
    group.add(leftFoot);
    var rightFoot = new THREE.Mesh(footGeo, footMat);
    rightFoot.position.set(0.3, 0.05, 0.05);
    group.add(rightFoot);
}

// ============================================================
// 数字小精灵 — 身体是数字"0"的形状（圆环）
// ============================================================
function buildNumberNPC(group, color) {
    // 身体：大圆环（数字0）
    var bodyGeo = new THREE.TorusGeometry(0.7, 0.25, 12, 24);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.8;
    group.add(body);

    // 头：球
    var headGeo = new THREE.SphereGeometry(0.6, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.2;
    group.add(head);

    // 帽子：数字符号"∞"
    var hatGeo = new THREE.TorusKnotGeometry(0.35, 0.08, 64, 8, 2, 3);
    var hatMat = new THREE.MeshLambertMaterial({ color: 0xF5C542 });
    var hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 3.9;
    group.add(hat);

    // 腿
    var legGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.0, 6);
    var legMat = new THREE.MeshLambertMaterial({ color: color });
    var leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.35, 0.5, 0);
    group.add(leftLeg);
    var rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.35, 0.5, 0);
    group.add(rightLeg);

    // 脚
    var footGeo = new THREE.SphereGeometry(0.18, 8, 8);
    var footMat = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    var lf = new THREE.Mesh(footGeo, footMat);
    lf.position.set(-0.35, 0.05, 0.05);
    group.add(lf);
    var rf = new THREE.Mesh(footGeo, footMat);
    rf.position.set(0.35, 0.05, 0.05);
    group.add(rf);

    // 手臂：拿着数字牌
    var armGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.0, 6);
    var armMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-1.0, 2.0, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);
    var rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(1.0, 2.0, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);

    // 数字牌
    var boardGeo = new THREE.BoxGeometry(0.6, 0.8, 0.05);
    var boardMat = new THREE.MeshLambertMaterial({ color: 0xFFF8E1 });
    var board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(1.4, 2.2, 0);
    group.add(board);
}

// ============================================================
// 加法小精灵 — 身上有"+"号
// ============================================================
function buildAdditionNPC(group, color) {
    // 身体：圆柱
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    // 头
    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // "+"号帽子（十字形）
    var hBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.15), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    hBar.position.y = 3.8;
    group.add(hBar);
    var vBar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.8, 0.15), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    vBar.position.y = 3.8;
    group.add(vBar);

    // 胸前"+"号
    var chestH = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    chestH.position.set(0, 1.8, 0.65);
    group.add(chestH);
    var chestV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    chestV.position.set(0, 1.8, 0.65);
    group.add(chestV);

    // 腿和脚
    addNPCLegs(group, color);
}

// ============================================================
// 减法小精灵 — 身上有"-"号
// ============================================================
function buildSubtractionNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // "-"号帽子
    var minusBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.15), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    minusBar.position.y = 3.8;
    group.add(minusBar);

    // 胸前"-"号
    var chestMinus = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    chestMinus.position.set(0, 1.8, 0.65);
    group.add(chestMinus);

    addNPCLegs(group, color);
}

// ============================================================
// 乘法小精灵 / 乘法口诀 — 身上有"×"号
// ============================================================
function buildMultiplicationNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // "×"号帽子（交叉）
    var x1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), new THREE.MeshLambertMaterial({ color: 0x7CB342 }));
    x1.position.y = 3.8;
    x1.rotation.z = Math.PI / 4;
    group.add(x1);
    var x2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.12), new THREE.MeshLambertMaterial({ color: 0x7CB342 }));
    x2.position.y = 3.8;
    x2.rotation.z = -Math.PI / 4;
    group.add(x2);

    // 胸前"×"
    var cx1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    cx1.position.set(0, 1.8, 0.65);
    cx1.rotation.z = Math.PI / 4;
    group.add(cx1);
    var cx2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    cx2.position.set(0, 1.8, 0.65);
    cx2.rotation.z = -Math.PI / 4;
    group.add(cx2);

    addNPCLegs(group, color);
}

// ============================================================
// 除法小精灵 — 身上有"÷"号
// ============================================================
function buildDivisionNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // "÷"号帽子
    var divLine = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0x64B5F6 }));
    divLine.position.y = 3.8;
    group.add(divLine);
    var divDot1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshLambertMaterial({ color: 0x64B5F6 }));
    divDot1.position.set(0, 4.05, 0);
    group.add(divDot1);
    var divDot2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshLambertMaterial({ color: 0x64B5F6 }));
    divDot2.position.set(0, 3.55, 0);
    group.add(divDot2);

    addNPCLegs(group, color);
}

// ============================================================
// 比较大小 — 一手拿">"一手拿"<"
// ============================================================
function buildCompareNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 天平帽子
    var balanceBar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    balanceBar.position.y = 3.8;
    group.add(balanceBar);
    var balancePole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    balancePole.position.y = 3.6;
    group.add(balancePole);
    // 天平两端盘子
    var panGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8);
    var panMat = new THREE.MeshLambertMaterial({ color: 0xB0BEC5 });
    var leftPan = new THREE.Mesh(panGeo, panMat);
    leftPan.position.set(-0.6, 3.95, 0);
    group.add(leftPan);
    var rightPan = new THREE.Mesh(panGeo, panMat);
    rightPan.position.set(0.6, 3.95, 0);
    group.add(rightPan);

    addNPCLegs(group, color);
}

// ============================================================
// 时间小精灵 — 头是钟表
// ============================================================
function buildTimeNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    // 头：钟表（扁平圆柱）
    var clockGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.2, 24);
    var clockMat = new THREE.MeshLambertMaterial({ color: 0xFFF8E1 });
    var clock = new THREE.Mesh(clockGeo, clockMat);
    clock.position.y = 3.1;
    clock.rotation.x = Math.PI / 2;
    group.add(clock);

    // 钟表边框
    var rimGeo = new THREE.TorusGeometry(0.65, 0.06, 8, 24);
    var rimMat = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    var rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 3.1;
    group.add(rim);

    // 时针
    var hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.35, 0.04), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    hourHand.position.set(0, 3.25, 0.3);
    hourHand.rotation.z = -0.5;
    group.add(hourHand);

    // 分针
    var minHand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    minHand.position.set(0.15, 3.3, 0.3);
    minHand.rotation.z = -1.2;
    group.add(minHand);

    addNPCLegs(group, color);
}

// ============================================================
// 长度单位 — 手持尺子
// ============================================================
function buildMeasureNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 尺子（长条）
    var rulerGeo = new THREE.BoxGeometry(0.15, 1.8, 0.05);
    var rulerMat = new THREE.MeshLambertMaterial({ color: 0xFFD54F });
    var ruler = new THREE.Mesh(rulerGeo, rulerMat);
    ruler.position.set(1.0, 2.0, 0);
    group.add(ruler);

    // 尺子刻度
    for (var i = 0; i < 8; i++) {
        var tick = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.06), new THREE.MeshLambertMaterial({ color: 0x333333 }));
        tick.position.set(1.0, 1.2 + i * 0.2, 0.04);
        group.add(tick);
    }

    addNPCLegs(group, color);
}

// ============================================================
// 角的认识 — 头上有个角
// ============================================================
function buildAngleNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 头上的角（直角符号）
    var angleL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    angleL.position.set(-0.15, 3.7, 0);
    group.add(angleL);
    var angleR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    angleR.position.set(-0.15, 3.45, 0);
    group.add(angleR);

    addNPCLegs(group, color);
}

// ============================================================
// 应用题 — 戴眼镜，手持书本
// ============================================================
function buildWordProblemNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 眼镜
    var lensGeo = new THREE.TorusGeometry(0.15, 0.03, 8, 12);
    var lensMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.position.set(-0.25, 3.15, 0.5);
    group.add(leftLens);
    var rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.position.set(0.25, 3.15, 0.5);
    group.add(rightLens);
    var bridge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    bridge.position.set(0, 3.15, 0.55);
    group.add(bridge);

    // 书本
    var bookGeo = new THREE.BoxGeometry(0.8, 1.0, 0.15);
    var bookMat = new THREE.MeshLambertMaterial({ color: 0x5DBDB6 });
    var book = new THREE.Mesh(bookGeo, bookMat);
    book.position.set(1.0, 2.2, 0);
    book.rotation.z = -0.2;
    group.add(book);

    addNPCLegs(group, color);
}

// ============================================================
// 大数认识 — 高大，身上有数字
// ============================================================
function buildBigNumberNPC(group, color) {
    // 更高的身体
    var bodyGeo = new THREE.CylinderGeometry(0.7, 0.8, 2.5, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.8;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.6, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.5;
    group.add(head);

    // 学士帽
    var mortarBoard = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 1.0), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    mortarBoard.position.y = 4.2;
    group.add(mortarBoard);
    var capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.3, 8), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    capTop.position.y = 4.0;
    group.add(capTop);

    addNPCLegs(group, color);
}

// ============================================================
// 周长计算 — 腰上有卷尺
// ============================================================
function buildPerimeterNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 腰间卷尺
    var tapeGeo = new THREE.TorusGeometry(0.35, 0.1, 8, 16);
    var tapeMat = new THREE.MeshLambertMaterial({ color: 0xFFD54F });
    var tape = new THREE.Mesh(tapeGeo, tapeMat);
    tape.position.y = 1.2;
    tape.rotation.x = Math.PI / 2;
    group.add(tape);

    addNPCLegs(group, color);
}

// ============================================================
// 分数初识/分数运算 — 头是分数线，上下有数字
// ============================================================
function buildFractionNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    // 分数头：上球 + 横线 + 下球
    var topBall = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), new THREE.MeshLambertMaterial({ color: 0x5DBDB6 }));
    topBall.position.y = 3.5;
    group.add(topBall);
    var fracLine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    fracLine.position.y = 3.0;
    group.add(fracLine);
    var botBall = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    botBall.position.y = 2.5;
    group.add(botBall);

    addNPCLegs(group, color);
}

// ============================================================
// 混合运算 — 多层身体
// ============================================================
function buildMixedNPC(group, color) {
    // 三层身体
    var layer1Geo = new THREE.CylinderGeometry(0.8, 0.7, 0.7, 8);
    var layer1Mat = new THREE.MeshLambertMaterial({ color: 0x5DBDB6 });
    var layer1 = new THREE.Mesh(layer1Geo, layer1Mat);
    layer1.position.y = 2.3;
    group.add(layer1);

    var layer2Geo = new THREE.CylinderGeometry(0.6, 0.8, 0.7, 8);
    var layer2Mat = new THREE.MeshLambertMaterial({ color: 0xF5C542 });
    var layer2 = new THREE.Mesh(layer2Geo, layer2Mat);
    layer2.position.y = 1.6;
    group.add(layer2);

    var layer3Geo = new THREE.CylinderGeometry(0.7, 0.6, 0.7, 8);
    var layer3Mat = new THREE.MeshLambertMaterial({ color: 0xE85D4E });
    var layer3 = new THREE.Mesh(layer3Geo, layer3Mat);
    layer3.position.y = 0.9;
    group.add(layer3);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    addNPCLegs(group, color);
}

// ============================================================
// 面积计算 — 手持方块（面积模型）
// ============================================================
function buildAreaNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 手持网格板
    var gridGroup = new THREE.Group();
    for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
            var cell = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.05), new THREE.MeshLambertMaterial({ color: r % 2 === c % 2 ? 0x5DBDB6 : 0xF5C542 }));
            cell.position.set(-0.25 + c * 0.25, -0.25 + r * 0.25, 0);
            gridGroup.add(cell);
        }
    }
    gridGroup.position.set(1.1, 2.2, 0);
    group.add(gridGroup);

    addNPCLegs(group, color);
}

// ============================================================
// 小数认识/小数运算 — 头上有小数点
// ============================================================
function buildDecimalNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 小数点（额头上的小球）
    var dot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    dot.position.set(0, 3.55, 0.5);
    group.add(dot);

    addNPCLegs(group, color);
}

// ============================================================
// 四则运算 — 四色身体
// ============================================================
function buildArithmeticNPC(group, color) {
    var colors4 = [0xE85D4E, 0x5DBDB6, 0xF5C542, 0x7CB342];
    for (var i = 0; i < 4; i++) {
        var segGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.5, 8);
        var segMat = new THREE.MeshLambertMaterial({ color: colors4[i] });
        var seg = new THREE.Mesh(segGeo, segMat);
        seg.position.y = 0.75 + i * 0.5;
        group.add(seg);
    }

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    addNPCLegs(group, color);
}

// ============================================================
// 平均数 — 天平造型
// ============================================================
function buildAverageNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 头顶等号
    var eq1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    eq1.position.set(0, 3.75, 0);
    group.add(eq1);
    var eq2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    eq2.position.set(0, 3.65, 0);
    group.add(eq2);

    addNPCLegs(group, color);
}

// ============================================================
// 因数倍数 — 身上有因子链
// ============================================================
function buildFactorNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 链条装饰（环绕身体的小球）
    for (var i = 0; i < 6; i++) {
        var angle = (i / 6) * Math.PI * 2;
        var bead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshLambertMaterial({ color: 0xFFD54F }));
        bead.position.set(Math.cos(angle) * 0.75, 1.6 + (i % 3 - 1) * 0.5, Math.sin(angle) * 0.75);
        group.add(bead);
    }

    addNPCLegs(group, color);
}

// ============================================================
// 方程 — 头上有"x"
// ============================================================
function buildEquationNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // "x"帽子
    var x1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xBA68C8 }));
    x1.position.y = 3.8;
    x1.rotation.z = Math.PI / 4;
    group.add(x1);
    var x2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xBA68C8 }));
    x2.position.y = 3.8;
    x2.rotation.z = -Math.PI / 4;
    group.add(x2);

    addNPCLegs(group, color);
}

// ============================================================
// 体积 — 身体是立方体
// ============================================================
function buildVolumeNPC(group, color) {
    // 身体：正方体
    var bodyGeo = new THREE.BoxGeometry(1.3, 1.8, 1.3);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.5;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 立方体帽子
    var cubeHat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    cubeHat.position.y = 3.7;
    group.add(cubeHat);

    addNPCLegs(group, color);
}

// ============================================================
// 百分数 — 身上有"%"标志
// ============================================================
function buildPercentNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // "%"符号：斜线 + 两个点
    var pctLine = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.08), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    pctLine.position.y = 3.8;
    pctLine.rotation.z = Math.PI / 4;
    group.add(pctLine);
    var pctDot1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    pctDot1.position.set(-0.2, 4.0, 0);
    group.add(pctDot1);
    var pctDot2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    pctDot2.position.set(0.2, 3.6, 0);
    group.add(pctDot2);

    addNPCLegs(group, color);
}

// ============================================================
// 比例 — 身体对称双色
// ============================================================
function buildRatioNPC(group, color) {
    // 半圆柱1
    var half1Geo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8, 1, false, 0, Math.PI);
    var half1Mat = new THREE.MeshLambertMaterial({ color: 0x5DBDB6 });
    var half1 = new THREE.Mesh(half1Geo, half1Mat);
    half1.position.y = 1.6;
    group.add(half1);
    // 半圆柱2
    var half2Geo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8, 1, false, Math.PI, Math.PI);
    var half2Mat = new THREE.MeshLambertMaterial({ color: 0xF5C542 });
    var half2 = new THREE.Mesh(half2Geo, half2Mat);
    half2.position.y = 1.6;
    group.add(half2);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // ":"符号
    var colon1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    colon1.position.set(0, 3.7, 0);
    group.add(colon1);
    var colon2 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    colon2.position.set(0, 3.5, 0);
    group.add(colon2);

    addNPCLegs(group, color);
}

// ============================================================
// 负数 — 半黑半白
// ============================================================
function buildNegativeNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // "-"号（负号）
    var negBar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.1), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    negBar.position.y = 3.7;
    group.add(negBar);

    addNPCLegs(group, 0x333333);
}

// ============================================================
// 圆 — 圆形身体
// ============================================================
function buildCircleNPC(group, color) {
    var bodyGeo = new THREE.SphereGeometry(0.8, 16, 16);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    body.scale.set(1, 1.3, 1);
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // π帽子
    var piRing = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.08, 8, 16), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    piRing.position.y = 3.7;
    piRing.rotation.x = Math.PI / 2;
    group.add(piRing);

    addNPCLegs(group, color);
}

// ============================================================
// 统计 — 头上是柱状图
// ============================================================
function buildStatsNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 柱状图帽子
    var barColors = [0xE85D4E, 0x5DBDB6, 0xF5C542, 0x7CB342];
    var barHeights = [0.5, 0.8, 0.4, 0.65];
    for (var i = 0; i < 4; i++) {
        var bar = new THREE.Mesh(new THREE.BoxGeometry(0.15, barHeights[i], 0.15), new THREE.MeshLambertMaterial({ color: barColors[i] }));
        bar.position.set(-0.3 + i * 0.2, 3.6 + barHeights[i] / 2, 0);
        group.add(bar);
    }

    addNPCLegs(group, color);
}

// ============================================================
// 浓度 — 透明渐变身体
// ============================================================
function buildConcentrationNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: 0x64B5F6, transparent: true, opacity: 0.7 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    // 内部液体
    var liquidGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.2, 8);
    var liquidMat = new THREE.MeshLambertMaterial({ color: 0x42A5F5, transparent: true, opacity: 0.5 });
    var liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.y = 1.3;
    group.add(liquid);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 烧杯口
    var rimGeo = new THREE.TorusGeometry(0.6, 0.05, 8, 16);
    var rimMat = new THREE.MeshLambertMaterial({ color: 0xB0BEC5 });
    var rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 2.6;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    addNPCLegs(group, color);
}

// ============================================================
// 行程 — 头上有小汽车
// ============================================================
function buildTravelNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 小汽车帽子
    var carBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.5), new THREE.MeshLambertMaterial({ color: 0xE85D4E }));
    carBody.position.y = 3.7;
    group.add(carBody);
    var carTop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.45), new THREE.MeshLambertMaterial({ color: 0xB0BEC5 }));
    carTop.position.set(-0.05, 3.9, 0);
    group.add(carTop);
    // 轮子
    var wheelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8);
    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var w1 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.position.set(-0.25, 3.55, 0.3);
    w1.rotation.x = Math.PI / 2;
    group.add(w1);
    var w2 = new THREE.Mesh(wheelGeo, wheelMat);
    w2.position.set(0.25, 3.55, 0.3);
    w2.rotation.x = Math.PI / 2;
    group.add(w2);

    addNPCLegs(group, color);
}

// ============================================================
// 默认NPC
// ============================================================
function buildDefaultNPC(group, color) {
    var bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.0, 8);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.55, 12, 12);
    var headMat = new THREE.MeshLambertMaterial({ color: 0xFFCCAA });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.1;
    group.add(head);

    // 问号帽子
    var qDot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    qDot.position.y = 3.6;
    group.add(qDot);
    var qCurve = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 8, Math.PI), new THREE.MeshLambertMaterial({ color: 0xF5C542 }));
    qCurve.position.y = 3.85;
    group.add(qCurve);

    addNPCLegs(group, color);
}

// ============================================================
// 通用腿和脚
// ============================================================
function addNPCLegs(group, color) {
    var legGeo = new THREE.CylinderGeometry(0.15, 0.18, 1.2, 6);
    var legMat = new THREE.MeshLambertMaterial({ color: color });
    var leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.3, 0.6, 0);
    group.add(leftLeg);
    var rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.3, 0.6, 0);
    group.add(rightLeg);

    var footGeo = new THREE.SphereGeometry(0.2, 8, 8);
    var footMat = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    var lf = new THREE.Mesh(footGeo, footMat);
    lf.position.set(-0.3, 0.05, 0.05);
    group.add(lf);
    var rf = new THREE.Mesh(footGeo, footMat);
    rf.position.set(0.3, 0.05, 0.05);
    group.add(rf);
}

// ============================================================
// NPC生成
// ============================================================
function spawnNPCs(gradeIndex) {
    npcs.forEach(function(n) { scene.remove(n); });
    npcs = [];
    
    var gen = QGen[GradeConfig[gradeIndex].gen];
    var npcNames = Object.keys(gen);
    
    var latRange = getGradeLatRange(gradeIndex);
    
    npcNames.forEach(function(name, i) {
        var group = buildNPCModel(name, i);
        
        // 位置
        var lat = latRange.min + (latRange.max - latRange.min) * (0.2 + 0.6 * (i / npcNames.length));
        var lon = (i / npcNames.length) * Math.PI * 2 - Math.PI;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS);
        group.position.copy(pos);
        alignToSurface(group, pos);
        
        group.userData = { name: name, gradeIndex: gradeIndex, npcType: name, genIndex: i };
        npcs.push(group);
        scene.add(group);
    });
    
    // 初始化NPC进度显示
    if (typeof updateNpcProgress === 'function') {
        updateNpcProgress();
    }
}

function getGradeLatRange(gradeIndex) {
    var ranges = [
        { min: -75 * Math.PI / 180, max: -55 * Math.PI / 180 },
        { min: -40 * Math.PI / 180, max: -20 * Math.PI / 180 },
        { min: -5 * Math.PI / 180, max: 15 * Math.PI / 180 },
        { min: 30 * Math.PI / 180, max: 50 * Math.PI / 180 },
        { min: 55 * Math.PI / 180, max: 75 * Math.PI / 180 },
        { min: -10 * Math.PI / 180, max: 10 * Math.PI / 180 }
    ];
    return ranges[gradeIndex];
}

// ============================================================
// 能量碎片
// ============================================================
function spawnShards(gradeIndex) {
    shards.forEach(function(s) { scene.remove(s); });
    shards = [];
    
    var latRange = getGradeLatRange(gradeIndex);
    
    for (var i = 0; i < 5; i++) {
        var group = new THREE.Group();
        
        var geo = new THREE.OctahedronGeometry(0.4, 0);
        var mat = new THREE.MeshLambertMaterial({
            color: COLORS.shard,
            emissive: COLORS.shard,
            emissiveIntensity: 0.3
        });
        var shard = new THREE.Mesh(geo, mat);
        group.add(shard);
        
        var glowGeo = new THREE.SphereGeometry(0.6, 8, 8);
        var glowMat = new THREE.MeshBasicMaterial({
            color: COLORS.shard,
            transparent: true,
            opacity: 0.2
        });
        var glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);
        
        var lat = latRange.min + (latRange.max - latRange.min) * Math.random();
        var lon = Math.random() * Math.PI * 2;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS + 1.5);
        group.position.copy(pos);
        
        group.userData = { index: i, collected: false };
        shards.push(group);
        scene.add(group);
    }
}

// ============================================================
// 隐藏收集品（数学彩蛋）
// ============================================================
function spawnCollectibles(gradeIndex) {
    collectibles.forEach(function(c) { scene.remove(c); });
    collectibles = [];
    
    var latRange = getGradeLatRange(gradeIndex);
    var eggTexts = ['π', '∞', '∑', '√', 'φ', 'e'];
    var eggFacts = [
        'π 是圆周率，约等于 3.14159...',
        '∞ 表示无穷大，比任何数都大',
        '∑ 是求和符号，表示把一系列数加起来',
        '√ 是根号，表示求平方根',
        'φ 是黄金比例，约等于 1.618',
        'e 是自然常数，约等于 2.718'
    ];
    
    for (var i = 0; i < 3; i++) {
        var group = new THREE.Group();
        
        var geo = new THREE.IcosahedronGeometry(0.5, 0);
        var mat = new THREE.MeshLambertMaterial({
            color: 0xE85D4E,
            emissive: 0xE85D4E,
            emissiveIntensity: 0.2
        });
        var egg = new THREE.Mesh(geo, mat);
        group.add(egg);
        
        var lat = latRange.min + (latRange.max - latRange.min) * Math.random();
        var lon = Math.random() * Math.PI * 2;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS + 1.5);
        group.position.copy(pos);
        
        group.userData = { text: eggTexts[i], fact: eggFacts[i], collected: false };
        collectibles.push(group);
        scene.add(group);
    }
}
