from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# 模拟用户数据
mock_users = [
    {"id": 1, "username": "admin", "name": "管理员", "role": "admin", "email": "admin@disaster.com", "status": "online"},
    {"id": 2, "username": "wangjg", "name": "王建国", "role": "commander", "email": "wangjg@disaster.com", "status": "online"},
    {"id": 3, "username": "liming", "name": "李明", "role": "manager", "email": "liming@disaster.com", "status": "offline"},
    {"id": 4, "username": "zhangwei", "name": "张伟", "role": "operator", "email": "zhangwei@disaster.com", "status": "online"},
]

@router.get("/")
async def get_users():
    return {"users": mock_users}

@router.get("/{user_id}")
async def get_user(user_id: int):
    for user in mock_users:
        if user["id"] == user_id:
            return user
    raise HTTPException(status_code=404, detail="用户不存在")