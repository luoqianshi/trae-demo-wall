"""Minimal local OpenAI Responses API used by gateway smoke tests."""

from fastapi import FastAPI

app = FastAPI()


@app.post("/v1/chat/completions")
async def chat_completions() -> dict:
    return {
        "id": "chatcmpl_mock",
        "object": "chat.completion",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "你好，欢迎参加 VoxHire 技术面试。我是今天的面试官林知远。请先用一到两分钟做个自我介绍，重点说明你的技术背景、代表经历，以及你为什么关注这个岗位。",
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 8, "completion_tokens": 12, "total_tokens": 20},
    }
