import math

from app.schemas.alert import AlertItem, AlertsResponse
from app.schemas.sensor import SensorsResponse


# Limites iniciais para a simulação.
BATTERY_LOW_THRESHOLD = 20.0
INTERNAL_TEMPERATURE_THRESHOLD = 40.0
VOLTAGE_MIN_THRESHOLD = 25.0
VOLTAGE_MAX_THRESHOLD = 31.0
ENERGY_CONSUMPTION_THRESHOLD = 120.0
RADIATION_THRESHOLD = 80.0
GYROSCOPE_THRESHOLD = 4.5
ORIENTATION_THRESHOLD = 45.0


REQUIRED_NUMERIC_SENSORS = {
    "internal_temperature",
    "external_temperature",
    "voltage",
    "current",
    "radiation",
    "gyroscope_x",
    "gyroscope_y",
    "gyroscope_z",
    "battery_level",
    "energy_consumption",
    "pitch",
    "roll",
    "yaw",
}


def evaluate_sensor_alerts(
    telemetry: SensorsResponse,
) -> AlertsResponse:
    """
    Avalia uma leitura de telemetria e gera alertas
    para condições operacionais que exigem atenção.
    """

    sensors = telemetry.sensors
    alerts: list[AlertItem] = []

    def add_alert(
        code: str,
        parameter: str,
        severity: str,
        measured_value: float | str,
        unit: str,
        message: str,
        threshold: float | str | None = None,
    ) -> None:
        alerts.append(
            AlertItem(
                code=code,
                satellite_id=telemetry.satellite_id,
                parameter=parameter,
                severity=severity,
                measured_value=measured_value,
                unit=unit,
                threshold=threshold,
                message=message,
                timestamp=telemetry.timestamp,
            )
        )

    # 1. Verifica se os sensores obrigatórios existem
    # e se retornaram valores numéricos válidos.
    for parameter in REQUIRED_NUMERIC_SENSORS:
        reading = sensors.get(parameter)

        if reading is None:
            add_alert(
                code="SENSOR_FAILURE",
                parameter=parameter,
                severity="high",
                measured_value="unavailable",
                unit="unknown",
                message=(
                    f"O sensor '{parameter}' não retornou "
                    "uma leitura."
                ),
            )
            continue

        value = reading.value

        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            add_alert(
                code="SENSOR_FAILURE",
                parameter=parameter,
                severity="high",
                measured_value=str(value),
                unit=reading.unit,
                message=(
                    f"O sensor '{parameter}' retornou "
                    "um valor inválido."
                ),
            )

    # 2. Avalia os sensores numéricos.
    # Valores ausentes ou inválidos não são usados
    # nas comparações de limites.
    def get_numeric_value(parameter: str) -> float | None:
        reading = sensors.get(parameter)

        if reading is None:
            return None

        value = reading.value

        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            return None

        return float(value)

    # Bateria baixa
    battery = get_numeric_value("battery_level")

    if (
        battery is not None
        and battery < BATTERY_LOW_THRESHOLD
    ):
        add_alert(
            code="LOW_BATTERY",
            parameter="battery_level",
            severity="high",
            measured_value=battery,
            unit="%",
            threshold=BATTERY_LOW_THRESHOLD,
            message=(
                "O nível da bateria está abaixo de "
                f"{BATTERY_LOW_THRESHOLD}%."
            ),
        )

    # Temperatura interna elevada
    temperature = get_numeric_value(
        "internal_temperature"
    )

    if (
        temperature is not None
        and temperature > INTERNAL_TEMPERATURE_THRESHOLD
    ):
        add_alert(
            code="HIGH_INTERNAL_TEMPERATURE",
            parameter="internal_temperature",
            severity="high",
            measured_value=temperature,
            unit="°C",
            threshold=INTERNAL_TEMPERATURE_THRESHOLD,
            message=(
                "A temperatura interna ultrapassou "
                f"{INTERNAL_TEMPERATURE_THRESHOLD} °C."
            ),
        )

    # Tensão fora do intervalo permitido
    voltage = get_numeric_value("voltage")

    if voltage is not None:
        if voltage < VOLTAGE_MIN_THRESHOLD:
            add_alert(
                code="LOW_VOLTAGE",
                parameter="voltage",
                severity="high",
                measured_value=voltage,
                unit="V",
                threshold=VOLTAGE_MIN_THRESHOLD,
                message=(
                    "A tensão elétrica está abaixo "
                    f"de {VOLTAGE_MIN_THRESHOLD} V."
                ),
            )

        elif voltage > VOLTAGE_MAX_THRESHOLD:
            add_alert(
                code="HIGH_VOLTAGE",
                parameter="voltage",
                severity="high",
                measured_value=voltage,
                unit="V",
                threshold=VOLTAGE_MAX_THRESHOLD,
                message=(
                    "A tensão elétrica ultrapassou "
                    f"{VOLTAGE_MAX_THRESHOLD} V."
                ),
            )

    # Consumo elevado de energia
    consumption = get_numeric_value(
        "energy_consumption"
    )

    if (
        consumption is not None
        and consumption > ENERGY_CONSUMPTION_THRESHOLD
    ):
        add_alert(
            code="HIGH_ENERGY_CONSUMPTION",
            parameter="energy_consumption",
            severity="medium",
            measured_value=consumption,
            unit="W",
            threshold=ENERGY_CONSUMPTION_THRESHOLD,
            message=(
                "O consumo de energia ultrapassou "
                f"{ENERGY_CONSUMPTION_THRESHOLD} W."
            ),
        )

    # Radiação elevada
    radiation = get_numeric_value("radiation")

    if (
        radiation is not None
        and radiation > RADIATION_THRESHOLD
    ):
        add_alert(
            code="HIGH_RADIATION",
            parameter="radiation",
            severity="high",
            measured_value=radiation,
            unit="µSv/h",
            threshold=RADIATION_THRESHOLD,
            message=(
                "O nível de radiação ultrapassou "
                f"{RADIATION_THRESHOLD} µSv/h."
            ),
        )

    # Velocidade angular elevada
    for axis in ("x", "y", "z"):
        parameter = f"gyroscope_{axis}"
        value = get_numeric_value(parameter)

        if (
            value is not None
            and abs(value) > GYROSCOPE_THRESHOLD
        ):
            add_alert(
                code="HIGH_ANGULAR_VELOCITY",
                parameter=parameter,
                severity="medium",
                measured_value=value,
                unit="°/s",
                threshold=GYROSCOPE_THRESHOLD,
                message=(
                    f"A velocidade angular do eixo "
                    f"{axis.upper()} ultrapassou "
                    f"{GYROSCOPE_THRESHOLD} °/s em módulo."
                ),
            )

    # Orientação: limites provisórios para a simulação.
    for parameter in ("pitch", "roll"):
        value = get_numeric_value(parameter)

        if (
            value is not None
            and abs(value) > ORIENTATION_THRESHOLD
        ):
            add_alert(
                code="ORIENTATION_DEVIATION",
                parameter=parameter,
                severity="medium",
                measured_value=value,
                unit="°",
                threshold=ORIENTATION_THRESHOLD,
                message=(
                    f"O ângulo de {parameter} ultrapassou "
                    f"{ORIENTATION_THRESHOLD}° em módulo."
                ),
            )

    # Perda de comunicação
    communication = sensors.get("communication_status")

    if communication is None:
        add_alert(
            code="SENSOR_FAILURE",
            parameter="communication_status",
            severity="high",
            measured_value="unavailable",
            unit="status",
            message=(
                "O estado da comunicação não foi informado."
            ),
        )

    elif communication.value == "offline":
        add_alert(
            code="COMMUNICATION_LOST",
            parameter="communication_status",
            severity="critical",
            measured_value="offline",
            unit="status",
            message=(
                "A comunicação com o satélite está "
                "indicada como indisponível."
            ),
        )

    elif communication.value != "online":
        add_alert(
            code="SENSOR_FAILURE",
            parameter="communication_status",
            severity="high",
            measured_value=str(communication.value),
            unit="status",
            message=(
                "O estado da comunicação retornou "
                "um valor inválido."
            ),
        )

    return AlertsResponse(
        satellite_id=telemetry.satellite_id,
        simulated=telemetry.simulated,
        timestamp=telemetry.timestamp,
        total=len(alerts),
        alerts=alerts,
    )