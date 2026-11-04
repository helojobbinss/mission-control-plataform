from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.sensor import SensorReading, SensorsResponse


client = TestClient(app)


def make_telemetry(
    battery_level=80.0,
    internal_temperature=25.0,
    voltage=28.0,
    energy_consumption=80.0,
    radiation=20.0,
    communication_status="online",
):
    sensors = {
        "internal_temperature": SensorReading(
            value=internal_temperature,
            unit="°C",
            status="normal",
        ),
        "external_temperature": SensorReading(
            value=10.0,
            unit="°C",
            status="normal",
        ),
        "voltage": SensorReading(
            value=voltage,
            unit="V",
            status="normal",
        ),
        "current": SensorReading(
            value=2.0,
            unit="A",
            status="normal",
        ),
        "radiation": SensorReading(
            value=radiation,
            unit="µSv/h",
            status="normal",
        ),
        "gyroscope_x": SensorReading(
            value=1.0,
            unit="°/s",
            status="normal",
        ),
        "gyroscope_y": SensorReading(
            value=1.0,
            unit="°/s",
            status="normal",
        ),
        "gyroscope_z": SensorReading(
            value=1.0,
            unit="°/s",
            status="normal",
        ),
        "battery_level": SensorReading(
            value=battery_level,
            unit="%",
            status="normal",
        ),
        "energy_consumption": SensorReading(
            value=energy_consumption,
            unit="W",
            status="normal",
        ),
        "pitch": SensorReading(
            value=10.0,
            unit="°",
            status="normal",
        ),
        "roll": SensorReading(
            value=10.0,
            unit="°",
            status="normal",
        ),
        "yaw": SensorReading(
            value=180.0,
            unit="°",
            status="normal",
        ),
        "communication_status": SensorReading(
            value=communication_status,
            unit="status",
            status="normal",
        ),
    }

    return SensorsResponse(
        satellite_id=25544,
        simulated=True,
        timestamp=datetime.now(timezone.utc),
        sensors=sensors,
    )


def test_low_battery_generates_alert(monkeypatch):
    telemetry = make_telemetry(battery_level=15.0)

    monkeypatch.setattr(
        "app.api.v1.alerts.get_satellite_sensors",
        lambda satellite_id: telemetry,
    )

    response = client.get(
        "/api/v1/satellites/25544/alerts"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1

    assert any(
        alert["code"] == "LOW_BATTERY"
        for alert in data["alerts"]
    )


def test_offline_communication_generates_critical_alert(
    monkeypatch,
):
    telemetry = make_telemetry(
        communication_status="offline"
    )

    monkeypatch.setattr(
        "app.api.v1.alerts.get_satellite_sensors",
        lambda satellite_id: telemetry,
    )

    response = client.get(
        "/api/v1/satellites/25544/alerts"
    )

    assert response.status_code == 200

    data = response.json()

    communication_alerts = [
        alert
        for alert in data["alerts"]
        if alert["code"] == "COMMUNICATION_LOST"
    ]

    assert len(communication_alerts) == 1

    assert communication_alerts[0]["severity"] == "critical"


def test_normal_telemetry_returns_no_alerts(monkeypatch):
    telemetry = make_telemetry()

    monkeypatch.setattr(
        "app.api.v1.alerts.get_satellite_sensors",
        lambda satellite_id: telemetry,
    )

    response = client.get(
        "/api/v1/satellites/25544/alerts"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 0
    assert data["alerts"] == []


def test_missing_sensor_generates_sensor_failure_alert():
    from app.services.alert_service import evaluate_sensor_alerts

    telemetry = make_telemetry()

    del telemetry.sensors["battery_level"]

    result = evaluate_sensor_alerts(telemetry)

    assert any(
        alert.code == "SENSOR_FAILURE"
        and alert.parameter == "battery_level"
        for alert in result.alerts
    )