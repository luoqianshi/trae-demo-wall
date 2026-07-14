# ============================================================
# 一句话头像灵感站 - 启动脚本 (PowerShell)
# 1. 检测 Python
# 2. 没有虚拟环境则创建
# 3. 没有依赖则安装
# 4. 启动后端
# ============================================================

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  一句话头像灵感站 - 启动脚本 (PowerShell)"   -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---- 1. 检测 Python ----
Write-Host "[1/4] 检测 Python ..." -ForegroundColor Yellow
$PyCmd = $null

# 优先用 py 启动器
$pyLauncher = Get-Command py -ErrorAction SilentlyContinue
if ($pyLauncher) {
    $PyCmd = "py"
} else {
    # 回退到 python
    $pythonExe = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonExe) {
        $PyCmd = "python"
    }
}

if (-not $PyCmd) {
    Write-Host ""
    Write-Host "[错误] 未检测到 Python，请先安装 Python 3.8+ 并加入 PATH。" -ForegroundColor Red
    Write-Host "       下载地址: https://www.python.org/downloads/" -ForegroundColor Red
    Write-Host ""
    exit 1
}

$pyVersion = & $PyCmd --version 2>&1
Write-Host "       $pyVersion"
Write-Host "       Python 路径: $((Get-Command $PyCmd).Source)"
Write-Host ""

# ---- 2. 检测/创建虚拟环境 ----
Write-Host "[2/4] 检测虚拟环境 ..." -ForegroundColor Yellow
$VenvDir = Join-Path $ProjectDir ".venv"
$VenvPy = Join-Path $VenvDir "Scripts\python.exe"

if (Test-Path $VenvPy) {
    Write-Host "       虚拟环境已存在: $VenvDir"
} else {
    Write-Host "       未检测到虚拟环境，正在创建 ..."
    & $PyCmd -m venv $VenvDir
    if (-not (Test-Path $VenvPy)) {
        Write-Host ""
        Write-Host "[错误] 虚拟环境创建失败。" -ForegroundColor Red
        exit 1
    }
    Write-Host "       虚拟环境已创建: $VenvDir" -ForegroundColor Green
}
Write-Host ""

# ---- 3. 检测/安装依赖 ----
Write-Host "[3/4] 检测依赖 ..." -ForegroundColor Yellow
# 用 fastapi 是否可导入来判断依赖是否已装
$importCheck = & $VenvPy -c "import fastapi" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "       依赖已安装，跳过安装。"
} else {
    $ReqFile = Join-Path $ProjectDir "backend\requirements.txt"
    if (-not (Test-Path $ReqFile)) {
        Write-Host ""
        Write-Host "[错误] 未找到 backend\requirements.txt" -ForegroundColor Red
        exit 1
    }
    Write-Host "       依赖未安装，正在安装 requirements.txt ..."
    & $VenvPy -m pip install --upgrade pip -q
    & $VenvPy -m pip install -r $ReqFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[错误] 依赖安装失败，请检查网络或手动安装。" -ForegroundColor Red
        exit 1
    }
    Write-Host "       依赖安装完成。" -ForegroundColor Green
}
Write-Host ""

# ---- 4. 启动后端 ----
Write-Host "[4/4] 启动后端服务 ..." -ForegroundColor Yellow
Write-Host "       工作目录: $ProjectDir\backend"
Write-Host "       访问地址: http://localhost:8000/" -ForegroundColor Cyan
Write-Host "       按 Ctrl+C 停止服务"
Write-Host "--------------------------------------------"
Write-Host ""

Set-Location (Join-Path $ProjectDir "backend")
& $VenvPy main.py
