---
name: "agri-page-maker"
description: "为水果/蔬菜/农产品生成移动端产品 page HTML，内置 4 套可拆分模块的模板（T1 产地故事型 / T2 产品解析型 / T3 场景使用型 / T4 杂志大片型），AI 生成真实风格图片、文字可在 HTML 中直接编辑、支持按模块导出图片。触发：用户说「帮我做xx的page」/「做xx的page页面」/「生成xx的产品page」等。注意：本 skill 以「page」为触发词，与「详情页」skill 区分。"
---

# 农产品 Page 生成器（agri-page-maker）

为水果 / 蔬菜 / 农产品 / 食品生成 **移动端优先、可拆分模块、文字可编辑、附 AI 配图** 的产品详情页 HTML。

## 触发条件

满足以下任一条件时**必须立即调用本 skill**：

- 用户说「帮我做 **X** 的 page / page页面 / 产品page」
- 「生成 / 出 / 做一份 **X** 的农产品 page」
- 「用 T1 / T2 / T3 / T4 帮我做 **X** 的 page」（模板被显式指定时跳过自动选择）
- 「随机/你来选 模板，做 **X** 的 page」

> **注意**：本 skill 以「**page**」为核心触发词，与「详情页」skill 区分。如果用户说的是「详情页」而非「page」，不应触发本 skill。

提取的产品名 = `X`（如：新疆小白杏、章丘大葱、丹东草莓、黄瓜、蜜桃、烟台苹果等）。

## 4 套模板

| 模板 | 名称 | 适用 | 详见 |
|---|---|---|---|
| T1 | 产地故事型 | 地理标志 / 高端 / 限量 | [references/t1-story.md](references/t1-story.md) |
| T2 | 产品解析型 | 标准化生鲜 / 蔬菜 | [references/t2-spec.md](references/t2-spec.md) |
| T3 | 场景使用型 | 时令 / 网红水果 | [references/t3-lifestyle.md](references/t3-lifestyle.md) |
| T4 | 杂志大片型 | 品牌化 / 文人感产品 | [references/t4-magazine.md](references/t4-magazine.md) |

**自动选择规则**（用户未指定时）：
- 出现「地理标志 / 产区 / 头茬 / 限量 / 高端 / 礼盒」→ T1
- 出现「蔬菜 / 生鲜 / 挑选 / 烹饪 / 做法」→ T2
- 出现「时令 / 网红 / 应季 / 蜜桃 / 草莓 / 樱桃」→ T3
- 出现「品牌 / 礼盒 / 文创 / 高端定制」→ T4
- 都不匹配 → 在 4 套中**随机**选一套并告知用户

## 工作流（必须严格按顺序执行）

### Step 1：信息收集

用 `AskUserQuestion` 一次性收集以下信息（如用户已在请求中给出部分则跳过对应项）：

1. **产品名**（必填）
2. **目标用户**（自吃 / 送礼 / 电商主图 / 朋友圈种草）
3. **模板选择**（T1 / T2 / T3 / T4 / 随机 / 你帮我选）
4. **是否提供图片**（用户上传 / 全部 AI 生成 / 部分 AI 部分上传）

如用户已说"用 T3"或"做小白杏详情页"等含完整意图，可直接进入 Step 2。

### Step 2：作物 / 产品调研

**必须**使用 `WebSearch` + `WebFetch` 调研真实信息（**禁止编造产地、气候、品种、营养数据**）：

调研维度清单：
- 产地：具体到省/市/县/镇 + 海拔 + 经纬度（可选）
- 气候：年均温 / 年降水 / 日照时数 / 昼夜温差
- 品种：主栽品种 / 上市时间 / 采摘标准
- 口感：糖度 / 酸度 / 风味关键词
- 营养：突出 2~3 个关键营养素
- 挑选：3~4 条实操挑选法
- 储存：温度 / 湿度 / 食用窗口
- 吃法：1~3 道菜谱（食材 + 步骤）
- 文化：典故 / 节气 / 产地故事（用于 T1 / T4 散文）

