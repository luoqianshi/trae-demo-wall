# HTML 可视化编辑器 — 实现计划

> **目标**：实现一个零安装的网页版 HTML 可视化编辑器，让非技术用户像改 PPT 一样修改 AI 生成的 HTML。

**架构**：纯原生 HTML/CSS/JS，模块化 + 事件总线，iframe sandbox 隔离 + 同域穿透，DOM Annotation + 事务栈。

**技术栈**：HTML5 / CSS3 / 原生 JS / iframe sandbox / CSS 变量

---

## 文件结构

```
d:\html-demo\
├── index.html              # 主入口，包含所有 UI 结构
├── css\
│   └── editor.css          # 编辑器 UI 样式（基于 UI 原型）
├── js\
│   ├── event-bus.js        # 事件总线，模块间通信
│   ├── iframe-manager.js   # iframe 渲染 + sandbox + 同域穿透
│   ├── dom-annotator.js    # DOM 遍历 + data-eid 标注
│   ├── selection.js        # 选中管理（悬停高亮 + 点击选中 + 面包屑 + 智能寻祖）
│   ├── inline-editor.js    # contenteditable 内联文字编辑
│   ├── property-panel.js   # 右侧属性面板（基础样式 + Layout 分组）
│   ├── undo-redo.js        # 事务栈（操作指令模式）
│   ├── importer.js         # 导入（粘贴代码 + base 标签注入 + 文件上传）
│   ├── exporter.js         # 导出（下载 + 复制 + 清理 + 元数据）
│   ├── layout-detector.js  # 布局安全检测（flex/grid 警告）
│   └── main.js             # 启动入口，初始化所有模块
└── ui-prototype.html       # UI 原型参考（已完成）
```

---

## Task 1: 项目骨架 + 导入页面 + iframe 渲染（P0-1, P0-6）

**Files:**
- Create: `index.html`
- Create: `css/editor.css`
- Create: `js/event-bus.js`
- Create: `js/iframe-manager.js`
- Create: `js/main.js`

- [ ] 1.1 创建 `index.html`，包含导入页 + 编辑器三栏布局骨架
- [ ] 1.2 创建 `css/editor.css`，迁移 UI 原型的完整设计系统
- [ ] 1.3 创建 `js/event-bus.js`，实现 `on/emit/off` 事件通信
- [ ] 1.4 创建 `js/iframe-manager.js`，实现 iframe sandbox 渲染 + 同域穿透
- [ ] 1.5 创建 `js/main.js`，初始化导入页交互 + 加载示例
- [ ] 1.6 验证：粘贴 HTML → iframe 正确渲染

## Task 2: DOM 标注器（P0-1）

**Files:**
- Create: `js/dom-annotator.js`

- [ ] 2.1 遍历 iframe 内 DOM，给可编辑元素打 `data-eid`
- [ ] 2.2 跳过 script/style/meta/link 等非可视元素
- [ ] 2.3 规则引擎：根据标签名和 class 识别元素类型（data-type）
- [ ] 2.4 标注完成后通过事件总线通知 `annotated`
- [ ] 2.5 验证：打开控制台能看到所有元素的 data-eid

## Task 3: 选中机制（P0-2）

**Files:**
- Create: `js/selection.js`

- [ ] 3.1 覆盖层鼠标事件：mousemove → elementFromPoint 命中检测 → 绘制悬停框
- [ ] 3.2 点击选中 → 绘制选中框 + 8 个手柄 + 浮层工具条
- [ ] 3.3 面包屑导航：显示父级链条，点击切换选中层级
- [ ] 3.4 智能向上寻祖：纯文本/内联元素 → 最近的块级祖先
- [ ] 3.5 Esc / 点击空白 → 取消选中
- [ ] 3.6 mousemove 节流至 50ms
- [ ] 3.7 验证：鼠标悬停高亮、点击选中、面包屑切换

## Task 4: 内联文字编辑（P0-3）

**Files:**
- Modify: `js/selection.js`（双击触发）
- Create: `js/inline-editor.js`

- [ ] 4.1 双击文本元素 → `contenteditable="plaintext-only"`
- [ ] 4.2 粘贴消毒：preventDefault + 只插入 text/plain
- [ ] 4.3 回车拦截：阻止默认行为，直接失焦提交
- [ ] 4.4 失焦/Esc 提交变更，移除 contenteditable
- [ ] 4.5 中文输入法 compositionstart/compositionend 兼容
- [ ] 4.6 验证：双击改字、粘贴纯文本、回车不换行

