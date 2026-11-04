from datetime import datetime, timezone
from math import atan2, cos, degrees, hypot, sin, sqrt

from sgp4.api import jday
from sgp4.propagation import gstime


# Constantes do elipsoide WGS-84.
EARTH_EQUATORIAL_RADIUS_KM = 6378.137
EARTH_FLATTENING = 1 / 298.257223563
EARTH_ECCENTRICITY_SQ = EARTH_FLATTENING * (2 - EARTH_FLATTENING)


def greenwich_sidereal_angle(moment: datetime) -> float:
    """
    Retorna o tempo sideral de Greenwich (radianos) para o instante.
    """

    moment = moment.astimezone(timezone.utc)

    julian_date, fraction = jday(
        moment.year,
        moment.month,
        moment.day,
        moment.hour,
        moment.minute,
        moment.second + moment.microsecond / 1_000_000,
    )

    return gstime(julian_date + fraction)


def eci_to_geodetic(
    position_km: tuple[float, float, float],
    moment: datetime,
) -> dict:
    """
    Converte uma posição inercial (TEME/ECI, km) em latitude,
    longitude (graus) e altitude (km) sobre o elipsoide WGS-84.
    """

    x_eci, y_eci, z_eci = position_km
    theta = greenwich_sidereal_angle(moment)

    # Rotação para o referencial fixo da Terra (ECEF).
    x = x_eci * cos(theta) + y_eci * sin(theta)
    y = -x_eci * sin(theta) + y_eci * cos(theta)
    z = z_eci

    longitude = atan2(y, x)
    radius_xy = hypot(x, y)

    # Iteração para a latitude geodésica.
    latitude = atan2(z, radius_xy * (1 - EARTH_ECCENTRICITY_SQ))

    for _ in range(10):
        sin_lat = sin(latitude)
        prime_vertical = EARTH_EQUATORIAL_RADIUS_KM / sqrt(
            1 - EARTH_ECCENTRICITY_SQ * sin_lat**2
        )
        new_latitude = atan2(
            z + EARTH_ECCENTRICITY_SQ * prime_vertical * sin_lat,
            radius_xy,
        )

        if abs(new_latitude - latitude) < 1e-12:
            latitude = new_latitude
            break

        latitude = new_latitude

    sin_lat = sin(latitude)
    prime_vertical = EARTH_EQUATORIAL_RADIUS_KM / sqrt(
        1 - EARTH_ECCENTRICITY_SQ * sin_lat**2
    )

    # Evita divisão por zero muito próximo dos polos.
    if abs(cos(latitude)) > 1e-6:
        altitude = radius_xy / cos(latitude) - prime_vertical
    else:
        altitude = abs(z) / abs(sin_lat) - prime_vertical * (
            1 - EARTH_ECCENTRICITY_SQ
        )

    return {
        "latitude": degrees(latitude),
        "longitude": degrees(longitude),
        "altitude_km": altitude,
    }
