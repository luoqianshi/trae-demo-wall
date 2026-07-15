import os
import json
from datetime import datetime, timedelta
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage

from core.history_store import (
    get_analysis_history,
    get_chat_history,
    get_trend_data,
    save_daily_summary,
)

DAILY_SUMMARY_PROMPT = """
你是"镜灵"——一位温暖睿智的AI心理成长伙伴。

请基于用户今日的所有分析记录和对话，生成一份温暖、深刻、有洞见的每日总结。

用户数据：
- 今日分析次数：{analysis_count} 次
- 今日对话次数：{chat_count} 次
- 平均偏差值：{avg_score:.1f}/100（数值越高表示理想与现实偏差越大）
- 偏差值趋势：{trend_description}
- 最常出现的成长场景：{top_location}
- 平均情绪维度：
  - 能量：{avg_energy:.0f}/100
  - 焦虑：{avg_anxiety:.0f}/100
  - 幸福：{avg_happiness:.0f}/100
  - 平静：{avg_calmness:.0f}/100
  - 动力：{avg_motivation:.0f}/100
  - 自信：{avg_confidence:.0f}/100

- 今日所有分析记录摘要：
{analysis_summaries}

- 今日对话摘要：
{chat_summaries}

请输出严格的 JSON 格式：
{{
  "summary_text": "温暖优美的每日总结文字（150-200字），像一位知心朋友在和用户回顾今天的成长旅程，有共情也有鼓励",
  "mirror_insight": "一句富有哲理的镜中洞察，一语中的，有照镜子的感觉（20-40字）",
  "suggestions": ["具体建议1", "具体建议2", "具体建议3"],
  "emotion_label": "今天的情绪标签，如：平静成长日 / 压力挑战日 / 快乐充实日 / 迷茫探索日 等"
}}

要求：
1. 语言有温度、有诗意，但不矫情
2. 分析要基于数据，但表达要人性化
3. 建议具体可操作，不是空泛鸡汤
4. 永远往积极成长的方向引导
5. 适当使用"镜子""光""成长"等意象
"""


