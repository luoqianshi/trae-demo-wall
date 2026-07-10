@echo off
echo ==============================================
echo   日本語秘境 - 服务器启动脚本
echo ==============================================
echo.

for /f "tokens=3" %%a in ('netsh interface ip show address ^| findstr "IP Address"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
if not defined LOCAL_IP set LOCAL_IP=127.0.0.1

echo   本地访问: http://localhost:8080/
echo   网络访问: http://%LOCAL_IP%:8080/
echo.
echo ==============================================
echo.

python -m http.server 8080 --bind 0.0.0.0

pause