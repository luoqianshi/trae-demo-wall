@echo off
REM DouMa 斗码 · 一键启动脚本（Windows）
REM 使用方法：双击运行，或在 cmd 里执行 start.bat
setlocal
cd /d "%~dp0"

set PORT=%DOUMA_PORT%
if "%PORT%"=="" set PORT=8765

where python >nul 2>nul
if errorlevel 1 (
  echo X 未找到 python，请先安装 Python 3.10+ 并勾选 Add to PATH
  pause
  exit /b 1
)

if not exist ".venv" (
  echo [首次运行] 创建虚拟环境并安装依赖...
  python -m venv .venv
  call .venv\Scripts\pip.exe install -q --upgrade pip
  call .venv\Scripts\pip.exe install -q -r requirements.txt
)

echo.
echo ==========================================
echo   DouMa GUI 即将启动
echo   请用浏览器打开: http://127.0.0.1:%PORT%
echo   按 Ctrl+C 停止服务
echo ==========================================
echo.
.venv\Scripts\python.exe -m douma.cli serve --host 127.0.0.1 --port %PORT% --tasks tasks
pause
