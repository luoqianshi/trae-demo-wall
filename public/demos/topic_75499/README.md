# 学智云学习平台

面向1-9年级学生的在线学习平台，提供语文、数学、英语主课教学，以及物理、化学、生物（小学阶段为科学）等重要科目的学习支持。

## 项目结构

```
学智云学习平台/
├── index.html                 # 主入口文件
├── css/
│   ├── main.css              # 主样式文件
│   ├── components.css        # 组件样式
│   └── responsive.css        # 响应式样式
├── js/
│   ├── app.js                # 应用主逻辑
│   ├── router.js             # 路由管理
│   ├── api.js                # API接口封装
│   ├── storage.js            # localStorage封装
│   ├── components/
│   │   ├── navbar.js         # 导航栏组件
│   │   ├── home.js           # 首页组件
│   │   ├── practice.js       # 题库练习组件
│   │   ├── courses.js        # 视频课程组件
│   │   ├── ai-tutor.js       # AI辅导组件
│   │   ├── report.js         # 学习报告组件
│   │   ├── profile.js        # 个人中心组件
│   │   └── auth-components.js # 登录/注册组件
│   └── utils/
│       ├── auth.js           # 认证工具
│       ├── charts.js         # 图表工具
│       └── helpers.js        # 辅助函数
└── .trae/documents/
    ├── 学习平台PRD.md         # 产品需求文档
    └── 技术架构文档.md         # 技术架构文档
```

## 如何运行

### 方法一：直接打开
直接在浏览器中打开 `index.html` 文件即可运行。

### 方法二：使用 VS Code Live Server
1. 在 VS Code 中安装 "Live Server" 扩展
2. 打开 `index.html` 文件
3. 点击右下角的 "Go Live" 按钮，或右键选择 "Open with Live Server"

### 方法三：使用 Python HTTP Server
```bash
cd "e:\Code with TRAE"
python -m http.server 8080
```
然后在浏览器中访问 http://localhost:8080

### 方法四：使用 Node.js HTTP Server
```bash
cd "e:\Code with TRAE"
npx http-server -p 8080
```
然后在浏览器中访问 http://localhost:8080

## 功能特性

### 核心功能
- **题库练习**：按年级、科目、难度筛选题目，在线答题，自动批改，错题记录
- **视频课程**：课程分类浏览，视频播放，知识点标注
- **AI智能辅导**：拍照搜题，智能问答，知识点解析
- **学习报告**：学习数据统计，知识点掌握度分析，个性化学习建议

### 用户角色
- **学生**：题库练习、视频课程、AI辅导、学习报告、个人中心、错题本
- **家长**：绑定学生账号、查看学习报告、设置学习计划
- **教师**：班级管理、作业发布、学习数据分析

### 示例账号
- 学生：13800138001 / 密码：123456
- 家长：13900139001 / 密码：123456
- 教师：13700137001 / 密码：123456

## 技术栈

- **前端**：HTML5 + CSS3 + JavaScript (ES6+)
- **UI组件库**：Element UI 2.15+
- **图表库**：ECharts 5.0+
- **数学公式**：MathJax
- **数据存储**：localStorage（本地存储）
- **路由**：Hash路由实现单页应用

## 设计特点

- **响应式设计**：支持PC和移动设备，自适应布局
- **学科配色**：每个学科使用独特配色方案
- **难度可视化**：1-5星难度评级，红黄绿渐变色块
- **无障碍设计**：支持键盘导航、高对比度模式、减少动画模式

## 未来扩展

- 接入云端数据库（MySQL/MongoDB）
- 添加后端API服务（Node.js + Express 或 Python + Flask）
- 集成真实的AI智能辅导API
- 视频托管到云存储服务
- 支持多设备数据同步

## 开发计划

详见 [技术架构文档](.trae/documents/技术架构文档.md) 第7节。

## 许可证

本项目仅供学习和演示使用。

---

**学智云学习平台 v1.0.0**
© 2026 学智云团队