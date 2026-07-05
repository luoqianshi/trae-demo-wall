import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.services.ppt_generator import PPTGenerator
from app.utils.file_utils import create_directory_if_not_exists, list_files_in_directory

router = APIRouter(prefix="/api/ppt", tags=["ppt"])

OUTPUT_DIR = "outputs/ppt"

create_directory_if_not_exists(OUTPUT_DIR)

ppt_generator = PPTGenerator(OUTPUT_DIR)


class SlideData(BaseModel):
    type: str = "content"
    title: str = ""
    subtitle: str = ""
    content: str = ""
    items: List[str] = []
    image_path: str = ""
    description: str = ""
    chart_type: str = "bar"
    data: Dict = {}
    categories: List[str] = []


class GenerateRequest(BaseModel):
    template: str = "education"
    slides: List[SlideData] = []


@router.get("/templates")
async def get_templates():
    templates = ppt_generator.get_available_templates()
    return {
        "success": True,
        "templates": templates
    }


@router.post("/generate")
async def generate_ppt(request: GenerateRequest):
    if not request.slides:
        raise HTTPException(status_code=400, detail="至少需要添加一张幻灯片")
    
    try:
        prs = ppt_generator.generate_from_slides(request.slides, request.template)
        filepath = ppt_generator.save_presentation(prs)
        
        return {
            "success": True,
            "message": "PPT生成成功",
            "filename": os.path.basename(filepath),
            "filepath": filepath
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PPT生成失败: {str(e)}")


@router.get("/download/{filename}")
async def download_ppt(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation", filename=filename)


@router.get("/list")
async def list_ppts():
    files = list_files_in_directory(OUTPUT_DIR, [".pptx"])
    return {
        "success": True,
        "files": files
    }


@router.delete("/delete/{filename}")
async def delete_ppt(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    try:
        os.remove(file_path)
        return {
            "success": True,
            "message": "文件删除成功"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")