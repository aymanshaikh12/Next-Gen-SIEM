# SecForce SIEM - Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Component Architecture](#component-architecture)
5. [AI Integration (Gemini)](#ai-integration-gemini)
6. [Data Flow](#data-flow)
7. [Security Features](#security-features)
8. [Deployment Architecture](#deployment-architecture)

---

## Overview

SecForce SIEM is an enterprise-grade Security Information and Event Management platform designed to collect, analyze, and respond to security events in real-time. The system leverages AI-powered alert classification using Google's Gemini API to automatically triage and suppress false positives.

### Key Capabilities
- **Multi-format Log Ingestion**: JSON, NDJSON, CSV, CEF, Syslog
- **Real-time Event Processing**: Normalization, enrichment, and correlation
- **AI-Powered Alert Classification**: Intelligent threat detection using Gemini
- **Automated Response**: SOAR (Security Orchestration, Automation, and Response)
- **Advanced Analytics**: Visual dashboards with charts and filters

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Dashboard │  │  Alerts  │  │  Events  │  │   SOAR   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Axios API Client (REST API Calls)            │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Backend (FastAPI + Python)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Layer (Routers)                     │   │
│  │  /api/logs  /api/alerts  /api/soar  /api/dashboard  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Business Logic Layer (Services)            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │Log Processor │  │Alert Engine  │  │Enrichment  │ │   │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │   │
│  │  ┌──────────────┐  ┌──────────────┐                  │   │
│  │  │Log Parsers   │  │Gemini AI     │                  │   │
│  │  └──────────────┘  └──────────────┘                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Data Access Layer (SQLAlchemy)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Database (SQLite)                        │   │
│  │  ┌──────────────┐  ┌──────────────┐                   │   │
│  │  │ log_events   │  │   alerts    │                   │   │
│  │  └──────────────┘  └──────────────┘                   │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ API Calls
                            │
┌───────────────────────────▼─────────────────────────────────┐
│         External Services                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Google Gemini API                            │   │
│  │    (AI-Powered Alert Classification)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework for building interactive components |
| **TypeScript** | 5.2.2 | Type-safe JavaScript for better code quality |
| **Vite** | 5.0.8 | Fast build tool and development server |
| **React Router** | 6.20.0 | Client-side routing and navigation |
| **Axios** | 1.6.2 | HTTP client for API communication |
| **Recharts** | 2.10.3 | Charting library for data visualization |

**Frontend Features:**
- Component-based architecture
- Responsive design with dark theme
- Real-time data updates (30-second auto-refresh)
- Advanced filtering and search capabilities
- Professional UI/UX design

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.8+ | Programming language |
| **FastAPI** | 0.104.1 | Modern, fast web framework for building APIs |
| **SQLAlchemy** | 2.0.23 | ORM for database operations |
| **SQLite** | 3.x | Lightweight relational database |
| **Pydantic** | 2.5.0 | Data validation using Python type annotations |
| **Uvicorn** | 0.24.0 | ASGI server for running FastAPI |
| **python-multipart** | 0.0.6 | File upload support |

**Backend Features:**
- RESTful API design
- Automatic API documentation (Swagger/OpenAPI)
- CORS middleware for cross-origin requests
- Async/await for high performance
- Database migrations support

### AI/ML

| Technology | Version | Purpose |
|------------|---------|---------|
| **Google Gemini API** | Latest | AI-powered alert classification and scoring |
| **python-dotenv** | 1.0.0 | Environment variable management |

---

## Component Architecture

### Frontend Components

#### 1. **Dashboard Component** (`pages/Dashboard.tsx`)
- **Purpose**: Main security overview dashboard
- **Features**:
  - Real-time statistics (total logs, alerts, suppression rate)
  - Event types distribution (pie chart)
  - Daily log counts (bar chart)
  - Recent logs table with filters
- **Data Sources**: `/api/dashboard/stats`, `/api/logs`

#### 2. **Events Component** (`pages/Events.tsx`)
- **Purpose**: Log ingestion and event monitoring
- **Features**:
  - Single log ingestion via JSON editor
  - Bulk file upload (multiple formats)
  - Event volume visualization
  - Recent logs table
  - Sidebar filters and SOAR actions
- **Data Sources**: `/api/logs/ingest`, `/api/logs/upload`, `/api/logs`

#### 3. **Alerts Component** (`pages/Alerts.tsx`)
- **Purpose**: Security alert management
- **Features**:
  - Alert table with AI scores and classifications
  - Filtering by severity, suppression status, IP, username
  - Analyst feedback (true positive/false positive)
  - MITRE ATT&CK technique mapping
- **Data Sources**: `/api/alerts`

#### 4. **SOAR Component** (`pages/SOAR.tsx`)
- **Purpose**: Security automation and response
- **Features**:
  - IP blocking
  - Account disabling
  - Security notifications
- **Data Sources**: `/api/soar/execute`

### Backend Services

#### 1. **Log Processing Service** (`services/log_processor.py`)
- **Function**: Normalize and standardize log data
- **Input**: Raw log data in various formats
- **Output**: Standardized log structure
- **Key Functions**:
  - `normalize_log()`: Maps different field names to standard schema
  - `process_log()`: Normalizes and enriches single log
  - `process_bulk_logs()`: Batch processing

#### 2. **Log Parsers Service** (`services/log_parsers.py`)
- **Function**: Parse logs from different formats
- **Supported Formats**:
  - JSON/NDJSON
  - CSV
  - CEF (Common Event Format)
  - Syslog
- **Key Functions**:
  - `detect_file_format()`: Auto-detect log format
  - `parse_logs_from_content()`: Parse file content
  - Format-specific parsers (CEF, syslog, CSV)

#### 3. **Enrichment Service** (`services/enrichment.py`)
- **Function**: Add contextual information to logs
- **Enrichments**:
  - Geo-IP location (simulated)
  - User risk scoring
  - Asset criticality scoring
- **Key Functions**:
  - `enrich_log()`: Apply all enrichments
  - `get_geo_location()`: IP geolocation
  - `calculate_user_risk()`: User risk assessment
  - `calculate_asset_criticality()`: Asset importance scoring

#### 4. **Alert Engine Service** (`services/alert_engine.py`)
- **Function**: Correlate events and generate alerts
- **Features**:
  - Rule-based correlation
  - MITRE ATT&CK technique mapping
  - Severity classification
  - AI-powered scoring integration
- **Key Functions**:
  - `correlate_and_create_alert()`: Main correlation logic
  - `get_severity()`: Determine alert severity
  - `get_mitre_technique()`: Map to MITRE ATT&CK

#### 5. **Gemini AI Service** (`services/gemini_ai.py`)
- **Function**: AI-powered alert classification
- **Features**:
  - Risk scoring (0-100)
  - Alert classification
  - Suppression recommendations
  - Fallback to rule-based if API unavailable
- **Key Functions**:
  - `classify_alert_with_gemini()`: Main AI classification
  - `_fallback_classification()`: Rule-based fallback

---

## AI Integration (Gemini)

### Overview

SecForce SIEM integrates Google's Gemini AI for intelligent alert classification and risk assessment. The AI analyzes security alerts and provides:

1. **Risk Scoring**: Numerical score from 0-100 indicating threat severity
2. **Alert Classification**: Categorization (e.g., "Brute Force Attack", "Unauthorized Access")
3. **Suppression Recommendations**: Automatic suppression of low-risk alerts
4. **Contextual Analysis**: Considers event type, user risk, asset criticality

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Alert Generation                          │
│  (Rule-based correlation detects suspicious event)         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Alert Data Preparation                          │
│  - Event Type                                               │
│  - Severity                                                 │
│  - Source IP, Username                                      │
│  - User Risk Score                                          │
│  - Asset Criticality                                        │
│  - Description                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Gemini API Integration                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Prompt Engineering:                                  │  │
│  │  - Structured prompt with alert context              │  │
│  │  - Request: risk_score, suppress, classification     │  │
│  │  - JSON response format                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Call:                                           │  │
│  │  POST to Gemini API                                  │  │
│  │  Model: gemini-pro                                   │  │
│  │  Response: JSON with analysis                        │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Response Processing                            │
│  - Parse JSON response                                      │
│  - Extract risk_score (0-100)                               │
│  - Extract suppression recommendation                       │
│  - Extract classification label                             │
│  - Handle errors gracefully                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Alert Storage                                  │
│  - Store AI score in database                               │
│  - Apply suppression if recommended                         │
│  - Store classification for display                         │
│  - Record feedback for model improvement                    │
└─────────────────────────────────────────────────────────────┘
```

### Gemini API Configuration

**API Key Management:**
- Stored in environment variable: `GEMINI_API_KEY`
- Default key configured in code (for development)
- Production: Use `.env` file or environment variables

**Model Used:**
- **Model**: `gemini-pro`
- **Provider**: Google Generative AI
- **Endpoint**: Google's Gemini API

### Prompt Engineering

The system sends structured prompts to Gemini with the following format:

```
You are a security analyst AI assistant. Analyze this security alert and provide:
1. Risk score (0-100): How serious is this threat?
2. Should it be suppressed? (yes/no)
3. Suppression reason if yes
4. Alert classification (e.g., "Brute Force Attack", "Unauthorized Access", etc.)

Alert Details:
- Event Type: {event_type}
- Severity: {severity}
- Source IP: {source_ip}
- Username: {username}
- User Risk Score: {user_risk_score}
- Asset Criticality: {asset_criticality}
- Description: {description}

Respond in JSON format:
{
  "risk_score": <number 0-100>,
  "suppress": <true/false>,
  "suppression_reason": "<reason or null>",
  "classification": "<alert classification>"
}
```

### Response Handling

**Success Response:**
```json
{
  "risk_score": 85.5,
  "suppress": false,
  "suppression_reason": null,
  "classification": "Brute Force Attack"
}
```

**Error Handling:**
- If Gemini API fails → Falls back to rule-based classification
- If API key missing → Uses fallback classification
- If rate limit exceeded → Uses cached results or fallback
- All errors logged for monitoring

### Fallback Mechanism

When Gemini API is unavailable:
1. Uses rule-based scoring from `ai_scorer.py`
2. Applies pattern matching for classification
3. Maintains system functionality
4. Logs fallback usage for monitoring

### Feedback Loop

**Analyst Feedback:**
- Analysts can mark alerts as "true_positive" or "false_positive"
- Feedback stored in database with timestamps
- Used for future model improvement (future enhancement)
- Helps tune suppression thresholds

---

## Data Flow

### Log Ingestion Flow

```
1. User uploads log file (JSON/CSV/CEF/Syslog)
   │
   ▼
2. Frontend sends file to /api/logs/upload
   │
   ▼
3. Backend detects format (auto-detection)
   │
   ▼
4. Parser extracts log entries
   │
   ▼
5. Each log normalized to standard schema
   │
   ▼
6. Enrichment applied (geo-IP, risk scores)
   │
   ▼
7. Logs stored in database (log_events table)
   │
   ▼
8. Alert engine checks for suspicious patterns
   │
   ▼
9. If suspicious → Generate alert
   │
   ▼
10. Gemini AI classifies alert
   │
   ▼
11. Alert stored with AI score and classification
   │
   ▼
12. Frontend displays in Alerts page
```

### Alert Classification Flow

```
1. Suspicious event detected
   │
   ▼
2. Alert data prepared (event_type, severity, IP, user, etc.)
   │
   ▼
3. Gemini API called with structured prompt
   │
   ▼
4. AI analyzes alert context
   │
   ▼
5. Returns: risk_score, suppress, classification
   │
   ▼
6. Alert stored with AI metadata
   │
   ▼
7. If suppressed → Hidden from active alerts
   │
   ▼
8. Analyst can provide feedback
   │
   ▼
9. Feedback stored for model improvement
```

---

## Security Features

### Authentication & Authorization
- **Current**: Development mode (no auth)
- **Production**: Should implement JWT tokens, OAuth2, or API keys

### Data Security
- **Database**: SQLite (development) → PostgreSQL/MySQL (production)
- **Encryption**: HTTPS/TLS for API communication
- **Sensitive Data**: API keys stored in environment variables

### Input Validation
- **Pydantic Schemas**: Automatic validation of API inputs
- **File Upload**: Size limits and format validation
- **SQL Injection**: Protected by SQLAlchemy ORM

### CORS Configuration
- **Allowed Origins**: Configurable in `main.py`
- **Methods**: All HTTP methods allowed
- **Headers**: All headers allowed

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────┐
│         Developer Machine                │
│  ┌──────────────┐  ┌──────────────┐    │
│  │  Frontend    │  │   Backend    │    │
│  │  (Vite)      │  │  (Uvicorn)   │    │
│  │  :5173       │  │  :8000       │    │
│  └──────────────┘  └──────────────┘    │
│  ┌──────────────────────────────────┐  │
│  │      SQLite Database              │  │
│  │      (Local file: siem.db)        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Production Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                  (Nginx/HAProxy)                         │
└───────────────┬───────────────────┬─────────────────────┘
                │                   │
    ┌───────────▼──────────┐  ┌────▼──────────────┐
    │   Frontend Server    │  │  Backend Servers  │
    │   (Nginx/Static)     │  │  (Gunicorn +     │
    │   React Build        │  │   Uvicorn)       │
    └──────────────────────┘  │  Multiple Workers │
                              └────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    Database Server          │
                    │    (PostgreSQL/MySQL)      │
                    │    - Primary + Replica     │
                    └────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    External Services        │
                    │    - Gemini API             │
                    │    - Geo-IP Service         │
                    └────────────────────────────┘
```

### Scaling Considerations

**Horizontal Scaling:**
- Frontend: Static files on CDN
- Backend: Multiple FastAPI instances behind load balancer
- Database: Read replicas for query distribution

**Vertical Scaling:**
- Increase worker processes (Gunicorn)
- Database connection pooling
- Caching layer (Redis) for frequent queries

**Performance Optimization:**
- Database indexing on frequently queried fields
- Async processing for log ingestion
- Background tasks for alert generation
- Caching of AI classifications

---

## API Endpoints

### Logs API
- `POST /api/logs/ingest` - Ingest single log
- `POST /api/logs/upload` - Upload bulk logs (file)
- `GET /api/logs` - Get logs with filters

### Alerts API
- `GET /api/alerts` - Get alerts with filters
- `POST /api/alerts/{id}/feedback` - Submit analyst feedback

### Dashboard API
- `GET /api/dashboard/stats` - Get dashboard statistics

### SOAR API
- `POST /api/soar/execute` - Execute SOAR action

---

## Database Schema

### log_events Table
```sql
- id (INTEGER, PRIMARY KEY)
- timestamp (DATETIME)
- event_type (STRING, INDEXED)
- source_ip (STRING, INDEXED)
- destination_ip (STRING)
- username (STRING, INDEXED)
- action (STRING)
- status (STRING)
- raw_log (TEXT)
- normalized_data (TEXT)
- geo_location (STRING)
- user_risk_score (FLOAT)
- asset_criticality (FLOAT)
- created_at (DATETIME)
```

### alerts Table
```sql
- id (INTEGER, PRIMARY KEY)
- timestamp (DATETIME, INDEXED)
- event_type (STRING, INDEXED)
- severity (STRING, INDEXED)
- mitre_technique_id (STRING)
- description (TEXT)
- source_ip (STRING, INDEXED)
- username (STRING, INDEXED)
- log_event_id (INTEGER, INDEXED)
- ai_score (FLOAT, INDEXED)
- is_suppressed (BOOLEAN, INDEXED)
- suppression_reason (STRING)
- ai_feedback (STRING)
- ai_feedback_at (DATETIME)
- ai_classification (STRING)
- created_at (DATETIME)
```

---

## Environment Variables

### Backend (.env)
```bash
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Database (optional, defaults to SQLite)
DATABASE_URL=sqlite:///./siem.db

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### Frontend (.env)
```bash
# API Base URL
VITE_API_URL=http://localhost:8000
```

---

## Development Workflow

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Testing
- Backend: FastAPI automatic docs at `/docs`
- Frontend: Hot reload on file changes
- API Testing: Use Swagger UI at `http://localhost:8000/docs`

---

## Future Enhancements

### Planned Features
1. **Real-time Streaming**: WebSocket support for live log streaming
2. **Advanced ML Models**: Custom trained models for specific use cases
3. **Multi-tenant Support**: Organization isolation
4. **Advanced SOAR**: More automation playbooks
5. **Threat Intelligence**: Integration with threat feeds
6. **Compliance Reporting**: SOC 2, ISO 27001 reports
7. **Distributed Architecture**: Kafka for log streaming
8. **Advanced Analytics**: Machine learning for anomaly detection

---

## Conclusion

SecForce SIEM is built with modern technologies and best practices, providing a scalable foundation for security operations. The integration of Gemini AI enhances threat detection capabilities while maintaining system reliability through fallback mechanisms.

For questions or contributions, please refer to the main README.md file.

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Maintained By**: SecForce Development Team

