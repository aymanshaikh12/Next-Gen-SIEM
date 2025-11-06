from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from datetime import datetime

from ..database import get_db
from ..models import LogEvent
from ..schemas import LogIngestRequest, LogEventResponse
from ..services.log_processor import process_log, process_bulk_logs
from ..services.alert_engine import correlate_and_create_alert
from ..services.log_parsers import parse_logs_from_content, detect_file_format
from ..models import Alert

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.post("/ingest", response_model=LogEventResponse)
async def ingest_log(request: Request, db: Session = Depends(get_db)):
    """Ingest a single log via REST API - accepts flexible JSON format"""
    try:
        # Accept any JSON structure directly
        log_dict = await request.json()
        
        # Process log
        processed = process_log(log_dict)
        
        # Parse timestamp
        try:
            if isinstance(processed.get("timestamp"), str):
                timestamp = datetime.fromisoformat(processed["timestamp"].replace('Z', '+00:00'))
            else:
                timestamp = datetime.now()
        except:
            timestamp = datetime.now()
        
        # Store in database
        log_event = LogEvent(
            timestamp=timestamp,
            event_type=processed["event_type"],
            source_ip=processed.get("source_ip"),
            destination_ip=processed.get("destination_ip"),
            username=processed.get("username"),
            action=processed.get("action"),
            status=processed.get("status"),
            raw_log=json.dumps(processed.get("raw_log", {})),
            normalized_data=json.dumps(processed),
            geo_location=processed.get("geo_location"),
            user_risk_score=processed.get("user_risk_score", 0.0),
            asset_criticality=processed.get("asset_criticality", 0.0)
        )
        
        db.add(log_event)
        db.commit()
        db.refresh(log_event)
        
        # Generate alert if suspicious
        alert_data = correlate_and_create_alert(processed, log_event.id)
        if alert_data:
            alert = Alert(
                timestamp=datetime.now(),
                event_type=alert_data["event_type"],
                severity=alert_data["severity"],
                mitre_technique_id=alert_data["mitre_technique_id"],
                description=alert_data["description"],
                source_ip=alert_data.get("source_ip"),
                username=alert_data.get("username"),
                log_event_id=alert_data["log_event_id"],
                ai_score=alert_data["ai_score"],
                is_suppressed=alert_data["is_suppressed"],
                suppression_reason=alert_data.get("suppression_reason"),
                ai_classification=alert_data.get("classification")
            )
            db.add(alert)
            db.commit()
        
        return log_event
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload", response_model=List[LogEventResponse])
async def upload_logs(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload bulk logs via JSON, NDJSON, CSV, CEF, or Syslog file"""
    try:
        # Check if file is provided
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        content = await file.read()
        
        # Check if file is empty
        if not content or len(content) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Try to decode as UTF-8, fallback to latin-1 if needed
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = content.decode("latin-1")
            except:
                raise HTTPException(status_code=400, detail="Unable to decode file. Please ensure it's a text file (UTF-8 or Latin-1)")
        
        # Check if decoded text is empty
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="File appears to be empty or contains only whitespace")
        
        # Auto-detect format and parse
        filename = file.filename or ""
        logs = parse_logs_from_content(text, filename)
        
        if not logs:
            detected_format = detect_file_format(text, filename)
            raise HTTPException(
                status_code=400, 
                detail=f"No valid logs found in file. Supported formats: JSON, NDJSON, CSV, CEF, Syslog. Detected format: {detected_format}. File size: {len(text)} bytes. First 200 chars: {text[:200]}"
            )
        
        # Process all logs
        try:
            processed_logs = process_bulk_logs(logs)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing logs: {str(e)}")
        
        # Store in database
        log_events = []
        for processed in processed_logs:
            # Parse timestamp
            try:
                if isinstance(processed.get("timestamp"), str):
                    timestamp = datetime.fromisoformat(processed["timestamp"].replace('Z', '+00:00'))
                else:
                    timestamp = datetime.now()
            except:
                timestamp = datetime.now()
            
            log_event = LogEvent(
                timestamp=timestamp,
                event_type=processed["event_type"],
                source_ip=processed.get("source_ip"),
                destination_ip=processed.get("destination_ip"),
                username=processed.get("username"),
                action=processed.get("action"),
                status=processed.get("status"),
                raw_log=json.dumps(processed.get("raw_log", {})),
                normalized_data=json.dumps(processed),
                geo_location=processed.get("geo_location"),
                user_risk_score=processed.get("user_risk_score", 0.0),
                asset_criticality=processed.get("asset_criticality", 0.0)
            )
            db.add(log_event)
            log_events.append(log_event)
        
        db.commit()
        
        # Generate alerts for suspicious events
        for log_event in log_events:
            processed = json.loads(log_event.normalized_data)
            alert_data = correlate_and_create_alert(processed, log_event.id)
            if alert_data:
                alert = Alert(
                    timestamp=datetime.now(),
                    event_type=alert_data["event_type"],
                    severity=alert_data["severity"],
                    mitre_technique_id=alert_data["mitre_technique_id"],
                    description=alert_data["description"],
                    source_ip=alert_data.get("source_ip"),
                    username=alert_data.get("username"),
                    log_event_id=alert_data["log_event_id"],
                    ai_score=alert_data["ai_score"],
                    is_suppressed=alert_data["is_suppressed"],
                    suppression_reason=alert_data.get("suppression_reason"),
                    ai_classification=alert_data.get("classification")
                )
                db.add(alert)
        
        db.commit()
        
        # Refresh all log events
        for log_event in log_events:
            db.refresh(log_event)
        
        return log_events
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        error_detail = f"Error uploading file: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("", response_model=List[LogEventResponse])
async def get_logs(
    skip: int = 0,
    limit: int = 100,
    source_ip: str = None,
    username: str = None,
    event_type: str = None,
    start_time: str = None,
    end_time: str = None,
    db: Session = Depends(get_db)
):
    """Get logs with filters"""
    query = db.query(LogEvent)
    
    if source_ip:
        query = query.filter(LogEvent.source_ip == source_ip)
    if username:
        query = query.filter(LogEvent.username == username)
    if event_type:
        query = query.filter(LogEvent.event_type == event_type)
    if start_time:
        try:
            start_dt = datetime.fromisoformat(start_time)
            query = query.filter(LogEvent.timestamp >= start_dt)
        except:
            pass
    if end_time:
        try:
            end_dt = datetime.fromisoformat(end_time)
            query = query.filter(LogEvent.timestamp <= end_dt)
        except:
            pass
    
    logs = query.order_by(LogEvent.timestamp.desc()).offset(skip).limit(limit).all()
    return logs

