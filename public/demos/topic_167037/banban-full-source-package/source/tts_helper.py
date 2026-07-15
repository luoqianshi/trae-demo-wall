"""Edge TTS 辅助脚本 - 在独立进程中运行, 避免 Flask 事件循环冲突
参数: base64_text voice rate pitch output_file
"""
import sys
import os
import asyncio
import base64
import traceback
import edge_tts


async def synthesize(text, voice, rate, pitch, output_path):
    """合成语音并写入文件"""
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    with open(output_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])


if __name__ == "__main__":
    # 参数: base64_text voice rate pitch output_file
    b64_text = sys.argv[1]
    voice = sys.argv[2]
    rate = sys.argv[3]
    pitch = sys.argv[4]
    output_file = sys.argv[5]

    # 用 base64 解码文本, 避免文件编码问题
    text = base64.b64decode(b64_text).decode("utf-8")

    # 调试输出 (ASCII only)
    print(f"PID: {os.getpid()}", flush=True)
    print(f"Text length: {len(text)} chars", flush=True)
    print(f"Text bytes: {text.encode('utf-8')[:50]!r}", flush=True)
    print(f"Voice: {voice}, Rate: {rate}, Pitch: {pitch}", flush=True)

    try:
        asyncio.run(synthesize(text, voice, rate, pitch, output_file))
        if os.path.exists(output_file):
            print(f"OK: {os.path.getsize(output_file)} bytes", flush=True)
        else:
            print("OK but file not created", flush=True)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
