"""上传 API：接收视频文件并创建分析任务"""
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException

from config import UPLOAD_DIR
from storage.database import execute_update, execute_single

router = APIRouter()


@router.post("/api/pingpong/upload")
async def upload_video(file: UploadFile = File(...)):
    """上传视频文件

    接收 multipart/form-data 格式的视频文件，
    保存到 uploads 目录，并在数据库创建任务记录。

    Returns:
        {"task_id": "xxx", "message": "上传成功"}
    """
    # 验证文件类型
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    # 支持的视频格式
    allowed_extensions = {".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv"}
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的视频格式，仅支持: {', '.join(allowed_extensions)}",
        )

    # 生成任务ID
    task_id = str(uuid.uuid4())

    # 生成保存的文件名
    saved_filename = f"{task_id}{ext}"
    file_path = UPLOAD_DIR / saved_filename

    # 保存文件
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")

    # 在数据库创建任务记录
    created_at = datetime.now().isoformat()
    execute_update(
        """
        INSERT INTO pingpong_tasks (id, video_filename, video_path, status, created_at)
        VALUES (?, ?, ?, 'pending', ?)
        """,
        (task_id, file.filename, str(file_path), created_at),
    )

    return {"task_id": task_id, "message": "上传成功"}
