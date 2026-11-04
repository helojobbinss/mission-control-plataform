import random

from datetime import datetime, timezone

from app.schemas.sensor import (
    SensorReading,
    SensorsResponse,
)


def get_satellite_sensors(
    satellite_id: int,
) -> SensorsResponse:
    """
    Gera leituras simuladas de telemetria para um satélite.

    Os dados são simulados e não representam medições reais.
    """

    # Temperaturas
    internal_temperature = round(
        random.uniform(10, 45),
        2,
    )

    external_temperature = round(
        random.uniform(-100, 100),
        2,
    )

    # Sistema elétrico
    voltage = round(
        random.uniform(24, 32),
        2,
    )

    current = round(
        random.uniform(0.5, 5),
        2,
    )

    # Bateria e consumo de energia
    battery_level = round(
        random.uniform(10, 100),
        2,
    )

    energy_consumption = round(
        random.uniform(20, 150),
        2,
    )

    # Radiação
    radiation = round(
        random.uniform(0, 100),
        2,
    )

    # Velocidade angular dos giroscópios
    gyroscope_x = round(
        random.uniform(-5, 5),
        2,
    )

    gyroscope_y = round(
        random.uniform(-5, 5),
        2,
    )

    gyroscope_z = round(
        random.uniform(-5, 5),
        2,
    )

    # Orientação do satélite
    pitch = round(
        random.uniform(-180, 180),
        2,
    )

    roll = round(
        random.uniform(-180, 180),
        2,
    )

    yaw = round(
        random.uniform(0, 360),
        2,
    )

    # Estado da comunicação.
    # A comunicação fica online em aproximadamente 95%
    # das leituras simuladas.
    communication_status = (
        "offline"
        if random.random() < 0.05
        else "online"
    )

    sensors = {
        # Sensores existentes
        "internal_temperature": SensorReading(
            value=internal_temperature,
            unit="°C",
            status=(
                "warning"
                if internal_temperature > 40
                else "normal"
            ),
        ),

        "external_temperature": SensorReading(
            value=external_temperature,
            unit="°C",
            status="normal",
        ),

        "voltage": SensorReading(
            value=voltage,
            unit="V",
            status=(
                "warning"
                if voltage < 25 or voltage > 31
                else "normal"
            ),
        ),

        "current": SensorReading(
            value=current,
            unit="A",
            status=(
                "warning"
                if current > 4.5
                else "normal"
            ),
        ),

        "radiation": SensorReading(
            value=radiation,
            unit="µSv/h",
            status=(
                "warning"
                if radiation > 80
                else "normal"
            ),
        ),

        "gyroscope_x": SensorReading(
            value=gyroscope_x,
            unit="°/s",
            status=(
                "warning"
                if abs(gyroscope_x) > 4.5
                else "normal"
            ),
        ),

        "gyroscope_y": SensorReading(
            value=gyroscope_y,
            unit="°/s",
            status=(
                "warning"
                if abs(gyroscope_y) > 4.5
                else "normal"
            ),
        ),

        "gyroscope_z": SensorReading(
            value=gyroscope_z,
            unit="°/s",
            status=(
                "warning"
                if abs(gyroscope_z) > 4.5
                else "normal"
            ),
        ),

        # Novos parâmetros: bateria e consumo
        "battery_level": SensorReading(
            value=battery_level,
            unit="%",
            status=(
                "warning"
                if battery_level < 20
                else "normal"
            ),
        ),

        "energy_consumption": SensorReading(
            value=energy_consumption,
            unit="W",
            status=(
                "warning"
                if energy_consumption > 120
                else "normal"
            ),
        ),

        # Novos parâmetros: orientação
        "pitch": SensorReading(
            value=pitch,
            unit="°",
            status=(
                "warning"
                if abs(pitch) > 45
                else "normal"
            ),
        ),

        "roll": SensorReading(
            value=roll,
            unit="°",
            status=(
                "warning"
                if abs(roll) > 45
                else "normal"
            ),
        ),

        "yaw": SensorReading(
            value=yaw,
            unit="°",
            status="normal",
        ),

        # Novo parâmetro: comunicação
        "communication_status": SensorReading(
            value=communication_status,
            unit="status",
            status=(
                "warning"
                if communication_status == "offline"
                else "normal"
            ),
        ),
    }

    return SensorsResponse(
        satellite_id=satellite_id,
        simulated=True,
        timestamp=datetime.now(timezone.utc),
        sensors=sensors,
    )