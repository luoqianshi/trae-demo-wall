from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
import time

app = FastAPI(title="智链笔记 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "mock_data.json")

def load_mock_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

mock_data = load_mock_data()

class TranscriptRequest(BaseModel):
    text: str
    type: str = "classroom"

class SummaryResponse(BaseModel):
    summary: list
    keywords: list

class GraphResponse(BaseModel):
    nodes: list
    edges: list

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/scenes")
async def get_scenes():
    return ["classroom", "meeting"]

@app.get("/api/data/{scene_type}")
async def get_scene_data(scene_type: str):
    if scene_type not in mock_data:
        raise HTTPException(status_code=404, detail="场景类型不存在")
    return mock_data[scene_type]

@app.get("/api/history")
async def get_history():
    return mock_data.get("history", [])

@app.post("/api/summary", response_model=SummaryResponse)
async def generate_summary(request: TranscriptRequest):
    time.sleep(1.5)
    
    scene_data = mock_data.get(request.type, mock_data["classroom"])
    
    return {
        "summary": scene_data["summary"],
        "keywords": scene_data["keywords"]
    }

@app.post("/api/graph", response_model=GraphResponse)
async def generate_graph(request: TranscriptRequest):
    time.sleep(1.5)
    
    scene_data = mock_data.get(request.type, mock_data["classroom"])
    
    return {
        "nodes": scene_data["graph"]["nodes"],
        "edges": scene_data["graph"]["edges"]
    }

@app.post("/api/keywords")
async def extract_keywords(request: TranscriptRequest):
    time.sleep(0.8)
    
    scene_data = mock_data.get(request.type, mock_data["classroom"])
    
    return {
        "keywords": scene_data["keywords"]
    }

app.mount("/", StaticFiles(directory="../app", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
