# -*- coding: utf-8 -*-
"""
味忆 FlavorMemo - 基于多模态 AI 的家乡菜还原平台
Flask 后端服务：接收图片，调用 Ollama AI 进行菜品识别和菜谱生成
"""

import io
import json
import base64
import traceback
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# ===== 创建 Flask 应用 =====
app = Flask(__name__)
# 启用 CORS，允许前端跨域访问
CORS(app)

# ===== 配置 =====
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MULTIMODAL_MODEL = "llava"       # 多模态模型（推荐）
OLLAMA_TEXT_MODEL = "qwen2.5"            # 文本模型（备用）
OLLAMA_TIMEOUT = 120                      # Ollama 请求超时时间（秒）

# ===== 内置兜底菜谱数据 =====
FALLBACK_RECIPES = [
    {
        "dish_name": "红烧肉",
        "cuisine": "浙菜 / 家常菜",
        "cooking_time": "90 分钟",
        "difficulty": "中等",
        "servings": "3-4 人份",
        "description": "红烧肉是中国最经典的家常菜之一，选用优质五花肉，经焯水、炒糖色、慢炖而成。成品色泽红亮诱人，肥而不腻、入口即化，酱香浓郁，甜中带咸，是一道承载着无数家庭温暖记忆的传统佳肴。",
        "ingredients": ["五花肉 500g", "冰糖 30g", "生抽 2勺", "老抽 1勺", "料酒 2勺", "八角 2个", "桂皮 1小块", "香叶 3片", "葱段 适量", "姜片 5片", "盐 适量"],
        "steps": [
            "将五花肉洗净，切成约 3cm 见方的块状。冷水下锅，加入料酒和姜片，大火烧开后撇去浮沫，焯水 3-5 分钟后捞出沥干备用。",
            "锅中不放油，放入冰糖，小火慢慢加热，用铲子不断搅动，直到冰糖融化并变成琥珀色的糖色（注意不要炒糊）。",
            "将焯好的五花肉块倒入锅中，快速翻炒，使每块肉都均匀裹上糖色，呈现漂亮的酱红色。",
            "加入葱段、姜片、八角、桂皮、香叶，翻炒出香味。",
            "倒入生抽、老抽和料酒，翻炒均匀后加入适量开水（水量没过肉块即可），大火烧开。",
            "转小火，盖上锅盖慢炖 60-70 分钟，期间偶尔翻动以防粘锅。",
            "炖至肉酥烂后，开大火收汁，不断翻动肉块使汤汁浓稠均匀地裹在肉上，最后根据口味调入适量盐即可出锅。"
        ],
        "tips": [
            "选择五花肉时，选择肥瘦相间、层次分明的部位，这样炖出的红烧肉口感最佳。",
            "炒糖色时一定要用小火，冰糖比白糖更容易控制颜色，成品颜色更红亮。",
            "焯水是关键步骤，可以去除血水和腥味，使成品更加干净清爽。",
            "炖煮时间要足够长，小火慢炖才能让肉质变得酥烂入味。"
        ]
    },
    {
        "dish_name": "宫保鸡丁",
        "cuisine": "川菜",
        "cooking_time": "30 分钟",
        "difficulty": "简单",
        "servings": "2-3 人份",
        "description": "宫保鸡丁是川菜中的经典名菜，以鸡胸肉为主料，搭配花生米和干辣椒，口感鲜嫩滑爽，味道麻辣鲜香，甜酸适口。这道菜因其独特的荔枝味型而享誉世界。",
        "ingredients": ["鸡胸肉 300g", "花生米 50g", "干辣椒 8-10个", "花椒 1小勺", "葱段 适量", "蒜末 3瓣", "姜末 适量", "生抽 2勺", "醋 1勺", "糖 1勺", "淀粉 1勺", "料酒 1勺", "盐 适量"],
        "steps": [
            "鸡胸肉切成约 1.5cm 的丁，加入料酒、生抽和淀粉抓匀，腌制 15 分钟。",
            "将花生米用小火炒至金黄酥脆，盛出备用（或使用现成油炸花生米）。",
            "调制宫保汁：将生抽、醋、糖、淀粉和少许水混合搅拌均匀。",
            "锅中放油烧热，放入花椒和干辣椒段小火煸出香味（辣椒变深红色即可）。",
            "大火放入腌好的鸡丁快速翻炒至变白断生。",
            "加入葱段、姜末、蒜末翻炒出香味。",
            "倒入调好的宫保汁，快速翻炒使酱汁均匀包裹鸡丁。",
            "最后加入炒好的花生米，快速翻拌几下即可出锅（花生米不要炒太久，保持酥脆）。"
        ],
        "tips": [
            "鸡丁腌制时加淀粉可以锁住水分，使肉质更加滑嫩。",
            "干辣椒和花椒要小火慢煸，大火容易炒糊发苦。",
            "宫保汁的关键是酸甜比例，醋和糖的用量可以根据个人口味调整。",
            "花生米最后放入，避免长时间加热变软。"
        ]
    }
]


