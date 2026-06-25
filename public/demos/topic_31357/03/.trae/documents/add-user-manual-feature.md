# 计划：新增"生成用户操作手册"功能

## 概述

在功能操作页面新增"生成用户操作手册"按钮，调用AI基于采集的页面交互数据生成面向终端用户的操作手册文档，自动保存到历史记录（type: 'manual'）。

## 当前状态分析

- 功能操作页面已有3个 control-section：页面监听、交互记录、PRD生成
- PRD生成流程：采集数据 → 构建AI提示词 → fetch调用AI → 解析响应 → 保存IndexedDB → 预览
- 历史记录通过 `type` 字段区分：`prd`（蓝标签）、`interaction`（黄标签）
- AI提示词构建函数：`buildSystemPrompt()`（PRD专用）、`buildUserPrompt(pageData)`（PRD专用）

## 修改内容

### 1. popup/popup.html — 新增操作手册区块

在"交互记录"和"PRD生成"之间插入新的 control-section：

```html
<!-- 操作手册生成 -->
<div class="control-section">
  <div class="section-header">
    <span class="section-icon">📖</span>
    <span class="section-title">操作手册</span>
  </div>
  <button class="btn btn-secondary btn-full" id="btnGenerateManual" disabled>
    生成用户操作手册
  </button>
  <p class="hint-text">基于页面交互数据，AI生成面向终端用户的操作手册</p>
</div>
```

### 2. popup/popup.js — 新增操作手册生成逻辑

**2.1 DOM引用**：添加 `btnGenerateManual: $('#btnGenerateManual')`

**2.2 事件绑定**：`dom.btnGenerateManual.addEventListener('click', generateManual)`

**2.3 按钮状态控制**：
- `updateGenerateButton()` 中同步控制 `btnGenerateManual` 的 disabled 状态（与PRD生成按钮相同条件：`isConfigured && isListening && interactionCount > 0`）
- `updateListenUI()` 中同步控制

**2.4 新增 `generateManual()` 函数**：
- 前置校验：同 generatePRD（isConfigured + interactionCount > 0）
- 采集数据：`sendTabMessage({ type: 'getCollectedData' })`
- 读取API配置：`chrome.storage.local.get`
- 构建提示词：`buildManualSystemPrompt()` + `buildManualUserPrompt(pageData)`
- 调用AI接口：同 generatePRD 的 fetch 逻辑
- 解析响应，构造记录：`type: 'manual'`，id前缀 `manual_`
- 保存到IndexedDB：`dbSavePRD(record)`
- 显示预览 + Toast提示

**2.5 新增 `buildManualSystemPrompt()` 函数**：
- 角色：资深技术文档工程师
- 输出模板结构：
  1. 手册概述（产品简介、适用对象、手册用途）
  2. 功能导航（功能模块一览表）
  3. 操作步骤详解（按功能模块分节，每个操作：前置条件→操作步骤→预期结果）
  4. 常见问题与解答（FAQ）
  5. 注意事项与提示

**2.6 新增 `buildManualUserPrompt(pageData)` 函数**：
- 复用 pageData 的 pageInfo、elements、interactions 数据
- 提示AI面向终端用户编写，语言通俗易懂，步骤清晰

### 3. popup/popup.js — 历史记录类型扩展

**renderHistoryList** 中新增 `manual` 类型判断：
- `type === 'manual'` → 标签文字"操作手册"，CSS类 `tag-manual`

### 4. popup/popup.css — 新增操作手册标签样式

```css
.tag-manual {
  background: #E0F2FE;
  color: #0369A1;
}
```

浅蓝底深蓝字，与PRD（紫蓝）和交互记录（黄色）区分。

## 不修改的文件

- content/content.js — 数据采集逻辑不变
- background/background.js — 不依赖
- lib/* — 不依赖
- manifest.json — 不需要新权限

## 验证步骤

1. 安装插件，配置API Key
2. 打开Web页面，启动监听，操作页面
3. 点击"生成用户操作手册"按钮，验证AI调用成功
4. 验证生成内容为操作手册格式（非PRD格式）
5. 切换到历史记录，验证显示"操作手册"标签（浅蓝色）
6. 点击历史记录预览、重新下载，验证功能正常
7. 验证未配置API Key时按钮置灰
