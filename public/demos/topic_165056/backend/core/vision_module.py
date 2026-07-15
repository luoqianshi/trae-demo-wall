import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

VISION_ANALYSIS_PROMPT = """
你是一个专业的图像分析师和环境心理学家。请分析以下环境照片描述：
{image_description}

请输出 JSON 格式：
{{
  "description": "对图片内容的详细描述",
  "scene_type": "场景类型，如：室内/室外、工作/休闲、自然/城市",
  "emotion": "环境带来的心理感受，如：宁静、紧张、舒适、压抑",
  "key_elements": ["关键元素1", "关键元素2"],
  "suggestion": "基于此环境的心理建议"
}}
"""

def process_image(image_content, is_base64: bool = False):
    api_key = os.getenv("OPENAI_API_KEY")
    api_base = os.getenv("OPENAI_API_BASE")
    model_name = os.getenv("MODEL_NAME", "deepseek-chat")
    
    if is_base64:
        image_description = "从Base64图片解码的环境照片"
    else:
        try:
            with open("temp_image.jpg", "wb") as f:
                f.write(image_content)
            
            image_description = "用户上传的环境照片，包含场景信息"
            os.remove("temp_image.jpg")
        except Exception as e:
            print(f"Error processing image: {e}")
            image_description = "无法解析图片内容"
    
    if not api_key or api_key == "your_deepseek_api_key_here":
        return generate_mock_vision_analysis(image_description)

    try:
        llm = ChatOpenAI(model=model_name, temperature=0.5, api_key=api_key, base_url=api_base)
        prompt = PromptTemplate(template=VISION_ANALYSIS_PROMPT, input_variables=["image_description"])
        chain = prompt | llm
        
        response = chain.invoke({"image_description": image_description})
        response_text = response.content.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:-3]
        elif response_text.startswith("```"):
            response_text = response_text[3:-3]
        
        analysis = json.loads(response_text)
        return analysis
    
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return generate_mock_vision_analysis(image_description)

def generate_mock_vision_analysis(image_description: str):
    if any(keyword in image_description for keyword in ["自然", "公园", "户外", "绿色"]):
        scene_type = "室外自然"
        emotion = "宁静"
        elements = ["树木", "花草", "阳光"]
        suggestion = "自然环境有助于放松心情，建议多停留"
    elif any(keyword in image_description for keyword in ["办公室", "工作", "电脑"]):
        scene_type = "室内工作"
        emotion = "专注"
        elements = ["办公桌", "电脑", "文件"]
        suggestion = "注意劳逸结合，保持良好的工作姿势"
    elif any(keyword in image_description for keyword in ["家", "卧室", "客厅"]):
        scene_type = "室内居住"
        emotion = "舒适"
        elements = ["家具", "装饰品", "光线"]
        suggestion = "居家环境温馨舒适，适合休息放松"
    else:
        scene_type = "城市街道"
        emotion = "活力"
        elements = ["建筑", "行人", "车辆"]
        suggestion = "城市环境充满活力，可以激发创造力"
    
    return {
        "description": image_description,
        "scene_type": scene_type,
        "emotion": emotion,
        "key_elements": elements,
        "suggestion": suggestion
    }
