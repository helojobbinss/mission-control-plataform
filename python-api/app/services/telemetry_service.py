from app.schemas.telemetry import TelemetrySnapshotResponse
from app.services.sensor_service import get_satellite_sensors
from app.services.alert_service import evaluate_sensor_alerts


def get_satellite_telemetry(
    satellite_id: int,
) -> TelemetrySnapshotResponse:
    """
    Gera uma leitura de telemetria e avalia os alertas
    com base nessa mesma leitura.
    """

    # Gera os valores simulados uma única vez.
    telemetry = get_satellite_sensors(satellite_id)

    # Analisa exatamente os valores que foram gerados.
    alert_response = evaluate_sensor_alerts(telemetry)

    return TelemetrySnapshotResponse(
        satellite_id=telemetry.satellite_id,
        simulated=telemetry.simulated,
        timestamp=telemetry.timestamp,
        sensors=telemetry.sensors,
        total_alerts=alert_response.total,
        alerts=alert_response.alerts,
    )