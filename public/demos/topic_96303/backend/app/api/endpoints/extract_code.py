from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.ocr_service import OCRService
from app.services.code_extractor import CodeExtractor
from app.services.image_service import ImageService
from app.schemas.response import ExtractCodeResponse, CandidateCode

router = APIRouter()
ocr_service = OCRService()

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/extract-code", response_model=ExtractCodeResponse)
async def extract_code(image: UploadFile = File(...)):
    try:
        image_bytes = await image.read()

        if not image_bytes:
            raise HTTPException(status_code=400, detail="上传的图片为空")

        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="图片大小超过限制（最大10MB）")

        if image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=400, detail="不支持的图片格式，请上传JPG、PNG或WEBP格式")

        if not ImageService.is_valid_image(image_bytes):
            raise HTTPException(status_code=400, detail="无法解析图片，请确保上传的是有效图片")

        ocr_results, ocr_engine = ocr_service.recognize(image_bytes)

        candidates = CodeExtractor.extract_candidates(ocr_results)

        if not candidates:
            return JSONResponse(content={
                "candidates": [],
                "message": "未识别到取件码，请重新上传更清晰的截图",
                "ocr_engine": ocr_engine
            })

        return JSONResponse(content={
            "candidates": [
                {"full_code": c.full_code, "short_code": c.short_code}
                for c in candidates
            ],
            "ocr_engine": ocr_engine
        })

    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"提取取件码异常: {e}")
        raise HTTPException(status_code=500, detail="服务器内部错误，请稍后重试")