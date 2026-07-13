$filePath = 'e:\Menu 4\index.html'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Check line endings
$crlfCount = ([regex]::Matches($content, "`r`n")).Count
$lfOnlyCount = ([regex]::Matches($content, "(?<!`r)`n")).Count
Write-Output "CRLF count: $crlfCount"
Write-Output "LF-only count: $lfOnlyCount"

# Get first 200 chars after 'function addToCart'
$idx = $content.IndexOf('function addToCart(dishId)')
Write-Output "Index of 'function addToCart(dishId)': $idx"

# Check the byte at idx-1
if ($idx -gt 0) {
    $charBefore = $content[$idx-1]
    Write-Output "Char before function (codepoint): $([int][char]$charBefore)"
}

# Get 200 chars before
$start = [Math]::Max(0, $idx - 20)
$beforeText = $content.Substring($start, $idx - $start)
Write-Output "20 chars before 'function addToCart': [$beforeText]"

# Get 200 chars after
$afterText = $content.Substring($idx, [Math]::Min(300, $content.Length - $idx))
# Print only first 100 chars of the snippet
Write-Output "After snippet (first 100): [$($afterText.Substring(0, [Math]::Min(100, $afterText.Length)))]"

# Now check our old1
$old1 = @"
        function addToCart(dishId) {
            const existingItem = cart.find(item => item.dishId === dishId);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ dishId, quantity: 1 });
            }
            renderDishes();
            const dish = dishes.find(d => d.id === dishId);
            showToast(``已添加 `${dish.name}``);
        }
"@

Write-Output "old1 length: $($old1.Length)"
Write-Output "old1 first 50 chars (codepoints): $([System.Text.Encoding]::UTF8.GetBytes($old1.Substring(0, 50)) | ForEach-Object { '{0:X2}' -f $_ })"
Write-Output "afterText first 50 chars (codepoints): $([System.Text.Encoding]::UTF8.GetBytes($afterText.Substring(0, 50)) | ForEach-Object { '{0:X2}' -f $_ })"
