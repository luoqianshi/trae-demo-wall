"""
药管家 AI 服务层
封装大模型调用接口，支持 OpenAI 兼容 API
药物相互作用检测采用两阶段策略：规则数据库为主引擎，LLM为辅助解释层
"""
import json
import time
import base64
from io import BytesIO
from openai import OpenAI
from config import config
from drug_interaction_db import interaction_engine


class AIService:
    """AI 大模型服务封装"""

    def __init__(self):
        self.client = OpenAI(
            api_key=config.AI_API_KEY,
            base_url=config.AI_BASE_URL,
            timeout=config.AI_TIMEOUT,
        )

    def _call_llm(self, messages, model=None, temperature=None, max_tokens=None, response_format=None):
        """通用 LLM 调用"""
        try:
            start = time.time()
            response = self.client.chat.completions.create(
                model=model or config.AI_MODEL,
                messages=messages,
                temperature=temperature if temperature is not None else config.AI_TEMPERATURE,
                max_tokens=max_tokens or config.AI_MAX_TOKENS,
                response_format=response_format,
            )
            duration_ms = int((time.time() - start) * 1000)
            content = response.choices[0].message.content
            return {"success": True, "content": content, "duration_ms": duration_ms}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": 0}

    def _call_vision(self, image_data: bytes, mime_type: str, prompt: str):
        """调用视觉模型分析图片"""
        try:
            start = time.time()
            base64_image = base64.b64encode(image_data).decode("utf-8")
            data_url = f"data:{mime_type};base64,{base64_image}"

            response = self.client.chat.completions.create(
                model=config.AI_VISION_MODEL,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                }],
                max_tokens=config.AI_MAX_TOKENS,
                temperature=0.1,
            )
            duration_ms = int((time.time() - start) * 1000)
            content = response.choices[0].message.content
            return {"success": True, "content": content, "duration_ms": duration_ms}
        except Exception as e:
            return {"success": False, "error": str(e), "duration_ms": 0}

    # ========== 药品 OCR 识别 ==========

    OCR_PROMPT = """请分析这张药品包装盒图片，提取以下信息并以 JSON 格式返回。
如果某个字段无法识别，请填写空字符串 ""。

{
  "name": "药品通用名称",
  "manufacturer": "生产厂商名称",
  "production_date": "生产日期（格式YYYY-MM-DD）",
  "expiry_date": "有效期至（格式YYYY-MM-DD）",
  "approval_number": "批准文号（如国药准字XXX）",
  "specification": "规格（如0.3g×24片）",
  "is_medicine": true,
  "confidence": "high/medium/low"
}

注意：
- is_medicine 为 true 表示确认是药品包装盒，false 表示不是
- confidence 表示识别可信度
- 日期格式统一为 YYYY-MM-DD
- 只返回 JSON，不要有其他文字"""

    def recognize_medicine(self, image_data: bytes, mime_type: str):
        """识别药品包装盒图片，提取药品信息"""
        result = self._call_vision(image_data, mime_type, self.OCR_PROMPT)
        if not result["success"]:
            return result

        try:
            # 尝试从响应中提取 JSON
            content = result["content"].strip()
            # 处理可能的 markdown 代码块包裹
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else content
                content = content.strip()
            parsed = json.loads(content)
            result["parsed"] = parsed
            return result
        except json.JSONDecodeError:
            return {"success": False, "error": "AI 返回格式异常，请重试", "duration_ms": result.get("duration_ms", 0)}

    # ========== 症状分析 ==========

    SYMPTOM_PROMPT = """你是一个专业的家庭用药助手。用户描述了以下身体不适症状，请分析并给出建议。

用户症状描述：{symptoms}

家庭药箱中可用的药品列表：
{available_medicines}

请以 JSON 格式返回分析结果：
{
  "symptoms": ["提取的症状关键词"],
  "matched_medicines": [
    {
      "medicine_id": 药品ID（数字）,
      "match_reason": "匹配原因（为什么推荐这个药）",
      "match_score": 匹配度评分（0-100）,
      "usage_tip": "用药小贴士"
    }
  ],
  "suggestion": "综合用药建议",
  "warning": "需要注意的事项（如有）",
  "disclaimer": "本建议仅供参考，如症状严重请及时就医"
}

注意：
- 只推荐药箱中实际存在的药品（通过 medicine_id 匹配）
- 已过期的药品不要推荐
- 匹配度评分基于症状与药品适应症的关联程度
- 只返回 JSON，不要有其他文字"""

    def analyze_symptoms(self, symptoms: str, available_medicines: list):
        """分析症状并匹配药箱中的药品"""
        # 构建药品列表文本
        meds_text = "\n".join([
            f"- ID: {m['id']}, 名称: {m['name']}, 分类: {m.get('category', '')}, "
            f"状态: {m.get('status', 'active')}, 剩余天数: {m.get('days_left', '未知')}"
            for m in available_medicines
        ])

        prompt = self.SYMPTOM_PROMPT.format(
            symptoms=symptoms,
            available_medicines=meds_text if meds_text else "（药箱为空）"
        )

        messages = [{"role": "user", "content": prompt}]
        result = self._call_llm(messages, temperature=0.3)

        if not result["success"]:
            return result

        try:
            content = result["content"].strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else content
                content = content.strip()
            result["parsed"] = json.loads(content)
            return result
        except json.JSONDecodeError:
            return {"success": False, "error": "AI 返回格式异常", "duration_ms": result.get("duration_ms", 0)}

    # ========== 药物相互作用检测 ==========

    INTERACTION_PROMPT = """你是一个专业的药物相互作用分析助手。请分析以下药品组合是否存在已知的相互作用风险。

药品列表：{medicines}

规则数据库检测结果：{rule_result}

请以 JSON 格式返回分析结果：
{
  "risk_level": "safe/warning/danger",
  "has_interaction": true/false,
  "description": "相互作用的具体描述",
  "suggestion": "用药建议",
  "references": "参考来源说明"
}

注意：
- risk_level: safe（安全无风险）、warning（存在潜在风险需注意）、danger（严重风险需避免）
- 如果只有一种药品，has_interaction 为 false，risk_level 为 safe
- 优先参考规则数据库结果，对数据库中未覆盖的药品组合进行补充分析
- 只返回 JSON，不要有其他文字"""

    def check_drug_interaction(self, medicine_names: list):
        """
        检测药品组合的相互作用风险（两阶段策略）
        
        第一阶段：规则数据库检测（主引擎）
        - 基于权威医学数据的药物相互作用规则
        - 高可信度，可追溯
        - 检测到风险时直接返回，无需调用LLM
        
        第二阶段：LLM补充分析（辅助解释层）
        - 规则数据库未覆盖的药品组合
        - 对检测结果进行自然语言解释和优化
        - 仅作为补充，不替代规则数据库
        """
        if len(medicine_names) < 2:
            return {
                "success": True,
                "parsed": {
                    "risk_level": "safe",
                    "has_interaction": False,
                    "description": "仅有一种药品，无需检测相互作用",
                    "suggestion": "",
                    "references": "规则数据库",
                },
                "duration_ms": 0,
            }

        start = time.time()

        rule_result = interaction_engine.check_interaction(medicine_names)

        if rule_result.get('has_interaction') and rule_result.get('risk_level') in ('warning', 'danger'):
            duration_ms = int((time.time() - start) * 1000)
            return {
                "success": True,
                "parsed": {
                    "risk_level": rule_result['risk_level'],
                    "has_interaction": rule_result['has_interaction'],
                    "description": rule_result['description'],
                    "suggestion": rule_result['suggestion'],
                    "references": "规则数据库",
                    "confidence": rule_result.get('confidence', 'high'),
                },
                "duration_ms": duration_ms,
            }

        if rule_result.get('confidence') == 'high':
            duration_ms = int((time.time() - start) * 1000)
            return {
                "success": True,
                "parsed": {
                    "risk_level": rule_result['risk_level'],
                    "has_interaction": rule_result['has_interaction'],
                    "description": rule_result['description'],
                    "suggestion": rule_result['suggestion'],
                    "references": "规则数据库",
                    "confidence": "high",
                },
                "duration_ms": duration_ms,
            }

        medicines_text = "、".join(medicine_names)
        rule_desc = rule_result.get('description', '未找到匹配规则')
        prompt = self.INTERACTION_PROMPT.format(medicines=medicines_text, rule_result=rule_desc)
        messages = [{"role": "user", "content": prompt}]
        llm_result = self._call_llm(messages, temperature=0.2)

        total_duration_ms = int((time.time() - start) * 1000)

        if not llm_result["success"]:
            return {
                "success": True,
                "parsed": {
                    "risk_level": rule_result['risk_level'],
                    "has_interaction": rule_result['has_interaction'],
                    "description": rule_result['description'],
                    "suggestion": rule_result['suggestion'],
                    "references": "规则数据库（LLM补充分析失败）",
                    "confidence": "medium",
                },
                "duration_ms": total_duration_ms,
            }

        try:
            content = llm_result["content"].strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else content
                content = content.strip()
            parsed = json.loads(content)

            parsed["references"] = "规则数据库 + LLM补充分析"
            parsed["confidence"] = "medium"

            return {
                "success": True,
                "parsed": parsed,
                "duration_ms": total_duration_ms,
            }
        except json.JSONDecodeError:
            return {
                "success": True,
                "parsed": {
                    "risk_level": rule_result['risk_level'],
                    "has_interaction": rule_result['has_interaction'],
                    "description": rule_result['description'],
                    "suggestion": rule_result['suggestion'],
                    "references": "规则数据库（LLM返回格式异常）",
                    "confidence": "medium",
                },
                "duration_ms": total_duration_ms,
            }

    # ========== 用药报告生成 ==========

    REPORT_PROMPT = """你是一个专业的家庭健康数据分析师。请根据以下家庭药品数据，生成一份用药安全分析报告。

家庭药品数据：
- 药品总数：{total}
- 在用药品：{active_count}
- 已过期药品：{expired_count}
- 临期药品（30天内）：{near_expiry_count}
- 已用完药品：{used_count}
- 分类分布：{categories}
- 家庭成员用药情况：{member_usage}

请以 JSON 格式返回分析报告：
{
  "summary": "药品总览（1-2句话概括）",
  "expiry_alert": {
    "level": "safe/warning/danger",
    "message": "过期风险预警信息"
  },
  "category_analysis": "分类分布分析",
  "consumption_trend": "消耗趋势分析",
  "health_advice": ["健康建议1", "健康建议2", "健康建议3"],
  "disclaimer": "本报告由AI生成，仅供参考"
}

只返回 JSON，不要有其他文字"""

    def generate_report(self, stats: dict):
        """生成家庭用药分析报告"""
        prompt = self.REPORT_PROMPT.format(
            total=stats.get("total_all", 0),
            active_count=stats.get("total", 0),
            expired_count=stats.get("expired", 0),
            near_expiry_count=stats.get("near_expiry", 0),
            used_count=stats.get("used", 0),
            categories=json.dumps(stats.get("categories", []), ensure_ascii=False),
            member_usage=json.dumps(stats.get("member_usage", []), ensure_ascii=False),
        )

        messages = [{"role": "user", "content": prompt}]
        result = self._call_llm(messages, temperature=0.5)

        if not result["success"]:
            return result

        try:
            content = result["content"].strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else content
                content = content.strip()
            result["parsed"] = json.loads(content)
            return result
        except json.JSONDecodeError:
            return {"success": False, "error": "AI 返回格式异常", "duration_ms": result.get("duration_ms", 0)}

    # ========== 健康检查 ==========

    def health_check(self):
        """检查 AI 服务是否可用"""
        result = self._call_llm(
            messages=[{"role": "user", "content": "回复 OK"}],
            max_tokens=10,
            temperature=0,
        )
        return {"available": result["success"], "duration_ms": result.get("duration_ms", 0)}

    # ========== 服药场景识别 ==========

    SCENE_PROMPT = """你是一个智能药箱助手。老人在服药提醒后说了一段话，请分析其内容并判断属于哪个场景。

药品名称：{medicine_name}
用量：{dosage}
老人说的话："{transcript}"

请以 JSON 格式返回分析结果：
{{
  "scene": "taken" | "delay" | "already_taken" | "refused_unwell" | "unknown",
  "confidence": "high" | "medium" | "low",
  "analysis": "简要分析老人说了什么",
  "health_question": "如果老人已服药，生成一个关切的健康询问（如'早上做了什么，有没有不舒服'），如果未服药则为空字符串"
}}

场景判定规则：
- "taken"（已服药）：老人表示已经吃了药、正在吃药、刚喝完等。如"已经喝了""正在喝""吃完了""刚吃了"
- "delay"（延迟服药）：老人表示要推迟服药，如"吃完饭就喝""等会儿再吃""晚点吃""刚吃过饭再等等"
- "already_taken"（已提前服药）：老人表示在这之前就已经吃过了，避免重复服药。如"我刚才吃过了""早上就吃了""早就吃了"
- "refused_unwell"（身体不适拒绝服药）：老人表示身体不舒服不想吃药，需立即关怀。如"胃不舒服不想吃""头晕吃不下""恶心不想吃"
- "unknown"（无法判定）：老人说的话与服药无关，或无法理解

注意：
- health_question 仅在 scene="taken" 时生成，口吻要温暖关切，像家人在聊天
- already_taken 场景不要触发二次提醒，避免老人重复服药
- refused_unwell 场景需在 analysis 中说明不适症状，便于家人关怀
- 只返回 JSON，不要有其他文字"""

    # P0：关键词降级引擎（LLM 不可用/超时时使用）
    KEYWORD_FALLBACK = {
        "taken": ['已经喝', '已经吃', '正在喝', '正在吃', '喝了', '吃了', '吃完了', '刚喝', '刚吃', '服过', '服了', '吃下去了'],
        "delay": ['吃完饭', '等一会', '等一下', '稍后', '待会儿', '待会', '等会儿', '吃完饭再', '饭后', '晚点', '过会儿'],
        "already_taken": ['刚才吃', '早上吃', '早就吃', '之前吃', '已经吃过', '刚才喝', '早上喝', '早就喝', '吃过了'],
        "refused_unwell": ['不舒服', '头晕', '恶心', '胃疼', '胃不适', '吃不下', '不想吃', '难受', '肚子疼', '想吐', '反胃'],
    }

    def _keyword_fallback_scene(self, transcript):
        """P0 降级：LLM 不可用时，基于关键词匹配判定场景"""
        if not transcript or not transcript.strip():
            return {
                "scene": "unknown",
                "confidence": "low",
                "analysis": "未检测到语音内容（关键词引擎）",
                "health_question": "",
            }
        text = transcript.lower()
        # 按优先级匹配：refused_unwell > already_taken > taken > delay
        # 身体不适最优先（安全相关）
        for kw in self.KEYWORD_FALLBACK["refused_unwell"]:
            if kw in text:
                return {
                    "scene": "refused_unwell",
                    "confidence": "medium",
                    "analysis": f"关键词引擎识别到不适关键词：{kw}",
                    "health_question": "",
                }
        for kw in self.KEYWORD_FALLBACK["already_taken"]:
            if kw in text:
                return {
                    "scene": "already_taken",
                    "confidence": "medium",
                    "analysis": f"关键词引擎识别到已提前服药：{kw}",
                    "health_question": "",
                }
        for kw in self.KEYWORD_FALLBACK["taken"]:
            if kw in text:
                return {
                    "scene": "taken",
                    "confidence": "medium",
                    "analysis": f"关键词引擎识别到已服药：{kw}",
                    "health_question": "吃药后感觉怎么样？有没有不舒服？",
                }
        for kw in self.KEYWORD_FALLBACK["delay"]:
            if kw in text:
                return {
                    "scene": "delay",
                    "confidence": "medium",
                    "analysis": f"关键词引擎识别到延迟意图：{kw}",
                    "health_question": "",
                }
        return {
            "scene": "unknown",
            "confidence": "low",
            "analysis": "关键词引擎未匹配到明确意图",
            "health_question": "",
        }

    def analyze_medication_scene(self, transcript, medicine_name, dosage):
        """分析老人服药反馈语音，判定场景类型"""
        if not transcript or not transcript.strip():
            # 无语音内容，降级为 unknown
            return {
                "success": True,
                "parsed": {
                    "scene": "unknown",
                    "confidence": "low",
                    "analysis": "未检测到语音内容",
                    "health_question": "",
                },
                "duration_ms": 0,
            }

        prompt = self.SCENE_PROMPT.format(
            medicine_name=medicine_name or '药品',
            dosage=dosage or '按医嘱',
            transcript=transcript
        )

        messages = [{"role": "user", "content": prompt}]
        result = self._call_llm(messages, temperature=0.3, max_tokens=500)

        if not result["success"]:
            # P0 降级：LLM 调用失败，使用关键词引擎兜底
            fallback_parsed = self._keyword_fallback_scene(transcript)
            return {
                "success": True,
                "parsed": fallback_parsed,
                "duration_ms": 0,
                "degraded": True,
            }

        try:
            content = result["content"].strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else content
                content = content.strip()
            result["parsed"] = json.loads(content)
            return result
        except json.JSONDecodeError:
            # P0 降级：LLM 返回格式异常，使用关键词引擎兜底
            fallback_parsed = self._keyword_fallback_scene(transcript)
            return {
                "success": True,
                "parsed": fallback_parsed,
                "duration_ms": result.get("duration_ms", 0),
                "degraded": True,
            }


# 全局单例
ai_service = AIService()