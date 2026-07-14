# Auto-Decision Agent Docker 部署
# 基于 Python 3.11 轻量镜像

FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]