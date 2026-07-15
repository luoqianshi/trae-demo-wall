@echo off
chcp 65001 >nul
title 唐朝风云 - 大唐王朝治理模拟游戏

echo ===============================================
echo          唐朝风云 - 大唐王朝治理模拟游戏
echo ===============================================
echo.
echo 📖 游戏说明：
echo   1. 本游戏为Web单页应用，无需安装
echo   2. 支持离线模式，无需网络连接
echo   3. 建议使用Chrome浏览器获得最佳体验
echo.
echo 🚀 启动方式：
echo   方式一：直接双击打开 index.html 文件
echo   方式二：使用本地服务器（下方自动启动）
echo.
echo ⚠️ 注意：如果浏览器提示安全风险，请选择"允许访问"或"继续访问"
echo         这是正常的本地文件访问提示，游戏安全无害
echo.

:CHECK_PYTHON
echo 📦 检测Python环境...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python已安装，启动本地服务器...
    echo.
    echo 🌐 服务器地址：http://localhost:8080
    echo 🕐 请等待服务器启动后，在浏览器中访问上述地址
    echo.
    echo 按 Ctrl+C 可关闭服务器
    echo.
    python -m http.server 8080
    goto END
)

:CHECK_NODE
echo ⚠️ Python未安装，检测Node.js环境...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js已安装，启动本地服务器...
    echo.
    echo 🌐 服务器地址：http://localhost:3000
    echo 🕐 请等待服务器启动后，在浏览器中访问上述地址
    echo.
    npx serve -l 3000
    goto END
)

:NO_SERVER
echo ⚠️ 未检测到Python或Node.js环境
echo.
echo 📌 请直接双击打开 index.html 文件开始游戏
echo.
echo 正在尝试用默认浏览器打开游戏...
start index.html
echo.
echo ✅ 游戏已打开！如果浏览器未自动打开，请手动双击 index.html
echo.

:END
echo.
echo ===============================================
echo                  游戏结束
echo ===============================================
pause