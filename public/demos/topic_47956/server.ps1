$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8000/")
$listener.Start()
Write-Host "Server running at http://localhost:8000"
Write-Host "Press Ctrl+C to stop"

$rootPath = "c:\Users\27170\Desktop\health\demo"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $url = $request.Url.LocalPath
    if ($url -eq "/") {
        $url = "/index.html"
    }
    
    $filePath = Join-Path $rootPath $url.TrimStart("/")
    
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $extension = [System.IO.Path]::GetExtension($filePath)
        
        switch ($extension) {
            ".html" { $response.ContentType = "text/html; charset=utf-8" }
            ".css" { $response.ContentType = "text/css; charset=utf-8" }
            ".js" { $response.ContentType = "application/javascript; charset=utf-8" }
            ".json" { $response.ContentType = "application/json; charset=utf-8" }
            default { $response.ContentType = "application/octet-stream" }
        }
        
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $message = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.ContentLength64 = $message.Length
        $response.OutputStream.Write($message, 0, $message.Length)
    }
    
    $response.OutputStream.Close()
    $response.Close()
}

$listener.Stop()
