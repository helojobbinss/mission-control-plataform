from fastapi import APIRouter, Path

from app.schemas.alert import AlertsResponse
from app.services.alert_service import evaluate_sensor_alerts
from app.services.sensor_service import get_satellite_sensors


router = APIRouter(
    prefix="/satellites",
    tags=["Alertas"],
)


@router.get(
    "/{satellite_id}/alerts",
    response_model=AlertsResponse,
)
def get_satellite_alerts(
    satellite_id: int = Path(..., gt=0),
) -> AlertsResponse:
    """
    Gera uma leitura simulada e avalia as condições
    operacionais do satélite.
    """

    telemetry = get_satellite_sensors(satellite_id)

    return evaluate_sensor_alerts(telemetry)