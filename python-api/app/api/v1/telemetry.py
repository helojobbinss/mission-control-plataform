from fastapi import APIRouter, Path

from app.schemas.telemetry import TelemetrySnapshotResponse
from app.services.telemetry_service import get_satellite_telemetry


router = APIRouter(
    prefix="/satellites",
    tags=["Telemetry"],
)


@router.get(
    "/{satellite_id}/telemetry",
    response_model=TelemetrySnapshotResponse,
)
def get_telemetry(
    satellite_id: int = Path(..., gt=0),
) -> TelemetrySnapshotResponse:
    """
    Retorna uma leitura de telemetria e os alertas
    identificados a partir dessa mesma leitura.
    """

    return get_satellite_telemetry(satellite_id)