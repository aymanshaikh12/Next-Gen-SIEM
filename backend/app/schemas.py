from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

# Log Schemas
class LogIngestRequest(BaseModel):
    event_type: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    username: Optional[str] = None
    action: Optional[str] = None
    status: Optional[str] = None
    raw_log: Optional[Dict[str, Any]] = None

class LogEventResponse(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    source_ip: Optional[str]
    destination_ip: Optional[str]
    username: Optional[str]
    action: Optional[str]
    status: Optional[str]
    geo_location: Optional[str]
    user_risk_score: float
    asset_criticality: float
    
    class Config:
        from_attributes = True

# Alert Schemas
class AlertResponse(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    severity: str
    mitre_technique_id: Optional[str]
    description: str
    source_ip: Optional[str]
    username: Optional[str]
    log_event_id: Optional[int]
    ai_score: float
    is_suppressed: bool
    suppression_reason: Optional[str]
    ai_feedback: Optional[str]
    ai_feedback_at: Optional[datetime]
    ai_classification: Optional[str]
    
    class Config:
        from_attributes = True

class AlertFeedbackRequest(BaseModel):
    feedback: str  # true_positive or false_positive

# SOAR Schemas
class SOARActionRequest(BaseModel):
    action_type: str  # block_ip, disable_account, send_notification
    target: str
    reason: Optional[str] = None

class SOARActionResponse(BaseModel):
    success: bool
    message: str
    action_type: str
    target: str

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_logs: int
    total_alerts: int
    suppressed_alerts: int
    event_types: Dict[str, int]
    daily_log_counts: Dict[str, int]

