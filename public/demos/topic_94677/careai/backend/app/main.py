from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Fix: Starlette's MultiPartParser uses SpooledTemporaryFile with 1MB spool limit.
# When file exceeds 1MB, it rolls over to a real temp file, which fails on some
# filesystems with OSError [Errno 38]. Set spool size to 2GB so large video
# uploads stay in memory and never trigger disk rollover.
from starlette.formparsers import MultiPartParser
MultiPartParser.spool_max_size = 2 * 1024 * 1024 * 1024  # 2GB

from app.core.database import SessionLocal, init_db
from app.api import cameras, annotations, events, models, alerts, dashboard, frames, train, users, auth, config, datasets
from app.models.models import Camera, Frame, Annotation, Event, ModelVersion, AlertRule, User
from app.services.seed import seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    # init_db creates tables and ensures the default admin exists (hashed password).
    init_db(db)
    # seed_data populates alert rules / cameras (admin is handled by init_db).
    seed_data(db)
    db.close()
    print("Database initialized and seeded.")
    yield
    print("Shutting down...")


app = FastAPI(title="CareAI Backend", version="0.1.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for frames
FRAMES_DIR = os.path.join(os.path.dirname(__file__), "../frames")
os.makedirs(FRAMES_DIR, exist_ok=True)
app.mount("/frame-images", StaticFiles(directory=FRAMES_DIR), name="frame-images")

# Videos served via custom endpoint (not StaticFiles) for proper MIME type + range support

# Serve frontend static files
STATIC_DIR = os.path.join(os.path.dirname(__file__), "../static")
os.makedirs(STATIC_DIR, exist_ok=True)

# Routers
app.include_router(cameras.router)
app.include_router(annotations.router)
app.include_router(events.router)
app.include_router(models.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(frames.router)
app.include_router(train.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(config.router)
app.include_router(datasets.router)


# Serve index.html at root (must be after all API routes)
# Add cache-control headers to prevent browser from caching stale HTML
@app.get("/")
def serve_frontend():
    resp = FileResponse(os.path.join(STATIC_DIR, "index.html"))
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp
