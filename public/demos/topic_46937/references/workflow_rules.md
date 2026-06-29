# Workflow Rules — 编译发布双端执行 SOP

> 本文件定义了手册生成的详细执行流程与双端编译规范。AI 在开发与同步过程中必须严格遵循。

---

## 📐 一、 双交付发布核心规范 (Dual-Delivery Core Concept)

我们坚决主张 **“内容与展现分离”** 这一现代手册发布标准：
* **内容源 `{SKU}.md`**：为面向 AI、语义检索与数字人的**纯净 Markdown** 文件。必须遵循原生 Markdown 标题、标准表格与无序列表，严禁混入任何复杂 HTML 视觉容器（`<div>`）、 `<style>` 标签或行内 `style`/`class` 属性。唯一允许 of HTML tags 是 `<!-- pdh:component=... -->` 组件定位元注释与首行格式声明。
* **视觉成品 `{SKU}.html`**：为面向人类审阅、演示与打印的**精美网页视图**。由引擎在合并（assemble）时自动将 Markdown 原生表格映射高奢卡片（Card Grid）并注入 UI 容器渲染输出。

---

## 🛠 二、 物理发布流水线 (Phased SOP Roadmap)

### Phase 1: 数据提取 (extract)
```bash
python scripts/pipeline_engine.py --action extract --target_dir "{商品目录}"
```
* **输出**：`manifest.json` 与 `dump.txt` 物理文本包。
* **SOP**：AI 递归审阅全文，确定商品核心信息、面料配比及尺码数据，拒绝空泛臆测。

### Phase 2: 内容策略简报提取与校验 (content-brief) [v2.3.8 新增]
1. **生成简报策略骨架**：
   ```bash
   python scripts/pipeline_engine.py --action content-brief-skeleton --target_dir "{商品目录}"
   ```
   * **输出**：`.scratch/content_strategy_brief.schema.json` 结构定义与空白待填充骨架 `.scratch/content_strategy_brief.json`。
2. **AI 事实理解与填充**：
   * **SOP**：AI 读取 `dump.txt` 全文事实，严格遵循 schema 将物理卖点转译为用户处境与解决方案，必须为每个方案明确绑定 `evidence_refs`（物理文件名、摘录、可信度），并将内心独白填充入 `internal_monologue`（内心独白必须使用「」包裹，每个维度独白条目必须 >= 3 条以满足质量审计密度，合计不少于 15 条）。
3. **策略简报合规性校验**：
   ```bash
   python scripts/pipeline_engine.py --action validate-content-brief --target_dir "{商品目录}"
   ```
   * **SOP**：前置校验字段非空性、占位符残留、证据链存在以及跨平台表达同质化情况，确保策略在骨架拆分前绝对合规。

### Phase 3: 图片分类与初筛计划 (contact-sheet & image-candidates)
```bash
# 1. 物理拼板
python scripts/pipeline_engine.py --action contact-sheet --target_dir "{商品目录}"
# 2. 候选池分析
python scripts/pipeline_engine.py --action image-candidates --target_dir "{商品目录}"
```
* **SOP**：AI 利用 contact-sheet 缩略图极速初筛，并**必须双向打开原图复核**。
* **输出计划**：AI 输出包含完整确认链（`visual_judgement` >= 12字、`confirmed_by_original_image: true`）的 `image_selection_plan.json`。

### Phase 4: 片段生成 (validate-plan & image-snippet / index-snippet)
* **SOP**：AI 在执行片段生成前，必须先行通过 plan 结构校验门：
```bash
# 1. 前置 Plan 结构契约检验
python scripts/pipeline_engine.py --action validate-plan --image_plan "{plan.json}"
# 2. 片段渲染 (gallery.md 与 fabric_gallery.md)
python scripts/pipeline_engine.py --action image-snippet --target_dir "{商品目录}" --image_plan "{plan.json}"
# 3. 素材索引生成
python scripts/pipeline_engine.py --action index-snippet --target_dir "{商品目录}"
```

### Phase 5: 骨架拆分与内容填充 (part-skeletons & AI refactor)
```bash
python scripts/pipeline_engine.py --action part-skeletons --target_dir "{商品目录}"
```
*默认使用 `references/clean_md_template.md` 作为 Clean MD 骨架源。*

