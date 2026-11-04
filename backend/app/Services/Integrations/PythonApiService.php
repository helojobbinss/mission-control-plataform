<?php

namespace App\Services\Integrations;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class PythonApiService
{
    /**
     * Consulta a API Python para calcular a posição
     * de um satélite pelo identificador NORAD.
     *
     * @throws ConnectionException
     */
    public function getSatellitePosition(
        int $noradId,
        ?string $calculationTime = null
    ): Response {
        $baseUrl = rtrim(
            config('services.python_api.url'),
            '/'
        );

        $parameters = [];

        if ($calculationTime !== null) {
            $parameters['calculation_time'] = $calculationTime;
        }

        return Http::acceptJson()
            ->timeout(20)
            ->get(
                "{$baseUrl}/api/v1/orbits/{$noradId}/position",
                $parameters
            );
    }

    /**
     * Consulta os sensores simulados de um satélite
     * na API Python.
     *
     * @throws ConnectionException
     */
    public function getSatelliteSensors(
        int $noradId
    ): Response {
        $baseUrl = rtrim(
            config('services.python_api.url'),
            '/'
        );

        return Http::acceptJson()
            ->timeout(20)
            ->get(
                "{$baseUrl}/api/v1/satellites/{$noradId}/sensors"
            );
    }

    /**
    * Consulta a telemetria e os alertas de um satélite
    * utilizando a mesma leitura gerada pela API Python.
    *
    * @throws ConnectionException
    */
    public function getSatelliteTelemetry(
        int $noradId
    ): Response {
        $baseUrl = rtrim(config('services.python_api.url'),'/');

        return Http::acceptJson()
            ->timeout(20)
            ->get(
                "{$baseUrl}/api/v1/satellites/{$noradId}/telemetry"
            );
    }

    /**
     * Simula a posição de um satélite cadastrado manualmente
     * (sem TLE/OMM), a partir de uma órbita circular.
     *
     * @param  array  $orbit  altitude_km, inclination_deg, raan_deg,
     *                        initial_anomaly_deg e epoch (ISO 8601).
     *
     * @throws ConnectionException
     */
    public function simulateSatellitePosition(
        array $orbit,
        ?string $calculationTime = null
    ): Response {
        $baseUrl = rtrim(
            config('services.python_api.url'),
            '/'
        );

        $payload = $orbit;

        if ($calculationTime !== null) {
            $payload['calculation_time'] = $calculationTime;
        }

        return Http::acceptJson()
            ->timeout(20)
            ->post(
                "{$baseUrl}/api/v1/orbits/simulate",
                $payload
            );
    }
}
