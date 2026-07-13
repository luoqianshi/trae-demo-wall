$filePath = 'e:\Menu 4\index.html'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

$idx = $content.IndexOf('function addToCart(dishId)')
Write-Output "Index: $idx"

# Bytes 84655-84662 should be 8 spaces
$start = $idx - 8
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content.Substring($start, 8))
Write-Output "8 bytes before function: $($bytes | ForEach-Object { '{0:X2}' -f $_ })"

# Try Contains with simpler patterns
$simple = "function addToCart(dishId) {"
$contains1 = $content.Contains($simple)
Write-Output "Contains 'function addToCart(dishId) {': $contains1"

$simple2 = "        function addToCart(dishId) {"
$contains2 = $content.Contains($simple2)
Write-Output "Contains '        function addToCart(dishId) {': $contains2"

$simple3 = "function addToCart(dishId) {`r`n            const existingItem"
$contains3 = $content.Contains($simple3)
Write-Output "Contains CRLF variant: $contains3"

$simple4 = "function addToCart(dishId) {`n            const existingItem"
$contains4 = $content.Contains($simple4)
Write-Output "Contains LF variant: $contains4"

# Now full old1 - try a different approach
$old1 = "        function addToCart(dishId) {`n            const existingItem = cart.find(item => item.dishId === dishId);`n            if (existingItem) {`n                existingItem.quantity++;`n            } else {`n                cart.push({ dishId, quantity: 1 });`n            }`n            renderDishes();`n            const dish = dishes.find(d => d.id === dishId);`n            showToast(`已添加 ${dish.name}`);`n        }"
$contains5 = $content.Contains($old1)
Write-Output "Contains full old1 (string concat with `n): $contains5"
Write-Output "old1 length: $($old1.Length)"

# Test using here-string with the @' '@ form (literal string, no expansion)
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
$contains6 = $content.Contains($old1b)
Write-Output "Contains full old1 (literal here-string @' '@): $contains6"
Write-Output "old1b length: $($old1b.Length)"
Write-Output "old1b first 30 bytes: $([System.Text.Encoding]::UTF8.GetBytes($old1b.Substring(0, [Math]::Min(30, $old1b.Length))) | ForEach-Object { '{0:X2}' -f $_ })"