# ===== 辅助函数 =====

def image_to_base64(image_file):
    """将上传的图片文件转换为 base64 编码字符串"""
    img_bytes = image_file.read()
    image_file.seek(0)  # 重置文件指针
    return base64.b64encode(img_bytes).decode('utf-8')


def call_ollama_multimodal(image_b64, description=""):
    """
    使用 Ollama LLaVA 多模态模型识别图片中的菜品
    返回解析后的菜谱字典
    """
    # 构造 Prompt
    prompt = """请仔细观察这张图片中的菜品，识别出这是什么菜，然后生成一份完整的菜谱。

请严格按照以下 JSON 格式返回（不要包含其他文字，只返回纯 JSON）：
{
    "dish_name": "菜品名称",
    "cuisine": "所属菜系（如川菜、粤菜、浙菜、家常菜等）",
    "cooking_time": "烹饪时间（如 30 分钟）",
    "difficulty": "难度等级（入门/简单/中等/较难）",
    "servings": "适合份量（如 2-3 人份）",
    "description": "菜品简介（50-100字，描述菜品特色和文化背景）",
    "ingredients": ["食材1 用量", "食材2 用量", ...],
    "steps": ["步骤1", "步骤2", ...],
    "tips": ["贴士1", "贴士2", ...]
}"""

    if description:
        prompt += f"\n\n用户补充描述：{description}"

    payload = {
        "model": OLLAMA_MULTIMODAL_MODEL,
        "prompt": prompt,
        "images": [image_b64],
        "stream": False,
        "format": "json"
    }

    print("[Ollama] 正在调用 LLaVA 多模态模型进行菜品识别...")
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json=payload,
        timeout=OLLAMA_TIMEOUT
    )
    response.raise_for_status()
    result = response.json()

    # 提取生成的文本
    generated_text = result.get("response", "")
    print(f"[Ollama] LLaVA 返回文本长度: {len(generated_text)} 字符")

    # 解析 JSON
    return parse_recipe_json(generated_text, "LLaVA 多模态模型")


def call_ollama_text(description):
    """
    使用 Ollama Qwen2.5 文本模型根据文字描述生成菜谱
    返回解析后的菜谱字典
    """
    prompt = f"""请根据以下描述，推测这可能是什么菜品，并生成一份完整的菜谱。

用户描述：{description}

请严格按照以下 JSON 格式返回（不要包含其他文字，只返回纯 JSON）：
{{
    "dish_name": "菜品名称",
    "cuisine": "所属菜系（如川菜、粤菜、浙菜、家常菜等）",
    "cooking_time": "烹饪时间（如 30 分钟）",
    "difficulty": "难度等级（入门/简单/中等/较难）",
    "servings": "适合份量（如 2-3 人份）",
    "description": "菜品简介（50-100字，描述菜品特色和文化背景）",
    "ingredients": ["食材1 用量", "食材2 用量", ...],
    "steps": ["步骤1", "步骤2", ...],
    "tips": ["贴士1", "贴士2", ...]
}}"""

    payload = {
        "model": OLLAMA_TEXT_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }

    print(f"[Ollama] 正在调用 Qwen2.5 文本模型根据描述生成菜谱...")
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json=payload,
        timeout=OLLAMA_TIMEOUT
    )
    response.raise_for_status()
    result = response.json()

    generated_text = result.get("response", "")
    print(f"[Ollama] Qwen2.5 返回文本长度: {len(generated_text)} 字符")

    return parse_recipe_json(generated_text, "Qwen2.5 文本模型")


