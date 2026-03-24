# ============================================================
# BusGo — FastAPI Backend
# main.py — Application entry point
# ============================================================
# Run: uvicorn main:app --reload
# Swagger Docs: http://localhost:8000/docs
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import buses, bookings

app = FastAPI(
    title="BusGo API",
    description="Backend API for the BusGo Bus Ticket Booking Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow requests from your frontend (adjust origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # In production: replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include route modules
app.include_router(buses.router,    prefix="/buses",    tags=["Buses"])
app.include_router(bookings.router, prefix="/bookings", tags=["Bookings"])


@app.get("/", tags=["Health"])
def health_check():
    """BusGo API health check endpoint."""
    return {"status": "ok", "service": "BusGo API", "version": "1.0.0"}


@app.get("/ping", tags=["Health"])
def ping():
    return {"pong": True}
