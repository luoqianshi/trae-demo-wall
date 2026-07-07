@echo off
chcp 65001 >nul

echo 检查依赖...
pip install -r requirements.txt -q

echo.
echo 启动 API 模型测速台...
echo 访问 http://localhost:8080
echo.
python app.py