def parse_recipe_json(text, source_name):
    """
    尝试从 AI 返回的文本中解析 JSON 菜谱数据
    支持从 markdown 代码块中提取 JSON
    """
    # 尝试直接解析
    try:
        recipe = json.loads(text)
        return validate_and_fix_recipe(recipe, source_name)
    except json.JSONDecodeError:
        pass

    # 尝试从 markdown 代码块中提取 JSON
    import re
    json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?\s*```', text, re.DOTALL)
    if json_match:
        try:
            recipe = json.loads(json_match.group(1).strip())
            return validate_and_fix_recipe(recipe, source_name)
        except json.JSONDecodeError:
            pass

    # 尝试查找第一个 { 和最后一个 } 之间的内容
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        try:
            recipe = json.loads(text[start_idx:end_idx + 1])
            return validate_and_fix_recipe(recipe, source_name)
        except json.JSONDecodeError:
            pass

    print(f"[警告] {source_name} 返回的内容无法解析为 JSON")
    return None


def validate_and_fix_recipe(recipe, source_name):
    """验证菜谱数据的完整性，填充缺失字段"""
    # 确保必要字段存在
    required_fields = {
        "dish_name": "未知菜品",
        "cuisine": "未知菜系",
        "cooking_time": "未知",
        "difficulty": "未知",
        "servings": "未知",
        "description": "",
        "ingredients": [],
        "steps": [],
        "tips": []
    }

    for key, default in required_fields.items():
        if key not in recipe or recipe[key] is None:
            recipe[key] = default

    # 确保列表类型字段是列表
    for list_key in ["ingredients", "steps", "tips"]:
        if not isinstance(recipe[list_key], list):
            recipe[list_key] = [str(recipe[list_key])] if recipe[list_key] else []

    print(f"[成功] {source_name} 成功解析菜谱: {recipe['dish_name']}")
    return recipe


def get_fallback_recipe():
    """获取内置兜底菜谱"""
    import random
    recipe = random.choice(FALLBACK_RECIPES).copy()
    recipe["description"] = recipe.get("description", "") + "（注：此为内置演示菜谱数据）"
    return recipe


# ===== API 路由 =====

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    # 检查 Ollama 是否可用
    ollama_available = False
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        if resp.status_code == 200:
            ollama_available = True
    except Exception:
        pass

    return jsonify({
        "status": "ok",
        "service": "味忆 FlavorMemo API",
        "ollama_available": ollama_available,
        "version": "1.0.0"
    })


@app.route('/api/analyze', methods=['POST'])
def analyze_dish():
    """
    核心接口：接收图片和描述，返回菜品识别结果和菜谱
    
    请求格式：FormData
      - image: 图片文件（必需）
      - description: 文字描述（可选）
    
    返回格式：JSON
      - success: 是否成功
      - source: 数据来源（ollama_multimodal / ollama_text / fallback）
      - data: 菜谱数据
    """
    try:
        # ===== 1. 获取请求数据 =====
        image_file = request.files.get('image')
        description = request.form.get('description', '').strip()

        if not image_file:
            return jsonify({
                "success": False,
                "error": "请上传图片文件"
            }), 400

        # ===== 2. 尝试使用 LLaVA 多模态模型 =====
        try:
            image_b64 = image_to_base64(image_file)
            recipe = call_ollama_multimodal(image_b64, description)
            if recipe:
                return jsonify({
                    "success": True,
                    "source": "ollama_multimodal",
                    "data": recipe
                })
        except requests.exceptions.ConnectionError:
            print("[警告] Ollama 服务不可用，尝试备用方案...")
        except requests.exceptions.Timeout:
            print("[警告] Ollama 请求超时，尝试备用方案...")
        except Exception as e:
            print(f"[警告] LLaVA 多模态模型调用失败: {e}")
            traceback.print_exc()

        # ===== 3. 尝试使用 Qwen2.5 文本模型（需要文字描述） =====
        if description:
            try:
                recipe = call_ollama_text(description)
                if recipe:
                    return jsonify({
                        "success": True,
                        "source": "ollama_text",
                        "data": recipe
                    })
            except requests.exceptions.ConnectionError:
                print("[警告] Ollama 服务不可用，使用兜底方案...")
            except requests.exceptions.Timeout:
                print("[警告] Ollama 请求超时，使用兜底方案...")
            except Exception as e:
                print(f"[警告] Qwen2.5 文本模型调用失败: {e}")
                traceback.print_exc()

        # ===== 4. 最终兜底：返回内置菜谱 =====
        print("[提示] 使用内置兜底菜谱数据")
        recipe = get_fallback_recipe()
        return jsonify({
            "success": True,
            "source": "fallback",
            "data": recipe
        })

    except Exception as e:
        print(f"[错误] 分析过程中出现异常: {e}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"服务器内部错误: {str(e)}"
        }), 500


# ===== 启动服务 =====
if __name__ == '__main__':
    print("=" * 50)
    print("  味忆 FlavorMemo - AI 菜品识别服务")
    print("  访问地址: http://localhost:5000")
    print("  健康检查: http://localhost:5000/api/health")
    print("  分析接口: http://localhost:5000/api/analyze")
    print("=" * 50)

    # 检查 Ollama 是否可用
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            model_names = [m.get("name", "") for m in models]
            print(f"\n[Ollama] 已连接，可用模型: {', '.join(model_names) if model_names else '无'}")

            if any("llava" in name for name in model_names):
                print("[Ollama] LLaVA 多模态模型已就绪")
            else:
                print("[Ollama] 未检测到 LLaVA 模型，请运行: ollama pull llava")

            if any("qwen" in name for name in model_names):
                print("[Ollama] Qwen 文本模型已就绪")
            else:
                print("[Ollama] 未检测到 Qwen 模型，请运行: ollama pull qwen2.5")
        else:
            print("\n[Ollama] 无法连接 Ollama 服务，将使用内置兜底菜谱数据")
            print("[Ollama] 请确保 Ollama 已启动: https://ollama.com")
    except Exception:
        print("\n[Ollama] 无法连接 Ollama 服务，将使用内置兜底菜谱数据")
        print("[Ollama] 请确保 Ollama 已启动: https://ollama.com")

    print("\n[启动] Flask 服务运行中...\n")

    # 启动 Flask 服务
    app.run(host='0.0.0.0', port=5000, debug=True)
