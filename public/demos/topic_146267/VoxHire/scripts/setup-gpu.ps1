$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root ".venv-gpu\Scripts\python.exe"

Push-Location $root
try {
    uv venv .venv-gpu --python 3.12
    $env:VIRTUAL_ENV = Join-Path $root ".venv-gpu"
    uv sync --active
    uv pip install --python $python --reinstall --index-url https://download.pytorch.org/whl/cu128 torch==2.11.0+cu128

    & $python -c "import torch; assert torch.cuda.is_available(), 'CUDA is unavailable'; print(f'PyTorch {torch.__version__}; GPU: {torch.cuda.get_device_name(0)}')"
}
finally {
    Pop-Location
}