* **SOP**：AI 绝对禁止在空白文件上自由填充。必须在引擎生成的 `parts/part_0X.md` 骨架中将 `{占位符}` 替换为真实商品信息。
* **特别强调**：
  * 所有 parts 中的表格（包括人群、场景、情绪图谱 4.1/4.2、尺码与资质）必须写为标准原生 Markdown 表格（`|---|`），保持原有的标题与表头完全兼容不动，禁止混入 HTML 标签。
  * parts 源文件必须 clean-md-compatible：禁止 div/span/table/tr/td/style/class/script。
  - 4.1 买家心理五维图谱：痛点、痒点、爽点、槽点、爆点这 5 个情绪维度下，**每个情绪维度必须列出至少 3 条且合计不少于 15 条**内心独白与解决方案/工艺支撑，每条内心独白必须使用 `「」` 明确包裹，以满足内容质感审计。
  - 4.2 情绪→内容转化钩子矩阵：**必须至少生成 15 条平台钩子组合**（覆盖场景钩子、痛点钩子、反差钩子、证据钩子、身份钩子、悬念钩子、异议反驳钩子、价值钩子等），以符合高密度高价值资产包的审计标准。

### Phase 5.5: 骨架格式预审 (validate-skeletons)
```bash
python scripts/pipeline_engine.py --action validate-skeletons --target_dir "{商品目录}"
```
* **SOP**：在 AI 填充前执行骨架结构校验。
* **检查项**：
  - part 文件齐全（part_01 ~ part_05）
  - 固定标题完整（包括 part_03 的第 5 章标题）
  - **允许 `{...}` 占位符**
  - 无 div/span/table/tr/td/style/class/script 等 HTML 视觉污染
  - 允许 Markdown 表格
  - 无 scratch/temp/.uploads 等临时路径

### Phase 6: Parts 格式终审 (validate-parts)
```bash
python scripts/pipeline_engine.py --action validate-parts --target_dir "{商品目录}"
```
* **SOP**：在 AI 填充完成后、assemble 前执行严格终审。
* **检查项**：
  - part 文件齐全（part_01 ~ part_05）
  - 固定标题完整
  - **无 `{...}` 占位符残留（所有类型）**
  - 无 div/span/table/tr/td/style/class/script 等 HTML 视觉污染
  - 允许并推荐 Markdown 表格
  - 底部声明存在
  - 无 scratch/temp/.uploads 等临时路径

### Phase 7: 引擎组装与双交付编译 (assemble)
```bash
python scripts/pipeline_engine.py --action assemble --target_dir "{商品目录}"
```
* **工作流**：
  1. 引擎在后台自动读取 `fabric_gallery.md` 与 `gallery.md` 网页级图片素材，并纯净化编译为 Markdown 原生多媒体标记，同步合并输出 `{SKU}.md`。
  2. 引擎在 references 高奢组件库下，调用 CSS 与主题，将原生表格编译重塑为具有现代呼吸感的高精美网页，输出 `{SKU}.html`。

### Phase 8: 三轨校验合流验证 (validate & validate-render-parity)
```bash
# 1. 验证 Clean MD 契约 (无任何视觉 style/div 污染)
python scripts/pipeline_engine.py --action validate --format md --handbook "{商品目录}/{SKU}.md"
# 2. 验证 HTML 安全与架构 (0 远程脚本, 0 本地 JS)
python scripts/pipeline_engine.py --action validate --format html --handbook "{商品目录}/{SKU}.html"
# 3. 双端一致性物理核准审计 (事实 100% 对齐)
python scripts/pipeline_engine.py --action validate-render-parity --target_dir "{商品目录}"
```
* **SOP**：**三绿灯必须全亮**，确保双端文件绝对一致，无任何捏造、漏译或侵入性事件脚本。

### Phase 8.4: 平台内容资产包分发 (content-pack) [v2.3.8 新增]
```bash
python scripts/pipeline_engine.py --action content-pack --target_dir "{商品目录}"
```
* **SOP**：在 assemble 及三端校验通过后独立后置执行。读取 `{SKU}.md` 及已校验的 `content_strategy_brief.json`，结合 `platform_playbooks` 中的通用模板，将内容进行格式化和映射，输出到 `.scratch/content_pack/` 目录下的 4 个平台文件。