### Step 3：生成 AI 图片（使用 GenerateImage）

**调用 `GenerateImage` 工具生成真实摄影风 AI 图片**

为每个区块生成差异化真实图片：
- 每张图独立 prompt：构图 + 光线 + 色调 + 产地场景特征
- 输出尺寸对齐模板要求（4:3 / 16:9 / 1:1 / 21:9）
- 真实摄影风格：自然光 / 侧光 / 窗边光 + 浅景深
- 每个区块对应独立生成调用
- 生成完成后保存到 `assets/` 目录

**核心规则**：
- **风格**：realistic photography（真实摄影风），禁止插画、卡通、3D 渲染
- **光线**：自然光 / 侧光 / 窗边光为主
- **背景**：浅色 / 木质 / 暗调（按模板风格定）
- **细节词**：必须包含产地场景特征（如"loess plateau"、"Yunnan highland"、"Shandong greenhouse"）
- **负面词**：no illustration, no cartoon, no watermark, no text

**图片保存路径**：`pages/<product-slug>/assets/<section>-<index>.jpg`

**尺寸对齐规则（关键）**：
AI 生成图片的尺寸必须与网页 CSS 的 `aspect-ratio` 完全一致，否则图片会被拉伸或裁剪：

| 图片位置 | 网页 CSS | AI 生成尺寸 | 说明 |
|---|---|---|---|
| Hero 主图 | `aspect-ratio:4/3` | `landscape_4_3` (1152×864) | 横版，完美匹配 |
| 产地画廊 (origin-1~4) | `.item {aspect-ratio:4/3}` | `landscape_4_3` (1152×864) | 2×2 网格，横版展示 |
| 产品信息 (info-1) | 120×120 正方形 | `square_hd` (1024×1024) | 小图正方形 |
| 卖点配图 (feature-1~4) | 无固定比例 | `landscape_16_9` (1280×720) | 横版自然宽度 |
| 吃法图 (usage-1~4) | grid 2×2 | `square_hd` (1024×1024) | 正方形网格 |
| 收尾圆形图 (story-circle) | `.circle {160×160}` | `square_hd` (1024×1024) | 正方形原图，CSS 圆形裁剪无变形 |

### Step 4：HTML 装配

**严格按用户指定的模板**（或自动选择的模板）装配 HTML。**不要跨模板混用区块**。

每个 HTML 必须满足：
- **🚨 强制 base64 内嵌**：所有 `<img>` 标签的 `src` 必须是 `data:image/jpeg;base64,...` 格式，**禁止使用相对路径**。HTML 文件必须可双击独立打开，不依赖 `assets/` 目录
- 移动端优先，最大宽度 800px 居中
- 所有样式内联在 `<style>` 标签
- 字体使用系统中文栈 + Web safe 英文
- **每个区块**用 `<section data-section="s1-hero" data-section-name="Hero 主图">…</section>` 包裹
- **文字全部使用真实 HTML 标签**（`<h1>` `<h2>` `<p>` `<span>`），禁止把文字烧进图片
- 图片必须有 `alt` 属性
- 在页面顶部加一个工具条（含编辑模式和导出按钮）：
  ```html
  <div class="toolbar" style="position:sticky;top:0;z-index:99;background:#fff;color:#333;padding:10px 14px;display:flex;gap:10px;align-items:center;border-bottom:1px solid #e0e0e0">
    <button onclick="exportAll()">📦 导出全部模块为图片</button>
    <button onclick="toggleEdit()" id="editBtn" style="background:#666;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:13px">✏️ 编辑</button>
    <span style="font-size:12px;opacity:.7">文字可编辑 · 图片可替换</span>
  </div>
  ```
