from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.ai import AIChatRequest, AIChatResponse, AIGeneratePlanRequest, AIGeneratePlanResponse, AI分析Request, AI分析Response, AIMessageResponse
from app.schemas.ai import AIStructuredDiagnosisRequest, AIStructuredDiagnosisResponse
from app.schemas.ai import (
    AIActionCardCreateRequest,
    AIActionCardResponse,
    AIActionCardStatusUpdate,
    AIActionCardUpdateRequest,
    AIMaterialGenerateRequest,
    AIReviewResponse,
    AIMemoryResponse,
    AIQualityCaseCreateRequest,
    AIQualityCaseResponse,
    AIAgentConfigRequest,
    AIAgentConfigResponse,
)
from app.services.ai_service import AIService
from app.services.ai_tools import AIToolRegistry
from app.models.ai import AIAnalysisResult
from app.core.database import get_db
from app.core.security import decode_merchant_id
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import StreamingResponse
from typing import List, AsyncGenerator
import uuid

router = APIRouter(prefix="/ai", tags=["AI助手"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)

@router.post("/chat", response_model=AIChatResponse)
async def chat(request: AIChatRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        result = await AIService.chat(db, merchant_id, request)
        return AIChatResponse(
            session_id=result["session_id"],
            message=result["message"],
            topic=result["topic"],
            timestamp=result["timestamp"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-plan", response_model=AIGeneratePlanResponse)
async def generate_plan(request: AIGeneratePlanRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        result = await AIService.generate_plan(db, merchant_id, request)
        return AIGeneratePlanResponse(
            plan_id=result["plan_id"],
            title=result["title"],
            content=result["content"],
            ai_suggestion=result["ai_suggestion"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-data", response_model=AI分析Response)
async def analyze_data(request: AI分析Request, merchant_id: str = Depends(get_current_merchant_id)):
    try:
        result = await AIService.analyze_data(request.analysis_type, request.data)
        return AI分析Response(
            analysis_type=result["analysis_type"],
            result=result["result"],
            summary=result["summary"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/structured-diagnosis", response_model=AIStructuredDiagnosisResponse)
def structured_diagnosis(request: AIStructuredDiagnosisRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        return AIService.structured_diagnosis(db, merchant_id, request)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily-brief")
def daily_brief(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        return AIService.generate_daily_brief(db, merchant_id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/proactive-alerts")
def proactive_alerts(payload: dict = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        payload = payload or {}
        return AIService.generate_proactive_alerts(db, merchant_id, payload.get("create_drafts", True))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/action-cards", response_model=AIActionCardResponse)
def create_action_card(request: AIActionCardCreateRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        card = AIService.create_action_card(db, merchant_id, request)
        return AIService.serialize_action_card(card)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/action-cards/preview")
def preview_action_card(request: AIActionCardCreateRequest, merchant_id: str = Depends(get_current_merchant_id)):
    return {
        "preview": {
            "title": request.title,
            "problem": request.problem,
            "evidence": [AIService.schema_to_dict(item) for item in request.evidence],
            "suggested_action": AIService.schema_to_dict(request.suggested_action),
            "priority": request.priority,
            "data_range": request.data_range,
            "expected_impact": request.expected_impact,
            "assignee": request.assignee,
            "due_date": request.due_date
        },
        "requires_confirmation": True
    }

@router.get("/tools")
def list_ai_tools(merchant_id: str = Depends(get_current_merchant_id)):
    return {"tools": AIToolRegistry.list_tools()}


@router.get("/agents", response_model=List[AIAgentConfigResponse])
def list_ai_agents(include_disabled: bool = False, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    return [AIAgentConfigResponse(**item) for item in AIService.list_agent_configs(db, merchant_id, include_disabled)]


@router.post("/agents", response_model=AIAgentConfigResponse)
def create_ai_agent(request: AIAgentConfigRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        return AIAgentConfigResponse(**AIService.serialize_agent_config(AIService.create_agent_config(db, merchant_id, request)))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/agents/{agent_id}", response_model=AIAgentConfigResponse)
def update_ai_agent(agent_id: str, request: AIAgentConfigRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        agent = AIService.update_agent_config(db, merchant_id, agent_id, request)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent 不存在或不可编辑")
        return AIAgentConfigResponse(**AIService.serialize_agent_config(agent))
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/agents/{agent_id}")
def delete_ai_agent(agent_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        if not AIService.delete_agent_config(db, merchant_id, agent_id):
            raise HTTPException(status_code=404, detail="Agent 不存在或不可删除")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
def upload_ai_file(payload: dict, merchant_id: str = Depends(get_current_merchant_id)):
    try:
        return AIService.parse_uploaded_file(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stores/confirm")
def confirm_ai_store(payload: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    if not payload.get("confirmed"):
        raise HTTPException(status_code=400, detail="写入店铺信息前需要用户确认")
    try:
        return AIService.confirm_store_creation(db, merchant_id, payload.get("store") or {})
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools/{tool_name}/execute")
def execute_ai_tool(tool_name: str, parameters: dict = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        result = AIToolRegistry.execute(db, merchant_id, tool_name, parameters or {})
        AIService.log_ai_event(db, merchant_id, f"tool.{tool_name}", parameters or {}, str(result))
        return {"tool": tool_name, "result": result}
    except ValueError as e:
        AIService.log_ai_event(db, merchant_id, f"tool.{tool_name}", parameters or {}, "", "failed", str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        AIService.log_ai_event(db, merchant_id, f"tool.{tool_name}", parameters or {}, "", "failed", str(e))
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        AIService.log_ai_event(db, merchant_id, f"tool.{tool_name}", parameters or {}, "", "failed", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/action-cards", response_model=List[AIActionCardResponse])
def list_action_cards(status: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    cards = AIService.list_action_cards(db, merchant_id, status)
    return [AIService.serialize_action_card(card) for card in cards]

@router.patch("/action-cards/{card_id}/status", response_model=AIActionCardResponse)
def update_action_card_status(card_id: str, request: AIActionCardStatusUpdate, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        card = AIService.update_action_card_status(db, merchant_id, card_id, request)
        if not card:
            raise HTTPException(status_code=404, detail="AI action card not found")
        return AIService.serialize_action_card(card)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/action-cards/{card_id}", response_model=AIActionCardResponse)
def update_action_card(card_id: str, request: AIActionCardUpdateRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        card = AIService.update_action_card(db, merchant_id, card_id, request)
        if not card:
            raise HTTPException(status_code=404, detail="AI action card not found")
        return AIService.serialize_action_card(card)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/action-cards/{card_id}/material", response_model=AIActionCardResponse)
def generate_action_material(card_id: str, request: AIMaterialGenerateRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        card = AIService.generate_action_material(db, merchant_id, card_id, request)
        if not card:
            raise HTTPException(status_code=404, detail="AI action card not found")
        return AIService.serialize_action_card(card)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/action-cards/{card_id}/review", response_model=AIReviewResponse)
def review_action_card(card_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        record = AIService.review_action_card(db, merchant_id, card_id)
        if not record:
            raise HTTPException(status_code=404, detail="AI action card not found")
        return AIReviewResponse(
            action_card_id=str(record.action_card_id),
            result_metrics=record.result_metrics or {},
            analysis=record.analysis,
            next_steps=record.next_steps or [],
            before_data=record.before_data or {},
            after_data=record.after_data or {}
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/memories", response_model=List[AIMemoryResponse])
def list_ai_memories(memory_type: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    AIService.ensure_merchant_profile_memory(db, merchant_id)
    memories = AIService.list_memories(db, merchant_id, memory_type)
    return [
        AIMemoryResponse(
            id=str(memory.id),
            memory_type=memory.memory_type,
            key=memory.key,
            value=memory.value or {},
            source=memory.source,
            created_at=memory.created_at
        )
        for memory in memories
    ]

@router.post("/quality-cases", response_model=AIQualityCaseResponse)
def create_quality_case(request: AIQualityCaseCreateRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    case = AIService.create_quality_case(db, merchant_id, request)
    return AIQualityCaseResponse(
        id=str(case.id),
        name=case.name,
        prompt=case.prompt,
        expected_checks=case.expected_checks or {},
        last_result=case.last_result or {},
        status=case.status
    )

@router.get("/quality-cases", response_model=List[AIQualityCaseResponse])
def list_quality_cases(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    cases = AIService.list_quality_cases(db, merchant_id)
    return [
        AIQualityCaseResponse(
            id=str(case.id),
            name=case.name,
            prompt=case.prompt,
            expected_checks=case.expected_checks or {},
            last_result=case.last_result or {},
            status=case.status
        )
        for case in cases
    ]

@router.post("/quality-cases/{case_id}/run", response_model=AIQualityCaseResponse)
def run_quality_case(case_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    case = AIService.run_quality_case(db, merchant_id, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="AI quality case not found")
    return AIQualityCaseResponse(
        id=str(case.id),
        name=case.name,
        prompt=case.prompt,
        expected_checks=case.expected_checks or {},
        last_result=case.last_result or {},
        status=case.status
    )

@router.post("/quality-cases/run-all", response_model=List[AIQualityCaseResponse])
def run_all_quality_cases(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    cases = AIService.list_quality_cases(db, merchant_id)
    results = [AIService.run_quality_case(db, merchant_id, str(case.id)) for case in cases]
    return [
        AIQualityCaseResponse(
            id=str(case.id),
            name=case.name,
            prompt=case.prompt,
            expected_checks=case.expected_checks or {},
            last_result=case.last_result or {},
            status=case.status
        )
        for case in results
        if case
    ]

@router.get("/conversations")
def get_conversations(agent_type: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    conversations = AIService.get_conversations(db, merchant_id, agent_type)
    return [{
        "id": str(c.id),
        "session_id": c.session_id,
        "topic": c.topic,
        "agent_type": c.agent_type,
        "created_at": c.created_at
    } for c in conversations]

@router.get("/conversations/{session_id}/messages", response_model=List[AIMessageResponse])
def get_conversation_messages(session_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    messages = AIService.get_conversation_messages(db, session_id, merchant_id)
    return [AIMessageResponse(
        id=str(m.id),
        role=m.role,
        content=m.content,
        created_at=m.created_at
    ) for m in messages]

@router.post("/chat/stream")
async def chat_stream(request: AIChatRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_chat(db, merchant_id, request):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/analyze-competitor")
async def analyze_competitor(request: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        result = await AIService.analyze_competitor(db, merchant_id, request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-competitor/stream")
async def analyze_competitor_stream(request: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_analyze_competitor(db, merchant_id, request):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/generate-report")
async def generate_report(request: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        result = await AIService.generate_report(db, merchant_id, request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-report/stream")
async def generate_report_stream(request: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_generate_report(db, merchant_id, request):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/generate-plan-advice")
async def generate_plan_advice(request: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        result = await AIService.generate_plan_advice(db, merchant_id, request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-plan-advice/stream")
async def generate_plan_advice_stream(request: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_generate_plan_advice(db, merchant_id, request):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/market-insights/stream")
async def market_insights_stream(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_generate_market_insights(db, merchant_id):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/dish-ranking/stream")
async def dish_ranking_stream(request: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_generate_dish_ranking(db, merchant_id, request):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.get("/analysis-result")
def get_analysis_result(analysis_type: str, time_range: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    result = AIService.get_analysis_result(db, merchant_id, analysis_type, time_range)
    if result:
        return {
            "success": True,
            "analysis_type": result.analysis_type,
            "time_range": result.time_range,
            "result_data": result.result_data,
            "summary": result.summary,
            "created_at": result.created_at
        }
    return {"success": False}

@router.post("/analysis-result")
def save_analysis_result(data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        analysis_type = data.get("analysis_type")
        time_range = data.get("time_range")
        result_data = data.get("result_data", {})
        
        existing_result = AIService.get_analysis_result(db, merchant_id, analysis_type, time_range)
        
        if existing_result:
            existing_result.result_data = result_data
            existing_result.time_range = time_range
        else:
            new_result = AIAnalysisResult(
                merchant_id=merchant_id,
                analysis_type=analysis_type,
                time_range=time_range,
                result_data=result_data
            )
            db.add(new_result)
        
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/inventory/analysis/stream")
async def inventory_analysis_stream(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_inventory_analysis(db, merchant_id):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/member/analysis/stream")
async def member_analysis_stream(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_member_analysis(db, merchant_id):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/marketing/automation/stream")
async def marketing_automation_stream(request: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_marketing_automation(db, merchant_id, request):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"})
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/multi-agent/discussion/stream")
async def multi_agent_discussion_stream(request: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    async def generate() -> AsyncGenerator[str, None]:
        try:
            async for chunk in AIService.stream_multi_agent_discussion(db, merchant_id, request):
                yield chunk
            yield "data: [DONE]\n\n"
        except Exception as e:
            import json
            error_data = json.dumps({"error": f"AI调用失败: {str(e)}"}, ensure_ascii=False)
            yield f"data: {error_data}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
