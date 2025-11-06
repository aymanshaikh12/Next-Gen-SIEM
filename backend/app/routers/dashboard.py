from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict

from ..database import get_db
from ..models import LogEvent, Alert
from ..schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    
    # Total logs
    total_logs = db.query(LogEvent).count()
    
    # Total alerts
    total_alerts = db.query(Alert).count()
    
    # Suppressed alerts
    suppressed_alerts = db.query(Alert).filter(Alert.is_suppressed == True).count()
    
    # Event types distribution
    event_type_counts = db.query(
        LogEvent.event_type,
        func.count(LogEvent.id).label("count")
    ).group_by(LogEvent.event_type).all()
    
    event_types = {event_type: count for event_type, count in event_type_counts}
    
    # Daily log counts (last 7 days)
    seven_days_ago = datetime.now() - timedelta(days=7)
    daily_counts = db.query(
        func.date(LogEvent.timestamp).label("date"),
        func.count(LogEvent.id).label("count")
    ).filter(
        LogEvent.timestamp >= seven_days_ago
    ).group_by(func.date(LogEvent.timestamp)).all()
    
    daily_log_counts = {
        str(date): count for date, count in daily_counts
    }
    
    return DashboardStats(
        total_logs=total_logs,
        total_alerts=total_alerts,
        suppressed_alerts=suppressed_alerts,
        event_types=event_types,
        daily_log_counts=daily_log_counts
    )

