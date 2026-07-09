import uuid

from sqlalchemy import Boolean, Column, ForeignKey, Index, Integer, String, Text, UniqueConstraint, UUID
from sqlalchemy.orm import relationship

from app.core.enums import EmployeeStatus, PermissionAction, RecordStatus
from app.core.scoping import MerchantScopedMixin
from app.models.base import BaseModel


class EmployeeRole(MerchantScopedMixin, BaseModel):
    __tablename__ = "employee_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(80), nullable=False)
    code = Column(String(80), nullable=False)
    description = Column(Text)
    status = Column(Integer, nullable=False, default=RecordStatus.ENABLED.value)
    is_system = Column(Boolean, nullable=False, default=False)

    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="role")

    __table_args__ = (
        UniqueConstraint("merchant_id", "code", name="uq_employee_roles_merchant_code"),
        Index("ix_employee_roles_merchant_status", "merchant_id", "status"),
    )


class Permission(BaseModel):
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    code = Column(String(120), nullable=False, unique=True, index=True)
    module = Column(String(80), nullable=False, index=True)
    action = Column(String(30), nullable=False, default=PermissionAction.READ.value)
    description = Column(Text)
    status = Column(Integer, nullable=False, default=RecordStatus.ENABLED.value)

    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class RolePermission(MerchantScopedMixin, BaseModel):
    __tablename__ = "role_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_id = Column(UUID(as_uuid=True), ForeignKey("employee_roles.id"), nullable=False, index=True)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id"), nullable=False, index=True)

    role = relationship("EmployeeRole", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")

    __table_args__ = (
        UniqueConstraint("merchant_id", "role_id", "permission_id", name="uq_role_permissions_scope"),
        Index("ix_role_permissions_merchant_role", "merchant_id", "role_id"),
    )


class Employee(MerchantScopedMixin, BaseModel):
    __tablename__ = "employees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=True, index=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("employee_roles.id"), nullable=True, index=True)
    name = Column(String(80), nullable=False)
    phone = Column(String(20), nullable=False)
    position = Column(String(80))
    email = Column(String(120))
    status = Column(Integer, nullable=False, default=EmployeeStatus.ACTIVE.value)
    remark = Column(Text)

    merchant = relationship("Merchant")
    store = relationship("Store")
    role = relationship("EmployeeRole", back_populates="employees")
    store_access = relationship("EmployeeStoreAccess", back_populates="employee", cascade="all, delete-orphan")
    operation_logs = relationship("EmployeeOperationLog", back_populates="employee")

    __table_args__ = (
        UniqueConstraint("merchant_id", "phone", name="uq_employees_merchant_phone"),
        Index("ix_employees_merchant_status", "merchant_id", "status"),
        Index("ix_employees_merchant_store", "merchant_id", "store_id"),
    )


class EmployeeStoreAccess(MerchantScopedMixin, BaseModel):
    __tablename__ = "employee_store_access"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False, index=True)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False, index=True)
    status = Column(Integer, nullable=False, default=RecordStatus.ENABLED.value)

    employee = relationship("Employee", back_populates="store_access")
    store = relationship("Store")

    __table_args__ = (
        UniqueConstraint("merchant_id", "employee_id", "store_id", name="uq_employee_store_access_scope"),
        Index("ix_employee_store_access_merchant_store", "merchant_id", "store_id"),
    )


class EmployeeOperationLog(MerchantScopedMixin, BaseModel):
    __tablename__ = "employee_operation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True, index=True)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=True, index=True)
    operator_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(80), nullable=False)
    target_type = Column(String(80), nullable=False)
    target_id = Column(UUID(as_uuid=True), nullable=True)
    detail = Column(Text)

    employee = relationship("Employee", back_populates="operation_logs", foreign_keys=[employee_id])
    store = relationship("Store")

    __table_args__ = (
        Index("ix_employee_operation_logs_merchant_action", "merchant_id", "action"),
        Index("ix_employee_operation_logs_merchant_target", "merchant_id", "target_type", "target_id"),
    )
