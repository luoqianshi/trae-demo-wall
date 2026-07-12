# 字漫画动画插件格式规范 v1.0

## 概述
本规范定义了字漫画编辑器动画预设插件的标准格式。任何符合本规范的 JSON 文件都可以作为动画插件导入到字漫画编辑器中。

## AI 生成指令（复制粘贴即用，100% 兼容）

```
请生成一个字漫画动画插件，严格按照以下所有要求输出纯JSON（不要任何额外文字、解释、代码块标记）：

【强制格式要求】
1. 顶层 format 字段必须为 "animation-preset-v1"
2. 必须包含 id, name, category, animations 字段
3. 每个动画必须包含 name, value, keyframes 字段
4. keyframes 使用对象格式，key为百分比，value为CSS属性对象
5. 所有transform属性的末尾必须包含以下三个CSS变量（顺序不能变）：
   rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))

【动画设计要求】
1. 动画效果流畅自然，适合文字/图片动画
2. 使用 CSS transform 和 opacity 属性为主
3. 入场动画(category="in")：iterationCount="1", fillMode="forwards"
4. 出场动画(category="out")：iterationCount="1", fillMode="forwards"
5. 预设动画(category="preset")：iterationCount="infinite", fillMode="none"
6. 每个动画有合理的 defaultDuration 和 timingFunction
7. **多字动画**：如需逐字符动画效果，设置 perChar=true、scatter（幅度）、scatterMode（模式）

【多字动画说明】
- 多字动画是指文字块中每个字符独立执行动画（如打散效果）
- perChar=true 的动画预览会显示词组而非单字
- scatterMode 可选值：radial/vertical/horizontal/wave/diagonal/spiral/bounce/random/implode/stagger/rain
- 预览词组自动循环显示（甲骨文、绚丽文字等12个）

【命名规范】
- id: 英文小写，用连字符，如 "jelly-animations"
- value: 小驼峰命名，如 "jellyBounce", "heartBeat"
- name: 中文2-4个字，简洁描述动画效果

动画主题：【在此处描述你想要的动画主题，例如：弹跳的果冻效果、心跳动画等】
插件名称：【插件中文名称，如：果冻动画包】
插件分类：preset（可选值：in=入场, out=出场, preset=预设动画, weight=字重）
作者：AI Generator
版本：1.0.0
```

## 插件格式规范

### 顶层结构

