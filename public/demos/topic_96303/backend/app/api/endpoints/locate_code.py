from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response, JSONResponse
from app.services.ocr_service import OCRService
from app.services.code_extractor import CodeExtractor
from app.services.image_service import ImageService

router = APIRouter()
ocr_service = OCRService()

MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

SUGGESTIONS = [
    "请靠近拍摄",
    "请保持对焦清晰",
    "请避免反光",
    "请确保贴码完整入镜"
]


@router.post("/locate-code")
async def locate_code(
    image: UploadFile = File(...),
    full_code: str = Form(...),
    short_code: str = Form(...)
):
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

        if not short_code or len(short_code) != 4 or not short_code.isdigit():
            raise HTTPException(status_code=400, detail="目标码必须为4位数字")

        if not full_code:
            raise HTTPException(status_code=400, detail="完整取件码不能为空")

        ocr_service = OCRService()

        all_ocr_texts = []
        best_matching_results = None
        best_is_unique = False
        last_engine = "rapidocr"

        strategies = [
            ("rapid_sliding_window", lambda: ocr_service.recognize_with_sliding_window(image_bytes)),
            ("rapid_original", lambda: ocr_service.recognize(image_bytes)),
            ("rapid_clahe_sharpen", lambda: ocr_service.recognize(ImageService._preprocess_clahe_sharpen(image_bytes))),
            ("rapid_high_contrast", lambda: ocr_service.recognize(ImageService._preprocess_high_contrast(image_bytes))),
            ("rapid_adaptive", lambda: ocr_service.recognize(ImageService._preprocess_adaptive(image_bytes))),
            ("rapid_upscale", lambda: ocr_service.recognize(ImageService._preprocess_upscale(image_bytes))),
            ("rapid_median_denoise", lambda: ocr_service.recognize(ImageService._preprocess_median_denoise(image_bytes))),
            ("rapid_gamma_correction", lambda: ocr_service.recognize(ImageService._preprocess_gamma_correction(image_bytes))),
            ("rapid_unsharp_masking", lambda: ocr_service.recognize(ImageService._preprocess_unsharp_masking(image_bytes))),
            ("rapid_morphological", lambda: ocr_service.recognize(ImageService._preprocess_morphological(image_bytes))),
            ("rapid_lab_enhance", lambda: ocr_service.recognize(ImageService._preprocess_lab_enhance(image_bytes))),
            ("rapid_comprehensive", lambda: ocr_service.recognize(ImageService._preprocess_comprehensive(image_bytes))),
        ]

        for name, strategy in strategies:
            try:
                results, engine = strategy()
                texts = [r.text for r in results]
                all_ocr_texts.extend(texts)
                last_engine = engine

                matching_results, is_unique = CodeExtractor.find_matching_result(results, short_code)
                if matching_results:
                    best_matching_results = matching_results
                    best_is_unique = is_unique
                    break
            except Exception:
                continue

        if best_matching_results:
            if best_is_unique:
                annotated_image = ImageService.draw_bbox(image_bytes, best_matching_results, short_code)
                return Response(
                    content=annotated_image,
                    media_type="image/jpeg",
                    headers={
                        "X-Found": "true",
                        "X-Target-Code": short_code,
                        "X-Matched-Text": best_matching_results[0].text,
                        "X-OCR-Engine": last_engine
                    }
                )
            else:
                return JSONResponse(content={
                    "found": False,
                    "target_code": short_code,
                    "message": "识别到多个相同的取件码，请重新拍摄或人工确认",
                    "suggestions": SUGGESTIONS,
                    "ocr_engine": last_engine,
                    "ocr_raw_texts": all_ocr_texts
                })
        else:
            return JSONResponse(content={
                "found": False,
                "target_code": short_code,
                "message": "未找到目标取件码",
                "suggestions": SUGGESTIONS,
                "ocr_engine": last_engine,
                "ocr_raw_texts": all_ocr_texts
            })

    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.error(f"定位取件码异常: {e}")
        raise HTTPException(status_code=500, detail="服务器内部错误，请稍后重试")