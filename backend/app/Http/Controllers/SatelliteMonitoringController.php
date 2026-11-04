<?php

namespace App\Http\Controllers;

use App\Exceptions\SatelliteDataException;
use App\Models\Satellite;
use App\Services\SatelliteMonitoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Monitoramento de satélites cadastrados, identificados pelo id interno.
 * Funciona para satélites reais (CelesTrak) e manuais (órbita simulada).
 */
class SatelliteMonitoringController extends Controller
{
    protected SatelliteMonitoringService $monitoring;

    public function __construct(SatelliteMonitoringService $monitoring)
    {
        $this->monitoring = $monitoring;
    }

    public function position(Request $request, Satellite $satellite): JsonResponse
    {
        $validated = $request->validate([
            'calculation_time' => ['nullable', 'date'],
        ]);

        return $this->respond(fn () => $this->monitoring->position(
            $satellite,
            $validated['calculation_time'] ?? null
        ));
    }

    public function sensors(Satellite $satellite): JsonResponse
    {
        return $this->respond(fn () => $this->monitoring->sensors($satellite));
    }

    public function telemetry(Satellite $satellite): JsonResponse
    {
        return $this->respond(fn () => $this->monitoring->telemetry($satellite));
    }

    public function positions(): JsonResponse
    {
        return response()->json([
            'data' => $this->monitoring->positionsOfActiveSatellites(),
        ]);
    }

    private function respond(callable $callback): JsonResponse
    {
        try {
            return response()->json($callback());
        } catch (SatelliteDataException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], $exception->httpStatus());
        }
    }
}
