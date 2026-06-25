# 语瞳 Demo 编译脚本
# 用法: .\build.ps1

$ErrorActionPreference = "Stop"
chcp 65001 > $null
[Console]::OutputEncoding = [Text.Encoding]::UTF8

Write-Host ""
Write-Host "  [语瞳 Demo] 开始编译..." -ForegroundColor Cyan
Write-Host ""

# 1. 编译前端
Write-Host "  [1/2] 编译前端..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\webui"
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "  [1/2] 前端编译失败" -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host "  [1/2] 前端编译完成" -ForegroundColor Green

# 2. 编译 Go 后端
Write-Host "  [2/2] 编译 Go 后端..." -ForegroundColor Yellow
$env:CGO_ENABLED = "1"
go build -ldflags="-s -w" -o demo.exe .\cmd\agent\
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [2/2] Go 编译失败" -ForegroundColor Red
    exit 1
}
Write-Host "  [2/2] Go 编译完成" -ForegroundColor Green

# 结果
$size = [math]::Round((Get-Item "$PSScriptRoot\demo.exe").Length / 1MB, 1)
Write-Host ""
Write-Host "  demo.exe 编译成功! 大小: ${size}MB" -ForegroundColor Cyan
Write-Host "  双击运行，Ctrl+C 关闭" -ForegroundColor Cyan
Write-Host ""