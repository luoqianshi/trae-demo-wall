@echo off
chcp 65001 >nul
title 跨越速运 kyclient.exe - 0xc0150002 一键修复工具
color 0B
setlocal enabledelayedexpansion

:: ============ 自动管理员提权 ============
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] 需要管理员权限，正在自动提权...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

:menu
cls
echo.
echo  ============================================================
echo            跨越速运 kyclient.exe  0xc0150002 修复工具
echo  ============================================================
echo.
echo   错误现象: 应用程序无法正常启动 0xc0150002
echo   根本原因: 缺少 Microsoft Visual C++ 运行库
echo.
echo   ------------------------------------------------------------
echo   [1] 修复系统组件 (SFC + DISM)            〔推荐先做〕
echo   [2] 安装 VC++ 2008 SP1  x86 + x64        〔最可能需要〕
echo   [3] 安装 VC++ 2010 SP1  x86 + x64        〔兜底〕
echo   [4] 安装 VC++ 2005 SP1  x86              〔老程序兜底〕
echo   [5] 一键全套修复 (1+2+3+4)               〔省事直接选这个〕
echo   [6] 查看当前已安装的 VC++ 运行库
echo   [7] 清理旧版本残留注册表 (装不上时用)
echo   [8] 重启 Windows Update 服务 (装不上时用)
echo   [0] 退出
echo   ------------------------------------------------------------
echo.
set /p choice=请输入选项编号: 

if "%choice%"=="1" goto repair_system
if "%choice%"=="2" goto install_2008
if "%choice%"=="3" goto install_2010
if "%choice%"=="4" goto install_2005
if "%choice%"=="5" goto all_in_one
if "%choice%"=="6" goto list_vcredist
if "%choice%"=="7" goto clean_residue
if "%choice%"=="8" goto fix_wuauserv
if "%choice%"=="0" goto end
echo [!] 无效选项
timeout /t 2 >nul
goto menu

:: ============ 1. 修复系统组件 ============
:repair_system
echo.
echo  [*] 第一步: 运行 SFC 系统文件检查 (可能需要几分钟)...
echo  ------------------------------------------------------------
sfc /scannow
echo.
echo  [*] 第二步: 运行 DISM 修复系统映像 (可能需要较长时间)...
echo  ------------------------------------------------------------
DISM /Online /Cleanup-Image /RestoreHealth
echo.
echo  [√] 系统组件修复完成，建议重启电脑后再装运行库
echo.
pause
goto menu

:: ============ 2. 安装 VC++ 2008 SP1 ============
:install_2008
echo.
echo  [*] 开始下载并安装 VC++ 2008 SP1...
call :download_install "https://download.microsoft.com/download/5/D/8/5D8C65CB-C849-4025-8E95-C3966CAFD8AE/vcredist_x86.exe" "vcredist2008_x86.exe" "VC++ 2008 SP1 x86"
call :download_install "https://download.microsoft.com/download/3/2/2/3224B87F-CFA0-4E70-BFA3-3DE650EFEBA5/vcredist_x64.exe" "vcredist2008_x64.exe" "VC++ 2008 SP1 x64"
echo.
echo  [√] VC++ 2008 SP1 处理完成
pause
goto menu

:: ============ 3. 安装 VC++ 2010 SP1 ============
:install_2010
echo.
echo  [*] 开始下载并安装 VC++ 2010 SP1...
call :download_install "https://download.microsoft.com/download/C/6/D/C6D0FD4E-2E1A-4FA9-A3FC-8586A8DBAB75/vcredist_x86.exe" "vcredist2010_x86.exe" "VC++ 2010 SP1 x86"
call :download_install "https://download.microsoft.com/download/A/8/0/A80A47E3-B4F0-4F0F-8C66-2D53E4F5F2E1/vcredist_x64.exe" "vcredist2010_x64.exe" "VC++ 2010 SP1 x64"
echo.
echo  [√] VC++ 2010 SP1 处理完成
pause
goto menu

:: ============ 4. 安装 VC++ 2005 SP1 ============
:install_2005
echo.
echo  [*] 开始下载并安装 VC++ 2005 SP1 x86...
call :download_install "https://download.microsoft.com/download/8/B/4/8B42259F-5D70-43F4-AC2E-4B208FD8D66A/vcredist_x86.exe" "vcredist2005_x86.exe" "VC++ 2005 SP1 x86"
echo.
echo  [√] VC++ 2005 SP1 处理完成
echo  [i] 注: 若下载失败，说明微软已下架 2005，请改用方案 2 或合集包
pause
goto menu

