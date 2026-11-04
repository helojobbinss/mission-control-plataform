from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AlertItem(BaseModel):
    code: str
    satellite_id: int
    parameter: str
    severity: str
    measured_value: float | str
    unit: str
    threshold: Optional[float | str] = None
    message: str
    timestamp: datetime


class AlertsResponse(BaseModel):
    satellite_id: int
    simulated: bool
    timestamp: datetime
    total: int
    alerts: List[AlertItem]