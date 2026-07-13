# 知识库结构化数据清空脚本
# 用法: .\clear-kb-data.ps1 [kbId]
# 示例: .\clear-kb-data.ps1 72d190b9679b5d4f718965f105b10f40

param(
    [Parameter(Mandatory=$false)]
    [string]$KbId = "72d190b9679b5d4f718965f105b10f40",

    [Parameter(Mandatory=$false)]
    [string]$ApiBase = "http://localhost:8111/api"
)

Write-Host "=== 清空知识库结构化数据 ===" -ForegroundColor Cyan
Write-Host "知识库ID: $KbId"
Write-Host "API地址:  $ApiBase"
Write-Host ""

# 1. 先查看当前数据量
Write-Host "--- 当前数据量 ---" -ForegroundColor Yellow
try {
    $graphData = Invoke-RestMethod -Uri "$ApiBase/knowledge-graph/graph-data?kbId=$KbId" -Method Get
    $stats = $graphData.data.stats
    Write-Host "  实体:   $($stats.entities)"
    Write-Host "  事件:   $($stats.events)"
    Write-Host "  观点:   $($stats.viewpoints)"
    Write-Host "  案例:   $($stats.cases)"
    Write-Host "  关系边: $($stats.edges)"
} catch {
    Write-Host "  获取数据失败: $_" -ForegroundColor Red
}

Write-Host ""

# 2. 确认清空
$confirm = Read-Host "确定要清空该知识库的所有结构化数据吗？(y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "已取消" -ForegroundColor Gray
    exit 0
}

# 3. 执行清空
Write-Host ""
Write-Host "--- 执行清空 ---" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$ApiBase/knowledge-graph/clear-data?kbId=$KbId" -Method Post
    $deleted = $result.data
    Write-Host "  实体关系: $($deleted.entityEventRoles)" -ForegroundColor Green
    Write-Host "  事件关系: $($deleted.eventRelations)" -ForegroundColor Green
    Write-Host "  观点:     $($deleted.viewpoints)" -ForegroundColor Green
    Write-Host "  事件:     $($deleted.events)" -ForegroundColor Green
    Write-Host "  案例:     $($deleted.cases)" -ForegroundColor Green
    Write-Host "  实体:     $($deleted.entities)" -ForegroundColor Green
    Write-Host ""
    Write-Host "清空完成!" -ForegroundColor Green
} catch {
    Write-Host "清空失败: $_" -ForegroundColor Red
    exit 1
}

# 4. 验证
Write-Host ""
Write-Host "--- 验证 ---" -ForegroundColor Yellow
try {
    $verify = Invoke-RestMethod -Uri "$ApiBase/knowledge-graph/graph-data?kbId=$KbId" -Method Get
    $vstats = $verify.data.stats
    Write-Host "  实体:   $($vstats.entities)"
    Write-Host "  事件:   $($vstats.events)"
    Write-Host "  观点:   $($vstats.viewpoints)"
    Write-Host "  案例:   $($vstats.cases)"
    Write-Host "  关系边: $($vstats.edges)"
} catch {
    Write-Host "  验证失败: $_" -ForegroundColor Red
}
