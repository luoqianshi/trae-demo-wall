$appIds = @()
$content = Get-Content 'e:\DingStudy\app-v2\app.js' -Raw
$matches = [regex]::Matches($content, "'(#[a-zA-Z][a-zA-Z0-9_-]+)'")
foreach ($m in $matches) {
    $appIds += $m.Groups[1].Value.Substring(1)
}
$appIds = $appIds | Sort-Object -Unique

$htmlContent = Get-Content 'e:\DingStudy\app-v2\index.html' -Raw
$htmlIds = @()
$matches2 = [regex]::Matches($htmlContent, 'id="([a-zA-Z][a-zA-Z0-9_-]+)"')
foreach ($m in $matches2) {
    $htmlIds += $m.Groups[1].Value
}
$htmlIds = $htmlIds | Sort-Object -Unique

Write-Host "=== HTML 中所有 ID 数量: $($htmlIds.Count) ==="
Write-Host "=== app.js 中引用的 ID 数量: $($appIds.Count) ==="
Write-Host ""
Write-Host "=== app.js 引用但 HTML 中缺失的 ID: ==="
foreach ($id in $appIds) {
    if ($htmlIds -notcontains $id) {
        Write-Host "  MISSING: $id"
    }
}
Write-Host ""
Write-Host "=== HTML 中存在但 app.js 未引用的 ID: ==="
foreach ($id in $htmlIds) {
    if ($appIds -notcontains $id) {
        Write-Host "  UNUSED: $id"
    }
}
