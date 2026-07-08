$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8765/')
$listener.Start()
Write-Host "Server started at http://localhost:8765/"
$root = 'C:\Users\seobi\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\work-mode-projects\6a4a005e8bf80c9252efd5cd\memorization-app\preview'
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $url = $ctx.Request.Url.LocalPath
    if ($url -eq '/') { $url = '/index.html' }
    $file = Join-Path $root $url.TrimStart('/')
    if (Test-Path $file -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ctx.Response.ContentType = 'text/html; charset=utf-8'
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
}
