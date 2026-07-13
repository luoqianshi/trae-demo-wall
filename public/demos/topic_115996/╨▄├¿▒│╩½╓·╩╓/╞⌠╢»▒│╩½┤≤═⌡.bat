@echo off
chcp 65001 >nul
title 背诗大王 - 本地服务器

echo ===============================================
echo           背诗大王 - 启动本地服务器
echo ===============================================
echo.

powershell -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8081/'); $listener.Start(); Write-Host '✅ 服务器已启动'; Write-Host ''; Write-Host '访问地址: http://localhost:8081/index.html'; Write-Host ''; Write-Host '按 Ctrl+C 停止服务器'; Write-Host ''; Start-Process 'http://localhost:8081/index.html'; while ($listener.IsListening) { $context = $listener.GetContext(); $url = $context.Request.Url.LocalPath; if ($url -eq '/') { $url = '/index.html' }; $path = Join-Path $PWD.Path $url.TrimStart('/'); if (Test-Path $path -PathType Leaf) { $ext = [System.IO.Path]::GetExtension($path); $mime = switch ($ext) { '.html' { 'text/html; charset=utf-8' } '.css' { 'text/css; charset=utf-8' } '.js' { 'application/javascript; charset=utf-8' } default { 'application/octet-stream' } }; $buffer = [System.IO.File]::ReadAllBytes($path); $context.Response.ContentType = $mime; $context.Response.ContentLength64 = $buffer.Length; $context.Response.OutputStream.Write($buffer, 0, $buffer.Length) } else { $context.Response.StatusCode = 404 }; $context.Response.Close() }"

pause