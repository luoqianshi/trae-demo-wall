# 组队讨论社区替换计划

## 任务目标

将「提交材料 Checklist」模块替换为「赛友讨论与组队广场」模块，形成完整的产品闭环：用户画像 → 推荐比赛 → 用户选择比赛 → 角色建议 → 7 天计划 → 组队讨论社区。

## 修改清单

### 1. Tabs 修改
- 将第 5 个 Tab 从「报名材料」改为「组队社区」
- 将 data-target 从 `materials` 改为 `community`
- 同步更新 tabTargets 数组

### 2. Section ID 修改
- 将 `id="materials"` 改为 `id="community"`
- 同步更新 JS 中的所有跳转逻辑

### 3. 报名材料区 → 组队社区
- 修改 section-tag：✎ Step 5 · 组队社区
- 修改 section-title：赛友讨论与组队广场
- 修改 section-desc：根据当前选择的比赛和角色建议，查看可能需要的队友类型，也可以发布组队需求或参与讨论。

### 4. 社区模块 HTML 结构

#### 4.1 当前组队缺口卡片
```html
<div class="team-gap-card">
  <div class="team-gap-header">📌 当前组队缺口</div>
  <div class="team-gap-empty" id="teamGapEmpty">请先在推荐结果中选择一个比赛...</div>
  <div class="team-gap-content" id="teamGapContent" style="display:none;">
    <div class="team-gap-comp">比赛：<strong id="teamGapCompName">-</strong></div>
    <div class="team-gap-roles">推荐角色：<strong id="teamGapRoles">-</strong></div>
    <div class="team-gap-missing">队伍缺口：</div>
    <ul class="team-gap-list" id="teamGapList"></ul>
  </div>
</div>
```

#### 4.2 社区帖子列表
```html
<div class="community-board">
  <div class="community-board-header">📋 赛友广场 · 模拟帖子</div>
  <div class="post-list" id="postList"></div>
</div>
```

#### 4.3 发布组队需求模拟区
```html
<div class="post-form-card">
  <button class="btn btn-primary" id="publishPostBtn">发布组队需求</button>
  <div class="post-form" id="postForm" style="display:none;">
    <!-- 模拟表单 -->
  </div>
</div>
```

### 5. CSS 样式新增

需要新增的样式类：
- `.team-gap-card` — 组队缺口卡片
- `.community-board` — 赛友广场公告板
- `.post-card` — 帖子卡片
- `.post-form-card` — 发布表单卡片

### 6. JavaScript 功能

#### 6.1 帖子模拟数据
```javascript
const mockPosts = [
  { type: "找队友", title: "AI 应用开发大赛缺一名前端", roles: ["前端开发"], gaps: ["前端开发"], comp: "AI 应用开发大赛", desc: "..." },
  // ... 4-6 条帖子
];
```

#### 6.2 组队缺口动态生成
```javascript
function getTeamGapsByCategory(category) {
  const gapsMap = {
    dev: ["前端开发", "后端开发", "UI 设计", "Demo 交付负责人"],
    data: ["建模分析", "程序实现", "论文写作", "数据可视化"],
    biz: ["商业分析", "路演答辩", "用户调研", "产品策划"],
    design: ["UI 设计", "交互设计", "视觉表达", "文案策划"],
    hardware: ["硬件原型", "嵌入式开发", "设备调试", "演示视频制作"],
    default: ["产品策划", "技术实现", "视觉设计", "答辩展示"]
  };
  // 返回对应缺口的数组
}
```

#### 6.3 社区模块更新函数
```javascript
function updateCommunitySection(comp) {
  // 更新组队缺口卡片
  // 更新社区帖子列表
}
```

#### 6.4 发布组队需求模拟
```javascript
// 点击发布按钮后显示本地提示
```

### 7. 复制参赛计划修改

将复制内容中的【报名材料清单】改为：
```
【组队缺口建议】
• ${teamGapsText}

【官网材料提醒】
具体报名材料和提交格式请以比赛官网为准，赛途 AI 仅提供参赛规划、组队建议和准备路径参考。
```

### 8. Demo 边界区更新

在边界说明中增加第 6 条：
> 具体报名材料和提交格式请以比赛官网为准，赛途 AI 仅提供参赛规划、组队建议和准备路径参考。

## 修改文件

- `saitu-ai.html` — 修改 Tabs、Section ID、HTML 内容、CSS 样式、JavaScript 逻辑
- `TRAE_DEV_LOG.md` — 追加 Session 5 记录

## 实施步骤

1. 修改 Tabs HTML + JS
2. 修改 section id
3. 替换报名材料区 HTML 为社区模块
4. 添加社区模块 CSS 样式
5. 添加社区模块 JS 逻辑（帖子数据、缺口生成、社区更新函数）
6. 修改复制参赛计划函数
7. 在 Demo 边界区添加官网提醒
8. 验证功能和控制台错误
9. 更新 TRAE_DEV_LOG.md
