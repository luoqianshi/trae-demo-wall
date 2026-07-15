from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
from dotenv import load_dotenv

from core.analysis_engine import analyze_self, compute_discrepancy
from core.voice_module import process_audio
from core.vision_module import process_image
from core.spatial_planner import generate_spatial_plan
from core.database import init_chromadb, store_vector_data
from core.chat_engine import chat_with_mirror
from core.history_store import (
    save_analysis_record,
    get_analysis_history,
    get_trend_data,
    save_chat_message,
    get_chat_history,
    get_overall_stats,
    init_db as init_history_db,
    get_daily_summaries,
    get_daily_summary_by_date,
    get_push_notifications,
    get_unread_count,
    mark_notification_read,
    mark_all_notifications_read,
    get_user_settings,
    update_user_settings,
)
from core.scheduler import init_scheduler, get_scheduler
from core.periodic_analysis import generate_daily_summary, generate_morning_greeting
from core.push_engine import (
    send_morning_greeting,
    send_evening_summary,
    check_and_send_crisis_alert,
    check_and_send_milestone,
)

load_dotenv()

app = FastAPI(title="镜灵 (Mirror Spirit) API", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_chromadb()
init_history_db()


@app.on_event("startup")
async def startup_event():
    init_scheduler()


class SelfAnalysisRequest(BaseModel):
    diary_text: str
    audio_transcript: Optional[str] = None
    image_description: Optional[str] = None
    gps_coordinates: Optional[str] = None


class HardwareUploadRequest(BaseModel):
    timestamp: str
    gps_latitude: float
    gps_longitude: float
    image_base64: Optional[str] = None
    audio_transcript: Optional[str] = None
    description_text: Optional[str] = None


class AnalysisResponse(BaseModel):
    ideal_self: str
    actual_self: str
    discrepancy_score: float
    suggested_action: str
    location_keyword: str
    emotion_dimensions: Optional[dict] = None
    strengths: Optional[list] = None
    growth_areas: Optional[list] = None
    mirror_insight: Optional[str] = None
    personality_traits: Optional[list] = None


class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default_user"
    history: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    response: str
    insight: str
    history: List[dict]


@app.post("/api/analyze_self", response_model=AnalysisResponse)
async def api_analyze_self(request: SelfAnalysisRequest):
    result = await analyze_self(
        diary_text=request.diary_text,
        audio_transcript=request.audio_transcript,
        image_description=request.image_description,
        gps_coordinates=request.gps_coordinates
    )
    
    lat = lng = None
    if request.gps_coordinates:
        parts = request.gps_coordinates.split(",")
        if len(parts) == 2:
            try:
                lat = float(parts[0])
                lng = float(parts[1])
            except:
                pass
    
    save_analysis_record(result, request.diary_text, lat, lng)
    store_vector_data(result['ideal_self'], result['actual_self'])
    return result


@app.post("/api/hardware/upload_audio")
async def api_upload_audio(file: UploadFile = File(...)):
    audio_content = await file.read()
    result = process_audio(audio_content)
    return {"message": "Audio processed successfully", "transcript": result.get("transcript"), "analysis": result.get("analysis")}


@app.post("/api/hardware/upload_image")
async def api_upload_image(file: UploadFile = File(...)):
    image_content = await file.read()
    result = process_image(image_content)
    return {"message": "Image processed successfully", "description": result.get("description"), "scene_type": result.get("scene_type"), "emotion": result.get("emotion")}


@app.post("/api/hardware/upload")
async def api_upload_hardware(request: HardwareUploadRequest):
    image_description = ""
    audio_result = {}
    
    if request.image_base64:
        image_description = process_image(request.image_base64, is_base64=True).get("description", "")
    
    if request.audio_transcript:
        audio_result = process_audio(request.audio_transcript, is_text=True)
    
    combined_text = f"{request.description_text or ''} {image_description} {audio_result.get('transcript', '')}"
    
    analysis_result = await analyze_self(
        diary_text=combined_text,
        audio_transcript=audio_result.get('transcript'),
        image_description=image_description,
        gps_coordinates=f"{request.gps_latitude},{request.gps_longitude}"
    )
    
    save_analysis_record(analysis_result, combined_text, request.gps_latitude, request.gps_longitude)
    store_vector_data(analysis_result['ideal_self'], analysis_result['actual_self'])
    
    spatial_plan = generate_spatial_plan(
        discrepancy_score=analysis_result['discrepancy_score'],
        location_keyword=analysis_result['location_keyword'],
        user_lat=request.gps_latitude,
        user_lng=request.gps_longitude
    )
    
    return {
        "message": "Hardware data uploaded and analyzed",
        "analysis": analysis_result,
        "spatial_plan": spatial_plan
    }


class SpatialPlanRequest(BaseModel):
    discrepancy_score: float
    location_keyword: str
    user_lat: float
    user_lng: float


@app.post("/api/generate_spatial_plan")
async def api_generate_spatial_plan(request: SpatialPlanRequest):
    plan = generate_spatial_plan(request.discrepancy_score, request.location_keyword, request.user_lat, request.user_lng)
    return plan


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Mirror Spirit API", "version": "2.0.0"}


@app.post("/api/chat")
async def api_chat(request: ChatRequest):
    result = await chat_with_mirror(
        user_id=request.user_id,
        message=request.message,
        history=request.history
    )
    
    save_chat_message(request.user_id, "user", request.message)
    save_chat_message(request.user_id, "assistant", result["response"], result.get("insight"))
    
    return result


@app.get("/api/history/trend")
async def api_get_trend(days: int = 7):
    data = get_trend_data(days)
    return data


@app.get("/api/history/analyses")
async def api_get_analysis_history(limit: int = 30):
    records = get_analysis_history(limit)
    return {"records": records, "total": len(records)}


@app.get("/api/stats/overview")
async def api_get_overall_stats():
    stats = get_overall_stats()
    return stats


@app.get("/api/chat/history")
async def api_get_chat_history(user_id: str = "default_user", limit: int = 50):
    messages = get_chat_history(user_id, limit)
    return {"messages": messages, "total": len(messages)}


@app.get("/api/daily-summaries")
async def api_get_daily_summaries(user_id: str = "default_user", limit: int = 30):
    summaries = get_daily_summaries(user_id, limit)
    return {"summaries": summaries, "total": len(summaries)}


@app.get("/api/daily-summaries/{date}")
async def api_get_daily_summary(date: str, user_id: str = "default_user"):
    summary = get_daily_summary_by_date(user_id, date)
    if not summary:
        return {"error": "Summary not found", "date": date}
    return summary


@app.post("/api/daily-summaries/generate")
async def api_generate_daily_summary(user_id: str = "default_user", date: str = None):
    result = await generate_daily_summary(user_id, date)
    if not result:
        return {"error": "No data available for the specified date"}
    return result


@app.get("/api/notifications")
async def api_get_notifications(user_id: str = "default_user", limit: int = 50, unread_only: bool = False):
    notifications = get_push_notifications(user_id, limit, unread_only)
    unread = get_unread_count(user_id)
    return {"notifications": notifications, "unread_count": unread, "total": len(notifications)}


@app.post("/api/notifications/{notif_id}/read")
async def api_mark_notification_read(notif_id: int, user_id: str = "default_user"):
    mark_notification_read(notif_id, user_id)
    return {"success": True, "id": notif_id}


@app.post("/api/notifications/read-all")
async def api_mark_all_read(user_id: str = "default_user"):
    mark_all_notifications_read(user_id)
    return {"success": True}


@app.get("/api/settings")
async def api_get_settings(user_id: str = "default_user"):
    settings = get_user_settings(user_id)
    return settings


class UpdateSettingsRequest(BaseModel):
    push_enabled: Optional[int] = None
    morning_push_time: Optional[str] = None
    evening_push_time: Optional[str] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    max_daily_pushes: Optional[int] = None


@app.post("/api/settings")
async def api_update_settings(request: UpdateSettingsRequest, user_id: str = "default_user"):
    settings = request.dict(exclude_none=True)
    update_user_settings(user_id, settings)
    updated = get_user_settings(user_id)
    return {"success": True, "settings": updated}


@app.post("/api/test/morning-greeting")
async def api_test_morning_greeting(user_id: str = "default_user"):
    result = await send_morning_greeting(user_id)
    return {"success": True, "notification": result}


@app.post("/api/test/crisis-check")
async def api_test_crisis_check(user_id: str = "default_user"):
    result = check_and_send_crisis_alert(user_id)
    return {"success": True, "triggered": result is not None, "notification": result}


@app.post("/api/test/milestone-check")
async def api_test_milestone_check(user_id: str = "default_user"):
    result = check_and_send_milestone(user_id)
    return {"success": True, "triggered": result is not None, "notification": result}


@app.get("/api/scheduler/status")
async def api_scheduler_status():
    sched = get_scheduler()
    if not sched or not sched.running:
        return {"running": False, "jobs": []}
    jobs = []
    for job in sched.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run_time": str(job.next_run_time) if job.next_run_time else None,
            "trigger": str(job.trigger),
        })
    return {"running": True, "jobs": jobs}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True
    )
