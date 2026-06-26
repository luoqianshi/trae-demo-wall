<!--
LEGACY ONLY:
此文件是 v2.3.3.2 之前的 HTML 混合 Markdown 旧模板。
禁止用于新生成 {SKU}.md。
新生成 Clean MD 必须使用 references/clean_md_template.md。
HTML 视觉样式请进入 html_render_contract / render_components / html_themes。

⚠️ 模板使用说明（本注释不要复制到最终手册中）：
1. 本模板定义了手册的完整样式规范，生成手册时必须严格遵循此样式。
2. 以下用 {占位符} 标注需要动态替换的内容。
3. 生成执行指示：最终手册生成时必须按章节分批展开模板，不要一次性输出完整模板。
4. 最终手册不得包含本注释块、不得包含"统一非图片表格样式"章节标题。

统一非图片表格样式规范（仅供 AI 参考，不要输出到手册中）：
- 表格 <table> 必须使用：style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin: 16px 0;"
- 表头 <th> 必须使用：style="padding: 14px 16px; text-align: left; color: white; font-weight: 600;"
- 单元格 <td> 必须使用：style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0;"
-->

<!-- Hero Banner -->
<div align="center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 16px; margin-bottom: 30px;">
  <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
  <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white;">商品数字身份信息</h1>
  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Product Digital Identity</p>
</div>

## 基础信息

<table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin: 16px 0;">
  <thead>
    <tr style="background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);">
      <th style="padding: 14px 16px; text-align: left; color: white; font-weight: 600; width: 20%;">属性</th>
      <th style="padding: 14px 16px; text-align: left; color: white; font-weight: 600; width: 80%;">内容</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background: white;">
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0; font-weight: 600;">SKU</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0;">{SKU}</td>
    </tr>
    <tr style="background: #FAFAFA;">
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0; font-weight: 600;">品牌</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0;">{品牌}</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0; font-weight: 600;">产品名称</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0;">{产品名称}</td>
    </tr>
    <tr style="background: #FAFAFA;">
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0; font-weight: 600;">品类定位</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0;">{品类定位}</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0; font-weight: 600;">核心风格</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0;">{核心风格}</td>
    </tr>
    <tr style="background: #FAFAFA;">
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0; font-weight: 600;">设计师</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0;">{设计师}</td>
    </tr>
    <tr style="background: white;">
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0; font-weight: 600;">摄影师</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0;">{摄影师}</td>
    </tr>
    <tr style="background: #FAFAFA;">
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0; font-weight: 600;">搭配师</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #F0F0F0;">{搭配师}</td>
    </tr>
  </tbody>
</table>

---

## 一、核心卖点

> 💡 **提示**：本章节内容由 AI 基于产品素材推断生成，仅供参考，请结合实际情况调整。<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: help;" title="基于产品品类和目标用户画像推断">🤖 AI 推断</span>

### 1.1 AI提炼核心卖点

<div style="background: #F8F9FA; border-left: 4px solid #007AFF; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #007AFF;">{卖点1图标} {卖点1标题}</strong>
<p style="margin: 8px 0; color: #1D1D1F;">{卖点1详细描述}</p>
<blockquote style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #007AFF; color: #666;">
关键词：{关键词1} / {关键词2} / {关键词3} / {关键词4}
</blockquote>
</div>

<div style="background: #F8F9FA; border-left: 4px solid #34C759; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #34C759;">{卖点2图标} {卖点2标题}</strong>
<p style="margin: 8px 0; color: #1D1D1F;">{卖点2详细描述}</p>
<blockquote style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #34C759; color: #666;">
关键词：{关键词1} / {关键词2} / {关键词3} / {关键词4}
</blockquote>
</div>

<div style="background: #F8F9FA; border-left: 4px solid #FF8C00; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #FF8C00;">{卖点3图标} {卖点3标题}</strong>
<p style="margin: 8px 0; color: #1D1D1F;">{卖点3详细描述}</p>
<blockquote style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #FF8C00; color: #666;">
关键词：{关键词1} / {关键词2} / {关键词3} / {关键词4}
</blockquote>
</div>

<div style="background: #F8F9FA; border-left: 4px solid #9B59B6; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #9B59B6;">{卖点4图标} {卖点4标题}</strong>
<p style="margin: 8px 0; color: #1D1D1F;">{卖点4详细描述}</p>
<blockquote style="margin: 8px 0; padding-left: 12px; border-left: 3px solid #9B59B6; color: #666;">
关键词：{关键词1} / {关键词2} / {关键词3} / {关键词4}
</blockquote>
</div>

### 1.2 设计师卖点原文

