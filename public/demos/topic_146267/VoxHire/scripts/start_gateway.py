"""Start the local speech gateway without depending on a PowerShell session."""

from __future__ import annotations

import argparse
import os
import runpy
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_env() -> None:
    env_file = ROOT / ".env"
    if not env_file.exists():
        raise SystemExit("Missing .env. Set VOXHIRE_LLM_BASE_URL, VOXHIRE_LLM_API_KEY, and VOXHIRE_LLM_MODEL first.")
    for line in env_file.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())
    if not os.environ.get("VOXHIRE_LLM_API_KEY"):
        raise SystemExit("VOXHIRE_LLM_API_KEY is required in .env.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--device", choices=("cpu", "cuda"), default=None)
    args = parser.parse_args()
    load_env()
    device = args.device or os.environ.get("VOXHIRE_DEVICE", "cpu")
    if device == "cuda":
        import torch

        if not torch.cuda.is_available():
            raise SystemExit("CUDA is unavailable in the selected Python environment.")

    os.environ["HF_HOME"] = str(ROOT / ".cache" / "huggingface")
    os.environ["MODELSCOPE_CACHE"] = str(ROOT / ".cache" / "modelscope")
    os.environ["TORCH_HOME"] = str(ROOT / ".cache" / "torch")
    host = os.environ.get("VOXHIRE_GATEWAY_HOST", "127.0.0.1")
    port = os.environ.get("VOXHIRE_GATEWAY_PORT", "8765")
    proxy_port = os.environ.get("VOXHIRE_PROXY_PORT", "8010")

    sys.argv = [
        str(ROOT / "scripts" / "run_gateway.py"),
        "--mode", "realtime",
        "--ws_host", host,
        "--ws_port", port,
        "--device", device,
        "--stt", "paraformer",
        "--paraformer_stt_model_name", "paraformer-zh",
        "--paraformer_stt_device", device,
        "--language", "zh",
        "--tts", "qwen3",
        "--qwen3_tts_model_name", "edge-tts",
        "--qwen3_tts_device", "cpu",
        "--qwen3_tts_dtype", "float32",
        "--qwen3_tts_speaker", "zh-CN-XiaoxiaoNeural",
        "--llm_backend", "responses-api",
        "--model_name", os.environ["VOXHIRE_LLM_MODEL"],
        "--responses_api_base_url", f"http://127.0.0.1:{proxy_port}/v1",
        "--responses_api_api_key", os.environ["VOXHIRE_LLM_API_KEY"],
        "--no_responses_api_stream",
        "--no_enable_live_transcription",
        "--min_silence_ms", "1500",
    ]
    runpy.run_path(str(ROOT / "scripts" / "run_gateway.py"), run_name="__main__")


if __name__ == "__main__":
    main()
