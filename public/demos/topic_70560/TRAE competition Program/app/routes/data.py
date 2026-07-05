import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.services.data_cleaner import DataCleaner
from app.utils.file_utils import create_directory_if_not_exists, get_file_extension, list_files_in_directory

router = APIRouter(prefix="/api/data", tags=["data"])

UPLOAD_DIR = "uploads/data"
OUTPUT_DIR = "outputs/data"

create_directory_if_not_exists(UPLOAD_DIR)
create_directory_if_not_exists(OUTPUT_DIR)

cleaner = DataCleaner(UPLOAD_DIR, OUTPUT_DIR)

ALLOWED_EXTENSIONS = [".xlsx", ".xls"]


@router.post("/upload")
async def upload_data(file: UploadFile = File(...)):
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed types: {ALLOWED_EXTENSIONS}")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    return {
        "success": True,
        "filename": file.filename,
        "file_path": file_path
    }


@router.post("/analyze")
async def analyze_data(file: UploadFile = File(...)):
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed types: {ALLOWED_EXTENSIONS}")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    result = cleaner.analyze(file_path)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Analysis failed"))
    
    return result


@router.post("/clean")
async def clean_data(file: UploadFile = File(...)):
    ext = get_file_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Allowed types: {ALLOWED_EXTENSIONS}")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    result = cleaner.clean(file_path)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Clean failed"))
    
    return {
        "success": True,
        "original_file": file.filename,
        "output_path": result["output_path"],
        "output_filename": result["output_filename"],
        "original_rows": result["original_rows"],
        "cleaned_rows": result["cleaned_rows"],
        "removed_rows": result["removed_rows"],
        "duplicate_count": result.get("duplicate_count", 0),
        "duplicate_details": result.get("duplicate_details", []),
        "field_mapping": result["field_mapping"],
        "standardized_headers": result["standardized_headers"]
    }


@router.get("/list")
async def list_data_files():
    upload_files = list_files_in_directory(UPLOAD_DIR, ALLOWED_EXTENSIONS)
    output_files = list_files_in_directory(OUTPUT_DIR, [".xlsx"])
    
    return {
        "uploaded": upload_files,
        "processed": output_files
    }


@router.get("/download/{filename}")
async def download_cleaned_data(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename=filename)


@router.post("/batch")
async def batch_clean(files: list[UploadFile] = File(...)):
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
        raise HTTPException(status_code=400, detail="No valid Excel files provided")
    
    result = cleaner.batch_clean(uploaded_files)
    
    return result


@router.post("/clean_and_merge")
async def clean_and_merge(files: list[UploadFile] = File(...)):
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
    
    result = cleaner.clean_and_merge(uploaded_files)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Clean and merge failed"))
    
    return result