async def generate_daily_summary(user_id: str = "default_user", target_date: str = None):
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")
    model_name = os.getenv("MODEL_NAME", "deepseek-chat")

    if target_date is None:
        target_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    analyses = get_analysis_history(limit=100)
    target_dt = datetime.strptime(target_date, "%Y-%m-%d")
    next_dt = target_dt + timedelta(days=1)

    day_analyses = []
    for a in analyses:
        created = a.get("created_at", "")
        if isinstance(created, str):
            try:
                ca = datetime.fromisoformat(created.replace("Z", "+00:00").replace(" ", "T"))
            except:
                continue
            if target_dt <= ca.replace(tzinfo=None) < next_dt:
                day_analyses.append(a)

    chats = get_chat_history(user_id, limit=200)
    day_chats = []
    for c in chats:
        created = c.get("created_at", "")
        if isinstance(created, str):
            try:
                cc = datetime.fromisoformat(created.replace("Z", "+00:00").replace(" ", "T"))
            except:
                continue
            if target_dt <= cc.replace(tzinfo=None) < next_dt:
                day_chats.append(c)

    if not day_analyses and not day_chats:
        return None

    analysis_count = len(day_analyses)
    chat_count = len(day_chats)

    avg_score = 50.0
    avg_emotions = {"energy": 50, "anxiety": 50, "happiness": 50,
                    "calmness": 50, "motivation": 50, "confidence": 50}
    top_location = "未知"

    if day_analyses:
        scores = [a.get("discrepancy_score", 50) for a in day_analyses]
        avg_score = sum(scores) / len(scores)

        all_emotions = [a.get("emotion_dimensions", {}) for a in day_analyses if a.get("emotion_dimensions")]
        if all_emotions:
            for key in avg_emotions:
                vals = [e.get(key, 50) for e in all_emotions if key in e]
                if vals:
                    avg_emotions[key] = sum(vals) / len(vals)

        location_counts = {}
        for a in day_analyses:
            loc = a.get("location_keyword", "")
            if loc:
                location_counts[loc] = location_counts.get(loc, 0) + 1
        if location_counts:
            top_location = max(location_counts, key=location_counts.get)

    trend_data = get_trend_data(7)
    scores_list = [s for s in trend_data.get("scores", []) if s is not None]
    if len(scores_list) >= 3:
        recent = scores_list[-3:]
        earlier = scores_list[:-3]
        if earlier:
            avg_earlier = sum(earlier) / len(earlier)
            avg_recent = sum(recent) / len(recent)
            if avg_recent < avg_earlier - 5:
                trend_description = "近一周偏差值呈下降趋势，状态在稳步改善"
            elif avg_recent > avg_earlier + 5:
                trend_description = "近一周偏差值有所上升，需要多关注自己的状态"
            else:
                trend_description = "近一周状态相对平稳，整体波动不大"
        else:
            trend_description = "数据还在积累中，继续保持记录"
    else:
        trend_description = "数据还在积累中，继续保持记录"

    analysis_summaries = ""
    for i, a in enumerate(day_analyses[:5]):
        analysis_summaries += f"  记录{i+1}：偏差值{a.get('discrepancy_score', 0)}，{a.get('actual_self', '')[:80]}...\n"

    chat_summaries = ""
    user_msgs = [c for c in day_chats if c.get("role") == "user"]
    assistant_msgs = [c for c in day_chats if c.get("role") == "assistant"]
    if user_msgs:
        chat_summaries += f"  用户说：{user_msgs[-1].get('content', '')[:100]}\n"
    if assistant_msgs:
        chat_summaries += f"  镜灵回应：{assistant_msgs[-1].get('content', '')[:100]}\n"

    if not api_key or api_key == "your_deepseek_api_key_here":
        result = _generate_mock_daily_summary(
            target_date, analysis_count, chat_count, avg_score,
            avg_emotions, top_location, trend_description, day_analyses
        )
        save_daily_summary(user_id, target_date, result)
        return result

    try:
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.7,
            api_key=api_key,
            base_url=api_base
        )

        prompt = DAILY_SUMMARY_PROMPT.format(
            analysis_count=analysis_count,
            chat_count=chat_count,
            avg_score=avg_score,
            trend_description=trend_description,
            top_location=top_location,
            avg_energy=avg_emotions.get("energy", 50),
            avg_anxiety=avg_emotions.get("anxiety", 50),
            avg_happiness=avg_emotions.get("happiness", 50),
            avg_calmness=avg_emotions.get("calmness", 50),
            avg_motivation=avg_emotions.get("motivation", 50),
            avg_confidence=avg_emotions.get("confidence", 50),
            analysis_summaries=analysis_summaries or "  暂无分析记录",
            chat_summaries=chat_summaries or "  暂无对话记录",
        )

        response = llm.invoke([SystemMessage(content="你是镜灵，一位温暖睿智的AI心理成长伙伴。"),
                                HumanMessage(content=prompt)])
        response_text = response.content.strip()

        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]

        result = json.loads(response_text)

        summary_data = {
            "avg_discrepancy_score": round(avg_score, 1),
            "avg_emotion_dimensions": {k: round(v, 1) for k, v in avg_emotions.items()},
            "top_location_keyword": top_location,
            "summary_text": result.get("summary_text", ""),
            "mirror_insight": result.get("mirror_insight", ""),
            "suggestions": result.get("suggestions", []),
            "analysis_count": analysis_count,
            "chat_count": chat_count,
            "emotion_label": result.get("emotion_label", ""),
        }

        save_daily_summary(user_id, target_date, summary_data)
        return summary_data

    except Exception as e:
        print(f"Error in daily summary generation: {e}")
        result = _generate_mock_daily_summary(
            target_date, analysis_count, chat_count, avg_score,
            avg_emotions, top_location, trend_description, day_analyses
        )
        save_daily_summary(user_id, target_date, result)
        return result


