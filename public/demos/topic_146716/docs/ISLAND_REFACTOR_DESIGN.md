# 孤岛基地重构设计文档

> 版本: v1.0
> 日期: 2026-06-20
> 状态: 设计中

---

## 一、现状问题清单

### 1.1 地图问题
- [ ] 建筑全是方块（BoxGeometry），无军事基地设计感
- [ ] 围墙只是四面灰色大方块，无大门细节、无铁丝网、无瞭望口
- [ ] 地面只是绿色圆柱体，无纹理变化、无道路、无草地细节
- [ ] 岛外只有平面海水，无波浪、无远处岛屿、无海鸥
- [ ] 无树木、无植被、无岩石装饰
- [ ] 建筑无碰撞体或碰撞体粗糙

### 1.2 NPC问题
- [ ] 士兵NPC无名字，显示"士兵 #1"
- [ ] NPC模型是方块人（BoxGeometry身体+头），无士兵特征
- [ ] 无骨骼动画系统，只有简单的肢体旋转
- [ ] 靠近即对话（<5米自动触发），无E键交互
- [ ] 对话时游戏不暂停，鼠标不锁定到对话框
- [ ] 关闭对话框后需要额外点击才能恢复视角控制

### 1.3 渔夫/捕鱼问题
- [ ] 捕鱼游戏是800x600小窗口（画中画），非全屏
- [ ] 捕鱼游戏画面简陋（纯色鱼、无背景细节）
- [ ] 渔夫对话也是靠近自动触发

### 1.4 空投问题
- [ ] 海岛是安全区，不应有空投，但当前空投系统全局运行

---

## 二、架构设计原则

### 2.1 全局对话框系统规范（所有地图通用）
```
┌─────────────────────────────────────────────────────────────┐
│  触发条件: 玩家进入NPC交互范围（默认3米内）+ 按下E键           │
│  交互提示: 显示"[E] 与XXX对话"浮动提示                       │
│                                                             │
│  打开对话框时:                                               │
│    1. 暂停游戏（gameState = 'paused'）                       │
│    2. 退出指针锁定（document.exitPointerLock()）             │
│    3. 显示鼠标光标（document.body.style.cursor = 'default'） │
│    4. 对话框获得焦点                                         │
│                                                             │
│  关闭对话框时:                                               │
│    1. 恢复游戏（gameState = 'playing'）                      │
│    2. 请求指针锁定（renderer.domElement.requestPointerLock()）│
│    3. 隐藏鼠标光标（document.body.style.cursor = 'none'）    │
│    4. 不需要额外点击，直接恢复视角控制                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 NPC数据规范
```javascript
{
  id: 'npc_soldier_01',
  name: '李军士',           // 有名字，不是编号
  role: 'patrol',            // patrol / quest / shop / story
  appearance: 'soldier',     // soldier / fisherman / scientist / officer
  dialogues: [...],
  interactKey: 'KeyE',       // 统一E键
  interactRange: 3,          // 交互距离3米
  autoTrigger: false,        // 不自动触发
  hasCollision: true,        // NPC有碰撞体
  animationSet: 'soldier'    // 引用动画集
}
```

---

## 三、海岛地图重构设计

### 3.1 地形系统
```
主岛地形:
  - 中心区域: 军事基地（混凝土/沥青地面）
  - 外围环带: 沙滩（黄色沙地，有脚印纹理）
  - 边缘: 岩石悬崖（灰色岩石，有层次感）
  - 水下: 珊瑚礁（可见部分）

地面细节:
  - 基地内部道路（灰色沥青，有白线）
  - 草地斑块（绿色，随机分布）
  - 泥土地带（棕色，建筑周围）
