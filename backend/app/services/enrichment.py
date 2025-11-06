import random
from typing import Dict, Any, Optional

# Mock geo-IP lookup
def get_geo_location(ip: Optional[str]) -> Optional[str]:
    if not ip:
        return None
    # Simulate geo-IP lookup
    countries = ["US", "CN", "RU", "DE", "FR", "GB", "JP", "KR", "IN", "BR"]
    return random.choice(countries)

# Mock user risk scoring
def calculate_user_risk(username: Optional[str]) -> float:
    if not username:
        return 0.0
    # Simulate risk calculation based on username patterns
    high_risk_users = ["admin", "root", "administrator", "service"]
    if username.lower() in high_risk_users:
        return random.uniform(0.7, 1.0)
    return random.uniform(0.0, 0.5)

# Mock asset criticality scoring
def calculate_asset_criticality(ip: Optional[str]) -> float:
    if not ip:
        return 0.0
    # Simulate asset criticality based on IP ranges
    # In real implementation, this would check against asset inventory
    if ip.startswith("10.0.0.") or ip.startswith("192.168.1."):
        return random.uniform(0.8, 1.0)  # Internal critical assets
    return random.uniform(0.0, 0.6)

def enrich_log(log_data: Dict[str, Any]) -> Dict[str, Any]:
    """Enrich log data with geo-IP, user risk, and asset criticality"""
    source_ip = log_data.get("source_ip")
    destination_ip = log_data.get("destination_ip")
    username = log_data.get("username")
    
    log_data["geo_location"] = get_geo_location(source_ip)
    log_data["user_risk_score"] = calculate_user_risk(username)
    log_data["asset_criticality"] = calculate_asset_criticality(destination_ip)
    
    return log_data

