"""
植物愈诊室 Demo - 后端诊断服务
基于 OpenCV HSV 色彩分析的植物健康状态诊断引擎
"""

import io
import json
import random
from typing import Tuple, List, Dict, Any

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import cv2
import uvicorn

app = FastAPI(title="植物愈诊室 Demo")

# ---- Color Constants (HSV) ----
# Green ranges for healthy vegetation
GREEN_LOW = np.array([25, 40, 30])
GREEN_HIGH = np.array([90, 255, 255])

# Yellow ranges (chlorosis / yellowing)
YELLOW_LOW = np.array([18, 40, 40])
YELLOW_HIGH = np.array([35, 255, 255])

# Brown ranges (necrosis / brown tips)
BROWN_LOW = np.array([5, 30, 20])
BROWN_HIGH = np.array([25, 180, 180])

# White/gray ranges (powdery mildew)
WHITE_LOW = np.array([0, 0, 180])
WHITE_HIGH = np.array([180, 50, 255])

# Dark/black ranges (severe necrosis, sooty mold)
DARK_LOW = np.array([0, 0, 0])
DARK_HIGH = np.array([180, 255, 60])


def analyze_image(img: Image.Image) -> Dict[str, Any]:
    """
    Core analysis engine: extract color distribution metrics from plant image.
    Returns pixel ratios for green, yellow, brown, white, and dark regions.
    """
    # Convert to numpy array (RGB)
    rgb = np.array(img)
    h, w = rgb.shape[:2]
    total_pixels = h * w

    # Convert to HSV for color analysis
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)

    # Create mask for "plant-like" regions (exclude pure white background, etc.)
    # A pixel is "plant content" if it has any saturation (not pure white/gray/black)
    sat_mask = hsv[:, :, 1] > 15
    val_mask = (hsv[:, :, 2] > 30) & (hsv[:, :, 2] < 245)
    plant_mask = sat_mask & val_mask
    plant_pixels = np.sum(plant_mask)

    if plant_pixels < total_pixels * 0.02:
        # Very few plant pixels detected — image might not contain a plant
        return {
            "green_ratio": 0.3,
            "yellow_ratio": 0.05,
            "brown_ratio": 0.02,
            "white_ratio": 0.01,
            "dark_ratio": 0.02,
            "plant_ratio": 0.0,
            "total_pixels": total_pixels,
            "plant_pixels": 0,
        }

    # Compute color ratios within plant region only
    def color_ratio(low, high):
        mask = cv2.inRange(hsv, low, high) & plant_mask
        return float(np.sum(mask > 0)) / plant_pixels

    return {
        "green_ratio": color_ratio(GREEN_LOW, GREEN_HIGH),
        "yellow_ratio": color_ratio(YELLOW_LOW, YELLOW_HIGH),
        "brown_ratio": color_ratio(BROWN_LOW, BROWN_HIGH),
        "white_ratio": color_ratio(WHITE_LOW, WHITE_HIGH),
        "dark_ratio": color_ratio(DARK_LOW, DARK_HIGH),
        "plant_ratio": float(plant_pixels) / total_pixels,
        "total_pixels": total_pixels,
        "plant_pixels": plant_pixels,
    }


