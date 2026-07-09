from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.auth import EmailCodeRequest, EmailCodeResponse, LoginRequest, RegisterRequest, TokenResponse, UserProfileResponse
from app.services.auth_service import AuthService
from app.services.verification_service import VerificationCodeService
from app.core.database import get_db
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["认证"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        merchant = AuthService.register(db, request)
        return AuthService.create_token_response(merchant)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/email-code", response_model=EmailCodeResponse)
def send_email_code(request: EmailCodeRequest):
    code_result = VerificationCodeService.generate_email_code(request.email, request.scene)
    return EmailCodeResponse(**code_result)

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        return AuthService.login(db, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile", response_model=UserProfileResponse)
def get_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from app.core.security import decode_access_token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="无效的token")
    
    merchant_id = payload.get("sub")
    try:
        merchant = AuthService.get_profile(db, merchant_id)
        return UserProfileResponse(
            id=str(merchant.id),
            name=merchant.name,
            email=merchant.email,
            type=merchant.type,
            industry=merchant.industry,
            region=merchant.region,
            phone=merchant.phone,
            description=merchant.description
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
