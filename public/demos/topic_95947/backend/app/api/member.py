from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.services.member_service import MemberService
from app.core.database import get_db
from app.core.security import decode_merchant_id
from fastapi.security import OAuth2PasswordBearer
from typing import List
import uuid

router = APIRouter(prefix="/members", tags=["会员管理"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)

@router.get("/stats/overview")
def get_member_stats(store_id: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        stats = MemberService.get_member_stats(db, merchant_id, store_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return stats

@router.get("/stats/level-distribution")
def get_level_distribution(store_id: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        distribution = MemberService.get_member_level_distribution(db, merchant_id, store_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return distribution

@router.get("/top-active")
def get_top_active_members(store_id: str = None, limit: int = 5, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        members = MemberService.get_top_active_members(db, merchant_id, store_id, limit)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return [{
        "id": str(m.id),
        "name": m.name,
        "level": m.level,
        "total_spent": m.total_spent,
        "points": m.points
    } for m in members]

@router.get("/")
def get_members(store_id: str = None, keyword: str = None, level: int = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        members = MemberService.get_members(db, merchant_id, store_id, keyword, level)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return [{
        "id": str(m.id),
        "store_id": str(m.store_id),
        "name": m.name,
        "phone": m.phone,
        "level": m.level,
        "points": m.points,
        "total_spent": m.total_spent,
        "last_visit": m.last_visit,
        "created_at": m.created_at,
        "updated_at": m.updated_at
    } for m in members]

@router.get("/{member_id}")
def get_member(member_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        member = MemberService.get_member(db, merchant_id, member_id)
        return {
            "id": str(member.id),
            "store_id": str(member.store_id),
            "name": member.name,
            "phone": member.phone,
            "level": member.level,
            "points": member.points,
            "total_spent": member.total_spent,
            "last_visit": member.last_visit,
            "created_at": member.created_at,
            "updated_at": member.updated_at
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/")
def create_member(data: dict, store_id: str = None, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        if not store_id:
            from app.services.merchant_service import MerchantService
            stores = MerchantService.get_stores(db, merchant_id)
            if stores:
                store_id = str(stores[0].id)
            else:
                raise HTTPException(status_code=400, detail="请先创建门店")
        
        member = MemberService.create_member(db, merchant_id, store_id, data)
        return {
            "id": str(member.id),
            "name": member.name,
            "phone": member.phone,
            "level": member.level,
            "points": member.points,
            "total_spent": member.total_spent,
            "last_visit": member.last_visit
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{member_id}")
def update_member(member_id: str, data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        member = MemberService.update_member(db, merchant_id, member_id, data)
        return {"message": "更新成功", "id": str(member.id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{member_id}")
def delete_member(member_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        MemberService.delete_member(db, merchant_id, member_id)
        return {"message": "删除成功"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
