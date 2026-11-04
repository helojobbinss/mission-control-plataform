from datetime import datetime
from typing import Dict, List

from pydantic import BaseModel

from app.schemas.sensor import SensorReading
from app.schemas.alert import AlertItem


class OrbitalPosition(BaseModel):
    latitude: float
    longitude: float
    altitude_km: float
    orbital_speed_km_s: float


class TelemetrySnapshotResponse(BaseModel):
    satellite_id: int
    simulated: bool
    timestamp: datetime
    sensors: Dict[str, SensorReading]
    orbital_position: OrbitalPosition | None = None
    total_alerts: int
    alerts: List[AlertItem]