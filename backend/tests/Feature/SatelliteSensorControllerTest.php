<?php

namespace App\Http\Controllers;

use App\Services\Integrations\PythonApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Client\ConnectionException;

class SatelliteSensorController extends Controller
{
    public function index(
        int $noradId,
        PythonApiService $pythonApi
    ): JsonResponse {
        try {
            $response = $pythonApi->getSatelliteSensors($noradId);

            if (!is_array($response) || json_encode($response) === false) {
                return response()->json([
                    'message' => 'Resposta inválida da API de sensores.',
                ], 502);
            }

            return response()->json($response['data'] ?? $response);
        } catch (ConnectionException $exception) {
            report($exception);

            return response()->json([
                'message' => 'Não foi possível conectar à API de sensores.',
            ], 503);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Erro ao consultar os sensores do satélite.',
            ], 502);
        }
    }
}