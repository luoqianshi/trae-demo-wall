# 知识飞轮 Research OS

TRAE AI Creativity Competition 2026 参赛作品

## 快速开始

1. 双击 `index.html` 在浏览器中打开
2. 点击"连接 TRAE"按钮，复制提示词粘贴到 TRAE 对话框
3. 在技能市场勾选需要的技能，点击"安装选中"复制安装提示词
4. 粘贴到 TRAE 对话框，技能自动安装

## 功能

- **飞轮面板**：实时展示技能使用次数、平均质量分、成功率、精调技能数
- **技能成长档案**：5 个技能的使用记录、质量分、成功率进度条
- **活动时间线**：最近 8 条使用记录，含技能名、评分、状态
- **核心飞轮机制**：雷达匹配→记录评估→飞轮分析，三步自我迭代
- **技能市场**：43 个技能（9 系统 + 34 社区），多选安装
- **连接 TRAE**：一键复制初始化提示词

## 设计

- 暗色主题，Inter + JetBrains Mono 字体
- 渐变 KPI 卡片、玻璃态面板
- 飞轮 SVG：径向渐变中心 + 三色渐变节点 + 阴影滤镜 + 旋转外环 + 脉冲动画
- 支持文件协议剪贴板（execCommand 降级）
- 支持无障碍动画降级（prefers-reduced-motion）

## 数据源

- Research OS: https://dalaoyuan2020.github.io/research-os/
- GitHub 仓库: https://github.com/dalaoyuan2020/research-os
