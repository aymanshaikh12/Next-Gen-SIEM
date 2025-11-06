# Quick Start Guide

Get SecForce SIEM up and running in 5 minutes!

## Step 1: Start the Backend

**Option A: Using the startup script (Linux/Mac)**
```bash
cd backend
./run.sh
```

**Option B: Using the startup script (Windows)**
```cmd
cd backend
run.bat
```

**Option C: Manual setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will start on `http://localhost:8000`

## Step 2: Start the Frontend

Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## Step 3: Access the Application

1. Open your browser and go to: `http://localhost:5173`
2. You should see the SecForce SIEM dashboard

## Step 4: Upload Sample Logs

1. Click on "Upload Logs" in the navigation
2. Click "Select File" and choose `sample_logs.json` from the project root
3. Click "Upload Logs"
4. Wait for the upload to complete

## Step 5: Explore the Features

- **Dashboard**: View statistics, charts, and recent logs
- **Alerts**: See generated alerts with AI scores and suppression status
- **Upload Logs**: Ingest more logs (single or bulk)
- **SOAR**: Execute automated security actions

## Troubleshooting

### Backend won't start
- Make sure Python 3.8+ is installed: `python --version`
- Check if port 8000 is available
- Try deleting `siem.db` and restarting

### Frontend won't start
- Make sure Node.js 18+ is installed: `node --version`
- Delete `node_modules` and run `npm install` again
- Check if port 5173 is available

### Can't connect frontend to backend
- Verify backend is running on port 8000
- Check browser console for CORS errors
- Ensure both servers are running

## Next Steps

- Upload your own log files
- Create custom alerts
- Test SOAR automation
- Provide feedback on alerts to improve AI scoring

Enjoy using SecForce SIEM! 🚀

