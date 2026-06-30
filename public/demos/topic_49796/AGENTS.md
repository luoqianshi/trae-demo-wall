# AGENTS.md — 蛛网小卫士 (WebGuardian)

## Project Overview
蛛网小卫士是一款基于 HTML5 Canvas 的可爱风休闲解压网页游戏。玩家通过滑动鼠标/手指切断蜘蛛网来释放压力，同时需要避开网上爬行的小蜘蛛，捕捉飞过的虫子获得额外分数。游戏包含5个渐进关卡，支持鼠标和触屏操作。

## Tech Stack
- **Engine:** Vanilla JavaScript (ES6+), HTML5 Canvas 2D
- **Renderer:** Canvas 2D Context, requestAnimationFrame 游戏循环
- **Audio:** Web Audio API (Oscillator 生成音效)
- **Input:** Mouse + Touch 事件
- **Build:** 单文件 HTML (内联 CSS + JS)，无需构建工具
- **Platform:** 现代浏览器 (Chrome/Firefox/Safari/Edge)

## Architecture

### 游戏架构模式
采用 **Entity-Component-System (ECS)** 简化版架构：
- **Entity**: 游戏对象（蛛丝、蜘蛛、虫子、粒子）
- **System**: 游戏系统（渲染、输入、音频、关卡管理）
- **Game Loop**: 固定更新频率的 requestAnimationFrame 循环

### 文件结构
```
src/
  entities/
    Strand.js       — 蛛丝实体（可切断、振动、淡出）
    CuteSpider.js   — 可爱蜘蛛（爬行、眨眼、被切反馈）
    CuteBug.js      — 可爱虫子（蚊子/蝴蝶/萤火虫）
    Particle.js     — 粒子效果（切断爆发）
  systems/
    Game.js         — 游戏主控制器（状态机、关卡、分数）
    Renderer.js     — 渲染系统（Canvas 绘制）
    InputHandler.js — 输入系统（鼠标/触摸）
    AudioSystem.js  — 音频系统（Web Audio API）
    WebGenerator.js — 蜘蛛网生成器
  utils/
    Vec2.js         — 2D 向量工具
    MathUtils.js    — 数学辅助函数
assets/
  (暂无外部资源，所有图形用 Canvas 绘制)
docs/
  DESIGN.md       — 游戏设计文档
```

### 状态机
```
MENU → PLAYING → LEVEL_COMPLETE → (下一关/通关)
  ↑      ↓
  └──── GAME_OVER (重试)
```

## Conventions

### 命名规范
- **类名**: PascalCase (CuteSpider, Game, Renderer)
- **方法名**: camelCase (update, draw, checkCollision)
- **私有属性**: 下划线前缀 (_isPlaying, _score)
- **常量**: UPPER_SNAKE (LEVEL_CONFIGS, COLORS)

### 代码风格
- 每个类一个文件
- 使用 ES6 Class 语法
- 优先使用 const/let，不用 var
- 箭头函数用于回调
- 注释说明 WHY 而非 WHAT

### 游戏循环
```javascript
// 标准游戏循环模式
loop() {
  if (!this.isPlaying) return;
  this.update(deltaTime);  // 更新逻辑
  this.render();            // 渲染画面
  requestAnimationFrame(() => this.loop());
}
```

## Game Design Context

### 核心循环
滑动切断蛛丝 → 避开蜘蛛/捕捉虫子 → 达到切断比例 → 进入下一关

### 关键系统
- **蛛丝系统**: 贝塞尔曲线绘制，支持切断、振动、淡出
- **碰撞检测**: 点到线段距离计算
- **角色系统**: 蜘蛛沿蛛丝爬行，虫子沿蛛丝飞行
- **分数系统**: 切蛛丝+10，切蜘蛛-50，切蚊子+30，切蝴蝶+50，切萤火虫+100
- **关卡系统**: 5关渐进，每关有不同的蛛网密度、蜘蛛数量、虫子配置

### 关卡配置
```javascript
LEVEL_CONFIGS = [
  { rays: 8,  rings: 4, spiders: 1, bugs: {mosquito:2},           targetCut: 0.6, time: 30 },
  { rays: 10, rings: 5, spiders: 2, bugs: {mosquito:2,butterfly:1}, targetCut: 0.7, time: 40 },
  { rays: 12, rings: 6, spiders: 3, bugs: {mosquito:2,butterfly:2}, targetCut: 0.75, time: 50 },
  { rays: 14, rings: 7, spiders: 3, bugs: {mosquito:3,butterfly:2,firefly:1}, targetCut: 0.8, time: 55 },
  { rays: 16, rings: 8, spiders: 4, bugs: {mosquito:3,butterfly:3,firefly:1}, targetCut: 0.85, time: 60 }
];
```

## Common Tasks

### 添加新角色类型
1. 在 `src/entities/` 创建新类，继承 BaseEntity
2. 实现 update() 和 draw() 方法
3. 在 Game.js 的生成逻辑中添加
4. 在碰撞检测中处理

### 添加新关卡
1. 在 LEVEL_CONFIGS 数组中添加配置
2. 调整 rays/rings/spiders/bugs/targetCut/time

### 修改角色外观
1. 编辑对应实体类的 draw() 方法
2. 使用 Canvas 2D API 绘制（arc, ellipse, bezierCurveTo 等）

## What NOT to Do
- 不要把游戏状态放在 DOM 元素中（用 Game 类管理）
- 不要在 update() 中创建新对象（避免 GC 卡顿）
- 不要用 setInterval 做游戏循环（用 requestAnimationFrame）
- 不要把所有代码写在一个文件里（保持模块化）
- 不要硬编码关卡配置（用 LEVEL_CONFIGS 常量）