def detect_anomaly_regions(img: Image.Image, ratios: Dict) -> List[Dict]:
    """
    Detect spatial locations of anomalies for heatmap overlay.
    Returns list of bounding boxes in normalized coordinates (0-1).
    """
    rgb = np.array(img)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, w = rgb.shape[:2]

    # Plant mask
    sat_mask = hsv[:, :, 1] > 15
    val_mask = (hsv[:, :, 2] > 30) & (hsv[:, :, 2] < 245)
    plant_mask = sat_mask & val_mask

    anomalies = []

    # Find yellow regions
    if ratios["yellow_ratio"] > 0.08:
        yellow_mask = cv2.inRange(hsv, YELLOW_LOW, YELLOW_HIGH) & plant_mask
        boxes = _extract_boxes(yellow_mask, h, w, min_area_ratio=0.003)
        for box in boxes[:3]:  # Limit to top 3 regions
            anomalies.append({
                "x": box[0], "y": box[1], "w": box[2], "h": box[3],
                "color": "rgb(236, 179, 18)", "label": "叶片黄化"
            })

    # Find brown regions
    if ratios["brown_ratio"] > 0.05:
        brown_mask = cv2.inRange(hsv, BROWN_LOW, BROWN_HIGH) & plant_mask
        boxes = _extract_boxes(brown_mask, h, w, min_area_ratio=0.002)
        for box in boxes[:3]:
            anomalies.append({
                "x": box[0], "y": box[1], "w": box[2], "h": box[3],
                "color": "rgb(180, 83, 9)", "label": "枯褐斑点"
            })

    # Find white/gray patches (mildew)
    if ratios["white_ratio"] > 0.03:
        white_mask = cv2.inRange(hsv, WHITE_LOW, WHITE_HIGH) & plant_mask
        boxes = _extract_boxes(white_mask, h, w, min_area_ratio=0.002)
        for box in boxes[:2]:
            anomalies.append({
                "x": box[0], "y": box[1], "w": box[2], "h": box[3],
                "color": "rgb(168, 162, 158)", "label": "疑似霉层"
            })

    # Find dark spots
    if ratios["dark_ratio"] > 0.05:
        dark_mask = cv2.inRange(hsv, DARK_LOW, DARK_HIGH) & plant_mask
        boxes = _extract_boxes(dark_mask, h, w, min_area_ratio=0.002)
        for box in boxes[:2]:
            anomalies.append({
                "x": box[0], "y": box[1], "w": box[2], "h": box[3],
                "color": "rgb(120, 53, 15)", "label": "深色病斑"
            })

    return anomalies


