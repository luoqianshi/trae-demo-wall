$filePath = 'e:\Menu 4\index.html'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Read the function from the file (84655 to 84655+414)
$idx = $content.IndexOf('function addToCart(dishId)')
$fileFn = $content.Substring($idx - 8, 414)
$fileBytes = [System.Text.Encoding]::UTF8.GetBytes($fileFn)
Write-Output "fileFn length: $($fileFn.Length)"

# old1b from literal here-string
$old1b = @'
        function addToCart(dishId) {
            const existingItem = cart.find(item => item.dishId === dishId);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ dishId, quantity: 1 });
            }
            renderDishes();
            const dish = dishes.find(d => d.id === dishId);
            showToast(`已添加 ${dish.name}`);
        }
'@
$old1bBytes = [System.Text.Encoding]::UTF8.GetBytes($old1b)
Write-Output "old1b length: $($old1b.Length)"

# Find first difference
$minLen = [Math]::Min($fileBytes.Length, $old1bBytes.Length)
for ($i = 0; $i -lt $minLen; $i++) {
    if ($fileBytes[$i] -ne $old1bBytes[$i]) {
        $fHex = '{0:X2}' -f $fileBytes[$i]
        $oHex = '{0:X2}' -f $old1bBytes[$i]
        Write-Output "First diff at byte $i : file=0x$fHex old1b=0x$oHex"
        $startIdx = [Math]::Max(0, $i-5)
        $endIdx = [Math]::Min($fileBytes.Length-1, $i+15)
        $fContext = ($fileBytes[$startIdx..$endIdx] | ForEach-Object { '{0:X2}' -f $_ }) -join ' '
        $oContext = ($old1bBytes[$startIdx..$endIdx] | ForEach-Object { '{0:X2}' -f $_ }) -join ' '
        Write-Output "Context (file):  $fContext"
        Write-Output "Context (old1b): $oContext"
        break
    }
}
if ($fileBytes.Length -ne $old1bBytes.Length) {
    Write-Output "Lengths differ: file=$($fileBytes.Length), old1b=$($old1bBytes.Length)"
}
