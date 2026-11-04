<?php

namespace App\Http\Controllers;

use App\Services\Integrations\PythonApiService;
use Illuminate\Http\Client\ConnectionException;

class SatelliteSensorController extends Controller
{
    /**
     * Retorna os sensores simulados de um satélite.
     */
    public function index(
        int $noradId,
        PythonApiService $pythonApi
    ) {
        try {
            $response = $pythonApi->getSatelliteSensors(
                $noradId
            );
        } catch (ConnectionException $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Não foi possível conectar à API Python.',
            ], 503);
        }

        $data = $response->json();

        if (!is_array($data)) {
            return response()->json([
                'success' => false,
                'message' => 'A API Python retornou uma resposta inválida.',
            ], 502);
        }

        return response()->json(
            $data,
            $response->status()
        );
    }
}