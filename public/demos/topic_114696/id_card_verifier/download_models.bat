@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   ID Card Verifier v2.5
echo   Download OCR Models
echo ========================================
echo.

set "SCRIPT_DIR=%~dp0"

REM Check if Python exists
set "PYTHON_DIR=%SCRIPT_DIR%python"
if not exist "%PYTHON_DIR%\python.exe" (
    echo [INFO] Portable Python not found, trying system Python...
    echo.
    
    python --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] No Python found!
        echo.
        echo Option 1: Setup Portable Python
        echo   - Run 'setup_portable_complete.bat' first
        echo.
        echo Option 2: Install System Python
        echo   - Install Python 3.10+ from python.org
        echo   - Run 'install.bat'
        echo.
        pause
        exit /b 1
    )
    
    REM Use system Python
    set "PYTHON_CMD=python"
) else (
    REM Use portable Python
    set "PYTHON_CMD=%PYTHON_DIR%\python.exe"
)

REM Check if models already exist
if exist "%SCRIPT_DIR%models" (
    echo [INFO] Models folder already exists!
    echo.
    choice /c YN /m "Redownload models?"
    if errorlevel 2 (
        echo Cancelled.
        pause
        exit /b 0
    )
    rmdir /s /q "%SCRIPT_DIR%models"
)

REM Create models folder
if not exist "%SCRIPT_DIR%models" mkdir "%SCRIPT_DIR%models"

REM Download models using Python script
echo.
echo [INFO] Downloading PaddleOCR models (~100MB)...
echo This may take 5-10 minutes depending on your internet speed.
echo.

"%PYTHON_CMD%" "%SCRIPT_DIR%download_models.py"

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to download models!
    echo.
    echo You can also download manually:
    echo 1. Download from: https://paddleocr.bj.bcebos.com/PP-OCRv4/chinese/ch_PP-OCRv4_det_infer.tar
    echo 2. Extract to: models\det\
    echo 3. Download from: https://paddleocr.bj.bcebos.com/PP-OCRv4/chinese/ch_PP-OCRv4_rec_infer.tar
    echo 4. Extract to: models\rec\
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Download Complete!
echo ========================================
echo.
echo Models installed to: %SCRIPT_DIR%models
echo.
echo You can now run 'start.bat' to launch the application.
echo.
pause
