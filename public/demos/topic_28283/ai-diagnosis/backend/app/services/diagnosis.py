import json
from datetime import datetime
from typing import Optional
from openai import OpenAI

from app.config import get_settings
from app.models import (
    DiagnosisRequest,
    DiagnosisResponse,
    ProposalRequest,
    Proposal,
    ProposalStep,
)
from app.services.case_matcher import match_cases, CaseMatchRequest
from app.services.simulator import DEVICE_CONFIGS

# ===== 系统提示词 =====
DIAGNOSIS_SYSTEM_PROMPT = """你是"AI炼化智诊"系统的诊断助手，专注于化工炼化装置的异常诊断和技改方案生成。

你的职责：
1. 根据用户描述的异常工况，分析可能的原因
2. 结合装置参数数据给出诊断建议
3. 推荐排查步骤和处置方案
4. 必要时引用历史案例佐证

当前装置参数：
{device_params}

当前告警信息：
{alerts_info}

回答要求：
- 使用专业但易懂的语言
- 给出具体可操作的建议
- 标注风险等级（高/中/低）
- 如需紧急处置，优先说明
"""

PROPOSAL_SYSTEM_PROMPT = """你是"AI炼化智诊"系统的技改方案生成专家。

根据装置异常情况和历史案例，生成一份完整的技改方案，包含：
1. 问题诊断：明确故障原因
2. 短期处置：应急操作建议
3. 技改方案：长期解决方案
4. 预期效果：量化改善指标

当前装置参数：
{device_params}

相关历史案例：
{cases_info}

请生成结构化的技改方案。
"""


def _get_client() -> Optional[OpenAI]:
    settings = get_settings()
    if settings.llm_mock:
        return None
    return OpenAI(
        base_url=settings.llm_base_url,
        api_key=settings.llm_api_key,
    )


def _get_device_params_text(device_id: Optional[str] = None) -> str:
    lines = []
    for did, cfg in DEVICE_CONFIGS.items():
        if device_id and did != device_id:
            continue
        lines.append(f"- {did}({cfg['label']}): 基准值{cfg['base']}{cfg['unit']}, 预警阈值{cfg['warning']}, 临界阈值{cfg['critical']}")
    return "\n".join(lines) if lines else "无"


def _get_alerts_text() -> str:
    from app.services.alert import get_alerts
    alerts = get_alerts(limit=5)
    if not alerts:
        return "无活跃告警"
    lines = []
    for a in alerts:
        lines.append(f"- [{a.severity.value.upper()}] {a.title}: {a.description}")
    return "\n".join(lines)


# ===== Mock响应 =====
MOCK_DIAGNOSIS_RESPONSES = {
    "K-201": DiagnosisResponse(
        reply="基于压缩机K-201的振动数据分析：\n\n"
              "**诊断结论**：转子不平衡，疑似叶轮磨损导致\n\n"
              "**风险等级**：高\n\n"
              "**建议排查步骤**：\n"
              "1. 检查转子动平衡状态\n"
              "2. 查看轴承温度是否同步升高\n"
              "3. 对比上次检修记录中的平衡块调整量\n"
              "4. 安排振动频谱分析确认故障源\n\n"
              "**紧急处置**：建议将压缩机降负荷至70%运行，加强监测频次",
        matched_cases=[
            {"id": "case-001", "title": "叶轮磨损导致转子不平衡", "similarity": 0.92},
            {"id": "case-002", "title": "平衡块脱落引发异常振动", "similarity": 0.87},
        ],
        suggestions=["降负荷运行", "安排频谱分析", "加强轴承温度监测"],
    ),
    "T-101-R": DiagnosisResponse(
        reply="基于常压塔回流比数据分析：\n\n"
              "**诊断结论**：回流比偏高，可能原因：回流调节阀卡涩或PID参数整定不当\n\n"
              "**风险等级**：中\n\n"
              "**建议排查步骤**：\n"
              "1. 检查回流调节阀动作是否正常\n"
              "2. 查看回流泵运行状态\n"
              "3. 检查塔顶温度和压力是否同步变化\n"
              "4. 核对PID参数设定值\n\n"
              "**处置建议**：如调节阀卡涩，切换至手动控制并安排检修",
        matched_cases=[
            {"id": "case-004", "title": "回流比偏高致产品不合格", "similarity": 0.85},
        ],
        suggestions=["检查调节阀", "切换手动控制", "整定PID参数"],
    ),
    "default": DiagnosisResponse(
        reply="已收到您的诊断请求。请提供更多关于异常工况的详细信息，例如：\n"
              "- 哪个装置/设备出现异常？\n"
              "- 异常的具体表现是什么？\n"
              "- 持续了多长时间？\n\n"
              "这样我可以给出更精准的诊断建议。",
        matched_cases=[],
        suggestions=["提供更多设备信息", "描述具体异常表现"],
    ),
}