## Task 5: 事务栈 + 撤销/重做（P0-5）

**Files:**
- Create: `js/undo-redo.js`

- [ ] 5.1 Transaction 类：`{ forward, backward, type, timestamp }`
- [ ] 5.2 操作栈：push/undo/redo，无限级
- [ ] 5.3 debounce 合并连续字符输入（500ms）
- [ ] 5.4 Ctrl+Z / Ctrl+Shift+Z 快捷键
- [ ] 5.5 大栈内存管理：超过 1000 条归档快照
- [ ] 5.6 验证：编辑后撤销/重做正常回退

## Task 6: 属性面板（P0-4）

**Files:**
- Create: `js/property-panel.js`

- [ ] 6.1 选中元素后，根据 data-type 显示对应属性组
- [ ] 6.2 基础样式：文字内容、颜色（色板+取色器）、字号（滑块）、字重、行高、对齐
- [ ] 6.3 间距：内边距、外边距、圆角
- [ ] 6.4 边框与阴影
- [ ] 6.5 属性变更 → 修改 DOM 内联样式 → 提交事务
- [ ] 6.6 验证：改颜色/字号/间距 → 页面实时变化 → 撤销正常

## Task 7: 导出（P0-7）

**Files:**
- Create: `js/exporter.js`

- [ ] 7.1 清理 data-eid/data-type 等编辑属性
- [ ] 7.2 下载 .html 文件（含版本元数据注释）
- [ ] 7.3 复制 HTML 代码到剪贴板
- [ ] 7.4 验证：导出的文件在浏览器中打开效果一致

## Task 8: 布局安全检测（P0-8）

**Files:**
- Create: `js/layout-detector.js`

- [ ] 8.1 检测选中元素的父容器 display 类型
- [ ] 8.2 flex/grid 容器内修改 position/transform 时显示警告
- [ ] 8.3 验证：在 flex 容器内改 position 时出现警告提示

## Task 9: 添加/删除元素 + 左侧素材面板（P1-11, P1-12）

**Files:**
- Modify: `js/selection.js`（删除操作）
- Modify: `index.html`（素材面板交互）

- [ ] 9.1 拖拽素材面板项到画布
- [ ] 9.2 计算插入位置，显示插入指示线
- [ ] 9.3 创建新 DOM 节点，打 data-eid
- [ ] 9.4 Delete 键删除选中元素
- [ ] 9.5 浮层工具条：复制、删除按钮功能
- [ ] 9.6 验证：拖入文字/图片/按钮、删除元素

## Task 10: 流式拖拽改位置（P1-9）

**Files:**
- Modify: `js/selection.js`

- [ ] 10.1 拖拽选中元素 → 计算兄弟节点位置
- [ ] 10.2 显示插入指示线
- [ ] 10.3 释放 → insertBefore DOM 重排
- [ ] 10.4 提交事务到操作栈
- [ ] 10.5 验证：拖拽元素到不同位置，布局不崩溃

## Task 11: 拖拽改大小（P1-10）

**Files:**
- Modify: `js/selection.js`

- [ ] 11.1 拖拽手柄 → 修改 width/height
- [ ] 11.2 智能单位：优先 % / vw
- [ ] 11.3 最小尺寸约束 20px
- [ ] 11.4 验证：拖拽缩放元素

## Task 12: 预览模式 + 响应式断点（P1-13）

**Files:**
- Modify: `index.html` / `js/main.js`

- [ ] 12.1 预览按钮 → 隐藏编辑 UI + 临时加 allow-scripts
- [ ] 12.2 断点切换：1280/768/375 → iframe 宽度变化
- [ ] 12.3 验证：预览态交互正常、断点切换生效

## Task 13: 属性面板 Layout 分组（P1-14）

**Files:**
- Modify: `js/property-panel.js`

- [ ] 13.1 Display 切换（block/flex/grid）
- [ ] 13.2 Flex 方向 + 九宫格对齐
- [ ] 13.3 Gap 滑块
- [ ] 13.4 Flex Wrap 开关
- [ ] 13.5 验证：调整 Flex 布局 → 页面实时变化
