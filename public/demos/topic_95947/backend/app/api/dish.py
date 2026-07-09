from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.services.dish_service import DishService
from app.core.database import get_db
from app.core.security import decode_merchant_id
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import JSONResponse
import uuid
import os
import shutil

router = APIRouter(prefix="/dishes", tags=["菜品管理"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

UPLOAD_DIR = "uploads"

def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)

@router.get("/categories")
def get_categories(store_id: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        categories = DishService.get_categories(db, merchant_id, store_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return {"categories": [{
        "id": str(c.id),
        "name": c.name,
        "icon": c.icon,
        "sort_order": c.sort_order,
        "status": c.status
    } for c in categories]}

@router.get("/without-images")
def get_dishes_without_images(store_id: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        dishes = DishService.get_dishes_without_images(db, merchant_id, store_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return [{
        "id": str(d.id),
        "name": d.name,
        "category": d.category_rel.name if d.category_rel else "",
        "category_id": str(d.category_id) if d.category_id else None,
        "description": d.description
    } for d in dishes]

@router.post("/generate-images")
def generate_dish_images(data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    dish_ids = data.get("dish_ids", [])
    results = []
    
    for dish_id in dish_ids:
        try:
            dish = DishService.get_dish(db, merchant_id, dish_id)
            image_prompt = f"{dish.name} chinese food delicious {dish.category_rel.name if dish.category_rel else ''}"
            image_url = f"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={image_prompt}&image_size=square"
            DishService.upload_image(db, merchant_id, dish_id, image_url)
            results.append({"id": str(dish.id), "name": dish.name, "image_url": image_url, "status": "success"})
        except ValueError as e:
            results.append({"id": dish_id, "status": "not_found"})
        except Exception as e:
            results.append({"id": dish_id, "status": "error", "error": str(e)})
    
    return {"results": results, "total": len(results), "success": sum(1 for r in results if r.get("status") == "success")}

@router.get("/")
def get_dishes(store_id: str = None, category_id: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        dishes = DishService.get_dishes(db, merchant_id, store_id, category_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return [{
        "id": str(d.id),
        "store_id": str(d.store_id),
        "category_id": str(d.category_id) if d.category_id else None,
        "name": d.name,
        "price": d.price,
        "description": d.description,
        "image_url": d.image_url,
        "status": d.status,
        "sales_count": d.sales_count,
        "created_at": d.created_at,
        "updated_at": d.updated_at
    } for d in dishes]

@router.get("/{dish_id}")
def get_dish(dish_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        dish = DishService.get_dish(db, merchant_id, dish_id)
        return {
            "id": str(dish.id),
            "store_id": str(dish.store_id),
            "category_id": str(dish.category_id) if dish.category_id else None,
            "name": dish.name,
            "price": dish.price,
            "description": dish.description,
            "image_url": dish.image_url,
            "status": dish.status,
            "sales_count": dish.sales_count,
            "created_at": dish.created_at,
            "updated_at": dish.updated_at
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/")
def create_dish(data: dict, store_id: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        if not store_id:
            from app.services.merchant_service import MerchantService
            stores = MerchantService.get_stores(db, merchant_id)
            if stores:
                store_id = str(stores[0].id)
            else:
                raise HTTPException(status_code=400, detail="请先创建门店")
        
        dish = DishService.create_dish(db, merchant_id, store_id, data)
        return {
            "id": str(dish.id),
            "name": dish.name,
            "price": dish.price,
            "category_id": str(dish.category_id) if dish.category_id else None,
            "image_url": dish.image_url,
            "sales_count": dish.sales_count
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{dish_id}")
def update_dish(dish_id: str, data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        dish = DishService.update_dish(db, merchant_id, dish_id, data)
        return {"message": "更新成功", "id": str(dish.id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{dish_id}")
def delete_dish(dish_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        DishService.delete_dish(db, merchant_id, dish_id)
        return {"message": "删除成功"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/upload-image")
async def upload_dish_image_general(file: UploadFile = File(...), merchant_id: str = Depends(get_current_merchant_id)):
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="只支持JPEG、PNG、WebP格式")
        
        file_extension = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        image_url = f"/{UPLOAD_DIR}/{filename}"
        
        return {"message": "上传成功", "image_url": image_url}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{dish_id}/upload-image")
async def upload_dish_image(dish_id: str, file: UploadFile = File(...), merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        allowed_types = ["image/jpeg", "image/png", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="只支持JPEG、PNG、WebP格式")
        
        file_extension = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        image_url = f"/{UPLOAD_DIR}/{filename}"
        dish = DishService.upload_image(db, merchant_id, dish_id, image_url)
        
        return {"message": "上传成功", "image_url": image_url, "id": str(dish.id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch-update-images")
def batch_update_images(data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    updates = data.get("updates", [])
    results = DishService.batch_update_images(db, merchant_id, updates)
    return {"results": results, "total": len(results), "success": sum(1 for r in results if r.get("status") == "success")}
