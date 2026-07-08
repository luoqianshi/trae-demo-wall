# WebMotion Skill

> 用代码做视频 — MG 动画和视频包装层生成工具

## 概述

WebMotion 是一个基于 Web 的 MG 动画（Motion Graphics）生成工具，类似于 Remotion，但专注于视频剪辑中的动画包装层。它可以将文案脚本自动转化为带透明通道的动画素材，可直接叠加在视频上使用。

## 核心能力

1. **文案转动画**：输入文案，自动提取重点，生成匹配的 MG 动画
2. **编程式控制**：通过 `WebMotionAPI` 全局对象完全控制动画生成、编辑、预览、导出
3. **双模式渲染**：2D Canvas 模式 + 3D Three.js 模式
4. **透明通道导出**：PNG 序列帧（ZIP）、WebM（VP9 Alpha）、GIF
5. **可视化编辑**：生成的元素可拖拽、编辑属性、调整动画

## 使用方式

WebMotion 提供三种使用方式：

### 方式一：编程 Agent 直接编辑（推荐）

编程 Agent 直接调用 `WebMotionAPI` 写代码编辑动画，每次根据文字内容定制独一无二的动画，无路径依赖：

```javascript
// 1. 添加自定义场景（Agent 直接写动画代码）
WebMotionAPI.addScene({
  name: '标题动画',
  code: 'ctx.clearRect(0,0,width,height); /* Agent 定制的动画代码 */',
  duration: 3
});

// 2. 使用 AI API 生成（需配置 API Key）
WebMotionAPI.generateWithAI('你的文案内容', { sceneCount: 4 });

// 3. 播放预览
WebMotionAPI.play();

// 2. 播放预览
WebMotionAPI.play();

// 3. 添加自定义场景
WebMotionAPI.addScene({
  name: '自定义标题',
  code: 'ctx.clearRect(0,0,width,height); ctx.fillStyle="#c9a96e"; ctx.font="bold 64px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("Hello", width/2, height/2);',
  duration: 3
});

// 4. 修改场景代码
WebMotionAPI.setCode(0, 'ctx.clearRect(0,0,width,height); /* 新代码 */');

// 5. 导出
const blob = await WebMotionAPI.exportPNG();
WebMotionAPI.download(blob, 'animation.zip');

// 6. 链式调用
WebMotionAPI.clearScenes()
  .addScene({ name: '场景A', code: '...', duration: 3 })
  .addScene({ name: '场景B', code: '...', duration: 4 })
  .play();
```

### 方式二：调用 AI API 生成

1. 在设置中配置 AI API Key
2. 在左侧文案输入框粘贴脚本
3. 选择场景数和风格
4. 点击「生成 MG 动画」调用 AI 生成动画
5. 在预览区查看效果，可视化编辑元素
6. 点击「导出透明通道」导出素材

### 方式三：手动写代码编辑

1. 在「代码编辑」面板中直接编写 JS 动画代码
2. 支持 2D Canvas 和 3D Three.js 两种模式
3. 实时预览渲染效果
4. 可视化编辑面板同步反映代码元素

## 动画代码格式

### 2D Canvas 模式（默认）

```javascript
// 参数：ctx, t, width, height, utils
ctx.clearRect(0, 0, width, height);

const text = '你的文字';
const progress = utils.clamp(t / 0.5, 0, 1);
const scale = utils.lerp(0.3, 1, utils.ease.outBack(progress));

// 注册可编辑元素（重要！）
const title = utils.registerElement('text', {
  id: 'title',
  x: width/2 - 200, y: height/2 - 30, w: 400, h: 60,
  text: text, fontSize: 48, color: '#ffffff',
  animIn: 'scale', animInDuration: 0.5
});
title.draw(ctx);
```

### 3D Three.js 模式（设置 is3D: true）

```javascript
// 参数：THREE, scene, camera, width, height, utils
// 需要 return 一个 animate(t) 函数
const geo = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshPhongMaterial({ color: 0xc9a96e });
const cube = new THREE.Mesh(geo, mat);
scene.add(cube);
scene.add(new THREE.AmbientLight(0x404040, 1.5));

return function(t) {
  cube.rotation.x = t * 0.5;
  cube.rotation.y = t * 0.8;
};
```

## Utils 工具函数

