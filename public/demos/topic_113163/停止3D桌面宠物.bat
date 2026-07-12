@echo off
setlocal
set "PROJECT=%~dp0desktop-pet-3d"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$project = '%PROJECT%'; $targets = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and ($_.CommandLine -like ('*' + $project + '*') -or ($_.Name -like '*electron*' -and $_.CommandLine -like '*desktop-pet-3d*')) }; if ($targets) { $targets | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Host ('已停止 ' + $targets.Count + ' 个桌宠进程') } else { Write-Host '没有找到正在运行的桌宠进程' }"
pause
