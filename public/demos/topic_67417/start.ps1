$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:3003/')
$listener.Start()

Write-Host '==============================================' -ForegroundColor Cyan
Write-Host '          ANDA FMEA 智能质量工作台' -ForegroundColor Cyan
Write-Host '==============================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '服务器已启动: http://localhost:3003' -ForegroundColor Green
Write-Host ''
Write-Host '按 Ctrl+C 停止服务器' -ForegroundColor Yellow
Write-Host ''

Start-Process 'http://localhost:3003'

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.LocalPath
    
    if ($localPath -eq '/') {
        $localPath = '/index.html'
    }
    
    $filePath = Join-Path $scriptDir $localPath.TrimStart('/')
    
    if (Test-Path $filePath -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $bytes.Length
        
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        
        switch ($ext) {
            '.html' { $response.ContentType = 'text/html; charset=utf-8' }
            '.js' { $response.ContentType = 'application/javascript; charset=utf-8' }
            '.css' { $response.ContentType = 'text/css; charset=utf-8' }
            '.svg' { $response.ContentType = 'image/svg+xml' }
            '.png' { $response.ContentType = 'image/png' }
            '.jpg' { $response.ContentType = 'image/jpeg' }
            '.woff2' { $response.ContentType = 'font/woff2' }
            '.json' { $response.ContentType = 'application/json; charset=utf-8' }
            default { $response.ContentType = 'application/octet-stream' }
        }
        
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}