from datetime import datetime
from math import cos, pi, radians, sin, sqrt

from app.services.geodetic_service import eci_to_geodetic


# Parâmetro gravitacional da Terra (km³/s²) e raio equatorial (km).
EARTH_MU_KM3_S2 = 398600.4418
EARTH_RADIUS_KM = 6378.137


def orbital_period_seconds(altitude_km: float) -> float:
    semi_major_axis = EARTH_RADIUS_KM + altitude_km

    return 2 * pi * sqrt(semi_major_axis**3 / EARTH_MU_KM3_S2)


def simulate_circular_orbit_position(
    altitude_km: float,
    inclination_deg: float,
    raan_deg: float,
    initial_anomaly_deg: float,
    epoch: datetime,
    calculation_time: datetime,
) -> dict:
    """
    Simula a posição de um satélite em órbita circular kepleriana.

    É usada para satélites cadastrados manualmente, que não possuem
    elementos orbitais reais (TLE/OMM). O resultado tem o mesmo
    formato do cálculo SGP4, com `simulated = True`.

    Limitações: órbita circular, sem perturbações (J2, arrasto).
    """

    for name, value in (
        ("epoch", epoch),
        ("calculation_time", calculation_time),
    ):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError(
                f"O campo {name} deve incluir o fuso horário."
            )

    semi_major_axis = EARTH_RADIUS_KM + altitude_km
    period = orbital_period_seconds(altitude_km)
    mean_motion = 2 * pi / period

    elapsed = (calculation_time - epoch).total_seconds()

    argument_of_latitude = (
        radians(initial_anomaly_deg) + mean_motion * elapsed
    ) % (2 * pi)

    inclination = radians(inclination_deg)
    raan = radians(raan_deg)

    cos_u, sin_u = cos(argument_of_latitude), sin(argument_of_latitude)
    cos_o, sin_o = cos(raan), sin(raan)
    cos_i, sin_i = cos(inclination), sin(inclination)

    position = (
        semi_major_axis * (cos_o * cos_u - sin_o * cos_i * sin_u),
        semi_major_axis * (sin_o * cos_u + cos_o * cos_i * sin_u),
        semi_major_axis * (sin_i * sin_u),
    )

    speed = sqrt(EARTH_MU_KM3_S2 / semi_major_axis)

    velocity = (
        speed * (-cos_o * sin_u - sin_o * cos_i * cos_u),
        speed * (-sin_o * sin_u + cos_o * cos_i * cos_u),
        speed * (sin_i * cos_u),
    )

    geodetic = eci_to_geodetic(position, calculation_time)

    return {
        "calculation_time": calculation_time.isoformat(),
        "coordinate_frame": "ECI",
        "simulated": True,
        "position_km": {
            "x": position[0],
            "y": position[1],
            "z": position[2],
        },
        "velocity_km_s": {
            "x": velocity[0],
            "y": velocity[1],
            "z": velocity[2],
        },
        "orbital_position": {
            "latitude": geodetic["latitude"],
            "longitude": geodetic["longitude"],
            "altitude_km": geodetic["altitude_km"],
            "orbital_speed_km_s": speed,
        },
        "orbital_period_minutes": period / 60,
    }
