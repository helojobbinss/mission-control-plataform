<?php

namespace App\Http\Controllers;

use App\Services\Integrations\PythonApiService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;

class OrbitController extends Controller
{
    /**
     * Retorna a posição calculada de um satélite.
     */
    public function position(
        Request $request,
        int $noradId,
        PythonApiService $pythonApi
    ) {
        $validated = $request->validate([
            'calculation_time' => [
                'nullable',
                'date',
            ],
        ]);

        try {
            $response = $pythonApi->getSatellitePosition(
                $noradId,
                $validated['calculation_time'] ?? null
            );
        } catch (ConnectionException $exception) {
            return response()->json([
                'message' => 'Não foi possível conectar à API Python.',
            ], 503);
        }

        $data = $response->json();

        if (!is_array($data)) {
            return response()->json([
                'message' => 'A API Python retornou uma resposta inválida.',
            ], 502);
        }

        return response()->json(
            $data,
            $response->status()
        );
    }
}