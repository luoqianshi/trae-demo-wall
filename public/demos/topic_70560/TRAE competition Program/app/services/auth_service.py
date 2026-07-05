import os
import json
import httpx
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, Dict

SECRET_KEY = "AI-Edu-Data-Cleaner-JWT-Secret-Key-2024-0704"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

class AuthService:
    def __init__(self):
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id: int = payload.get("user_id")
            username: str = payload.get("username")
            role: str = payload.get("role")
            if user_id is None or username is None:
                return None
            return {
                "user_id": user_id,
                "username": username,
                "role": role
            }
        except JWTError:
            return None
    
    async def verify_captcha(self, captcha_token: str) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://www.google.com/recaptcha/api/siteverify",
                    data={
                        "secret": "6LfBnYwoAAAAAN7R0R5wU0Hw5i2r0J40JzZ9w7x1",
                        "response": captcha_token
                    },
                    timeout=10
                )
                result = response.json()
                return result.get("success", False)
        except Exception:
            return True
    
    def validate_username(self, username: str) -> bool:
        if not username or len(username) < 3 or len(username) > 50:
            return False
        return username.isalnum()
    
    def validate_password(self, password: str) -> bool:
        if not password or len(password) < 6:
            return False
        return True
    
    async def validate_invite_code(self, invite_code: str) -> bool:
        config_path = os.path.join(os.path.dirname(__file__), "..", "config", "admin_config.json")
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
            invite_code_hash = config.get("invite_code_hash")
            
            import bcrypt
            return bcrypt.checkpw(invite_code.encode('utf-8'), invite_code_hash.encode('utf-8'))
        except Exception:
            return False

auth_service = AuthService()