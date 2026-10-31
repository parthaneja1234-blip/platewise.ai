import enum
from sqlalchemy import Column, String, Date, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import BaseModelMixin


class EventType(str, enum.Enum):
    EXAM = "exam"
    HOLIDAY = "holiday"
    FESTIVAL = "festival"
    SPORTS = "sports"
    VACATION = "vacation"
    SPECIAL_DINNER = "special_dinner"
    OTHER = "other"


class CalendarEvent(Base, BaseModelMixin):
    """
    Academic context events that significantly perturb mess hall turnout.
    Examples: Midterm exams (-25% turnout), Diwali feast (+35% turnout).
    """
    __tablename__ = "calendar_events"

    cafeteria_id = Column(String(36), ForeignKey("cafeterias.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    event_type = Column(Enum(EventType), nullable=False, default=EventType.OTHER)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    expected_turnout_impact_pct = Column(Float, nullable=False, default=0.0)

    # Relationships
    cafeteria = relationship("Cafeteria", back_populates="calendar_events")