def _generate_mock_daily_summary(date_str, analysis_count, chat_count, avg_score,
                                  avg_emotions, top_location, trend_description, analyses):
    if avg_score > 70:
        summary = f"今天的你，似乎承载着不小的重量。{analysis_count}次自我对话，{chat_count}次与镜灵的交流，每一次都是你在寻找出口的努力。偏差值{avg_score:.0f}分，说明理想与现实之间还有一段距离，但请相信——愿意直面差距本身，就是勇气的证明。夜深了，给自己一个拥抱吧，你已经做得很好了。"
        insight = "黑夜不是用来焦虑的，是用来好好休息的。"
        suggestions = [
            "今晚早点休息，睡眠是最好的治愈",
            "明天给自己安排一段独处时光，去喜欢的地方坐坐",
            "试着写下三件今天让你感到哪怕一点点温暖的事",
        ]
        label = "压力挑战日"
    elif avg_score < 40:
        summary = f"今天是闪闪发光的一天！偏差值只有{avg_score:.0f}分，说明你正走在与理想自己越来越近的路上。{analysis_count}次记录，{chat_count}次对话，每一次都是成长的脚印。保持这份轻盈和通透，你的状态真的很棒。继续做你喜欢的事，继续成为你想成为的人。"
        insight = "当你热爱生活时，生活也会爱上你。"
        suggestions = [
            "把今天的好心情分享给身边的人",
            "保持当前的节奏，不要急着给自己加码",
            "记录下今天最开心的瞬间，存进你的美好记忆库",
        ]
        label = "快乐充实日"
    else:
        summary = f"今天是平静而充实的一天。偏差值{avg_score:.0f}分，不高不低，像大多数平凡的日子一样，有收获也有期许。{analysis_count}次自我探索，{chat_count}次与镜灵的对话，你在以自己的节奏，慢慢靠近理想中的自己。这样就很好，不急不躁，稳稳地成长。"
        insight = "平凡的日子里，藏着最不平凡的成长。"
        suggestions = [
            "继续保持记录的习惯，量变会带来质变",
            "明天可以尝试一件小小的新鲜事",
            "给这周的自己写一句话的鼓励",
        ]
        label = "平静成长日"

    summary_data = {
        "avg_discrepancy_score": round(avg_score, 1),
        "avg_emotion_dimensions": {k: round(v, 1) for k, v in avg_emotions.items()},
        "top_location_keyword": top_location,
        "summary_text": summary,
        "mirror_insight": insight,
        "suggestions": suggestions,
        "analysis_count": analysis_count,
        "chat_count": chat_count,
        "emotion_label": label,
    }

    return summary_data


async def generate_morning_greeting(user_id: str = "default_user"):
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")
    model_name = os.getenv("MODEL_NAME", "deepseek-chat")

    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    trend_data = get_trend_data(7)
    scores_list = [s for s in trend_data.get("scores", []) if s is not None]
    avg_week = sum(scores_list) / len(scores_list) if scores_list else 50

    from core.history_store import get_daily_summary_by_date
    yesterday_summary = get_daily_summary_by_date(user_id, yesterday)

    if not api_key or api_key == "your_deepseek_api_key_here":
        if avg_week > 60:
            return {
                "title": "新的一天，新的开始",
                "content": f"早上好呀。过去一周你的平均偏差值是{avg_week:.0f}分，说明你一直在认真地生活和思考。今天，试着对自己温柔一点吧。镜子里的你，已经很棒了。☀️",
                "insight": "每一个清晨，都是重新认识自己的机会。",
            }
        else:
            return {
                "title": "愿你今天也闪闪发光",
                "content": f"早上好！最近你的状态很不错，平均偏差值{avg_week:.0f}分，说明你正走在越来越通透的路上。保持这份轻盈，今天也要开心哦。✨",
                "insight": "好的状态，是给自己最好的礼物。",
            }

    try:
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.8,
            api_key=api_key,
            base_url=api_base
        )

        yesterday_text = yesterday_summary.get("summary_text", "") if yesterday_summary else "暂无昨日数据"
        prompt = f"""
你是"镜灵"——一位温暖睿智的AI心理成长伙伴。

请生成一段晨间问候，基于以下信息：
- 过去一周平均偏差值：{avg_week:.1f}/100
- 昨日总结：{yesterday_text[:200]}

输出 JSON 格式：
{{
  "title": "问候标题（温暖诗意，10-15字）",
  "content": "问候正文（100-150字），像知心朋友的早安，有温度，有鼓励，有对新一天的期许",
  "insight": "一句镜中洞察金句（20-30字）"
}}
"""

        response = llm.invoke([HumanMessage(content=prompt)])
        response_text = response.content.strip()

        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]

        return json.loads(response_text)

    except Exception as e:
        print(f"Error in morning greeting: {e}")
        return {
            "title": "新的一天，新的开始",
            "content": f"早上好呀。新的一天开始了，无论昨天如何，今天都是全新的一页。愿你今天也能遇见更好的自己。☀️",
            "insight": "每一个清晨，都是重新认识自己的机会。",
        }
