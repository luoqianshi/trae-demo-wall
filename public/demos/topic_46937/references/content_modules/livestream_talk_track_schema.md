> 本文件为通用方法论/Schema/Playbook 文件，禁止写入任何具体 SKU、商品名、品牌名、设计师/搭配师姓名、固定图片路径、固定面料、固定颜色、固定品类案例。所有表达必须使用 `{变量}`、字段定义或抽象规则。

# 直播话术轨道数据模型规范 (Livestream Talk Track Schema)

本文件定义了针对任何品类商品的直播间 5 分钟循环话术（Livestream Talk Track）的数据结构与规范。它用于约束 AI 在生成手册第七章《主播通用穿搭与话术模版》和 `.scratch/content_strategy_brief.json` 时，输出符合直播零售心理学的高效话术模板。

---

## 一、 直播间 5 分钟黄金循环节奏 (5-Min Gold Loop)

直播话术必须按照科学的人货匹配心理学，划分为以下四个严密推进的黄金时间段：

```text
  0s ─────── 30s ────────────────── 2min ────────────────── 4min ────────── 5min
  ┌──────────────┬──────────────────┬──────────────────┬──────────────────┐
  │  1. 抓眼球   │    2. 切痛点     │    3. 秀卖点     │     4. 逼单      │
  │  (0 - 30s)   │ (30s - 2min)     │   (2 - 4min)     │   (4 - 5min)     │
  │  极速吸睛    │  情感共鸣/刺痛   │ 物理方案/科学证明│  库存告急/利诱   │
  └──────────────┴──────────────────┴──────────────────┴──────────────────┘
```

1.  **第一环节：抓眼球 (0-30s) — 惊艳与好奇**
    *   **核心动作**：拉伸展示面料弹性、镜头展示成分标签或质检证书、快速多色展示。
    *   **话术要点**：抛出 Hook，制造视觉拉力。
2.  **第二环节：切痛点 (30s-2min) — 共鸣与认同**
    *   **核心动作**：主播贴近镜头，用生动的肢体动作还原消费者日常勒腰、闷汗、臃肿等尴尬姿态。
    *   **话术要点**：使用生动的内心独白，唤醒消费者的场景危机感。
3.  **第三环节：秀卖点 (2-4min) — 心动与渴望**
    *   **核心动作**：展示细节实拍、讲解面料成分数据、搭配不同单品展示多元场域泛化力。
    *   **话术要点**：精准将物理属性转化为消费者日常解决方案，罗列硬核检测证据。
4.  **第四环节：逼单成交 (4-5min) — 紧迫感与决策**
    *   **核心动作**：主播贴近镜头展示专属价格标、大喊库存倒计时、引导客服私信核对尺码。
    *   **话术要点**：消除最后的试错成本，催促立即付款。

---

## 二、 直播话术轨道 Schema (JSON Schema Structure)

在生成直播话术包和填充 7.2-7.5 章节时，其底层数据结构必须符合以下 Schema：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LivestreamTalkTrackAsset",
  "type": "object",
  "required": ["sku_placeholder", "loop_segments"],
  "properties": {
    "sku_placeholder": {
      "type": "string",
      "description": "通常为 {SKU} 变量"
    },
    "loop_segments": {
      "type": "object",
      "required": ["hook_segment", "pain_segment", "selling_segment", "cta_segment"],
      "properties": {
        "hook_segment": {
          "type": "object",
          "required": ["time_range", "physical_action", "tone", "script_template"],
          "properties": {
            "time_range": { "type": "string", "default": "0-30s" },
            "physical_action": { "type": "string", "description": "主播身体与物料配合动作" },
            "tone": { "type": "string", "default": "惊艳+好奇" },
            "script_template": { "type": "string", "description": "口播话术，内含变量" }
          }
        },
        "pain_segment": {
          "type": "object",
          "required": ["time_range", "physical_action", "tone", "script_template"],
          "properties": {
            "time_range": { "type": "string", "default": "30s-2min" },
            "physical_action": { "type": "string", "description": "痛点还原身体细节" },
            "tone": { "type": "string", "default": "共鸣+认同" },
            "script_template": { "type": "string", "description": "口播话术，内含变量" }
          }
        },
        "selling_segment": {
          "type": "object",
          "required": ["time_range", "physical_action", "tone", "script_template"],
          "properties": {
            "time_range": { "type": "string", "default": "2-4min" },
            "physical_action": { "type": "string", "description": "细节微距展示与搭配展示" },
            "tone": { "type": "string", "default": "心动+渴望" },
            "script_template": { "type": "string", "description": "口播话术，内含变量" }
          }
        },
        "cta_segment": {
          "type": "object",
          "required": ["time_range", "physical_action", "tone", "script_template"],
          "properties": {
            "time_range": { "type": "string", "default": "4-5min" },
            "physical_action": { "type": "string", "description": "指引小黄车或专属客服" },
            "tone": { "type": "string", "default": "紧迫感+行动力" },
            "script_template": { "type": "string", "description": "口播话术，内含变量" }
          }
        }
      }
    }
  }
}
```

---

## 三、 主播话术去同质化要求

*   **口播语气语感校验**：话术应使用极富感染力、短句交替的“直播间现场大白话”，绝对禁止输出大段死板的书面说明文字。
*   **句式规范**：在 7.2-7.5 的话术文本中，多使用“姐妹们”、“你看它这个...”、以及强烈的情感叹号。同时，痛点话术段必须包含至少一处用双引号或中括号引用的“内心痛点呼唤”，以深度切合消费心理。