```

### 3.2 建筑重构（军事基地风格）

#### 指挥中心
```
- 主体: 2层混凝土建筑，带斜屋顶
- 细节: 窗户（带玻璃反光）、大门（金属卷帘门）、空调外机
- 顶部: 通讯天线阵列（多根天线+旋转雷达）
- 周围: 沙袋掩体、军用油桶、旗杆
- 碰撞: 精确Box3碰撞体
```

#### 兵营
```
- 主体: 长条形单层建筑，波纹铁皮屋顶
- 细节: 多扇窗户、排风扇、烟囱
- 周围: 晾衣绳、军用储物箱、自行车
- 碰撞: 精确Box3碰撞体
```

#### 仓库
```
- 主体: 大型拱顶仓库（类似机库）
- 细节: 大型卷帘门、叉车、木箱堆
- 碰撞: 精确Box3碰撞体
```

#### 停机坪
```
- 主体: 圆形混凝土平台
- 细节: H标记（黄色）、导航灯（边缘绿色灯）
- 周围: 直升机加油设备、工具箱
```

#### 围墙系统
```
- 墙体: 混凝土墙（高4米，厚0.5米）
- 顶部: 铁丝网（带刺，有晃动动画）
- 大门: 双开金属门（可开合动画）
- 瞭望口: 墙上有射击孔
- 角落: 加固碉堡（带射击窗口）
```

#### 瞭望塔
```
- 主体: 钢制高塔（带梯子）
- 顶部: 封闭瞭望室（带玻璃窗）
- 设备: 探照灯（可旋转）、通讯设备
- 碰撞: 精确碰撞体
```

### 3.3 环境装饰

#### 树木
```
- 棕榈树（海岛特色，5-8棵）
- 松树（基地边缘，3-5棵）
- 灌木丛（随机分布，10-15丛）
```

#### 岩石
```
- 大型岩石（海岸边，5-8块）
- 小型碎石（随机分布）
```

#### 海洋
```
- 主海面: 半透明蓝色，带波浪动画
- 远处: 雾效中的模糊岛屿轮廓
- 天空: 海鸥（简单V形动画）
- 水面: 反光效果
```

---

## 四、NPC系统重构

### 4.1 士兵NPC（6名，有名字）
```
1. 李军士 (Li) - 巡逻队长，负责基地安全
2. 王射手 (Wang) - 狙击手，驻守望塔
3. 张医护 (Zhang) - 医疗兵，兵营附近
4. 赵工兵 (Zhao) - 工程师，仓库附近
5. 孙通讯 (Sun) - 通讯员，指挥中心附近
6. 周新兵 (Zhou) - 新兵，码头附近
```

### 4.2 士兵模型设计
```
身体结构（替代方块）:
  - 躯干: 略扁的圆柱体（穿防弹背心）
  - 头部: 球体 + 头盔（钢盔形状）
  - 手臂: 圆柱体（穿迷彩服）
  - 腿部: 圆柱体（穿军靴）
  - 武器: 步枪模型（带枪托、弹匣、瞄准镜）
  - 背包: 小型方块（军用背包）

颜色:
  - 迷彩绿: #4a5d3a
  - 钢盔绿: #3a4a2a
  - 皮肤: #ffccaa
  - 靴子: #1a1a1a
  - 武器: #2a2a2a
```

### 4.3 骨骼动画系统
```javascript
// 简单骨骼动画（基于userData引用）
npc.skeleton = {
  root: group,
  spine: body,
  head: head,
  leftArm: { upper: leftUpperArm, lower: leftLowerArm },
  rightArm: { upper: rightUpperArm, lower: rightLowerArm },
  leftLeg: { upper: leftThigh, lower: leftShin },
  rightLeg: { upper: rightThigh, lower: rightShin }
};

// 动画状态机
animations: {
  idle: { headBob: 0.02, breath: 0.01 },
  walk: { legSwing: 0.5, armSwing: 0.3, bob: 0.1 },
  run: { legSwing: 0.8, armSwing: 0.5, bob: 0.15 },
  aim: { rightArmRaise: 1.2, headTurn: 0.3 },
  talk: { headNod: 0.1, handGesture: 0.2 }
}
```

### 4.4 渔夫NPC
```
名字: 老陈 (Chen)
外观: 穿渔夫背心、戴草帽、持鱼竿
位置: 码头小屋前
对话: E键触发，有对话气泡提示
```

---

## 五、捕鱼游戏重构

### 5.1 全屏化
```
- Canvas尺寸: window.innerWidth x window.innerHeight
- 无边框，无缩放
- 背景: 深海渐变（从浅蓝到深蓝）
- 海底: 沙地、珊瑚、海草（有摆动动画）
```

### 5.2 视觉优化
```
鱼类:
  - 小鱼: 简单鱼形（椭圆+三角尾巴），有摆动动画
  - 中型鱼: 更复杂的鱼形，有鳍
  - 大型鱼: 详细鱼形，有鳞片纹理（用颜色模拟）
  - 稀有鱼: 发光效果
  - 深海鱼: 大嘴巴，尖牙

