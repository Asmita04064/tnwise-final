from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from database import Base

class ScreeningRecord(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String)
    age = Column(Integer)
    screening_type = Column(String)  # hemoglobin or urinalysis
    result_value = Column(Float)
    risk = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    synced = Column(Boolean, default=False)