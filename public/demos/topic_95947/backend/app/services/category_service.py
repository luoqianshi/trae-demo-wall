from sqlalchemy.orm import Session
from app.models.merchant import Category, Store
import uuid

class CategoryService:
    @staticmethod
    def get_categories(db: Session, store_id: str = None):
        query = db.query(Category).filter(Category.status == 1)
        if store_id:
            query = query.filter(Category.store_id == uuid.UUID(store_id))
        return query.order_by(Category.sort_order).all()

    @staticmethod
    def get_category(db: Session, category_id: str):
        category = db.query(Category).filter(Category.id == uuid.UUID(category_id)).first()
        if not category:
            raise ValueError("分类不存在")
        return category

    @staticmethod
    def create_category(db: Session, store_id: str, data: dict):
        category = Category(
            id=uuid.uuid4(),
            store_id=uuid.UUID(store_id),
            name=data.get("name", ""),
            icon=data.get("icon", "fas fa-utensils"),
            sort_order=data.get("sort_order", 0),
            status=1
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def update_category(db: Session, category_id: str, data: dict):
        category = db.query(Category).filter(Category.id == uuid.UUID(category_id)).first()
        if not category:
            raise ValueError("分类不存在")
        
        if "name" in data:
            category.name = data["name"]
        if "icon" in data:
            category.icon = data["icon"]
        if "sort_order" in data:
            category.sort_order = data["sort_order"]
        if "status" in data:
            category.status = data["status"]
        
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete_category(db: Session, category_id: str):
        category = db.query(Category).filter(Category.id == uuid.UUID(category_id)).first()
        if not category:
            raise ValueError("分类不存在")
        
        category.status = 0
        db.commit()
        return True

    @staticmethod
    def search_categories(db: Session, store_id: str = None, keyword: str = None):
        query = db.query(Category).filter(Category.status == 1)
        if store_id:
            query = query.filter(Category.store_id == uuid.UUID(store_id))
        if keyword:
            query = query.filter(Category.name.like(f'%{keyword}%'))
        return query.order_by(Category.sort_order).all()