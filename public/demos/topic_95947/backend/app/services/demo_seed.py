from datetime import date, datetime, timedelta
import hashlib

from sqlalchemy.orm import Session

from app.core.enums import (
    PaymentChannel,
    PaymentStatus,
    PosOrderStatus,
    ReconciliationStatus,
    RecordStatus,
    TableSessionStatus,
    TableStatus,
)
from app.core.security import get_password_hash
from app.models.advanced import (
    AuditLog,
    CouponTemplate,
    DeliveryPlatformOrder,
    DeliveryPlatformStore,
    FinancialDailyReport,
    KitchenTask,
    RiskAlert,
    Supplier,
)
from app.models.merchant import Category, Dish, Inventory, Member, Merchant, Order, Store
from app.models.operation import Competitor, OperationPlan
from app.models.payment import DailyReconciliation, PaymentTransaction
from app.models.pos import POSOrder, POSOrderItem, POSOrderLog
from app.models.table import RestaurantTable, TableArea, TableOperationLog, TableSession


DEMO_EMAIL = "demo@merchant.local"


def seed_demo_data(db: Session) -> None:
    """Seed a compact demo dataset so product pages have real content to render."""

    merchants = db.query(Merchant).order_by(Merchant.created_at.asc()).all()
    if not merchants:
        merchants = [_get_or_create_merchant(db)]

    for merchant in merchants:
        store = _get_or_create_store(db, merchant)
        categories, dishes = _seed_menu(db, store)
        areas, tables = _seed_tables(db, store)
        orders = _seed_pos_orders(db, store, tables, dishes)
        _seed_payments(db, store, orders)
        _seed_business_data(db, merchant, store, dishes)
        _seed_advanced_data(db, store, orders)
    db.commit()


def _store_demo_prefix(store: Store) -> str:
    return f"DEMO-{str(store.id).replace('-', '')[:8].upper()}"


def _store_demo_phone(store: Store, offset: int = 0) -> str:
    seed = int(hashlib.md5(str(store.id).encode("utf-8")).hexdigest()[:8], 16)
    suffix = (seed + offset) % 100000000
    return f"188{suffix:08d}"


def _get_or_create_merchant(db: Session) -> Merchant:
    merchant = (
        db.query(Merchant)
        .filter(Merchant.email.in_(["test_user@example.com", DEMO_EMAIL]))
        .order_by(Merchant.created_at.asc())
        .first()
    )
    if merchant:
        return merchant

    merchant = Merchant(
        name="示例餐饮商家",
        type="正餐",
        industry="餐饮",
        region="杭州",
        status=1,
        email=DEMO_EMAIL,
        password_hash=get_password_hash("123456"),
        phone="18800001111",
        description="用于本地演示的餐饮商家数据。",
    )
    db.add(merchant)
    db.flush()
    return merchant


def _get_or_create_store(db: Session, merchant: Merchant) -> Store:
    store = (
        db.query(Store)
        .filter(Store.merchant_id == merchant.id, Store.name == "湖滨示范店")
        .first()
    )
    if store:
        return store

    store = Store(
        merchant_id=merchant.id,
        name="湖滨示范店",
        address="杭州市上城区湖滨商圈 88 号",
        phone="0571-88889999",
        business_hours="10:30-22:00",
        status=1,
        latitude="30.259",
        longitude="120.169",
    )
    db.add(store)
    db.flush()
    return store


def _seed_menu(db: Session, store: Store) -> tuple[list[Category], list[Dish]]:
    category_specs = [
        ("招牌热卖", "fas fa-fire", 1),
        ("午市套餐", "fas fa-bowl-food", 2),
        ("小食饮品", "fas fa-mug-hot", 3),
    ]
    categories = []
    for name, icon, sort_order in category_specs:
        category = (
            db.query(Category)
            .filter(Category.store_id == store.id, Category.name == name)
            .first()
        )
        if not category:
            category = Category(
                store_id=store.id,
                name=name,
                icon=icon,
                sort_order=sort_order,
                status=1,
            )
            db.add(category)
            db.flush()
        categories.append(category)

    dish_specs = [
        ("招牌红烧肉", 6800, "肥瘦均衡，适合堂食主推", categories[0], 128),
        ("青花椒酸菜鱼", 8800, "多人桌高复购菜品", categories[0], 96),
        ("黑椒牛肉饭", 3600, "午市出餐快，毛利稳定", categories[1], 214),
        ("鲜虾云吞面", 3200, "适合轻食与外卖场景", categories[1], 156),
        ("手作桂花冻", 1800, "加购率高的甜品", categories[2], 132),
        ("冷萃乌龙茶", 1600, "搭配套餐提升客单价", categories[2], 188),
    ]
    dishes = []
    for name, price, description, category, sales_count in dish_specs:
        dish = db.query(Dish).filter(Dish.store_id == store.id, Dish.name == name).first()
        if not dish:
            dish = Dish(
                store_id=store.id,
                category_id=category.id,
                name=name,
                price=price,
                description=description,
                status=1,
                sales_count=sales_count,
            )
            db.add(dish)
            db.flush()
        dishes.append(dish)
        if not db.query(Inventory).filter(Inventory.store_id == store.id, Inventory.dish_id == dish.id).first():
            db.add(Inventory(store_id=store.id, dish_id=dish.id, quantity=80, min_stock=15, max_stock=160, unit="份"))
    return categories, dishes


