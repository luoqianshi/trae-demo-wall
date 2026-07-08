# 半阕风月 - 宋词格律校验技能

## 项目概述

「半阕风月」是一个 TRAE AI 创造力大赛项目，致力于让用户输入大白话，生成严格合律的宋词。本技能提供宋词格律校验功能。

## 技能功能

### 1. 格律校验脚本 (validate_ci.py)

**命令行调用格式：**
```bash
python3 scripts/validate_ci.py --cipai "词牌名" --text "宋词文本" --verbose
```

**参数说明：**
- `--cipai`: 词牌名（如：卜算子、浣溪沙）
- `--text`: 宋词文本
- `--verbose`: 显示详细校验信息

**校验内容：**
1. **字数校验**: 检查每句字数是否符合词牌规定
2. **平仄校验**: 使用 pypinyin 判断平仄，结合古入声字表修正
3. **韵脚校验**: 基于平水韵韵部判断押韵情况

### 2. 古入声字表 (rusheng_chars.py)

提供古入声字识别功能：
- `is_rusheng(char)`: 判断单个字是否为入声字
- `get_rusheng_list()`: 获取完整入声字集合

## 数据文件

### references/词牌库.md
包含30个常用词牌的格律数据：
- 卜算子、浣溪沙、水调歌头、念奴娇、江城子
- 蝶恋花、清平乐、菩萨蛮、西江月、浪淘沙
- 虞美人、鹊桥仙、声声慢、一剪梅、如梦令
- 醉花阴、鹧鸪天、踏莎行、雨霖铃、望海潮
- 破阵子、永遇乐、青玉案、天仙子、满庭芳
- 苏幕遮、定风波、渔家傲、采桑子、忆江南

### references/韵书.md
平水韵韵部数据，支持押韵判断

## API 调用方式

**Python 模块导入：**
```python
from scripts.validate_ci import validate_ci

result = validate_ci("卜算子", "缺月挂疏桐，漏断人初静。谁见幽人独往来，缥缈孤鸿影。惊起却回头，有恨无人省。拣尽寒枝不肯栖，寂寞沙洲冷。", verbose=True)
# 返回: {"word_count": True, "pingze": True, "rhyme": True, "valid": True}
```

## 使用示例

**示例1：校验苏轼《卜算子》**
```bash
python3 scripts/validate_ci.py --cipai "卜算子" --text "缺月挂疏桐，漏断人初静。谁见幽人独往来，缥缈孤鸿影。惊起却回头，有恨无人省。拣尽寒枝不肯栖，寂寞沙洲冷。" --verbose
```

**示例2：校验晏殊《浣溪沙》**
```bash
python3 scripts/validate_ci.py --cipai "浣溪沙" --text "一曲新词酒一杯，去年天气旧亭台。夕阳西下几时回？无可奈何花落去，似曾相识燕归来。小园香径独徘徊。" --verbose
```

## 技术说明

### 平仄判断逻辑
1. 优先查询古入声字表，入声字归为仄声
2. 使用 pypinyin 获取拼音和声调
3. 声调1、2为平声，3、4为仄声
4. 无法判断时标记为"中"（可平可仄）

### 韵脚判断逻辑
1. 提取每句最后一个字作为韵脚候选
2. 查询平水韵韵部数据
3. 比较所有押韵句的韵部是否一致

## 依赖安装

```bash
pip install pypinyin
```

## 文件结构

```
.
├── SKILL.md                    # 技能文档
├── references/
│   ├── 词牌库.md               # 词牌格律数据
│   └── 韵书.md                 # 平水韵韵部数据
└── scripts/
    ├── validate_ci.py          # 格律校验主脚本
    └── rusheng_chars.py        # 古入声字表模块
```
