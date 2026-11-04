<?php

namespace App\Services\Integrations;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class NasaDonkiService
{
    private function getEvents(string $type,string $startDate,string $endDate): array {
        $baseUrl = rtrim(
            config('services.nasa.donki_base_url'),
            '/'
        );

        try {
            $response = Http::acceptJson()
                ->timeout(30)
                ->get("{$baseUrl}/{$type}", [
                    'startDate' => $startDate,
                    'endDate' => $endDate,
                    'api_key' => config('services.nasa.api_key'),
                ]);

            if (!$response->successful()) {
                Log::error('Erro HTTP na NASA DONKI', [
                    'endpoint' => $type,
                    'status' => $response->status(),
                ]);

                throw new RuntimeException(
                    'NASA DONKI retornou HTTP '
                    . $response->status()
                );
            }

            $data = $response->json();

            if (!is_array($data)) {
                throw new RuntimeException(
                    'NASA DONKI retornou uma resposta inválida.'
                );
            }

            return $data;
        } catch (ConnectionException $exception) {
            Log::error('Falha de conexão com NASA DONKI', [
                'endpoint' => $type,
                'message' => $exception->getMessage(),
            ]);

            throw new RuntimeException(
                'Não foi possível conectar à NASA DONKI.',
                0,
                $exception
            );
        }
    }

    public function getSolarFlares(
        string $startDate,
        string $endDate
    ): array {
        return $this->getEvents('FLR', $startDate, $endDate);
    }

    public function getGeomagneticStorms(
        string $startDate,
        string $endDate
    ): array {
        return $this->getEvents('GST', $startDate, $endDate);
    }

    public function getCoronalMassEjections(
        string $startDate,
        string $endDate
    ): array {
        return $this->getEvents('CME', $startDate, $endDate);
    }
}