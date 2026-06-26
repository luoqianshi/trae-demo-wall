---
name: product-digital-handbook
description: 从商品素材目录生成或更新服装/配饰商品数字身份手册。适用于中文或英文请求，例如：生成商品手册、更新商品手册、分析商品素材目录、商品数字身份手册、详情页内容、商品营销内容、主播话术、素材索引、修复手册交付质量、repair handbook quality、create product handbook。输出纯净 Markdown 内容源 `{SKU}.md` 和渲染后的 HTML 展示稿 `{SKU}.html`。
---

# 商品数字身份手册

## 使用场景

当用户提供一个商品素材目录，并要求分析商品资料、生成或更新商品手册、产出详情页内容、营销内容、主播话术或素材索引时，使用本技能。

素材目录可包含图片、文本、表格、PDF、Word 文件或既有手册输出。

除非用户明确要求只做局部任务，默认交付双端文件：

- `{SKU}.md`：纯净 Markdown 内容源，面向 AI、数字人、检索和后续复用。
- `{SKU}.html`：由 Markdown 渲染得到的 HTML 视觉稿，面向人工评审、展示和汇报。

## 技能运行原则

`SKILL.md` 只作为触发后入口和导航层。详细规则按需读取，不要把全部规则重新塞回入口正文：

- `references/workflow_rules.md`：分阶段 SOP、`smart-generate` 决策、更新/修复流、计时要求。
- `references/clean_md_template.md`：新手册和 part skeleton 的唯一默认 Clean MD 骨架。
- `references/template_contract.md`：固定章节和标题契约。
- `references/clean_md_contract.md`：纯净 Markdown 契约。
- `references/html_render_contract.md`：HTML 渲染、安全和双端一致性契约。
- `references/image_selection_plan_contract.md`：`image_selection_plan.json` 结构、图片复核字段、5.1/5.4 AI 图片规则。
- `references/rule_registry.md` 与 `references/rule_registry.yaml`：验证规则定义。
- `references/runbook.md`：常用命令流程和运营恢复说明。
- `references/known_product_hardcoding_allowlist.json`：已批准的历史映射夹具；禁止把商品专属映射硬编码到 `SKILL.md` 或代码里。
- `references/platform_playbooks/`：平台差异化内容策略。
- `references/synonym_dictionary.md`：词频多样性和高质感替代表达。
- `references/acceptance_checklist.md`：验收检查清单与最终交付标准。
- `references/semantic_review_cards.md`：语义评审卡与质量自查指引。

核心交付动作使用 `scripts/pipeline_engine.py`。除非用户明确要求修改技能实现，不要为核心交付临时自建脚本。

## P0 交付红线

1. 普通“生成/更新商品手册”意图下，不做前置澄清拦截。先运行 `smart-generate --dry-run`，读取决策报告，再按引擎决策流转。
2. 递归扫描并读取商品目录。禁止只凭文件名推断商品事实。
3. 图片候选必须视觉复核。Contact sheet 只是初筛工具；最终入选或不确定图片必须打开原图，并写入 `visual_judgement`。
4. Markdown 与 HTML 职责分离。AI 只填干净 Markdown，HTML 由渲染器编译。
5. `references/clean_md_template.md` 是固定骨架。禁止重命名、删除、重排或新增章节。
6. 必须先通过 `part-skeletons` 生成骨架，再填充内容。禁止从空白页自由写 part。
7. 最终手册所有图片必须来自 `image_selection_plan.json`；HTML 图片必须带 `data-pid`；最终输出不得引用 `.scratch`、`.trae`、temp、cache、upload 等不稳定路径。
8. 禁止在 parts 中手写 gallery、fabric-gallery 或 asset-index HTML；必须使用引擎生成的 snippets。
9. 交付前必须通过 Markdown 纯净度、HTML 安全/标签闭合、双端一致性和规则库验证。
10. validate 通过不等于视觉正确。验证通过后仍要检查图片密集章节，尤其是第 5 章。

## 标准工作流

从技能根目录运行引擎；商品目录下生成的中间文件应放在该商品目录的 `.scratch/` 中。

```bash
python scripts/pipeline_engine.py --action smart-generate --target_dir "{product_dir}" --dry-run
```

随后按 `references/workflow_rules.md` 执行。标准流程：

1. `extract`
2. 需要内容策略时执行 `content-brief` 及其校验
3. `contact-sheet`
4. `image-candidates`
5. AI 按 `references/image_selection_plan_contract.md` 创建或更新 `image_selection_plan.json`
6. `validate-plan`
7. `image-snippet` 与 `index-snippet`
8. `part-skeletons`
9. 只基于骨架填充 parts
10. `validate-parts`
11. `assemble`
12. `validate`
13. `validate-render-parity`

极简物料商品如果需要 AI 搭配资产，按 `references/image_selection_plan_contract.md` 的 5.4 规则执行专用流程：

```bash
python scripts/pipeline_engine.py --action outfit-brief --target_dir "{product_dir}"
# 第一次运行只生成搭配单品任务；所有单品真实生成并通过校验后再次运行，才生成 Look 任务。
python scripts/pipeline_engine.py --action outfit-generate-images --target_dir "{product_dir}"
# [AIIDE 生图引导] 智能体执行上一步时若捕获到 [AIIDE_IMAGE_GENERATION_REQUIRED] 指令块，必须暂停执行下一步，使用 generate_image 辅助生成全部真实搭配图
python scripts/pipeline_engine.py --action outfit-plan-merge --target_dir "{product_dir}"
```

严禁并联生成搭配单品和 Look。Look 必须同时引用主商品静物图与已经生成完成的搭配单品图，确保商品和搭配元素一致。

## 图片计划规则

写入或修改 `image_selection_plan.json` 前，必须读取 `references/image_selection_plan_contract.md`。

关键约束：

- 5.1 颜色图只能是产品静物、平铺图或色卡图，不能使用真人穿着图。
- 5.2 和 5.3 模特图必须是单张非拼接照片，并具备原图复核证据。
- 5.3 外景/生活方式图片必须按场景或拍摄风格分组。
- 5.4 搭配方案必须有搭配效果图，并且搭配物料语义一致。
- AI 生成的 5.4 效果图必须是 flat-lay/top-down/no-model，引用已入选 5.1 静物图 ID，并落到稳定可渲染路径。
- 每个入选或排除候选都必须有清晰的审核决策和原因。

## 质量门

修改技能项目时，必须通过以下测试和校验（在 Windows 环境下建议设置 `PYTHONUTF8=1` 以免中文编码引发报错，如 Powershell 中可执行 `$env:PYTHONUTF8=1`）：

```bash
python -B -m unittest discover scripts
python -B scripts/test_no_new_product_hardcoding.py
python -B scripts/rule_registry.py --validate
git diff --check
```

真实商品交付的最终状态必须满足：

- `{SKU}.md` 是纯净 Markdown。
- `{SKU}.html` 由 Markdown 源生成。
- `validate` 对要求的格式通过。
- `validate-render-parity` 通过，且没有未解决的事实冲突。
- 最终输出没有 `{...}` 占位符、`AUTO_REVIEW`、禁用脚本或不稳定路径。

## 更新与修复行为

更新既有手册时：

- 让 `smart-generate --dry-run` 判断是首次生成、增量更新、修复、无变化，还是需要人工复核。
- 如果决策是 `no_change`，告知手册已经是最新状态，不重新构建。
- 如果决策是 `needs_review`，只询问引擎给出的定向后置问题。
- 如果验证失败，只定向修复失败块或失败规则路径。禁止用 best-of-N 全量重跑掩盖不稳定。
