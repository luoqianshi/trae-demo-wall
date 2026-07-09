from sqlalchemy.orm import Session
from app.models.merchant import Dish, Store, Category
import uuid

class DishService:
    @staticmethod
    def _to_uuid(value, field_name: str = "id") -> uuid.UUID:
        try:
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        except (TypeError, ValueError, AttributeError):
            raise ValueError(f"无效的{field_name}")

    @staticmethod
    def _require_merchant_id(merchant_id) -> uuid.UUID:
        if not merchant_id:
            raise ValueError("缺少商户范围")
        return DishService._to_uuid(merchant_id, "商户ID")

    @staticmethod
    def _validate_store_scope(db: Session, merchant_id, store_id) -> uuid.UUID:
        merchant_uuid = DishService._require_merchant_id(merchant_id)
        store_uuid = DishService._to_uuid(store_id, "门店ID")
        store = (
            db.query(Store)
            .filter(Store.id == store_uuid, Store.merchant_id == merchant_uuid)
            .first()
        )
        if not store:
            raise ValueError("门店不存在或无权访问")
        return store_uuid

    @staticmethod
    def _scoped_dish_query(db: Session, merchant_id):
        merchant_uuid = DishService._require_merchant_id(merchant_id)
        return (
            db.query(Dish)
            .join(Store, Dish.store_id == Store.id)
            .filter(Store.merchant_id == merchant_uuid)
        )

    @staticmethod
    def _scoped_category_query(db: Session, merchant_id):
        merchant_uuid = DishService._require_merchant_id(merchant_id)
        return (
            db.query(Category)
            .join(Store, Category.store_id == Store.id)
            .filter(Store.merchant_id == merchant_uuid)
        )

    @staticmethod
    def _validate_category_scope(db: Session, merchant_id, category_id, store_id=None) -> uuid.UUID:
        category_uuid = DishService._to_uuid(category_id, "分类ID")
        query = DishService._scoped_category_query(db, merchant_id).filter(Category.id == category_uuid)
        if store_id:
            query = query.filter(Category.store_id == DishService._to_uuid(store_id, "门店ID"))
        category = query.first()
        if not category:
            raise ValueError("分类不存在或无权访问")
        return category_uuid

    @staticmethod
    def get_dishes(db: Session, merchant_id, store_id: str = None, category_id: str = None):
        query = DishService._scoped_dish_query(db, merchant_id)
        if store_id:
            scoped_store_id = DishService._validate_store_scope(db, merchant_id, store_id)
            query = query.filter(Dish.store_id == scoped_store_id)
        if category_id:
            scoped_category_id = DishService._validate_category_scope(db, merchant_id, category_id, store_id)
            query = query.filter(Dish.category_id == scoped_category_id)
        return query.all()

    @staticmethod
    def get_dish(db: Session, merchant_id, dish_id: str):
        dish = (
            DishService._scoped_dish_query(db, merchant_id)
            .filter(Dish.id == DishService._to_uuid(dish_id, "菜品ID"))
            .first()
        )
        if not dish:
            raise ValueError("菜品不存在或无权访问")
        return dish

    @staticmethod
    def create_dish(db: Session, merchant_id, store_id: str, data: dict):
        scoped_store_id = DishService._validate_store_scope(db, merchant_id, store_id)
        category_id_value = None
        if data.get("category_id"):
            category_id_value = DishService._validate_category_scope(
                db, merchant_id, data["category_id"], scoped_store_id
            )
        
        dish = Dish(
            id=uuid.uuid4(),
            store_id=scoped_store_id,
            category_id=category_id_value,
            name=data.get("name", ""),
            price=data.get("price", 0),
            description=data.get("description", ""),
            image_url=data.get("image_url", ""),
            status=data.get("status", 1),
            sales_count=data.get("sales_count", 0)
        )
        db.add(dish)
        db.commit()
        db.refresh(dish)
        return dish

    @staticmethod
    def update_dish(db: Session, merchant_id, dish_id: str, data: dict):
        dish = DishService.get_dish(db, merchant_id, dish_id)
        target_store_id = dish.store_id
        if data.get("store_id"):
            target_store_id = DishService._validate_store_scope(db, merchant_id, data["store_id"])
        
        for key, value in data.items():
            if key == "category_id" and value:
                setattr(
                    dish,
                    key,
                    DishService._validate_category_scope(db, merchant_id, value, target_store_id),
                )
            elif key == "store_id" and value:
                setattr(dish, key, target_store_id)
            elif hasattr(dish, key):
                setattr(dish, key, value)
        
        db.commit()
        db.refresh(dish)
        return dish

    @staticmethod
    def delete_dish(db: Session, merchant_id, dish_id: str):
        dish = DishService.get_dish(db, merchant_id, dish_id)
        
        db.delete(dish)
        db.commit()
        return True

    @staticmethod
    def upload_image(db: Session, merchant_id, dish_id: str, image_url: str):
        dish = DishService.get_dish(db, merchant_id, dish_id)
        
        dish.image_url = image_url
        db.commit()
        db.refresh(dish)
        return dish

    @staticmethod
    def batch_update_images(db: Session, merchant_id, updates: list):
        results = []
        for item in updates:
            dish_id = item.get("id")
            image_url = item.get("image_url")
            try:
                dish = DishService.get_dish(db, merchant_id, dish_id)
                dish.image_url = image_url
                results.append({"id": str(dish.id), "name": dish.name, "status": "success"})
            except ValueError:
                results.append({"id": dish_id, "status": "not_found"})
            except Exception as e:
                results.append({"id": dish_id, "status": "error", "error": str(e)})
        
        db.commit()
        return results

    @staticmethod
    def get_categories(db: Session, merchant_id, store_id: str = None):
        query = DishService._scoped_category_query(db, merchant_id).filter(Category.status == 1)
        if store_id:
            scoped_store_id = DishService._validate_store_scope(db, merchant_id, store_id)
            query = query.filter(Category.store_id == scoped_store_id)
        return query.order_by(Category.sort_order).all()

    @staticmethod
    def get_dishes_without_images(db: Session, merchant_id, store_id: str = None):
        query = DishService._scoped_dish_query(db, merchant_id).filter(
            Dish.image_url.is_(None) | (Dish.image_url == "")
        )
        if store_id:
            scoped_store_id = DishService._validate_store_scope(db, merchant_id, store_id)
            query = query.filter(Dish.store_id == scoped_store_id)
        return query.all()
