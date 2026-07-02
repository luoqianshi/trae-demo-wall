$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:9000/')
$listener.Start()
Write-Host "Server running at http://localhost:9000/"

$root = $PSScriptRoot
if (-not $root) { $root = 'd:\traecompetition' }

$mimes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.json' = 'application/json; charset=utf-8'
}

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $path = $req.Url.AbsolutePath
    if ($path -eq '/' -or $path -eq '') { $path = '/launcher.html' }

    $filePath = Join-Path $root ($path.TrimStart('/'))

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $mime = if ($mimes.ContainsKey($ext)) { $mimes[$ext] } else { 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentType = $mime
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.OutputStream.Close()
        Write-Host "200 $path"
    } else {
        $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $res.StatusCode = 404
        $res.ContentType = 'text/plain; charset=utf-8'
        $res.ContentLength64 = $body.Length
        $res.OutputStream.Write($body, 0, $body.Length)
        $res.OutputStream.Close()
        Write-Host "404 $path"
    }
}