### Phase 8.5: 内容策略质量量化审计 (validate-content-quality) [v2.3.8 新增]
```bash
python scripts/pipeline_engine.py --action validate-content-quality --target_dir "{商品目录}"
```
* **SOP**：后置对 content-pack 生成的资产包及手册进行 6 大指标评分。
* **分数状态映射**：
  - 得分 < 60 分：内容资产包状态为 **WARNING** 预警。
  - 得分 < 40 分：内容资产包状态为 **FAIL** 失败。
  - **解耦防线**：其分数或 Fail 状态绝不熔断或阻断 `{SKU}.md` 与 `{SKU}.html` 的主双交付。

---

## 🚫 三、 禁止事项 (Strict Prohibitions)

1. ❌ **禁止在 `{SKU}.md` 中混入 HTML `<div>`、行内 `<style>` 或复杂网页排版**。
2. ❌ **禁止在 `{SKU}.html` 中加入任何 `<script>` 标签或 JavaScript 行为**。
3. ❌ **禁止修改 clean_md_template.md 中的任何 ## 或 ### 标题**，或在 Parts 填充时擅自增加模板规定外的额外章节。
4. ❌ **禁止手写第 5 章图片宫格或第 10 章素材索引 HTML** — 分别由引擎从 snippet 同步净化。
5. ❌ **禁止手动在 parts 中引用绝对路径或 scratch 临时路径**。
6. ❌ **禁止修改或绕过 `validate` 失败信息** — 凡有 Fail 必须定向排查对应的 Part 源码，不搞盲目全量重生成。
7. ❌ **禁止将洗水唛合格证等资质展示物料（编号 `#070` 等）误分类为 `"certification"` 或其他非常规 visual_type** — 在 8.1 面料与品牌资质部分，洗水唛等图片必须统一分类为 `"fabric_swatch"`，以固化排版展现并防范图片被编译引擎意外过滤。
8. ❌ **禁止在通用方法论/Schema/Playbook 知识库文件中写死任何特定 SKU、品类案例或人名** — 所有新增的 references/ 下的说明文件开头必须声明统一的「禁止硬编码声明」，以通过 `test_no_new_product_hardcoding.py` 防火墙拦截。
9. ❌ **禁止将 content-pack 与 assemble 动作强绑定** — content-pack 必须作为后置增强的独立 action 执行，绝不允许内容审计低分导致主交付链路熔断。

---

## 🛡️ 四、 v2.3.9.1 launch-scope-filter 属性过滤及图片一致性审核规范 (Hotfix SOP)

上新过程中，为杜绝旧颜色、旧尺码、废弃历史素材残留，必须强制遵循属性白名单过滤与一致性人工审核双重机制：

1. **白名单自动对齐 (Spreadsheet Auto-Alignment)**：
   - 引擎启动时自动扫描商品根目录下的 `.xlsx` 上新资料包（跳过老旧的 `.xls`）。
   - 自动提取可售颜色和下单尺码，生成结构化白名单 `.scratch/launch_scope.json`，并支持从 `references/attribute_aliases.json` 自动读取并应用外置同义别名对齐（如 `藏蓝 -> 藏青`、`浅米灰 -> 米白`）。

2. **精准局部剔除与双端一致性 (Structured Region-Only Clean)**：
   - 过滤动作仅在 `assemble` 阶段对最终交付件的“5.1 颜色展示表格”、“九、尺码参考”等结构化区域开展精准物理剔除，**绝对禁止盲目扫描正文并整行删除**，保障正文描述不受无上下文干扰。
   - 物理降噪必须保证 Markdown 交付件与 HTML 渲染图库完全一致（Parity 100% 通过），剔除禁用属性的同时无缝修剪 HTML 图片卡片容器。

3. **别名映射一致性人工审核警示 (Alias Verification Warning)**：
   - **机制**：当图片或卡片中的实际展示颜色与 Excel 表格下单的原始标准色不一致、但通过同义别名映射（如展示 `浅米灰`，下单 `米白`）匹配保留成功时，**系统必须主动发出一致性警告**。
   - **控制台输出**：命令行必须黄色 safe_print `[WARN] 图片展示颜色 'xxx' 与表格下单颜色 'yyy' 不完全一致，已通过别名映射对齐，颜色名称和颜色图片需要人工审核。` 警示。
   - **报告与手册双端持久化**：必须在 `.scratch/reports/launch_scope_filter_report.md` 尾端及 `.scratch/reports/content_quality_audit.md` 中分别追加持久化专门小节。同时，**引擎必须自动、物理地在 Markdown 交付手册的颜色表头/alt图片引用、以及最终 HTML 手册网页的颜色图库卡片下方，直链注入 `(下单色:xxx)` 括号Tips提示**（如：`浅米灰(下单色:米白)`），实现全端、极致的人眼防呆核对，完全杜绝线上实际陈列物料字面偏离及色差风险。

