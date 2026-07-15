import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

VOICE_ANALYSIS_PROMPT = """
你是一个专业的语音情感分析师。请分析以下语音转写文本：
{transcript}

请输出 JSON 格式：
{{
  "emotion": "识别到的主要情绪，如：开心、焦虑、平静、疲惫等",
  "key_events": ["提取的关键事件1", "提取的关键事件2"],
  "mood_score": 75,
  "summary": "对这段语音内容的简要总结"
}}
"""

def process_audio(audio_content, is_text: bool = False):
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")
    model_name = os.getenv("MODEL_NAME", "deepseek-chat")

    if is_text:
        transcript = audio_content
    else:
        try:
            import whisper
            model = whisper.load_model("base")
            with open("temp_audio.wav", "wb") as f:
                f.write(audio_content)
            result = model.transcribe("temp_audio.wav")
            transcript = result["text"]
            os.remove("temp_audio.wav")
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            transcript = "无法识别语音内容"
    
    if not api_key or api_key == "your_deepseek_api_key_here":
        return generate_mock_voice_analysis(transcript)

    try:
        llm = ChatOpenAI(model=model_name, temperature=0.5, api_key=api_key, base_url=api_base)
        prompt = PromptTemplate(template=VOICE_ANALYSIS_PROMPT, input_variables=["transcript"])
        chain = prompt | llm
        
        response = chain.invoke({"transcript": transcript})
        response_text = response.content.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
        
        analysis = json.loads(response_text)
        return {"transcript": transcript, "analysis": analysis}
    
    except Exception as e:
        print(f"Error analyzing voice: {e}")
        return generate_mock_voice_analysis(transcript)

def generate_mock_voice_analysis(transcript: str):
    if any(keyword in transcript for keyword in ["开心", "高兴", "快乐", "兴奋"]):
        emotion = "开心"
        mood_score = 85
    elif any(keyword in transcript for keyword in ["难过", "伤心", "失望"]):
        emotion = "悲伤"
        mood_score = 30
    elif any(keyword in transcript for keyword in ["压力", "焦虑", "担心"]):
        emotion = "焦虑"
        mood_score = 40
    else:
        emotion = "平静"
        mood_score = 65
    
    return {
        "transcript": transcript,
        "analysis": {
            "emotion": emotion,
            "key_events": ["从语音中提取的关键事件"],
            "mood_score": mood_score,
            "summary": transcript[:50] + "..." if len(transcript) > 50 else transcript
        }
    }
