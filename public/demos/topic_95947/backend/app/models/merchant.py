from sqlalchemy import Column, String, Integer, UUID, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
import uuid
from app.models.base import BaseModel

class Merchant(BaseModel):
    __tablename__ = "merchants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    industry = Column(String(50), nullable=False)
    region = Column(String(100), nullable=False)
    status = Column(Integer, default=1)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20))
    description = Column(Text)
    
    stores = relationship("Store", back_populates="merchant")
    operation_plans = relationship("OperationPlan", back_populates="merchant")
    ai_conversations = relationship("AIConversation", back_populates="merchant")

class Store(BaseModel):
    __tablename__ = "stores"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    business_hours = Column(String(100))
    status = Column(Integer, default=1)
    latitude = Column(String(50))
    longitude = Column(String(50))
    
    merchant = relationship("Merchant", back_populates="stores")
    orders = relationship("Order", back_populates="store")
    dishes = relationship("Dish", back_populates="store")
    members = relationship("Member", back_populates="store")

class Order(BaseModel):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    order_no = Column(String(50), unique=True, nullable=False)
    total_amount = Column(Integer, nullable=False)
    status = Column(Integer, default=0)
    payment_method = Column(String(50))
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    
    store = relationship("Store", back_populates="orders")

class Category(BaseModel):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    name = Column(String(50), nullable=False)
    icon = Column(String(100), default="fas fa-utensils")
    sort_order = Column(Integer, default=0)
    status = Column(Integer, default=1)
    
    store = relationship("Store")
    dishes = relationship("Dish", back_populates="category_rel")

class Dish(BaseModel):
    __tablename__ = "dishes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    name = Column(String(100), nullable=False)
    price = Column(Integer, nullable=False)
    description = Column(Text)
    image_url = Column(String(255))
    status = Column(Integer, default=1)
    sales_count = Column(Integer, default=0)
    
    store = relationship("Store", back_populates="dishes")
    category_rel = relationship("Category", back_populates="dishes")

class Member(BaseModel):
    __tablename__ = "members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    name = Column(String(100))
    phone = Column(String(20), unique=True)
    level = Column(Integer, default=1)
    points = Column(Integer, default=0)
    total_spent = Column(Integer, default=0)
    last_visit = Column(String(50))
    
    store = relationship("Store", back_populates="members")

class Inventory(BaseModel):
    __tablename__ = "inventory"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id = Column(UUID(as_uuid=True), ForeignKey("stores.id"), nullable=False)
    dish_id = Column(UUID(as_uuid=True), ForeignKey("dishes.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    min_stock = Column(Integer, default=10)
    max_stock = Column(Integer, default=100)
    unit = Column(String(20), default="份")
    alert_status = Column(Integer, default=0)
    
    store = relationship("Store")
    dish = relationship("Dish")
