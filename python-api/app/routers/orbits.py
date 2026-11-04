from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Path

from app.schemas.orbit import OrbitPositionRequest, SimulatedOrbitRequest
from app.services.celestrak_service import (
    fetch_omm_record,
    OrbitalDataSourceError,
    SatelliteNotFoundError,
)
from app.services.orbit_simulation_service import (
    simulate_circular_orbit_position,
)
from app.services.orbit_service import (
    calculate_satellite_position,
    calculate_satellite_position_from_omm,
)


router = APIRouter()


@router.post("/position")
def get_satellite_position(
    request: OrbitPositionRequest,
):
    """
    Calcula a posição usando elementos TLE enviados
    na requisição.
    """

    try:
        return calculate_satellite_position(
            tle_line1=request.tle_line1,
            tle_line2=request.tle_line2,
            calculation_time=request.calculation_time,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


@router.post("/simulate")
def simulate_satellite_position(
    request: SimulatedOrbitRequest,
):
    """
    Simula a posição de um satélite sem dados orbitais reais
    (cadastrado manualmente), a partir de uma órbita circular.
    """

    calculation_time = (
        request.calculation_time or datetime.now(timezone.utc)
    )

    try:
        position = simulate_circular_orbit_position(
            altitude_km=request.altitude_km,
            inclination_deg=request.inclination_deg,
            raan_deg=request.raan_deg,
            initial_anomaly_deg=request.initial_anomaly_deg,
            epoch=request.epoch,
            calculation_time=calculation_time,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    return {
        "source": "simulation",
        **position,
    }


@router.get("/{norad_id}/position")
def get_satellite_position_by_norad(
    norad_id: int = Path(
        ge=1,
        le=999999999,
        description="Número de catálogo NORAD do satélite.",
    ),
    calculation_time: datetime | None = Query(
        default=None,
        description=(
            "Data e hora do cálculo com fuso horário. "
            "Se omitida, será utilizada a hora atual em UTC."
        ),
    ),
):
    """
    Consulta os elementos orbitais no CelesTrak
    e calcula a posição do satélite.
    """

    if calculation_time is None:
        calculation_time = datetime.now(timezone.utc)

    if (
        calculation_time.tzinfo is None
        or calculation_time.utcoffset() is None
    ):
        raise HTTPException(
            status_code=422,
            detail="A data e hora devem incluir o fuso horário.",
        )

    try:
        omm_record = fetch_omm_record(norad_id)

        position = calculate_satellite_position_from_omm(
            omm_record=omm_record,
            calculation_time=calculation_time,
        )

    except SatelliteNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except OrbitalDataSourceError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    return {
        "satellite": {
            "norad_id": norad_id,
            "name": omm_record.get("OBJECT_NAME"),
            "international_designator": omm_record.get("OBJECT_ID"),
            "orbital_epoch": omm_record.get("EPOCH"),
        },
        "source": "CelesTrak",
        **position,
    }