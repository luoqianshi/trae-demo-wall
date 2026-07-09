from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    verification_code: str = Field(..., min_length=6, max_length=6)

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    verification_code: str = Field(..., min_length=6, max_length=6)
    type: str = Field(..., max_length=50)
    industry: str = Field(..., max_length=50)
    region: str = Field(..., max_length=100)
    phone: str | None = None
    description: str | None = None

class EmailCodeRequest(BaseModel):
    email: EmailStr
    scene: str = Field(..., pattern="^(login|register)$")

class EmailCodeResponse(BaseModel):
    email: EmailStr
    scene: str
    code: str
    expires_in: int
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    merchant_name: str

class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    type: str
    industry: str
    region: str
    phone: str | None
    description: str | None
