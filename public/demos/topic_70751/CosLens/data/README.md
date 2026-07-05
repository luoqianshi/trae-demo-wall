# 商品库数据格式（CosLens 匹配 schema）

`products.json` 是一个数组，由真实商品库 `contact_lens_all.json` 经 `tools/transform.py` 自动转换生成。
每个商品对象字段如下：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一编号，如 "DOYA_001" / "CUPID_003" / "RECOLOOK_018" |
| name | string | 商品名 |
| series | string | 所属系列（星眸之约日抛 / ONE YEAR年抛 / 618系列 …） |
| image | string | 图片相对路径 `assets/products/{id}.jpg` |
| 瞳色主色 | string | 规范色名：蓝/青/绿/紫/粉/红/棕/灰/金/黄/橙/黑 |
| 显色度 | string | 低 / 中 / 高 |
| 直径 | string | 小 / 中 / 大（来自「着色直径 G.DIA」，缺失时回退镜片 DIA） |
| 风格 | string | 自然 / 混血 / 二次元 |
| desc | string | 原 pattern 描述（仅展示用，不参与打分） |
| color_raw | string | 原始颜色文案（留档） |

## 匹配维度（4 项，与 AI 输出对齐）
- **瞳色主色**（权重 0.40，最高）：分类匹配，近似色组给半分。
- **显色度 / 直径 / 风格**（0.25 / 0.20 / 0.15）：有序档位，相邻给半分。
- 真实数据无可靠「锁边 / 光学区」，已从模型移除，避免臆造噪声。

## 重新生成数据
修改源 JSON 或衍生规则后，重跑：

```
D:\python\python.exe tools\transform.py
```

## 商品图
- 放在 `assets/products/`，文件名与 `id` 一致（如 `DOYA_001.jpg`）。
- 图名可带后缀（`_doya` / `_eye_cupid` 等），入库脚本按 `前缀_编号` 归一，忽略后缀。
- 缺图时前端自动降级显示「无图」，不影响匹配。