def _seed_tables(db: Session, store: Store) -> tuple[list[TableArea], list[RestaurantTable]]:
    area_specs = [("大厅", "hall", 1), ("包间", "private", 2)]
    areas = []
    for name, code, sort_order in area_specs:
        area = (
            db.query(TableArea)
            .filter(TableArea.merchant_id == store.merchant_id, TableArea.store_id == store.id, TableArea.code == code)
            .first()
        )
        if not area:
            area = TableArea(
                merchant_id=store.merchant_id,
                store_id=store.id,
                name=name,
                code=code,
                sort_order=sort_order,
                status=RecordStatus.ENABLED.value,
                description=f"{name}堂食区域",
            )
            db.add(area)
            db.flush()
        areas.append(area)

    table_specs = [
        ("A01", "临窗二人桌", 2, areas[0], TableStatus.AVAILABLE.value, 1),
        ("A02", "四人散台", 4, areas[0], TableStatus.OCCUPIED.value, 2),
        ("A03", "拼桌长台", 6, areas[0], TableStatus.CLEANING.value, 3),
        ("B01", "商务包间", 8, areas[1], TableStatus.RESERVED.value, 1),
    ]
    tables = []
    for table_no, name, seats, area, status, sort_order in table_specs:
        table = (
            db.query(RestaurantTable)
            .filter(RestaurantTable.merchant_id == store.merchant_id, RestaurantTable.store_id == store.id, RestaurantTable.table_no == table_no)
            .first()
        )
        if not table:
            table = RestaurantTable(
                merchant_id=store.merchant_id,
                store_id=store.id,
                area_id=area.id,
                table_no=table_no,
                name=name,
                seats=seats,
                status=status,
                enabled=RecordStatus.ENABLED.value,
                sort_order=sort_order,
                remark="演示桌台",
            )
            db.add(table)
            db.flush()
        tables.append(table)

    return areas, tables


def _seed_pos_orders(db: Session, store: Store, tables: list[RestaurantTable], dishes: list[Dish]) -> list[POSOrder]:
    prefix = _store_demo_prefix(store)
    order_specs = [
        (f"{prefix}-POS-001", tables[1], PosOrderStatus.SUSPENDED.value, [("招牌红烧肉", 1), ("冷萃乌龙茶", 2)], None),
        (f"{prefix}-POS-002", tables[0], PosOrderStatus.PAID.value, [("黑椒牛肉饭", 2), ("手作桂花冻", 2)], datetime.utcnow() - timedelta(hours=2)),
        (f"{prefix}-POS-003", None, PosOrderStatus.PAID.value, [("青花椒酸菜鱼", 1), ("鲜虾云吞面", 1)], datetime.utcnow() - timedelta(days=1, hours=1)),
    ]
    dish_map = {dish.name: dish for dish in dishes}
    orders = []
    for order_no, table, status, item_specs, paid_at in order_specs:
        order = db.query(POSOrder).filter(POSOrder.merchant_id == store.merchant_id, POSOrder.order_no == order_no).first()
        if not order:
            subtotal = sum(dish_map[name].price * quantity for name, quantity in item_specs)
            order = POSOrder(
                merchant_id=store.merchant_id,
                store_id=store.id,
                order_no=order_no,
                table_id=table.id if table else None,
                status=status,
                party_size=2 if table and table.seats <= 4 else 4,
                subtotal_amount=subtotal,
                discount_amount=0,
                rounding_amount=0,
                payable_amount=subtotal,
                paid_amount=subtotal if status == PosOrderStatus.PAID.value else 0,
                note="演示 POS 订单",
                suspended_at=datetime.utcnow() - timedelta(minutes=18) if status == PosOrderStatus.SUSPENDED.value else None,
                paid_at=paid_at,
            )
            db.add(order)
            db.flush()
            for name, quantity in item_specs:
                dish = dish_map[name]
                db.add(POSOrderItem(
                    merchant_id=store.merchant_id,
                    store_id=store.id,
                    order_id=order.id,
                    dish_id=dish.id,
                    dish_name=dish.name,
                    unit_price=dish.price,
                    quantity=quantity,
                    subtotal_amount=dish.price * quantity,
                    total_amount=dish.price * quantity,
                ))
            db.add(POSOrderLog(
                merchant_id=store.merchant_id,
                store_id=store.id,
                order_id=order.id,
                action="demo_seed",
                after_status=status,
                detail="初始化演示订单",
            ))
        orders.append(order)

        if table and status == PosOrderStatus.SUSPENDED.value:
            table.status = TableStatus.OCCUPIED.value
            table.current_pos_order_id = order.id

    if tables:
        session_no = f"{prefix}-SESSION-A02"
        session = (
            db.query(TableSession)
            .filter(TableSession.merchant_id == store.merchant_id, TableSession.session_no == session_no)
            .first()
        )
        if not session:
            session = TableSession(
                merchant_id=store.merchant_id,
                store_id=store.id,
                session_no=session_no,
                table_id=tables[1].id,
                party_size=2,
                status=TableSessionStatus.OPEN.value,
                current_pos_order_id=orders[0].id,
                order_count=1,
                note="演示开台会话",
            )
            db.add(session)
            db.flush()
            tables[1].current_session_id = session.id
            orders[0].table_session_id = session.id
            db.add(TableOperationLog(
                merchant_id=store.merchant_id,
                store_id=store.id,
                table_id=tables[1].id,
                session_id=session.id,
                action="open_table",
                before_status=TableStatus.AVAILABLE.value,
                after_status=TableStatus.OCCUPIED.value,
                detail="演示数据：A02 开台并挂单",
            ))
    return orders


