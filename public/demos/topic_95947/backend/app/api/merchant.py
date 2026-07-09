from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.merchant import MerchantResponse, StoreCreateRequest, StoreResponse
from app.services.merchant_service import MerchantService
from app.core.database import get_db
from app.core.security import decode_merchant_id
from fastapi.security import OAuth2PasswordBearer
from typing import List
import uuid

router = APIRouter(prefix="/merchants", tags=["商家管理"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)

@router.get("/profile", response_model=MerchantResponse)
def get_merchant_profile(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        merchant = MerchantService.get_merchant(db, merchant_id)
        return MerchantResponse(
            id=str(merchant.id),
            name=merchant.name,
            type=merchant.type,
            industry=merchant.industry,
            region=merchant.region,
            status=merchant.status,
            email=merchant.email,
            phone=merchant.phone,
            description=merchant.description,
            created_at=merchant.created_at,
            updated_at=merchant.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/profile")
def update_merchant_profile(data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        merchant = MerchantService.update_merchant(db, merchant_id, data)
        return {"message": "更新成功"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/stores", response_model=StoreResponse)
def create_store(request: StoreCreateRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        store = MerchantService.create_store(db, merchant_id, request)
        return StoreResponse(
            id=str(store.id),
            merchant_id=str(store.merchant_id),
            name=store.name,
            address=store.address,
            phone=store.phone,
            business_hours=store.business_hours,
            status=store.status,
            latitude=store.latitude,
            longitude=store.longitude,
            created_at=store.created_at,
            updated_at=store.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stores", response_model=List[StoreResponse])
def get_stores(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    stores = MerchantService.get_stores(db, merchant_id)
    return [StoreResponse(
        id=str(s.id),
        merchant_id=str(s.merchant_id),
        name=s.name,
        address=s.address,
        phone=s.phone,
        business_hours=s.business_hours,
        status=s.status,
        latitude=s.latitude,
        longitude=s.longitude,
        created_at=s.created_at,
        updated_at=s.updated_at
    ) for s in stores]

@router.get("/stores/{store_id}", response_model=StoreResponse)
def get_store(store_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        store = MerchantService.get_store(db, store_id)
        if str(store.merchant_id) != str(merchant_id):
            raise HTTPException(status_code=403, detail="无权访问")
        return StoreResponse(
            id=str(store.id),
            merchant_id=str(store.merchant_id),
            name=store.name,
            address=store.address,
            phone=store.phone,
            business_hours=store.business_hours,
            status=store.status,
            latitude=store.latitude,
            longitude=store.longitude,
            created_at=store.created_at,
            updated_at=store.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/stores/{store_id}")
def update_store(store_id: str, data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        store = MerchantService.get_store(db, store_id)
        if str(store.merchant_id) != str(merchant_id):
            raise HTTPException(status_code=403, detail="无权访问")
        MerchantService.update_store(db, store_id, data)
        return {"message": "更新成功"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/stores/{store_id}")
def delete_store(store_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        store = MerchantService.get_store(db, store_id)
        if str(store.merchant_id) != str(merchant_id):
            raise HTTPException(status_code=403, detail="无权访问")
        MerchantService.delete_store(db, store_id)
        return {"message": "删除成功"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
