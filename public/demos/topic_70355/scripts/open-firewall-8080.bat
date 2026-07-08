@echo off
setlocal
chcp 65001 >nul
echo 正在放行 Windows 防火墙 8080 端口，需要用管理员身份运行本脚本。
netsh advfirewall firewall delete rule name="人员身份卡系统 8080" >nul 2>nul
netsh advfirewall firewall add rule name="人员身份卡系统 8080" dir=in action=allow protocol=TCP localport=8080
if errorlevel 1 (
  echo 防火墙规则添加失败。请右键本脚本，选择“以管理员身份运行”。
  pause
  exit /b 1
)
echo 已放行 8080 端口。
pause
