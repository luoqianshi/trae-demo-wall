$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8081/")
$listener.Start()
Write-Host "Server started at http://localhost:8081/"
Write-Host "Press Ctrl+C to stop..."

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

$contentTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
    ".ttf"  = "font/ttf"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $urlPath = $request.Url.LocalPath
    if ($urlPath -eq "/") {
        $urlPath = "/index.html"
    }

    $filePath = Join-Path $rootPath $urlPath.TrimStart("/")

    if (Test-Path $filePath -PathType Leaf) {
        $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = "application/octet-stream"
        if ($contentTypes.ContainsKey($extension)) {
            $contentType = $contentTypes[$extension]
        }

        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentType = $contentType
        $response.ContentLength64 = $content.Length
        $response.StatusCode = 200
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $response.ContentType = "text/plain; charset=utf-8"
        $message = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.ContentLength64 = $message.Length
        $response.OutputStream.Write($message, 0, $message.Length)
    }

    $response.OutputStream.Close()
    $response.Close()
}

$listener.Stop()
