> 本文件为通用方法论/Schema/Playbook 文件，禁止写入任何具体 SKU、商品名、品牌名、设计师/搭配师姓名、固定图片路径、固定面料、固定颜色、固定品类案例。所有表达必须使用 `{变量}`、字段定义或抽象规则。

# 选题库数据模型规范 (Topic Bank Schema)

本文件定义了针对任何品类商品的内容营销选题库（Topic Bank）的数据结构与规范。它用于指导 AI 智能体在深入理解商品事实后，产出符合各平台流量推荐机制的爆款选题与选题大纲。

---

## 一、 选题库分类 (Topic Classifications)

选题应涵盖以下三个核心流量方向：

1.  **痛点攻克选题 (Pain-Point Solution Topic)**：以解答用户穿搭痛点、解决身材短板、提供功能性干货为主的选题。
2.  **生活美学选题 (Aesthetic Lifestyle Topic)**：以传达静奢态度、展示高规格搭配灵感、提供精致生活场景穿搭为主的科普性选题。
3.  **品质证言选题 (Quality Proof Topic)**：以解构面料科技、剖析设计工艺细节、展示质检实验或检测证书为主的理性说服选题。

---

## 二、 选题库数据 Schema (JSON Schema Structure)

在生成选题库资产包时，数据必须 100% 对齐并符合以下 JSON Schema：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TopicBankAsset",
  "type": "object",
  "required": ["sku_placeholder", "topics"],
  "properties": {
    "sku_placeholder": {
      "type": "string",
      "description": "通常为 {SKU} 变量"
    },
    "topics": {
      "type": "array",
      "minItems": 3,
      "items": {
        "type": "object",
        "required": [
          "topic_id",
          "topic_category",
          "topic_title",
          "target_audience",
          "platform_angles"
        ],
        "properties": {
          "topic_id": {
            "type": "string",
            "description": "格式如 TOPIC_01"
          },
          "topic_category": {
            "type": "string",
            "enum": ["pain_point_solution", "aesthetic_lifestyle", "quality_proof"]
          },
          "topic_title": {
            "type": "string",
            "maxLength": 40,
            "description": "核心选题标题（高吸引力）"
          },
          "target_audience": {
            "type": "string",
            "description": "核心受众人群"
          },
          "platform_angles": {
            "type": "object",
            "required": ["xiaohongshu", "douyin", "tmall_taobao"],
            "properties": {
              "xiaohongshu": {
                "type": "object",
                "required": ["angle_title", "content_outline"],
                "properties": {
                  "angle_title": { "type": "string", "description": "符合小红书松弛种草风格的笔记标题" },
                  "content_outline": { "type": "string", "description": "笔记图文大纲与标签策略" }
                }
              },
              "douyin": {
                "type": "object",
                "required": ["angle_title", "video_flow"],
                "properties": {
                  "angle_title": { "type": "string", "description": "符合抖音黄金节奏的视频标题/花字" },
                  "video_flow": { "type": "string", "description": "快节奏口播脚本概要与画面设计" }
                }
              },
              "tmall_taobao": {
                "type": "object",
                "required": ["angle_title", "graphic_strategy"],
                "properties": {
                  "angle_title": { "type": "string", "description": "符合淘系理性的详情页子模块标题" },
                  "graphic_strategy": { "type": "string", "description": "排版与图文细节背书文案策略" }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 三、 跨平台差异化转译契约

*   **去同质化强校验**：引擎在进行 `validate-content-brief` 校验时，将重点扫描 `platform_angles` 内的各个子项。若小红书与抖音的 `angle_title` 或内容大纲重合度高于 30%，将触发合规警告，促使 AI 依据各平台 Playbook 重写不同侧重点的转译文案。
*   **素材真实承接**：`quality_proof` 类选题中，必须包含对面料工艺、纤维比例的精准罗列，必须能在 `{SKU}.md` 第八章找到 100% 对应的物理证据。