---

## 🚀 五、 v2.4 极简静物物料填充及生图方案与双向路径同步规范 (v2.4 SOP)

在极简物料（缺少棚拍/外景，仅有静物图）场景下，技能必须强制启动极简物料 AI 自动填充与搭配方案生图机制，并严格遵守双向同步规范：

1. **零门槛智能自决策 (Zero-Clarification Smart Generate)**：
   - 严禁前置澄清提问，首步必须运行 `smart-generate --dry-run`；
   - 决策报告必须物理输出 `## 5.4 搭配方案自动生成决策`，展示极简物料识别状态、缺少搭配图状态、搭配企划状态，并给出明确的下一步建议动作及风险说明。

2. **5.4 搭配生图与合流物理管线 (AIIDE Outfit Gen-Images Pipeline)**：
   - **搭配企划**：运行 `outfit-brief`，依据品类与静物图颜色，自动设计 3 套搭配 Look (look_01-look_03)，为不同穿搭场景（如：户外山系、都市通勤、慵懒街头）编写语义搭配逻辑及生图 Prompts；
   - **生图能力**：运行 `outfit-generate-images` 启动严格两阶段搭配生图。Stage 1 只输出搭配单品任务；所有单品真实生成并通过校验后，再次运行进入 Stage 2，使用主商品静物图与已生成单品图作为联合参考生成 Look。严禁并联提交单品与 Look。引擎会在控制台输出 `[AIIDE_IMAGE_GENERATION_REQUIRED]` 标识包裹的任务 JSON 清单（包含 `target_path`、中英文 prompts 和参考图片）；
   - **AIIDE 生图引导（AIIDE Agent Action SOP）**：当执行该命令的 AIIDE 智能体在控制台输出中捕获到 `[AIIDE_IMAGE_GENERATION_REQUIRED]` 时，**智能体必须立即暂停命令行后续步骤，读取该 JSON，循环调用智能体的 `generate_image` 工具**去生成这批图片，并写入对应的 `target_path`。生图完成后，再继续运行合流命令；
   - **资产合流**：运行 `outfit-plan-merge` 将生图元数据注入 `manifest.json`、`contact_sheet_index.json` 和 `image_candidates.json`，并写入 `image_selection_plan.json` 的 5.4 搭配方案展示段。随后运行 `image-snippet` 编译产生 HTML 与 Markdown 图像片段。

3. **极简物料自动 AI 填充原则 (Minimal Material Auto-Fill)**：
   - 在 `part-skeletons` 阶段，如果检测到极简物料模式（`minimal_static_only`），系统必须在写入 Parts 前，自动调用 `fill_skeleton_parts_for_minimal_material` 进行全套占位符 AI 智能填充；
   - 4.1 表格列名强制对齐为 `| 情绪维度 | 内心独白 | 解决方案 | 工艺/面料支撑 |`，内容密度满足 ≥ 15 条独白，独白用 `「」` 包裹；
   - 4.2 表格列名强制对齐为 `| 情绪 | 小红书钩子 | 抖音钩子 | 直播间钩子 | 评论区引导 |`，内容密度满足 ≥ 15 条组合；
   - 必须将 `snippets/gallery.md` 与 `snippets/fabric_gallery.md` 自动同步加载覆盖到 `part_03` 及 `part_05` 对应的 8.1 章节内。`part_03` 头部必须强制加入 `<!-- part_03 由 gallery-snippet 引擎生成，请勿手动编辑 -->\n` 注释以防止路径静态校验拦截；
   - 严禁捏造任何尺码（第九章）、面料材质比例和检测报告数据（8.2节），在无输入源时必须统一填“待补充/待确认/请以实际上新资料为准”。

4. **双向路径同步规范 (Bidirectional Path Synchronization)**：
   - 工作区路径：例如 `d:\Users\EDY\Documents\.trae-cn\product-digital-handbook`
   - IDE 插件路径：`C:\Users\EDY\.trae-cn\skills\product-digital-handbook`
   - **【强制规则】**：每当修改或创建了工作区中的任何核心代码、脚本、配置或说明文档时，必须【自动且同步】地将最新的代码写入并覆盖到 IDE 系统的插件运行路径中，以实现热重载并确保版本绝对一致。