def _extract_boxes(mask, h, w, min_area_ratio=0.003):
    """Extract bounding boxes from binary mask, return normalized coords."""
    total = h * w
    min_area = int(total * min_area_ratio)

    # Dilate to merge nearby regions
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    dilated = cv2.dilate(mask.astype(np.uint8), kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    boxes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        x, y, bw, bh = cv2.boundingRect(cnt)
        # Expand box slightly for visibility
        pad_x = max(bw * 0.1, 5)
        pad_y = max(bh * 0.1, 5)
        nx = max(0, (x - pad_x) / w)
        ny = max(0, (y - pad_y) / h)
        nw = min(1 - nx, (bw + 2 * pad_x) / w)
        nh = min(1 - ny, (bh + 2 * pad_y) / h)
        boxes.append((nx, ny, nw, nh))

    # Sort by area (largest first)
    boxes.sort(key=lambda b: b[2] * b[3], reverse=True)
    return boxes


def generate_diagnosis(ratios: Dict, anomalies: List[Dict]) -> Dict[str, Any]:
    """
    Generate human-readable diagnosis from color analysis results.
    Returns structured diagnosis with status, findings, metrics, and advice.
    """
    green = ratios["green_ratio"]
    yellow = ratios["yellow_ratio"]
    brown = ratios["brown_ratio"]
    white = ratios["white_ratio"]
    dark = ratios["dark_ratio"]

    # Compute a composite "unhealth score" (0=healthy, 100=very sick)
    unhealth = 0
    unhealth += min(yellow * 200, 40)   # Yellowing up to 40 points
    unhealth += min(brown * 300, 35)     # Brown spots up to 35 points
    unhealth += min(white * 400, 15)     # White/mildew up to 15 points
    unhealth += min(dark * 250, 10)      # Dark spots up to 10 points

    health_score = max(0, min(100, round(100 - unhealth)))

    # Status determination
    findings = []
    advice_parts = []

    if health_score >= 80:
        status_class = "healthy"
        status_icon = "✅"
        status_label = "状态良好"
        status_desc = f"综合健康评分 {health_score}/100，植物整体状态不错"

        if green > 0.5:
            findings.append({
                "title": "叶色翠绿",
                "desc": "绿色健康叶片占比高，植物光合作用状态良好",
                "color": "green"
            })
        else:
            findings.append({
                "title": "叶色基本正常",
                "desc": "整体叶色未见明显异常",
                "color": "green"
            })

        if yellow > 0.05:
            findings.append({
                "title": "轻微黄化迹象",
                "desc": f"检测到约 {yellow*100:.0f}% 的叶片区域偏黄，属于正常的老叶代谢",
                "color": "orange"
            })

        advice_parts.append("当前养护状态良好，继续保持即可。")

    elif health_score >= 50:
        status_class = "sub-health"
        status_icon = "⚠️"
        status_label = "亚健康状态"
        status_desc = f"综合健康评分 {health_score}/100，植物出现了一些需要关注的问题"

        if yellow > 0.1:
            findings.append({
                "title": f"叶片黄化（约 {yellow*100:.0f}%）",
                "desc": "较多叶片区域偏黄，可能是浇水过多、光照不足或营养缺乏",
                "color": "orange"
            })
            advice_parts.append("黄化可能与浇水过多有关——检查土壤是否积水，减少浇水频率，等表层土壤干燥 2-3cm 后再浇。")
            advice_parts.append("如果黄化集中在新叶，可能是缺铁；如果是老叶先黄，可能是缺氮。")

        if brown > 0.05:
            findings.append({
                "title": f"叶缘焦枯（约 {brown*100:.0f}%）",
                "desc": "检测到褐色区域，常见于空气干燥、施肥过量或根系受损",
                "color": "orange"
            })
            advice_parts.append("叶缘焦枯通常与空气湿度过低或盐分积累有关——可以尝试用清水冲洗土壤表面，增加喷雾增湿。")

        if white > 0.03:
            findings.append({
                "title": "疑似白色霉层",
                "desc": "叶片表面检测到白色覆盖物，可能是白粉病或灰尘沉积",
                "color": "orange"
            })
            advice_parts.append("如果白色粉末状物质可被擦除后重新出现，可能是白粉病——需隔离植物，增加通风，可用稀释的小苏打水喷洒。")

    else:
        status_class = "unhealthy"
        status_icon = "🔴"
        status_label = "需要立即关注"
        status_desc = f"综合健康评分仅 {health_score}/100，植物出现了较严重的健康问题"

        if yellow > 0.15:
            findings.append({
                "title": f"严重黄化（约 {yellow*100:.0f}%）",
                "desc": "大面积叶片发黄，植物整体光合能力严重下降",
                "color": "red"
            })
            advice_parts.append("严重黄化说明问题已经持续了一段时间。最优先检查：根系是否腐烂（轻轻拔出查看根部颜色，健康为白色，腐烂为褐色发软）。")

        if brown > 0.08:
            findings.append({
                "title": f"大面积褐变坏死（约 {brown*100:.0f}%）",
                "desc": "检测到大量褐色枯死组织，可能为真菌感染或严重干旱损伤",
                "color": "red"
            })
            advice_parts.append("大面积褐变需要及时修剪病变叶片，避免病害蔓延。用消毒剪刀剪去病叶，切口涂抹多菌灵粉末。")

        if dark > 0.08:
            findings.append({
                "title": f"深色病斑（约 {dark*100:.0f}%）",
                "desc": "检测到明显的深色/黑色斑点，高度怀疑真菌性病害感染",
                "color": "red"
            })
            advice_parts.append("深色斑点可能是叶斑病或黑斑病，需使用广谱杀菌剂（如代森锰锌）喷洒，每 7 天一次，连续 2-3 次。")

        if white > 0.05:
            findings.append({
                "title": "明显白色霉层",
                "desc": "叶片表面覆盖大量白色物质，白粉病可能性大",
                "color": "red"
            })
            advice_parts.append("白粉病感染较重，需立即隔离，加强通风光照，使用专用杀菌剂或稀释的白醋水喷洒。")

        if not advice_parts:
            advice_parts.append("植物整体状态较差，建议检查：① 是否长期缺水 ② 是否被暴晒 ③ 是否施肥过量。")

    # If no findings yet, add a general one
    if not findings:
        findings.append({
            "title": "整体状态待评估",
            "desc": "图像中植物特征不够明显，建议近距离拍摄叶片细节以获得更准确的诊断",
            "color": "green"
        })
        advice_parts.append("建议：靠近植物拍摄，确保画面中有清晰的叶片细节，避免背景占比过大。")

    # Add green finding if not already present for non-healthy states
    if status_class != "healthy" and green > 0.3:
        findings.append({
            "title": f"健康叶片占比 {green*100:.0f}%",
            "desc": "仍有较多绿色健康组织，及时干预有较大恢复希望",
            "color": "green"
        })

    # Build metrics
    metrics = [
        {"value": f"{health_score}", "label": "健康评分", "color": "green" if health_score >= 80 else ("orange" if health_score >= 50 else "red")},
        {"value": f"{green*100:.0f}%", "label": "绿色占比", "color": "green"},
        {"value": f"{yellow*100:.0f}%", "label": "黄化率", "color": "green" if yellow < 0.08 else ("orange" if yellow < 0.15 else "red")},
    ]
    if brown > 0.02:
        metrics.append({"value": f"{brown*100:.0f}%", "label": "褐变率", "color": "orange" if brown < 0.08 else "red"})

    return {
        "status_class": status_class,
        "status_icon": status_icon,
        "status_label": status_label,
        "status_desc": status_desc,
        "metrics": metrics,
        "findings": findings,
        "advice": "\n\n".join(advice_parts),
        "anomalies": anomalies,
        "raw_ratios": ratios,
    }


# ---- FastAPI Routes ----

@app.get("/", response_class=HTMLResponse)
async def index():
    """Serve the main SPA page."""
    import os
    html_path = os.path.join(os.path.dirname(__file__), "static", "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


def _to_native(obj):
    """Recursively convert numpy types to Python native types for JSON serialization."""
    import math
    if isinstance(obj, dict):
        return {k: _to_native(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_native(v) for v in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (bool,)):
        return bool(obj)
    return obj


@app.post("/diagnose")
async def diagnose(image: UploadFile = File(...)):
    """Accept an uploaded plant image and return diagnosis results."""
    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")

    # Step 1: Color analysis
    ratios = analyze_image(img)

    # Step 2: Anomaly region detection
    anomalies = detect_anomaly_regions(img, ratios)

    # Step 3: Generate diagnosis
    diagnosis = generate_diagnosis(ratios, anomalies)

    # Convert all numpy types to native Python types for JSON serialization
    return _to_native(diagnosis)


@app.post("/chat")
async def chat_endpoint(data: dict):
    """
    Simple rule-based chat response for the demo.
    In production, this would call an LLM API.
    """
    message = data.get("message", "").strip()
    context = data.get("context", {})

    if not message:
        return {"reply": "请问有什么关于这盆植物的问题？"}

    reply = _generate_chat_reply(message, context)
    return {"reply": reply}


def _generate_chat_reply(message: str, context: dict) -> str:
    """Generate a contextual chat reply based on the diagnosis context."""
    ratios = context.get("raw_ratios", {})
    findings = context.get("findings", [])
    advice = context.get("advice", "")

    yellow_pct = ratios.get("yellow_ratio", 0) * 100
    brown_pct = ratios.get("brown_ratio", 0) * 100
    green_pct = ratios.get("green_ratio", 0) * 100
    status = context.get("status_label", "")

    msg_lower = message.lower()

    # Severity questions
    if any(k in msg_lower for k in ["严重", "要紧", "会不会死", "能救", "危险", "还有救吗"]):
        if status == "状态良好":
            return "目前情况不严重，植物整体状态不错，继续保持现在的养护方式就可以了。"
        elif status == "亚健康状态":
            return "目前不算严重，但需要及时调整。如果按照建议的养护方案执行，1-2 周内应该能看到改善。关键是要找出原因并纠正。"
        else:
            return "目前情况比较严重，需要立即采取行动。好消息是，如果健康叶片占比还有 {:.0f}%，只要及时处理，恢复的可能性还是存在的。优先检查根系和浇水情况。".format(green_pct)

    # Watering questions
    if any(k in msg_lower for k in ["浇水", "浇多少", "水", "湿度", "干湿"]):
        if yellow_pct > 15:
            return "根据诊断结果，你的植物黄化率较高，很可能是浇水过多的表现。\n\n建议：\n1. 立即停止浇水 3-5 天\n2. 检查盆底是否有积水，如果有要倒掉\n3. 恢复浇水后，等土壤表面干燥 2-3 厘米再浇\n4. 确保花盆有排水孔"
        elif brown_pct > 5:
            return "叶缘焦枯可能与空气干燥或水质有关。\n\n建议：\n1. 增加周围空气湿度（放水盘、喷雾）\n2. 避免直接用自来水浇灌，可以晾晒 1 天再用\n3. 浇水时间选在早晨，避免中午高温时浇水"
        else:
            return '根据当前诊断结果，浇水方面没有明显异常。\n\n通用建议：\n1. 遵循"见干见湿"原则——表层土壤干燥后再浇\n2. 浇则浇透，从盆底有水流出为止\n3. 避免让水积在叶心或盆底'

    # Light/sun questions
    if any(k in msg_lower for k in ["光照", "阳光", "晒", "放哪里", "位置", "窗户"]):
        if yellow_pct > 10:
            return "叶片黄化可能与光照不足有关。大多数室内绿植需要明亮的散射光。\n\n建议：\n1. 放在朝东或朝北的窗台\n2. 避免正午阳光直射（会灼伤叶片）\n3. 如果光照不足，可以考虑补充植物补光灯\n4. 每周转动花盆 90 度，让各面均匀受光"
        else:
            return "根据诊断结果，光照方面没有明显问题。\n\n大多数室内绿植适合明亮散射光环境，避免阳光直射和完全阴暗。放在距离窗户 1-2 米的位置通常比较理想。"

    # Fertilizer questions
    if any(k in msg_lower for k in ["施肥", "肥料", "营养", "缺什么", "补"]):
        return "关于施肥的建议：\n\n1. 如果植物状态不好，先不要施肥——施肥会加重植物负担\n2. 等植物恢复健康后，生长季（春夏）每 2-4 周施一次稀释的液肥\n3. 秋冬季节植物生长缓慢，减少或停止施肥\n4. 肥料浓度控制在推荐量的 1/2 到 1/3，薄肥勤施"

    # Repotting questions
    if any(k in msg_lower for k in ["换盆", "换土", "盆", "土壤", "基质"]):
        return "关于换盆的建议：\n\n1. 如果根系从盆底冒出来或浇水后水立即流出，说明需要换盆了\n2. 最佳换盆时间是春季\n3. 新盆比旧盆大 5-10 厘米即可，不要跳级太大\n4. 使用疏松透气的营养土（泥炭+珍珠岩+蛭石 = 2:1:1）\n5. 换盆后 1 周内不要施肥，放在阴凉处缓苗"

    # General fallback
    return "根据诊断结果，你的植物当前状态为「{}」，健康叶片占比约 {:.0f}%。\n\n主要建议：\n1. 确保浇水不过量——等土壤表面干燥后再浇\n2. 保持通风良好，避免闷湿环境\n3. 定期检查叶片正反面是否有虫害或病斑\n4. 如有异常变化，可以再次拍照诊断追踪变化趋势\n\n你也可以问我更具体的问题，比如浇水频率、光照需求、施肥方法、是否需要换盆等。".format(status, green_pct)


# ---- Entry Point ----
if __name__ == "__main__":
    import os
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    print("=" * 50)
    print("  植物愈诊室 Demo 已启动")
    print("  请在浏览器打开: http://localhost:8000")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
