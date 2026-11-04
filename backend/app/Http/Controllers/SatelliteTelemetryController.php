<?php

namespace App\Http\Controllers;

use App\Models\Satellite;
use App\Services\Integrations\CelesTrakService;
use App\Services\Integrations\PythonApiService;
use App\Services\TelemetryRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;
use Illuminate\Http\Client\ConnectionException;

class SatelliteTelemetryController extends Controller
{
    protected PythonApiService $pythonApi;
    protected CelesTrakService $celesTrak;

    public function __construct(
        PythonApiService $pythonApi,
        CelesTrakService $celesTrak
    ) {
        $this->pythonApi = $pythonApi;
        $this->celesTrak = $celesTrak;
    }

    public function index(int $noradId): JsonResponse
    {
        try {
            $apiResponse = $this->pythonApi->getSatelliteTelemetry($noradId);
        } catch (ConnectionException $exception) {
            report($exception);
            return response()->json([
                'message' => 'Não foi possível conectar à API Python.',
        ], 503);
        }
        if (!$apiResponse->successful()) {
            return response()->json([
                'message' => 'Não foi possível obter a telemetria do satélite.',
            ], 502);
        }
        $response = $apiResponse->json();
        if (!is_array($response) || !isset($response['sensors']) || !isset($response['alerts']) || !isset($response['timestamp'])) {
            return response()->json([
                'message' => 'Resposta inválida da API de telemetria.',
            ], 502);
        }
        $satellite = Satellite::where('norad_id', $noradId)->first();

        $satelliteName = $satellite ? $satellite->name : null;

        $internationalDesignator = $satellite
            ? $satellite->international_designator
            : null;

        if (!$satelliteName || !$internationalDesignator) {
            try {
                $celestrakResponse = $this->celesTrak
                    ->getSatelliteByNoradId((string) $noradId);

                if (
                    is_array($celestrakResponse) &&
                    isset($celestrakResponse[0])
                ) {
                    $celestrakSatellite = $celestrakResponse[0];

                    $satelliteName = $satelliteName
                        ?: ($celestrakSatellite['OBJECT_NAME'] ?? null);

                    $internationalDesignator = $internationalDesignator
                        ?: ($celestrakSatellite['OBJECT_ID'] ?? null);
                }
            } catch (Throwable $exception) {
                report($exception);
            }
        }

        DB::transaction(function () use (
            $noradId,
            $satelliteName,
            $internationalDesignator,
            $response
        ) {
            $satellite = Satellite::firstOrCreate(
                ['norad_id' => $noradId],
                [
                    'name' => $satelliteName,
                    'international_designator' => $internationalDesignator,
                ]
            );

            $updates = [];

            if (!$satellite->name && $satelliteName) {
                $updates['name'] = $satelliteName;
            }

            if (
                !$satellite->international_designator &&
                $internationalDesignator
            ) {
                $updates['international_designator'] =
                    $internationalDesignator;
            }

            if (!empty($updates)) {
                $satellite->update($updates);
            }

            app(TelemetryRecorder::class)->record($satellite, $response);
        });

        return response()->json($response);
    }
}