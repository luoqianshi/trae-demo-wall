@echo off
cd /d "%~dp0"
echo 正在启动智核管家...
echo.
pip install -r requirements.txt -q
echo.
python app.py
pause