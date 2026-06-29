"""公式识别 API 路由"""
import uuid
import base64
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel, Field
from app.services.recognizer import recognize_formula
from app.services.latex_processor import process_latex, process_latex_from_vlm
from app.services.document_parser import parse_document

router = APIRouter(prefix="/api/v1/recognize", tags=["识别"])


class RecognizeResponse(BaseModel):
    task_id: str
    latex: str
    confidence: float
    processing_time_ms: int
    validation: dict


class BatchRecognizeResponse(BaseModel):
    task_id: str
    results: list[RecognizeResponse]
    total_count: int


class RerenderRequest(BaseModel):
    """重新识别请求（base64 图片）"""
    image_base64: str
    auto_fix: bool = True


@router.post("", response_model=RecognizeResponse)
async def recognize_single(
    file: UploadFile = File(...),
    auto_fix: bool = True,
):
    """单张图片公式识别"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "仅支持图片文件 (PNG, JPG, WEBP 等)")

    image_bytes = await file.read()

    if len(image_bytes) > 20 * 1024 * 1024:  # 20MB
        raise HTTPException(400, "图片大小不能超过 20MB")

    try:
        result = await recognize_formula(image_bytes)
    except Exception as e:
        raise HTTPException(500, f"识别失败: {str(e)}")

    # LaTeX 后处理（使用 VLM 清理管线，支持多行拆分和文字清理）
    validations = process_latex_from_vlm(result["latex"], auto_fix=auto_fix)
    # 单图取第一个结果
    validation = validations[0] if validations else process_latex(result["latex"], auto_fix=auto_fix)

    task_id = str(uuid.uuid4())

    return RecognizeResponse(
        task_id=task_id,
        latex=validation.get("auto_fixed", result["latex"]),
        confidence=result["confidence"],
        processing_time_ms=result["processing_time_ms"],
        validation={
            "is_valid": validation["is_valid"],
            "errors": validation.get("errors", []),
            "formatted": validation.get("formatted", result["latex"]),
        },
    )


@router.post("/batch", response_model=BatchRecognizeResponse)
async def recognize_batch(
    files: list[UploadFile] = File(...),
    auto_fix: bool = True,
):
    """批量图片公式识别（最多 10 张）"""
    if len(files) > 10:
        raise HTTPException(400, "单次批量最多 10 张图片")

    results = []
    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            continue

        image_bytes = await file.read()
        try:
            result = await recognize_formula(image_bytes)
            # 使用 VLM 清理管线
            validations = process_latex_from_vlm(result["latex"], auto_fix=auto_fix)
            validation = validations[0] if validations else process_latex(result["latex"], auto_fix=auto_fix)
            results.append(
                RecognizeResponse(
                    task_id=str(uuid.uuid4()),
                    latex=validation.get("auto_fixed", result["latex"]),
                    confidence=result["confidence"],
                    processing_time_ms=result["processing_time_ms"],
                    validation={
                        "is_valid": validation["is_valid"],
                        "errors": validation.get("errors", []),
                        "formatted": validation.get("formatted", result["latex"]),
                    },
                )
            )
        except Exception:
            results.append(
                RecognizeResponse(
                    task_id=str(uuid.uuid4()),
                    latex="",
                    confidence=0,
                    processing_time_ms=0,
                    validation={"is_valid": False, "errors": ["识别失败"], "formatted": ""},
                )
            )

    return BatchRecognizeResponse(
        task_id=str(uuid.uuid4()),
        results=results,
        total_count=len(results),
    )


@router.post("/validate")
async def validate_latex(request: dict):
    """校验 LaTeX 代码"""
    latex = request.get("latex", "")
    result = process_latex(latex, auto_fix=True)
    return result


class DocumentRecognizeResponse(BaseModel):
    task_id: str
    document_name: str
    results: list[RecognizeResponse]
    total_count: int
    # 每个结果对应的原始图片 base64（用于重新识别）
    result_images: list[str] = []


@router.post("/document", response_model=DocumentRecognizeResponse)
async def recognize_document(
    file: UploadFile = File(...),
    auto_fix: bool = True,
    max_pages: int = 20,
):
    """上传 Word/PDF 文档，提取并识别其中的公式"""
    filename = file.filename or "document"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ("pdf", "docx", "doc"):
        raise HTTPException(400, "仅支持 PDF、DOCX、DOC 格式")

    file_bytes = await file.read()

    if len(file_bytes) > 50 * 1024 * 1024:
        raise HTTPException(400, "文件大小不能超过 50MB")

    try:
        parsed = parse_document(file_bytes, filename)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"文档解析失败: {str(e)}")

    images = parsed.get("images", [])
    omml_latex_list = parsed.get("omml_latex", [])

    results = []

    # 1. 处理 OMML 公式（直接转换，无需 VLM）
    for latex in omml_latex_list:
        validation = process_latex(latex, auto_fix=auto_fix)
        results.append(
            RecognizeResponse(
                task_id=str(uuid.uuid4()),
                latex=validation.get("auto_fixed", latex),
                confidence=0.98,  # OMML 直接转换，置信度高
                processing_time_ms=0,
                validation={
                    "is_valid": validation["is_valid"],
                    "errors": validation.get("errors", []),
                    "formatted": validation.get("formatted", latex),
                },
            )
        )

    # 2. 处理嵌入图片（需要 VLM 识别，支持多行公式拆分）
    max_formulas = min(len(images), max_pages * 3)
    images = images[:max_formulas]

    # 记录每个结果对应的图片 base64
    result_images: list[str] = []

    for img_bytes in images:
        img_b64 = base64.b64encode(img_bytes).decode('utf-8')
        try:
            result = await recognize_formula(img_bytes)
            # VLM 可能返回多行公式（含 \begin{align} 等），拆分处理
            validations = process_latex_from_vlm(result["latex"], auto_fix=auto_fix)
            for vi, validation in enumerate(validations):
                results.append(
                    RecognizeResponse(
                        task_id=str(uuid.uuid4()),
                        latex=validation.get("auto_fixed", result["latex"]),
                        confidence=result["confidence"],
                        processing_time_ms=result["processing_time_ms"],
                        validation={
                            "is_valid": validation["is_valid"],
                            "errors": validation.get("errors", []),
                            "formatted": validation.get("formatted", result["latex"]),
                        },
                    )
                )
                # 每个拆分结果都关联同一张图片（支持重新识别）
                result_images.append(img_b64)
        except Exception:
            pass

    return DocumentRecognizeResponse(
        task_id=str(uuid.uuid4()),
        document_name=filename,
        results=results,
        total_count=len(results),
        result_images=result_images,
    )


@router.post("/rerender", response_model=RecognizeResponse)
async def rerender_formula(request: RerenderRequest):
    """重新识别公式（传入 base64 图片，返回新的识别结果）"""
    try:
        image_bytes = base64.b64decode(request.image_base64)
    except Exception:
        raise HTTPException(400, "图片数据格式错误")

    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(400, "图片大小不能超过 20MB")

    try:
        result = await recognize_formula(image_bytes)
    except Exception as e:
        raise HTTPException(500, f"识别失败: {str(e)}")

    # 使用 VLM 多行拆分处理
    validations = process_latex_from_vlm(result["latex"], auto_fix=request.auto_fix)

    # 返回第一个结果（或合并）
    if len(validations) == 1:
        validation = validations[0]
    else:
        # 多行时合并为单个结果
        validation = {
            "is_valid": all(v["is_valid"] for v in validations),
            "errors": [e for v in validations for e in v.get("errors", [])],
            "formatted": "\n".join(v.get("formatted", "") for v in validations),
            "auto_fixed": "\n".join(v.get("auto_fixed", "") for v in validations),
        }

    return RecognizeResponse(
        task_id=str(uuid.uuid4()),
        latex=validation.get("auto_fixed", result["latex"]),
        confidence=result["confidence"],
        processing_time_ms=result["processing_time_ms"],
        validation={
            "is_valid": validation["is_valid"],
            "errors": validation.get("errors", []),
            "formatted": validation.get("formatted", result["latex"]),
        },
    )