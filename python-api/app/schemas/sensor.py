from datetime import datetime
from typing import Dict

from pydantic import BaseModel


class SensorReading(BaseModel):
    value: float | str
    unit: str
    status: str


class SensorsResponse(BaseModel):
    satellite_id: int
    simulated: bool
    timestamp: datetime
    sensors: Dict[str, SensorReading]