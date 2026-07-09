from sqlalchemy.orm import Session
from app.models.merchant import Merchant, Store
from app.schemas.merchant import StoreCreateRequest
import uuid

class MerchantService:
    @staticmethod
    def get_merchant(db: Session, merchant_id: str):
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
        if not merchant:
            raise ValueError("商家不存在")
        return merchant
    
    @staticmethod
    def update_merchant(db: Session, merchant_id: str, data: dict):
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
        if not merchant:
            raise ValueError("商家不存在")
        
        for key, value in data.items():
            if hasattr(merchant, key):
                setattr(merchant, key, value)
        
        db.commit()
        db.refresh(merchant)
        return merchant
    
    @staticmethod
    def create_store(db: Session, merchant_id: str, request: StoreCreateRequest):
        store = Store(
            id=uuid.uuid4(),
            merchant_id=merchant_id,
            name=request.name,
            address=request.address,
            phone=request.phone,
            business_hours=request.business_hours,
            latitude=request.latitude,
            longitude=request.longitude
        )
        
        db.add(store)
        db.commit()
        db.refresh(store)
        return store
    
    @staticmethod
    def get_stores(db: Session, merchant_id: str):
        return db.query(Store).filter(Store.merchant_id == merchant_id).all()
    
    @staticmethod
    def get_store(db: Session, store_id: str):
        store = db.query(Store).filter(Store.id == uuid.UUID(store_id)).first()
        if not store:
            raise ValueError("门店不存在")
        return store
    
    @staticmethod
    def update_store(db: Session, store_id: str, data: dict):
        store = db.query(Store).filter(Store.id == uuid.UUID(store_id)).first()
        if not store:
            raise ValueError("门店不存在")
        
        for key, value in data.items():
            if hasattr(store, key):
                setattr(store, key, value)
        
        db.commit()
        db.refresh(store)
        return store
    
    @staticmethod
    def delete_store(db: Session, store_id: str):
        store = db.query(Store).filter(Store.id == uuid.UUID(store_id)).first()
        if not store:
            raise ValueError("门店不存在")
        
        db.delete(store)
        db.commit()
        return True
