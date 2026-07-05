import os
import subprocess
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes import video, data, match, ppt, auth
from app.utils.file_utils import create_directory_if_not_exists
from app.services.local_storage import local_storage
from app.services.auth_service import auth_service
import imageio_ffmpeg

FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()

app = FastAPI(
    title="AI教务智能处理系统",
    description="面向中小学教务的AI智能数据清洗+视频转码矫正服务器",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_directory_if_not_exists("uploads")
create_directory_if_not_exists("outputs")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(video.router)
app.include_router(data.router)
app.include_router(match.router)
app.include_router(ppt.router)
app.include_router(auth.router)


EXCLUDED_PATHS = {
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/verify_captcha",
    "/api/health",
    "/static/"
}


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    
    if any(path.startswith(excluded) for excluded in EXCLUDED_PATHS):
        response = await call_next(request)
        return response
    
    auth_header = request.headers.get("Authorization")
    cookie_token = request.cookies.get("auth_token")
    
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
    elif cookie_token:
        token = cookie_token
    
    if not token:
        return RedirectResponse(url="/login")
    
    user_data = auth_service.verify_token(token)
    if not user_data:
        return RedirectResponse(url="/login")
    
    response = await call_next(request)
    return response


@app.on_event("startup")
async def startup_event():
    await local_storage.init_tables()


@app.get("/login")
async def login_page():
    return FileResponse("app/static/login.html")


@app.get("/register")
async def register_page():
    return FileResponse("app/static/register.html")


@app.get("/")
async def root():
    return FileResponse("app/static/index.html")


@app.get("/video")
async def video_page():
    return FileResponse("app/static/video.html")


@app.get("/data")
async def data_page():
    return FileResponse("app/static/data.html")


@app.get("/match")
async def match_page():
    return FileResponse("app/static/match.html")


@app.get("/ppt")
async def ppt_page():
    return FileResponse("app/static/ppt.html")


@app.get("/api/health")
async def health_check():
    ffmpeg_available = _check_ffmpeg()
    return {
        "status": "healthy",
        "version": "1.0.0",
        "ffmpeg_available": ffmpeg_available
    }


def _check_ffmpeg() -> bool:
    try:
        result = subprocess.run([FFMPEG_PATH, "-version"], capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)