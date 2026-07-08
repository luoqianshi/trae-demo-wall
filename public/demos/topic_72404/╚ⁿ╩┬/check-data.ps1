$content = Get-Content "d:\赛事\facilities-data.js" -Raw -Encoding UTF8

# 提取 FACILITIES_DATA 对象
$jsonStart = $content.IndexOf('{')
$jsonEnd = $content.LastIndexOf('};')
$jsonStr = $content.Substring($jsonStart, $jsonEnd - $jsonStart + 1)

# 使用 PowerShell 的 ConvertFrom-Json
try {
    $data = $jsonStr | ConvertFrom-Json
    $cities = $data.PSObject.Properties.Name
    Write-Host "=== 数据文件中的城市列表 ===" -ForegroundColor Cyan
    Write-Host "城市总数: $($cities.Count)" -ForegroundColor Yellow
    Write-Host ""
    
    $targetCities = @('北京','上海','广州','深圳','成都','杭州','武汉','南京','西安','重庆','天津','苏州','郑州','长沙','东莞','青岛','沈阳','大连','佛山','宁波','无锡','合肥')
    
    Write-Host "=== 目标城市覆盖情况 ===" -ForegroundColor Cyan
    $found = @()
    $missing = @()
    foreach ($city in $targetCities) {
        if ($cities -contains $city) {
            $found += $city
            $districts = $data.$city.PSObject.Properties.Name
            $streetCount = 0
            foreach ($d in $districts) {
                $streets = $data.$city.$d.PSObject.Properties.Name
                $streetCount += $streets.Count
            }
            Write-Host "  [OK] $city - $($districts.Count) 个区, $streetCount 个街道" -ForegroundColor Green
        } else {
            $missing += $city
            Write-Host "  [缺失] $city" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "已覆盖: $($found.Count)/$($targetCities.Count) 个城市" -ForegroundColor Yellow
    if ($missing.Count -gt 0) {
        Write-Host "缺失城市: $($missing -join ', ')" -ForegroundColor Red
    }
} catch {
    Write-Host "解析失败: $_" -ForegroundColor Red
}
