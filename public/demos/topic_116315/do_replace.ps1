$filePath = 'e:\Menu 4\index.html'
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# === REPLACEMENT 1: addToCart function ===
# Read the original addToCart function from the file (we know its position from earlier debug)
$idx = $content.IndexOf('function addToCart(dishId)')
$originalAddToCart = $content.Substring($idx, 414)  # length is 414

# Construct new addToCart: insert "updateCartBottomBar();" before "renderDishes();"
$newAddToCart = $originalAddToCart.Replace("            renderDishes();", "            updateCartBottomBar();`n            renderDishes();")

# New function to add after addToCart (no Chinese characters here)
$newFunction = @"

        function updateCartBottomBar() {
            const bar = document.getElementById('cart-bottom-bar');
            const count = document.getElementById('cart-bottom-count');
            if (!bar) return;
            const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (totalCount > 0) {
                bar.classList.remove('hidden');
                count.textContent = totalCount;
            } else {
                bar.classList.add('hidden');
            }
        }
"@

$replacement1 = $newAddToCart + $newFunction

if ($content.Contains($originalAddToCart)) {
    $content = $content.Replace($originalAddToCart, $replacement1)
    Write-Output "Replacement 1 (addToCart) applied successfully"
} else {
    Write-Output "Replacement 1: original text not found"
}

# === REPLACEMENT 2: removeFromCart function ===
# Find the function by markers
$idx2 = $content.IndexOf('function removeFromCart(dishId)')
$endMarkerIdx2 = $content.IndexOf("            renderCartItems();", $idx2)
$endOfFn2 = $content.IndexOf("`n        }", $endMarkerIdx2) + 10
$originalRemoveFromCart = $content.Substring($idx2, $endOfFn2 - $idx2)

# Insert updateCartBottomBar() before renderDishes()
$newRemoveFromCart = $originalRemoveFromCart.Replace("            renderDishes();", "            updateCartBottomBar();`n            renderDishes();")

if ($content.Contains($originalRemoveFromCart)) {
    $content = $content.Replace($originalRemoveFromCart, $newRemoveFromCart)
    Write-Output "Replacement 2 (removeFromCart) applied successfully"
} else {
    Write-Output "Replacement 2: original text not found"
}

# === REPLACEMENT 3: submitOrder ===
# Find the showToast line for "点餐成功" (we read this from the file so Chinese is preserved)
$idx3 = $content.IndexOf("showToast('")
$lineStart = $content.LastIndexOf("`n", $idx3 - 1) + 1
$lineEnd = $content.IndexOf("`n", $idx3)
$toastLine = $content.Substring($lineStart, $lineEnd - $lineStart)

# Find the next renderTodayMenu() line
$renderIdx = $content.IndexOf("            renderTodayMenu();", $idx3)
$renderLineEnd = $content.IndexOf("`n", $renderIdx)
$renderLine = $content.Substring($renderIdx, $renderLineEnd - $renderIdx)

$old3 = $toastLine + "`n" + $renderLine
$new3 = $toastLine + "`n            updateCartBottomBar();`n" + $renderLine

if ($content.Contains($old3)) {
    $content = $content.Replace($old3, $new3)
    Write-Output "Replacement 3 (submitOrder) applied successfully"
} else {
    Write-Output "Replacement 3: original text not found"
    Write-Output "old3 (debug): $old3"
}

# Write the file back
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Output "File written successfully"
