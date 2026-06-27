# 医学病例练习系统

AI 驱动的虚拟患者问诊训练平台，支持随机病例生成、实时多维度评分和可视化分析报告。

## 技术栈

- **前端**：Vue 3 + Element Plus + Vite + Plotly
- **后端**：Flask + SQLite
- **AI**：火山引擎方舟 Ark API

## 快速启动

### 1. 后端启动

```bash
cd backend
pip install -r requirements.txt
python app.py
```

后端运行在 `http://localhost:8877`

### 2. 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:7788`

### 3. 使用

1. 打开浏览器访问 `http://localhost:7788`
2. 注册账号并登录
3. 在「日常练习」中开始虚拟患者问诊训练
4. 在「病症询问」中使用 AI 专家咨询功能

## 核心功能

- **虚拟患者对话练习**：8 种病例类型随机生成，AI 扮演患者，结合性格和情绪进行自然对话
- **实时多维度评分**：6 大维度 30+ 子项实时评分，含问候礼仪、症状询问、病史采集、诊断准确性、治疗方案等
- **可视化分析报告**：动态评分曲线、能力分布饼图、子项分数雷达图
- **病症咨询助手**：基于 NCCN/ASCO/ESMO 指南的 AI 专家问答

## 环境变量

后端需设置火山引擎 API Key：

```bash
export ARK_API_KEY="your-api-key"
```