$filePath = 'e:\Menu 4\index.html'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# === REPLACEMENT 3: submitOrder ===
# Find all showToast occurrences in the file and locate the one followed by renderTodayMenu()
$searchStart = 0
$targetIdx = -1
$toastLine = $null
$renderLine = $null
while ($true) {
    $idx3 = $content.IndexOf("showToast('", $searchStart)
    if ($idx3 -lt 0) { break }

    # Check if the next non-empty line is renderTodayMenu()
    $lineEnd = $content.IndexOf("`n", $idx3)
    $nextLineStart = $lineEnd + 1
    $nextLineEnd = $content.IndexOf("`n", $nextLineStart)
    $nextLine = $content.Substring($nextLineStart, $nextLineEnd - $nextLineStart)

    if ($nextLine.Trim() -eq "renderTodayMenu();") {
        $lineStart = $content.LastIndexOf("`n", $idx3 - 1) + 1
        $toastLine = $content.Substring($lineStart, $lineEnd - $lineStart)
        $targetIdx = $idx3
        $renderLine = $nextLine
        break
    }

    $searchStart = $idx3 + 1
}

if ($targetIdx -ge 0 -and $toastLine -ne $null) {
    $old3 = $toastLine + "`n" + $renderLine
    $new3 = $toastLine + "`n            updateCartBottomBar();`n" + $renderLine

    if ($content.Contains($old3)) {
        $content = $content.Replace($old3, $new3)
        Write-Output "Replacement 3 (submitOrder) applied successfully"
    } else {
        Write-Output "Replacement 3: exact match not found"
    }
} else {
    Write-Output "Replacement 3: target showToast not found"
}

# Write the file back
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Output "File written successfully"
