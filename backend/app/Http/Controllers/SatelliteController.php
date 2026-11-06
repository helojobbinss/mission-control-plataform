<?php

namespace App\Http\Controllers;

use App\Models\Satellite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Throwable;

class SatelliteController extends Controller
{
    public function index() { return Satellite::with('missions:id,name,status,satellite_id')->orderBy('name')->get(); }

    public function orbit(Satellite $satellite)
    {
        try {
            $data = Cache::remember('celestrak-orbit-'.$satellite->norad_id, now()->addMinutes(60), function () use ($satellite) {
                $response = Http::timeout(12)->acceptJson()->get('https://celestrak.org/NORAD/elements/gp.php', ['CATNR' => $satellite->norad_id, 'FORMAT' => 'JSON']);
                $response->throw();
                $items = $response->json();
                $item = is_array($items) ? ($items[0] ?? null) : null;
                if (! is_array($item) || (int) ($item['NORAD_CAT_ID'] ?? 0) !== (int) $satellite->norad_id || empty($item['EPOCH'])) {
                    throw new \RuntimeException('Dados orbitais indisponíveis.');
                }
                return ['source' => 'CelesTrak', 'retrieved_at' => now()->toIso8601String(), 'elements' => $item];
            });
            return response()->json($data);
        } catch (Throwable $exception) {
            return response()->json(['message' => 'Dados orbitais indisponíveis no CelesTrak.'], 503);
        }
    }

    public function reception(Satellite $satellite)
    {
        try {
            $data = Cache::remember('satnogs-reception-'.$satellite->norad_id, now()->addMinutes(10), function () use ($satellite) {
                $observations = collect(['good', 'bad'])->flatMap(function ($status) use ($satellite) {
                    $response = Http::timeout(10)->acceptJson()->get('https://network.satnogs.org/api/observations/', [
                        'norad_cat_id' => $satellite->norad_id,
                        'status' => $status,
                    ]);
                    $response->throw();
                    $items = $response->json();

                    return is_array($items) ? $items : [];
                })->filter(fn ($item) => is_array($item)
                    && (int) ($item['norad_cat_id'] ?? 0) === (int) $satellite->norad_id
                    && is_string($item['start'] ?? null))
                    ->sortByDesc('start');

                $latest = $observations->first();
                $waterfall = $latest['waterfall_status'] ?? null;
                $state = match (true) {
                    $waterfall === 'with-signal' => 'detected',
                    $waterfall === 'without-signal' => 'not_detected',
                    ($latest['status'] ?? null) === 'good' => 'validated',
                    $latest !== null => 'unverified',
                    default => 'no_data',
                };

                return [
                    'source' => 'SatNOGS Network',
                    'license' => 'CC BY-SA',
                    'checked_at' => now()->toIso8601String(),
                    'signal' => [
                        'state' => $state,
                        'label' => match ($state) {
                            'detected' => 'Sinal detectado',
                            'not_detected' => 'Sem sinal detectado',
                            'validated' => 'Recepção validada',
                            'unverified' => 'Recepção sem confirmação',
                            default => 'Sem observações públicas',
                        },
                        'strength_dbm' => null,
                        'snr_db' => null,
                    ],
                    'observation' => $latest === null ? null : [
                        'id' => $latest['id'] ?? null,
                        'start' => $latest['start'],
                        'end' => $latest['end'] ?? null,
                        'status' => $latest['status'] ?? null,
                        'waterfall_status' => $waterfall,
                        'station_name' => $latest['station_name'] ?? null,
                        'frequency_hz' => $latest['observation_frequency'] ?? null,
                        'mode' => $latest['transmitter_mode'] ?? null,
                        'url' => isset($latest['id']) ? 'https://network.satnogs.org/observations/'.$latest['id'].'/' : null,
                    ],
                ];
            });

            return response()->json($data);
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['message' => 'Não foi possível consultar as observações públicas do SatNOGS.'], 503);
        }
    }

    public function search(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'min:3', 'max:80']]);
        $name = trim($data['name']);
        if (mb_strlen($name) < 3) return response()->json(['message' => 'Digite pelo menos 3 caracteres.'], 422);
        try {
            $result = Cache::remember('celestrak-search-'.hash('sha256', mb_strtolower($name)), now()->addMinutes(15), function () use ($name) {
                $response = Http::timeout(12)->acceptJson()->get('https://celestrak.org/NORAD/elements/gp.php', ['NAME' => $name, 'FORMAT' => 'JSON']);
                if ($response->status() === 404) return ['data' => [], 'truncated' => false];
                $response->throw();
                $items = $response->json();
                if (! is_array($items)) throw new \RuntimeException('Resposta inválida do CelesTrak.');
                $matches = collect($items)->filter(fn ($item) => is_array($item) && is_string($item['OBJECT_NAME'] ?? null) && is_numeric($item['NORAD_CAT_ID'] ?? null))
                    ->map(fn ($item) => ['name' => $item['OBJECT_NAME'], 'norad_id' => (int) $item['NORAD_CAT_ID']])
                    ->unique('norad_id')->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)->values();
                return ['data' => $matches->take(30)->all(), 'truncated' => $matches->count() > 30];
            });
            return response()->json($result);
        } catch (Throwable $exception) {
            return response()->json(['message' => 'Não foi possível consultar o CelesTrak. Tente novamente mais tarde.'], 503);
        }
    }

    public function import(Request $request)
    {
        $data = $request->validate(['norad_id' => ['required', 'integer', 'min:1', 'max:999999999']]);
        $id = (int) $data['norad_id'];
        $existing = Satellite::where('norad_id', $id)->first();
        if ($existing) return response()->json($existing);
        try {
            $result = Cache::remember('celestrak-satellite-'.$id, now()->addHours(6), function () use ($id) {
                $response = Http::timeout(12)->acceptJson()->get('https://celestrak.org/NORAD/elements/gp.php', ['CATNR' => $id, 'FORMAT' => 'JSON']);
                $response->throw();
                $items = $response->json();
                if (! is_array($items)) return null;
                return $items[0] ?? null;
            });
        } catch (Throwable $exception) {
            return response()->json(['message' => 'Não foi possível consultar o CelesTrak. Tente novamente mais tarde.'], 503);
        }
        if (! is_array($result) || (int) ($result['NORAD_CAT_ID'] ?? 0) !== $id || ! is_string($result['OBJECT_NAME'] ?? null) || trim($result['OBJECT_NAME']) === '') {
            return response()->json(['message' => 'Satélite não encontrado no CelesTrak.'], 404);
        }
        return response()->json(Satellite::firstOrCreate(['norad_id' => $id], ['name' => trim($result['OBJECT_NAME']), 'source' => 'CelesTrak']), 201);
    }
}
