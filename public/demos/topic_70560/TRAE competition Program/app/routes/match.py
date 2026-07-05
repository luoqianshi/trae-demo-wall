import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.services.student_matcher import StudentMatcher
from app.utils.file_utils import create_directory_if_not_exists, get_file_extension, list_files_in_directory

router = APIRouter(prefix="/api/match", tags=["match"])

UPLOAD_DIR = "uploads/match"
OUTPUT_DIR = "outputs/match"

create_directory_if_not_exists(UPLOAD_DIR)
create_directory_if_not_exists(OUTPUT_DIR)

matcher = StudentMatcher(UPLOAD_DIR, OUTPUT_DIR)

ALLOWED_EXTENSIONS = [".xlsx", ".xls"]


@router.post("/upload")
async def upload_match_files(files: list[UploadFile] = File(...)):
    uploaded_files = []
    
    for file in files:
        ext = get_file_extension(file.filename)
        if ext not in ALLOWED_EXTENSIONS:
            continue
        
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        uploaded_files.append({
            "filename": file.filename,
            "file_path": file_path
        })
    
    if not uploaded_files:
        raise HTTPException(status_code=400, detail="No valid Excel files provided")
    
    return {
        "success": True,
        "uploaded_files": uploaded_files
    }


@router.post("/find_duplicates")
async def find_duplicates(file: UploadFile = File(...)):
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed types: {ALLOWED_EXTENSIONS}")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    result = matcher.find_duplicate_students(file_path)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to find duplicates"))
    
    return result


@router.post("/merge")
async def merge_records(files: list[UploadFile] = File(...)):
    uploaded_files = []
    source_names = []
    
    for file in files:
        ext = get_file_extension(file.filename)
        if ext not in ALLOWED_EXTENSIONS:
            continue
        
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        uploaded_files.append(file_path)
        source_names.append(file.filename)
    
    if not uploaded_files:
        raise HTTPException(status_code=400, detail="No valid Excel files provided")
    
    if len(uploaded_files) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 files to merge")
    
    result = matcher.merge_records(uploaded_files, source_names)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Merge failed"))
    
    return {
        "success": True,
        "output_path": result["output_path"],
        "output_filename": result["output_filename"],
        "total_source_students": result["total_source_students"],
        "merged_students": result["merged_students"],
        "removed_duplicates": result.get("removed_duplicates", 0),
        "duplicate_info": result["duplicate_info"],
        "source_files": result["source_files"]
    }


@router.post("/track_changes")
async def track_class_changes(files: list[UploadFile] = File(...)):
    uploaded_files = []
    source_names = []
    
    for file in files:
        ext = get_file_extension(file.filename)
        if ext not in ALLOWED_EXTENSIONS:
            continue
        
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        uploaded_files.append(file_path)
        source_names.append(file.filename)
    
    if not uploaded_files:
        raise HTTPException(status_code=400, detail="No valid Excel files provided")
    
    if len(uploaded_files) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 files to track changes")
    
    result = matcher.track_class_changes(uploaded_files, source_names)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Track changes failed"))
    
    return result


@router.get("/list")
async def list_match_files():
    upload_files = list_files_in_directory(UPLOAD_DIR, ALLOWED_EXTENSIONS)
    output_files = list_files_in_directory(OUTPUT_DIR, [".xlsx"])
    
    return {
        "uploaded": upload_files,
        "processed": output_files
    }


@router.get("/download/{filename}")
async def download_merged_data(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=filename)