> 📝 **设计师原话**：以下内容来自设计师提供的卖点文档，未经AI修改，保留原文表述。

{设计师卖点原文内容。AI 必须用 Markdown 引用块（每行以 `>` 开头）包裹全部设计师原文。设计师文档中每个大标题转为 **加粗**，每段正文保持原文，段落之间用 `>` 空行分隔。禁止使用 div 标签包裹。禁止把所有文字挤成一坨纯文本。格式示例：}

> **一、核心卖点**
>
> 这款产品主打xxx...
>
> **二、面料&质感**
>
> 选用xxx面料...

---

## 二、全域人群画像

> 💡 **提示**：本章节内容由 AI 基于产品素材推断生成，仅供参考。<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: help;" title="基于产品品类和目标用户画像推断">🤖 AI 推断</span>

### 2.1 基础属性

{基础属性表格：维度/描述双列，含性别、年龄层、职业、收入、地域}

### 2.2 行为DNA

{行为DNA表格：标签列用彩色span，特征描述列。标签颜色：生活方式#007AFF 穿搭偏好#34C759 决策因素#FF8C00 痛点关注#9B59B6}

### 2.3 决策旅程

{决策旅程表格：阶段/行为/触点三列，含认知→兴趣→决策→购买→分享}

---

## 三、全域场景分析

> 💡 **提示**：本章节内容由 AI 基于产品素材推断生成，仅供参考。<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: help;" title="基于产品品类和目标用户画像推断">🤖 AI 推断</span>

### 3.1 场景矩阵

{场景矩阵表格：场景类别/具体场景/痛点需求三列}

### 3.2 平台内容策略

{平台策略表格：平台/内容侧重点/视觉风格三列，含小红书、抖音、得物、淘宝}

---

## 四、全域情绪转化矩阵

> 💡 **提示**：本章节内容由 AI 基于产品素材推断生成，仅供参考。<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: help;" title="基于产品品类和目标用户画像推断">🤖 AI 推断</span>

### 4.1 买家心理五维图谱

{必须使用工作流 SOP 中的 `4.1 表格模板`。包含 痛点/痒点/爽点/槽点/爆点，对应独白、解决方案、工艺支撑}

### 4.2 情绪→内容转化钩子矩阵

{必须使用工作流 SOP 中的 `4.2 表格模板`。包含 情绪/小红书/抖音/直播间/评论区引导}

### 4.3 全域内容脚本速查卡

**小红书图文脚本** (单篇结构):

1. **吸睛封面图** (1张): {封面图建议}
2. **场景代入语** (2-3句): 引出产品如何解决问题
3. **卖点罗列** (3-5点): 使用表情符号+短句格式
4. **搭配建议** (2-3套): 场景化穿搭方案
5. **购买引导** (1句): 尺码建议+购买链接

**抖音短视频脚本** (总时长约38秒):

| 时间段 | 内容 | 画面建议 |
|--------|------|----------|
| 0-3s | Hook钩子 | 视觉冲击/悬念开场 |
| 3-8s | 痛点切入 | 对比展示问题 |
| 8-16s | 面料展示 | 特写+拉伸+触感描述 |
| 16-26s | 版型效果 | 多角度上身展示 |
| 26-31s | 多色展示 | 快速切换颜色选项 |
| 31-36s | 场景穿搭 | 2-3套搭配快切 |
| 36-38s | CTA引导 | 引导点赞/关注/购买 |

**直播间话术节奏** (5分钟循环):

| 时间 | 环节 | 核心动作 | 情绪调性 |
|:---|:---|:---|:---|
| 0-30s | 抓眼球 | 拿起产品展示质感，拉伸展示弹性 | 惊艳+好奇 |
| 30s-2min | 切痛点 | 描述用户痛点，对比普通产品 | 共鸣+认同 |
| 2-4min | 秀卖点 | 多色上身+搭配+面料讲解 | 心动+渴望 |
| 4-5min | 逼单 | 限时优惠+库存紧张+尺码指导 | 紧迫感+行动力 |

---

## 五、产品展示与搭配库

> ⚠️ **致命强制要求：第5章图片 HTML 必须由 `image-snippet` action 生成。AI 不得手写 5.1/5.2/5.3/5.4 图片 HTML。禁止 `<table>/<tr>/<td>`。禁止裸 `<img>`。所有图片必须使用 `pdh-image-box` + `object-fit: contain`。**

### 5.1 颜色展示

由 image-snippet 生成，使用 `pdh-section-51` + `pdh-color-grid` + `pdh-color-card`。图片框 280px。列数自适应（1/2/3/4）。每张颜色图必须有 caption。

### 5.2 棚拍展示

由 image-snippet 生成，使用 `pdh-section-52` + `pdh-studio-grid` + `pdh-studio-card`。图片框默认使用 **3:4 竖版容器**（`aspect-ratio: 3/4`，高度 360px），仅在明确横向图时使用 4:3 容器。列数自适应（1/2/3）。这是展示容器比例，不是裁切原图，继续使用 `object-fit: contain` 不裁切，禁止 `object-fit: cover`。

### 5.3 外景展示

由 image-snippet 生成，使用 `pdh-section-53` + `pdh-scene-block` + `pdh-scene-grid` + `pdh-scene-card`。5.3 按场景分组展示。每种风格 / 每个场景最多 6 张，超过部分进入 excluded_candidates。5.3 不设置全局总数上限。默认使用 3:4 竖版容器（`aspect-ratio: 3/4`，高度 340px），仅在明确横向大场景图时使用 4:3 容器。列数自适应（1/2/3）。继续使用 `object-fit: contain`，禁止 `object-fit: cover`。

### 5.4 搭配方案展示

由 image-snippet 生成，使用 `pdh-section-54` + `pdh-outfit-block`。每套搭配按固定顺序输出：
1. `pdh-outfit-note`（搭配说明卡片，配饰亮点自动去重）
2. `pdh-outfit-effect`（效果图，根据 `visual_type` 自适应高度）
3. `pdh-outfit-material-title` + `pdh-material-grid`（搭配物料，图片框 180px，列数自适应 1/2/3/4）

**一物一图规则**：同一套搭配中，同一个搭配物品只允许展示 1 张图。同一物品的其他角度图必须进入 `excluded_candidates`（`exclude_reason: duplicate_item_other_angle`）。判重以 `display_name` 为主、`item_type` 为辅。

### 5.5 设计灵感参考（可选）

由 image-snippet 生成。仅当商品目录中确实存在设计灵感参考图时才展示，没有则不生成此章节。

---

## 六、营销方向与传播建议

> 💡 **提示**：本章节内容由 AI 基于产品素材推断生成，仅供参考。<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: help;" title="基于产品品类和目标用户画像推断">🤖 AI 推断</span>
> 🎯 **角色切换**：进入本章后，AI 必须以“互联网创意营销大师”的身份思考，从平台分发机制、内容钩子、传播路径、互动设计和转化闭环出发生成策略；禁止简单复读商品卖点。

### 6.1 小红书策略

<div style="background: #F8F9FA; border-left: 4px solid #FF2442; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #FF2442;">📕 内容方向</strong>
<ul style="margin: 8px 0; color: #1D1D1F;">
<li><strong>{种草切口}</strong>：{以小红书生活方式种草逻辑表达，绑定一个真实穿着处境和用户情绪}</li>
<li><strong>{视觉叙事}</strong>：{围绕本品已确认静物图/平铺搭配图设计封面、首图和九宫格顺序}</li>
<li><strong>{互动转化}</strong>：{设计评论区关键词、尺码/颜色咨询承接和收藏理由}</li>
</ul>
</div>

### 6.2 抖音策略

<div style="background: #F8F9FA; border-left: 4px solid #000000; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #000000;">🎵 内容方向</strong>
<ul style="margin: 8px 0; color: #1D1D1F;">
<li><strong>{黄金3秒Hook}</strong>：{用冲突/反差/痛点开场，说明镜头动作与画面证据}</li>
<li><strong>{转化节奏}</strong>：{设计短视频分镜或直播切片节奏，绑定本品静物细节/平铺搭配图}</li>
</ul>
</div>

### 6.3 天猫策略

<div style="background: #F8F9FA; border-left: 4px solid #FF5000; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #FF5000;">🛒 内容方向</strong>
<ul style="margin: 8px 0; color: #1D1D1F;">
<li><strong>{理性决策证据}</strong>：{围绕材质、版型、颜色和可见证据组织详情页表达}</li>
<li><strong>{主图承接}</strong>：{说明如何用 5.1 静物图与 5.4 平铺搭配图承接点击后的购买判断}</li>
</ul>
</div>

### 6.4 微信视频号策略

<div style="background: #F8F9FA; border-left: 4px solid #07C160; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #07C160;">📱 内容方向</strong>
<ul style="margin: 8px 0; color: #1D1D1F;">
<li><strong>{私域信任表达}</strong>：{用主理人/买手口吻解释适合人群和真实穿搭场景}</li>
<li><strong>{社群转化动作}</strong>：{设计朋友圈配图、社群话术和一对一咨询承接}</li>
</ul>
</div>

---

## 七、主播通用穿搭与话术模版

> 💡 **提示**：本章节内容由 AI 基于产品素材推断生成，仅供参考。<span style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: help;" title="基于产品品类和目标用户画像推断">🤖 AI 推断</span>
> 🎙️ **角色切换**：进入本章后，AI 必须以“资深直播间转化教练”的身份思考，从主播动作、用户异议、节奏推进和逼单闭环设计话术；禁止空泛卖点罗列。

### 7.1 主播视觉 setup

{双列表格：项目/建议，含主播穿搭、场景布置、灯光、道具}

### 7.2 开场钩子（0-30s）

<div style="background: #F8F9FA; border-left: 4px solid #FF3B30; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #FF3B30;">🔥 开场话术</strong>
<p style="margin: 8px 0; color: #1D1D1F; font-size: 14px; line-height: 1.8;">
"{开场话术内容}"
</p>
</div>

### 7.3 痛点共鸣（30s-2min）

<div style="background: #F8F9FA; border-left: 4px solid #FF8C00; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #FF8C00;">💬 痛点话术</strong>
<p style="margin: 8px 0; color: #1D1D1F; font-size: 14px; line-height: 1.8;">
"{痛点话术内容}"
</p>
</div>

### 7.4 卖点展示（2-4min）

<div style="background: #F8F9FA; border-left: 4px solid #34C759; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #34C759;">✨ 卖点话术</strong>
<p style="margin: 8px 0; color: #1D1D1F; font-size: 14px; line-height: 1.8;">
"{卖点话术内容}"
</p>
</div>

### 7.5 逼单成交（4-5min）

<div style="background: #F8F9FA; border-left: 4px solid #9B59B6; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #9B59B6;">⏰ 逼单话术</strong>
<p style="margin: 8px 0; color: #1D1D1F; font-size: 14px; line-height: 1.8;">
"{逼单话术内容}"
</p>
</div>

---

## 八、品牌与产品资质

### 8.1 面料工艺与资质展示

{展示面料相关图片（面料样卡、纹理特写、编织细节、弹力展示、成分标签、PDF缩略图等）。使用 grid 3列宫格 + 卡片容器，每张图必须有说明文字。如无面料图片则显示"⚠️ 面料图待补充"。}

### 8.2 品牌资质与检测报告

{有数据时用标准表格展示（品牌授权、质检报告、面料认证等）。表格设计规范：
- 表头必须使用渐变紫蓝背景：linear-gradient(135deg, #4A00E0 0%, #8E2DE2 100%)
- 奇偶行交替背景色（白色与 #FAFAFA），单元格内容填充呼吸感 padding: 12px 16px; border-bottom: 1px solid #F0F0F0;
- 合规结论一列必须使用带轻微底色的高亮徽章（Badge）进行居中展示，例如：
  - 绿色徽章：<span style="background: #E8F5E9; color: #2E7D32; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block;">✓ 100%符合标示</span>
  - 蓝色徽章：<span style="background: #EBF5FF; color: #007AFF; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block;">✓ 安全亲肤类</span>
  - 紫色徽章：<span style="background: #F3E5F5; color: #8E24AA; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block;">✓ 温和无刺激</span>
无数据时用下方警告卡片。}

<div style="background: #FFF3E0; border-left: 4px solid #E65100; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #E65100;">⚠️ 待补充</strong>
<p style="margin: 8px 0; color: #1D1D1F;">[待运营补充品牌资质、质检报告、面料认证等信息]</p>
</div>

---

## 九、尺码参考

{有Excel数据时必须完整生成尺码表，无数据时用下方警告卡片}

<div style="background: #FFF3E0; border-left: 4px solid #E65100; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0;">
<strong style="color: #E65100;">⚠️ 待补充</strong>
<p style="margin: 8px 0; color: #1D1D1F;">[待设计师补充详细尺码表]</p>
</div>

---

## 十、相关素材文件索引

### 10.1 图片素材

{四列HTML表格：编号P001/文件类型/文件名/相对路径}

### 10.2 文本/表格/文档素材

{四列HTML表格：编号T001/文件类型/文件名/相对路径}

### 10.3 视频素材

{四列HTML表格：编号V001/文件类型/文件名/相对路径}

---

> 📅 **文档生成时间**：{YYYY-MM-DD}
>
> 🔄 **版本**：v1.0
>
> ⚠️ **声明**：本手册中标注"AI推断"的内容由人工智能基于产品素材分析生成，仅供参考。核心卖点原文部分保留设计师原始表述，未经修改。具体产品信息以实际为准。
