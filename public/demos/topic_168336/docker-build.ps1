# Docker 编译脚本
# 使用国内源编译 Rust 项目（Tauri + Yew WASM）
# 如果速度慢，可设置代理
# 用法：
#   .\docker-build.ps1                    # 构建镜像
#   .\docker-build.ps1 -Check             # 运行 cargo check（后端）
#   .\docker-build.ps1 -CheckFrontend     # 运行 cargo check（前端）
#   .\docker-build.ps1 -Test              # 运行 cargo test（后端）
#   .\docker-build.ps1 -UseProxy          # 使用代理编译

param(
    [Switch]$Build,
    [Switch]$Check,
    [Switch]$CheckFrontend,
    [Switch]$Test,
    [Switch]$UseProxy,
    [string]$ProxyAddr = "http://127.0.0.1:10808"
)

$IMAGE_NAME = "ai-filemanager-builder"
$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

# 默认执行 Build
if (-not ($Check -or $CheckFrontend -or $Test -or $Build)) {
    $Build = $true
}

# 检查 Docker
docker ps > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Docker 未运行，请先启动 Docker Desktop" -ForegroundColor Red
    exit 1
}

# 构建镜像
if ($Build) {
    Write-Host "=== 构建 Docker 镜像 ===" -ForegroundColor Cyan
    if ($UseProxy) {
        Write-Host "使用代理: $ProxyAddr" -ForegroundColor Yellow
        docker build -t $IMAGE_NAME -f Dockerfile.build `
            --build-arg HTTP_PROXY=$ProxyAddr `
            --build-arg HTTPS_PROXY=$ProxyAddr `
            $PROJECT_ROOT
    } else {
        docker build -t $IMAGE_NAME -f Dockerfile.build $PROJECT_ROOT
    }
    if ($LASTEXITCODE -eq 0) {
        Write-Host "镜像构建成功: $IMAGE_NAME" -ForegroundColor Green
    } else {
        Write-Host "镜像构建失败" -ForegroundColor Red
        exit 1
    }
}

# 运行 cargo check（后端）
if ($Check) {
    Write-Host "=== cargo check（后端）===" -ForegroundColor Cyan
    docker run --rm -v "${PROJECT_ROOT}:/app" $IMAGE_NAME `
        cargo check --manifest-path src/AI_FileManager/src-tauri/Cargo.toml
}

# 运行 cargo check（前端）
if ($CheckFrontend) {
    Write-Host "=== cargo check（前端）===" -ForegroundColor Cyan
    docker run --rm -v "${PROJECT_ROOT}:/app" $IMAGE_NAME `
        cargo check --manifest-path src/AI_FileManager/Cargo.toml
}

# 运行 cargo test（后端）
if ($Test) {
    Write-Host "=== cargo test（后端）===" -ForegroundColor Cyan
    docker run --rm -v "${PROJECT_ROOT}:/app" $IMAGE_NAME `
        cargo test --manifest-path src/AI_FileManager/src-tauri/Cargo.toml
}

Write-Host "=== 完成 ===" -ForegroundColor Green