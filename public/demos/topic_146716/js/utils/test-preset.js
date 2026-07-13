/**
 * 测试预设脚本 - 全局设定
 * 使用方式：在控制台执行 applyTestPreset() 即可应用
 * 撤销方式：在控制台执行 removeTestPreset() 即可恢复
 */

// 应用测试预设
function applyTestPreset() {
  if (typeof ShelterSystem === 'undefined' || !ShelterSystem.getData()) {
    console.error('[测试脚本] ShelterSystem 未初始化');
    return false;
  }
  const data = ShelterSystem.getData();

  // 保存原始值（用于撤销）
  if (!window.__testPresetOriginal) {
    window.__testPresetOriginal = {
      building: data.resources.building,
      food: data.resources.food,
      parts: data.resources.parts
    };
  }

  // 设置资源
  data.resources.building = 5000;
  data.resources.food = 5000;
  data.resources.parts = 5000;

  // 保存
  ShelterSystem.save();

  console.log('[测试脚本] ✅ 已应用：建材=5000, 食物=5000, 零件=5000');
  console.log('[测试脚本] 撤销命令: removeTestPreset()');
  return true;
}

// 撤销测试预设
function removeTestPreset() {
  if (typeof ShelterSystem === 'undefined' || !ShelterSystem.getData()) {
    console.error('[测试脚本] ShelterSystem 未初始化');
    return false;
  }
  if (!window.__testPresetOriginal) {
    console.log('[测试脚本] 没有已保存的原始值');
    return false;
  }
  const data = ShelterSystem.getData();
  data.resources.building = window.__testPresetOriginal.building;
  data.resources.food = window.__testPresetOriginal.food;
  data.resources.parts = window.__testPresetOriginal.parts;
  ShelterSystem.save();
  delete window.__testPresetOriginal;
  console.log('[测试脚本] ✅ 已撤销，资源恢复原始值');
  return true;
}

// ============================================================
// 刷怪命令 - 在玩家5米处生成指定怪物
// ============================================================

// 获取玩家前方5米位置
function getSpawnPos() {
  if (!camera) {
    console.error('[刷怪] camera 未定义');
    return null;
  }
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const pos = camera.position.clone().add(forward.multiplyScalar(5));
  pos.y = 0;
  return pos;
}

// 刷怪通用函数
function spawnZombieByIndex(index) {
  if (typeof ZOMBIE_DEFS === 'undefined') {
    console.error('[刷怪] ZOMBIE_DEFS 未定义，请在游戏进行中使用');
    return;
  }
  if (typeof spawnEnemy !== 'function') {
    console.error('[刷怪] spawnEnemy 函数未定义，请在游戏进行中使用');
    return;
  }
  if (index < 0 || index >= ZOMBIE_DEFS.length) {
    console.error('[刷怪] 无效的怪物索引:', index);
    return;
  }
  const pos = getSpawnPos();
  if (!pos) return;
  const enemy = spawnEnemy(ZOMBIE_DEFS[index], pos);
  if (enemy) {
    console.log(`[刷怪] ✅ 已生成: ${ZOMBIE_DEFS[index].name}`);
  }
}

// 0 - 普通僵尸
function spawnNormal() { spawnZombieByIndex(0); }
// 1 - 快速僵尸
function spawnFast() { spawnZombieByIndex(1); }
// 2 - 胖子僵尸
function spawnFat() { spawnZombieByIndex(2); }
// 3 - 远程僵尸
function spawnRanged() { spawnZombieByIndex(3); }
// 4 - 爆炸僵尸
function spawnExplosive() { spawnZombieByIndex(4); }
// 5 - 精英僵尸
function spawnElite() { spawnZombieByIndex(5); }
// 6 - 毒液僵尸
function spawnPoison() { spawnZombieByIndex(6); }
// 7 - 隐身僵尸
function spawnStealth() { spawnZombieByIndex(7); }
// 8 - 暴君
function spawnTyrant() { spawnZombieByIndex(8); }
// 9 - 舔食者
function spawnLicker() { spawnZombieByIndex(9); }
// 10 - 飞龙
function spawnWyvern() { spawnZombieByIndex(10); }

// 刷出所有怪物（各一个）
function spawnAll() {
  for (let i = 0; i < 11; i++) {
    setTimeout(() => spawnZombieByIndex(i), i * 200);
  }
  console.log('[刷怪] ✅ 正在生成所有怪物类型...');
}

// 快捷命令列表
window.applyTestPreset = applyTestPreset;
window.removeTestPreset = removeTestPreset;

// 刷怪命令
window.spawnNormal = spawnNormal;       // 普通僵尸
window.spawnFast = spawnFast;           // 快速僵尸
window.spawnFat = spawnFat;             // 胖子僵尸
window.spawnRanged = spawnRanged;       // 远程僵尸
window.spawnExplosive = spawnExplosive; // 爆炸僵尸
window.spawnElite = spawnElite;         // 精英僵尸
window.spawnPoison = spawnPoison;       // 毒液僵尸
window.spawnStealth = spawnStealth;     // 隐身僵尸
window.spawnTyrant = spawnTyrant;       // 暴君
window.spawnLicker = spawnLicker;       // 舔食者
window.spawnWyvern = spawnWyvern;       // 飞龙
window.spawnAll = spawnAll;             // 所有怪物

// ============================================================
// 控制台命令说明
// ============================================================
/*
【资源设置命令】
  applyTestPreset()       - 设置建材/食物/零件为5000
  removeTestPreset()      - 恢复原始资源值

【刷怪命令 - 在玩家前方5米处生成】
  spawnNormal()           - 普通僵尸
  spawnFast()             - 快速僵尸（四肢着地）
  spawnFat()              - 胖子僵尸（血厚）
  spawnRanged()           - 远程僵尸（投掷腐肉）
  spawnExplosive()        - 爆炸僵尸（死亡爆炸）
  spawnElite()            - 精英僵尸（BOSS级）
  spawnPoison()           - 毒液僵尸（喷射毒液）
  spawnStealth()          - 隐身僵尸（接近显形）
  spawnTyrant()           - 暴君（巨型BOSS）
  spawnLicker()           - 舔食者（跳跃攻击）
  spawnWyvern()           - 飞龙（飞行俯冲）
  spawnAll()              - 生成所有类型怪物各一个

【使用条件】
  - 必须在游戏进行中（已开始战斗）
  - 需要 Three.js 和 game.js 已加载
  - 刷怪命令需要 camera 和 yaw 已定义
*/
