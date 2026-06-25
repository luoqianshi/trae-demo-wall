import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.simulator import get_gauge_data, get_trend_data

router = APIRouter(prefix="/api/monitor", tags=["monitor"])


@router.get("/gauges")
async def read_gauges():
    """获取当前仪表数据"""
    gauges = get_gauge_data()
    return [g.model_dump() for g in gauges]


@router.get("/trend")
async def read_trend(points: int = 60):
    """获取趋势数据"""
    return get_trend_data(points)


@router.websocket("/ws")
async def monitor_ws(websocket: WebSocket):
    """WebSocket实时推送监控数据"""
    await websocket.accept()
    try:
        while True:
            gauges = get_gauge_data()
            trend = get_trend_data(30)
            data = {
                "type": "monitor_update",
                "gauges": [g.model_dump() for g in gauges],
                "trend": trend,
            }
            await websocket.send_json(data)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
