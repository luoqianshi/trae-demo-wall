@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0\.."
if not exist out mkdir out
echo 正在编译 Java 源码...
javac -encoding UTF-8 -d out src\site\App.java
if errorlevel 1 (
  echo 编译失败
  exit /b 1
)
echo 编译完成
