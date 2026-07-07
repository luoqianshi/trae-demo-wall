// ============================================================
// 创建球形星球
// ============================================================
function createPlanet() {
    // 星球主体 - 使用 Icosahedron 获得更均匀的分布
    var planetGeo = new THREE.IcosahedronGeometry(PLANET_RADIUS, 4);

    // 为每个面分配颜色（大陆/海洋）
    var colors = [];
    var pos = planetGeo.attributes.position;
    var color = new THREE.Color();

    for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        var lat = Math.asin(y / PLANET_RADIUS); // 纬度
        var lon = Math.atan2(z, x); // 经度

        // 6块大陆分布在不同纬度带
        var continentIndex = getContinentIndex(lat, lon);

        if (continentIndex >= 0) {
            // 大陆 - 根据区域类型着色
            var regionType = getRegionType(continentIndex, lat, lon);
            color.setHex(getRegionColor(regionType, continentIndex));
        } else {
            // 海洋
            var depth = Math.sin(lat * 3 + lon * 2) * 0.1;
            color.setHex(COLORS.water);
            color.r += depth; color.g += depth; color.b += depth;
        }
        colors.push(color.r, color.g, color.b);
    }

    planetGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    var planetMat = new THREE.MeshLambertMaterial({
        vertexColors: true,
        flatShading: true,
        side: THREE.DoubleSide
    });

    planet = new THREE.Mesh(planetGeo, planetMat);
    planet.receiveShadow = true;
    scene.add(planet);

    // 海洋层（稍大的透明球）
    var oceanGeo = new THREE.IcosahedronGeometry(PLANET_RADIUS + 0.5, 3);
    var oceanMat = new THREE.MeshLambertMaterial({
        color: COLORS.water,
        transparent: true,
        opacity: 0.3,
        flatShading: true
    });
    var ocean = new THREE.Mesh(oceanGeo, oceanMat);
    scene.add(ocean);

    // 添加装饰物（树木、建筑等）
    addDecorations();

    // 云层
    addClouds();
}

function getContinentIndex(lat, lon) {
    // 6块大陆分布在不同纬度带，每块占约 30° 纬度
    var latDeg = lat * 180 / Math.PI;
    var lonDeg = lon * 180 / Math.PI;

    // 调整大陆分布使其更合理
    var continents = [
        { latMin: -80, latMax: -50, lonMin: -60, lonMax: 60 },   // 一年级 - 南极附近
        { latMin: -45, latMax: -15, lonMin: 30, lonMax: 150 },   // 二年级
        { latMin: -10, latMax: 20, lonMin: -120, lonMax: 0 },    // 三年级
        { latMin: 25, latMax: 55, lonMin: -60, lonMax: 60 },     // 四年级
        { latMin: 50, latMax: 80, lonMin: 30, lonMax: 150 },     // 五年级
        { latMin: -20, latMax: 20, lonMin: 60, lonMax: 180 }     // 六年级 - 赤道
    ];

    for (var i = 0; i < continents.length; i++) {
        var c = continents[i];
        if (latDeg >= c.latMin && latDeg <= c.latMax && lonDeg >= c.lonMin && lonDeg <= c.lonMax) {
            // 添加一些噪声使边界不规则
            var noise = Math.sin(lat * 5) * Math.cos(lon * 3) * 8;
            if (latDeg + noise >= c.latMin && latDeg + noise <= c.latMax) {
                return i;
            }
        }
    }
    return -1;
}

function getRegionType(continentIndex, lat, lon) {
    var regions = GradeConfig[continentIndex].regions;
    var hash = Math.abs(Math.sin(lat * 7 + lon * 11 + continentIndex * 13));
    return regions[Math.floor(hash * regions.length)];
}

function getRegionColor(type, continentIndex) {
    var baseColor = GradeConfig[continentIndex].color;
    switch(type) {
        case '居民区': return COLORS.building;
        case '工厂': return COLORS.factory;
        case '沙滩': return COLORS.sand;
        case '森林': return COLORS.ground;
        case '山坡': return COLORS.groundDark;
        case '寺庙': return COLORS.temple;
        case '游乐场': return COLORS.playground;
        default: return baseColor;
    }
}

