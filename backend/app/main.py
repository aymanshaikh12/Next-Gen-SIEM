from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import logs, alerts, soar, dashboard

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SecForce SIEM API",
    description="Enterprise Security Information and Event Management System",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(logs.router)
app.include_router(alerts.router)
app.include_router(soar.router)
app.include_router(dashboard.router)

@app.get("/")
async def root():
    return {
        "message": "SecForce SIEM API",
        "version": "2.0.0",
        "endpoints": {
            "logs": "/api/logs",
            "alerts": "/api/alerts",
            "soar": "/api/soar",
            "dashboard": "/api/dashboard"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

