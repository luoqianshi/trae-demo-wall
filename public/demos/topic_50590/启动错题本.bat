@echo off
chcp 65001 >nul
title 智习本 - AI智能错题本
echo ========================================
echo   智习本 - AI驱动的智能错题学习助手
echo ========================================
echo.
echo [1/2] 检查依赖...
python -c "import flask" 2>nul
if errorlevel 1 (
    echo 正在安装依赖，请稍候...
    pip install flask requests pillow -i https://pypi.tuna.tsinghua.edu.cn/simple
)
echo [2/2] 启动服务...
echo.
echo ========================================
echo  启动成功！请在浏览器中打开：
echo  http://localhost:5000
echo ========================================
echo.
echo 关闭此窗口即可停止服务
echo.
python server.py
pause
