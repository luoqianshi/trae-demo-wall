# 刷题系统 — 题目 JSON 格式说明

> 本文档定义导入刷题系统所需的 JSON 数据格式。按照此格式准备题库后，使用 `数据转换工具.py` 即可一键生成刷题网页。

---

## 一、选择题 JSON 格式 (`*_choices.json`)

### 完整示例

```json
[
  {
    "id": 1,
    "chapter": "第1章 信息化发展",
    "question": "广义的信息技术可以追溯到多久以前？",
    "options": [
      "A. 1000—2000年前",
      "B. 2000—3000年前",
      "C. 3500—5000年前",
      "D. 5000—7000年前"
    ],
    "answer": "C",
    "explanation": "教材指出：广义的信息技术可以追溯到3500—5000年前人类语言的形成和使用。"
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | int | ✅ | 题号，建议从1开始递增，用于定位和错题记录 |
| `chapter` | string | ✅ | 章节名称，用于筛选和分类，如 `"第1章 信息化发展"` |
| `question` | string | ✅ | 题目内容，纯文本 |
| `options` | string[] | ✅ | 选项数组，每个选项以字母开头，如 `"A. 选项内容"` |
| `answer` | string | ✅ | 正确答案的字母，如 `"C"`（不包含点号） |
| `explanation` | string | 推荐 | 答案解析，可为空字符串 |

### 注意事项

1. **根元素必须是数组** `[...]`
2. **`id` 必须唯一**，重复的 id 会在合并时被去重（保留先出现的）
3. **`options` 至少 2 个**，不超过 8 个（前端支持 A-H）
4. **`answer` 值**必须在选项的字母范围内（如选项有 A/B/C/D，answer 只能是 A/B/C/D 之一）
5. **`chapter` 建议统一命名**，同一章节使用完全相同的名称，否则筛选时会视为不同章节

---

## 二、案例分析题 JSON 格式 (`*_cases.json`)

### 完整示例

```json
[
  {
    "id": 1,
    "chapter": "第1章 信息化发展",
    "title": "某企业信息质量评估案例",
    "scenario": "某大型零售企业正在建立一个消费者行为数据分析平台...（案例背景描述）",
    "questions": [
      {
        "question": "请根据信息的7个质量属性，对该企业数据平台中存在的问题进行分类分析。",
        "answer": "信息的7个质量属性包括精确性、完整性、可靠性...（参考答案）"
      },
      {
        "question": "该企业业务中，金融交易数据和市场营销数据分别最应关注哪些信息质量属性？",
        "answer": "金融信息最重要的特性是安全性...（参考答案）"
      }
    ]
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | int | ✅ | 案例编号，唯一标识 |
| `chapter` | string | ✅ | 所属章节 |
| `title` | string | ✅ | 案例标题 |
| `scenario` | string | ✅ | 案例背景/场景描述，支持换行 |
| `questions` | object[] | ✅ | 该案例下的问题列表 |

**questions 子字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `question` | string | ✅ | 问题内容 |
| `answer` | string | ✅ | 参考答案/解析 |

### 注意事项

1. 一个案例可包含多个问题（`questions` 数组）
2. 前端默认**折叠答案**，点击问题文字展开查看
3. 案例分析题不包含客观评分，仅用于学习参考

---

## 三、文件命名规范

推荐的文件命名方式：

```
ch01_choices.json    ← 第1章选择题
ch01_cases.json      ← 第1章案例分析
ch02_choices.json    ← 第2章选择题
...
ch20_choices.json
ch20_cases.json
```

> 使用 `数据转换工具.py merge-chapters` 命令时，工具会按 `ch数字_类型.json` 模式自动匹配文件。

也可以使用其他命名（如 `题库_选择题.json`），使用 `json-to-js` 命令单独转换。

---

## 四、使用数据转换工具

### 方式一：合并章节文件 → 生成数据文件（推荐）

如果题目按 `chXX_choices.json` / `chXX_cases.json` 分章节存放：

```bash
python 数据转换工具.py quick-merge ./ output/
```

一键完成：合并所有章节 → 生成 `data_choices.js` + `data_cases.js` → 生成自包含 HTML。

### 方式二：单文件转换

如果只有一个 JSON 文件：

```bash
# 转换选择题
python 数据转换工具.py json-to-js 题库.json data_choices.js --var CHOICE_DATA

# 转换案例分析
python 数据转换工具.py json-to-js 案例分析.json data_cases.js --var CASE_DATA
```

### 方式三：生成自包含 HTML

将数据文件嵌入模板，生成可离线使用的单个 HTML：

```bash
python 数据转换工具.py generate-html 刷题系统_模板.html data_choices.js data_cases.js 输出.html --title "我的刷题系统"
```

---

## 五、部署方式

### 模板模式（灵活，数据可替换）

```
刷题系统_模板.html    ← 主文件（不改动）
data_choices.js       ← 选择题数据（可替换）
data_cases.js         ← 案例分析数据（可替换）
```

打开 `刷题系统_模板.html` 即可。替换数据文件后刷新页面自动更新。

### 自包含模式（单文件，方便分发）

```
刷题系统_自包含.html  ← 数据和界面合并在一个文件中
```

适合 U 盘拷贝、离线使用。

---

## 六、快速验证

生成数据文件后，可用 Python 快速检查格式：

```python
import json

with open('data_choices.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 提取 JSON 部分
start = content.index('[')
end = content.rindex(']') + 1
data = json.loads(content[start:end])

print(f"题目数量: {len(data)}")
print(f"字段: {list(data[0].keys())}")
print(f"章节: {set(d['chapter'] for d in data)}")
```