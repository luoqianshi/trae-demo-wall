$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ports = 8765..8785
$listener = $null
$port = $null

foreach ($p in $ports) {
  try {
    $testListener = [System.Net.HttpListener]::new()
    $testListener.Prefixes.Add("http://localhost:$p/")
    $testListener.Start()
    $listener = $testListener
    $port = $p
    break
  } catch {
    if ($testListener) { try { $testListener.Close() } catch {} }
  }
}

if (-not $listener) {
  throw '没有找到可用端口（8765-8785）。'
}

Start-Process "http://localhost:$port/xiaoxi-zhinan-demo.html"
Write-Host "小息指南已启动：http://localhost:$port/xiaoxi-zhinan-demo.html"
Write-Host "关闭这个窗口即可停止服务。"

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = $context.Request.Url.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath = 'xiaoxi-zhinan-demo.html' }
    $filePath = Join-Path $root $requestPath

    if (-not (Test-Path $filePath -PathType Leaf)) {
      $context.Response.StatusCode = 404
      $buffer = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $context.Response.OutputStream.Write($buffer, 0, $buffer.Length)
      $context.Response.Close()
      continue
    }

    $ext = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
    $mime = switch ($ext) {
      '.html' { 'text/html; charset=utf-8' }
      '.js'   { 'application/javascript; charset=utf-8' }
      '.css'  { 'text/css; charset=utf-8' }
      '.jpg'  { 'image/jpeg' }
      '.jpeg' { 'image/jpeg' }
      '.png'  { 'image/png' }
      '.webp' { 'image/webp' }
      default { 'application/octet-stream' }
    }

    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $context.Response.ContentType = $mime
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
}
finally {
  if ($listener -and $listener.IsListening) { $listener.Stop() }
  if ($listener) { $listener.Close() }
}
