import uuid
from sqlalchemy import Column, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Constraint(Base):
    __tablename__ = "constraints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False, default="HARD")  # HARD, SOFT
    is_enabled = Column(Boolean, default=True)
    description = Column(String(500), nullable=True)

    weights = relationship("ConstraintWeight", back_populates="constraint", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Constraint {self.code} ({self.type}) Enabled:{self.is_enabled}>"


class ConstraintWeight(Base):
    __tablename__ = "constraint_weights"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    constraint_id = Column(String(36), ForeignKey("constraints.id", ondelete="CASCADE"), nullable=False)
    weight = Column(Float, nullable=False, default=1.0)

    constraint = relationship("Constraint", back_populates="weights")

    def __repr__(self):
        return f"<ConstraintWeight Constraint:{self.constraint_id} Weight:{self.weight}>"
