"""
数据导入路由
提供文件上传、格式检测、预览和确认导入接口
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services.import_service import import_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/import", tags=["数据导入"])


class TextImportRequest(BaseModel):
    """粘贴文本导入请求"""
    text: str = Field(..., min_length=1, description="粘贴的纯文本内容")
    format: Optional[str] = Field(default=None, description="格式标识（不填则自动检测）")


@router.get("/formats", summary="获取支持的导入格式")
def get_formats():
    """返回支持的文件格式列表"""
    return import_service.get_supported_formats()


@router.post("/detect", summary="自动检测文件格式")
async def detect_format(
    file: UploadFile = File(..., description="待检测的文件"),
):
    """
    上传文件，自动检测其格式
    返回检测到的格式标识
    """
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("gbk")
        except UnicodeDecodeError:
            text = content.decode("utf-8", errors="replace")

    preview = text[:500]
    fmt = import_service.detect_format(file.filename, preview)

    if fmt is None:
        return {"format": None, "filename": file.filename, "message": "无法自动识别文件格式，请手动选择"}

    format_info = import_service.supported_formats.get(fmt, {})
    return {
        "format": fmt,
        "format_name": format_info.get("name", fmt),
        "filename": file.filename,
        "message": f"识别为: {format_info.get('name', fmt)}",
    }


@router.post("/preview", summary="预览导入结果")
async def preview_import(
    file: UploadFile = File(..., description="要导入的文件"),
    format: Optional[str] = Form(default=None, description="手动指定格式（不填则自动检测）"),
):
    """
    上传文件，解析并返回预览结果（不实际写入数据库）
    """
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("gbk")
        except UnicodeDecodeError:
            text = content.decode("utf-8", errors="replace")

    # 检测格式
    if not format:
        format = import_service.detect_format(file.filename, text[:500])

    if not format:
        raise HTTPException(status_code=400, detail="无法识别文件格式，请手动指定")

    # 生成一个假的 session 用于预览（不实际使用数据库）
    result = None
    if format == "wechat_csv":
        result = import_service.import_wechat_csv(text, None, preview_only=True)
    elif format == "call_log_csv":
        result = import_service.import_call_log_csv(text, None, preview_only=True)
    elif format == "wechat_json":
        result = import_service.import_wechat_json(text, None, preview_only=True)
    else:
        raise HTTPException(status_code=400, detail=f"不支持的格式: {format}")

    return result.to_dict()


@router.post("/detect-text", summary="自动检测粘贴文本格式")
def detect_text_format(body: TextImportRequest):
    """根据粘贴的文本内容自动识别格式"""
    detected = import_service.detect_text_format(body.text)
    if detected is None:
        return {"format": None, "message": "无法自动识别，请手动选择格式"}
    format_names = {
        "wechat_text": "微信聊天记录（粘贴文本）",
        "call_log_text": "通话记录（粘贴文本）",
    }
    return {
        "format": detected,
        "format_name": format_names.get(detected, detected),
        "message": f"识别为: {format_names.get(detected, detected)}",
    }


@router.post("/parse-text", summary="预览粘贴文本解析结果")
def parse_text_preview(body: TextImportRequest):
    """解析粘贴的纯文本，返回预览（不写数据库）"""
    fmt = body.format
    if not fmt:
        fmt = import_service.detect_text_format(body.text)
    if not fmt:
        raise HTTPException(status_code=400, detail="无法识别文本格式，请手动指定")

    if fmt == "wechat_text":
        result = import_service.import_wechat_text(body.text, None, preview_only=True)
    elif fmt == "call_log_text":
        result = import_service.import_call_log_text(body.text, None, preview_only=True)
    else:
        raise HTTPException(status_code=400, detail=f"不支持的文本格式: {fmt}")

    data = result.to_dict()
    data["_format_used"] = fmt
    return data


@router.post("/parse-text/confirm", summary="确认导入粘贴文本")
def parse_text_confirm(body: TextImportRequest, db: Session = Depends(get_db)):
    """确认导入粘贴文本，实际写入数据库"""
    fmt = body.format
    if not fmt:
        raise HTTPException(status_code=400, detail="请指定文本格式")

    try:
        if fmt == "wechat_text":
            result = import_service.import_wechat_text(body.text, db, preview_only=False)
        elif fmt == "call_log_text":
            result = import_service.import_call_log_text(body.text, db, preview_only=False)
        else:
            raise HTTPException(status_code=400, detail=f"不支持的文本格式: {fmt}")
    except Exception as e:
        logger.error(f"文本导入失败: {e}")
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")

    return result.to_dict()
async def confirm_import(
    file: UploadFile = File(..., description="要导入的文件"),
    format: str = Form(..., description="文件格式标识"),
    db: Session = Depends(get_db),
):
    """
    确认导入，实际将数据写入数据库
    """
    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = content.decode("gbk")
        except UnicodeDecodeError:
            text = content.decode("utf-8", errors="replace")

    result = None
    try:
        if format == "wechat_csv":
            result = import_service.import_wechat_csv(text, db, preview_only=False)
        elif format == "call_log_csv":
            result = import_service.import_call_log_csv(text, db, preview_only=False)
        elif format == "wechat_json":
            result = import_service.import_wechat_json(text, db, preview_only=False)
        else:
            raise HTTPException(status_code=400, detail=f"不支持的格式: {format}")
    except Exception as e:
        logger.error(f"导入失败: {e}")
        raise HTTPException(status_code=500, detail=f"导入失败: {str(e)}")

    return result.to_dict()