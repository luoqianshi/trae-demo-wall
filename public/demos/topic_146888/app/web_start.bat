@echo off
cd /d "%~dp0"
start nginx
start http://localhost:7070
pause