<?php

namespace App\Services\Integrations;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class CelesTrakService
{
    public function getSatelliteByNoradId(string $noradId): array
    {
        $baseUrl = rtrim(
            config('services.celestrak.base_url'),
            '/'
        );

        try {
            $response = Http::acceptJson()
                ->timeout(20)
                ->get("{$baseUrl}/gp.php", [
                    'CATNR' => $noradId,
                    'FORMAT' => 'JSON',
                ]);
        } catch (ConnectionException $exception) {
            throw new RuntimeException(
                'Não foi possível conectar ao CelesTrak.',
                0,
                $exception
            );
        }

        if (!$response->successful()) {
            throw new RuntimeException(
                'CelesTrak retornou HTTP ' . $response->status()
            );
        }

        $data = $response->json();

        if (!is_array($data) || empty($data)) {
            throw new RuntimeException(
                'CelesTrak não retornou dados orbitais válidos.'
            );
        }

        return $data;
    }
}