from sqlalchemy.orm import Session
from app.models.merchant import Merchant
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import verify_password, get_password_hash, create_access_token
from app.services.verification_service import VerificationCodeService
from datetime import timedelta
from app.core.config import settings

class AuthService:
    @staticmethod
    def register(db: Session, request: RegisterRequest):
        existing_merchant = db.query(Merchant).filter(Merchant.email == request.email).first()
        if existing_merchant:
            raise ValueError("该邮箱已被注册")
        
        VerificationCodeService.verify_email_code(request.email, "register", request.verification_code)

        merchant = Merchant(
            name=request.name,
            email=request.email,
            password_hash=get_password_hash(request.password),
            type=request.type,
            industry=request.industry,
            region=request.region,
            phone=request.phone,
            description=request.description
        )
        
        db.add(merchant)
        db.commit()
        db.refresh(merchant)
        return merchant
    
    @staticmethod
    def login(db: Session, request: LoginRequest):
        merchant = db.query(Merchant).filter(Merchant.email == request.email).first()
        if not merchant or not verify_password(request.password, merchant.password_hash):
            raise ValueError("邮箱或密码错误")
        
        if merchant.status != 1:
            raise ValueError("账号已被禁用")
        
        VerificationCodeService.verify_email_code(request.email, "login", request.verification_code)

        return AuthService.create_token_response(merchant)

    @staticmethod
    def create_token_response(merchant: Merchant):
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(merchant.id), "email": merchant.email},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": str(merchant.id),
            "merchant_name": merchant.name
        }
    
    @staticmethod
    def get_profile(db: Session, merchant_id: str):
        merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
        if not merchant:
            raise ValueError("商家不存在")
        return merchant
