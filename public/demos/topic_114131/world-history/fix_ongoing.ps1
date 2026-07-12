$inputFile = 'c:\Users\Administrator\Desktop\ai\huilv\src\data\historicalEvents.ts'
$outputFile = 'c:\Users\Administrator\Desktop\ai\huilv\src\data\historicalEvents_updated.ts'

$content = Get-Content $inputFile -Raw

$ongoingEvents = @(
    '俄乌冲突',
    '反恐战争',
    '阿富汗战争',
    '叙利亚内战',
    '以色列-哈马斯冲突',
    '中美贸易战',
    '全球气候变化'
)

foreach ($eventTitle in $ongoingEvents) {
    $pattern = "(title:\s*'[^']*$eventTitle[^']*')[^}]*endYear:\s*\d+"
    $content = $content -replace $pattern, "`$1`n    endYear: '至今'"
}

[System.IO.File]::WriteAllText($outputFile, $content, [System.Text.Encoding]::UTF8)
Write-Host "Done!"