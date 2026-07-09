from dataclasses import dataclass, field
from importlib import import_module, util
from typing import Iterable, Sequence


@dataclass(frozen=True)
class TableSpec:
    """P0 餐饮核心模块表设计约束。"""

    model_name: str
    table_name: str
    scope_fields: tuple[str, ...]
    relationships: tuple[str, ...] = field(default_factory=tuple)


EMPLOYEE_PERMISSION_TABLES = (
    TableSpec(
        model_name="Employee",
        table_name="employees",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "role_id -> employee_roles.id"),
    ),
    TableSpec(
        model_name="EmployeeRole",
        table_name="employee_roles",
        scope_fields=("merchant_id",),
        relationships=("merchant_id -> merchants.id",),
    ),
    TableSpec(
        model_name="Permission",
        table_name="permissions",
        scope_fields=(),
        relationships=(),
    ),
    TableSpec(
        model_name="RolePermission",
        table_name="role_permissions",
        scope_fields=("merchant_id",),
        relationships=("merchant_id -> merchants.id", "role_id -> employee_roles.id", "permission_id -> permissions.id"),
    ),
    TableSpec(
        model_name="EmployeeStoreAccess",
        table_name="employee_store_access",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "employee_id -> employees.id", "store_id -> stores.id"),
    ),
    TableSpec(
        model_name="EmployeeOperationLog",
        table_name="employee_operation_logs",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "employee_id -> employees.id"),
    ),
)

TABLE_DINING_TABLES = (
    TableSpec(
        model_name="TableArea",
        table_name="table_areas",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id"),
    ),
    TableSpec(
        model_name="DiningTable",
        table_name="dining_tables",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "area_id -> table_areas.id"),
    ),
    TableSpec(
        model_name="TableSession",
        table_name="table_sessions",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "table_id -> dining_tables.id"),
    ),
    TableSpec(
        model_name="TableOperationLog",
        table_name="table_operation_logs",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "table_id -> dining_tables.id"),
    ),
)

POS_TABLES = (
    TableSpec(
        model_name="POSOrder",
        table_name="pos_orders",
        scope_fields=("merchant_id", "store_id"),
        relationships=(
            "merchant_id -> merchants.id",
            "store_id -> stores.id",
            "table_id -> dining_tables.id",
            "table_session_id -> table_sessions.id",
        ),
    ),
    TableSpec(
        model_name="POSOrderItem",
        table_name="pos_order_items",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "order_id -> pos_orders.id", "dish_id -> dishes.id"),
    ),
    TableSpec(
        model_name="POSRefund",
        table_name="pos_refunds",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "order_id -> pos_orders.id"),
    ),
    TableSpec(
        model_name="POSOrderLog",
        table_name="pos_order_logs",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "order_id -> pos_orders.id"),
    ),
)

PAYMENT_RECONCILIATION_TABLES = (
    TableSpec(
        model_name="PaymentTransaction",
        table_name="payment_transactions",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "order_id -> pos_orders.id"),
    ),
    TableSpec(
        model_name="RefundTransaction",
        table_name="refund_transactions",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "payment_id -> payment_transactions.id"),
    ),
    TableSpec(
        model_name="DailyReconciliation",
        table_name="daily_reconciliations",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id"),
    ),
    TableSpec(
        model_name="ReconciliationVariance",
        table_name="reconciliation_variances",
        scope_fields=("merchant_id", "store_id"),
        relationships=("merchant_id -> merchants.id", "store_id -> stores.id", "reconciliation_id -> daily_reconciliations.id"),
    ),
)

P0_RESTAURANT_TABLE_SPECS = (
    *EMPLOYEE_PERMISSION_TABLES,
    *TABLE_DINING_TABLES,
    *POS_TABLES,
    *PAYMENT_RECONCILIATION_TABLES,
)

P0_MODEL_MODULES = (
    "app.models.employee",
    "app.models.table",
    "app.models.pos",
    "app.models.payment",
)


def get_table_specs(module: str | None = None) -> tuple[TableSpec, ...]:
    """返回后续 P0 模型命名、表关系与隔离字段约束。"""

    if module == "employee":
        return EMPLOYEE_PERMISSION_TABLES
    if module == "table":
        return TABLE_DINING_TABLES
    if module == "pos":
        return POS_TABLES
    if module == "payment":
        return PAYMENT_RECONCILIATION_TABLES
    return P0_RESTAURANT_TABLE_SPECS


def assert_table_specs_have_scope(specs: Iterable[TableSpec] = P0_RESTAURANT_TABLE_SPECS) -> None:
    """检查除全局权限码外的新增表均具备 merchant_id 隔离字段。"""

    invalid_tables = [
        spec.table_name
        for spec in specs
        if spec.table_name != "permissions" and "merchant_id" not in spec.scope_fields
    ]
    if invalid_tables:
        raise ValueError(f"以下表缺少 merchant_id 隔离字段: {', '.join(invalid_tables)}")


def import_declared_model_modules(module_names: Sequence[str] = P0_MODEL_MODULES) -> list[str]:
    """按需导入后续模型模块；模块不存在时跳过，避免影响当前系统启动。"""

    imported = []
    for module_name in module_names:
        if util.find_spec(module_name) is None:
            continue
        import_module(module_name)
        imported.append(module_name)
    return imported


def create_declared_restaurant_tables(engine, base_metadata) -> list[str]:
    """最小迁移策略：导入已声明的新模型后，仅创建缺失表，不改动旧表。"""

    imported = import_declared_model_modules()
    base_metadata.create_all(bind=engine)
    return imported
