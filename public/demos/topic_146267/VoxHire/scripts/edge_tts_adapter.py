"""Edge TTS adapter that matches the upstream Qwen3 handler contract."""

import asyncio
import tempfile
from pathlib import Path
from threading import Event
from typing import Any, Iterator

import edge_tts
import numpy as np
import soundfile as sf

from speech_to_speech.baseHandler import BaseHandler
from speech_to_speech.pipeline.handler_types import TTSIn, TTSOut
from speech_to_speech.pipeline.messages import AUDIO_RESPONSE_DONE, EndOfResponse


class EdgeTTSHandler(BaseHandler[TTSIn, TTSOut]):
    def setup(self, should_listen: Event, speaker: str = "zh-CN-XiaoxiaoNeural", **_kwargs: Any) -> None:
        self.should_listen = should_listen
        self.voice = speaker if "Neural" in speaker else "zh-CN-XiaoxiaoNeural"
        self.blocksize = 512

    def process(self, tts_input: TTSIn) -> Iterator[TTSOut]:
        if isinstance(tts_input, EndOfResponse):
            yield AUDIO_RESPONSE_DONE
            return

        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as output:
            path = Path(output.name)
        try:
            asyncio.run(edge_tts.Communicate(tts_input.text, self.voice).save(str(path)))
            audio, sample_rate = sf.read(path, dtype="float32")
            if audio.ndim > 1:
                audio = audio.mean(axis=1)
            if sample_rate != 16000:
                from scipy.signal import resample_poly

                audio = resample_poly(audio, 16000, sample_rate)
            pcm = np.clip(audio * 32767, -32768, 32767).astype(np.int16)
            for offset in range(0, len(pcm), self.blocksize):
                chunk = pcm[offset : offset + self.blocksize]
                if len(chunk) < self.blocksize:
                    chunk = np.pad(chunk, (0, self.blocksize - len(chunk)))
                yield chunk
        finally:
            path.unlink(missing_ok=True)