```json
{
  "format": "animation-preset-v1",
  "id": "插件唯一标识",
  "name": "插件名称",
  "description": "插件描述",
  "author": "作者名称",
  "version": "1.0.0",
  "category": "preset",
  "categoryName": "分类显示名称",
  "icon": "✨",
  "animations": []
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| format | string | 是 | 必须为 "animation-preset-v1" |
| id | string | 是 | 插件唯一标识，英文小写连字符，如 "jelly-animations" |
| name | string | 是 | 插件显示名称（中文） |
| description | string | 否 | 插件描述 |
| author | string | 否 | 作者名称 |
| version | string | 否 | 版本号，默认 "1.0.0" |
| category | string | 是 | 动画类型：in=入场, out=出场, preset=预设动画, weight=字重 |
| categoryName | string | 否 | 分类显示名称 |
| icon | string | 否 | 分类图标（emoji） |
| animations | array | 是 | 动画数组，见下方动画对象格式 |

### 动画对象格式

```json
{
  "name": "显示名称",
  "value": "动画唯一值",
  "description": "动画描述",
  "defaultDuration": "1s",
  "timingFunction": "ease-in-out",
  "iterationCount": "infinite",
  "fillMode": "none",
  "transformOrigin": "center center",
  "keyframes": {}
}
```

### 动画字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | 是 | - | 动画显示名称（中文，2-4字） |
| value | string | 是 | - | 动画唯一标识，小驼峰，如 "jellyBounce" |
| description | string | 否 | - | 动画效果描述 |
| defaultDuration | string | 否 | "1s" | 默认时长，如 "0.5s", "2s" |
| timingFunction | string | 否 | "ease-in-out" | 缓动函数 |
| iterationCount | string | 否 | "infinite" | 循环次数：infinite=无限, 1=播放1次 |
| fillMode | string | 否 | "none" | 填充模式：none/forwards/backwards/both |
| transformOrigin | string | 否 | "center center" | 变换原点 |
| keyframes | object | 是 | - | 关键帧定义，见下方 |
| perChar | boolean | 否 | false | **多字动画标记**。设为 true 时，文字块的每个字符独立动画，预览显示词组而非单字 |
| scatter | number | 否 | 0 | 打散幅度（像素），仅 perChar=true 时有效 |
| scatterMode | string | 否 | "radial" | 打散模式，仅 perChar=true 时有效，见下方打散模式列表 |

### 多字动画（perChar）

多字动画是指文字块中每个字符独立执行动画，而非整体动画。打散动画是多字动画的一种。

**定义方式**：在动画对象中设置 `perChar: true`

**预览文字**：所有多字动画统一使用以下预览词组（按卡片索引循环显示）：
- 甲骨文、绚丽文字、简体繁体、殷墟甲骨、绽光芒、乐乐乐、文承岁月、象形会意、情不朽、镂骨铭魂、社稷彰、买买买

**打散模式（scatterMode）**：
| 模式 | 说明 |
|------|------|
| radial | 辐射飞散（向四周爆炸） |
| vertical | 上下交替飞散 |
| horizontal | 左右交替飞散 |
| wave | 波浪式起伏飞散 |
| diagonal | 斜向飞散 |
| spiral | 螺旋飞散 |
| bounce | 弹跳式飞散 |
| random | 随机方向飞散 |
| implode | 向内汇聚（从外围向中心） |
| stagger | 错位飞散（按顺序错开） |
| rain | 雨滴飞散（向下） |

**多字动画示例**：
```json
{
  "name": "爆炸打散",
  "value": "explodeShatter",
  "perChar": true,
  "scatter": 60,
  "scatterMode": "radial",
  "keyframes": {
    "0%": { "transform": "scale(1)", "opacity": "1" },
    "50%": { "transform": "scale(1.3)", "opacity": "1" },
    "100%": { "transform": "scale(1)", "opacity": "1" }
  }
}
```

### 关键帧格式（推荐：对象格式）

```json
"keyframes": {
  "0%, 100%": {
    "transform": "scale(1) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
  },
  "50%": {
    "transform": "scale(1.2) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
  }
}
```

### 关键帧格式（字符串格式，兼容）

```json
"keyframes": "0%,100%{transform:scale(1) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1))}50%{transform:scale(1.2) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1))}"
```

### 重要规则

1. **必须保留的 CSS 变量**（每个transform的末尾都要有，顺序不能变）：
   - `rotate(var(--rotate-angle, 0deg))` - 旋转角度
   - `scaleX(var(--flip-scale-x, 1))` - 水平翻转（-1表示翻转）
   - `scaleY(var(--flip-scale-y, 1))` - 垂直翻转（-1表示翻转）

2. **transform 写法规范**：
   ```
   transform: [其他变换，如translate/scale/skew等] rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))
   ```
   
   确保 rotate 和 scaleX/scaleY 在 transform 的末尾。

3. **支持的 CSS 属性**：
   - `transform` - 变换（translate, scale, rotate, skew, perspective 等）
   - `opacity` - 透明度
   - `filter` - 滤镜（blur, brightness, drop-shadow 等）
   - `font-variation-settings` - 字重变化（仅限 weight 分类）

4. **分类对应规则**：
   - `in` - 入场动画：播放1次后停留在结束状态
   - `out` - 出场动画：播放1次后停留在结束状态
   - `preset` - 预设动画：无限循环播放
   - `weight` - 字重动画：需要字体支持可变字重

5. **时长规范**：
   - 循环动画：0.2s - 3s
   - 入场动画：0.3s - 1s
   - 出场动画：0.3s - 1s

6. **缓动函数参考**：
   - `ease` - 默认缓动
   - `ease-in` - 缓入
   - `ease-out` - 缓出
   - `ease-in-out` - 缓入缓出
   - `linear` - 线性
   - `cubic-bezier(x1,y1,x2,y2)` - 自定义贝塞尔曲线

## 完整示例

```json
{
  "format": "animation-preset-v1",
  "id": "jelly-animations",
  "name": "果冻动画包",
  "description": "Q弹果冻效果动画",
  "author": "AI Generator",
  "version": "1.0.0",
  "category": "preset",
  "categoryName": "果冻动画",
  "icon": "🍮",
  "animations": [
    {
      "name": "果冻弹",
      "value": "jellyBounce",
      "description": "果冻弹跳效果",
      "defaultDuration": "0.8s",
      "timingFunction": "ease-in-out",
      "iterationCount": "infinite",
      "fillMode": "none",
      "transformOrigin": "center bottom",
      "keyframes": {
        "0%, 100%": {
          "transform": "scaleY(1) scaleX(1) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
        },
        "30%": {
          "transform": "scaleY(0.8) scaleX(1.2) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
        },
        "50%": {
          "transform": "scaleY(1.1) scaleX(0.9) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
        },
        "70%": {
          "transform": "scaleY(0.95) scaleX(1.05) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
        }
      }
    },
    {
      "name": "心跳",
      "value": "heartBeat",
      "description": "心跳动画效果",
      "defaultDuration": "1s",
      "timingFunction": "ease-in-out",
      "iterationCount": "infinite",
      "fillMode": "none",
      "transformOrigin": "center center",
      "keyframes": {
        "0%, 100%": {
          "transform": "scale(1) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
        },
        "14%": {
          "transform": "scale(1.1) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
        },
        "28%": {
          "transform": "scale(1) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
        },
        "42%": {
          "transform": "scale(1.1) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
        },
        "70%": {
          "transform": "scale(1) rotate(var(--rotate-angle, 0deg)) scaleX(var(--flip-scale-x, 1)) scaleY(var(--flip-scale-y, 1))"
        }
      }
    }
  ]
}
```

## 插件使用方法

### 方法一：通过 index.json 注册（推荐）

1. 将生成的 JSON 文件保存到 `animpresets/` 文件夹
2. 在 `animpresets/index.json` 的 `customPlugins` 数组中添加：
   ```json
   {
     "id": "jelly-animations",
     "file": "jelly-animations.json",
     "name": "果冻动画包"
   }
   ```
3. 刷新页面，动画自动加载

### 方法二：通过 JS API 动态注册

```javascript
// 从 URL 加载
AnimPluginLoader.loadPluginFromURL('path/to/plugin.json');

