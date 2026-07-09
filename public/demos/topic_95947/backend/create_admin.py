from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash
from app.models.base import Base
from app.models.merchant import Merchant

engine = create_engine('sqlite:///business_automation.db')
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)
db = Session()

existing = db.query(Merchant).filter(Merchant.email == 'admin@example.com').first()
if not existing:
    m = Merchant(
        name='测试商家',
        email='admin@example.com',
        password_hash=get_password_hash('123456'),
        type='individual',
        industry='餐饮',
        region='北京',
        phone='13800138000',
        status=1
    )
    db.add(m)
    db.commit()
    print('默认账号已创建: admin@example.com / 123456')
else:
    print('账号已存在')
