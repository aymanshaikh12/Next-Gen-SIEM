from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Alert
from ..schemas import AlertResponse, AlertFeedbackRequest
from ..services.ai_scorer import record_feedback

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertResponse])
async def get_alerts(
    skip: int = 0,
    limit: int = 100,
    severity: Optional[str] = None,
    is_suppressed: Optional[bool] = None,
    source_ip: Optional[str] = None,
    username: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get alerts with filters"""
    query = db.query(Alert)
    
    if severity:
        query = query.filter(Alert.severity == severity)
    if is_suppressed is not None:
        query = query.filter(Alert.is_suppressed == is_suppressed)
    if source_ip:
        query = query.filter(Alert.source_ip == source_ip)
    if username:
        query = query.filter(Alert.username == username)
    if start_time:
        try:
            start_dt = datetime.fromisoformat(start_time)
            query = query.filter(Alert.timestamp >= start_dt)
        except:
            pass
    if end_time:
        try:
            end_dt = datetime.fromisoformat(end_time)
            query = query.filter(Alert.timestamp <= end_dt)
        except:
            pass
    
    alerts = query.order_by(Alert.timestamp.desc()).offset(skip).limit(limit).all()
    return alerts

@router.post("/{alert_id}/feedback")
async def submit_feedback(
    alert_id: int,
    feedback: AlertFeedbackRequest,
    db: Session = Depends(get_db)
):
    """Submit analyst feedback for an alert"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if feedback.feedback not in ["true_positive", "false_positive"]:
        raise HTTPException(status_code=400, detail="Feedback must be 'true_positive' or 'false_positive'")
    
    alert.ai_feedback = feedback.feedback
    alert.ai_feedback_at = datetime.now()
    
    db.commit()
    db.refresh(alert)
    
    # Record feedback for model improvement
    record_feedback(alert_id, feedback.feedback, alert.ai_score)
    
    return {"success": True, "message": "Feedback recorded"}

