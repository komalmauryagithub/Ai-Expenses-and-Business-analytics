from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, analytics

app = FastAPI(
    title="AI Expense & Business Analytics Engine",
    description="High-performance Python FastAPI + Pandas + NumPy Deterministic Analytics Microservice",
    version="1.0.0"
)

# Configure CORS (Restrictive to local service calls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Router Blueprints
app.include_router(health.router)
app.include_router(analytics.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
