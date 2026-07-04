@echo off
cd /d "%~dp0"
set PORT=8088
echo 正在启动本地预览服务：http://localhost:%PORT%/
echo 预览目录：%cd%
echo 关闭此窗口即可停止服务
start http://localhost:%PORT%/
python -m http.server %PORT%
if errorlevel 1 (
  py -m http.server %PORT%
)
pause
