from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.category_service import CategoryService
from app.core.database import get_db
from app.core.security import decode_merchant_id
from fastapi.security import OAuth2PasswordBearer
import uuid

router = APIRouter(prefix="/categories", tags=["分类管理"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)

@router.get("/")
def get_categories(store_id: str = None, keyword: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    if not store_id:
        from app.services.merchant_service import MerchantService
        stores = MerchantService.get_stores(db, merchant_id)
        if stores:
            store_id = str(stores[0].id)
    
    if keyword:
        categories = CategoryService.search_categories(db, store_id, keyword)
    else:
        categories = CategoryService.get_categories(db, store_id)
    
    return [{
        "id": str(c.id),
        "name": c.name,
        "icon": c.icon,
        "sort_order": c.sort_order,
        "status": c.status
    } for c in categories]

@router.get("/{category_id}")
def get_category(category_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        category = CategoryService.get_category(db, category_id)
        return {
            "id": str(category.id),
            "name": category.name,
            "icon": category.icon,
            "sort_order": category.sort_order,
            "status": category.status
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/")
def create_category(data: dict, store_id: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        if not store_id:
            from app.services.merchant_service import MerchantService
            stores = MerchantService.get_stores(db, merchant_id)
            if stores:
                store_id = str(stores[0].id)
            else:
                raise HTTPException(status_code=400, detail="请先创建门店")
        
        category = CategoryService.create_category(db, store_id, data)
        return {
            "id": str(category.id),
            "name": category.name,
            "icon": category.icon,
            "message": "分类创建成功"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{category_id}")
def update_category(category_id: str, data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        category = CategoryService.update_category(db, category_id, data)
        return {"message": "更新成功", "id": str(category.id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{category_id}")
def delete_category(category_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        CategoryService.delete_category(db, category_id)
        return {"message": "删除成功"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
