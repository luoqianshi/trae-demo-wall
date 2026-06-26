# 服装商品数字手册 Pipeline 核心验证规则库 (Rule Registry)

> [!NOTE]
> **双源同步规范**：本文件是 `references/rule_registry.yaml` 规则库的人类友好阅读版。
> 所有流水线逻辑均以 YAML 为唯一机器读取源，严禁手动直接修改本 Markdown 文件。请修改 YAML 后运行以下脚本同步：
> `python scripts/rule_registry.py --render-md`

---

## 📊 规则库概览 (Summary)

- **总计核心规则**: `15` 个
- **P0 拦截级规则**: <span style='color: #FF3B30; font-weight: bold;'>15</span> 个 (阻断全部后续生成)
- **P1 告警级规则**: <span style='color: #FFCC00; font-weight: bold;'>0</span> 个 (发出强警告但不拦截)
- **P2 优化级规则**: <span style='color: #007AFF; font-weight: bold;'>0</span> 个 (审计级优化提示)

---

## 🔍 规则索引目录 (Table of Contents)

| 规则 ID | 规则名称 | 级别 | 适用文件 | 验证卡点 |
| :--- | :--- | :---: | :--- | :--- |
| [P0-VAL-001](#p0-val-001) | 图片确认链完整性校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan`, `validate` |
| [P0-VAL-002](#p0-val-002) | 视觉评审文本描述质量校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan`, `validate` |
| [P0-VAL-003](#p0-val-003) | 候选池归属一致性校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan` |
| [P0-VAL-004](#p0-val-004) | 5.1 颜色候选非空展示校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan` |
| [P0-VAL-005](#p0-val-005) | 5.2/5.3 候选池覆盖与排除项完整性校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan` |
| [P0-VAL-006](#p0-val-006) | 5.2/5.3 多视图拼接与合成图拦截 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan` |
| [P0-VAL-007](#p0-val-007) | 5.2/5.3 风险图 Override 规程校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan` |
| [P0-VAL-008](#p0-val-008) | 5.4 搭配候选组覆盖与一物一图原则校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan` |
| [P0-VAL-009](#p0-val-009) | 5.4 搭配效果图 visual_type 校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan` |
| [P0-VAL-010](#p0-val-010) | 8.1 面料专属 visual_type 校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `image_selection_plan.json` | `validate-plan` |
| [P0-VAL-011](#p0-val-011) | 4.1/4.2 表格第一列 CSS 硬契约校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `parts/part_02_audience_scene_emotion.md`, `final_handbook.md` | `validate-parts`, `validate` |
| [P0-VAL-012](#p0-val-012) | 5.1/5.2/5.3/5.4 图片 HTML snippet 渲染一致性校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `parts/part_03_product_gallery.md`, `final_handbook.md` | `validate` |
| [P0-VAL-013](#p0-val-013) | 临时与开发敏感路径拦截校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `parts/*.md`, `final_handbook.md` | `validate-parts`, `validate` |
| [P0-VAL-014](#p0-val-014) | 内容质量门校验与占位符拦截 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `parts/*.md`, `final_handbook.md` | `validate-parts`, `validate` |
| [P0-VAL-015](#p0-val-015) | 设计师卖点原文真实性校验 | <span style='background: #FFEBEE; color: #FF3B30; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;'>P0 拦截</span> | `parts/part_01_intro_selling_points.md`, `final_handbook.md` | `validate-parts`, `validate` |

---

## 🛠️ 规则详细规范 (Rule Specifications)

### <a name='p0-val-001'></a>🛑 P0-VAL-001 - 图片确认链完整性校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`, `validate`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
请在 image_selection_plan.json 中补充完整的图片确认链字段：confirmed_by_original_image=true, review_basis="original_image", original_path, visual_judgement。
```

---

### <a name='p0-val-002'></a>🛑 P0-VAL-002 - 视觉评审文本描述质量校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`, `validate`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
重新补充 visual_judgement 字段，用不少于 12 个中文字符详细描述该图片中的视觉元素、背景或姿势，拒绝使用空泛短词。
```

---

### <a name='p0-val-003'></a>🛑 P0-VAL-003 - 候选池归属一致性校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
检查 image_selection_plan.json 中报错图片的 ID 及其 original_path，确保它存在于 image_candidates.json 的对应章节候选池中。如果属于提取漏图，需重新运行 image-candidates；否则应修正 plan 将图片归于正确章节。
```

---

### <a name='p0-val-004'></a>🛑 P0-VAL-004 - 5.1 颜色候选非空展示校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
5.1 颜色候选池有图，但 plan 中没有选取任何颜色图。请至少选择 1 张有效颜色图，或全选有效颜色图，将其加入 5.1 items 中。
```

---

### <a name='p0-val-005'></a>🛑 P0-VAL-005 - 5.2/5.3 候选池覆盖与排除项完整性校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
检查 5.2/5.3 章节是否漏掉了候选池中的图片审查。请将未选用的图片 ID 全量补充到 excluded_candidates 数组中，并提供 review_decision="excluded"、exclude_reason 和确认链。
```

---

### <a name='p0-val-006'></a>🛑 P0-VAL-006 - 5.2/5.3 多视图拼接与合成图拦截

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
检查 5.2/5.3 中被判定为合成/拼图的图片，如果是合成图，必须移入 excluded_candidates 并标注 exclude_reason="multi_view_collage"。如果是单人单角度的误判，请填报 override 字段进行人工纠偏。
```

---

### <a name='p0-val-007'></a>🛑 P0-VAL-007 - 5.2/5.3 风险图 Override 规程校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
该图片包含拼接风险，请在 plan 中额外提供 override_system_flag_reason 字段，并将 confirmed_single_subject_single_angle 设置为 true，同时在 visual_judgement 描述中明确强调该图不是拼接合成图。
```

---

### <a name='p0-val-008'></a>🛑 P0-VAL-008 - 5.4 搭配候选组覆盖与一物一图原则校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
1）确保该搭配组内所有候选图片都已全部评价；2）检查是否在一套搭配里重复展示了同一个物品的多个角度，如果是，请只保留 1 张展示，把其余的移入 excluded_candidates 并标注 exclude_reason="duplicate_item_other_angle"。
```

---

### <a name='p0-val-009'></a>🛑 P0-VAL-009 - 5.4 搭配效果图 visual_type 校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
请为 5.4 搭配效果图 effect_image 提供合法的 visual_type 属性。如果是单张模特全身照，请设置 visual_type="single_outfit_photo" 并添加 confirmed_no_collage=true。
```

---

### <a name='p0-val-010'></a>🛑 P0-VAL-010 - 8.1 面料专属 visual_type 校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `image_selection_plan.json`
- **执行校验卡点 (Validators)**: `validate-plan`
- **下一步返工环节 (Next Action)**: `validate-plan`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
检查 8.1 中所选图片是否是模特穿着图，面料部分严禁模特全身穿着图进入。请补充有效的 visual_type（如 fabric_swatch / texture_closeup ），对于工艺特写必须提供 confirmed_craft_or_material_detail=true 确认字段。
```

---

### <a name='p0-val-011'></a>🛑 P0-VAL-011 - 4.1/4.2 表格第一列 CSS 硬契约校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `parts/part_02_audience_scene_emotion.md`, `final_handbook.md`
- **执行校验卡点 (Validators)**: `validate-parts`, `validate`
- **下一步返工环节 (Next Action)**: `validate-parts` ➔ `assemble` ➔ `validate`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
检查并修复手册或部件中的 4.1 痛点表或 4.2 转化表，确保第一列所有的 <th> 和 <td> 样式属性中完全包含 "width: 100px; min-width: 100px; white-space: nowrap; text-align: center;"。
```

---

### <a name='p0-val-012'></a>🛑 P0-VAL-012 - 5.1/5.2/5.3/5.4 图片 HTML snippet 渲染一致性校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `parts/part_03_product_gallery.md`, `final_handbook.md`
- **执行校验卡点 (Validators)**: `validate`
- **下一步返工环节 (Next Action)**: `assemble` ➔ `validate`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
严禁 AI 手写 HTML 的第5章图片！请删除 part_03_product_gallery.md 中 AI 手拼的图片 HTML，完全复制 snippets/gallery.md 覆盖 part_03，然后重新进行 assemble 与 validate。
```

---

### <a name='p0-val-013'></a>🛑 P0-VAL-013 - 临时与开发敏感路径拦截校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `parts/*.md`, `final_handbook.md`
- **执行校验卡点 (Validators)**: `validate-parts`, `validate`
- **下一步返工环节 (Next Action)**: `validate-parts` ➔ `assemble` ➔ `validate`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
请清除手册或对应 part 部件中的开发敏感/临时文件夹前缀（.uploads/、scratch/、.trae/、temp/）。图片必须使用正确的相对商品目录根目录的路径。
```

---

### <a name='p0-val-014'></a>🛑 P0-VAL-014 - 内容质量门校验与占位符拦截

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `parts/*.md`, `final_handbook.md`
- **执行校验卡点 (Validators)**: `validate-parts`, `validate`
- **下一步返工环节 (Next Action)**: `validate-parts` ➔ `assemble`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
检查并修复内容质量。禁止出现 xxx、待填写、搭配说明待补充 等占位符，或 AI 可生成章节中的“待补充”字眼。空表格核心单元格必须填满。
```

---

### <a name='p0-val-015'></a>🛑 P0-VAL-015 - 设计师卖点原文真实性校验

> [!CAUTION]
> **阻断等级：P0 (HIGH BLOCKER)**
> 该规则未满足时将强制退出生成流水线，必须完成修复后方能继续。

- **单一可信源 (Source of Truth)**: [workflow_rules.md](file:///D:/Users/EDY/Documents/.trae-cn/product-digital-handbook/references/workflow_rules.md)
- **适用检测范围 (Applies to)**: `parts/part_01_intro_selling_points.md`, `final_handbook.md`
- **执行校验卡点 (Validators)**: `validate-parts`, `validate`
- **下一步返工环节 (Next Action)**: `validate-parts` ➔ `assemble`

#### 💡 诊断修复工单指引 (Fix Instruction)
```text
当商品资料中未检测到设计师原始卖点文档时，1.2 设计师卖点原文小节必须显示“待补充”警告卡片，严禁 AI 编造任何设计师原话或设计陈述。
```

---