MOCK_PROPOSAL = Proposal(
    id="proposal-001",
    device_id="K-201",
    problem_diagnosis="压缩机K-201转子不平衡，疑似叶轮磨损导致，当前振动值 8.7mm/s（阈值6.0mm/s）",
    short_term_action="降负荷至70%运行，安排振动频谱分析确认故障源，加强轴承温度监测频次至每15分钟一次",
    reform_plan="计划停机检修，更换磨损叶轮并做动平衡校验；同步升级在线振动监测系统，实现预警前置",
    expected_outcome="振动值恢复至≤2.5mm/s，非计划停机时间减少60%，年维护成本降低约15万元",
    steps=[
        ProposalStep(step=1, title="异常识别", description="AI实时监控装置参数，自动识别异常工况"),
        ProposalStep(step=2, title="案例匹配", description="从历史案例库中检索相似故障与技改方案"),
        ProposalStep(step=3, title="方案生成", description="AI综合分析生成定制化技改方案"),
        ProposalStep(step=4, title="效果验证", description="模拟验证方案效果，输出预期改善指标"),
    ],
    created_at=datetime.now(),
)


async def diagnose(request: DiagnosisRequest) -> DiagnosisResponse:
    """AI诊断接口"""
    settings = get_settings()

    # 确定设备ID
    device_id = request.device_id
    if not device_id:
        # 尝试从消息中提取
        for did in DEVICE_CONFIGS:
            if did in request.message:
                device_id = did
                break

    # 匹配历史案例
    symptoms = [request.message]
    case_result = match_cases(CaseMatchRequest(
        device_id=device_id or "",
        symptoms=symptoms,
        top_k=3,
    ))

    # Mock模式
    if settings.llm_mock:
        response = MOCK_DIAGNOSIS_RESPONSES.get(device_id or "", MOCK_DIAGNOSIS_RESPONSES["default"])
        # 用实际匹配结果覆盖
        response.matched_cases = [{"id": c.id, "title": c.title, "similarity": c.similarity} for c in case_result.cases]
        return response

    # 真实LLM调用
    client = _get_client()
    if not client:
        return MOCK_DIAGNOSIS_RESPONSES.get(device_id or "", MOCK_DIAGNOSIS_RESPONSES["default"])

    cases_text = "\n".join([
        f"- {c.title}({c.date}): {c.description} [相似度:{c.similarity}]"
        for c in case_result.cases
    ])

    system_prompt = DIAGNOSIS_SYSTEM_PROMPT.format(
        device_params=_get_device_params_text(device_id),
        alerts_info=_get_alerts_text(),
    )

    user_prompt = f"用户问题：{request.message}\n\n相关历史案例：\n{cases_text if cases_text else '无匹配案例'}"

    try:
        completion = client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=1000,
        )
        reply = completion.choices[0].message.content or ""
    except Exception as e:
        reply = f"LLM调用失败: {str(e)}\n\n请检查LLM配置或切换到Mock模式。"

    return DiagnosisResponse(
        reply=reply,
        matched_cases=[{"id": c.id, "title": c.title, "similarity": c.similarity} for c in case_result.cases],
        suggestions=[],
    )


async def generate_proposal(request: ProposalRequest) -> Proposal:
    """生成技改方案"""
    settings = get_settings()

    # 匹配案例
    case_result = match_cases(CaseMatchRequest(
        device_id=request.device_id,
        symptoms=[request.problem_description],
        top_k=3,
    ))

    # Mock模式
    if settings.llm_mock:
        proposal = MOCK_PROPOSAL.model_copy(update={
            "device_id": request.device_id,
            "problem_diagnosis": request.problem_description,
        })
        return proposal

    # 真实LLM调用
    client = _get_client()
    if not client:
        return MOCK_PROPOSAL

    cases_text = "\n".join([
        f"- {c.title}: {c.description}\n  原因: {c.root_cause}\n  方案: {c.solution}\n  结果: {c.outcome}"
        for c in case_result.cases
    ])

    system_prompt = PROPOSAL_SYSTEM_PROMPT.format(
        device_params=_get_device_params_text(request.device_id),
        cases_info=cases_text if cases_text else "无匹配案例",
    )

    constraints_text = ""
    if request.constraints:
        constraints_text = f"\n约束条件：{', '.join(request.constraints)}"

    user_prompt = f"请为以下问题生成技改方案：\n{request.problem_description}{constraints_text}"

    try:
        completion = client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=1500,
        )
        content = completion.choices[0].message.content or ""
    except Exception as e:
        content = f"LLM调用失败: {str(e)}"

    return Proposal(
        id=f"proposal-{int(datetime.now().timestamp())}",
        device_id=request.device_id,
        problem_diagnosis=request.problem_description,
        short_term_action=content[:200] if content else "",
        reform_plan=content if content else "",
        expected_outcome="请根据实际执行情况评估",
        steps=[
            ProposalStep(step=1, title="异常识别", description="AI实时监控装置参数，自动识别异常工况"),
            ProposalStep(step=2, title="案例匹配", description="从历史案例库中检索相似故障与技改方案"),
            ProposalStep(step=3, title="方案生成", description="AI综合分析生成定制化技改方案"),
            ProposalStep(step=4, title="效果验证", description="模拟验证方案效果，输出预期改善指标"),
        ],
        created_at=datetime.now(),
    )
