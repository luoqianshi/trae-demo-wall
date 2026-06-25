$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8088/')
$listener.Start()
Write-Host '================================='
Write-Host ' PromptCraft 智提示 - Demo Server'
Write-Host '================================='
Write-Host ''
Write-Host 'Server started on: http://localhost:8088'
Write-Host ''
Write-Host 'Press Ctrl+C to stop the server'
Write-Host ''

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $url = $ctx.Request.Url.AbsolutePath
    
    if ($url -eq '/') {
        $url = '/index.html'
    }
    
    $filePath = Join-Path $PWD.Path $url.TrimStart('/')
    
    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $contentType = switch ($ext) {
            '.html' { 'text/html; charset=utf-8' }
            '.css' { 'text/css; charset=utf-8' }
            '.js' { 'application/javascript; charset=utf-8' }
            default { 'application/octet-stream' }
        }
        
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ctx.Response.ContentType = $contentType
        $ctx.Response.ContentLength64 = $content.Length
        $ctx.Response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $ctx.Response.StatusCode = 404
        $notFoundContent = [System.Text.Encoding]::UTF8.GetBytes('<html><body><h1>404 Not Found</h1></body></html>')
        $ctx.Response.ContentType = 'text/html'
        $ctx.Response.ContentLength64 = $notFoundContent.Length
        $ctx.Response.OutputStream.Write($notFoundContent, 0, $notFoundContent.Length)
    }
    
    $ctx.Response.Close()
}

$listener.Stop()