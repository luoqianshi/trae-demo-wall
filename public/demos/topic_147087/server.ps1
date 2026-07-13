Add-Type -AssemblyName System.Web
$port = 8765
$listener = $null
while ($port -le 8770) {
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add('http://localhost:' + $port + '/')
  try {
    $listener.Start()
    break
  } catch {
    $listener.Close()
    $listener = $null
    $port++
  }
}
if (-not $listener) {
  Write-Error 'Unable to start local server (tried ports 8765-8770)'
  exit 1
}
Write-Host ('Server started at http://localhost:' + $port + '/')
$root = Get-Location
while($listener.IsListening){
  $context = $listener.GetContext()
  $path = $context.Request.Url.LocalPath
  if($path -eq '/'){ $path = '/index.html' }
  $fullPath = Join-Path $root $path.TrimStart('/')
  if(Test-Path $fullPath -PathType Leaf){
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $context.Response.ContentType = [System.Web.MimeMapping]::GetMimeMapping($fullPath)
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $context.Response.StatusCode = 404
  }
  $context.Response.Close()
}
