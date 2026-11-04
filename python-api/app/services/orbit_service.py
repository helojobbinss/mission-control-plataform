from datetime import datetime, timezone
from math import isfinite

from sgp4 import omm
from sgp4.api import Satrec, SGP4_ERRORS, jday

from app.services.geodetic_service import eci_to_geodetic


def _calculate_position(
    satellite: Satrec,
    calculation_time: datetime,
) -> dict:
    """
    Calcula a posição e a velocidade no referencial TEME.
    """

    if (
        calculation_time.tzinfo is None
        or calculation_time.utcoffset() is None
    ):
        raise ValueError(
            "A data e hora devem incluir o fuso horário."
        )

    calculation_time = calculation_time.astimezone(timezone.utc)

    julian_date, fractional_day = jday(
        calculation_time.year,
        calculation_time.month,
        calculation_time.day,
        calculation_time.hour,
        calculation_time.minute,
        (
            calculation_time.second
            + calculation_time.microsecond / 1_000_000
        ),
    )

    error_code, position, velocity = satellite.sgp4(
        julian_date,
        fractional_day,
    )

    if error_code != 0:
        error_message = SGP4_ERRORS.get(
            error_code,
            "Erro desconhecido no cálculo orbital.",
        )

        raise ValueError(
            f"Não foi possível calcular a posição: {error_message}"
        )

    if not all(
        isfinite(value)
        for value in (*position, *velocity)
    ):
        raise ValueError(
            "O cálculo orbital retornou valores inválidos."
        )

    geodetic = eci_to_geodetic(position, calculation_time)
    speed = sum(value**2 for value in velocity) ** 0.5

    return {
        "calculation_time": calculation_time.isoformat(),
        "coordinate_frame": "TEME",
        "simulated": False,
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
    }


def calculate_satellite_position(
    tle_line1: str,
    tle_line2: str,
    calculation_time: datetime,
) -> dict:
    """
    Calcula a posição utilizando duas linhas TLE.
    """

    if (
        calculation_time.tzinfo is None
        or calculation_time.utcoffset() is None
    ):
        raise ValueError(
            "A data e hora devem incluir o fuso horário."
        )

    try:
        satellite = Satrec.twoline2rv(
            tle_line1,
            tle_line2,
        )
    except (ValueError, TypeError) as exc:
        raise ValueError(
            "Os elementos orbitais TLE são inválidos."
        ) from exc

    return _calculate_position(
        satellite,
        calculation_time,
    )


def calculate_satellite_position_from_omm(
    omm_record: dict,
    calculation_time: datetime,
) -> dict:
    """
    Calcula a posição utilizando um registro orbital OMM.
    """

    if (
        calculation_time.tzinfo is None
        or calculation_time.utcoffset() is None
    ):
        raise ValueError(
            "A data e hora devem incluir o fuso horário."
        )

    try:
        satellite = Satrec()

        omm.initialize(
            satellite,
            omm_record,
        )

    except (ValueError, TypeError, KeyError) as exc:
        raise ValueError(
            "Os elementos orbitais OMM são inválidos."
        ) from exc

    return _calculate_position(
        satellite,
        calculation_time,
    )