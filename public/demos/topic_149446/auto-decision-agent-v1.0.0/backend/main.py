"""FastAPI 主入口"""
import json
import asyncio
from typing import AsyncGenerator
from pathlib import Path

from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.config import get_project_root, load_config
from backend.llm_service import get_llm_service
from backend.model_builder import ModelValidator, recommend_algorithm
from backend.solver_router import SolverRouter
from backend.validator import FeedbackLoop

# 加载配置
load_config()

app = FastAPI(title="Auto-Decision Agent", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件
frontend_dir = get_project_root() / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")


@app.get("/", response_class=HTMLResponse)
async def root():
    """返回前端页面"""
    index_file = frontend_dir / "index.html"
    if index_file.exists():
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Auto-Decision Agent</h1><p>Frontend not found. Please check frontend/index.html</p>"


async def event_stream(
    user_query: str,
    file_info: str = "",
) -> AsyncGenerator[str, None]:
    """SSE 流式输出决策流程"""
    llm = get_llm_service()
    validator = ModelValidator()
    solver_router = SolverRouter()
    feedback = FeedbackLoop()

    def send_event(event_type: str, data: dict):
        return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    try:
        # ===== Step 1: 意图识别 =====
        yield send_event("step", {"step": 1, "status": "active", "message": "开始意图识别..."})
        await asyncio.sleep(0.3)

        intent = await llm.intent_recognition(user_query, file_info)
        yield send_event("step", {"step": 1, "status": "done", "message": "意图识别完成"})
        yield send_event("intent", intent)

        # ===== Step 2: 模型描述 =====
        yield send_event("step", {"step": 2, "status": "active", "message": "构建数学模型..."})
        await asyncio.sleep(0.3)

        model = await llm.build_model(intent, user_query)
        yield send_event("step", {"step": 2, "status": "done", "message": "模型描述完成"})
        yield send_event("model", model)

        # ===== Step 3: 合理性判断 =====
        yield send_event("step", {"step": 3, "status": "active", "message": "验证模型合理性..."})
        await asyncio.sleep(0.3)

        is_valid, errors = validator.validate(model)
        if not is_valid:
            # 尝试修正一次
            yield send_event("log", {"level": "warn", "message": f"模型验证发现问题: {'; '.join(errors)}"})
            model = await llm.fix_model(model, errors, 1)
            is_valid, errors = validator.validate(model)

        scale_info = validator.estimate_scale(model)
        model["_scale_info"] = scale_info

        yield send_event("step", {"step": 3, "status": "done", "message": "模型验证完成"})
        yield send_event("validation", {"valid": is_valid, "errors": errors, "scale": scale_info})

        # ===== Step 4: 算法选择 =====
        yield send_event("step", {"step": 4, "status": "active", "message": "选择求解算法..."})
        await asyncio.sleep(0.3)

        algo_recommendation = recommend_algorithm(model, scale_info)
        algorithm_type = algo_recommendation["algorithm_type"]

        yield send_event("step", {"step": 4, "status": "done", "message": f"算法选择: {algo_recommendation['algorithm_name']}"})
        yield send_event("algorithm", algo_recommendation)

        # ===== Step 5: 求解执行 =====
        yield send_event("step", {"step": 5, "status": "active", "message": "执行求解..."})

        result = await feedback.run(
            model=model,
            algorithm_type=algorithm_type,
            solve_func=solver_router.solve,
            fix_model_func=llm.fix_model,
            fix_algo_func=llm.fix_algorithm,
        )

        yield send_event("step", {"step": 5, "status": "done", "message": "求解完成"})
        yield send_event("solution", result["solution"])

        # ===== Step 6: 结果验证 =====
        yield send_event("step", {"step": 6, "status": "active", "message": "验证解的合理性..."})
        await asyncio.sleep(0.3)

        if result["success"]:
            yield send_event("step", {"step": 6, "status": "done", "message": "解验证通过"})
        else:
            yield send_event("step", {"step": 6, "status": "error", "message": "解验证失败"})

        # ===== Step 7: 输出 =====
        yield send_event("step", {"step": 7, "status": "active", "message": "生成最终结果..."})
        await asyncio.sleep(0.3)

        # 生成附件列表
        attachments = [
            {
                "name": "solution_result.json",
                "size": f"{len(json.dumps(result, ensure_ascii=False)) / 1024:.1f} KB",
                "type": "json",
            },
            {
                "name": "model_description.json",
                "size": f"{len(json.dumps(model, ensure_ascii=False)) / 1024:.1f} KB",
                "type": "json",
            },
        ]

        if result.get("need_user_input"):
            yield send_event("step", {"step": 7, "status": "error", "message": "需要用户介入"})
            yield send_event("final", {
                "success": False,
                "need_user_input": True,
                "message": result.get("message", "求解失败，请检查问题描述"),
                "model": model,
                "solution": result.get("solution"),
                "attachments": attachments,
            })
        else:
            yield send_event("step", {"step": 7, "status": "done", "message": "输出完成"})
            yield send_event("final", {
                "success": True,
                "message": f"决策流程完成。使用算法: {result['algorithm']}，目标值: {result['solution']['objective_value']}",
                "model": model,
                "solution": result["solution"],
                "algorithm": result["algorithm"],
                "iterations": result["iterations"],
                "attachments": attachments,
            })

    except Exception as e:
        yield send_event("error", {"message": str(e)})
        yield send_event("step", {"step": 0, "status": "error", "message": f"系统错误: {str(e)}"})


@app.post("/api/solve")
async def solve(request: Request):
    """非流式求解接口"""
    data = await request.json()
    user_query = data.get("query", "")
    file_info = data.get("file_info", "")

    llm = get_llm_service()
    validator = ModelValidator()
    solver_router = SolverRouter()
    feedback = FeedbackLoop()

    # 意图识别
    intent = await llm.intent_recognition(user_query, file_info)

    # 模型构建
    model = await llm.build_model(intent, user_query)

    # 验证
    is_valid, errors = validator.validate(model)
    if not is_valid:
        model = await llm.fix_model(model, errors, 1)

    scale_info = validator.estimate_scale(model)
    model["_scale_info"] = scale_info

    # 算法选择
    algo = recommend_algorithm(model, scale_info)

    # 求解
    result = await feedback.run(
        model=model,
        algorithm_type=algo["algorithm_type"],
        solve_func=solver_router.solve,
        fix_model_func=llm.fix_model,
        fix_algo_func=llm.fix_algorithm,
    )

    return {
        "success": result["success"],
        "intent": intent,
        "model": model,
        "algorithm": algo,
        "solution": result["solution"],
        "need_user_input": result.get("need_user_input", False),
        "message": result.get("message", ""),
    }


@app.post("/api/solve/stream")
async def solve_stream(request: Request):
    """流式求解接口（SSE）"""
    data = await request.json()
    user_query = data.get("query", "")
    file_info = data.get("file_info", "")

    return StreamingResponse(
        event_stream(user_query, file_info),
        media_type="text/event-stream",
    )


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """文件上传接口"""
    content = await file.read()
    size_kb = len(content) / 1024

    # 简单解析文件信息
    file_info = f"文件名: {file.filename}, 大小: {size_kb:.1f} KB, 类型: {file.content_type}"

    return {
        "filename": file.filename,
        "size_kb": round(size_kb, 2),
        "content_type": file.content_type,
        "info": file_info,
    }


@app.get("/api/health")
async def health():
    """健康检查"""
    return {"status": "ok", "service": "Auto-Decision Agent"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
