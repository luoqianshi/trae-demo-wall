from sqlalchemy import create_engine
from app.core.config import settings
from app.core.restaurant_modules import create_declared_restaurant_tables
from app.models.base import Base
from app.models import merchant, operation, ai

def init_database():
    engine = create_engine(settings.DATABASE_URL, echo=True)
    create_declared_restaurant_tables(engine, Base.metadata)
    print("数据库初始化完成！")

if __name__ == "__main__":
    init_database()
