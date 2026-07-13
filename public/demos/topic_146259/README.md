# 错题小助手

基于 Flask + 本地向量库（ChromaDB）+ 可选 GraphRAG 的中学数学错题管理与智能推荐系统。

## 功能亮点

- **学生端**：拍照/上传错题、OCR 识别、每日复习、自动/手动推荐、掌握度统计
- **教师端**：班级错题热力图、学生错题详情、标签管理、用户注册与管理
- **智能推荐**：
  - 手动推荐：按知识点、错因、难度筛选
  - 自动推荐：GraphRAG + ChromaDB 本地向量混合推荐相似错题
- **用户系统**：学生端和老师端均需登录后使用，老师端可注册/删除用户

## 快速启动

### 1. 安装依赖

```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 配置环境变量（可选）

复制示例配置文件：

```bash
cp .env.example .env
```

按需填写：

- `OPENAI_API_KEY`：启用 GraphRAG 智能推荐与 OpenAI Embedding；**不填写时会自动降级为本地 ChromaDB 向量推荐**
- `OCR_BACKEND`：`easyocr`（本地，默认）或 `mineru`（需填写 MinerU Token）
- `MINERU_TOKEN`：仅在 OCR_BACKEND=mineru 时需要

> **注意**：`.env` 文件已被排除在压缩包外，请勿将含真实密钥的 `.env` 上传到公开社区。

### 3. 启动服务

```bash
python server.py
```

访问地址：

- 学生端：http://localhost:3000/student.html
- 老师端：http://localhost:3000/teacher.html

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 学生 | wangxiaoming | 123456 |
| 老师 | lilaoshi | 123456 |

打开页面后需要先登录才能使用。

> **关于向量库**：为控制压缩包大小，`data/chroma_db/`（本地向量数据库）未打包。首次启动服务时，系统会根据 `data/mistakes.json` 自动重建向量库，稍等片刻即可正常使用自动推荐功能。

## 项目结构

```
.
├── server.py              # Flask 后端主入口
├── models.py              # 数据模型与用户认证
├── recommender.py         # 手动/自动推荐算法
├── graphrag_service.py    # GraphRAG 集成（可选）
├── vector_store.py        # ChromaDB 本地向量库
├── ocr_service.py         # OCR 文字识别
├── config.py              # 项目配置
├── requirements.txt       # Python 依赖
├── data/                  # 数据目录
│   ├── mistakes.json      # 错题数据
│   ├── users.json         # 用户数据
│   ├── chroma_db/         # 向量库
│   └── images/            # 错题图片
└── public/                # 前端页面
    ├── student.html
    ├── teacher.html
    ├── css/style.css
    └── js/student.js
    └── js/teacher.js
```

## 技术栈

- 后端：Flask、Flask-CORS、Werkzeug
- 数据库：JSON 文件 + ChromaDB 本地向量数据库
- 推荐：Python 规则 + GraphRAG（可选 OpenAI）+ ChromaDB 向量相似度
- OCR：EasyOCR 本地模型 / MinerU API（可选）
- 前端：原生 HTML/CSS/JavaScript

## 参赛说明

本项目为 TRAE AI 创造力大赛参赛作品，所有 AI 相关密钥已剔除，打包文件中不包含 `.env` 真实配置文件。运行前如需体验完整 GraphRAG 推荐效果，请自行在 `.env` 中配置 `OPENAI_API_KEY`。
