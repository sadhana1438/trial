import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.scores import router as scores_router
from app.api.simulation import router as simulation_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("equiflow.intelligence")

app = FastAPI(
    title="EquiFlow Intelligence Engine",
    version="2.0.0",
    description="Intelligent workload quantification, scoring, and simulation engine.",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Healthcheck
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "equiflow-intelligence-engine",
        "formula_version": "v2.0.0",
    }

# Routes
app.include_router(scores_router)
app.include_router(simulation_router)

