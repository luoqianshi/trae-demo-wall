@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0\.."
if not exist out\site\App.class (
  call scripts\build.bat
  if errorlevel 1 exit /b 1
)
echo 启动人员身份卡及工作牌管理系统...
java -cp out site.App
