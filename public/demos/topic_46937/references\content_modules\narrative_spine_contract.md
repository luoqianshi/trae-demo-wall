> 本文件为通用方法论/Schema/Playbook 文件，禁止写入任何具体 SKU、商品名、品牌名、设计师/搭配师姓名、固定图片路径、固定面料、固定颜色、固定品类案例。所有表达必须使用 `{变量}`、字段定义或抽象规则。

# 叙事脊柱契约 (Narrative Spine Contract)

本契约用于规范从用户痛点出发，最终转译生成平台营销内容资产的“骨架传导逻辑”。它是一条贯穿整个生成管线的红线，要求 AI 在编写和校验手册的所有章节内容时，必须保证**核心叙事逻辑前后高度一致、证据充足、句法结构完整**。

---

## 一、 核心转译链路

全域内容叙事引擎的核心处理链路如下：

```text
[ 用户需求 ] ────→ [ 情绪冲突 ] ────→ [ 产品解决方案 ]
                                            │
[ 内容资产 ] ◄──── [ 平台表达 ] ◄──── [ 事实证据 (Ref) ]
```

1.  **用户需求 (User Need)**：精准识别用户在什么日常处境（When/Where/How）下面临的问题，寻找用户未满足的心理/生理渴望。
2.  **情绪冲突 (Emotional Conflict)**：提炼出用户最真实、最尖锐的「内心独白」（槽点、痛点、爽点等），表现理想状态与糟糕现状之间的强烈对比。
3.  **产品解决方案 (Product Solution)**：直接指出产品哪项“设计理念”或“版型方案”能够终止上述情绪冲突，让用户实现情绪转化。
4.  **事实证据 (Evidence)**：寻找绝对支撑该解决方案的物料铁证（检测报告、成分、高清实物图片、纤维结构等），确保叙事不是“吹嘘空谈”。
5.  **平台表达 (Platform Expression)**：针对小红书、抖音、淘宝详情、微信等不同的受众调性与分发场景，将方案重组成差异化的句式、排版与节奏（Playbook 映射）。
6.  **内容资产 (Content Assets)**：产出可直接投入分发执行的内容实体文件（脚本、标题库、钩子卡片等）。

---

## 二、 字段转译契约规范 (Schema Mapping)

为了实现该链路的变量化传导，在生成 `.scratch/content_strategy_brief.json` 和 parts 片段时，AI 必须严格对齐以下映射数据结构：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "NarrativeSpineStrategy",
  "type": "object",
  "required": [
    "user_need_id",
    "target_audience",
    "user_situation",
    "emotional_conflict",
    "product_solution",
    "evidence_refs"
  ],
  "properties": {
    "user_need_id": {
      "type": "string",
      "description": "格式如 NEED_01，表示需求识别编号"
    },
    "target_audience": {
      "type": "string",
      "description": "抽象目标人群描述"
    },
    "user_situation": {
      "type": "string",
      "description": "具体的穿戴或痛点发生处境"
    },
    "emotional_conflict": {
      "type": "object",
      "required": ["internal_monologue", "emotional_expectation"],
      "properties": {
        "internal_monologue": {
          "type": "string",
          "description": "必须用「书名号内嵌括号/双引号」包裹的买家内心真实槽点或渴望的独白文案"
        },
        "emotional_expectation": {
          "type": "string",
          "description": "情绪转化的终点期待"
        }
      }
    },
    "product_solution": {
      "type": "string",
      "description": "针对该痛点的产品物理解决方案描述"
    },
    "evidence_refs": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["source_file", "source_type", "evidence_excerpt", "confidence"],
        "properties": {
          "source_file": {
            "type": "string",
            "description": "物理文件名，如 dump.txt, size_chart.xlsx, manifest.json 等"
          },
          "source_type": {
            "type": "string",
            "enum": ["dump", "manifest", "image_plan", "manual"],
            "description": "证据类型"
          },
          "evidence_excerpt": {
            "type": "string",
            "description": "最核心的事实证据文本摘录、核心检测指标或纤维配比数据"
          },
          "confidence": {
            "type": "string",
            "enum": ["high", "medium", "low"],
            "description": "证据可信度评估"
          }
        }
      }
    }
  }
}
```

---

## 三、 手册章节（Parts）填充约束

在填充 `{SKU}.md` 或零件片段（Part 1-5）时，AI 填充的文本必须在**逻辑上与上述策略简报高度锚定**：

1.  **第一章（核心卖点）**：AI 编写的每个卖点描述，结构必须符合叙事脊柱：**【卖点标题】= `{产品解决方案}` → 【卖点描述】= `{用户处境}` + `{情绪冲突}` + `{如何改善}` → 【关键词】= 提炼核心事实。**
2.  **第四章（情绪转化矩阵）**：4.1 表格中的“内心独白”必须与简报中的 `internal_monologue` 保持语义深度对齐，禁止生成与简报中不符的脱靶独白。4.1 的“工艺/面料支撑”必须由简报中 `evidence_refs` 的 `evidence_excerpt` 映射生成。
3.  **第六、七章（营销策略与话术）**：产出的各平台内容方向与主播话术，其核心痛点共鸣环节必须完美承接第二章与第四章的情绪基调，严禁各章各唱各戏。
4.  **去同质化原则**：相同的物理事实（如同一块面料或成分）在不同平台翻译时，必须映射到不同的用户处境。例如：在小红书翻译为“穿搭出街的松弛感与高级光泽”；在抖音翻译为“耐穿抗皱、久坐不起褶的机能优势”；在淘宝主图翻译为“微廓显瘦、品质检测硬核认证”。
