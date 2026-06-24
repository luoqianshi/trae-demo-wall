# YaraFlow - Race Detector 测试脚本
# 用法: .\test_race.ps1 [-Package <package>]
#
# Go race detector 说明:
#   -race 标志会在编译时插入竞态检测代码，运行时检测并发数据竞争
#   内存占用约为正常编译的 5-10 倍，需要足够的系统内存
#   建议在 CI 环境或开发机上运行，不建议在资源受限的沙箱中运行
#
# 如果本机内存不足，可以指定单个包测试:
#   .\test_race.ps1 -Package ./internal/llm/...

param(
    [string]$Package = "./..."  # 默认测试所有包
)

$ErrorActionPreference = "Stop"

Write-Host "=== YaraFlow Race Detector ===" -ForegroundColor Cyan
Write-Host "Target: $Package" -ForegroundColor Gray
Write-Host ""
Write-Host "[WARN] Race detector 需要 5-10x 内存，请确保系统有足够可用内存" -ForegroundColor Yellow
Write-Host ""

Write-Host ">>> Running: go test -race -count=1 -timeout=10m $Package" -ForegroundColor Gray
Write-Host ""

go test -race -count=1 -timeout=10m $Package

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Race Detector: PASSED (no data races detected) ===" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=== Race Detector: FAILED (data races found or build error) ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "如果遇到 'out of memory' 错误，请尝试:" -ForegroundColor Yellow
    Write-Host "  1. 逐个包测试: .\test_race.ps1 -Package ./internal/llm/..." -ForegroundColor Gray
    Write-Host "  2. 增加系统虚拟内存/页面文件大小" -ForegroundColor Gray
    Write-Host "  3. 在 CI 环境运行（GitHub Actions 有更多内存）" -ForegroundColor Gray
}