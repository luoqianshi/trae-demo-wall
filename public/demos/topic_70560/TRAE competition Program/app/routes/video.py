import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.services.video_transcoder import VideoTranscoder
from app.utils.file_utils import create_directory_if_not_exists, get_file_extension, list_files_in_directory

router = APIRouter(prefix="/api/video", tags=["video"])

UPLOAD_DIR = "uploads/video"
OUTPUT_DIR = "outputs/video"

create_directory_if_not_exists(UPLOAD_DIR)
create_directory_if_not_exists(OUTPUT_DIR)

transcoder = VideoTranscoder(UPLOAD_DIR, OUTPUT_DIR)

ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".flv", ".wmv", ".webm"]


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed types: {ALLOWED_EXTENSIONS}")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    info = transcoder.get_video_info(file_path)
    
    if not info["success"]:
        return {
            "success": True,
            "filename": file.filename,
            "file_path": file_path,
            "message": "File uploaded successfully, but cannot analyze video"
        }
    
    return {
        "success": True,
        "filename": file.filename,
        "file_path": file_path,
        "video_info": info
    }


@router.post("/transcode")
async def transcode_video(file: UploadFile = File(...)):
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed types: {ALLOWED_EXTENSIONS}")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    result = transcoder.transcode(file_path, file.filename)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Transcode failed"))
    
    return {
        "success": True,
        "original_file": file.filename,
        "output_path": result["output_path"],
        "output_filename": os.path.basename(result["output_path"]),
        "strategy": result["strategy"],
        "message": result["message"]
    }


@router.get("/list")
async def list_videos():
    upload_files = list_files_in_directory(UPLOAD_DIR, ALLOWED_EXTENSIONS)
    output_files = list_files_in_directory(OUTPUT_DIR, [".mp4"])
    
    return {
        "uploaded": upload_files,
        "processed": output_files
    }


@router.get("/download/{filename}")
async def download_video(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, media_type="video/mp4", filename=filename)


@router.get("/info/{filename}")
async def get_video_info(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return transcoder.get_video_info(file_path)


@router.post("/batch")
async def batch_transcode(files: list[UploadFile] = File(...)):
    uploaded_files = []
    
    for file in files:
        ext = get_file_extension(file.filename)
        if ext not in ALLOWED_EXTENSIONS:
            continue
        
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        uploaded_files.append(file_path)
    
    if not uploaded_files:
        raise HTTPException(status_code=400, detail="No valid video files provided")
    
    result = transcoder.batch_transcode(uploaded_files)
    
    return result