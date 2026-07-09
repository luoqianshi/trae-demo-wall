from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router
from app.api.websocket import websocket_endpoint
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.restaurant_modules import create_declared_restaurant_tables
from app.services.demo_seed import seed_demo_data

app = FastAPI(
    title=settings.APP_NAME,
    description="商家自动化运营系统 - 餐饮行业智能运营解决方案",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

app.websocket("/ws/{merchant_id}")(websocket_endpoint)


@app.on_event("startup")
def ensure_sqlite_restaurant_tables():
    create_declared_restaurant_tables(engine, Base.metadata)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "商家自动化运营系统 API", "version": "1.0.0"}
