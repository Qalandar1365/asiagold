from datetime import datetime, time
from enum import Enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Enum as PgEnum,
    ForeignKey,
    Boolean,
    Time,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class OrderStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    WAITING_FOR_SALES_APPROVAL = "WAITING_FOR_SALES_APPROVAL"
    APPROVED_FOR_PRODUCTION = "APPROVED_FOR_PRODUCTION"
    REJECTED_BY_SALES = "REJECTED_BY_SALES"
    SENT_TO_FACTORY = "SENT_TO_FACTORY"
    IN_PRODUCTION = "IN_PRODUCTION"
    DONE = "DONE"


class SalesOffice(Base):
    __tablename__ = "sales_offices"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)

    managers = relationship("SalesManager", back_populates="office")
    customers = relationship("Customer", back_populates="office")


class SalesManager(Base):
    __tablename__ = "sales_managers"

    id = Column(Integer, primary_key=True)
    tg_user_id = Column(String(64), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    office_id = Column(Integer, ForeignKey("sales_offices.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    office = relationship("SalesOffice", back_populates="managers")
    approvals = relationship("Order", back_populates="approved_by_manager")


class Factory(Base):
    __tablename__ = "factories"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)
    dispatch_time = Column(Time, nullable=False, default=time(hour=9, minute=0))

    products = relationship("Product", back_populates="factory")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    factory_id = Column(Integer, ForeignKey("factories.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    factory = relationship("Factory", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True)
    tg_user_id = Column(String(64), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    office_id = Column(Integer, ForeignKey("sales_offices.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    office = relationship("SalesOffice", back_populates="customers")
    orders = relationship("Order", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(PgEnum(OrderStatus), default=OrderStatus.DRAFT, nullable=False)
    sales_comment = Column(Text, nullable=True)
    factory_batch_ref = Column(String(255), nullable=True)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    approved_by_manager_id = Column(
        Integer, ForeignKey("sales_managers.id"), nullable=True
    )

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    approved_by_manager = relationship("SalesManager", back_populates="approvals")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
