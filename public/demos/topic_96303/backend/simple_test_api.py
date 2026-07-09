import sys
sys.path.insert(0, '.')

from fastapi import FastAPI, UploadFile, File, Form
import uvicorn

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/test-upload")
async def test_upload(image: UploadFile = File(...), code: str = Form(...)):
    image_bytes = await image.read()
    return {"image_size": len(image_bytes), "code": code}

if __name__ == "__main__":
    print("Starting test server...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=8002, reload=False)
