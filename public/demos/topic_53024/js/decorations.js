// ============================================================
// 装饰物创建函数
// 全局依赖：scene, physicsWorld, staticBodies, COLORS, alignToSurface
// ============================================================

function createTree(pos, lat, lon) {
    var group = new THREE.Group();

    // 树干
    var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2, 6);
    var trunkMat = new THREE.MeshLambertMaterial({ color: COLORS.trunk });
    var trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    group.add(trunk);

    // 树冠 - 低多边形风格
    var leavesGeo = new THREE.IcosahedronGeometry(1.5, 0);
    var leavesMat = new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? COLORS.tree : COLORS.treeLight });
    var leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 3;
    group.add(leaves);

    // 定位到星球表面
    group.position.copy(pos);
    alignToSurface(group, pos);
    group.scale.setScalar(0.8 + Math.random() * 0.6);

    scene.add(group);

    // 碰撞体：圆柱体（树干）+ 球体（树冠）
    var treeScale = group.scale.x;
    var trunkShape = new CANNON.Cylinder(0.3 * treeScale, 0.5 * treeScale, 2 * treeScale, 6);
    var leavesShape = new CANNON.Sphere(1.5 * treeScale);
    var treeBody = new CANNON.Body({ mass: 0 });
    treeBody.addShape(trunkShape, new CANNON.Vec3(0, 1 * treeScale, 0));
    treeBody.addShape(leavesShape, new CANNON.Vec3(0, 3 * treeScale, 0));
    treeBody.position.set(pos.x, pos.y, pos.z);
    physicsWorld.addBody(treeBody);
    staticBodies.push(treeBody);
}

function createBuilding(pos, lat, lon, type) {
    var group = new THREE.Group();
    var h = 3 + Math.random() * 5;
    var w = 2 + Math.random() * 2;

    var color = type === '工厂' ? COLORS.factory : COLORS.building;
    var roofColor = type === '工厂' ? COLORS.factory : COLORS.buildingRoof;

    // 主体
    var bodyGeo = new THREE.BoxGeometry(w, h, w);
    var bodyMat = new THREE.MeshLambertMaterial({ color: color });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = h / 2;
    group.add(body);

    // 屋顶
    var roofGeo = new THREE.ConeGeometry(w * 0.8, 1.5, 4);
    var roofMat = new THREE.MeshLambertMaterial({ color: roofColor });
    var roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = h + 0.75;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    group.position.copy(pos);
    alignToSurface(group, pos);

    scene.add(group);

    // 碰撞体：盒子（建筑主体）
    var buildShape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, w / 2));
    var buildBody = new CANNON.Body({ mass: 0 });
    buildBody.addShape(buildShape, new CANNON.Vec3(0, h / 2, 0));
    buildBody.position.set(pos.x, pos.y, pos.z);
    physicsWorld.addBody(buildBody);
    staticBodies.push(buildBody);
}

function createRock(pos, lat, lon) {
    var rockScale = 0.5 + Math.random();
    var geo = new THREE.DodecahedronGeometry(0.5 + Math.random(), 0);
    var mat = new THREE.MeshLambertMaterial({ color: COLORS.rock });
    var rock = new THREE.Mesh(geo, mat);
    rock.position.copy(pos);
    alignToSurface(rock, pos);
    rock.scale.setScalar(rockScale);
    scene.add(rock);

    // 碰撞体：球体
    var rockShape = new CANNON.Sphere(0.5 * rockScale);
    var rockBody = new CANNON.Body({ mass: 0 });
    rockBody.addShape(rockShape);
    rockBody.position.set(pos.x, pos.y, pos.z);
    physicsWorld.addBody(rockBody);
    staticBodies.push(rockBody);
}

function createFlower(pos, lat, lon) {
    var group = new THREE.Group();
    var colors = [0xFF6B6B, 0xFFD93D, 0x6BCB77, 0x4D96FF, 0xFF8FAB];
    var color = colors[Math.floor(Math.random() * colors.length)];

    // 花茎
    var stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4);
    var stemMat = new THREE.MeshLambertMaterial({ color: 0x7CB342 });
    var stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.2;
    group.add(stem);

    // 花朵
    var petalGeo = new THREE.SphereGeometry(0.12, 6, 6);
    var petalMat = new THREE.MeshLambertMaterial({ color: color });
    var petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.y = 0.45;
    group.add(petal);

    group.position.copy(pos);
    alignToSurface(group, pos);
    group.scale.setScalar(0.8 + Math.random() * 0.5);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
}

function createLamp(pos, lat, lon) {
    var group = new THREE.Group();

    // 灯柱
    var poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 2.5, 6);
    var poleMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.25;
    group.add(pole);

    // 灯罩
    var shadeGeo = new THREE.ConeGeometry(0.3, 0.4, 6);
    var shadeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    var shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = 2.6;
    group.add(shade);

    // 灯泡发光
    var bulbGeo = new THREE.SphereGeometry(0.15, 8, 8);
    var bulbMat = new THREE.MeshBasicMaterial({ color: 0xFFF8E1 });
    var bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.y = 2.4;
    group.add(bulb);

    group.position.copy(pos);
    alignToSurface(group, pos);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
}

function createFence(pos, lat, lon) {
    var group = new THREE.Group();
    var length = 3 + Math.random() * 3;
    var segments = Math.floor(length / 0.8);

    for (var i = 0; i <= segments; i++) {
        // 竖桩
        var postGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
        var post = new THREE.Mesh(postGeo, postMat);
        post.position.set(-length / 2 + i * 0.8, 0.4, 0);
        group.add(post);
    }

    // 横栏
    var railGeo = new THREE.BoxGeometry(length, 0.08, 0.06);
    var railMat = new THREE.MeshLambertMaterial({ color: 0xA1887F });
    var rail1 = new THREE.Mesh(railGeo, railMat);
    rail1.position.set(0, 0.6, 0);
    group.add(rail1);
    var rail2 = new THREE.Mesh(railGeo, railMat);
    rail2.position.set(0, 0.3, 0);
    group.add(rail2);

    group.position.copy(pos);
    alignToSurface(group, pos);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
}