潜艇:
  - 玩家潜艇: 黄色潜水艇，有螺旋桨旋转动画
  - 鱼雷: 流线型，带尾焰
  - 渔网: 网状扩散效果
  - 声呐: 圆形波纹扩散

UI:
  - 顶部: 分数、时间、连击数
  - 底部: 武器选择栏（带图标）
  - 左侧: 技能栏（Q/W/E）
  - 右侧: 弹药数量
```

### 5.3 玩法优化
```
新增元素:
  - 海草: 会阻挡渔网，鱼雷可摧毁
  - 气泡: 从海底上升，碰到加分
  - 宝藏箱: 随机出现，开启得大量分数
  - 危险区: 红色水母群，碰到扣时间

连击系统:
  - 连续捕获不中断计时器
  - 10连击: 分数x2
  - 20连击: 分数x3 + 时间+5秒
  - 30连击: 进入"狂暴模式"（自动射击3秒）
```

---

## 六、空投系统修改

### 6.1 海岛禁用空投
```javascript
// 在updateAirdrop中添加地图检查
function updateAirdrop(dt) {
  // 海岛安全区不生成空投
  if (window.currentMap === 'island') return;
  // ...原有逻辑
}
```

---

## 七、实现优先级

### P0（最高优先级）
1. 全局对话框系统规范（E键触发、暂停、鼠标锁定）
2. 空投系统：海岛禁用
3. 士兵NPC：命名 + E键交互

### P1（高优先级）
4. 海岛建筑重构（指挥中心、兵营、围墙）
5. 海岛环境（树木、岩石、海洋优化）
6. 士兵模型重构（圆柱体+骨骼动画）

### P2（中优先级）
7. 捕鱼游戏全屏化
8. 捕鱼游戏视觉优化
9. 渔夫NPC模型重构

### P3（低优先级）
10. 建筑细节（窗户、门、装饰物）
11. 海洋远处岛屿、海鸥
12. 捕鱼游戏玩法增强（海草、宝藏、连击）

---

## 八、技术实现要点

### 8.1 碰撞体系统
```javascript
// 每个建筑生成时创建精确碰撞体
createBuildingCollision(buildingMesh) {
  const box = new THREE.Box3().setFromObject(buildingMesh);
  this.colliders.push({
    type: 'box',
    bounds: box,
    mesh: buildingMesh
  });
}

// 玩家碰撞检测
updateCollisions() {
  const playerBox = new THREE.Box3().setFromCenterAndSize(
    playerPos, new THREE.Vector3(1, 2, 1)
  );
  this.colliders.forEach(collider => {
    if (playerBox.intersectsBox(collider.bounds)) {
      this.resolveCollision(playerPos, collider);
    }
  });
}
```

### 8.2 对话框系统封装
```javascript
// 全局对话框管理器
const DialogSystem = {
  currentDialog: null,
  
  open(config) {
    // 1. 暂停游戏
    if (window.pauseGameState) pauseGameState();
    // 2. 退出指针锁定
    document.exitPointerLock();
    document.body.style.cursor = 'default';
    // 3. 显示对话框
    this.renderDialog(config);
    // 4. 标记状态
    this.currentDialog = config;
  },
  
  close() {
    // 1. 隐藏对话框
    this.hideDialog();
    // 2. 恢复游戏
    if (window.resumeGameState) resumeGameState();
    // 3. 请求指针锁定（不需要额外点击）
    const canvas = window.renderer?.domElement;
    if (canvas && gameState === 'playing') {
      canvas.requestPointerLock().catch(() => {});
    }
    document.body.style.cursor = 'none';
    // 4. 清除状态
    this.currentDialog = null;
  }
};
```

### 8.3 NPC交互检测
```javascript
updateNPCInteraction() {
  const playerPos = this.camera.position;
  
  this.npcs.forEach(npc => {
    const dist = npc.mesh.position.distanceTo(playerPos);
    const inRange = dist < npc.interactRange;
    
    // 显示/隐藏交互提示
    npc.showPrompt = inRange;
    
    // E键检测（只在范围内）
    if (inRange && this.keysPressed['KeyE'] && !npc.dialogOpen) {
      this.openNPCDialog(npc);
    }
  });
}
```
