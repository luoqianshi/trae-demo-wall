// ============================================================
// 数学星球 - 工具函数
// ============================================================

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
