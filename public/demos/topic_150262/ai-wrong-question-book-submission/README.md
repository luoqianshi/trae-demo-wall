# 智错本 AI Demo

这是一个用于比赛初赛提交的 HTML 原型，主题为“学习工作 + 智错本 AI：把错题从‘拍下来’变成‘真的会了’”。

## 打开方式

直接双击打开 `ai-wrong-question-book-revised-demo.html` 即可体验。

或者使用本地服务器：
```bash
python -m http.server 8888
```
然后访问 http://localhost:8888/ai-wrong-question-book-revised-demo.html

## 页面与功能

- 📊 **首页仪表盘**：数据统计卡片、今日推荐、最近错题、错因标签分布饼图、近7天错题趋势图、知识点掌握度雷达图。
- 📚 **错题本**：学科分类筛选（数学、英语、行测）、错因标签筛选（9种）、状态筛选、关键词搜索、错题按错因分组展示。
- 🤖 **AI 解析**：题目展示、答案对比、错误原因分析、改进建议、AI 解析草稿（打字机效果）、模板变式题推荐。
- 📝 **添加错题**：三步引导式流程（上传/粘贴 → AI 生成草稿 → 用户确认入库），支持模拟 OCR 识别、错因标签选择。
- 🎯 **今日练习**：三种练习模式（错因复盘、模板变式、混合模拟），难度递增式推荐，答题反馈与进度追踪。

## 技术特点

- 单页应用设计，所有功能在一个 HTML 文件中实现
- 响应式布局，支持桌面和移动端
- 亮色/暗色主题切换
- ECharts 图表可视化
- 本地数据模拟，无需后端支持

## 文件结构

```
ai-wrong-question-book-submission/
├── ai-wrong-question-book-revised-demo.html  # 主页面文件
├── assets/
│   └── js/
│       └── echarts.min.js                    # ECharts 图表库
├── README.md                                 # 说明文档
└── submission_text.md                        # 比赛提交文案
```

## 提交建议

- 标签选择：学习工作
- 标题填写：学习工作 + 智错本 AI：把错题从“拍下来”变成“真的会了”
- 正文可复制 `submission_text.md` 中的内容