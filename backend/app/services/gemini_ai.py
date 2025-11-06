import os
from typing import Dict, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini API
# Use provided API key or get from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyD4fy6vvAxUWZeZQMwMyfOspgx6D4f9n-o")
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-pro')
    except Exception as e:
        print(f"Error initializing Gemini API: {e}")
        model = None
else:
    model = None

def classify_alert_with_gemini(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use Gemini API to classify and score alerts
    Returns: dict with ai_score, is_suppressed, suppression_reason, and classification
    """
    if not model:
        # Fallback to rule-based if API key not configured
        return _fallback_classification(alert_data)
    
    try:
        # Prepare prompt for Gemini
        prompt = f"""You are a security analyst AI assistant. Analyze this security alert and provide:
1. Risk score (0-100): How serious is this threat?
2. Should it be suppressed? (yes/no)
3. Suppression reason if yes
4. Alert classification (e.g., "Brute Force Attack", "Unauthorized Access", "Data Exfiltration", "False Positive", etc.)

Alert Details:
- Event Type: {alert_data.get('event_type', 'unknown')}
- Severity: {alert_data.get('severity', 'low')}
- Source IP: {alert_data.get('source_ip', 'unknown')}
- Username: {alert_data.get('username', 'unknown')}
- User Risk Score: {alert_data.get('user_risk_score', 0.0)}
- Asset Criticality: {alert_data.get('asset_criticality', 0.0)}
- Description: {alert_data.get('description', 'No description')}

Respond in JSON format:
{{
  "risk_score": <number 0-100>,
  "suppress": <true/false>,
  "suppression_reason": "<reason or null>",
  "classification": "<alert classification>"
}}"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        import json
        result = json.loads(response_text)
        
        return {
            "ai_score": float(result.get("risk_score", 50.0)),
            "is_suppressed": bool(result.get("suppress", False)),
            "suppression_reason": result.get("suppression_reason") or ("low_risk" if result.get("suppress") else None),
            "classification": result.get("classification", "Unknown")
        }
    except Exception as e:
        print(f"Gemini API error: {e}")
        return _fallback_classification(alert_data)

def _fallback_classification(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback rule-based classification if Gemini API fails"""
    from .ai_scorer import calculate_ai_score, should_suppress_alert
    
    ai_score = calculate_ai_score(alert_data)
    is_suppressed = should_suppress_alert(ai_score)
    
    # Simple classification based on event type
    event_type = alert_data.get("event_type", "").lower()
    if "failed_login" in event_type or "brute" in event_type:
        classification = "Brute Force Attack"
    elif "unauthorized" in event_type:
        classification = "Unauthorized Access"
    elif "privilege" in event_type:
        classification = "Privilege Escalation"
    elif "exfiltration" in event_type:
        classification = "Data Exfiltration"
    elif "malware" in event_type:
        classification = "Malware Detection"
    else:
        classification = "Security Event"
    
    return {
        "ai_score": ai_score,
        "is_suppressed": is_suppressed,
        "suppression_reason": "low_risk" if is_suppressed else None,
        "classification": classification
    }

