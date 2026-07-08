# CareAI - 家庭智能照护系统

## 快速启动

### 1. 安装依赖
```bash
cd careai/backend
pip install -r requirements.txt
```

### 2. 启动服务
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. 打开浏览器
访问 http://localhost:8000

### 4. 登录
- 账号：admin
- 密码：admin123

## 包含内容
- 完整后端代码（FastAPI + SQLAlchemy + PyTorch + ONNX）
- 完整前端代码（Preact 单页应用）

## 不包含内容
- 数据库文件（首次启动自动初始化）
- 模型文件（需自行标注和训练生成）
- 视频和图片数据

## 系统要求
- Python 3.10+
- 足够运行 PyTorch 的环境（CPU 即可）
