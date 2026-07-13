param(
    [ValidateSet("cpu", "cuda")]
    [string]$Device = "cpu"
)

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"

if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Error "Missing .env. Set VOXHIRE_LLM_BASE_URL, VOXHIRE_LLM_API_KEY, and VOXHIRE_LLM_MODEL first."
    exit 1
}

Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}

if (-not $env:VOXHIRE_LLM_API_KEY) {
    Write-Error "VOXHIRE_LLM_API_KEY is required in .env."
    exit 1
}

$gatewayDevice = if ($Device) { $Device } else { $env:VOXHIRE_DEVICE }
$venvName = if ($gatewayDevice -eq "cuda") { ".venv-gpu" } else { ".venv" }
$python = Join-Path $root "$venvName\Scripts\python.exe"
$hostAddress = if ($env:VOXHIRE_GATEWAY_HOST) { $env:VOXHIRE_GATEWAY_HOST } else { "127.0.0.1" }
$port = if ($env:VOXHIRE_GATEWAY_PORT) { $env:VOXHIRE_GATEWAY_PORT } else { "8765" }
$proxyPort = if ($env:VOXHIRE_PROXY_PORT) { $env:VOXHIRE_PROXY_PORT } else { "8010" }
$env:HF_HOME = Join-Path $root ".cache\huggingface"
$env:MODELSCOPE_CACHE = Join-Path $root ".cache\modelscope"
$env:TORCH_HOME = Join-Path $root ".cache\torch"
$ttsDtype = if ($gatewayDevice -eq "cpu") { "float32" } else { "auto" }

if ($gatewayDevice -eq "cuda") {
    if (-not (Test-Path -LiteralPath $python)) {
        Write-Error "Missing .venv-gpu. Run .\scripts\setup-gpu.ps1 first."
        exit 1
    }
    $cudaReady = & $python -c "import torch; print(torch.cuda.is_available())"
    if ($cudaReady.Trim().ToLower() -ne "true") {
        Write-Error ".venv-gpu does not have a usable CUDA PyTorch runtime. Run .\scripts\setup-gpu.ps1 again."
        exit 1
    }
}

& $python (Join-Path $root "scripts\start_gateway.py") --device $gatewayDevice
