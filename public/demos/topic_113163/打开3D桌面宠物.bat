@echo off
cd /d "%~dp0desktop-pet-3d"
if not exist logs mkdir logs
start "3D桌面宠物" /min cmd /c ""%cd%\node_modules\.bin\electron.cmd" . > logs\desktop-pet.log 2>&1"
