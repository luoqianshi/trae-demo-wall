@echo off
echo Installing dependencies...
npm install
if errorlevel 1 pause && exit /b 1

echo Building single-file HTML...
npm run build
if errorlevel 1 pause && exit /b 1

copy /Y dist\index.html AI未来职业体验馆_优化版.html

echo Done. Output: AI未来职业体验馆_优化版.html
pause
