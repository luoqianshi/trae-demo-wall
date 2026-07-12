$inputFile = 'c:\Users\Administrator\Desktop\ai\huilv\src\data\historicalEvents.ts'
$outputFile = 'c:\Users\Administrator\Desktop\ai\huilv\src\data\historicalEvents_fixed.ts'

$content = Get-Content $inputFile -Raw

$pattern = '(export const events: HistoricalEvent\[\] = \[)([\s\S]*?)(\])'

$matches = [regex]::Match($content, $pattern)
if ($matches.Success) {
    $eventsContent = $matches.Groups[2].Value
    
    $counter = 1
    $fixedEventsContent = [regex]::Replace($eventsContent, 'id:\s*''[^'']*''', {
        param($match)
        $result = "id: 'evt{0:D3}'" -f $script:counter
        $script:counter++
        return $result
    })
    
    $content = $content.Remove($matches.Groups[2].Index, $matches.Groups[2].Length).Insert($matches.Groups[2].Index, $fixedEventsContent)
    
    [System.IO.File]::WriteAllText($outputFile, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Done! Processed $counter events."
} else {
    Write-Host "Pattern not found!"
}