// 从文件（用户上传）
AnimPluginLoader.loadPluginFromFile(fileObject);

// 直接注册数据
AnimPluginLoader.registerPlugin(pluginData);
```

## 验证清单

生成插件后，请检查以下项目确保100%兼容：

- [ ] format 字段为 "animation-preset-v1"
- [ ] 有唯一的 id（英文小写连字符）
- [ ] category 为 in/out/preset/weight 之一
- [ ] animations 数组非空
- [ ] 每个动画都有 name（中文）和 value（小驼峰英文）
- [ ] 每个动画的 keyframes 都是有效对象
- [ ] 每个 transform 末尾都包含 --rotate-angle, --flip-scale-x, --flip-scale-y 三个变量
- [ ] 入场/出场动画的 iterationCount 为 "1"，fillMode 为 "forwards"
- [ ] 预设动画的 iterationCount 为 "infinite"

## 注意事项

1. 所有动画的 keyframes 的 transform 中必须包含 `--rotate-angle` 和 `--flip-scale-x/--flip-scale-y` 变量
2. transform 中变量的顺序要保持一致，确保旋转和翻转功能正常工作
3. 入场动画（in类型）的 iterationCount 建议为 "1"，fillMode 建议为 "forwards"
4. 出场动画（out类型）的 iterationCount 建议为 "1"，fillMode 建议为 "forwards"
5. 预设动画（preset类型）默认为无限循环
6. value 值不能与现有动画重复，否则可能导致冲突
7. 建议使用 transform 和 opacity 属性实现动画，性能更好
