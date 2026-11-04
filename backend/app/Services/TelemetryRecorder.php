<?php

namespace App\Services;

use App\Models\Satellite;
use App\Models\SatelliteAlert;
use App\Models\TelemetryReading;

class TelemetryRecorder
{
    /**
     * Grava a leitura de telemetria e sincroniza os alertas do satélite:
     * alertas ainda ativos são atualizados e os que deixaram de ocorrer
     * são marcados como resolvidos.
     *
     * Deve ser chamado dentro de uma transação.
     */
    public function record(
        Satellite $satellite,
        array $response,
        ?array $orbitalPosition = null
    ): TelemetryReading {
        $reading = TelemetryReading::create([
            'satellite_id' => $satellite->id,
            'readings' => $response['sensors'],
            'orbital_position' => $orbitalPosition,
            'simulated' => $response['simulated'] ?? false,
            'recorded_at' => $response['timestamp'],
        ]);

        $activeAlertCodes = [];

        foreach ($response['alerts'] as $alertData) {
            $code = $alertData['code'] ?? null;

            if (!$code) {
                continue;
            }

            $activeAlertCodes[] = $code;

            SatelliteAlert::updateOrCreate(
                [
                    'satellite_id' => $satellite->id,
                    'code' => $code,
                    'resolved' => false,
                ],
                [
                    'parameter' => $alertData['parameter'] ?? null,
                    'severity' => $alertData['severity'] ?? null,
                    'measured_value' => $alertData['measured_value'] ?? null,
                    'unit' => $alertData['unit'] ?? null,
                    'threshold' => $alertData['threshold'] ?? null,
                    'message' => $alertData['message'] ?? null,
                    'occurred_at' => $response['timestamp'],
                ]
            );
        }

        $openAlerts = SatelliteAlert::where('satellite_id', $satellite->id)
            ->where('resolved', false);

        if (!empty($activeAlertCodes)) {
            $openAlerts->whereNotIn('code', $activeAlertCodes);
        }

        $openAlerts->update(['resolved' => true]);

        return $reading;
    }
}
