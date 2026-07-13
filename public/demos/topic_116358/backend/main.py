from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import open_clip
from PIL import Image
import io

app = FastAPI(title="驼翁再世 - AI植物养护助手", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model, preprocess, tokenizer = None, None, None
device = None

TEXT_PROMPTS = [
    "healthy green leaf",
    "yellow leaf caused by water shortage",
    "yellow leaf caused by nitrogen deficiency",
    "withered leaf",
    "leaf spot disease",
    "curled leaf",
    "stressed plant",
    "normal plant"
]

RESULT_MAP = {
    "healthy green leaf": {
        "status": "healthy",
        "message": "植物状态健康",
        "suggestion": "继续保持当前养护方式，定期浇水施肥。",
        "color": "#4CAF50"
    },
    "yellow leaf caused by water shortage": {
        "status": "water_shortage",
        "message": "叶片黄化，疑似缺水",
        "suggestion": "植物可能缺水，请及时补充水分，但注意不要过量浇水。",
        "color": "#FF9800"
    },
    "yellow leaf caused by nitrogen deficiency": {
        "status": "nutrient_deficiency",
        "message": "叶片黄化，疑似缺肥",
        "suggestion": "植物可能缺少氮肥，建议施加适量复合肥。",
        "color": "#FF9800"
    },
    "withered leaf": {
        "status": "withered",
        "message": "叶片枯萎",
        "suggestion": "植物叶片枯萎，检查土壤湿度和光照条件，及时采取补救措施。",
        "color": "#F44336"
    },
    "leaf spot disease": {
        "status": "disease",
        "message": "叶片出现病斑",
        "suggestion": "植物可能感染病害，建议及时喷洒杀菌剂，保持通风。",
        "color": "#F44336"
    },
    "curled leaf": {
        "status": "curled",
        "message": "叶片卷曲",
        "suggestion": "叶片卷曲可能是环境不适或病虫害导致，检查温度和湿度条件。",
        "color": "#FFC107"
    },
    "stressed plant": {
        "status": "stressed",
        "message": "植物处于胁迫状态",
        "suggestion": "植物整体状态不佳，建议检查光照、温度、水分等条件。",
        "color": "#FFC107"
    },
    "normal plant": {
        "status": "normal",
        "message": "植物生长正常",
        "suggestion": "植物生长状态良好，继续保持养护。",
        "color": "#4CAF50"
    }
}

def load_model():
    global model, preprocess, tokenizer, device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, preprocess, tokenizer = open_clip.create_model_and_transforms(
        "ViT-B-32-quickgelu", pretrained="laion400m_e32"
    )
    model = model.to(device)
    print(f"Model loaded on {device}")

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/")
async def root():
    return {"message": "驼翁再世 AI植物养护助手 API"}

@app.get("/health")
async def health():
    return {"status": "ok", "device": device}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    image_input = preprocess(image).unsqueeze(0).to(device)
    text_tokens = tokenizer(TEXT_PROMPTS).to(device)
    
    with torch.no_grad():
        image_features = model.encode_image(image_input)
        text_features = model.encode_text(text_tokens)
        logits = (image_features @ text_features.T)
        probs = logits.softmax(dim=-1)
    
    results = []
    for prompt, prob in zip(TEXT_PROMPTS, probs[0]):
        results.append({
            "label": prompt,
            "probability": prob.item()
        })
    
    sorted_results = sorted(results, key=lambda x: x["probability"], reverse=True)
    top_result = sorted_results[0]
    result_info = RESULT_MAP.get(top_result["label"], RESULT_MAP["normal plant"])
    
    return {
        "success": True,
        "prediction": result_info,
        "all_results": sorted_results,
        "confidence": top_result["probability"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)