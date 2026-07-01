# jingcai-football-deepflow

竞彩足球七步深度分析工具 — 贝叶斯统计 + 泊松分布

## 快速开始

```bash
# 启动后端服务（同时提供前端页面和 API）
python3 server/app.py

# 浏览器打开
# http://localhost:8080/
```

点击页面中央绿色按钮"开始今日竞彩分析"即可体验实时搜索+分析。

## 项目结构

```
├── demo/index.html          # 交互式前端（泊松计算器 + 一键分析）
├── server/app.py            # Python 后端（体彩网抓取 + 贝叶斯+泊松 + NDJSON流式API）
├── SKILL.md                 # Skill 定义文件（七步分析框架）
├── scripts/poisson-calc.py  # 泊松概率计算脚本（命令行工具）
├── templates/               # 分析报告模板
├── references/              # 联赛基准数据 + 数据源清单
├── screenshots/             # Demo 运行截图
└── 初赛Demo作品帖.md         # TRAE AI 大赛提交帖
```

## 技术架构

- **后端**：Python HTTPServer，NDJSON 流式响应
- **前端**：原生 HTML/CSS/JS，fetch + ReadableStream 实时消费
- **分析引擎**：贝叶斯先验→后验更新 + 泊松分布比分矩阵
- **数据源**：体彩网(lottery.gov.cn) + 百度搜索 + 球队实力评级系统

## 风险提示

本工具仅为数据娱乐与学习案例，不构成投注建议。竞彩有风险，理性参与，未成年人严禁参与。
