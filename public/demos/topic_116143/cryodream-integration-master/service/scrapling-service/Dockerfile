# 使用 Playwright 官方镜像，已内置 Chromium 与全部系统依赖
FROM mcr.microsoft.com/playwright/python:v1.49.0-jammy

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 安装 Scrapling 所需浏览器（系统依赖已由基础镜像提供）
RUN scrapling install || python -m playwright install chromium || true

COPY app.py .

EXPOSE 8200

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8200"]