function addDecorations() {
    // 树木
    for (var i = 0; i < 100; i++) {
        var lat = (Math.random() - 0.5) * Math.PI;
        var lon = Math.random() * Math.PI * 2;
        var ci = getContinentIndex(lat, lon);
        if (ci < 0) continue;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS);
        createTree(pos, lat, lon);
    }

    // 建筑物
    for (var i = 0; i < 40; i++) {
        var lat = (Math.random() - 0.5) * Math.PI;
        var lon = Math.random() * Math.PI * 2;
        var ci = getContinentIndex(lat, lon);
        if (ci < 0) continue;
        var rt = getRegionType(ci, lat, lon);
        if (rt === '居民区' || rt === '工厂') {
            var pos = latLonToVector(lat, lon, PLANET_RADIUS);
            createBuilding(pos, lat, lon, rt);
        }
    }

    // 岩石
    for (var i = 0; i < 50; i++) {
        var lat = (Math.random() - 0.5) * Math.PI;
        var lon = Math.random() * Math.PI * 2;
        if (getContinentIndex(lat, lon) < 0) continue;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS);
        createRock(pos, lat, lon);
    }

    // 花草
    for (var i = 0; i < 150; i++) {
        var lat = (Math.random() - 0.5) * Math.PI;
        var lon = Math.random() * Math.PI * 2;
        if (getContinentIndex(lat, lon) < 0) continue;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS);
        createFlower(pos, lat, lon);
    }

    // 路灯
    for (var i = 0; i < 25; i++) {
        var lat = (Math.random() - 0.5) * Math.PI;
        var lon = Math.random() * Math.PI * 2;
        if (getContinentIndex(lat, lon) < 0) continue;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS);
        createLamp(pos, lat, lon);
    }

    // 栅栏
    for (var i = 0; i < 20; i++) {
        var lat = (Math.random() - 0.5) * Math.PI;
        var lon = Math.random() * Math.PI * 2;
        if (getContinentIndex(lat, lon) < 0) continue;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS);
        createFence(pos, lat, lon);
    }

    // 长椅
    for (var i = 0; i < 15; i++) {
        var lat = (Math.random() - 0.5) * Math.PI;
        var lon = Math.random() * Math.PI * 2;
        if (getContinentIndex(lat, lon) < 0) continue;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS);
        createBench(pos, lat, lon);
    }

    // 小径/道路标记
    for (var i = 0; i < 30; i++) {
        var lat = (Math.random() - 0.5) * Math.PI;
        var lon = Math.random() * Math.PI * 2;
        if (getContinentIndex(lat, lon) < 0) continue;
        var pos = latLonToVector(lat, lon, PLANET_RADIUS);
        createPathStone(pos, lat, lon);
    }
}

function latLonToVector(lat, lon, radius) {
    return new THREE.Vector3(
        radius * Math.cos(lat) * Math.cos(lon),
        radius * Math.sin(lat),
        radius * Math.cos(lat) * Math.sin(lon)
    );
}

function alignToSurface(obj, pos) {
    var up = pos.clone().normalize();
    var forward = new THREE.Vector3(0, 0, 1);
    if (Math.abs(up.z) > 0.9) forward.set(1, 0, 0);
    forward.sub(up.clone().multiplyScalar(forward.dot(up)));
    forward.normalize();
    var right = new THREE.Vector3().crossVectors(up, forward).normalize();
    forward.crossVectors(right, up).normalize();
    var m = new THREE.Matrix4();
    m.makeBasis(right, up, forward);
    obj.quaternion.setFromRotationMatrix(m);
}

function addClouds() {
    for (var i = 0; i < 20; i++) {
        var cloudGroup = new THREE.Group();
        var nBlobs = 3 + Math.floor(Math.random() * 4);
        for (var j = 0; j < nBlobs; j++) {
            var geo = new THREE.IcosahedronGeometry(2 + Math.random() * 3, 0);
            var mat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5 + Math.random() * 0.3
            });
            var blob = new THREE.Mesh(geo, mat);
            blob.position.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 4
            );
            cloudGroup.add(blob);
        }

        var lat = (Math.random() - 0.5) * Math.PI * 0.8;
        var lon = Math.random() * Math.PI * 2;
        var cloudPos = latLonToVector(lat, lon, PLANET_RADIUS + 25);
        cloudGroup.position.copy(cloudPos);
        cloudGroup.userData = { speed: 0.0005 + Math.random() * 0.001, lat: lat, lon: lon };
        scene.add(cloudGroup);
    }
}

function createBench(pos, lat, lon) {
    var group = new THREE.Group();

    // 座位
    var seatGeo = new THREE.BoxGeometry(1.2, 0.08, 0.4);
    var seatMat = new THREE.MeshLambertMaterial({ color: 0x8D6E63 });
    var seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.y = 0.45;
    group.add(seat);

    // 靠背
    var backGeo = new THREE.BoxGeometry(1.2, 0.4, 0.06);
    var back = new THREE.Mesh(backGeo, seatMat);
    back.position.set(0, 0.7, -0.18);
    group.add(back);

    // 腿
    var legGeo = new THREE.BoxGeometry(0.08, 0.45, 0.35);
    var legMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    var leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-0.5, 0.22, 0);
    group.add(leg1);
    var leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(0.5, 0.22, 0);
    group.add(leg2);

    group.position.copy(pos);
    alignToSurface(group, pos);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
}

function createPathStone(pos, lat, lon) {
    var geo = new THREE.CylinderGeometry(0.3 + Math.random() * 0.3, 0.3 + Math.random() * 0.3, 0.05, 6);
    var mat = new THREE.MeshLambertMaterial({ color: 0xBCAAA4 });
    var stone = new THREE.Mesh(geo, mat);
    stone.position.copy(pos);
    alignToSurface(stone, pos);
    stone.rotation.y = Math.random() * Math.PI * 2;
    stone.scale.setScalar(0.7 + Math.random() * 0.5);
    scene.add(stone);
}
