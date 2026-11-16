"""Casos Sprint 6; sem rede, banco ou credenciais reais."""
from datetime import datetime, timezone

import pytest

from app.schemas.sensor import SensorReading, SensorsResponse
from app.services.alert_service import REQUIRED_NUMERIC_SENSORS, evaluate_sensor_alerts
from app.services.telemetry_service import get_satellite_telemetry


def snapshot(parameter, value):
    sensors = {name: SensorReading(value=0.0, unit="QA", status="normal")
               for name in REQUIRED_NUMERIC_SENSORS}
    sensors["battery_level"].value = 80.0
    sensors["voltage"].value = 28.0
    sensors["communication_status"] = SensorReading(value="online", unit="status", status="normal")
    sensors[parameter].value = value
    return SensorsResponse(satellite_id=5, simulated=True,
                           timestamp=datetime(2026, 1, 1, tzinfo=timezone.utc), sensors=sensors)


# CT-006: fronteiras extraídas de alert_service.py, sem mocks.
@pytest.mark.parametrize("parameter,value,code,expected", [
    ("battery_level", 19.99, "LOW_BATTERY", True),
    ("battery_level", 20, "LOW_BATTERY", False),
    ("battery_level", 20.01, "LOW_BATTERY", False),
    ("internal_temperature", 39.99, "HIGH_INTERNAL_TEMPERATURE", False),
    ("internal_temperature", 40, "HIGH_INTERNAL_TEMPERATURE", False),
    ("internal_temperature", 40.01, "HIGH_INTERNAL_TEMPERATURE", True),
    ("voltage", 24.99, "LOW_VOLTAGE", True),
    ("voltage", 25, "LOW_VOLTAGE", False),
    ("voltage", 31, "HIGH_VOLTAGE", False),
    ("voltage", 31.01, "HIGH_VOLTAGE", True),
    ("gyroscope_x", -4.51, "HIGH_ANGULAR_VELOCITY", True),
    ("gyroscope_x", -4.5, "HIGH_ANGULAR_VELOCITY", False),
    ("gyroscope_x", 4.5, "HIGH_ANGULAR_VELOCITY", False),
    ("gyroscope_x", 4.51, "HIGH_ANGULAR_VELOCITY", True),
])
def test_ct006_alert_boundaries(parameter, value, code, expected):
    result = evaluate_sensor_alerts(snapshot(parameter, value))
    assert any(a.code == code and a.parameter == parameter for a in result.alerts) is expected


# CT-007: a geração e a avaliação reais compartilham uma única leitura.
def test_ct007_telemetry_alerts_match_returned_sensors():
    result = get_satellite_telemetry(5)
    expected = evaluate_sensor_alerts(SensorsResponse(
        satellite_id=result.satellite_id, simulated=result.simulated,
        timestamp=result.timestamp, sensors=result.sensors))
    assert result.total_alerts == len(result.alerts) == expected.total
    assert [a.model_dump() for a in result.alerts] == [a.model_dump() for a in expected.alerts]


# CT-008: partições válidas, ausentes/inesperadas do estado de comunicação.
@pytest.mark.parametrize("state,code", [
    ("online", None), ("offline", "COMMUNICATION_LOST"), ("unknown", "SENSOR_FAILURE"),
])
def test_ct008_communication_decision_table(state, code):
    result = evaluate_sensor_alerts(snapshot("communication_status", state))
    codes = [a.code for a in result.alerts if a.parameter == "communication_status"]
    assert codes == ([] if code is None else [code])
