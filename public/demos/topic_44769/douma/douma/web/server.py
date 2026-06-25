"""FastAPI 应用：REST + SSE + 静态托管。表现层，复用现有引擎。"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ..config import load_config, AppConfig
from ..loader import load_tasks
from ..models import EvalMode, Rank
from . import runspace, serializers
from .players import PlayerStore

_STATIC = Path(__file__).parent / "static"

# 点将页选手来源的虚拟配置名：选用此值时走运行时 PlayerStore（界面可增删的选手）
PLAYERS_SOURCE = "__players__"


class RunRequest(BaseModel):
    """POST /api/run 请求体。"""

    config_file: str
    model_names: list[str]
    task_ids: list[str]          # 抽题抽出的题目 id（每档随机 1 题，共 3 题）
    mode: str = "one_shot"
    max_concurrency: Optional[int] = None
    calibrate: bool = False


class PlayerRequest(BaseModel):
    """POST/PUT /api/players 请求体。新增/修改选手。"""

    name: str
    model: str = ""
    base_url: str = ""
    api_key: str = ""            # 明文 key；落盘前加密。修改时留空表示不变
    adapter: str = "openai"


def create_app(tasks_dir: Path, root_dir: Path) -> FastAPI:
    """应用工厂：tasks_dir 题库目录；root_dir 用于扫描 config*.yaml。"""
    app = FastAPI(title="DouMa GUI")
    tasks_dir = Path(tasks_dir)
    root_dir = Path(root_dir)
    store = PlayerStore(root_dir)

    def _players_config() -> dict:
        """把运行时选手列表序列化为点将页可用的"虚拟配置"。"""
        players = store.load()
        return {
            "file": PLAYERS_SOURCE,
            "max_concurrency": 4,
            "agentic_max_rounds": 5,
            "models": [
                {
                    "name": p.name,
                    "model": p.model,
                    "adapter": p.adapter,
                    "api_key_ready": store.api_key_ready(p),
                }
                for p in players
            ],
        }

    @app.get("/api/configs")
    def list_configs():
        # 仅暴露运行时选手库这一个来源：选手在「管理选手」页自助增删，默认带 5 个出厂模型。
        # 不再罗列镜像内置的只读 config*.yaml，避免点将页出现多套配置令人困惑。
        return [_players_config()]

    # —— 选手管理（运行时可写，持久化于卷） ——
    @app.get("/api/players")
    def list_players():
        return [serializers.serialize_player(p, store) for p in store.load()]

    @app.post("/api/players")
    def add_player(req: PlayerRequest):
        if not req.name.strip():
            raise HTTPException(400, "选手名不能为空")
        try:
            p = store.add(req.name.strip(), req.model.strip(), req.base_url.strip(),
                          api_key=req.api_key, adapter=req.adapter.strip() or "openai")
        except ValueError as exc:
            raise HTTPException(409, str(exc))
        return serializers.serialize_player(p, store)

    @app.put("/api/players/{name}")
    def update_player(name: str, req: PlayerRequest):
        try:
            p = store.update(name, model=req.model.strip(), base_url=req.base_url.strip(),
                             api_key=req.api_key or None)
        except KeyError as exc:
            raise HTTPException(404, str(exc))
        return serializers.serialize_player(p, store)

    @app.delete("/api/players/{name}")
    def delete_player(name: str):
        try:
            store.remove(name)
        except KeyError as exc:
            raise HTTPException(404, str(exc))
        return {"ok": True}

    @app.post("/api/players/{name}/test")
    def test_player(name: str):
        """连通性自测：用最小请求探测该选手端点+key 是否可用。"""
        p = store.get(name)
        if p is None:
            raise HTTPException(404, f"选手不存在：{name}")
        if not store.api_key_ready(p):
            return {"ok": False, "message": "未配置可用的 API key"}
        from ..adapters import get_adapter
        from ..config import ModelConfig
        from ..models import Task

        key_env = f"_DOUMA_TEST_KEY_{name}"
        import os
        os.environ[key_env] = store.resolve_api_key(p)
        cfg = ModelConfig(name=p.name, adapter=p.adapter, base_url=p.base_url,
                          api_key_env=key_env, model=p.model, extra=dict(p.extra))
        try:
            adapter = get_adapter(cfg)
            probe = Task(id="__probe__", rank=Rank.GOLD, language="python", title="",
                         tags=[], entry_file="solution.py", test_command="",
                         prompt="", buggy_code="", directory=Path("."))
            adapter.complete("You are a connectivity probe. Reply with: ok",
                             "Reply with the single word: ok", probe)
            return {"ok": True, "message": "连通正常"}
        except Exception as exc:
            return {"ok": False, "message": f"连通失败：{type(exc).__name__}: {str(exc)[:120]}"}
        finally:
            os.environ.pop(key_env, None)

    @app.get("/api/tasks")
    def list_tasks():
        tasks = load_tasks(tasks_dir)
        return serializers.serialize_tasks_grouped(tasks)

    @app.post("/api/run")
    def start_run(req: RunRequest):
        # 选手来源二选一：__players__ 走运行时可写选手库；否则走只读 config 文件
        if req.config_file == PLAYERS_SOURCE:
            base = AppConfig(models=[], max_concurrency=4)
            cfg = store.to_app_config(req.model_names, base)
            if not cfg.models:
                raise HTTPException(400, "未选择任何有效选手")
            # 预检密钥：mock 适配器无需 API key，直接豁免
            missing = [m.name for m in cfg.models if m.adapter != "mock" and not m.api_key]
            if missing:
                raise HTTPException(400, f"以下选手未配置 API key：{missing}")
        else:
            cfg_path = root_dir / req.config_file
            if not cfg_path.exists():
                raise HTTPException(400, f"配置文件不存在：{req.config_file}")
            cfg = load_config(cfg_path)
            # 过滤被选模型
            selected = [m for m in cfg.models if m.name in req.model_names]
            if not selected:
                raise HTTPException(400, "未选择任何有效模型")
            # 预检密钥：mock 适配器豁免
            missing = [m.name for m in selected if m.adapter != "mock" and not m.api_key]
            if missing:
                raise HTTPException(400, f"以下模型未配置 API key：{missing}")
            cfg.models = selected
        if req.max_concurrency:
            cfg.max_concurrency = req.max_concurrency

        # 过滤抽出的题目（按 task_id 精确匹配，保持抽题顺序）
        wanted = req.task_ids
        all_tasks = load_tasks(tasks_dir)
        by_id = {t.id: t for t in all_tasks}
        tasks = [by_id[tid] for tid in wanted if tid in by_id]
        if not tasks:
            raise HTTPException(400, "未选择任何题目")

        try:
            mode = EvalMode(req.mode)
        except ValueError:
            raise HTTPException(400, f"非法 mode：{req.mode}")

        try:
            session = runspace.manager.create(tasks, cfg, mode, req.calibrate)
        except runspace.RunBusyError as exc:
            raise HTTPException(409, str(exc))
        session.start()
        return {"run_id": session.run_id}

    @app.get("/api/stream/{run_id}")
    def stream(run_id: str):
        session = runspace.manager.get(run_id)
        if session is None:
            raise HTTPException(404, "未找到该评测会话")

        def gen():
            # 已完成的会话：直接补发缓存的 start/done
            if session.status in ("done", "failed") and session.snapshot_done:
                if session.snapshot_start:
                    yield f"data: {json.dumps(session.snapshot_start, ensure_ascii=False)}\n\n"
                yield f"data: {json.dumps(session.snapshot_done, ensure_ascii=False)}\n\n"
                return
            for event in session.iter_events(timeout=300):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

        return StreamingResponse(gen(), media_type="text/event-stream")

    @app.get("/api/run/{run_id}/detail")
    def run_detail(run_id: str, model: str, task: str):
        session = runspace.manager.get(run_id)
        if session is None:
            raise HTTPException(404, "未找到该评测会话")
        detail = session.get_detail(model, task)
        if detail is None:
            raise HTTPException(404, "未找到该选手在该题的做题明细")
        return detail

    @app.get("/")
    def index():
        return FileResponse(_STATIC / "index.html")

    if _STATIC.is_dir():
        app.mount("/static", StaticFiles(directory=_STATIC), name="static")

    return app
