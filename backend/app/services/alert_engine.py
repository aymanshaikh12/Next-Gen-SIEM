from typing import Dict, Any, Optional
from datetime import datetime
try:
    from .gemini_ai import classify_alert_with_gemini
except ImportError:
    # Fallback if Gemini is not available
    from .ai_scorer import score_and_suppress_alert as classify_alert_with_gemini

# MITRE ATT&CK Technique mapping
MITRE_TECHNIQUES = {
    "failed_login": "T1110.001",  # Brute Force: Password Guessing
    "unauthorized_access": "T1078",  # Valid Accounts
    "privilege_escalation": "T1068",  # Exploitation for Privilege Escalation
    "data_exfiltration": "T1041",  # Exfiltration Over C2 Channel
    "malware_detection": "T1055",  # Process Injection
    "suspicious_network": "T1043",  # Commonly Used Port
    "account_manipulation": "T1098",  # Account Manipulation
    "default": "T1003"  # OS Credential Dumping
}

def get_severity(event_type: str, user_risk: float, asset_criticality: float) -> str:
    """Determine alert severity"""
    risk_score = user_risk + asset_criticality
    
    if "critical" in event_type.lower() or risk_score > 1.5:
        return "critical"
    elif "high" in event_type.lower() or risk_score > 1.0:
        return "high"
    elif "medium" in event_type.lower() or risk_score > 0.5:
        return "medium"
    else:
        return "low"

def get_mitre_technique(event_type: str) -> Optional[str]:
    """Map event type to MITRE ATT&CK Technique ID"""
    event_lower = event_type.lower()
    for pattern, technique_id in MITRE_TECHNIQUES.items():
        if pattern in event_lower:
            return technique_id
    return MITRE_TECHNIQUES["default"]

def generate_alert_description(event_type: str, source_ip: Optional[str], username: Optional[str]) -> str:
    """Generate alert description"""
    parts = [f"Alert: {event_type}"]
    if source_ip:
        parts.append(f"from {source_ip}")
    if username:
        parts.append(f"by user {username}")
    return " ".join(parts)

def correlate_and_create_alert(log_event: Dict[str, Any], log_event_id: int) -> Optional[Dict[str, Any]]:
    """Correlate log event and create alert if suspicious"""
    event_type = log_event.get("event_type", "")
    
    # Rule-based correlation: check for suspicious patterns
    suspicious_patterns = [
        "failed_login",
        "unauthorized",
        "privilege",
        "exfiltration",
        "malware",
        "suspicious",
        "anomalous"
    ]
    
    is_suspicious = any(pattern in event_type.lower() for pattern in suspicious_patterns)
    
    # Also check for high risk indicators
    user_risk = log_event.get("user_risk_score", 0.0)
    asset_criticality = log_event.get("asset_criticality", 0.0)
    
    if is_suspicious or user_risk > 0.7 or asset_criticality > 0.8:
        severity = get_severity(event_type, user_risk, asset_criticality)
        mitre_technique = get_mitre_technique(event_type)
        description = generate_alert_description(
            event_type,
            log_event.get("source_ip"),
            log_event.get("username")
        )
        
        alert_data = {
            "event_type": event_type,
            "severity": severity,
            "mitre_technique_id": mitre_technique,
            "description": description,
            "source_ip": log_event.get("source_ip"),
            "username": log_event.get("username"),
            "log_event_id": log_event_id,
            "user_risk_score": user_risk,
            "asset_criticality": asset_criticality
        }
        
        # Apply AI scoring and suppression using Gemini (or fallback)
        try:
            ai_result = classify_alert_with_gemini(alert_data)
            alert_data.update(ai_result)
        except Exception as e:
            # Fallback to rule-based if Gemini fails
            print(f"Gemini classification failed: {e}, using fallback")
            from .ai_scorer import score_and_suppress_alert
            ai_result = score_and_suppress_alert(alert_data)
            alert_data.update(ai_result)
            alert_data["classification"] = "Security Event"  # Default classification
        
        return alert_data
    
    return None

