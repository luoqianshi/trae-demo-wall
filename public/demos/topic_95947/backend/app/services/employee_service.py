import uuid
from typing import Iterable, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.enums import EmployeeStatus, PermissionAction, RecordStatus
from app.core.scoping import (
    apply_merchant_scope,
    apply_store_scope,
    require_merchant_id,
    to_uuid,
    validate_store_scope,
)
from app.models.employee import (
    Employee,
    EmployeeOperationLog,
    EmployeeRole,
    EmployeeStoreAccess,
    Permission,
    RolePermission,
)


DEFAULT_PERMISSIONS = (
    ("employee.read", "查看员工", "employee", PermissionAction.READ.value),
    ("employee.create", "创建员工", "employee", PermissionAction.CREATE.value),
    ("employee.update", "编辑员工", "employee", PermissionAction.UPDATE.value),
    ("employee.disable", "启停员工", "employee", PermissionAction.UPDATE.value),
    ("employee.store.authorize", "员工门店授权", "employee", PermissionAction.APPROVE.value),
    ("role.read", "查看角色", "role", PermissionAction.READ.value),
    ("role.authorize", "角色授权", "role", PermissionAction.APPROVE.value),
    ("store.read", "查看门店", "store", PermissionAction.READ.value),
)


class EmployeeService:
    @staticmethod
    def _get_employee(db: Session, merchant_id, employee_id) -> Employee:
        employee_uuid = to_uuid(employee_id, "员工ID")
        employee = (
            apply_merchant_scope(
                db.query(Employee)
                .options(
                    joinedload(Employee.role),
                    joinedload(Employee.store),
                    joinedload(Employee.store_access).joinedload(EmployeeStoreAccess.store),
                ),
                Employee,
                merchant_id,
            )
            .filter(Employee.id == employee_uuid)
            .first()
        )
        if not employee:
            raise ValueError("员工不存在或无权访问")
        return employee

    @staticmethod
    def _validate_role_scope(db: Session, merchant_id, role_id) -> Optional[uuid.UUID]:
        if not role_id:
            return None
        role_uuid = to_uuid(role_id, "角色ID")
        role = (
            apply_merchant_scope(db.query(EmployeeRole), EmployeeRole, merchant_id)
            .filter(EmployeeRole.id == role_uuid)
            .first()
        )
        if not role:
            raise ValueError("角色不存在或无权访问")
        return role_uuid

    @staticmethod
    def _normalize_store_ids(db: Session, merchant_id, store_ids: Iterable[str]) -> list[uuid.UUID]:
        normalized = []
        seen = set()
        for store_id in store_ids:
            store_uuid = validate_store_scope(db, merchant_id, store_id)
            if store_uuid not in seen:
                normalized.append(store_uuid)
                seen.add(store_uuid)
        return normalized

    @staticmethod
    def _write_log(
        db: Session,
        merchant_id,
        action: str,
        target_type: str,
        target_id=None,
        employee_id=None,
        store_id=None,
        detail: Optional[str] = None,
    ) -> EmployeeOperationLog:
        merchant_uuid = require_merchant_id(merchant_id)
        log = EmployeeOperationLog(
            id=uuid.uuid4(),
            merchant_id=merchant_uuid,
            employee_id=to_uuid(employee_id, "员工ID") if employee_id else None,
            store_id=validate_store_scope(db, merchant_uuid, store_id) if store_id else None,
            action=action,
            target_type=target_type,
            target_id=to_uuid(target_id, "目标ID") if target_id else None,
            detail=detail,
        )
        db.add(log)
        return log

    @staticmethod
    def _sync_store_access(db: Session, merchant_id, employee: Employee, store_ids: Iterable[str]) -> None:
        store_uuids = EmployeeService._normalize_store_ids(db, merchant_id, store_ids)
        existing = {
            item.store_id: item
            for item in db.query(EmployeeStoreAccess)
            .filter(
                EmployeeStoreAccess.merchant_id == require_merchant_id(merchant_id),
                EmployeeStoreAccess.employee_id == employee.id,
            )
            .all()
        }

        for store_uuid, access in existing.items():
            access.status = (
                RecordStatus.ENABLED.value
                if store_uuid in store_uuids
                else RecordStatus.DISABLED.value
            )

        for store_uuid in store_uuids:
            if store_uuid not in existing:
                db.add(
                    EmployeeStoreAccess(
                        id=uuid.uuid4(),
                        merchant_id=require_merchant_id(merchant_id),
                        employee_id=employee.id,
                        store_id=store_uuid,
                        status=RecordStatus.ENABLED.value,
                    )
                )

    @staticmethod
    def list_employees(
        db: Session,
        merchant_id,
        store_id: Optional[str] = None,
        status: Optional[int] = None,
        keyword: Optional[str] = None,
    ) -> list[Employee]:
        query = apply_merchant_scope(
            db.query(Employee).options(
                joinedload(Employee.role),
                joinedload(Employee.store),
                joinedload(Employee.store_access).joinedload(EmployeeStoreAccess.store),
            ),
            Employee,
            merchant_id,
        )
        query = apply_store_scope(query, Employee, store_id)
        if status is not None:
            query = query.filter(Employee.status == status)
        if keyword:
            like_value = f"%{keyword.strip()}%"
            query = query.filter((Employee.name.ilike(like_value)) | (Employee.phone.ilike(like_value)))
        return query.order_by(Employee.created_at.desc()).all()

    @staticmethod
    def create_employee(db: Session, merchant_id, data) -> Employee:
        merchant_uuid = require_merchant_id(merchant_id)
        payload = data.model_dump() if hasattr(data, "model_dump") else dict(data)
        role_id = EmployeeService._validate_role_scope(db, merchant_uuid, payload.get("role_id"))

        store_ids = list(payload.get("store_ids") or [])
        if payload.get("store_id") and payload["store_id"] not in store_ids:
            store_ids.insert(0, payload["store_id"])
        primary_store_id = validate_store_scope(db, merchant_uuid, store_ids[0]) if store_ids else None

        employee = Employee(
            id=uuid.uuid4(),
            merchant_id=merchant_uuid,
            store_id=primary_store_id,
            role_id=role_id,
            name=payload["name"],
            phone=payload["phone"],
            position=payload.get("position"),
            email=payload.get("email"),
            status=EmployeeStatus.ACTIVE.value,
            remark=payload.get("remark"),
        )
        db.add(employee)
        db.flush()
        EmployeeService._sync_store_access(db, merchant_uuid, employee, store_ids)
        EmployeeService._write_log(
            db,
            merchant_uuid,
            action="create",
            target_type="employee",
            target_id=employee.id,
            employee_id=employee.id,
            store_id=primary_store_id,
            detail=f"创建员工：{employee.name}",
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ValueError("员工手机号在当前商户下已存在")
        db.refresh(employee)
        return EmployeeService._get_employee(db, merchant_uuid, employee.id)

    @staticmethod
    def update_employee(db: Session, merchant_id, employee_id, data) -> Employee:
        employee = EmployeeService._get_employee(db, merchant_id, employee_id)
        payload = data.model_dump(exclude_unset=True) if hasattr(data, "model_dump") else dict(data)

        if "role_id" in payload:
            employee.role_id = EmployeeService._validate_role_scope(db, merchant_id, payload.get("role_id"))
        if "store_id" in payload:
            employee.store_id = (
                validate_store_scope(db, merchant_id, payload.get("store_id"))
                if payload.get("store_id")
                else None
            )

        for field in ("name", "phone", "position", "email", "remark"):
            if field in payload:
                setattr(employee, field, payload[field])

        EmployeeService._write_log(
            db,
            merchant_id,
            action="update",
            target_type="employee",
            target_id=employee.id,
            employee_id=employee.id,
            store_id=employee.store_id,
            detail=f"编辑员工：{employee.name}",
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ValueError("员工手机号在当前商户下已存在")
        db.refresh(employee)
        return EmployeeService._get_employee(db, merchant_id, employee.id)

    @staticmethod
    def set_employee_status(db: Session, merchant_id, employee_id, status: int) -> Employee:
        if status not in {item.value for item in EmployeeStatus}:
            raise ValueError("无效的员工状态")
        employee = EmployeeService._get_employee(db, merchant_id, employee_id)
        employee.status = status
        EmployeeService._write_log(
            db,
            merchant_id,
            action="status",
            target_type="employee",
            target_id=employee.id,
            employee_id=employee.id,
            store_id=employee.store_id,
            detail=f"员工状态变更为：{status}",
        )
        db.commit()
        db.refresh(employee)
        return EmployeeService._get_employee(db, merchant_id, employee.id)

    @staticmethod
    def assign_stores(db: Session, merchant_id, employee_id, store_ids: Iterable[str]) -> Employee:
        employee = EmployeeService._get_employee(db, merchant_id, employee_id)
        normalized_store_ids = EmployeeService._normalize_store_ids(db, merchant_id, store_ids)
        if not normalized_store_ids:
            raise ValueError("至少选择一个授权门店")
        employee.store_id = normalized_store_ids[0]
        EmployeeService._sync_store_access(db, merchant_id, employee, [str(item) for item in normalized_store_ids])
        EmployeeService._write_log(
            db,
            merchant_id,
            action="authorize_stores",
            target_type="employee",
            target_id=employee.id,
            employee_id=employee.id,
            store_id=employee.store_id,
            detail=f"授权门店数量：{len(normalized_store_ids)}",
        )
        db.commit()
        db.refresh(employee)
        return EmployeeService._get_employee(db, merchant_id, employee.id)


class RolePermissionService:
    @staticmethod
    def ensure_default_permissions(db: Session) -> None:
        existing_codes = {row.code for row in db.query(Permission).all()}
        for code, name, module, action in DEFAULT_PERMISSIONS:
            if code not in existing_codes:
                db.add(
                    Permission(
                        id=uuid.uuid4(),
                        code=code,
                        name=name,
                        module=module,
                        action=action,
                        status=RecordStatus.ENABLED.value,
                    )
                )
        db.flush()

    @staticmethod
    def ensure_default_roles(db: Session, merchant_id) -> None:
        merchant_uuid = require_merchant_id(merchant_id)
        RolePermissionService.ensure_default_permissions(db)
        has_role = (
            apply_merchant_scope(db.query(EmployeeRole), EmployeeRole, merchant_uuid)
            .filter(EmployeeRole.code == "manager")
            .first()
        )
        if has_role:
            return
        role = EmployeeRole(
            id=uuid.uuid4(),
            merchant_id=merchant_uuid,
            name="管理员",
            code="manager",
            description="默认管理员角色，可管理员工与权限",
            status=RecordStatus.ENABLED.value,
            is_system=True,
        )
        db.add(role)
        db.flush()
        permissions = db.query(Permission).filter(Permission.status == RecordStatus.ENABLED.value).all()
        for permission in permissions:
            db.add(
                RolePermission(
                    id=uuid.uuid4(),
                    merchant_id=merchant_uuid,
                    role_id=role.id,
                    permission_id=permission.id,
                )
            )

    @staticmethod
    def list_roles(db: Session, merchant_id) -> list[EmployeeRole]:
        RolePermissionService.ensure_default_roles(db, merchant_id)
        db.commit()
        return (
            apply_merchant_scope(
                db.query(EmployeeRole).options(
                    joinedload(EmployeeRole.permissions).joinedload(RolePermission.permission)
                ),
                EmployeeRole,
                merchant_id,
            )
            .order_by(EmployeeRole.created_at.asc())
            .all()
        )

    @staticmethod
    def create_role(db: Session, merchant_id, data) -> EmployeeRole:
        payload = data.model_dump() if hasattr(data, "model_dump") else dict(data)
        role = EmployeeRole(
            id=uuid.uuid4(),
            merchant_id=require_merchant_id(merchant_id),
            name=payload["name"],
            code=payload["code"],
            description=payload.get("description"),
            status=RecordStatus.ENABLED.value,
            is_system=False,
        )
        db.add(role)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ValueError("角色编码在当前商户下已存在")
        db.refresh(role)
        return role

    @staticmethod
    def list_permissions(db: Session, module: Optional[str] = None) -> list[Permission]:
        RolePermissionService.ensure_default_permissions(db)
        query = db.query(Permission).filter(Permission.status == RecordStatus.ENABLED.value)
        if module:
            query = query.filter(Permission.module == module)
        permissions = query.order_by(Permission.module.asc(), Permission.code.asc()).all()
        db.commit()
        return permissions

    @staticmethod
    def assign_role_permissions(db: Session, merchant_id, role_id, permission_ids: Iterable[str]) -> EmployeeRole:
        role_uuid = EmployeeService._validate_role_scope(db, merchant_id, role_id)
        RolePermissionService.ensure_default_permissions(db)
        permission_uuids = [to_uuid(item, "权限ID") for item in permission_ids]
        permissions = db.query(Permission).filter(Permission.id.in_(permission_uuids)).all()
        if len(permissions) != len(set(permission_uuids)):
            raise ValueError("存在无效权限")

        merchant_uuid = require_merchant_id(merchant_id)
        db.query(RolePermission).filter(
            RolePermission.merchant_id == merchant_uuid,
            RolePermission.role_id == role_uuid,
        ).delete(synchronize_session=False)
        for permission in permissions:
            db.add(
                RolePermission(
                    id=uuid.uuid4(),
                    merchant_id=merchant_uuid,
                    role_id=role_uuid,
                    permission_id=permission.id,
                )
            )
        EmployeeService._write_log(
            db,
            merchant_uuid,
            action="authorize_permissions",
            target_type="role",
            target_id=role_uuid,
            detail=f"授权权限数量：{len(permissions)}",
        )
        db.commit()
        role = (
            apply_merchant_scope(
                db.query(EmployeeRole).options(
                    joinedload(EmployeeRole.permissions).joinedload(RolePermission.permission)
                ),
                EmployeeRole,
                merchant_uuid,
            )
            .filter(EmployeeRole.id == role_uuid)
            .first()
        )
        if not role:
            raise ValueError("角色不存在或无权访问")
        return role