def _seed_payments(db: Session, store: Store, orders: list[POSOrder]) -> None:
    prefix = _store_demo_prefix(store)
    paid_orders = [order for order in orders if order.status == PosOrderStatus.PAID.value]
    channels = [PaymentChannel.WECHAT.value, PaymentChannel.ALIPAY.value]
    for index, order in enumerate(paid_orders, start=1):
        payment_no = f"{prefix}-PAY-{index:03d}"
        if not db.query(PaymentTransaction).filter(PaymentTransaction.merchant_id == store.merchant_id, PaymentTransaction.payment_no == payment_no).first():
            db.add(PaymentTransaction(
                merchant_id=store.merchant_id,
                store_id=store.id,
                payment_no=payment_no,
                order_id=order.id,
                channel=channels[(index - 1) % len(channels)],
                amount=order.payable_amount,
                status=PaymentStatus.SUCCESS.value,
                paid_at=order.paid_at or datetime.utcnow(),
                external_trade_no=f"{prefix}-TRADE-{index:03d}",
                remark="演示支付流水",
            ))

    for channel in channels:
        reconciliation = (
            db.query(DailyReconciliation)
            .filter(
                DailyReconciliation.merchant_id == store.merchant_id,
                DailyReconciliation.store_id == store.id,
                DailyReconciliation.reconciliation_date == date.today(),
                DailyReconciliation.channel == channel,
            )
            .first()
        )
        if not reconciliation:
            amount = sum(order.payable_amount for order in paid_orders if (channels[paid_orders.index(order) % len(channels)] == channel))
            db.add(DailyReconciliation(
                merchant_id=store.merchant_id,
                store_id=store.id,
                reconciliation_date=date.today(),
                channel=channel,
                payment_amount=amount,
                payment_count=1 if amount else 0,
                refund_amount=0,
                refund_count=0,
                net_amount=amount,
                variance_amount=0,
                status=ReconciliationStatus.CONFIRMED.value,
                remark="演示日对账记录",
            ))


def _seed_business_data(db: Session, merchant: Merchant, store: Store, dishes: list[Dish]) -> None:
    prefix = _store_demo_prefix(store)
    member_phone = _store_demo_phone(store)
    if not db.query(Member).filter(Member.phone == member_phone).first():
        db.add(Member(store_id=store.id, name="林女士", phone=member_phone, level=2, points=680, total_spent=32600, last_visit=str(date.today())))

    for index in range(1, 6):
        order_no = f"{prefix}-ORDER-{index:03d}"
        if not db.query(Order).filter(Order.store_id == store.id, Order.order_no == order_no).first():
            db.add(Order(
                store_id=store.id,
                order_no=order_no,
                total_amount=3200 + index * 900,
                status=1,
                payment_method="wechat" if index % 2 else "alipay",
                customer_name=f"顾客{index}",
                customer_phone=_store_demo_phone(store, index),
            ))

    competitor_specs = [
        ("隔壁小馆", "正餐", "美团", "湖滨商圈", "https://example.com/meituan-demo"),
        ("巷口面馆", "快餐", "大众点评", "延安路", "https://example.com/dianping-demo"),
        ("轻食研究所", "轻食", "小红书", "武林路", "https://example.com/redbook-demo"),
    ]
    for name, type_name, platform, region, url in competitor_specs:
        if not db.query(Competitor).filter(Competitor.merchant_id == merchant.id, Competitor.name == name).first():
            db.add(Competitor(merchant_id=merchant.id, name=name, type=type_name, platform=platform, region=region, url=url))

    if not db.query(OperationPlan).filter(OperationPlan.merchant_id == merchant.id, OperationPlan.title == "午市套餐提升计划").first():
        db.add(OperationPlan(
            merchant_id=merchant.id,
            title="午市套餐提升计划",
            type="营销活动",
            content={"target": "午市客单价", "actions": ["套餐组合", "收银推荐", "会员券"]},
            ai_suggestion="优先组合黑椒牛肉饭和桂花冻，提升 12:00-13:30 时段客单价。",
            status=0,
            effect_score=82.0,
        ))


