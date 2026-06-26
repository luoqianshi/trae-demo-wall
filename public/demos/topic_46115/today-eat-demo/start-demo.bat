@echo off
cd /d "%~dp0"
echo 正在启动“今天吃什么！”Demo...
echo.
if not exist node_modules (
  echo 首次启动，正在安装依赖...
  npm install
)
echo.
echo 启动成功后，请在浏览器打开：http://localhost:3000
echo 按 Ctrl + C 可以停止服务。
echo.
npm start
