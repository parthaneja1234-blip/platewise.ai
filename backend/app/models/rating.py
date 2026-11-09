from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin


class MessRating(Base, BaseModelMixin):
    """
    Student meal rating and qualitative feedback.
    """
    __tablename__ = "mess_ratings"

    mess_id = Column(String(36), ForeignKey("cafeterias.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    meal = Column(String(20), nullable=False)  # Breakfast, Lunch, Dinner
    rating = Column(Integer, nullable=False)   # 1 to 5 stars
    feedback = Column(String(500), nullable=True)

    # Relationships
    mess = relationship("Cafeteria", backref="ratings")
    user = relationship("User", backref="ratings")
