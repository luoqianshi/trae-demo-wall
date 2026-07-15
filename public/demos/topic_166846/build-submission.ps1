[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$submissionRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $submissionRoot
$dist = Join-Path $submissionRoot 'dist'
$demoRoot = Join-Path $submissionRoot 'demo'
$htmlZip = Join-Path $dist '跨语言沟通助手-初赛HTML体验包.zip'
$aiuiZip = Join-Path $dist '跨语言沟通助手-AIUI导入包.zip'
$materialsZip = Join-Path $dist '跨语言沟通助手-初赛报名材料包.zip'
$hashFile = Join-Path $dist 'SHA256SUMS.txt'

$resolvedProject = [IO.Path]::GetFullPath($projectRoot)
$resolvedDist = [IO.Path]::GetFullPath($dist)
if (-not $resolvedDist.StartsWith($resolvedProject, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to write outside project root: $resolvedDist"
}

New-Item -ItemType Directory -Force -Path $dist | Out-Null

$demoFiles = @(
  (Join-Path $demoRoot 'index.html'),
  (Join-Path $demoRoot 'README.txt')
)
foreach ($file in $demoFiles) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    throw "Missing demo file: $file"
  }
}

$html = Get-Content -LiteralPath $demoFiles[0] -Raw
$externalRuntimePattern = '<script[^>]+src\s*=\s*["'']https?://|<link[^>]+href\s*=\s*["'']https?://|fetch\s*\(|XMLHttpRequest|new\s+WebSocket'
if ($html -match $externalRuntimePattern) {
  throw 'The offline demo appears to contain an external runtime dependency.'
}
if ($html -notmatch 'hotel' -or $html -notmatch 'restaurant' -or $html -notmatch 'hospital') {
  throw 'The offline demo is missing one or more required scenes.'
}

if (Test-Path -LiteralPath $htmlZip) {
  Remove-Item -LiteralPath $htmlZip -Force
}
Compress-Archive -LiteralPath $demoFiles -DestinationPath $htmlZip -CompressionLevel Optimal

$aiuiFiles = @(
  (Join-Path $projectRoot 'AGENTS.md'),
  (Join-Path $projectRoot 'app.js'),
  (Join-Path $projectRoot 'app.json'),
  (Join-Path $projectRoot 'README.md'),
  (Join-Path $projectRoot 'lib'),
  (Join-Path $projectRoot 'pages')
)
foreach ($file in $aiuiFiles) {
  if (-not (Test-Path -LiteralPath $file)) {
    throw "Missing AIUI source: $file"
  }
}
if (Test-Path -LiteralPath $aiuiZip) {
  Remove-Item -LiteralPath $aiuiZip -Force
}
Compress-Archive -LiteralPath $aiuiFiles -DestinationPath $aiuiZip -CompressionLevel Optimal

$materialFiles = @(
  (Join-Path $projectRoot 'AGENTS.md'),
  (Join-Path $projectRoot 'app.js'),
  (Join-Path $projectRoot 'app.json'),
  (Join-Path $projectRoot 'README.md'),
  (Join-Path $projectRoot 'lib'),
  (Join-Path $projectRoot 'pages'),
  (Join-Path $projectRoot 'tests'),
  (Join-Path $submissionRoot 'README-先看.md'),
  (Join-Path $submissionRoot 'submission-manifest.json'),
  (Join-Path $submissionRoot 'build-submission.ps1'),
  (Join-Path $submissionRoot 'demo'),
  (Join-Path $submissionRoot 'docs'),
  (Join-Path $submissionRoot 'evidence')
)
if (Test-Path -LiteralPath $materialsZip) {
  Remove-Item -LiteralPath $materialsZip -Force
}
Compress-Archive -LiteralPath $materialFiles -DestinationPath $materialsZip -CompressionLevel Optimal

$hashLines = Get-FileHash -Algorithm SHA256 -LiteralPath $htmlZip, $aiuiZip, $materialsZip |
  ForEach-Object { "$($_.Hash.ToLowerInvariant())  $([IO.Path]::GetFileName($_.Path))" }
[IO.File]::WriteAllLines($hashFile, $hashLines, [Text.UTF8Encoding]::new($false))

Write-Output 'Submission packages created:'
Get-Item -LiteralPath $htmlZip, $aiuiZip, $materialsZip, $hashFile |
  Select-Object Name, Length, LastWriteTime
