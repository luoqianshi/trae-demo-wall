// cannon-es 物理世界
var physicsWorld;
var playerBody;
var staticBodies = []; // 场景静态碰撞体

function initPhysics() {
    physicsWorld = new CANNON.World();
    physicsWorld.gravity.set(0, 0, 0); // 球面世界禁用全局重力，手动施加径向力
    physicsWorld.broadphase = new CANNON.NaiveBroadphase();
    physicsWorld.solver.iterations = 10;
    physicsWorld.solver.tolerance = 0.001;

    // 碰撞材质
    physicsWorld.defaultContactMaterial.friction = 0.5;
    physicsWorld.defaultContactMaterial.restitution = 0.1;
}

// 创建静态碰撞体（树、岩石、建筑等）
function addStaticBody(position, shape, scale) {
    var body = new CANNON.Body({ mass: 0 }); // mass: 0 = 静态
    if (scale) {
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), new CANNON.Quaternion());
        body.scale = scale;
    } else {
        body.addShape(shape);
    }
    body.position.set(position.x, position.y, position.z);
    physicsWorld.addBody(body);
    staticBodies.push(body);
    return body;
}
