import json
import re
import csv
import io
from typing import Dict, Any, List
from datetime import datetime

def parse_cef_line(line: str) -> Dict[str, Any]:
    """
    Parse CEF (Common Event Format) log line
    Format: CEF:Version|Device Vendor|Device Product|Device Version|Signature ID|Name|Severity|Extension
    """
    try:
        # CEF format: CEF:Version|Device Vendor|Device Product|Device Version|Signature ID|Name|Severity|Extension
        if not line.startswith("CEF:"):
            return None
        
        parts = line.split("|", 7)
        if len(parts) < 8:
            return None
        
        cef_version = parts[0].replace("CEF:", "")
        device_vendor = parts[1]
        device_product = parts[2]
        device_version = parts[3]
        signature_id = parts[4]
        name = parts[5]
        severity = parts[6]
        extension = parts[7] if len(parts) > 7 else ""
        
        # Parse extension fields (key=value pairs)
        extension_fields = {}
        if extension:
            # Handle quoted values and escaped characters
            pattern = r'(\w+)=((?:[^=]|\\=)+?)(?=\s+\w+=|$)'
            matches = re.findall(pattern, extension)
            for key, value in matches:
                # Unescape and clean value
                value = value.strip().replace('\\=', '=')
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                extension_fields[key] = value
        
        # Map CEF fields to our standard format
        log_data = {
            "event_type": name or signature_id or "cef_event",
            "source_ip": extension_fields.get("src") or extension_fields.get("sourceAddress") or extension_fields.get("sip"),
            "destination_ip": extension_fields.get("dst") or extension_fields.get("destinationAddress") or extension_fields.get("dip"),
            "username": extension_fields.get("suser") or extension_fields.get("duser") or extension_fields.get("username"),
            "action": extension_fields.get("act") or extension_fields.get("action"),
            "status": extension_fields.get("outcome") or extension_fields.get("result"),
            "timestamp": extension_fields.get("rt") or extension_fields.get("deviceReceiptTime") or datetime.now().isoformat(),
            "raw_log": {
                "cef_version": cef_version,
                "device_vendor": device_vendor,
                "device_product": device_product,
                "device_version": device_version,
                "signature_id": signature_id,
                "name": name,
                "severity": severity,
                "extension": extension_fields
            }
        }
        
        return log_data
    except Exception as e:
        print(f"Error parsing CEF line: {e}")
        return None

def parse_syslog_line(line: str) -> Dict[str, Any]:
    """
    Parse syslog format
    Format: <PRI>timestamp hostname program: message
    """
    try:
        # Syslog format: <PRI>timestamp hostname program: message
        # PRI = (Facility * 8) + Severity
        
        # Extract PRI if present
        pri_match = re.match(r'<(\d+)>', line)
        pri = int(pri_match.group(1)) if pri_match else None
        if pri_match:
            line = line[pri_match.end():].strip()
        
        # Parse timestamp (various formats)
        timestamp = None
        timestamp_patterns = [
            r'(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})',  # Standard syslog
            r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})',  # ISO format
            r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})',  # Date time format
        ]
        
        for pattern in timestamp_patterns:
            match = re.match(pattern, line)
            if match:
                timestamp_str = match.group(1)
                line = line[match.end():].strip()
                try:
                    # Try to parse timestamp
                    if 'T' in timestamp_str:
                        timestamp = timestamp_str
                    else:
                        # Add current year if not present
                        if len(timestamp_str.split()) == 3:
                            timestamp = f"{datetime.now().year} {timestamp_str}"
                        timestamp = datetime.strptime(timestamp, "%Y %b %d %H:%M:%S").isoformat()
                except:
                    timestamp = datetime.now().isoformat()
                break
        
        if not timestamp:
            timestamp = datetime.now().isoformat()
        
        # Extract hostname and program
        parts = line.split(':', 1)
        if len(parts) == 2:
            hostname_program = parts[0].strip()
            message = parts[1].strip()
            
            # Split hostname and program
            hostname_program_parts = hostname_program.split()
            if len(hostname_program_parts) >= 2:
                hostname = hostname_program_parts[0]
                program = ' '.join(hostname_program_parts[1:])
            else:
                hostname = hostname_program_parts[0] if hostname_program_parts else "unknown"
                program = "unknown"
        else:
            hostname = "unknown"
            program = "unknown"
            message = line
        
        # Extract IP addresses from message
        ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        ips = re.findall(ip_pattern, message)
        source_ip = ips[0] if ips else None
        destination_ip = ips[1] if len(ips) > 1 else None
        
        # Extract username (common patterns)
        user_match = re.search(r'(?:user|username|login|account)[=:]\s*(\w+)', message, re.IGNORECASE)
        username = user_match.group(1) if user_match else None
        
        # Determine event type from message
        event_type = "syslog_event"
        message_lower = message.lower()
        if "failed" in message_lower and "login" in message_lower:
            event_type = "failed_login"
        elif "unauthorized" in message_lower or "access denied" in message_lower:
            event_type = "unauthorized_access"
        elif "error" in message_lower:
            event_type = "error"
        elif "warning" in message_lower:
            event_type = "warning"
        
        log_data = {
            "event_type": event_type,
            "source_ip": source_ip,
            "destination_ip": destination_ip,
            "username": username,
            "action": program,
            "status": "success" if "success" in message_lower else ("failed" if "fail" in message_lower else None),
            "timestamp": timestamp,
            "raw_log": {
                "pri": pri,
                "hostname": hostname,
                "program": program,
                "message": message,
                "original": line
            }
        }
        
        return log_data
    except Exception as e:
        print(f"Error parsing syslog line: {e}")
        return None

