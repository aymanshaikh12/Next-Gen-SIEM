import random
from typing import Dict, Any
from datetime import datetime

# Mock AI scoring model
# In production, this would use a trained ML model
def calculate_ai_score(alert_data: Dict[str, Any]) -> float:
    """Calculate AI score from 0 to 100 for an alert"""
    score = 50.0  # Base score
    
    # Factor in severity
    severity_weights = {
        "critical": 40,
        "high": 25,
        "medium": 10,
        "low": 0
    }
    severity = alert_data.get("severity", "low")
    score += severity_weights.get(severity, 0)
    
    # Factor in user risk
    user_risk = alert_data.get("user_risk_score", 0.0)
    score += user_risk * 20
    
    # Factor in asset criticality
    asset_criticality = alert_data.get("asset_criticality", 0.0)
    score += asset_criticality * 15
    
    # Factor in event type patterns
    event_type = alert_data.get("event_type", "")
    suspicious_patterns = ["failed_login", "unauthorized_access", "privilege_escalation", "data_exfiltration"]
    if any(pattern in event_type.lower() for pattern in suspicious_patterns):
        score += 15
    
    # Add some randomness to simulate model uncertainty
    score += random.uniform(-10, 10)
    
    # Clamp between 0 and 100
    score = max(0.0, min(100.0, score))
    
    return round(score, 2)

def should_suppress_alert(ai_score: float) -> bool:
    """Determine if alert should be suppressed based on AI score"""
    # Suppress alerts with score < 30
    return ai_score < 30.0

def score_and_suppress_alert(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate AI score and determine suppression"""
    ai_score = calculate_ai_score(alert_data)
    is_suppressed = should_suppress_alert(ai_score)
    
    result = {
        "ai_score": ai_score,
        "is_suppressed": is_suppressed,
        "suppression_reason": "low_risk" if is_suppressed else None
    }
    
    return result

# Feedback learning (simplified - in production would update model weights)
feedback_history = []

def record_feedback(alert_id: int, feedback: str, ai_score: float):
    """Record analyst feedback for model improvement"""
    feedback_history.append({
        "alert_id": alert_id,
        "feedback": feedback,
        "ai_score": ai_score,
        "timestamp": datetime.now()
    })
    # In production, this would trigger model retraining

