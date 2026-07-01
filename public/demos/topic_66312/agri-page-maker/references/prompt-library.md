# 图片 Prompt 库（真实摄影风格）

> 所有 prompt 都遵循：**真实摄影 + 自然光 + 真实产地特征 + 强细节**。
> 调用方式：使用 `GenerateImage` 工具，传入 prompt 和 image_size。

## 通用前缀

每个 prompt 末尾都追加：
```
professional food photography, realistic, no illustration, no cartoon, no 3D render, no watermark, no text, no logo, no people
```

## 按区块类型分类

### 1. Hero 主图

**用途**：页面顶部大图，单一产品主体。

**T1 暗调模板**：
```
Professional food photography of {产品英文名}, single {产品} on a dark moody background, dramatic side lighting, shallow depth of field, hero shot, vertical composition, 4:3 aspect ratio, ultra detailed texture, dark slate surface, no text
```

**T2/T3 亮调模板**：
```
Professional food photography of fresh {产品英文名}, bright natural daylight, soft window light, clean white wooden table, fresh dewdrops, vertical composition, 4:3 aspect ratio, vivid natural colors, appetizing, no text
```

**T4 杂志模板**：
```
Editorial still life photography of {产品英文名}, minimalist composition, soft overcast light, off-white linen background, single subject, Kinfolk magazine style, vertical 4:3, muted tones, no text
```

### 2. 产地风景

```
Real landscape photograph of {产地}, {地形}，{季节}，{气候特征}，{时段} light, golden hour, no people, 16:9 widescreen, shot on Sony A7R IV, high detail
```

示例（新疆小白杏）：
```
Real landscape photograph of Xinjiang Akesu region, snow-capped Tianshan mountains in background, apricot orchard in foreground, summer afternoon, golden hour light, no people, 16:9 widescreen
```

### 3. 产品细节 / 切面

```
Macro food photography of {产品} cross-section, showing internal texture and color, soft natural light, shallow depth of field, on rustic wooden board, 1:1 square, ultra detailed
```

### 4. 视觉特征 2x2（4 张）

```
Close-up photography of {产品}, showing {特征1}, {特征2}, {特征3}, on neutral background, soft light, 1:1 square, realistic, food photography
```

### 5. 挑选方式（4 张）

```
Overhead photography of {产品} selection guide, showing {判断维度1} vs {判断维度2}, clean minimal background, instructional photo, soft daylight, 1:1 square
```

### 6. 菜谱成品

```
Professional food photography of {菜名}, freshly cooked, served on ceramic plate, garnished with {配菜}, warm natural light, steam visible, appetizing, 16:9 widescreen, no text
```

### 7. 包装 / 礼盒

```
Product photography of {产品} gift box, kraft paper box with {产品} illustration, premium packaging, studio softbox lighting, white background, 1:1 square, e-commerce style, no people
```

### 8. 产地大图（横版）

```
Panoramic landscape photograph of {产地} in {季节}, showing {地形} and {作物} field, soft morning mist, 21:9 ultrawide, no people, ultra high detail
```

### 9. 氛围背景图（温馨提示用）

```
Atmospheric bokeh background of {产品} orchard, warm golden hour, soft focus, 16:9 widescreen, no text, no logo
```

## 真实产地特征词典

调用前把中文产地翻译为英文 + 加上该地区典型地理特征：

| 中文产地 | 英文 | 典型特征 |
|---|---|---|
| 新疆阿克苏 | Xinjiang Akesu | Tianshan mountains, loess, arid, 2800h sunshine |
| 山东蒙阴 | Shandong Mengyin | hilly, loess plateau, temperate monsoon |
| 丹东 | Dandong | humid, riverside, 90% humidity |
| 云南 | Yunnan | highland, plateau, eternal spring |
| 海南 | Hainan | tropical, seaside, 25°C year-round |
| 章丘 | Zhangqiu | plain, spring water, Shandong |
| 烟台 | Yantai | coastal, hilly, marine climate |
| 褚橙/哀牢山 | Ailao Mountain | high altitude, 1500m, big diurnal temperature |

## 负面词（必须包含）

```
no illustration, no cartoon, no 3D render, no watermark, no text, no logo, no people, no hands
```

## 尺寸速查

| 区块 | 推荐 size |
|---|---|
| Hero | `portrait_4_3` 或 `landscape_16_9` |
| 产地风景 / 大图 | `landscape_16_9` |
| 2x2 网格 / 挑选 | `square_hd` |
| 圆形图（徽章） | `square_hd` |
| 菜谱成品 | `landscape_16_9` |
| 包装 | `square_hd` |
| 氛围背景 | `landscape_16_9` |

## 调用示例

生成新疆小白杏 Hero（暗调）：
```
调用 GenerateImage 工具：
- prompt: "Professional food photography of small white apricot, single apricot on dark moody background, dramatic side lighting, shallow depth of field, hero shot, 4:3 aspect ratio, ultra detailed texture, dark slate surface, professional food photography, realistic, no illustration, no cartoon, no 3D render, no watermark, no text"
- image_size: "portrait_4_3"
- path: "pages/xinjiang-xiaobai-xing/assets/hero.jpg"
```
