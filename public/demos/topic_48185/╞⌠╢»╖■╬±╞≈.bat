@echo off
echo 正在启动本地服务器...
echo 启动后请在浏览器中访问: http://localhost:8000
echo 按 Ctrl+C 停止服务器
echo.
cd /d %~dp0
where python >nul 2>nul
if %errorlevel%==0 (
    python -m http.server 8000
) else (
    where npx >nul 2>nul
    if %errorlevel%==0 (
        npx serve -l 8000 .
    ) else (
        echo 未找到 Python 或 Node.js，请先安装其中之一
        echo 推荐安装 Python: https://www.python.org/downloads/
        pause
    )
)
