from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_satellite_sensors_returns_success():
    response = client.get(
        "/api/v1/satellites/25544/sensors"
    )

    assert response.status_code == 200


def test_sensor_response_has_expected_structure():
    response = client.get(
        "/api/v1/satellites/25544/sensors"
    )

    data = response.json()

    assert data["satellite_id"] == 25544
    assert data["simulated"] is True
    assert "timestamp" in data
    assert "sensors" in data

    assert "internal_temperature" in data["sensors"]
    assert "external_temperature" in data["sensors"]
    assert "voltage" in data["sensors"]
    assert "current" in data["sensors"]
    assert "radiation" in data["sensors"]
    assert "gyroscope_x" in data["sensors"]
    assert "gyroscope_y" in data["sensors"]
    assert "gyroscope_z" in data["sensors"]


def test_sensor_values_are_within_simulated_ranges():
    response = client.get(
        "/api/v1/satellites/25544/sensors"
    )

    sensors = response.json()["sensors"]

    assert 10 <= sensors["internal_temperature"]["value"] <= 45

    assert -100 <= sensors["external_temperature"]["value"] <= 100

    assert 24 <= sensors["voltage"]["value"] <= 32

    assert 0.5 <= sensors["current"]["value"] <= 5

    assert 0 <= sensors["radiation"]["value"] <= 100

    for axis in ("x", "y", "z"):
        value = sensors[f"gyroscope_{axis}"]["value"]
        assert -5 <= value <= 5


def test_invalid_satellite_id_is_rejected():
    response = client.get(
        "/api/v1/satellites/0/sensors"
    )

    assert response.status_code == 422
    
def test_sensor_response_contains_new_telemetry_fields():
    response = client.get(
        "/api/v1/satellites/25544/sensors"
    )

    assert response.status_code == 200

    data = response.json()
    sensors = data["sensors"]

    expected_fields = {
        "battery_level",
        "energy_consumption",
        "pitch",
        "roll",
        "yaw",
        "communication_status",
    }

    assert expected_fields.issubset(sensors.keys())
    
def test_new_telemetry_values_are_within_expected_ranges():
    response = client.get(
        "/api/v1/satellites/25544/sensors"
    )

    assert response.status_code == 200

    sensors = response.json()["sensors"]

    assert 10 <= sensors["battery_level"]["value"] <= 100

    assert (
        20
        <= sensors["energy_consumption"]["value"]
        <= 150
    )

    assert -180 <= sensors["pitch"]["value"] <= 180
    assert -180 <= sensors["roll"]["value"] <= 180
    assert 0 <= sensors["yaw"]["value"] <= 360

    assert sensors["communication_status"]["value"] in {
        "online",
        "offline",
    }
    
def test_communication_status_has_consistent_status():
    response = client.get(
        "/api/v1/satellites/25544/sensors"
    )

    assert response.status_code == 200

    communication = response.json()["sensors"][
        "communication_status"
    ]

    assert communication["unit"] == "status"

    if communication["value"] == "offline":
        assert communication["status"] == "warning"
    else:
        assert communication["status"] == "normal"