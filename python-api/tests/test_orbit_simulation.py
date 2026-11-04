from datetime import datetime, timedelta, timezone
from math import radians, asin, sin

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import orbits
from app.services.orbit_service import calculate_satellite_position
from app.services.orbit_simulation_service import (
    orbital_period_seconds,
    simulate_circular_orbit_position,
)

# TLE de exemplo da ISS (documentação do sgp4).
ISS_L1 = "1 25544U 98067A   19343.69339541  .00001764  00000-0  38792-4 0  9991"
ISS_L2 = "2 25544  51.6439 211.2001 0007417  17.6667  85.6398 15.50103472202482"

app = FastAPI()
app.include_router(orbits.router, prefix="/api/v1/orbits")
client = TestClient(app)

EPOCH = datetime(2026, 1, 1, tzinfo=timezone.utc)


def test_sgp4_position_has_geodetic_values():
    result = calculate_satellite_position(
        ISS_L1, ISS_L2, datetime(2019, 12, 9, 12, 0, tzinfo=timezone.utc)
    )
    pos = result["orbital_position"]
    assert result["simulated"] is False
    assert abs(pos["latitude"]) <= 51.7          # limitada pela inclinação
    assert -180 <= pos["longitude"] <= 180
    assert 380 < pos["altitude_km"] < 450         # altitude típica da ISS
    assert 7.5 < pos["orbital_speed_km_s"] < 7.8


def test_simulated_orbit_altitude_speed_and_latitude_limit():
    for minutes in range(0, 600, 7):
        r = simulate_circular_orbit_position(
            550, 53, 10, 0, EPOCH, EPOCH + timedelta(minutes=minutes)
        )
        pos = r["orbital_position"]
        assert abs(pos["altitude_km"] - 550) < 25      # elipsoide: ±21 km
        assert abs(pos["latitude"]) <= 53.2
        assert -180 <= pos["longitude"] <= 180
        assert abs(pos["orbital_speed_km_s"] - 7.59) < 0.05


def test_simulated_orbit_is_periodic_in_inertial_frame():
    period = orbital_period_seconds(550)
    a = simulate_circular_orbit_position(550, 53, 0, 30, EPOCH, EPOCH)
    b = simulate_circular_orbit_position(
        550, 53, 0, 30, EPOCH, EPOCH + timedelta(seconds=period)
    )
    for axis in "xyz":
        assert abs(a["position_km"][axis] - b["position_km"][axis]) < 1e-6
    assert 94 < period / 60 < 97


def test_equatorial_orbit_stays_on_equator():
    r = simulate_circular_orbit_position(
        700, 0, 0, 0, EPOCH, EPOCH + timedelta(minutes=33)
    )
    assert abs(r["orbital_position"]["latitude"]) < 1e-6


def test_polar_orbit_reaches_the_pole():
    period = orbital_period_seconds(800)
    r = simulate_circular_orbit_position(
        800, 90, 0, 0, EPOCH, EPOCH + timedelta(seconds=period / 4)
    )
    assert r["orbital_position"]["latitude"] > 89.5


def test_endpoint_simulate_ok():
    resp = client.post("/api/v1/orbits/simulate", json={
        "altitude_km": 500, "inclination_deg": 98, "epoch": EPOCH.isoformat(),
        "calculation_time": (EPOCH + timedelta(minutes=10)).isoformat(),
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["source"] == "simulation" and body["simulated"] is True
    assert set(body["orbital_position"]) == {
        "latitude", "longitude", "altitude_km", "orbital_speed_km_s"}


def test_endpoint_simulate_validation():
    base = {"altitude_km": 500, "inclination_deg": 98, "epoch": EPOCH.isoformat()}
    assert client.post("/api/v1/orbits/simulate", json={**base, "altitude_km": 10}).status_code == 422
    assert client.post("/api/v1/orbits/simulate", json={**base, "inclination_deg": 200}).status_code == 422
    assert client.post("/api/v1/orbits/simulate", json={**base, "epoch": "2026-01-01T00:00:00"}).status_code == 422
