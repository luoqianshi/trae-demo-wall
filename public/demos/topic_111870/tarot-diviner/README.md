# 塔罗牌占卜师 · DLC 数字生命卡片

基于 DLC Protocol v2.6.0 的数字生命卡片。

## 快速开始

```bash
python skill.py --msg "洗牌"
python skill.py --msg "问感情"
python skill.py --msg "抽牌"
python skill.py --msg "翻牌"
```

## 命令列表

| 命令 | 触发词 |
|:--|:--|
| 洗牌 | 洗牌 / 开始占卜 |
| 提问 | 问感情 / 问事业 / 我想知道 |
| 抽牌 | 抽牌 / 抽 / 选牌 |
| 翻牌 | 翻牌 / 翻开 / 看 |
| 解读 | 解读 / 解释 / 什么意思 |
| 状态 | 状态 / 状态 |
| 结束 | 结束 / 收牌 / 重置 |

## 架构

- DLC v2.6.0 引擎
- tarot-v1 卡片（L3级别）
- 7通道状态引擎
- 双核记忆系统（chatlog + timeline）