def parse_csv_line(row: Dict[str, str], headers: List[str]) -> Dict[str, Any]:
    """
    Parse CSV row into log format
    """
    try:
        # Common CSV field mappings (case-insensitive)
        field_mappings = {
            "event_type": ["event_type", "type", "event", "category", "eventtype"],
            "source_ip": ["source_ip", "src_ip", "src", "source", "source_address", "sip", "sourceip"],
            "destination_ip": ["destination_ip", "dst_ip", "dst", "destination", "dest", "destination_address", "dip", "destip"],
            "username": ["username", "user", "account", "user_name", "account_name", "userid"],
            "action": ["action", "operation", "activity", "act"],
            "status": ["status", "result", "outcome", "state"],
            "timestamp": ["timestamp", "time", "@timestamp", "_time", "date_time", "datetime", "date"]
        }
        
        log_data = {}
        
        # Map CSV columns to standard fields (case-insensitive)
        for standard_field, possible_names in field_mappings.items():
            for name in possible_names:
                # Case-insensitive matching
                for header in headers:
                    if header and header.lower().strip() == name.lower():
                        value = row.get(header, "").strip()
                        if value:
                            log_data[standard_field] = value
                            break
                if standard_field in log_data:
                    break
        
        # Set defaults
        log_data.setdefault("event_type", "csv_event")
        log_data.setdefault("timestamp", datetime.now().isoformat())
        
        # Store all CSV data in raw_log
        log_data["raw_log"] = {k: v for k, v in row.items() if k}
        
        return log_data
    except Exception as e:
        print(f"Error parsing CSV row: {e}")
        return None

def detect_file_format(content: str, filename: str = "") -> str:
    """
    Detect file format based on content and filename
    Returns: 'cef', 'syslog', 'csv', 'json', or 'unknown'
    """
    # Check filename extension
    if filename:
        ext = filename.lower().split('.')[-1]
        if ext == 'cef':
            return 'cef'
        elif ext in ['log', 'syslog']:
            return 'syslog'
        elif ext == 'csv':
            return 'csv'
        elif ext == 'json':
            return 'json'
    
    # Check content
    content_lower = content.lower()
    first_line = content.split('\n')[0] if content else ""
    
    # CEF format
    if first_line.startswith("CEF:"):
        return 'cef'
    
    # Syslog format (starts with <PRI> or timestamp)
    if re.match(r'<\d+>', first_line) or re.match(r'\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}', first_line):
        return 'syslog'
    
    # CSV format (has commas and potential headers, but not CEF or syslog)
    if ',' in first_line and len(first_line.split(',')) >= 2 and not first_line.startswith("CEF:") and not re.match(r'<\d+>', first_line):
        return 'csv'
    
    # JSON format
    try:
        json.loads(content)
        return 'json'
    except:
        try:
            json.loads('[' + content.split('\n')[0] + ']')
            return 'json'
        except:
            pass
    
    return 'unknown'

def parse_logs_from_content(content: str, filename: str = "") -> List[Dict[str, Any]]:
    """
    Parse logs from file content, auto-detecting format
    """
    format_type = detect_file_format(content, filename)
    logs = []
    
    if format_type == 'cef':
        for line in content.strip().split('\n'):
            if line.strip():
                parsed = parse_cef_line(line.strip())
                if parsed:
                    logs.append(parsed)
    
    elif format_type == 'syslog':
        for line in content.strip().split('\n'):
            if line.strip():
                parsed = parse_syslog_line(line.strip())
                if parsed:
                    logs.append(parsed)
    
    elif format_type == 'csv':
        try:
            csv_reader = csv.DictReader(io.StringIO(content))
            headers = csv_reader.fieldnames or []
            if not headers:
                # Try with different delimiter
                csv_reader = csv.DictReader(io.StringIO(content), delimiter=';')
                headers = csv_reader.fieldnames or []
            for row in csv_reader:
                parsed = parse_csv_line(row, headers)
                if parsed:
                    logs.append(parsed)
        except Exception as e:
            print(f"Error parsing CSV: {e}")
            # Try with semicolon delimiter
            try:
                csv_reader = csv.DictReader(io.StringIO(content), delimiter=';')
                headers = csv_reader.fieldnames or []
                for row in csv_reader:
                    parsed = parse_csv_line(row, headers)
                    if parsed:
                        logs.append(parsed)
            except:
                pass
    
    elif format_type == 'json':
        # Try JSON array first
        try:
            data = json.loads(content)
            if isinstance(data, list):
                logs = data
            else:
                logs = [data]
        except json.JSONDecodeError:
            # Try NDJSON (newline-delimited JSON)
            for line in content.strip().split('\n'):
                if line.strip():
                    try:
                        logs.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
    
    return logs

