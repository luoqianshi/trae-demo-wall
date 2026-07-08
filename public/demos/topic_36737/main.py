import json
import os
from pathlib import Path
from typing import Any

# Load .env file if exists
_env_file = Path(__file__).parent / ".env"
if _env_file.is_file():
    for _line in _env_file.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ[_k.strip()] = _v.strip()

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import database
import llm_service


class RecommendRequest(BaseModel):
    user_input: str


class HistoryRequest(BaseModel):
    user_input: str
    recommended_dishes: list[dict[str, Any]]
    total_price: int


app = FastAPI(title="Yuecai Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static", check_dir=False), name="static")


@app.on_event("startup")
def on_startup() -> None:
    database.init_db()


@app.post("/api/recommend")
async def recommend(payload: RecommendRequest) -> dict[str, Any]:
    return await llm_service.recommend(payload.user_input)


@app.get("/api/dishes")
def get_dishes() -> list[dict[str, Any]]:
    return database.get_all_dishes()


@app.get("/api/history")
def get_history(limit: int = 20) -> list[dict[str, Any]]:
    return database.get_order_history(limit)


@app.post("/api/history")
def save_history(payload: HistoryRequest) -> dict[str, int]:
    history_id = database.save_order_history(
        payload.user_input,
        payload.recommended_dishes,
        payload.total_price,
    )
    return {"id": history_id}


@app.post("/api/recommend/stream")
async def recommend_stream(payload: RecommendRequest):
    async def event_generator():
        thinking = {"type": "thinking", "message": "小助手正在努力寻找中..."}
        yield f"data: {json.dumps(thinking, ensure_ascii=False)}\n\n"
        result = await llm_service.recommend(payload.user_input)
        done = {"type": "result"}
        done.update(result)
        yield f"data: {json.dumps(done, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
