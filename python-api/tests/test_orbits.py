from fastapi.testclient import TestClient

from sgp4 import exporter
from sgp4.api import Satrec
from app.services.celestrak_service import (OrbitalDataSourceError,SatelliteNotFoundError,)

from app.main import app


client = TestClient(app)


TLE_LINE1 = (
    "1 00005U 58002B   00179.78495062  .00000023  "
    "00000-0  28098-4 0  4753"
)

TLE_LINE2 = (
    "2 00005  34.2682 348.7242 1859667 "
    "331.7664  19.3264 10.82419157413667"
)


def test_calculate_satellite_position():
    response = client.post(
        "/api/v1/orbits/position",
        json={
            "tle_line1": TLE_LINE1,
            "tle_line2": TLE_LINE2,
            "calculation_time": "2000-06-29T18:50:19Z",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["coordinate_frame"] == "TEME"

    assert set(data["position_km"]) == {"x", "y", "z"}
    assert set(data["velocity_km_s"]) == {"x", "y", "z"}


def test_calculation_time_requires_timezone():
    response = client.post(
        "/api/v1/orbits/position",
        json={
            "tle_line1": TLE_LINE1,
            "tle_line2": TLE_LINE2,
            "calculation_time": "2000-06-29T18:50:19",
        },
    )

    assert response.status_code == 422


def test_calculate_position_using_norad_id(monkeypatch):
    satellite = Satrec.twoline2rv(
        TLE_LINE1,
        TLE_LINE2,
    )

    omm_record = exporter.export_omm(
        satellite,
        "VANGUARD 1",
    )

    def fake_fetch_omm_record(norad_id):
        assert norad_id == 5
        return omm_record

    monkeypatch.setattr(
        "app.api.v1.orbits.fetch_omm_record",
        fake_fetch_omm_record,
    )

    response = client.get(
        "/api/v1/orbits/5/position",
        params={
            "calculation_time": "2000-06-29T18:50:19Z",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["satellite"]["norad_id"] == 5
    assert data["satellite"]["name"] == "VANGUARD 1"
    assert data["source"] == "CelesTrak"
    assert data["coordinate_frame"] == "TEME"

    assert set(data["position_km"]) == {"x", "y", "z"}
    assert set(data["velocity_km_s"]) == {"x", "y", "z"}


def test_calculate_position_rejects_datetime_without_timezone(
    monkeypatch,
):
    satellite = Satrec.twoline2rv(
        TLE_LINE1,
        TLE_LINE2,
    )

    omm_record = exporter.export_omm(
        satellite,
        "VANGUARD 1",
    )

    monkeypatch.setattr(
        "app.api.v1.orbits.fetch_omm_record",
        lambda norad_id: omm_record,
    )

    response = client.get(
        "/api/v1/orbits/5/position",
        params={
            "calculation_time": "2000-06-29T18:50:19",
        },
    )

    assert response.status_code == 422
def test_satellite_not_found(monkeypatch):
    def fake_fetch_omm_record(norad_id):
        raise SatelliteNotFoundError(
            f"Satélite {norad_id} não encontrado."
        )

    monkeypatch.setattr(
        "app.api.v1.orbits.fetch_omm_record",
        fake_fetch_omm_record,
    )

    response = client.get(
        "/api/v1/orbits/99999999/position"
    )

    assert response.status_code == 404
    
def test_orbital_data_source_unavailable(monkeypatch):
    def fake_fetch_omm_record(norad_id):
        raise OrbitalDataSourceError(
            "Não foi possível consultar os dados orbitais."
        )

    monkeypatch.setattr(
        "app.api.v1.orbits.fetch_omm_record",
        fake_fetch_omm_record,
    )

    response = client.get(
        "/api/v1/orbits/25544/position"
    )

    assert response.status_code == 502

def test_invalid_omm_record_returns_422(monkeypatch):
    monkeypatch.setattr(
        "app.api.v1.orbits.fetch_omm_record",
        lambda norad_id: {},
    )

    response = client.get(
        "/api/v1/orbits/25544/position"
    )

    assert response.status_code == 422