"""LLM 服务模块 - 支持国产模型（OpenAI 兼容接口）"""
import json
import time
from typing import AsyncGenerator, Dict, Any, Optional

from openai import AsyncOpenAI

from backend.config import get_config


class LLMService:
    """LLM 服务封装 - 支持真实 API 和 Mock 演示模式"""

    def __init__(self):
        cfg = get_config().llm
        self.api_key = cfg.api_key
        self.base_url = cfg.base_url
        # 检测是否为 Mock 模式（未配置真实 API Key）
        self.mock_mode = not self.api_key or self.api_key in ["your-api-key-here", "", "sk-test"]

        if not self.mock_mode:
            self.client = AsyncOpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
            )
        else:
            self.client = None

        self.model = cfg.model
        self.temperature = cfg.temperature
        self.max_tokens = cfg.max_tokens

    async def chat(
        self,
        messages: list,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False,
    ) -> str:
        """非流式对话"""
        if self.mock_mode:
            return await self._mock_chat(messages)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens,
                stream=False,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            raise RuntimeError(f"LLM 调用失败: {str(e)}")

    async def _mock_chat(self, messages: list) -> str:
        """Mock 模式：根据 prompt 内容返回模拟响应"""
        import asyncio
        # 模拟网络延迟
        await asyncio.sleep(0.8)

        prompt = messages[-1].get("content", "")

        if "意图识别" in prompt:
            return json.dumps({
                "problem_type": "VRP",
                "problem_name": "车辆路径优化问题",
                "objective": "最小化总行驶距离，合理分配配送点到各车辆",
                "key_constraints": ["每辆车容量不超过50件", "每个配送点必须被访问一次", "车辆从仓库出发并返回"],
                "data_requirements": ["配送点坐标", "各点需求量", "车辆容量"],
                "estimated_scale": "medium",
                "confidence": "high"
            }, ensure_ascii=False)

        elif "数学模型" in prompt or "模型描述" in prompt:
            return json.dumps({
                "model_name": "带容量约束的车辆路径问题（CVRP）",
                "model_type": "MILP",
                "description": "经典 capacitated VRP 模型，最小化总行驶距离",
                "variables": [
                    {"name": "x_{ij}", "type": "binary", "description": "车辆是否经过边(i,j)"},
                    {"name": "u_i", "type": "continuous", "description": "车辆到达点i时的累计载货量"}
                ],
                "objective": {
                    "type": "minimize",
                    "function": "sum_{i,j} c_{ij} * x_{ij}",
                    "description": "最小化所有车辆行驶的总距离"
                },
                "constraints": [
                    {"name": "流量守恒", "expression": "sum_j x_{ij} = 1, forall i", "description": "每个配送点恰好被访问一次"},
                    {"name": "车辆容量", "expression": "u_i + q_i - Q*(1-x_{ij}) <= u_j", "description": "车辆载货量不超过容量上限"},
                    {"name": "车辆数", "expression": "sum_j x_{0j} <= m", "description": "最多使用m辆车"}
                ],
                "parameters": {
                    "n": 10,
                    "m": 3,
                    "Q": 50
                },
                "algorithm_hint": "heuristic"
            }, ensure_ascii=False)

        elif "修正" in prompt and "模型" in prompt:
            return json.dumps({
                "model_name": "带容量约束的车辆路径问题（CVRP）- 修正版",
                "model_type": "MILP",
                "description": "修正后的 CVRP 模型，确保约束之间无矛盾",
                "variables": [
                    {"name": "x_{ij}", "type": "binary", "description": "车辆是否经过边(i,j)"},
                    {"name": "u_i", "type": "continuous", "description": "车辆到达点i时的累计载货量"}
                ],
                "objective": {
                    "type": "minimize",
                    "function": "sum_{i,j} c_{ij} * x_{ij}",
                    "description": "最小化所有车辆行驶的总距离"
                },
                "constraints": [
                    {"name": "流量守恒", "expression": "sum_j x_{ij} = 1", "description": "每个配送点恰好被访问一次"},
                    {"name": "车辆容量", "expression": "u_i <= Q", "description": "车辆载货量不超过容量上限50件"},
                    {"name": "车辆数", "expression": "sum_j x_{0j} <= m", "description": "最多使用3辆车"}
                ],
                "parameters": {
                    "n": 10,
                    "m": 3,
                    "Q": 50
                },
                "algorithm_hint": "heuristic"
            }, ensure_ascii=False)

        elif "算法" in prompt and ("推荐" in prompt or "更合适" in prompt):
            return "ALNS"

        # 默认返回空
        return "{}"

    async def chat_stream(
        self,
        messages: list,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """流式对话"""
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n[错误: LLM 调用失败: {str(e)}]"

    # ========== 业务专用 Prompt ==========

    async def intent_recognition(self, user_query: str, file_info: str = "") -> Dict[str, Any]:
        """意图识别：从用户输入中提取问题类型和关键信息"""
        prompt = f"""你是一位运筹优化专家。请分析以下用户需求，识别其优化问题类型并提取关键信息。

用户输入：
{user_query}

文件信息：
{file_info if file_info else "无上传文件"}

请严格按照以下 JSON 格式输出（不要输出其他内容）：
{{
    "problem_type": "问题类型，如：VRP, TSP, 调度问题, 资源分配, 线性规划, 整数规划, 网络流, 其他",
    "problem_name": "问题名称的简短描述",
    "objective": "目标函数描述",
    "key_constraints": ["约束条件1", "约束条件2"],
    "data_requirements": ["所需数据字段1", "所需数据字段2"],
    "estimated_scale": "问题规模评估：small/medium/large",
    "confidence": "意图识别置信度：high/medium/low"
}}
"""
        response = await self.chat([{"role": "user", "content": prompt}], temperature=0.2)
        try:
            # 清理可能的 markdown 代码块
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            # 如果解析失败，返回结构化信息
            return {
                "problem_type": "未知",
                "problem_name": "未命名问题",
                "objective": user_query,
                "key_constraints": [],
                "data_requirements": [],
                "estimated_scale": "medium",
                "confidence": "low",
                "raw_response": response,
            }

    async def build_model(self, intent_result: Dict[str, Any], user_query: str) -> Dict[str, Any]:
        """构建数学模型描述"""
        prompt = f"""你是一位运筹优化建模专家。请根据以下意图识别结果，建立标准的数学模型描述。

用户原始需求：{user_query}

意图识别结果：
{json.dumps(intent_result, ensure_ascii=False, indent=2)}

请严格按照以下 JSON 格式输出模型描述：
{{
    "model_name": "模型名称",
    "model_type": "模型类型：MILP/ LP/ NLP/ 组合优化/ 图论",
    "description": "模型文字描述",
    "variables": [
        {{"name": "x_ij", "type": "binary", "description": "是否经过边(i,j)"}}
    ],
    "objective": {{
        "type": "minimize/maximize",
        "function": "数学表达式",
        "description": "目标函数文字描述"
    }},
    "constraints": [
        {{"name": "约束1", "expression": "数学表达式", "description": "约束描述"}}
    ],
    "parameters": {{
        "n": "节点数量",
        "m": "车辆数量"
    }},
    "algorithm_hint": "建议使用的算法类型"
}}
"""
        response = await self.chat([{"role": "user", "content": prompt}], temperature=0.3)
        try:
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            return {
                "model_name": intent_result.get("problem_name", "未命名模型"),
                "model_type": "MILP",
                "description": response[:500],
                "variables": [],
                "objective": {"type": "minimize", "function": "", "description": ""},
                "constraints": [],
                "parameters": {},
                "algorithm_hint": "heuristic",
                "raw_response": response,
            }

    async def fix_model(
        self,
        current_model: Dict[str, Any],
        validation_errors: list,
        iteration: int,
    ) -> Dict[str, Any]:
        """根据验证错误修正模型"""
        prompt = f"""你是一位运筹优化建模专家。当前模型存在以下问题，请修正。

当前模型：
{json.dumps(current_model, ensure_ascii=False, indent=2)}

验证错误（第 {iteration} 轮修正）：
{json.dumps(validation_errors, ensure_ascii=False, indent=2)}

请输出修正后的完整模型 JSON，格式与之前相同。注意：
1. 保留原始模型的核心意图
2. 针对每个验证错误进行针对性修正
3. 如果约束之间存在矛盾，请简化或删除矛盾的约束
"""
        response = await self.chat([{"role": "user", "content": prompt}], temperature=0.3)
        try:
            cleaned = response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except json.JSONDecodeError:
            current_model["fix_attempt"] = iteration
            current_model["fix_error"] = response[:500]
            return current_model

    async def fix_algorithm(
        self,
        model: Dict[str, Any],
        current_algorithm: str,
        validation_errors: list,
        iteration: int,
    ) -> str:
        """根据验证错误调整算法选择"""
        prompt = f"""当前使用算法 {current_algorithm} 求解以下模型时出现问题，请推荐更合适的算法。

模型信息：
{json.dumps(model, ensure_ascii=False, indent=2)}

求解问题：
{json.dumps(validation_errors, ensure_ascii=False, indent=2)}

当前算法：{current_algorithm}

请直接输出推荐算法名称（精确算法/ALNS/遗传算法/A*/模拟退火/禁忌搜索），不要解释。
"""
        response = await self.chat([{"role": "user", "content": prompt}], temperature=0.2)
        algo = response.strip().split("\n")[0].strip()
        # 规范化算法名称
        algo_map = {
            "精确算法": "exact",
            "ALNS": "alns",
            "alns": "alns",
            "遗传算法": "genetic",
            "遗传": "genetic",
            "A*": "astar",
            "astar": "astar",
            "模拟退火": "sa",
            "禁忌搜索": "tabu",
        }
        for key, val in algo_map.items():
            if key in algo:
                return val
        return "alns"  # 默认回退


# 单例
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
