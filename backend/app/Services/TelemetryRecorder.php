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

        // Um alerta ativo é identificado por código + parâmetro: o mesmo código
        // (ex.: HIGH_ANGULAR_VELOCITY) pode ocorrer em sensores distintos.
        $activeAlertKeys = [];

        foreach ($response['alerts'] as $alertData) {
            $code = $alertData['code'] ?? null;

            if (!$code) {
                continue;
            }

            $parameter = $alertData['parameter'] ?? null;
            $activeAlertKeys[$code."\0".$parameter] = true;

            SatelliteAlert::updateOrCreate(
                [
                    'satellite_id' => $satellite->id,
                    'code' => $code,
                    'parameter' => $parameter,
                    'resolved' => false,
                ],
                [
                    'severity' => $alertData['severity'] ?? null,
                    'measured_value' => $alertData['measured_value'] ?? null,
                    'unit' => $alertData['unit'] ?? null,
                    'threshold' => $alertData['threshold'] ?? null,
                    'message' => $alertData['message'] ?? null,
                    'occurred_at' => $response['timestamp'],
                ]
            );
        }

        SatelliteAlert::where('satellite_id', $satellite->id)
            ->where('resolved', false)
            ->get()
            ->reject(fn (SatelliteAlert $alert) => isset($activeAlertKeys[$alert->code."\0".$alert->parameter]))
            ->each(fn (SatelliteAlert $alert) => $alert->update(['resolved' => true]));

        return $reading;
    }
}
