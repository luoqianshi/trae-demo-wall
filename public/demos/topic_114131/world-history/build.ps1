Write-Host "=== 开始安装依赖 ==="
npm install

Write-Host "`n=== 开始构建项目 ==="
npm run build

Write-Host "`n=== 检查构建结果 ==="
if (Test-Path "dist") {
    Write-Host "构建成功！dist目录已创建"
    Get-ChildItem "dist" | ForEach-Object { Write-Host "  - $_" }
} else {
    Write-Host "构建失败，dist目录不存在"
}

Write-Host "`n=== 启动开发服务器 ==="
npm run dev