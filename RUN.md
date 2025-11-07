# How to Run SecForce SIEM

## Quick Start Guide

Follow these steps to run the SecForce SIEM system locally.

---

## Prerequisites

Before running, ensure you have:
- **Python 3.8+** installed
- **Node.js 18+** installed
- **npm** or **yarn** installed

Check versions:
```bash
python3 --version
node --version
npm --version
```

---

## Step 1: Start the Backend Server

### Option A: Using the Startup Script (Recommended)

**On macOS/Linux:**
```bash
cd backend
chmod +x run.sh
./run.sh
```

**On Windows:**
```bash
cd backend
run.bat
```

### Option B: Manual Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python3 -m venv venv
```

3. **Activate virtual environment:**
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```
   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Start the server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Verify Backend is Running

Open your browser and visit:
- **API Health Check**: http://localhost:8000/health
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

You should see:
- Health endpoint returns: `{"status":"healthy"}`
- Swagger UI at `/docs` showing all API endpoints

---

## Step 2: Start the Frontend Server

**Open a NEW terminal window** (keep backend running in the first terminal)

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies (first time only):**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

### Verify Frontend is Running

You should see output like:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

The frontend will automatically open at: **http://localhost:5173**

---

## Step 3: Access the Application

1. **Open your browser** and go to: **http://localhost:5173**

2. **You should see:**
   - SecForce SIEM dashboard
   - Navigation menu (Events, Alerts, Dashboard)
   - Dark theme interface

---

## Running Both Servers Together

### Using VS Code Tasks

1. Open project in VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type: "Tasks: Run Task"
4. Select: **"Start Both Servers"**

### Using Terminal (Two Windows)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Testing the System

### 1. Upload Sample Logs

1. Go to **Events** page or **Upload Logs** page
2. Click **"Choose file"** or **"Select File"**
3. Select one of the sample files:
   - `suspicious_logins.json` (34 suspicious events)
   - `sample_logs.json` (10 sample events)
   - `sample_logs.csv`
   - `sample_logs.cef`
   - `sample_logs.syslog`
4. Click **"Upload Logs"**
5. Wait for success message

### 2. View Alerts

1. Navigate to **Alerts** page
2. You should see alerts generated from uploaded logs
3. Check AI scores and classifications
4. Some alerts may be auto-suppressed (low AI score)

### 3. Check Dashboard

1. Navigate to **Dashboard** page
2. View statistics:
   - Total logs count
   - Total alerts count
   - Suppressed alerts
3. See charts:
   - Event types distribution (pie chart)
   - Daily log counts (bar chart)

### 4. Test SOAR Actions

1. Go to **SOAR** page or use sidebar in Events page
2. Enter an IP address
3. Click **"Block IP"**
4. You should see a success message

---

## Troubleshooting

### Backend Won't Start

**Problem**: `ModuleNotFoundError` or `command not found: uvicorn`

**Solution**:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Problem**: Port 8000 already in use

**Solution**: Kill the process using port 8000
```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Frontend Won't Start

**Problem**: `npm: command not found`

**Solution**: Install Node.js from https://nodejs.org/

**Problem**: Port 5173 already in use

**Solution**: Vite will automatically use next available port, or:
```bash
npm run dev -- --port 3000
```

### Cannot Connect Frontend to Backend

**Problem**: "Network Error" or "Cannot connect to server"

**Solutions**:
1. **Verify backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check CORS settings** in `backend/app/main.py`

3. **Restart both servers**

4. **Clear browser cache** and refresh

### Database Issues

**Problem**: Database errors or missing tables

**Solution**: Delete database and restart backend (it will recreate):
```bash
cd backend
rm siem.db  # or delete siem.db file
# Restart backend server
```

### Gemini API Errors

**Problem**: AI classification not working

**Solutions**:
1. **Check API key** in `backend/app/services/gemini_ai.py`
2. **Verify internet connection** (API requires internet)
3. **System will use fallback** if Gemini unavailable (no error)

---

## Development Commands

### Backend Commands

```bash
# Start with auto-reload
uvicorn app.main:app --reload

# Start on specific port
uvicorn app.main:app --reload --port 8001

# Start without reload (production-like)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Check API documentation
# Visit: http://localhost:8000/docs
```

### Frontend Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install new package
npm install <package-name>
```

---

## Project Structure

```
NEXTGEN_SIEM_2.0/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py       # FastAPI application
│   │   ├── routers/      # API endpoints
│   │   └── services/     # Business logic
│   ├── requirements.txt  # Python dependencies
│   └── run.sh           # Startup script
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/       # React components
│   │   └── services/    # API client
│   ├── package.json     # Node dependencies
│   └── vite.config.ts   # Vite configuration
│
├── sample_logs.json     # Sample log files
├── suspicious_logins.json
├── README.md           # Main documentation
├── ARCHITECTURE.md      # Architecture docs
└── QUICKSTART.md       # Quick start guide
```

---

## Environment Variables

### Backend (.env file)

Create `backend/.env` file (optional):
```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./siem.db
```

### Frontend (.env file)

Create `frontend/.env` file (optional):
```bash
VITE_API_URL=http://localhost:8000
```

---

## Stopping the Servers

### Stop Backend
- Press `Ctrl+C` in the backend terminal
- Or close the terminal window

### Stop Frontend
- Press `Ctrl+C` in the frontend terminal
- Or close the terminal window

---

## Next Steps

1. ✅ **Upload logs** - Try uploading `suspicious_logins.json`
2. ✅ **View alerts** - Check the Alerts page for generated alerts
3. ✅ **Explore dashboard** - See statistics and charts
4. ✅ **Test SOAR** - Try blocking an IP address
5. ✅ **Provide feedback** - Mark alerts as true/false positive

---

## Need Help?

- **API Documentation**: http://localhost:8000/docs
- **Architecture Docs**: See `ARCHITECTURE.md`
- **Quick Start**: See `QUICKSTART.md`
- **GitHub**: https://github.com/aymanshaikh12/Next-Gen-SIEM

---

**Happy Securing! 🔒**

