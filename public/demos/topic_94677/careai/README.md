# CareAI - 家庭智能照护系统

## 项目简介

CareAI 是一套部署在家庭电脑上的本地化AI照护系统，面向失能、半失能老人的家庭照护场景。通过接入家用摄像头，家庭成员对视频帧进行标注并训练专属识别模型，实时将画面转化为文字事件记录，异常时通过微信通知家属。

## 核心特性

- **本地化部署**：视频、模型、数据全部存储在家庭本地，不上传云端
- **专属模型**：基于家庭自有数据训练，针对固定场景优化，误报率低
- **低成本**：旧电脑即可运行，无需额外硬件投入
- **隐私保护**：敏感截图自动脱敏，异性用户默认马赛克
- **风险分级**：P0-P3 四级风险体系，支持自定义告警策略

## 技术栈

- **后端**：Python + FastAPI + SQLAlchemy + SQLite
- **前端**：React 18 (CDN 引入，无需构建)
- **模型**：PyTorch (训练) + ONNX Runtime (推理)
- **视频**：OpenCV + FFmpeg

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install fastapi uvicorn sqlalchemy pydantic python-multipart aiofiles opencv-python-headless
```

### 2. 启动后端

```bash
cd backend
python run.py
```

后端服务将在 http://localhost:8000 启动，并自动初始化数据库和演示数据。

### 3. 打开前端

直接用浏览器打开 `frontend/index.html` 即可。

> 注意：由于前端使用 CDN 引入 React，需要联网加载。也可以下载到本地后离线使用。

### 4. API 文档

启动后端后访问 http://localhost:8000/docs 查看自动生成的 Swagger 文档。

## 项目结构

```
careai/
├── backend/
│   ├── app/
│   │   ├── api/           # REST API 路由
│   │   ├── core/          # 数据库、配置、Schema
│   │   ├── models/        # SQLAlchemy 模型
│   │   ├── services/      # 业务逻辑（推理、训练、数据初始化）
│   │   └── main.py        # FastAPI 入口
│   ├── data/              # SQLite 数据库
│   ├── frames/            # 摄像头截图存储
│   ├── models_storage/    # 训练好的模型文件
│   └── run.py             # 启动脚本
├── frontend/
│   └── index.html         # React 单页应用
└── README.md
```

## 支持的识别状态

| 风险等级 | 状态 |
|---------|------|
| P0 生命危险 | 面部被遮、异常静止、跌落/坠床、试图攀爬护栏 |
| P1 紧急照护 | 离床、挣扎/躁动、踢被、失禁、脱衣 |
| P2 需关注 | 翻身、进食/饮水 |
| P3 正常 | 正常卧床/活动 |

## 后续开发计划

1. 接入真实 ONNX 推理模型
2. 实现 RTSP 摄像头实时采集
3. 接入微信推送通知
4. 添加用户认证和权限管理
5. 支持增量训练和模型版本管理

## License

MIT
