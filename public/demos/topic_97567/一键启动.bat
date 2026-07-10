@echo off
chcp 65001 >nul
title 雪球日记 - 启动中

echo =====================================
echo   雪球日记 - 一键启动
echo =====================================
echo.

:: 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装：
    echo.
    echo   下载地址: https://nodejs.org/
    echo   选择 LTS 版本，安装时勾选 "Add to PATH"
    echo.
    echo   安装完成后重新双击此脚本即可。
    echo.
    pause
    exit /b 1
)

echo [1/4] 检测到 Node.js:
node -v
echo.

:: 检查依赖是否已安装
if not exist "node_modules" (
    echo [2/4] 首次运行，正在安装依赖（可能需要几分钟）...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败，请检查网络后重试。
        pause
        exit /b 1
    )
    echo.
) else (
    echo [2/4] 依赖已安装，跳过安装步骤。
    echo.
)

echo [3/4] 正在启动服务器...
echo.
echo =====================================
echo   浏览器即将自动打开，请勿关闭此窗口
echo   使用完毕后关闭此窗口即可停止应用
echo =====================================
echo.

:: 启动开发服务器并在浏览器打开
start "" http://localhost:3000
call npm run dev

echo.
echo 应用已停止。感谢使用雪球日记！
pause
