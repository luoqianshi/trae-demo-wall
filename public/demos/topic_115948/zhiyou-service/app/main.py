"""FastAPI 应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.api import router
from app.config import settings
from app.database import init_db
from app.core.exceptions import BaseAPIException

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router)

# 全局异常处理器
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """处理 Pydantic 验证错误"""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        error_type = error.get("type", "validation_error")
        ctx = error.get("ctx", {})
        
        if error_type == "string_too_short" or error_type == "value_error.any_str.min_length":
            min_len = ctx.get("min_length", ctx.get("limit_value", 0))
            msg = f"{field}至少需要{min_len}个字符"
        elif error_type == "string_too_long" or error_type == "value_error.any_str.max_length":
            max_len = ctx.get("max_length", ctx.get("limit_value", 0))
            msg = f"{field}最多允许{max_len}个字符"
        elif error_type == "missing" or error_type == "field_required":
            msg = f"{field}不能为空"
        elif error_type == "literal_error":
            msg = f"{field}取值不正确"
        elif error_type == "value_error":
            msg = f"{field}格式错误"
        elif error_type == "type_error":
            msg = f"{field}类型错误"
        elif error_type == "value_error.number.not_ge":
            min_val = ctx.get("limit_value", 0)
            msg = f"{field}不能小于{min_val}"
        elif error_type == "value_error.number.not_le":
            max_val = ctx.get("limit_value", 0)
            msg = f"{field}不能大于{max_val}"
        else:
            msg = f"{field}参数错误"
        
        errors.append({"field": field, "type": error_type, "message": msg})
    
    return JSONResponse(
        status_code=400,
        content={"code": 40001, "message": errors[0]["message"] if errors else "参数错误"},
    )

@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    """处理自定义 API 异常"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code, "message": exc.message},
    )


@app.on_event("startup")
async def startup():
    """启动事件"""
    await init_db()


@app.get("/")
async def root():
    """根路径"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else None,
    }


@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok"}
