from fastapi import APIRouter, Path

from app.schemas.sensor import SensorsResponse
from app.services.sensor_service import get_satellite_sensors


router = APIRouter(
    prefix="/satellites",
    tags=["Sensors"],
)


@router.get(
    "/{satellite_id}/sensors",
    response_model=SensorsResponse,
)
def get_sensors(
    satellite_id: int = Path(..., gt=0),
) -> SensorsResponse:
    return get_satellite_sensors(satellite_id)