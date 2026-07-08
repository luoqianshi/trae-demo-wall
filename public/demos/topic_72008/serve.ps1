$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:7777/')
$listener.Start()
Write-Host 'listening on http://localhost:7777/'
$types = @{
  '.html' = 'text/html;charset=utf-8'
  '.css'  = 'text/css;charset=utf-8'
  '.js'   = 'application/javascript;charset=utf-8'
}
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $resp = $ctx.Response
  $path = $req.Url.LocalPath
  if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
  $f = Join-Path (Get-Location) $path.TrimStart('/')
  if (Test-Path $f) {
    $bytes = [System.IO.File]::ReadAllBytes($f)
    $ext = [System.IO.Path]::GetExtension($f)
    if ($types.ContainsKey($ext)) { $resp.ContentType = $types[$ext] }
    $resp.ContentLength64 = $bytes.Length
    $resp.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $resp.StatusCode = 404
  }
  $resp.Close()
}
