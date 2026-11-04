<?php

namespace App\Services;

use App\Exceptions\SatelliteDataException;
use App\Models\Satellite;
use App\Services\Integrations\PythonApiService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Obtém posição, sensores e telemetria de um satélite cadastrado,
 * escolhendo a fonte correta:
 *
 *  - source = celestrak -> elementos orbitais reais (SGP4 via API Python);
 *  - source = manual    -> órbita circular simulada (API Python).
 *
 * Os sensores são simulados para todos os satélites.
 */
class SatelliteMonitoringService
{
    protected PythonApiService $python;
    protected TelemetryRecorder $recorder;

    public function __construct(
        PythonApiService $python,
        TelemetryRecorder $recorder
    ) {
        $this->python = $python;
        $this->recorder = $recorder;
    }

    /**
     * Posição atual (ou em $calculationTime) do satélite.
     *
     * @throws SatelliteDataException
     */
    public function position(
        Satellite $satellite,
        ?string $calculationTime = null
    ): array {
        try {
            if ($satellite->isManual()) {
                $orbit = $satellite->simulatedOrbit();

                if ($orbit === null) {
                    throw new SatelliteDataException(
                        'O satélite não possui parâmetros orbitais para simulação.',
                        422
                    );
                }

                $response = $this->python->simulateSatellitePosition(
                    $orbit,
                    $calculationTime
                );
            } else {
                if (!$satellite->norad_id) {
                    throw new SatelliteDataException(
                        'O satélite não possui número NORAD.',
                        422
                    );
                }

                $response = $this->python->getSatellitePosition(
                    (int) $satellite->norad_id,
                    $calculationTime
                );
            }
        } catch (ConnectionException $exception) {
            report($exception);

            throw new SatelliteDataException(
                'Não foi possível conectar à API Python.',
                503
            );
        }

        $data = $this->decode($response, 'Não foi possível calcular a posição do satélite.');

        if (!isset($data['orbital_position']) || !is_array($data['orbital_position'])) {
            throw new SatelliteDataException(
                'A API Python retornou uma posição inválida.',
                502
            );
        }

        $data['simulated'] = $data['simulated'] ?? $satellite->isManual();
        $data['satellite'] = array_merge($data['satellite'] ?? [], [
            'id' => $satellite->id,
            'norad_id' => $satellite->norad_id,
            'name' => $satellite->name,
            'source' => $satellite->source,
        ]);

        return $data;
    }

    /**
     * Leitura simulada dos sensores (válida para qualquer satélite).
     *
     * @throws SatelliteDataException
     */
    public function sensors(Satellite $satellite): array
    {
        try {
            $response = $this->python->getSatelliteSensors($satellite->id);
        } catch (ConnectionException $exception) {
            report($exception);

            throw new SatelliteDataException(
                'Não foi possível conectar à API Python.',
                503
            );
        }

        return $this->decode($response, 'Não foi possível obter os sensores do satélite.');
    }

    /**
     * Telemetria completa: sensores + alertas + posição orbital.
     * A leitura e os alertas são gravados no banco.
     *
     * @throws SatelliteDataException
     */
    public function telemetry(Satellite $satellite): array
    {
        try {
            $apiResponse = $this->python->getSatelliteTelemetry($satellite->id);
        } catch (ConnectionException $exception) {
            report($exception);

            throw new SatelliteDataException(
                'Não foi possível conectar à API Python.',
                503
            );
        }

        if (!$apiResponse->successful()) {
            throw new SatelliteDataException(
                'Não foi possível obter a telemetria do satélite.',
                502
            );
        }

        $telemetry = $apiResponse->json();

        if (
            !is_array($telemetry)
            || !isset($telemetry['sensors'], $telemetry['alerts'], $telemetry['timestamp'])
        ) {
            throw new SatelliteDataException(
                'Resposta inválida da API de telemetria.',
                502
            );
        }

        // A posição é complementar: se falhar, a telemetria é mantida.
        $orbitalPosition = null;

        try {
            $orbitalPosition = $this->position(
                $satellite,
                $telemetry['timestamp']
            )['orbital_position'];
        } catch (Throwable $exception) {
            report($exception);
        }

        DB::transaction(function () use ($satellite, $telemetry, $orbitalPosition) {
            $this->recorder->record($satellite, $telemetry, $orbitalPosition);
        });

        $telemetry['orbital_position'] = $orbitalPosition;

        return $telemetry;
    }

    /**
     * Posição de todos os satélites ativos (para o mapa orbital).
     * A falha de um satélite não impede os demais.
     */
    public function positionsOfActiveSatellites(): array
    {
        $positions = [];

        Satellite::where('status', 'active')
            ->orderBy('id')
            ->get()
            ->each(function (Satellite $satellite) use (&$positions) {
                $item = [
                    'id' => $satellite->id,
                    'norad_id' => $satellite->norad_id,
                    'name' => $satellite->name,
                    'source' => $satellite->source,
                ];

                try {
                    $data = $this->position($satellite);

                    $item['simulated'] = $data['simulated'];
                    $item['calculation_time'] = $data['calculation_time'] ?? null;
                    $item['orbital_position'] = $data['orbital_position'];
                } catch (SatelliteDataException $exception) {
                    $item['orbital_position'] = null;
                    $item['error'] = $exception->getMessage();
                }

                $positions[] = $item;
            });

        return $positions;
    }

    /**
     * @throws SatelliteDataException
     */
    private function decode(Response $response, string $defaultMessage): array
    {
        if (!$response->successful()) {
            $detail = $response->json('detail');
            $status = in_array($response->status(), [404, 422], true)
                ? $response->status()
                : 502;

            throw new SatelliteDataException(
                is_string($detail) ? $detail : $defaultMessage,
                $status
            );
        }

        $data = $response->json();

        if (!is_array($data)) {
            throw new SatelliteDataException(
                'A API Python retornou uma resposta inválida.',
                502
            );
        }

        return $data;
    }
}
