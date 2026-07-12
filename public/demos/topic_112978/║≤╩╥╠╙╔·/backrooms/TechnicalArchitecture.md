## 1. 架构设计

游戏采用纯前端单文件实现，Canvas 2D 作为渲染核心，原生 JavaScript 驱动游戏循环。标题、HUD、结算界面通过 DOM 叠加在 Canvas 之上。

```mermaid
flowchart TD
    subgraph "HTML 外壳"
        "index.html" --> "标题界面 DOM"
        "index.html" --> "HUD DOM"
        "index.html" --> "结算界面 DOM"
        "index.html" --> "Canvas 画布"
    end

    subgraph "游戏引擎 (game.js)"
        "GameLoop 主循环" --> "输入管理器"
        "GameLoop 主循环" --> "实体管理器"
        "GameLoop 主循环" --> "地图生成器"
        "GameLoop 主循环" --> "碰撞系统"
        "GameLoop 主循环" --> "渲染器"
        "实体管理器" --> "玩家 Player"
        "实体管理器" --> "丧尸 Zombie"
        "实体管理器" --> "飞虫 Bug"
        "实体管理器" --> "毒气云 Gas"
        "实体管理器" --> "道具 Item"
        "渲染器" --> "地图层渲染"
        "渲染器" --> "实体层渲染"
        "渲染器" --> "光照/阴影层"
        "渲染器" --> "后处理层(噪点/暗角)"
    end

    "标题界面 DOM" -->|"开始游戏"| "GameLoop 主循环"
    "GameLoop 主循环" -->|"状态更新"| "HUD DOM"
    "GameLoop 主循环" -->|"游戏结束"| "结算界面 DOM"
```

## 2. 技术说明

- **渲染技术**：HTML5 Canvas 2D API，`imageSmoothingEnabled = false` 保持像素锐利
- **编程语言**：原生 JavaScript（ES6+），单文件 `game.js`
- **样式方案**：内联 CSS + CSS 变量，黄色系主题
- **字体**：Google Fonts 加载 `Press Start 2P` 与 `VT323`
- **构建工具**：无需构建，直接在浏览器运行
- **运行方式**：静态文件服务器或直接双击 `index.html`

## 3. 目录结构

```
backrooms/
├── index.html       # 页面结构 + 样式 + 界面DOM
└── game.js          # 游戏引擎完整代码
```

## 4. 核心数据结构

### 4.1 玩家
```typescript
interface Player {
  x: number; y: number;          // 世界坐标（像素）
  vx: number; vy: number;
  width: number; height: number;
  hp: number; maxHp: number;
  oxygen: number; maxOxygen: number;
  flashbangs: number;
  facing: 'up'|'down'|'left'|'right';
  state: 'idle'|'walking'|'attacking'|'blocking'|'hurt'|'dead';
  stateTimer: number;
  animFrame: number; animTimer: number;
  invulnTimer: number;          // 受击无敌帧
  isPlayer: boolean;             // false = AI
  id: 0 | 1;
}
```

### 4.2 敌人
```typescript
interface Enemy {
  type: 'zombie' | 'bug';
  x: number; y: number;
  vx: number; vy: number;
  hp: number; maxHp: number;
  state: 'idle'|'chase'|'attack'|'stunned'|'dead';
  stateTimer: number;
  stunTimer: number;             // 闪光弹眩晕
  animFrame: number; animTimer: number;
  damage: number;
  speed: number;
}
```

### 4.3 地图
```typescript
interface Room { x: number; y: number; w: number; h: number; connected: boolean; }
interface TileMap {
  tiles: number[][];             // 0=空地板 1=墙 2=门 3=楼梯出口
  width: number; height: number; // 瓦片数
  tileSize: number;              // 单瓦片像素
  rooms: Room[];
  exitX: number; exitY: number;  // 出口楼梯瓦片坐标
}
```

## 5. 地图生成算法

- 每层使用「房间 + 走廊」算法程序化生成
- 随机生成 5-8 个不重叠矩形房间
- 用 L 形走廊连接相邻房间中心点
- 在其中一个房间放置出口楼梯
- 敌人与道具随机分布在房间内
- 楼层越深，房间越大、敌人越多、毒气概率越高

## 6. 碰撞检测

- **玩家 vs 墙体**：分轴 AABB，先 X 后 Y，分别解算
- **玩家 vs 敌人**：圆形碰撞（半径检测），接触持续扣血
- **玩家 vs 毒气云**：矩形重叠，进入区域持续扣血 + 扣氧
- **近战攻击 vs 敌人**：攻击扇区判定（根据朝向的矩形范围）
- **闪光弹 vs 敌人**：圆形范围检测，范围内敌人眩晕

## 7. 像素精灵方案（程序化绘制）

所有角色与敌人均通过 Canvas 矩形像素拼合绘制，不依赖外部图片资源。

```
防化服角色像素矩阵示例（16x20）：
    ...YYY.....YYY..
    ..YYYYY...YYYYY.
    ..YBBYB...YBBYY.    Y=黄色防化服
    ..YRRRY...YRRRY.    B=黑色面具
    ..YYYYY...YYYYY.    R=红色滤毒罐
    ...YYY.....YYY..    O=氧气瓶
    ..YYYYYYYYYYYYY.    G=灰色靴子
    ..YYYYYYYYYYYYY.
    ..YYYOOOOOOOOYYY
    ..YYYOOOOOOOOYYY
    ..YYYOOOOOOOOYYY
    ..YYYYYYYYYYYYY.
    ..YYYYYYYYYYYYY.
    ...YY......YY...
    ...YY......YY...
    ...GG......GG...
    ..GGG......GGG..
```

## 8. 性能与优化

- 逻辑分辨率 800×600，Canvas 固定大小，CSS 缩放
- 固定 60 FPS 逻辑更新，使用 deltaTime 保证帧率无关
- 地图瓦片预渲染到离屏 Canvas，每帧整体 drawImage
- 只渲染摄像机视口内的实体
- 敌人数量上限：每层最多 15 个（丧尸+飞虫合计）
- 粒子上限 50 个，超出自动回收最早粒子