---

## 🛡️ 六、 v2.4.2 内容质量门与搭配生图修复规范 (v2.4.2 SOP)

为了解决内容生成过程中的空数据、伪造设计师卖点、非结构化搭配说明及模特生图形态不稳定的问题，在 v2.4.2 中执行以下强化规范：

1. **内容质量门 (P0-VAL-014)**：
   - 严禁最终 MD/HTML 文档中出现 `{SKU}`、`xxx`、`待填写`、`{描述}`、`{方向1}`、`搭配说明待补充` 等占位符或模板说明词。
   - AI 可填充章节（1.1、2.1、2.2、2.3、3.1、3.2、4.1、4.2、4.3、5.4、第六章、第七章）绝对不允许留空或显示“待补充”状态，必须根据商品信息及品类特征自动填充结构化合规文本。
   - 所有表格的单元格必须包含有效文字，不得出现空表格或半空表格现象。

2. **设计师卖点原文证据门 (P0-VAL-015)**：
   - 仅当商品原始资料（如 `dump.txt` 或外部文档）中明确包含设计师手稿、卖点原文或手稿证据时，才允许在 `1.2 设计师卖点原文` 中以引用块（`>`）原样呈现。
   - 若未检测到任何真实设计师的原文，**严禁 AI 伪造设计师原话或设计陈述**，必须输出统一的待补充卡片：
     ```markdown
     ### 1.2 设计师卖点原文

     > ⚠️ **待补充**
     >
     > 当前商品目录未检测到设计师原始卖点文档。本章节仅保留原文承载位置，待设计师或商品团队补充后再更新。
     ```

3. **5.4 搭配平铺生图约束 (Flatlay Outfit Image Constraint)**：
   - 5.4 搭配图 AI 生图必须以平铺穿搭图/outfit board/flat lay 为第一优先级，**默认不生成真人模特图**。
   - 所有的生图 Prompt 必须加入中英文强约束，且生图模型根据环境自动检测并分发（Antigravity 环境使用 `nanobanana2`，Codex 物理环境使用 `image2`）。
   - Prompt 必须从“图4式平铺穿搭展示方式”反推固化：top-down view / flat lay outfit board / neatly arranged clothing and accessories / no model / no person / product-centered composition；画面主商品必须围绕 5.1 已确认的本品静物图展开，不得生成脱离本品颜色、廓形和品类的泛搭配。
   - `effect_image` 必须通过 `source_product_image_id` 或 `reference_image_ids` 绑定 5.1 已确认产品静物图 ID；AI 生图资产必须标记 `asset_origin=ai_generated` 且 `visual_type=outfit_flatlay`。
   - 生图失败或缺少图片时，绝对不阻断主流程，应以“缺少对应图片引用”的明确警告 + 文字版结构化搭配方案兜底展示，并在报告中记录，错图应自动分流至 `excluded_candidates`。
   - 每套搭配在最终 Handbook MD 中必须以 native Markdown 表格展示完整的场景定位、本品颜色、推荐单品、搭配逻辑、适合人群、内容角度、生图说明，不夹带任何 HTML 容器或内联 CSS 标签。

4. **5.1 颜色图静物-only 约束 (Still Product Color Image Constraint)**：
   - 5.1 颜色展示只能引用产品静物图、平铺静物图或色卡图；严禁引用真人模特图、外景图、穿搭效果图、AI 搭配图或非本品素材。
   - 每张 5.1 入选图必须同时具备 `confirmed_no_model=true` 与 `confirmed_product_still_or_color_card=true`，并保留 `confirmed_by_original_image=true`、`review_basis=original_image`、`original_path`、`visual_judgement`。
   - 若候选池存在颜色候选但 plan 未引用或全部被拒绝，最终片段必须明确提示“缺少对应图片引用”，不得静默显示空白或仅写“暂无”。

5. **模块化角色切换约束 (Role Switching Constraint)**：
   - 第六章“营销方向与传播建议”必须切换为“互联网创意营销大师”身份，从平台机制、内容钩子、传播路径、互动设计和转化闭环进行创意设计。
   - 第七章“主播通用穿搭与话术模版”必须切换为“资深直播间转化教练”身份，从主播动作、用户异议、节奏推进和逼单闭环设计话术。
   - 不同模块不得沿用同一种泛泛商品卖点口吻；平台策略禁止出现大段重复句式。