| 函数 | 说明 |
|------|------|
| `utils.lerp(a, b, t)` | 线性插值 |
| `utils.clamp(v, min, max)` | 钳制范围 |
| `utils.map(v, min1, max1, min2, max2)` | 范围映射 |
| `utils.ease.*` | 25+ 缓动函数（outBack, outElastic, outExpo, bounce 等） |
| `utils.bezier(x1, y1, x2, y2)` | 三次贝塞尔曲线缓动 |
| `utils.spring(frame, fps, config)` | 物理弹簧动画 |
| `utils.interpolate(input, inputRange, outputRange, options)` | 多段插值 |
| `utils.color.*` | 颜色工具（hexToRgb, rgba, lerp） |
| `utils.registerElement(type, props)` | 注册可编辑元素 |

## API 参考

### 生成
- `WebMotionAPI.generate(script, options)` — 本地生成（无需 API Key）
- `WebMotionAPI.generateWithAI(script, options)` — AI 生成（需配置 API Key）
- `WebMotionAPI.generateScene(description, options)` — 生成单个场景代码

### 场景管理
- `WebMotionAPI.getScenes()` — 获取所有场景概览
- `WebMotionAPI.getScene(index)` — 获取场景详情（含完整代码）
- `WebMotionAPI.selectScene(index)` — 选择活动场景
- `WebMotionAPI.addScene(data)` — 添加场景
- `WebMotionAPI.updateScene(index, data)` — 更新场景
- `WebMotionAPI.removeScene(index)` — 删除场景
- `WebMotionAPI.clearScenes()` — 清空所有场景
- `WebMotionAPI.moveScene(from, to)` — 移动场景顺序

### 代码编辑
- `WebMotionAPI.getCode(index)` — 获取场景代码
- `WebMotionAPI.setCode(index, code)` — 设置场景代码
- `WebMotionAPI.compile(code)` — 测试编译，返回 `{ valid, error }`

### 预览控制
- `WebMotionAPI.play()` / `pause()` / `stop()` — 播放控制
- `WebMotionAPI.seekTo(time)` — 跳转到时间（秒）
- `WebMotionAPI.getCurrentTime()` — 获取当前时间
- `WebMotionAPI.getDuration()` — 获取总时长
- `WebMotionAPI.renderFrame(time)` — 渲染指定帧
- `WebMotionAPI.getThumbnail()` — 获取当前帧截图（data URL）
- `WebMotionAPI.setResolution(w, h)` — 设置分辨率

### 导出
- `WebMotionAPI.exportPNG(options)` — 导出 PNG 序列帧 ZIP
- `WebMotionAPI.exportWebM(options)` — 导出 WebM 视频（带透明通道）
- `WebMotionAPI.exportGIF(options)` — 导出 GIF 动图
- `WebMotionAPI.download(blob, filename)` — 下载文件

### 项目管理
- `WebMotionAPI.exportProject()` — 导出项目 JSON
- `WebMotionAPI.loadProject(data)` — 加载项目 JSON
- `WebMotionAPI.saveProject(key)` — 保存到 localStorage
- `WebMotionAPI.loadSavedProject(key)` — 从 localStorage 加载

### 事件系统
- `WebMotionAPI.on(event, callback)` — 监听事件
- `WebMotionAPI.off(event, callback)` — 取消监听
- 事件类型：`generate`, `sceneChange`, `sceneAdd`, `sceneUpdate`, `sceneRemove`, `codeChange`, `play`, `pause`, `stop`

### 工具
- `WebMotionAPI.getUtils()` — 获取 Utils 工具对象
- `WebMotionAPI.getSystemPrompt()` — 获取系统提示词（教 AI 生成代码）
- `WebMotionAPI.getVersion()` — 获取版本信息
- `WebMotionAPI.help()` — 打印完整 API 文档

## 场景类型

WebMotion 的本地生成器会自动分析文案，生成以下类型的场景：

| 类型 | 触发条件 | 动画效果 |
|------|----------|----------|
| title | 第一句 | 大字标题 + 缩放入场 + 装饰线 |
| data | 包含数字 | 数字计数动画 + 圆环装饰 |
| statement | 普通陈述 | 文字卡片 + 滑入 + 关键词高亮 |
| closing | 最后一句（短） | 脉冲文字 + 光晕背景 |
| atmosphere | 每隔3个 | 3D 粒子球 + 文字叠加 |

## 配色方案

推荐配色：`#c9a96e`（金）、`#fb7185`（玫）、`#a78bfa`（紫）、`#22c55e`（绿）、`#f59e0b`（黄）

## 技术栈

- Canvas 2D API（2D 动画）
- Three.js r128（3D 动画）
- 纯前端实现，无需后端
- 支持透明通道导出（PNG/WebM/GIF）
