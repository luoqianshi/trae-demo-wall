$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$ipAddresses = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq 'IPv4' -and $_.InterfaceAlias -notlike 'Loopback*' }).IPAddress
$localIp = if ($ipAddresses) { $ipAddresses[0] } else { '127.0.0.1' }
$listener.Prefixes.Add("http://$localIp`:8080/")
$listener.Start()

Write-Host '=============================================='
Write-Host '  日本語秘境 - 服务器已启动'
Write-Host '=============================================='
Write-Host ''
Write-Host "  本地访问: http://localhost:8080/"
Write-Host "  网络访问: http://$localIp`:8080/"
Write-Host ''
Write-Host '=============================================='

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $url = $ctx.Request.Url.AbsolutePath
    if ($url -eq '/') { $url = '/index.html' }
    $path = Join-Path 'c:\Users\Administrator\Desktop\riyu2' $url.TrimStart('/')
    
    if (Test-Path $path -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($path)
        $ctx.Response.ContentLength64 = $content.Length
        $ctx.Response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $ctx.Response.StatusCode = 404
    }
    
    $ctx.Response.Close()
}