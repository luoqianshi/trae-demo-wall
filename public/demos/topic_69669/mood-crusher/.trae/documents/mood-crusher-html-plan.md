# Mood Crusher HTML 结构修改计划

## 目标文件
- `d:/test/trea/mood-crusher/index.html`

## 实施步骤（按顺序执行 5 处修改

### 修改 1：添加新手引导浮层 (onboard-overlay)
- **位置**：在 `<!-- Toast wrap -->` 注释之前插入
- **参考行**：第 1969 行前
- **插入内容**：

```html
<!-- 新手引导浮层 -->
<div class="onboard-overlay" id="onboard-overlay">
  <div class="onboard-content">
    <div class="onboard-emoji">☁️</div>
    <div class="onboard-title">欢迎来到坏情绪粉碎机</div>
    <div class="onboard-desc">把心事说给云朵听<br>它们会温柔接住你的每一句话 💫</div>
    <div class="onboard-steps">
      <div class="onboard-step">
        <span class="step-num">1</span>
        <span class="step-text">输入烦恼或点标签</span>
      </div>
      <div class="onboard-step">
        <span class="step-num">2</span>
        <span class="step-text">戳破云朵释放情绪</span>
      </div>
      <div class="onboard-step">
        <span class="step-num">3</span>
        <span class="step-text">看情绪变成小云朵</span>
      </div>
    </div>
    <button class="onboard-btn" id="btn-start">开始释放 ✨</button>
  </div>
</div>
```

### 修改 2：添加情绪快速选择器 (mood-selector)
- **位置**：在 `<!-- Quick tags -->` 注释之前插入
- **参考行**：第 1933 行前
- **插入内容**：

```html
<!-- 情绪快速选择器 -->
<div class="mood-selector" id="mood-selector">
  <button class="mood-item" data-mood="😊" data-text="今天还算顺利" title="开心">😊</button>
  <button class="mood-item" data-mood="😐" data-text="平平淡淡的一天" title="平静">😐</button>
  <button class="mood-item" data-mood="😮‍💨" data-text="好累啊想休息一下" title="疲惫">😮‍💨</button>
  <button class="mood-item" data-mood="😤" data-text="很生气想骂人" title="生气">😤</button>
  <button class="mood-item" data-mood="😰" data-text="好焦虑心跳加速" title="焦虑">😰</button>
  <button class="mood-item" data-mood="🥺" data-text="有点难过想被抱抱" title="难过">🥺</button>
  <button class="mood-item" data-mood="🌙" data-text="一个人的夜晚有点孤独" title="孤独">🌙</button>
  <button class="mood-item" data-mood="✨" data-text="灵感时刻想记录下来" title="灵感">✨</button>
</div>
```

### 修改 3：添加情绪能量条 (energy-bar)
- **位置**：在 `<!-- Game stage -->` 注释之前插入
- **参考行**：第 1945 行前
- **插入内容**：

```html
<!-- 情绪能量条 -->
<div class="energy-bar" id="energy-bar">
  <div class="energy-label">
    <span class="energy-icon" id="energy-icon">💫</span>
    <span class="energy-stage" id="energy-stage">释放中</span>
    <span class="energy-pct" id="energy-pct">0%</span>
  </div>
  <div class="energy-track">
    <div class="energy-fill" id="energy-fill"></div>
  </div>
</div>
```

### 修改 4：修改「生成今日云朵」按钮为「随便发泄」
- **位置**：替换第 1942 行
- **原始内容**：
```html
<button class="quick-tag generate-clouds" id="btn-generate-clouds">☁️ 生成今日云朵</button>
```
- **替换后**：
```html
<button class="quick-tag generate-clouds" id="btn-generate-clouds">🎲 随便发泄</button>
```

### 修改 5：添加日记小回信浮层 (echo-card)
- **位置**：在 `<!-- Diary detail modal -->` 的闭合 `</div>` 之后、`<!-- Report modal (今日发泄) -->` 注释之前插入
- **参考行**：第 2038-2039 行之间
- **插入内容**：

```html
<!-- 日记小回信浮层 -->
<div class="echo-card" id="echo-card">
  <div class="echo-header">
    <span class="echo-icon">💌</span>
    <span class="echo-title">给今天的你</span>
    <button class="echo-close" id="echo-close">✕</button>
  </div>
  <div class="echo-content" id="echo-content">—</div>
  <div class="echo-footer">
    <span class="echo-hint">有人在认真听你说 🤗</span>
  </div>
</div>
```

## 格式约束

- 所有修改仅涉及 HTML 结构层面（不添加任何 CSS 或 JavaScript）
- 保持原有的 2 空格缩进风格不变
- 确保所有标签正确闭合
- 确保 ID 和 class 名称与用户提供的一致
- 不破坏原有的其他代码结构
