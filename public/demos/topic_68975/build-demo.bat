@echo off
echo ========================================
echo  OffDiff Demo - Wasm 构建脚本
echo ========================================
echo.

where rustup >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Rust 工具链，请先安装 Rust
    echo 下载地址: https://rustup.rs/
    pause
    exit /b 1
)

echo [1/4] 安装 wasm32-unknown-unknown target...
rustup target add wasm32-unknown-unknown
if %errorlevel% neq 0 (
    echo [错误] wasm32 target 安装失败
    pause
    exit /b 1
)

echo.
echo [2/4] 安装 wasm-pack...
cargo install wasm-pack
if %errorlevel% neq 0 (
    echo [错误] wasm-pack 安装失败
    pause
    exit /b 1
)

echo.
echo [3/4] 构建 Wasm...
wasm-pack build --target web --out-dir demo/pkg --release --features wasm
if %errorlevel% neq 0 (
    echo [错误] Wasm 构建失败
    pause
    exit /b 1
)

echo.
echo [4/4] 生成示例 docx 文件...
cargo run --example generate_sample -- demo/sample.docx 2>nul
if %errorlevel% neq 0 (
    echo [提示] 跳过示例文件生成（可选）
)

echo.
echo ========================================
echo  构建完成！
echo ========================================
echo.
echo 请在浏览器中打开 demo/index.html 体验
echo 建议使用本地 HTTP 服务器，例如:
echo   cd demo
echo   python -m http.server 8080
echo 然后访问 http://localhost:8080
echo.
pause
