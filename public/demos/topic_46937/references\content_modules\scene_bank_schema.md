> 本文件为通用方法论/Schema/Playbook 文件，禁止写入任何具体 SKU、商品名、品牌名、设计师/搭配师姓名、固定图片路径、固定面料、固定颜色、固定品类案例。所有表达必须使用 `{变量}`、字段定义或抽象规则。

# 场景库数据模型规范 (Scene Bank Schema)

本文件定义了针对任何品类商品的场景分析库（Scene Bank）的数据结构与规范。它用于约束 AI 在生成手册第三章《全域场景分析》和 `.scratch/content_strategy_brief.json` 时，将物理环境转化为具有张力的情绪转化场景。

---

## 一、 场景库核心叙事四要素 (Four Elements of Scene Narrative)

每一个被收录的场景必须包含完整的叙事四要素，缺失任意要素将导致质量审计扣分：

1.  **用户处境 (User Situation)**：具体的空间、时间或所扮演的社会角色（如：冷气充足的写字楼、高频转场的出差途中、周末轻松的户外露营）。
2.  **需求触发细节 (Triggering Event)**：由于外界环境或姿态变化，导致现有物理缺陷瞬间放大的动作细节（如：长时间坐在办公椅上导致腰腹部被裤腰无情卡住、从冷气房走到室外导致冷热交替的不适、快速抬手臂时衣角不自然地缩短上滑）。
3.  **产品介入与改善 (Product Intervention)**：产品哪项特定的物理材料、版型或缝纫工艺立即介入，阻止了尴尬局面的恶化（如：利用弹力纤维的弹性缓冲消解了腰部挤压、采用透气高湿排汗面料快速带走汗汽、立体微落肩裁剪放宽了手臂活动度）。
4.  **情绪转化终点 (Emotional Transformation)**：用户生理上获得舒适后，在心理和社交上重拾的高奢自信状态（如：重获从容得体、自在专注于工作、展现随性不着痕迹的品味）。

---

## 二、 场景库数据 Schema (JSON Schema Structure)

在生成场景库及填充 3.1 表格时，其底层 JSON 数据结构必须符合以下规范：

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SceneBankAsset",
  "type": "object",
  "required": ["sku_placeholder", "scenes"],
  "properties": {
    "sku_placeholder": {
      "type": "string",
      "description": "通常为 {SKU} 变量"
    },
    "scenes": {
      "type": "array",
      "minItems": 2,
      "items": {
        "type": "object",
        "required": [
          "scene_id",
          "scene_category",
          "user_situation",
          "trigger_event",
          "product_intervention",
          "emotional_transformation"
        ],
        "properties": {
          "scene_id": {
            "type": "string",
            "description": "格式如 SCENE_01"
          },
          "scene_category": {
            "type": "string",
            "description": "场景大类，如商务通勤、商旅转场、周末休闲等"
          },
          "user_situation": {
            "type": "string",
            "description": "何时、何地、何种处境"
          },
          "trigger_event": {
            "type": "string",
            "description": "具体动作或痛点触发点，需生动细腻"
          },
          "product_intervention": {
            "type": "string",
            "description": "对应产品的物理纤维/版型工艺改善描述"
          },
          "emotional_transformation": {
            "type": "string",
            "description": "转化后的轻松/体面/自信状态描述"
          }
        }
      }
    }
  }
}
```

---

## 三、 表格映射规范

在 `{SKU}.md` 3.1 场景矩阵中，虽然保留了原有的表格表头（场景类别 / 具体场景 / 痛点需求），但 AI 填充的每个单元格必须依照此 Schema 进行语义级拼装：
*   **【场景类别】** = `scene_category`
*   **【具体场景】** = `user_situation` + `trigger_event`
*   **【痛点需求】** = `product_intervention` + `emotional_transformation`
通过这种方式，既保全了旧有表头校验的 100% 通过，又暗中嵌入了用户需求驱动的完整叙事脊柱。
