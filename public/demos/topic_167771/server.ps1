[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 8080,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$rootPath = [System.IO.Path]::GetFullPath($PSScriptRoot)
$rootPrefix = $rootPath.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$utf8 = New-Object System.Text.UTF8Encoding($false)
$ascii = [System.Text.Encoding]::ASCII

$mimeTypes = @{
  ".css" = "text/css; charset=utf-8"
  ".html" = "text/html; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".svg" = "image/svg+xml; charset=utf-8"
}

function Write-HttpResponse {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$Reason,
    [string]$ContentType,
    [byte[]]$Body,
    [bool]$HeadOnly = $false
  )

  $header = "HTTP/1.1 $StatusCode $Reason`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
  $headerBytes = $ascii.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $HeadOnly -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
}

function Write-TextResponse {
  param(
    [System.IO.Stream]$Stream,
    [int]$StatusCode,
    [string]$Reason,
    [string]$Message,
    [bool]$HeadOnly = $false
  )

  Write-HttpResponse -Stream $Stream -StatusCode $StatusCode -Reason $Reason -ContentType "text/plain; charset=utf-8" -Body $utf8.GetBytes($Message) -HeadOnly $HeadOnly
}

$listener = $null
$selectedPort = $Port

for ($attempt = 0; $attempt -lt 10; $attempt += 1) {
  $candidatePort = $Port + $attempt
  if ($candidatePort -gt 65535) { break }
  try {
    $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidatePort)
    $candidate.Start()
    $listener = $candidate
    $selectedPort = $candidatePort
    break
  } catch [System.Net.Sockets.SocketException] {
    if ($candidate) { $candidate.Stop() }
  }
}

if (-not $listener) {
  throw "No available port found between 8080 and 8089."
}

$url = "http://127.0.0.1:$selectedPort/"
Write-Host "Web frontend is running at $url" -ForegroundColor Green
Write-Host "Close this window or press Ctrl+C to stop."

if (-not $NoBrowser) {
  try {
    Start-Process $url
  } catch {
    Write-Warning "The browser could not be opened automatically. Visit $url manually."
  }
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $reader = $null
    try {
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader($stream, $ascii, $false, 1024, $true)
      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

      while ($true) {
        $headerLine = $reader.ReadLine()
        if ($null -eq $headerLine -or $headerLine.Length -eq 0) { break }
      }

      $parts = $requestLine.Split(" ")
      if ($parts.Length -lt 2) {
        Write-TextResponse -Stream $stream -StatusCode 400 -Reason "Bad Request" -Message "Bad Request"
        continue
      }

      $method = $parts[0].ToUpperInvariant()
      $headOnly = $method -eq "HEAD"
      if ($method -ne "GET" -and -not $headOnly) {
        Write-TextResponse -Stream $stream -StatusCode 405 -Reason "Method Not Allowed" -Message "Method Not Allowed"
        continue
      }

      $urlPath = $parts[1].Split("?")[0]
      try {
        $decodedPath = [System.Uri]::UnescapeDataString($urlPath)
        $relativePath = $decodedPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
        if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = "index.html" }
        $filePath = [System.IO.Path]::GetFullPath((Join-Path $rootPath $relativePath))
      } catch {
        Write-TextResponse -Stream $stream -StatusCode 400 -Reason "Bad Request" -Message "Bad Request" -HeadOnly $headOnly
        continue
      }

      if (-not $filePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        Write-TextResponse -Stream $stream -StatusCode 403 -Reason "Forbidden" -Message "Forbidden" -HeadOnly $headOnly
        continue
      }

      if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        Write-TextResponse -Stream $stream -StatusCode 404 -Reason "Not Found" -Message "Not Found" -HeadOnly $headOnly
        continue
      }

      $body = [System.IO.File]::ReadAllBytes($filePath)
      $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
      $contentType = $mimeTypes[$extension]
      if (-not $contentType) { $contentType = "application/octet-stream" }
      Write-HttpResponse -Stream $stream -StatusCode 200 -Reason "OK" -ContentType $contentType -Body $body -HeadOnly $headOnly
    } catch {
      if ($stream -and $stream.CanWrite) {
        try { Write-TextResponse -Stream $stream -StatusCode 500 -Reason "Internal Server Error" -Message "Internal Server Error" } catch {}
      }
    } finally {
      if ($reader) { $reader.Dispose() }
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
