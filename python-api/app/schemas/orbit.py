from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class OrbitPositionRequest(BaseModel):
    tle_line1: str = Field(
        min_length=69,
        max_length=69,
        description="Primeira linha dos elementos orbitais TLE.",
    )

    tle_line2: str = Field(
        min_length=69,
        max_length=69,
        description="Segunda linha dos elementos orbitais TLE.",
    )

    calculation_time: datetime = Field(
        description="Data e hora do cálculo, incluindo o fuso horário.",
    )

    @field_validator("calculation_time")
    @classmethod
    def validate_calculation_time(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError(
                "A data e hora devem incluir o fuso horário."
            )

        return value

class SimulatedOrbitRequest(BaseModel):
    """
    Parâmetros de uma órbita circular usada para simular a posição
    de satélites cadastrados manualmente (sem TLE/OMM).
    """

    altitude_km: float = Field(
        ge=160,
        le=40000,
        description="Altitude da órbita circular, em km.",
    )

    inclination_deg: float = Field(
        ge=0,
        le=180,
        description="Inclinação orbital, em graus.",
    )

    raan_deg: float = Field(
        default=0,
        ge=0,
        lt=360,
        description="Ascensão reta do nó ascendente, em graus.",
    )

    initial_anomaly_deg: float = Field(
        default=0,
        ge=0,
        lt=360,
        description="Argumento de latitude na época, em graus.",
    )

    epoch: datetime = Field(
        description="Instante de referência da órbita, com fuso horário.",
    )

    calculation_time: datetime | None = Field(
        default=None,
        description="Instante do cálculo. Se omitido, usa a hora atual (UTC).",
    )

    @field_validator("epoch", "calculation_time")
    @classmethod
    def validate_timezone(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return value

        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError(
                "A data e hora devem incluir o fuso horário."
            )

        return value