- **编辑功能**：页面必须支持编辑模式切换，包含以下脚本：
  ```javascript
  function toggleEdit(){
    const editable = document.body.classList.toggle('edit-mode');
    document.getElementById('editBtn').textContent = editable ? '🔒 预览' : '✏️ 编辑';
    // 文字编辑
    document.querySelectorAll('h1,h2,h3,p,span,dt,dd,.quote,.label,.badge,.s1-top-tag,.en').forEach(el=>{
      el.contentEditable = editable ? 'true' : 'false';
    });
    // 图片编辑：点击替换为本地图片
    document.querySelectorAll('img,.circle').forEach(el=>{
      if(editable){ el.addEventListener('click', handleImgClick); }
      else { el.removeEventListener('click', handleImgClick); }
    });
  }
  function handleImgClick(e){
    e.preventDefault(); e.stopPropagation();
    var target = e.target;
    if(target.tagName.toLowerCase() !== 'img') target = target.querySelector('img');
    if(!target) return;
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = function(ev){
      var file = ev.target.files[0];
      if(!file) return;
      var reader = new FileReader();
      reader.onload = function(evt){ target.src = evt.target.result; };
      reader.readAsDataURL(file);
    };
    input.click();
  }
  ```
- 引入 `html2canvas` + `JSZip` CDN + 拆图脚本（见 [references/export-guide.md](references/export-guide.md)）
- 拆图脚本必须**捕获全部** `[data-section]` 元素并打包下载为 ZIP

**生成内嵌 HTML 的步骤**：
1. 先生成常规 HTML（用 `assets/xxx.jpg` 相对路径）
2. 运行 `scripts/embed-images.py <产品目录>` 扫描 `assets/*.jpg`
3. 自动替换为 base64 data URL
4. 输出**自包含 HTML 文件**

> ⚠️ **`<img>` 标签格式硬性要求**：必须是 `<img src="data:image/jpeg;base64,..."` 这种 `src=` 引号包裹的格式。
> 缺失 `src=`（变成 `<img data:image/...`）的 HTML 浏览器**完全无法识别**图片资源，页面会一片漆黑。
> 每次 embed 完成后必须做断言：`grep -c '<img src="data:image' index.html` 应等于图片数。

### Step 5：交付

完成 HTML 后：

1. 在 `pages/<product-slug>/` 下生成：
   - **`index.html`** —— **自包含版本**（所有图片 base64 内嵌，单文件可分发）
   - `assets/` —— 原始图片文件（用户可单独使用 / 替换）
   - `README.md` —— 用法说明

2. 向用户报告：
   - 文件位置（重点指出 index.html 是**单文件自包含**）
   - 使用的模板 + 选模板的理由
   - 包含的模块（data-section）清单
   - 用户可改的内容（文字 / 图片 / 颜色）
   - 拆图方法（点击页面顶部"📦 导出全部模块"按钮 → 自动打包全部模块为 ZIP）
   - HTML 文件大小（base64 后大约 500-1500 KB）

3. 主动询问：是否需要调整模板、替换图片、修改文案。

## 关键约束

- **真实信息**：产地、气候、营养、菜谱必须来自 Web 调研，禁止 AI 编造
- **真实图片**：所有 AI 图必须用真实摄影 prompt，禁止插画/卡通
- **文字可编辑**：禁止把文字烧进图片，所有文字用 HTML 标签
- **模块可拆分**：每个区块必须有独立 `data-section` 标识
- **模板不混用**：选定 T1 就只用 T1 的区块结构
- **可访问**：图片必须有 `alt` 属性，文字与背景对比度 ≥ 4.5:1
- **响应式**：< 600px 单列；600–800px 单列加宽

## 输出示例

用户说："帮我做新疆小白杏的 page"

→ 触发 skill
→ Step 1：询问模板（用户回"随机"）
→ Step 2：WebSearch "新疆小白杏 产地 气候 采摘"
→ Step 3：生成 5~6 张真实摄影风 AI 图
→ Step 4：用 T1 模板装配 HTML
→ Step 5：交付 `pages/xinjiang-xiaobai-xing/index.html` + `assets/` + `README.md`
