@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

rem ==========================================================
rem  NB-Fin Daily Query Launcher v1.2.0
rem
rem  Usage:
rem    run_query.bat                            today + script default trade + company filter
rem    run_query.bat 2026-06-12                 specified date + script default trade + company filter
rem    run_query.bat 2026-06-12 "Manufacturing"  specified date + custom trade + company filter
rem    run_query.bat 2026-06-12 "Manufacturing" all  specified date + custom trade + no company filter
rem    run_query.bat 2026-06-12 "Manufacturing" raw specified date + custom trade + no company filter + no keyword filter
rem    run_query.bat /?                         show this help
rem ==========================================================

if /i "%~1"=="/?"     goto :show_help
if /i "%~1"=="-h"     goto :show_help
if /i "%~1"=="--help" goto :show_help

set "SCRIPT_DIR=%~dp0"
set "PYTHON_SCRIPT=%SCRIPT_DIR%scripts\query_cni_annc.py"
set "COMPANIES_FILE=%SCRIPT_DIR%companies.json"
set "OUTPUT_DIR=%SCRIPT_DIR%output"

set "USE_COMPANIES=1"
set "RAW=0"
set "TRADE="
set "DATE_ARG="

if not "%~1"=="" set "DATE_ARG=--date %~1"
if not "%~2"=="" set "TRADE=%~2"
if /i "%~3"=="all"      set "USE_COMPANIES=0"
if /i "%~3"=="nofilter" set "USE_COMPANIES=0"
if /i "%~3"=="raw" (
    set "USE_COMPANIES=0"
    set "RAW=1"
)

if not exist "%PYTHON_SCRIPT%" (
    echo [ERROR] Python script not found: %PYTHON_SCRIPT%
    exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] python.exe is not in PATH. Install Python 3 and add it to PATH.
    exit /b 1
)

if "%USE_COMPANIES%"=="1" if not exist "%COMPANIES_FILE%" (
    echo [ERROR] Companies file not found: %COMPANIES_FILE%
    exit /b 1
)

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%" >nul 2>&1

rem Locale-independent current date in yyyy-MM-dd
for /f %%I in ('powershell -nologo -noprofile -command "Get-Date -Format yyyy-MM-dd"') do set "TODAY=%%I"
if not defined TODAY set "TODAY=%date%"

if defined TRADE (
    set "OUTPUT_FILE=%OUTPUT_DIR%\cninfo_!TRADE!_!TODAY!.md"
) else (
    set "OUTPUT_FILE=%OUTPUT_DIR%\cninfo_!TODAY!.md"
)

set "EXTRA_ARGS="
if defined TRADE set "EXTRA_ARGS=--trade !TRADE!"
if "%USE_COMPANIES%"=="1" set "EXTRA_ARGS=!EXTRA_ARGS! --companies "!COMPANIES_FILE!""
if "%RAW%"=="1" set "EXTRA_ARGS=!EXTRA_ARGS! --no-keyword-filter"

echo ==============================================
echo NB-Fin Daily Query Tool v1.2.0
if defined DATE_ARG (echo Date     : %DATE_ARG:~7%) else (echo Date     : today)
if defined TRADE (echo Trade    : !TRADE!) else (echo Trade    : default from script)
if "%USE_COMPANIES%"=="0" (echo Filter   : company list DISABLED) else (echo Filter   : company list ENABLED)
if "%RAW%"=="1" (echo Keywords : keyword filter DISABLED)
echo Output   : %OUTPUT_FILE%
echo ==============================================

if defined DATE_ARG (
    python "%PYTHON_SCRIPT%" --output "%OUTPUT_FILE%" !EXTRA_ARGS! !DATE_ARG!
) else (
    python "%PYTHON_SCRIPT%" --output "%OUTPUT_FILE%" !EXTRA_ARGS!
)

set "RC=!errorlevel!"

if !RC! equ 0 (
    echo.
    echo ==============================================
    echo [OK] Query completed. Output file:
    echo   %OUTPUT_FILE%
    echo ==============================================
) else (
    echo.
    echo ==============================================
    echo [FAIL] Query failed with exit code: !RC!
    echo ==============================================
)

pause
exit /b !RC!

:show_help
echo NB-Fin Daily Query Launcher v1.2.0
echo.
echo Usage: run_query.bat [date] [trade] [mode]
echo.
echo Arguments:
echo   date   Optional. Query date in YYYY-MM-DD. Omit to use today plus tomorrow.
echo   trade  Optional. CNINFO trade name. Omit to use the script default.
echo   mode   Optional. Filter mode:
echo             all / nofilter - skip the company list filter
echo             raw            - skip both company and keyword filters
echo.
echo Switches:
echo(   /?, -h, --help   Show this help message.
echo.
echo Examples:
echo   run_query.bat
echo   run_query.bat 2026-06-12
echo   run_query.bat 2026-06-12 "Manufacturing"
echo   run_query.bat 2026-06-12 "Manufacturing" all
echo   run_query.bat 2026-06-12 "Manufacturing" raw
exit /b 0