> 本文件为通用方法论/Schema/Playbook 文件，禁止写入任何具体 SKU、商品名、品牌名、设计师/搭配师姓名、固定图片路径、固定面料、固定颜色、固定品类案例。所有表达必须使用 `{变量}`、字段定义或抽象规则。

# 钩子库数据模型规范 (Hook Bank Schema)

本文件定义了针对任何品类商品的内容叙事钩子库（Hook Bank）的数据结构与规范。它用于约束 AI 在生成平台衍生内容时，输出具有强吸引力、契合心理学规律且格式规整的开场文案。

---

## 一、 核心钩子分类 (Hook Classifications)

所有生成的钩子文案必须归属于以下四种核心类型之一：

1.  **场景代入钩子 (Scene Hook)**：通过精准描写一个用户日常极易感同身受的尴尬或忙碌片断，将用户拉入预设处境中。
2.  **情绪冲突钩子 (Emotional Hook)**：直接表露消费者的内心敏感面、槽点或身材隐性焦虑，激发心理共鸣。
3.  **对比反差钩子 (Comparison Hook)**：用普通产品的不良体验与本品的极致解决方案进行视觉或话术上的强烈对比。
4.  **硬核悬念钩子 (Suspense Hook)**：通过抛出一个颠覆常识的科学质检事实、价格反差或面料特性，引发消费者的强烈求知欲。

---

## 二、 钩子库数据 Schema (JSON Schema Structure)

在生成钩子库资产包时，数据必须 100% 对齐并符合以下 JSON Schema：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HookBankAsset",
  "type": "object",
  "required": ["sku_placeholder", "hooks"],
  "properties": {
    "sku_placeholder": {
      "type": "string",
      "description": "通常为 {SKU} 变量"
    },
    "hooks": {
      "type": "array",
      "minItems": 4,
      "items": {
        "type": "object",
        "required": ["hook_id", "hook_type", "platform_target", "hook_headline", "hook_body", "visual_cue"],
        "properties": {
          "hook_id": {
            "type": "string",
            "description": "格式如 HOOK_01"
          },
          "hook_type": {
            "type": "string",
            "enum": ["scene_hook", "emotional_hook", "comparison_hook", "suspense_hook"]
          },
          "platform_target": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["xiaohongshu", "douyin", "tmall", "wechat"]
            },
            "description": "该钩子最适用的分发平台"
          },
          "hook_headline": {
            "type": "string",
            "maxLength": 30,
            "description": "吸睛的短标题/视频花字文案"
          },
          "hook_body": {
            "type": "string",
            "description": "具体的口播话术或笔记前两行正文，必须包含 {变量}，内心独白使用「...」"
          },
          "visual_cue": {
            "type": "string",
            "description": "视频画面或首图视觉的明确配合建议"
          }
        }
      }
    }
  }
}
```

---

## 三、 编写约束与合规要求

1.  **禁止出现占位符残留**：生成的 `hook_body` 内如果包含变量，在与商品素材合并时必须全部完成置换，在最终资产中不得出现未被置换的括号。
2.  **视觉与听觉联动**：每个生成的钩子必须配备非空的 `visual_cue`（画面配合暗示），例如：【镜头特写腰部拉伸动作】或【展示质检证书数据并放大】，防止画面与文案脱节。
3.  **同义词库强联动**：在编写 `hook_body` 时，涉及舒适、显瘦等词汇时，必须强制优先读取 `synonym_dictionary.md` 中的高端词库。
