$root = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($root)) {
  $root = Split-Path -Parent $MyInvocation.MyCommand.Path
}
Set-Location $root
$port = 8088
$url = "http://localhost:$port/"
Write-Host "正在启动本地预览服务：$url"
Write-Host "预览目录：$root"
Write-Host "关闭此窗口即可停止服务"
Start-Process $url
if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $port
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server $port
} else {
  Write-Host "未找到 Python，请安装 Python，或在当前目录使用其他静态服务器启动。"
  Read-Host "按回车键退出"
}
