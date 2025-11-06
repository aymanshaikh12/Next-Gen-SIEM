import json
from typing import Dict, Any, List
from datetime import datetime
from .enrichment import enrich_log

def normalize_log(raw_log: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize log into standard schema - handles multiple log formats"""
    # Handle @timestamp format (Elasticsearch/Logstash style)
    timestamp = raw_log.get("timestamp") or raw_log.get("@timestamp") or raw_log.get("time") or raw_log.get("_time")
    
    # Handle various IP field names
    source_ip = (raw_log.get("source_ip") or raw_log.get("src_ip") or 
                 raw_log.get("src") or raw_log.get("ip") or raw_log.get("source"))
    destination_ip = (raw_log.get("destination_ip") or raw_log.get("dst_ip") or 
                     raw_log.get("dst") or raw_log.get("target_ip") or raw_log.get("destination"))
    
    # Handle various user field names
    username = (raw_log.get("username") or raw_log.get("user") or 
                raw_log.get("account") or raw_log.get("account_name") or raw_log.get("user_name"))
    
    # Handle event type variations
    event_type = (raw_log.get("event_type") or raw_log.get("type") or 
                  raw_log.get("event") or raw_log.get("event.action") or "unknown")
    
    normalized = {
        "event_type": event_type,
        "source_ip": source_ip,
        "destination_ip": destination_ip,
        "username": username,
        "action": raw_log.get("action") or raw_log.get("operation") or raw_log.get("event.action"),
        "status": raw_log.get("status") or raw_log.get("result") or raw_log.get("outcome") or raw_log.get("event.outcome"),
        "timestamp": timestamp or datetime.now().isoformat(),
        "raw_log": raw_log
    }
    return normalized

def process_log(raw_log: Dict[str, Any]) -> Dict[str, Any]:
    """Process a single log: normalize and enrich"""
    normalized = normalize_log(raw_log)
    enriched = enrich_log(normalized)
    return enriched

def process_bulk_logs(raw_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process multiple logs"""
    return [process_log(log) for log in raw_logs]
