$content = Get-Content -Path "src\data\historicalEvents.ts" -Raw

$idMap = @{}
$counter = 1

$newContent = [regex]::Replace($content, 'id:\s*[''"]([^'"]+)['"]', {
    param($match)
    $oldId = $match.Groups[1].Value
    if (-not $idMap.ContainsKey($oldId)) {
        $idMap[$oldId] = 1
        return "id: '$oldId'"
    } else {
        $idMap[$oldId]++
        $newId = "$($oldId)-dup$($idMap[$oldId])"
        return "id: '$newId'"
    }
})

Set-Content -Path "src\data\historicalEvents.ts" -Value $newContent -Encoding UTF8

Write-Output "Done! Updated IDs to be unique."
