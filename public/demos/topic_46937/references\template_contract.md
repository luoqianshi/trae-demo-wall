# 模板结构契约 (Template Contract)

本文件是手册生成的**结构校验契约**，只约束章节结构和标题，不约束 HTML 视觉样式。

HTML 视觉样式规则已迁移至 `html_render_contract.md` 和 `references/render_components/`。

---

## 1. Hero Banner 结构标记

在 `{SKU}.html` 中，Hero Banner 由渲染器自动注入。`{SKU}.md` 中只需保留：

```markdown
<!-- Hero Banner -->
```

在 `{SKU}.html` 中必须包含：
- `<!-- Hero Banner -->` 注释
- `商品数字身份信息`
- `Product Digital Identity`

禁止：
- 用商品图片作为 Hero 背景
- Hero 中出现 `<img src=`
- 修改渐变色值或背景样式（由主题包控制）

---

## 2. 固定章节标题清单（必须精确匹配）

```
## 基础信息
## 一、核心卖点
### 1.1 AI提炼核心卖点
### 1.2 设计师卖点原文
## 二、全域人群画像
### 2.1 基础属性
### 2.2 行为DNA
### 2.3 决策旅程
## 三、全域场景分析
### 3.1 场景矩阵
### 3.2 平台内容策略
## 四、全域情绪转化矩阵
### 4.1 买家心理五维图谱
### 4.2 情绪→内容转化钩子矩阵
### 4.3 全域内容脚本速查卡
## 五、产品展示与搭配库
### 5.1 颜色展示
### 5.2 棚拍展示
### 5.3 外景展示
### 5.4 搭配方案展示
## 六、营销方向与传播建议
### 6.1 小红书策略
### 6.2 抖音策略
### 6.3 天猫策略
### 6.4 微信视频号策略
## 七、主播通用穿搭与话术模版
### 7.1 主播视觉 setup
### 7.2 开场钩子（0-30s）
### 7.3 痛点共鸣（30s-2min）
### 7.4 卖点展示（2-4min）
### 7.5 逼单成交（4-5min）
## 八、品牌与产品资质
### 8.1 面料工艺与资质展示
### 8.2 品牌资质与检测报告
## 九、尺码参考
## 十、相关素材文件索引
### 10.1 图片素材
### 10.2 文本/表格/文档素材
### 10.3 视频素材
```

5.5 设计灵感参考为可选章节，有素材时才出现。

---

## 3. 禁止出现的标题/结构

以下内容出现即为违规：

```
# 一、核心卖点          (应为 ## 一、核心卖点)
## 基础信息速查表        (应为 ## 基础信息)
### 🏆 主干卖点
### 1.3 卖点对比矩阵     (模板无此章节)
## 6.1 核心传播主张      (应为 ### 6.1 小红书策略)
## 6.2 内容营销矩阵
## 6.3 投放策略
## 6.4 促销活动建议
## 7.1 主播穿搭建议      (应为 ### 7.1 主播视觉 setup)
## 7.2 话术模版库
## 7.3 FAQ 应答库
## 8.2 工艺细节          (应为 ### 8.2 品牌资质与检测报告)
## 8.3 品质背书          (模板无此章节)
<!DOCTYPE html>
<html
<head
<style
<body
```

---

## 4. 双格式表格规则

### 4.1 Clean MD 内容源

在 `{SKU}.md` 和 `.scratch/parts/part_*.md` 中，所有主要信息表必须使用原生 Markdown 表格：

```markdown
| 字段 | 内容 |
|---|---|
| 示例 | 示例内容 |
```

禁止在 Clean MD 中使用 `<table>`、`<tr>`、`<td>`、`style`、`class` 等 HTML 视觉结构。

### 4.2 HTML 渲染视图

在 `{SKU}.html` 中，渲染器可以根据 `html_render_contract.md`、`render_components/`、`html_themes/` 将 Markdown 表格渲染为渐变表头、高奢卡片、Flex/Grid 等视觉组件。

HTML 视觉增强只能发生在 render-html 阶段，不得反向污染 `{SKU}.md` 或 parts 源文件。

---

## 5. 图片组件规则

第 5 章所有图片必须由 `image-snippet` 生成。

在 `{SKU}.md` 中：
- 第5章必须净化为由标准图片引用的无序列表（棚拍/外景）或标准表格。
- 禁止 AI 手写 5.1/5.2/5.3/5.4 图片 HTML。

在 `{SKU}.html` 中：
- 所有 `<img>` 必须包含在 `pdh-image-box` 内，使用 `object-fit: contain`。
- 禁止 `height: auto` 旧式裸图。
- 禁止在第5章使用 `<table>/<tr>/<td>` 排版图片。

---

## 6. AI 推断提示

第 2-4 章、第 6-7 章开头必须包含 AI 推断提示：

```markdown
> 💡 **提示**：本章节内容由 AI 基于产品素材推断生成，仅供参考。<!-- pdh:component=ai_inference_badge -->
```

---

## 7. 底部声明

必须包含：
- 文档生成时间
- 版本 v1.0
- 声明（AI 生成仅供参考）

---

## 8. 第5章图片展示排版契约

1. 第5章图片 HTML 必须由 `image-snippet` action 生成，禁止 AI 手写。
2. 禁止在第5章使用 `<table>` / `<tr>` / `<td>`。
3. 禁止裸 `<img>` — 所有图片必须在 `pdh-image-box` 内。
4. 所有 `<img>` 必须使用 `object-fit: contain`，禁止 `height: auto` 旧式裸图。
5. 必须包含模块标记 class：
   - `pdh-section-51` / `pdh-section-52` / `pdh-section-53` / `pdh-section-54`
6. 5.4 必须包含结构 class：
   - 新版手册强制要求使用黄金比例 Flex 布局组件：`pdh-outfit-container` / `pdh-outfit-left` / `pdh-outfit-right` / `pdh-outfit-desc-box` / `pdh-material-card-row`
   - legacy 手册平滑向下兼容：允许使用旧版 class（`pdh-outfit-block` 与 `pdh-material-grid`），但在 validate 时抛出 P1 legacy warning，不做 P0 阻断。
7. 禁止出现 "配饰亮点：配饰亮点" 重复。
8. gallery 渲染数量必须不小于 `image_selection_plan.json` 中最终入选数量。
9. `validate --format html` 必须检查以上规则（Section 8）。
10. **5.2 棚拍 / 5.3 外景必须默认使用 3:4 竖版容器**：
    - `pdh-image-box` 上必须带 `pdh-ar-3-4` class 和 `aspect-ratio: 3 / 4` 样式。4:3 仅限横向宽图。
    - 3:4 和 4:3 都是容器比例，不是裁切原图。继续保持 `object-fit: contain`，允许留白，禁止使用 `object-fit: cover`。
11. **5.4 搭配物料一物一图**：
    - 同一 outfit 内，同一 `display_name` 的物品只允许入选 1 张。
    - 同一物品的其他角度图必须放入 `excluded_candidates`，`exclude_reason` 使用 `duplicate_item_other_angle` 或 `same_item_redundant_view`。
    - `validate --format html` 检查同 outfit 内 `display_name` 重复时直接 fail。
12. **5.3 外景数量收敛**：
    - 5.3 每个 scene block 最多 6 张，不限制全部 5.3 总数。