def _seed_advanced_data(db: Session, store: Store, orders: list[POSOrder]) -> None:
    if orders and not db.query(KitchenTask).filter(KitchenTask.merchant_id == store.merchant_id, KitchenTask.store_id == store.id).first():
        db.add_all([
            KitchenTask(merchant_id=store.merchant_id, store_id=store.id, order_id=orders[0].id, dish_name="招牌红烧肉", quantity=1, status="pending", station="热菜", urge_count=1, note="A02 催菜"),
            KitchenTask(merchant_id=store.merchant_id, store_id=store.id, order_id=orders[0].id, dish_name="冷萃乌龙茶", quantity=2, status="cooking", station="饮品", started_at=datetime.utcnow() - timedelta(minutes=6)),
        ])

    if not db.query(Supplier).filter(Supplier.merchant_id == store.merchant_id, Supplier.store_id == store.id, Supplier.name == "鲜达供应链").first():
        db.add(Supplier(merchant_id=store.merchant_id, store_id=store.id, name="鲜达供应链", contact_name="周经理", phone="13800004444", category="肉禽蔬菜", remark="每日 9 点前配送"))

    if not db.query(FinancialDailyReport).filter(FinancialDailyReport.merchant_id == store.merchant_id, FinancialDailyReport.store_id == store.id, FinancialDailyReport.report_date == date.today()).first():
        db.add(FinancialDailyReport(
            merchant_id=store.merchant_id,
            store_id=store.id,
            report_date=date.today(),
            revenue_amount=186400,
            refund_amount=0,
            net_amount=186400,
            purchase_cost=68200,
            gross_profit=118200,
            order_count=42,
            avg_order_amount=4438,
            channel_summary='{"wechat": 98200, "alipay": 61200, "cash": 27000}',
        ))

    if not db.query(CouponTemplate).filter(CouponTemplate.merchant_id == store.merchant_id, CouponTemplate.store_id == store.id, CouponTemplate.name == "午市满减券").first():
        db.add(CouponTemplate(merchant_id=store.merchant_id, store_id=store.id, name="午市满减券", coupon_type="cash", threshold_amount=6800, discount_amount=1200, status="active", rules="工作日午市可用"))

    if not db.query(DeliveryPlatformStore).filter(DeliveryPlatformStore.merchant_id == store.merchant_id, DeliveryPlatformStore.store_id == store.id).first():
        platform_store = DeliveryPlatformStore(merchant_id=store.merchant_id, store_id=store.id, platform="meituan", platform_store_id=f"MT-{_store_demo_prefix(store)}", name="湖滨示范店-美团", status="active")
        db.add(platform_store)
        db.flush()
        db.add(DeliveryPlatformOrder(merchant_id=store.merchant_id, store_id=store.id, platform="meituan", platform_order_no=f"MT-{_store_demo_prefix(store)}-ORDER-001", platform_store_id=platform_store.id, amount=5600, status="finished", voucher_code=f"MTV-{_store_demo_prefix(store)}", remark="演示外卖订单"))

    if not db.query(AuditLog).filter(AuditLog.merchant_id == store.merchant_id, AuditLog.store_id == store.id, AuditLog.action == "price_update").first():
        db.add(AuditLog(merchant_id=store.merchant_id, store_id=store.id, action="price_update", target_type="dish", target_id="招牌红烧肉", before_value="¥62", after_value="¥68", reason="演示审计记录", risk_level="low"))

    if not db.query(RiskAlert).filter(RiskAlert.merchant_id == store.merchant_id, RiskAlert.title == "午市出餐压力偏高").first():
        db.add(RiskAlert(merchant_id=store.merchant_id, store_id=store.id, alert_type="kitchen_delay", title="午市出餐压力偏高", description="12:00-13:00 热菜档待制作任务较集中。", risk_level="medium", status="open", evidence="演示数据：热菜档待制作 6 单"))
