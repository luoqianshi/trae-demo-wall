import os
import json
import numpy as np
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

ANALYSIS_PROMPT = """
你是一位深度心理学顾问，擅长荣格心理学、自我实现理论和积极心理学。
请基于用户的日记内容，进行深度的"理想自我 vs 现实自我"分析。

用户输入：
- 日记文本：{diary_text}
- 语音内容：{audio_transcript}
- 环境描述：{image_description}
- GPS位置：{gps_coordinates}

请从以下维度进行深度分析，并输出严格的 JSON 格式：
{{
  "ideal_self": "用户内心深处渴望成为的理想自我形象（80-120字），用富有诗意和画面感的语言描述",
  "actual_self": "用户当前的真实自我状态（80-120字），客观描述其现状和挣扎",
  "discrepancy_score": 0-100的数值，表示理想与现实的偏差程度，越接近100偏差越大",
  "location_keyword": "最适合用户当前状态的成长场景关键词，如：书店、公园、咖啡馆、美术馆、海边、山顶、图书馆、博物馆、寺庙、花园",
  "suggested_action": "具体的行动建议（50-80字），可操作、有温度",
  "emotion_dimensions": {{
    "energy": 0-100, 能量水平
    "anxiety": 0-100, 焦虑程度
    "happiness": 0-100, 幸福指数
    "calmness": 0-100, 内心平静度
    "motivation": 0-100, 动力水平
    "confidence": 0-100, 自信心
  }},
  "strengths": ["优势1", "优势2", "优势3"],
  "growth_areas": ["成长点1", "成长点2"],
  "mirror_insight": "一句富有哲理的'镜中洞察'，点醒用户（20-40字）",
  "personality_traits": ["特质1", "特质2", "特质3", "特质4", "特质5"]
}}

要求：
1. 语言优美、有诗意、有温度
2. 分析深入，不仅仅停留在表面
3. 建议具体可操作，不是空泛的鸡汤
4. 偏差值计算要合理，基于内容的分析
5. mirror_insight 要有"照镜子"的感觉，一语中的
"""

async def analyze_self(
    diary_text: str,
    audio_transcript: str = None,
    image_description: str = None,
    gps_coordinates: str = None
) -> dict:
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")
    model_name = os.getenv("MODEL_NAME", "deepseek-chat")
    
    if not api_key or api_key == "your_deepseek_api_key_here":
        return generate_mock_analysis(diary_text, audio_transcript, image_description, gps_coordinates)
    
    try:
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.7,
            api_key=api_key,
            base_url=api_base
        )
        prompt = PromptTemplate(
            template=ANALYSIS_PROMPT,
            input_variables=["diary_text", "audio_transcript", "image_description", "gps_coordinates"]
        )
        chain = prompt | llm
        
        response = chain.invoke({
            "diary_text": diary_text,
            "audio_transcript": audio_transcript or "无",
            "image_description": image_description or "无",
            "gps_coordinates": gps_coordinates or "无"
        })
        
        response_text = response.content.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
        
        analysis = json.loads(response_text)
        return analysis
    
    except Exception as e:
        print(f"Error in AI analysis: {e}")
        return generate_mock_analysis(diary_text, audio_transcript, image_description, gps_coordinates)

def compute_discrepancy(ideal_vector, actual_vector):
    ideal = np.array(ideal_vector)
    actual = np.array(actual_vector)
    
    cos_sim = np.dot(ideal, actual) / (np.linalg.norm(ideal) * np.linalg.norm(actual))
    discrepancy = (1 - cos_sim) * 100
    
    return round(discrepancy, 1)

