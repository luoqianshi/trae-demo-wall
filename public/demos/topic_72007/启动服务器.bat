@echo off
chcp 65001 >nul
echo ========================================
echo   甲状腺健康管家 - 本地启动脚本
echo ========================================
echo.

cd /d "%~dp0"

echo 正在启动本地服务器...
echo.

where python >nul 2>&1
if %errorlevel%==0 (
    echo 检测到 Python，使用 Python 启动...
    echo 启动后请在浏览器中访问: http://localhost:8080
    echo.
    start http://localhost:8080
    python -m http.server 8080
    goto :eof
)

where npx >nul 2>&1
if %errorlevel%==0 (
    echo 检测到 Node.js，使用 serve 启动...
    echo 启动后请在浏览器中访问: http://localhost:3000
    echo.
    npx --yes serve -l 3000 .
    goto :eof
)

echo.
echo [错误] 未检测到 Python 或 Node.js
echo 请安装以下任一工具后再运行：
echo   1. Python: https://www.python.org/downloads/
echo   2. Node.js: https://nodejs.org/
echo.
echo 或者直接部署到 Vercel / Netlify 获得公开访问链接
echo.
pause
