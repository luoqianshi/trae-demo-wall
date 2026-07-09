import httpx
from typing import Optional, List, Dict, AsyncGenerator
from app.core.config import settings
import json

class DeepSeekClient:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_API_BASE_URL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def chat(self, messages: List[Dict], model: str = None, temperature: float = 0.7) -> Optional[str]:
        if not self.api_key:
            return "请先在系统配置中设置AI API Key"
        
        url = f"{self.base_url}/v1/chat/completions"
        payload = {
            "model": model or settings.AI_MODEL_NAME,
            "messages": messages,
            "temperature": temperature
        }
        
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(url, headers=self.headers, json=payload)
                if response.status_code == 403:
                    return "AI调用失败: API Key权限不足，请检查API Key或在平台上配置可用模型"
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            return f"AI调用失败: HTTP错误 {e.response.status_code} - {str(e)}"
        except Exception as e:
            return f"AI调用失败: {str(e)}"
    
    async def stream_chat(self, messages: List[Dict], model: str = None, temperature: float = 0.7) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "请先在系统配置中设置AI API Key"
            return
        
        url = f"{self.base_url}/v1/chat/completions"
        payload = {
            "model": model or settings.AI_MODEL_NAME,
            "messages": messages,
            "temperature": temperature,
            "stream": True
        }
        
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream("POST", url, headers=self.headers, json=payload) as response:
                    if response.status_code == 403:
                        yield "AI调用失败: API Key权限不足，请检查API Key或在平台上配置可用模型"
                        return
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data = line[6:]
                            if data.strip() == "[DONE]":
                                break
                            try:
                                json_data = json.loads(data)
                                if "choices" in json_data and len(json_data["choices"]) > 0:
                                    delta = json_data["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
        except httpx.HTTPStatusError as e:
            yield f"AI调用失败: HTTP错误 {e.response.status_code} - {str(e)}"
        except Exception as e:
            yield f"AI调用失败: {str(e)}"
    
    async def generate_marketing_copy(self, dish_name: str, features: str, target_audience: str = "") -> str:
        prompt = f"""你是一个资深餐饮营销专家，请根据以下菜品信息生成吸引人的营销文案：
菜品：{dish_name}
特色：{features}
目标人群：{target_audience}
要求：包含情感共鸣点，语言生动有趣，适合社交媒体发布，字数控制在150字以内。"""
        
        messages = [{"role": "user", "content": prompt}]
        return await self.chat(messages)
    
    async def generate_operation_plan(self, plan_type: str, title: str, merchant_info: dict = None) -> str:
        merchant_desc = json.dumps(merchant_info, ensure_ascii=False) if merchant_info else ""
        
        prompt = f"""你是一个餐饮运营顾问，请为以下商家生成一份详细的{plan_type}方案：
方案标题：{title}
商家信息：{merchant_desc}
要求：
1. 方案目标明确
2. 执行步骤详细具体
3. 预期效果可量化
4. 给出具体的时间安排和责任人建议"""
        
        messages = [{"role": "user", "content": prompt}]
        return await self.chat(messages)
    
    async def analyze_data(self, analysis_type: str, data: dict) -> str:
        data_str = json.dumps(data, ensure_ascii=False)
        
        prompt = f"""你是一个数据分析专家，请对以下数据进行{analysis_type}分析：
数据：{data_str}
要求：
1. 找出关键趋势和异常点
2. 给出数据背后的业务洞察
3. 提供可操作的建议
4. 用清晰易懂的语言总结"""
        
        messages = [{"role": "user", "content": prompt}]
        return await self.chat(messages)
    
    async def optimize_menu(self, current_menu: List[dict], sales_data: List[dict] = None) -> str:
        menu_str = json.dumps(current_menu, ensure_ascii=False)
        sales_str = json.dumps(sales_data, ensure_ascii=False) if sales_data else ""
        
        prompt = f"""你是一个餐饮菜单优化专家，请根据以下信息给出菜单优化建议：
当前菜单：{menu_str}
销售数据：{sales_str}
要求：
1. 分析当前菜单的优缺点
2. 推荐保留、改进或移除的菜品
3. 建议新增菜品
4. 给出定价策略建议
5. 提供菜单布局优化方案"""
        
        messages = [{"role": "user", "content": prompt}]
        return await self.chat(messages)
    
    async def get_advice(self, question: str, merchant_info: dict = None) -> str:
        merchant_desc = json.dumps(merchant_info, ensure_ascii=False) if merchant_info else ""
        
        prompt = f"""你是一个餐饮行业专家，请回答以下问题：
问题：{question}
商家信息：{merchant_desc}
要求：
1. 给出专业的分析
2. 提供具体的解决方案
3. 给出可执行的建议
4. 语言通俗易懂"""
        
        messages = [{"role": "user", "content": prompt}]
        return await self.chat(messages)

deepseek_client = DeepSeekClient()
