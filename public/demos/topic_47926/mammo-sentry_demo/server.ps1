# PowerShell 简易HTTP服务器脚本
# 用法: powershell -ExecutionPolicy Bypass -File server.ps1
$port = 5173
$root = $PSScriptRoot
$prefix = "http://localhost:$port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
  Write-Host "MammoSentry running at $prefix" -ForegroundColor Cyan
  Write-Host "Open in browser: $prefix" -ForegroundColor Green
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response

    $path = $req.Url.AbsolutePath
    if ($path -eq '/') { $path = '/index.html' }
    $file = Join-Path $root ($path.TrimStart('/'))

    if (Test-Path $file -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $mime = switch ($ext) {
        '.html' { 'text/html; charset=utf-8' }
        '.css'  { 'text/css; charset=utf-8' }
        '.js'   { 'application/javascript; charset=utf-8' }
        '.json' { 'application/json; charset=utf-8' }
        '.png'  { 'image/png' }
        '.svg'  { 'image/svg+xml' }
        default { 'application/octet-stream' }
      }
      $res.ContentType = $mime
      $res.ContentLength64 = $bytes.Length
      $res.Headers.Add('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      $res.Headers.Add('Pragma', 'no-cache')
      $res.Headers.Add('Expires', '0')
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
    $res.Close()
  }
}
finally {
  if ($listener.IsListening) { $listener.Stop() }
}
