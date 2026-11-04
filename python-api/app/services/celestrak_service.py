import time
from threading import Lock

import httpx


CELESTRAK_URL = (
    "https://celestrak.org/NORAD/elements/gp.php"
)

CACHE_TTL_SECONDS = 7200

_cache: dict[int, tuple[float, dict]] = {}
_cache_lock = Lock()


class SatelliteNotFoundError(Exception):
    """O satélite não foi encontrado na fonte de dados."""


class OrbitalDataSourceError(Exception):
    """Não foi possível consultar os dados orbitais."""


def fetch_omm_record(norad_id: int) -> dict:
    """
    Consulta os elementos orbitais OMM de um satélite
    no CelesTrak.

    Os resultados são armazenados em cache por duas horas
    para evitar consultas desnecessárias à fonte externa.
    """

    now = time.monotonic()

    with _cache_lock:
        cached = _cache.get(norad_id)

        if cached is not None:
            cached_at, record = cached

            if now - cached_at < CACHE_TTL_SECONDS:
                return record.copy()

            del _cache[norad_id]

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(
                CELESTRAK_URL,
                params={
                    "CATNR": norad_id,
                    "FORMAT": "JSON",
                },
                headers={
                    "User-Agent": "MissionControlPlatform/1.0",
                },
            )

            response.raise_for_status()

    except httpx.HTTPStatusError as exc:
        raise OrbitalDataSourceError(
            "O CelesTrak não conseguiu atender à consulta."
        ) from exc

    except httpx.RequestError as exc:
        raise OrbitalDataSourceError(
            "Não foi possível conectar ao CelesTrak."
        ) from exc

    try:
        data = response.json()

    except ValueError as exc:
        raise OrbitalDataSourceError(
            "A fonte orbital retornou uma resposta inválida."
        ) from exc

    if not isinstance(data, list):
        raise OrbitalDataSourceError(
            "O formato da resposta orbital é inválido."
        )

    if not data:
        raise SatelliteNotFoundError(
            f"Nenhum dado orbital encontrado para o NORAD {norad_id}."
        )

    record = data[0]

    if not isinstance(record, dict):
        raise OrbitalDataSourceError(
            "O registro orbital retornado é inválido."
        )

    with _cache_lock:
        _cache[norad_id] = (time.monotonic(), record.copy())

    return record.copy()