@echo off
chcp 65001 >nul
echo.
echo   ╔══════════════════════════════════╗
echo   ║      🪄  冰箱魔法 FridgeMagic    ║
echo   ╚══════════════════════════════════╝
echo.

cd /d "%~dp0"

:: 设置 JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-23
set PATH=%JAVA_HOME%\bin;%PATH%

:: 设置 Maven
set MAVEN_HOME=%USERPROFILE%\apache-maven-3.9.9
set PATH=%MAVEN_HOME%\bin;%PATH%

:: 检查 Java
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo   [错误] 未检测到 Java，请先安装 JDK 17+
    echo   下载地址: https://jdk.java.net/
    pause
    exit /b 1
)

:: 检查 api_key.txt
if not exist "api_key.txt" (
    echo   [提示] 未找到 api_key.txt 文件
    echo   请创建 api_key.txt 并填入你的智谱AI API Key
    echo   （可参考 api_key.example.txt）
    echo.
)

:: 启动 Spring Boot
echo   [启动] Spring Boot 编译并启动中...
echo.
call mvn spring-boot:run

pause