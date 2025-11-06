from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from .database import Base

class LogEvent(Base):
    __tablename__ = "log_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), index=True)
    event_type = Column(String, index=True)
    source_ip = Column(String, index=True)
    destination_ip = Column(String, index=True)
    username = Column(String, index=True)
    action = Column(String)
    status = Column(String)
    raw_log = Column(Text)
    normalized_data = Column(Text)  # JSON string
    geo_location = Column(String)
    user_risk_score = Column(Float, default=0.0)
    asset_criticality = Column(Float, default=0.0)
    created_at = Column(DateTime, default=func.now())

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), index=True)
    event_type = Column(String, index=True)
    severity = Column(String, index=True)  # low, medium, high, critical
    mitre_technique_id = Column(String)
    description = Column(Text)
    source_ip = Column(String, index=True)
    username = Column(String, index=True)
    log_event_id = Column(Integer, index=True)
    ai_score = Column(Float, default=0.0, index=True)
    is_suppressed = Column(Boolean, default=False, index=True)
    suppression_reason = Column(String, nullable=True)
    ai_feedback = Column(String, nullable=True)  # true_positive, false_positive
    ai_feedback_at = Column(DateTime, nullable=True)
    ai_classification = Column(String, nullable=True)  # AI classification from Gemini
    created_at = Column(DateTime, default=func.now())

