from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.merchant import Member, Store, Order, Dish
from app.core.database import get_db
from app.core.security import decode_merchant_id
from fastapi.security import OAuth2PasswordBearer
import uuid

router = APIRouter(prefix="/data", tags=["数据录入"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)

@router.post("/daily")
def submit_daily_data(data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        stores = db.query(Store).filter(Store.merchant_id == merchant_id).all()
        if not stores:
            raise HTTPException(status_code=400, detail="请先创建门店")
        
        store_id = str(stores[0].id)
        
        if data.get("new_members", 0) > 0:
            for i in range(data["new_members"]):
                member = Member(
                    id=uuid.uuid4(),
                    store_id=uuid.UUID(store_id),
                    name=f"会员{i+1}",
                    phone=f"1380000{i+1:04d}",
                    level=1,
                    points=0,
                    total_spent=0,
                    last_visit=data.get("date", "")
                )
                db.add(member)
        
        if data.get("orders", 0) > 0:
            for i in range(data["orders"]):
                order = Order(
                    id=uuid.uuid4(),
                    store_id=uuid.UUID(store_id),
                    order_no=f"ORD{data.get('date', '')}{i+1:04d}",
                    total_amount=int((data.get("avg_order_value", 50) * 100)),
                    status=1,
                    payment_method="微信支付",
                    customer_name=f"顾客{i+1}",
                    customer_phone=f"1380000{i+1:04d}"
                )
                db.add(order)
        
        db.commit()
        
        return {
            "message": "数据提交成功",
            "revenue": data.get("revenue", 0),
            "orders": data.get("orders", 0),
            "new_members": data.get("new_members", 0)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily-history")
def get_daily_history(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        stores = db.query(Store).filter(Store.merchant_id == merchant_id).all()
        if not stores:
            return {"data": []}
        
        store_ids = [str(s.id) for s in stores]
        
        daily_stats = db.query(
            Member.created_at,
            func.count(Member.id).label('new_members')
        ).filter(Member.store_id.in_([uuid.UUID(sid) for sid in store_ids])) \
         .group_by(func.date(Member.created_at)) \
         .order_by(func.date(Member.created_at).desc()) \
         .limit(30).all()
        
        order_stats = db.query(
            Order.created_at,
            func.count(Order.id).label('orders'),
            func.sum(Order.total_amount).label('revenue')
        ).filter(Order.store_id.in_([uuid.UUID(sid) for sid in store_ids])) \
         .group_by(func.date(Order.created_at)) \
         .order_by(func.date(Order.created_at).desc()) \
         .limit(30).all()
        
        result = []
        date_map = {}
        
        for stat in daily_stats:
            date_str = stat.created_at.strftime('%Y-%m-%d') if stat.created_at else ''
            date_map[date_str] = {"date": date_str, "new_members": stat.new_members}
        
        for stat in order_stats:
            date_str = stat.created_at.strftime('%Y-%m-%d') if stat.created_at else ''
            if date_str in date_map:
                date_map[date_str]["orders"] = stat.orders
                date_map[date_str]["revenue"] = (stat.revenue or 0) / 100
            else:
                date_map[date_str] = {
                    "date": date_str,
                    "orders": stat.orders,
                    "revenue": (stat.revenue or 0) / 100,
                    "new_members": 0
                }
        
        result = sorted(date_map.values(), key=lambda x: x["date"], reverse=True)
        
        return {"data": result[:10]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sales-summary")
def get_sales_summary(days: int = 7, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        stores = db.query(Store).filter(Store.merchant_id == merchant_id).all()
        if not stores:
            return {
                "total_revenue": 0,
                "total_orders": 0,
                "avg_order_value": 0,
                "top_dishes": []
            }
        
        store_ids = [str(s.id) for s in stores]
        
        total_revenue = db.query(func.sum(Order.total_amount)) \
            .filter(Order.store_id.in_([uuid.UUID(sid) for sid in store_ids])).scalar() or 0
        
        total_orders = db.query(func.count(Order.id)) \
            .filter(Order.store_id.in_([uuid.UUID(sid) for sid in store_ids])).scalar() or 0
        
        avg_order_value = (total_revenue / total_orders) / 100 if total_orders > 0 else 0
        
        dish_sales = db.query(Dish.name, func.sum(Dish.sales_count).label('sales')) \
            .filter(Dish.store_id.in_([uuid.UUID(sid) for sid in store_ids])) \
            .group_by(Dish.name) \
            .order_by(func.sum(Dish.sales_count).desc()) \
            .limit(5).all()
        
        top_dishes = [{"name": d[0], "sales": d[1] or 0} for d in dish_sales]
        
        return {
            "total_revenue": total_revenue / 100,
            "total_orders": total_orders,
            "avg_order_value": round(avg_order_value, 2),
            "top_dishes": top_dishes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
