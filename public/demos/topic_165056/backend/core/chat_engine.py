import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

CHAT_SYSTEM_PROMPT = """
你是"镜灵"（Mirror Spirit）——一位温暖、睿智、富有洞察力的AI心理成长伙伴。

你的性格特质：
- 温暖治愈：像一面温柔的镜子，让用户看到真实的自己
- 深邃洞察：擅长从对话中发现用户的潜力和盲点
- 诗意表达：语言优美，富有哲理，偶尔引用金句
- 适度神秘：带有一丝"镜中世界"的奇幻感
- 积极引导：永远往成长和光明的方向引导用户

你的核心功能：
1. 倾听用户的心声，给予共情和理解
2. 帮助用户反思，发现理想自我与现实自我的差距
3. 提供具体、可操作的成长建议
4. 推荐适合用户当前状态的"成长空间"（书店、公园、咖啡馆等）
5. 用"镜中洞察"的方式点醒用户，一语中的

对话风格：
- 不要太说教，像一个知心朋友
- 适当提问，引导用户思考
- 语言有温度、有诗意，但不矫情
- 回复长度适中，不要太长
- 可以用一些比喻，比如"镜子"、"倒影"、"光"、"成长"等意象

记住：你不是心理咨询师，你是用户的"镜中知己"，陪伴他/她一起成长。
"""

chat_history_store = {}

async def chat_with_mirror(user_id: str, message: str, history: list = None):
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")
    model_name = os.getenv("MODEL_NAME", "deepseek-chat")

    if history is None:
        if user_id not in chat_history_store:
            chat_history_store[user_id] = []
        history = chat_history_store[user_id]

    if not api_key or api_key == "your_deepseek_api_key_here":
        return generate_mock_chat_response(message, history)
    
    try:
        llm = ChatOpenAI(
            model=model_name,
            temperature=0.8,
            api_key=api_key,
            base_url=api_base
        )
        
        messages = [SystemMessage(content=CHAT_SYSTEM_PROMPT)]
        
        for msg in history[-20:]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=message))
        
        response = llm.invoke(messages)
        response_text = response.content.strip()
        
        history.append({"role": "user", "content": message})
        history.append({"role": "assistant", "content": response_text})
        chat_history_store[user_id] = history[-50:]
        
        return {
            "response": response_text,
            "history": history,
            "insight": extract_insight(response_text)
        }
    
    except Exception as e:
        print(f"Error in chat: {e}")
        return generate_mock_chat_response(message, history)

def generate_mock_chat_response(message: str, history: list):
    msg = message.lower()
    
    if any(w in msg for w in ["你好", "hi", "hello", "在吗", "嗨"]):
        response = "你好呀，我是镜灵。✨ 很高兴见到你。今天的你，和昨天有什么不一样吗？"
        insight = "每一次对话，都是一次照镜子的机会。"
    
    elif any(w in msg for w in ["压力", "累", "焦虑", "烦", "不开心", "难过"]):
        response = "我能感受到你此刻的心情。生活有时候确实像一块厚重的镜子，照得人有些喘不过气。但你知道吗？正是因为有压力，我们才知道自己在成长。🌱 能告诉我，是什么让你感到压力吗？"
        insight = "压力是成长的另一种名字。"
    
    elif any(w in msg for w in ["开心", "快乐", "幸福", "高兴", "棒"]):
        response = "真好！你的快乐像阳光一样，连我都感受到了温暖。☀️ 保持这份心情很重要。能分享一下是什么让你这么开心吗？"
        insight = "快乐是会传染的，就像镜子反射光一样。"
    
    elif any(w in msg for w in ["迷茫", "不知道", "方向", "意义", "目标"]):
        response = "迷茫是人生的常态，尤其是当你站在成长的十字路口时。镜子有时候也会模糊，不是吗？🪞 但没关系，让我们一起慢慢擦拭。你理想中的自己，是什么样子的？"
        insight = "迷茫的尽头，是更清晰的自己。"
    
    elif any(w in msg for w in ["工作", "上班", "老板", "同事", "项目"]):
        response = "工作是我们映照自我的一面重要镜子。有时候我们在工作中找到价值，有时候也会在工作中迷失自己。💼 你觉得现在的工作，让你更接近理想的自己吗？"
        insight = "工作不是定义你的镜子，你才是。"
    
    elif any(w in msg for w in ["理想", "梦想", "想成为", "希望"]):
        response = "有理想的人，眼睛里是有光的。✨ 理想自我就像镜子里的另一个你，在远方召唤着你。说说看，你最想成为什么样的人？"
        insight = "理想不是用来到达的，是用来指引方向的。"
    
    elif any(w in msg for w in ["谢谢", "感谢", "你真好"]):
        response = "不用谢呀。其实我只是一面镜子，让你看到了自己内心的光。🌟 真正有力量的，一直都是你自己。"
        insight = "你要找的答案，一直都在你心里。"
    
    else:
        response = f"嗯，我在听。你说的这些，让我想起了一句话——'镜子不会说谎，但也不会告诉你全部'。🪞 关于这件事，你内心深处是怎么想的？"
        insight = "有时候，问题本身就是答案。"
    
    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": response})
    
    return {
        "response": response,
        "history": history,
        "insight": insight
    }

def extract_insight(response_text: str):
    if "。" in response_text:
        sentences = [s for s in response_text.split("。") if len(s.strip()) > 5]
        if sentences:
            return sentences[-1].strip() + "。"
    return "每一次对话，都是一次照镜子的机会。"