def generate_mock_analysis(
    diary_text: str,
    audio_transcript: str = None,
    image_description: str = None,
    gps_coordinates: str = None
) -> dict:
    combined_text = (diary_text or "") + " " + (audio_transcript or "") + " " + (image_description or "")
    
    has_stress = any(w in combined_text for w in ["压力", "焦虑", "累", "疲惫", "担心", "害怕", "紧张", "困难", "挣扎", "迷茫"])
    has_happy = any(w in combined_text for w in ["开心", "高兴", "快乐", "幸福", "满足", "兴奋", "喜欢", "爱"])
    has_work = any(w in combined_text for w in ["工作", "上班", "项目", "会议", "老板", "同事", "KPI", "deadline"])
    has_nature = any(w in combined_text for w in ["自然", "公园", "山", "海", "树", "花", "天空", "户外"])
    has_art = any(w in combined_text for w in ["书", "音乐", "电影", "画画", "艺术", "创作", "写作"])
    has_friends = any(w in combined_text for w in ["朋友", "家人", "陪伴", "聚会", "聊天", "一起"])
    
    if has_stress and not has_happy:
        discrepancy_score = 72 + hash(diary_text) % 15
        location_keyword = "书店"
        ideal_self = "你渴望成为一个内心平静、从容不迫的人。在理想的世界里，你能够游刃有余地应对生活的挑战，找到工作与生活的平衡点，拥有属于自己的精神角落，在阅读和思考中获得力量与智慧。"
        actual_self = "现实中的你正承受着不小的压力，生活的节奏让你感到有些喘不过气。你努力想要做好每一件事，却常常感到力不从心。内心深处有个声音在呼唤，渴望找到属于自己的节奏和方向。"
        suggested_action = "找一家安静的书店，点一杯咖啡，翻一本喜欢的书。给自己两小时完全属于自己的时间，让心灵在文字中找到栖息之地。"
        mirror_insight = "你一直在向外寻找答案，却忘了答案一直都在镜子里。"
        emotions = {"energy": 35, "anxiety": 78, "happiness": 32, "calmness": 28, "motivation": 45, "confidence": 40}
        strengths = ["责任心强", "追求完美", "善于反思"]
        growth_areas = ["学会放松", "接纳不完美"]
        traits = ["内省", "敏感", "有责任心", "追求成长", "理想主义"]
    
    elif has_happy and not has_stress:
        discrepancy_score = 28 + hash(diary_text) % 12
        location_keyword = "公园"
        ideal_self = "你理想中的自己充满活力与热情，是那个能够尽情享受生活、与世界温柔相拥的人。你渴望持续成长，不断探索生命的可能性，成为光，也成为温暖。"
        actual_self = "此刻的你状态很好，内心充满阳光和力量。你正走在成长的路上，虽然还有进步的空间，但你已经学会了欣赏当下、感恩生活。这种状态本身就是一种礼物。"
        suggested_action = "去公园里走走吧，感受阳光、微风和鸟鸣。让自己完全沉浸在当下的美好中，你值得这样的快乐时光。"
        mirror_insight = "当你微笑时，整个世界都在对你微笑。"
        emotions = {"energy": 82, "anxiety": 18, "happiness": 85, "calmness": 75, "motivation": 78, "confidence": 80}
        strengths = ["积极乐观", "感知力强", "热爱生活"]
        growth_areas = ["保持节奏", "持续成长"]
        traits = ["乐观", "热情", "感性", "有创造力", "热爱自由"]
    
    elif has_work and has_stress:
        discrepancy_score = 65 + hash(diary_text) % 15
        location_keyword = "咖啡馆"
        ideal_self = "你渴望成为职场中从容自信的专业人士，同时又能保持内心的独立和自由。理想中的你，既能把工作做到出色，又不会被工作定义，有自己的热爱和生活。"
        actual_self = "工作占据了你生活的大部分，你在努力证明自己的价值，却也在这个过程中感到有些迷失。你需要一个喘息的空间，重新找回自己的节奏和方向。"
        suggested_action = "找一家有格调的咖啡馆，换个环境思考。也许答案不在办公桌前，而在一杯咖啡的香气里。"
        mirror_insight = "你不是你做的事，你是那个做事的人。"
        emotions = {"energy": 45, "anxiety": 68, "happiness": 42, "calmness": 35, "motivation": 55, "confidence": 50}
        strengths = ["敬业", "有上进心", "学习能力强"]
        growth_areas = ["工作生活平衡", "自我关怀"]
        traits = ["上进", "坚韧", "理性", "有追求", "完美主义"]
    
    elif has_nature:
        discrepancy_score = 38 + hash(diary_text) % 15
        location_keyword = "山顶"
        ideal_self = "你理想中的自己是自由的、开阔的，像山川湖海一样有力量和格局。你渴望突破限制，看到更广阔的世界，成为更好的自己。"
        actual_self = "你对自然和自由有着天然的向往，这是你内心力量的源泉。虽然现实有时会让你感到束缚，但你知道，真正的自由来自内心的辽阔。"
        suggested_action = "去爬山吧，站在山顶俯瞰一切。你会发现，那些困扰你的事情，从更高的视角看，不过是风景的一部分。"
        mirror_insight = "山不过来，我就过去。你就是自己的山。"
        emotions = {"energy": 65, "anxiety": 35, "happiness": 70, "calmness": 68, "motivation": 72, "confidence": 68}
        strengths = ["向往自由", "内心有力量", "视野开阔"]
        growth_areas = ["行动力", "落地实践"]
        traits = ["自由", "理想主义", "浪漫", "有力量", "探索者"]
    
    else:
        discrepancy_score = 52 + hash(diary_text) % 15
        location_keyword = "美术馆"
        ideal_self = "你渴望成为一个有深度、有审美的人，拥有丰富的内心世界和独特的精神追求。理想中的你，既能入世又能出世，在烟火和诗意之间找到平衡。"
        actual_self = "你在平凡的生活中寻找着不平凡的意义，内心有对美好事物的向往和追求。也许你还没完全找到自己的表达方式，但那颗种子已经在心里了。"
        suggested_action = "去美术馆逛逛吧，让艺术唤醒你内心沉睡的部分。有时候，美就是最好的答案。"
        mirror_insight = "每个灵魂都是一件艺术品，只是你还没学会欣赏自己。"
        emotions = {"energy": 55, "anxiety": 45, "happiness": 58, "calmness": 60, "motivation": 62, "confidence": 55}
        strengths = ["有审美", "内心丰富", "追求美好"]
        growth_areas = ["自信表达", "勇敢尝试"]
        traits = ["感性", "有品味", "细腻", "追求美", "理想主义"]
    
    return {
        "ideal_self": ideal_self,
        "actual_self": actual_self,
        "discrepancy_score": min(99, max(10, discrepancy_score)),
        "location_keyword": location_keyword,
        "suggested_action": suggested_action,
        "emotion_dimensions": emotions,
        "strengths": strengths,
        "growth_areas": growth_areas,
        "mirror_insight": mirror_insight,
        "personality_traits": traits
    }
