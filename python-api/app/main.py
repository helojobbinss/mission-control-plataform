from fastapi import FastAPI

from app.api.v1.orbits import router as orbits_router
from app.api.v1.sensors import router as sensors_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.telemetry import router as telemetry_router


app = FastAPI(
    title="Mission Control API",
    description=(
        "API de cálculos orbitais, telemetria "
        "e análise de satélites."
    ),
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "Mission Control API está funcionando!",
        "status": "online",
    }


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "mission-control-python-api",
        "version": "1.0.0",
    }


app.include_router(
    orbits_router,
    prefix="/api/v1/orbits",
    tags=["Órbitas"],
)

app.include_router(
    sensors_router,
    prefix="/api/v1",
)

app.include_router(
    alerts_router,
    prefix="/api/v1",
)

app.include_router(
    telemetry_router,
    prefix="/api/v1"
)