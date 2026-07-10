$root = "d:\code\snowball-diary\snowball-diary-new"
$exclude = @('node_modules', '.next', 'release', '.git', 'ai-collaboration-workflow-skill')

$total = 0
Get-ChildItem $root -Recurse -Directory | Where-Object {
    $parts = $_.FullName.Substring($root.Length).TrimStart('\').Split('\')
    $skip = $false
    foreach ($e in $exclude) { if ($parts -contains $e) { $skip = $true; break } }
    -not $skip
} | ForEach-Object {
    Get-ChildItem $_.FullName -File -ErrorAction SilentlyContinue | ForEach-Object { $total += $_.Length }
}
Get-ChildItem $root -File | ForEach-Object { $total += $_.Length }

Write-Host "源码（不含 node_modules/.next/release）总大小: $([math]::Round($total/1MB, 1)) MB"

# 也检查 .next 大小（构建产物，可能需要）
$nextPath = Join-Path $root ".next"
if (Test-Path $nextPath) {
    # 排除 standalone 子目录
    $nextSize = 0
    Get-ChildItem $nextPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch '\\standalone\\'
    } | ForEach-Object { $nextSize += $_.Length }
    Write-Host ".next（不含 standalone）: $([math]::Round($nextSize/1MB, 1)) MB"
}

# node_modules 的 production 依赖大小
$nmPath = Join-Path $root "node_modules"
if (Test-Path $nmPath) {
    $nmSize = (Get-ChildItem $nmPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Write-Host "node_modules（全部）: $([math]::Round($nmSize/1MB, 1)) MB"
}
