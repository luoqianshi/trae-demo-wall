from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

from app.services.auth_service import auth_service
from app.services.crypto_service import crypto_service
from app.services.local_storage import local_storage

router = APIRouter(prefix="/api/auth", tags=["auth"])

security = HTTPBearer()

class RegisterRequest(BaseModel):
    username: str
    password: str
    invite_code: Optional[str] = None
    captcha_token: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str
    captcha_token: Optional[str] = None

class CaptchaRequest(BaseModel):
    captcha_token: str

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user_data = auth_service.verify_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="无效的令牌")
    return user_data

@router.post("/register")
async def register(request: RegisterRequest, response: Response):
    if not auth_service.validate_username(request.username):
        raise HTTPException(status_code=400, detail="用户名无效，需要3-50位字母数字")
    
    if not auth_service.validate_password(request.password):
        raise HTTPException(status_code=400, detail="密码无效，至少需要6位")
    
    if request.captcha_token:
        captcha_valid = await auth_service.verify_captcha(request.captcha_token)
        if not captcha_valid:
            raise HTTPException(status_code=400, detail="验证码验证失败")
    
    existing_user = await local_storage.get_user_by_username(request.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    
    role = "user"
    if request.invite_code:
        invite_valid = await auth_service.validate_invite_code(request.invite_code)
        if not invite_valid:
            raise HTTPException(status_code=400, detail="邀请码无效")
        
        admin_count = await local_storage.get_admin_count()
        if admin_count > 0:
            raise HTTPException(status_code=400, detail="管理员账号已存在")
        
        role = "admin"
    
    password_hash = crypto_service.hash_password(request.password)
    
    try:
        user_id = await local_storage.create_user(request.username, password_hash, role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"注册失败: {str(e)}")
    
    token = auth_service.create_access_token({
        "user_id": user_id,
        "username": request.username,
        "role": role
    })
    
    response.set_cookie(
        key="auth_token",
        value=token,
        path="/",
        httponly=True,
        samesite="lax",
        max_age=3600
    )
    
    return {
        "success": True,
        "message": "注册成功",
        "token": token,
        "user": {
            "id": user_id,
            "username": request.username,
            "role": role
        }
    }

@router.post("/login")
async def login(request: LoginRequest, response: Response):
    if not request.username or not request.password:
        raise HTTPException(status_code=400, detail="用户名和密码不能为空")
    
    if request.captcha_token:
        captcha_valid = await auth_service.verify_captcha(request.captcha_token)
        if not captcha_valid:
            raise HTTPException(status_code=400, detail="验证码验证失败")
    
    user = await local_storage.get_user_by_username(request.username)
    if not user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    if not crypto_service.verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    await local_storage.update_last_login(user["id"])
    
    token = auth_service.create_access_token({
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"]
    })
    
    response.set_cookie(
        key="auth_token",
        value=token,
        path="/",
        httponly=True,
        samesite="lax",
        max_age=3600
    )
    
    return {
        "success": True,
        "message": "登录成功",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"]
        }
    }

@router.post("/verify_captcha")
async def verify_captcha(request: CaptchaRequest):
    if not request.captcha_token:
        return {"success": True, "message": "跳过验证"}
    
    valid = await auth_service.verify_captcha(request.captcha_token)
    if valid:
        return {"success": True, "message": "验证成功"}
    else:
        raise HTTPException(status_code=400, detail="验证码验证失败")

@router.get("/me")
async def get_current_user_info(user_data: dict = Depends(get_current_user)):
    user = await local_storage.get_user_by_username(user_data["username"])
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    return {
        "success": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "created_at": user["created_at"],
            "last_login": user["last_login"]
        }
    }

@router.post("/logout")
async def logout(response: Response):
    return {
        "success": True,
        "message": "退出登录成功"
    }