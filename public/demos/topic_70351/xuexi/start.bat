@echo off
echo ========================================
echo    语智 - 语文AI学习助手
echo ========================================
echo.

if not exist ".env" (
    echo [提示] 未检测到 .env 配置文件
    echo 请先复制 .env.example 为 .env，并填入你的 DeepSeek API Key
    echo.
    echo 快速配置命令：
    echo   copy .env.example .env
    echo   然后编辑 .env 文件，填入 DEEPSEEK_API_KEY
    echo.
)

echo 正在启动服务...
echo 服务地址: http://localhost:5173
echo 按 Ctrl+C 停止服务
echo.

python server.py
