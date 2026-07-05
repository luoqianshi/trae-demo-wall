$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:8765/')
$listener.Start()
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $urlPath = $request.Url.LocalPath
    if ($urlPath -eq '/') { $urlPath = '/smart_home.html' }
    $filePath = Join-Path 'h:\trae' $urlPath.TrimStart('/')
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $mime = 'application/octet-stream'
        if ($ext -eq '.html') { $mime = 'text/html' }
        elseif ($ext -eq '.zip') { $mime = 'application/zip' }
        $response.ContentType = $mime
        $response.ContentLength64 = $content.Length
        $response.StatusCode = 200
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
    }
    $response.OutputStream.Close()
    $response.Close()
}
$listener.Stop()
