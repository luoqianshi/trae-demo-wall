@echo off
chcp 65001 >nul
echo ==========================================
echo    科学育儿助手 App Demo
echo ==========================================
echo.

cd /d "%~dp0"

:: 检查Python
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo 正在启动本地服务器...
    echo 请访问: http://localhost:8080
    echo.
    python -m http.server 8080
    goto :end
)

where python3 >nul 2>nul
if %errorlevel% equ 0 (
    echo 正在启动本地服务器...
    echo 请访问: http://localhost:8080
    echo.
    python3 -m http.server 8080
    goto :end
)

echo 错误: 未找到Python，无法启动服务器
echo 请直接用浏览器打开 index.html 文件
echo.

:end
pause