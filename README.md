# SecForce SIEM 2.0

Enterprise-grade Security Information and Event Management (SIEM) platform with AI-powered alert triage, advanced correlation, and SOAR automation capabilities. Built for security operations centers (SOCs) requiring professional-grade threat detection and response.

## Features

✅ **Log Ingestion**
- Single log upload via REST API
- Bulk JSON/NDJSON file upload
- Automatic normalization and enrichment

✅ **Log Processing Pipeline**
- Normalization into standard schema
- Enrichment: geo-IP lookup, user risk scoring, asset criticality
- SQLite storage with optimized indexing

✅ **Alert Generation**
- Rule-based correlation engine
- MITRE ATT&CK Technique ID mapping
- Severity classification (low, medium, high, critical)

✅ **AI-Powered Alert Triage**
- AI scoring (0-100) for each alert
- Automatic suppression of low-risk alerts
- Analyst feedback system (true_positive/false_positive)
- Feedback tracking for model improvement

✅ **SOAR Automation**
- Block IP addresses
- Disable user accounts
- Send security notifications

✅ **Dashboard & Analytics**
- Real-time dashboard with auto-refresh
- Pie chart: event types distribution
- Bar chart: daily log counts
- Advanced filtering (time range, IP, username, event type)
- Dark theme UI

## Architecture

### Backend
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **Database**: SQLite
- **API**: RESTful endpoints

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Routing**: React Router

## Project Structure

```
NEXTGEN_SIEM_2.0/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── database.py          # Database configuration
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── logs.py          # Log ingestion endpoints
│   │   │   ├── alerts.py        # Alert management endpoints
│   │   │   ├── soar.py          # SOAR automation endpoints
│   │   │   └── dashboard.py     # Dashboard statistics
│   │   └── services/
│   │       ├── log_processor.py # Log normalization
│   │       ├── enrichment.py    # Geo-IP, risk scoring
│   │       ├── alert_engine.py  # Correlation engine
│   │       └── ai_scorer.py     # AI scoring & suppression
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Main dashboard
│   │   │   ├── Alerts.tsx       # Alerts table
│   │   │   ├── UploadLogs.tsx   # Log upload page
│   │   │   └── SOAR.tsx         # SOAR actions
│   │   ├── services/
│   │   │   └── api.ts           # API client
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── sample_logs.json             # Sample JSON logs
├── sample_logs.ndjson           # Sample NDJSON logs
└── README.md
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the FastAPI server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

### 1. Access the Dashboard

Open your browser and navigate to `http://localhost:5173`

### 2. Upload Logs

**Option A: Bulk Upload (JSON/NDJSON)**
1. Go to the "Upload Logs" page
2. Click "Select File" and choose `sample_logs.json` or `sample_logs.ndjson`
3. Click "Upload Logs"

**Option B: Single Log Ingestion**
1. Go to the "Upload Logs" page
2. Fill in the form fields:
   - Event Type (required): e.g., `failed_login`, `unauthorized_access`
   - Source IP: e.g., `192.168.1.100`
   - Destination IP: e.g., `10.0.0.50`
   - Username: e.g., `admin`
   - Action: e.g., `login`
   - Status: e.g., `failed`
3. Click "Ingest Log"

**Option C: REST API**
```bash
curl -X POST "http://localhost:8000/api/logs/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "failed_login",
    "source_ip": "192.168.1.100",
    "username": "admin",
    "action": "login",
    "status": "failed"
  }'
```

### 3. View Alerts

1. Navigate to the "Alerts" page
2. View all generated alerts with:
   - Severity levels
   - AI scores (0-100)
   - MITRE ATT&CK Technique IDs
   - Suppression status
3. Filter alerts by severity, suppression status, IP, username, or time range
4. Provide feedback on alerts (True Positive / False Positive)

### 4. Execute SOAR Actions

1. Navigate to the "SOAR" page
2. Select an action type:
   - **Block IP Address**: Block a suspicious IP
   - **Disable Account**: Disable a compromised account
   - **Send Security Notification**: Send alert to security team
3. Enter the target (IP, username, or email)
4. Optionally add a reason
5. Click "Execute Action"

### 5. Monitor Dashboard

The dashboard provides:
- Total logs and alerts count
- Suppressed alerts count
- Event types distribution (pie chart)
- Daily log counts (bar chart)
- Recent logs table with filters

## API Endpoints

### Logs
- `POST /api/logs/ingest` - Ingest single log
- `POST /api/logs/upload` - Upload bulk logs (JSON/NDJSON)
- `GET /api/logs` - Get logs with filters

### Alerts
- `GET /api/alerts` - Get alerts with filters
- `POST /api/alerts/{alert_id}/feedback` - Submit analyst feedback

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### SOAR
- `POST /api/soar/execute` - Execute SOAR action

## Database Schema

### Log Events Table
- `id`, `timestamp`, `event_type`, `source_ip`, `destination_ip`
- `username`, `action`, `status`, `raw_log`, `normalized_data`
- `geo_location`, `user_risk_score`, `asset_criticality`

### Alerts Table
- `id`, `timestamp`, `event_type`, `severity`, `mitre_technique_id`
- `description`, `source_ip`, `username`, `log_event_id`
- `ai_score`, `is_suppressed`, `suppression_reason`
- `ai_feedback`, `ai_feedback_at`

## AI Scoring & Suppression

The AI scoring module assigns a score from 0-100 to each alert based on:
- Severity level
- User risk score
- Asset criticality
- Event type patterns
- Model uncertainty

Alerts with AI score < 30 are automatically suppressed with reason "low_risk".

Analyst feedback (true_positive/false_positive) is recorded for model improvement.

## MITRE ATT&CK Mapping

The system maps event types to MITRE ATT&CK Technique IDs:
- `failed_login` → T1110.001 (Brute Force)
- `unauthorized_access` → T1078 (Valid Accounts)
- `privilege_escalation` → T1068 (Exploitation)
- `data_exfiltration` → T1041 (Exfiltration)
- And more...

## Performance

- API response time: < 100ms
- Auto-refresh: Every 30 seconds
- Optimized database queries with indexing
- Efficient log processing pipeline

## Development

### Backend Development
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
The FastAPI app can be deployed using:
- Uvicorn with Gunicorn
- Docker
- Cloud platforms (AWS, Azure, GCP)

## Troubleshooting

### Backend Issues
- Ensure Python 3.8+ is installed
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify the database file `siem.db` is created in the backend directory
- Check CORS settings if frontend can't connect

### Frontend Issues
- Ensure Node.js 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that the backend is running on port 8000
- Verify proxy settings in `vite.config.ts`

### Database Issues
- Delete `siem.db` to reset the database
- The database is automatically created on first run

## Sample Data

The repository includes sample log files:
- `sample_logs.json` - JSON array format
- `sample_logs.ndjson` - Newline-delimited JSON format

Upload these files to test the system functionality.

## License

This project is a prototype/demo system for educational purposes.

## Contributing

This is a complete working prototype. Feel free to extend it with:
- Real ML models for AI scoring
- Additional enrichment sources
- More SOAR actions
- Advanced correlation rules
- Real-time streaming
- Multi-tenant support

---

**SecForce SIEM 2.0** - Enterprise Security Information and Event Management Platform

