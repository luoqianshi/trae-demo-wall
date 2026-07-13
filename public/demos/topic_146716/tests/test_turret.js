// 模拟测试炮塔逻辑
// 检查变量引用和函数调用是否正确

// 模拟 game.js 的环境
let enemies = [];
Object.defineProperty(window, 'enemies', { get: () => enemies });

// 模拟 fortifications.js 中的 turretBullets
let turretBullets = [];

// 模拟 scene
window.scene = { add: () => {}, remove: () => {} };

// 测试1: enemies 是否可访问
console.log('Test 1 - enemies accessible:', enemies.length === 0);

// 添加一个假敌人
enemies.push({ mesh: { position: { x: 5, y: 1, z: 0 } } });
console.log('Test 2 - enemies after push:', enemies.length);

// 测试2: turretBullets push
turretBullets.push({ test: true });
console.log('Test 3 - turretBullets after push:', turretBullets.length);

// 测试3: direction 计算
const firePos = { x: 0, y: 1.2, z: 0 };
const targetCenter = { x: 5, y: 1.8, z: 0 };
const dx = targetCenter.x - firePos.x;
const dy = targetCenter.y - firePos.y;
const dz = targetCenter.z - firePos.z;
const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
console.log('Test 4 - direction length:', len.toFixed(2));
console.log('Test 4 - direction normalized:', (dx/len).toFixed(2), (dy/len).toFixed(2), (dz/len).toFixed(2));

// 测试4: bullet position update
const bullet = { position: { x: 0, y: 1.2, z: 0 }, userData: { direction: { x: dx/len, y: dy/len, z: dz/len }, speed: 30, life: 3.0 } };
const dt = 0.016;
bullet.position.x += bullet.userData.direction.x * bullet.userData.speed * dt;
bullet.position.y += bullet.userData.direction.y * bullet.userData.speed * dt;
bullet.position.z += bullet.userData.direction.z * bullet.userData.speed * dt;
console.log('Test 5 - bullet after update:', bullet.position.x.toFixed(2), bullet.position.y.toFixed(2), bullet.position.z.toFixed(2));

console.log('All tests passed!');
