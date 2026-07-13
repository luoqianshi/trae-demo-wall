"""Windows compatibility launcher for the upstream speech gateway."""

import sys
import os
import threading

import torch


def apply_cpu_compatibility() -> None:
    """Avoid an upstream Paraformer MPS cache call on platforms without MPS."""
    if not torch.backends.mps.is_available():
        torch.mps.empty_cache = lambda: None


def validate_tts_runtime() -> None:
    """Fail early when the installed upstream Qwen3 path cannot run on CPU."""
    args = sys.argv[1:]
    try:
        tts = args[args.index("--tts") + 1]
        tts_device = args[args.index("--qwen3_tts_device") + 1]
    except (ValueError, IndexError):
        return

    if tts != "qwen3":
        raise SystemExit("VoxHire currently expects the Edge TTS compatibility slot to use --tts qwen3.")


def install_edge_tts_adapter() -> None:
    from edge_tts_adapter import EdgeTTSHandler
    import speech_to_speech.TTS.qwen3_tts_handler as qwen3_module

    qwen3_module.Qwen3TTSHandler = EdgeTTSHandler


def start_chat_completions_proxy() -> None:
    target = os.environ.get("VOXHIRE_LLM_BASE_URL")
    key = os.environ.get("VOXHIRE_LLM_API_KEY")
    model = os.environ.get("VOXHIRE_LLM_MODEL")
    import uvicorn
    from responses_proxy import create_proxy

    port = int(os.environ.get("VOXHIRE_PROXY_PORT", "8010"))
    thread = threading.Thread(
        target=uvicorn.Server(uvicorn.Config(create_proxy(target, key, model), host="127.0.0.1", port=port, log_level="warning")).run,
        daemon=True,
    )
    thread.start()


if __name__ == "__main__":
    apply_cpu_compatibility()
    validate_tts_runtime()
    install_edge_tts_adapter()
    start_chat_completions_proxy()

    from speech_to_speech.s2s_pipeline import main

    main()