:: ============ 5. 一键全套 ============
:all_in_one
echo.
echo  ============================================================
echo   一键全套修复开始，请耐心等待，期间不要关闭窗口
echo  ============================================================
echo.
echo  === 步骤 1/4: 修复系统组件 ===
sfc /scannow
DISM /Online /Cleanup-Image /RestoreHealth
echo.
echo  === 步骤 2/4: 安装 VC++ 2008 SP1 ===
call :download_install "https://download.microsoft.com/download/5/D/8/5D8C65CB-C849-4025-8E95-C3966CAFD8AE/vcredist_x86.exe" "vcredist2008_x86.exe" "VC++ 2008 SP1 x86"
call :download_install "https://download.microsoft.com/download/3/2/2/3224B87F-CFA0-4E70-BFA3-3DE650EFEBA5/vcredist_x64.exe" "vcredist2008_x64.exe" "VC++ 2008 SP1 x64"
echo.
echo  === 步骤 3/4: 安装 VC++ 2010 SP1 ===
call :download_install "https://download.microsoft.com/download/C/6/D/C6D0FD4E-2E1A-4FA9-A3FC-8586A8DBAB75/vcredist_x86.exe" "vcredist2010_x86.exe" "VC++ 2010 SP1 x86"
call :download_install "https://download.microsoft.com/download/A/8/0/A80A47E3-B4F0-4F0F-8C66-2D53E4F5F2E1/vcredist_x64.exe" "vcredist2010_x64.exe" "VC++ 2010 SP1 x64"
echo.
echo  === 步骤 4/4: 安装 VC++ 2005 SP1 ===
call :download_install "https://download.microsoft.com/download/8/B/4/8B42259F-5D70-43F4-AC2E-4B208FD8D66A/vcredist_x86.exe" "vcredist2005_x86.exe" "VC++ 2005 SP1 x86"
echo.
echo  ============================================================
echo   [√] 全套修复完成!
echo   建议重启电脑后再打开跨越速运客户端
echo  ============================================================
pause
goto menu

:: ============ 6. 查看已安装运行库 ============
:list_vcredist
echo.
echo  [*] 当前已安装的 Visual C++ 运行库:
echo  ------------------------------------------------------------
powershell -Command "Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*Visual C++*' -or $_.DisplayName -like '*VC++ Redist*' } | Select-Object DisplayName,DisplayVersion | Sort-Object DisplayName | Format-Table -AutoSize"
echo.
pause
goto menu

:: ============ 7. 清理旧版本残留 ============
:clean_residue
echo.
echo  [*] 清理 VC++ 旧版本残留注册表项...
echo  [i] 这会移除已损坏的注册记录，让安装包能重新安装
echo  ------------------------------------------------------------
for %%k in (
  "{FF66E9F6-83E7-3A3E-AF14-8DEB1A1F8FE1}"
  "{9A25302D-30C0-39D9-BD6F-21E6EC160475}"
  "{1F1C2DFC-2D24-3E06-BCB8-725134ADF989}"
  "{5DA8F6CD-C60E-44BE-8A0A-9B43A2F4F4E8}"
) do (
  reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\%%k" /f >nul 2>&1
  reg delete "HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\%%k" /f >nul 2>&1
)
echo  [√] 残留清理完成，现在可以重新安装运行库了
echo.
pause
goto menu

:: ============ 8. 重启 Windows Update 服务 ============
:fix_wuauserv
echo.
echo  [*] 重启 Windows Update 相关服务...
echo  ------------------------------------------------------------
net stop wuauserv >nul 2>&1
net stop cryptSvc >nul 2>&1
net stop bits >nul 2>&1
net stop msiserver >nul 2>&1
ren %systemroot%\SoftwareDistribution SoftwareDistribution.old >nul 2>&1
ren %systemroot%\system32\catroot2 catroot2.old >nul 2>&1
net start wuauserv >nul 2>&1
net start cryptSvc >nul 2>&1
net start bits >nul 2>&1
net start msiserver >nul 2>&1
echo  [√] Windows Update 服务已重置，再试安装运行库
echo.
pause
goto menu

:: ============ 下载+安装子过程 ============
:download_install
:: 参数: %1=下载URL  %2=保存文件名  %3=显示名称
set "dl_url=%~1"
set "dl_file=%~2"
set "dl_name=%~3"
set "dl_path=%TEMP%\%dl_file%"

echo.
echo  [*] 正在下载 %dl_name% ...
echo      URL: %dl_url%
powershell -NoProfile -Command "try { $ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '%dl_url%' -OutFile '%dl_path%' -UseBasicParsing -TimeoutSec 120 } catch { Write-Host '[!] 下载失败:' $_.Exception.Message; exit 1 }"
if !errorlevel! neq 0 (
  echo  [!] %dl_name% 下载失败
  echo  [i] 可能微软已下架该版本，请手动搜索下载，或跳过此项
  goto :eof
)
if not exist "%dl_path%" (
  echo  [!] %dl_name% 下载文件不存在，跳过
  goto :eof
)
echo  [√] 下载完成，开始静默安装...
"%dl_path%" /install /quiet /norestart
echo  [√] %dl_name% 安装流程结束
del /f /q "%dl_path%" >nul 2>&1
goto :eof

:end
echo.
echo  感谢使用，再见!
timeout /t 2 >nul
exit /b
