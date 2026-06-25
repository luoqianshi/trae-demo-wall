import re
import uuid
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from converter import convert

SLIDES_DIR = Path("slides")
STATIC_DIR = Path("static")

sessions = {}  # session_id -> {"total": int, "current": int, "ended": bool}
clients = {}   # session_id -> set[WebSocket]

app = FastAPI()
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def read_html(name):
    return (STATIC_DIR / name).read_text(encoding="utf-8")


def safe_ascii_name(name):
    base = Path(name).stem
    ext = Path(name).suffix
    cleaned = re.sub(r"[^A-Za-z0-9_-]", "", base) or "upload"
    return f"{cleaned}{ext}"


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    session_id = uuid.uuid4().hex[:8]
    session_dir = SLIDES_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    ppt_path = session_dir / safe_ascii_name(file.filename)
    with open(ppt_path, "wb") as f:
        f.write(await file.read())
    try:
        total = convert(ppt_path, session_dir)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    sessions[session_id] = {"total": total, "current": 1, "ended": False}
    clients.setdefault(session_id, set())
    return {"session_id": session_id, "total": total}


@app.get("/slides/{session_id}/{index}.png")
async def get_slide(session_id: str, index: int):
    path = SLIDES_DIR / session_id / f"{index}.png"
    if not path.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(path)


@app.post("/sync/{session_id}")
async def sync(session_id: str, index: int):
    if session_id not in sessions:
        return JSONResponse({"error": "no session"}, status_code=404)
    sessions[session_id]["current"] = index
    await broadcast(session_id, {"type": "slide", "index": index})
    return {"ok": True}


@app.post("/end/{session_id}")
async def end_session(session_id: str):
    if session_id not in sessions:
        return JSONResponse({"error": "no session"}, status_code=404)
    sessions[session_id]["ended"] = True
    await broadcast(session_id, {"type": "end"})
    return {"ok": True}


@app.get("/state/{session_id}")
async def state(session_id: str):
    if session_id not in sessions:
        return JSONResponse({"error": "no session"}, status_code=404)
    return sessions[session_id]


@app.get("/audience/{session_id}", response_class=HTMLResponse)
async def audience(session_id: str):
    return read_html("audience.html")


async def broadcast(session_id: str, data: dict):
    dead = []
    for ws in clients.get(session_id, set()):
        try:
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        clients[session_id].discard(ws)


@app.websocket("/ws/{session_id}")
async def ws_endpoint(ws: WebSocket, session_id: str):
    if session_id not in sessions:
        await ws.close()
        return
    await ws.accept()
    clients.setdefault(session_id, set()).add(ws)
    s = sessions[session_id]
    if s["ended"]:
        await ws.send_json({"type": "end"})
    else:
        await ws.send_json({"type": "slide", "index": s["current"]})
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        clients[session_id].discard(ws)
    except Exception:
        clients[session_id].discard(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8427)
