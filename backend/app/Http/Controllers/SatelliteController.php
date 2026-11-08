<?php

namespace App\Http\Controllers;

use App\Models\Satellite;
use App\Services\Integrations\CelesTrakService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;


class SatelliteController extends Controller
{
    private const CAN_WRITE = ['gerente', 'operador'];
    private const CAN_DELETE = ['gerente'];

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'source' => ['nullable', Rule::in([Satellite::SOURCE_CELESTRAK, Satellite::SOURCE_MANUAL])],
            'status' => ['nullable', Rule::in(Satellite::STATUSES)],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Satellite::query()
            ->withCount(['alerts as open_alerts_count' => function ($q) {
                $q->where('resolved', false);
            }])
            ->orderBy('name')
            ->orderBy('id');

        if (!empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';

            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', $term)
                    ->orWhere('international_designator', 'like', $term)
                    ->orWhere('norad_id', 'like', $term);
            });
        }

        $page = $query->paginate($filters['per_page'] ?? 15);

        return response()->json(
            $page->through(fn (Satellite $s) => $this->present($s))
        );
    }

    public function show(Satellite $satellite): JsonResponse
    {
        $satellite->loadCount(['alerts as open_alerts_count' => function ($q) {
            $q->where('resolved', false);
        }]);

        $latest = $satellite->telemetryReadings()
            ->orderByDesc('recorded_at')
            ->first();

        return response()->json(array_merge($this->present($satellite), [
            'latest_reading' => $latest ? [
                'recorded_at' => $latest->recorded_at,
                'simulated' => $latest->simulated,
                'orbital_position' => $latest->orbital_position,
            ] : null,
        ]));
    }

    public function store(Request $request, CelesTrakService $celesTrak): JsonResponse
    {
        if ($denied = $this->deny($request, self::CAN_WRITE, 'cadastrar satélites')) {
            return $denied;
        }

        $isManual = fn () => $request->input('source') === Satellite::SOURCE_MANUAL;
        $isCelestrak = fn () => $request->input('source') === Satellite::SOURCE_CELESTRAK;

        $data = $request->validate([
            'source' => ['required', Rule::in([Satellite::SOURCE_CELESTRAK, Satellite::SOURCE_MANUAL])],
            'norad_id' => [
                Rule::requiredIf($isCelestrak),
                'nullable', 'integer', 'min:1', 'max:999999999',
                'unique:satellites,norad_id',
            ],
            'name' => [Rule::requiredIf($isManual), 'nullable', 'string', 'max:255'],
            'international_designator' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', Rule::in(Satellite::STATUSES)],
            'description' => ['nullable', 'string', 'max:2000'],
            'launch_date' => ['nullable', 'date', 'before_or_equal:today'],
            'orbit' => [Rule::requiredIf($isManual), $isCelestrak() ? 'prohibited' : 'array'],
            'orbit.altitude_km' => [Rule::requiredIf($isManual), 'numeric', 'between:160,40000'],
            'orbit.inclination_deg' => [Rule::requiredIf($isManual), 'numeric', 'between:0,180'],
            'orbit.raan_deg' => ['nullable', 'numeric', 'between:0,359.999'],
            'orbit.initial_anomaly_deg' => ['nullable', 'numeric', 'between:0,359.999'],
        ]);

        $attributes = [
            'source' => $data['source'],
            'norad_id' => $data['norad_id'] ?? null,
            'name' => $data['name'] ?? null,
            'international_designator' => $data['international_designator'] ?? null,
            'status' => $data['status'] ?? 'active',
            'description' => $data['description'] ?? null,
            'launch_date' => $data['launch_date'] ?? null,
        ];

        if ($data['source'] === Satellite::SOURCE_CELESTRAK) {
            // Completa nome e designador internacional com o CelesTrak.
            try {
                $record = $celesTrak->getSatelliteByNoradId((string) $data['norad_id'])[0] ?? [];

                $attributes['name'] = $attributes['name'] ?: ($record['OBJECT_NAME'] ?? null);
                $attributes['international_designator'] =
                    $attributes['international_designator'] ?: ($record['OBJECT_ID'] ?? null);
            } catch (Throwable $exception) {
                report($exception);

                if (!$attributes['name']) {
                    return response()->json([
                        'message' => 'Não foi possível consultar o CelesTrak. '
                            . 'Verifique o número NORAD ou informe o nome manualmente.',
                    ], 502);
                }
            }
        } else {
            $orbit = $data['orbit'];

            $attributes += [
                'orbit_altitude_km' => $orbit['altitude_km'],
                'orbit_inclination_deg' => $orbit['inclination_deg'],
                'orbit_raan_deg' => $orbit['raan_deg'] ?? 0,
                'orbit_initial_anomaly_deg' => $orbit['initial_anomaly_deg'] ?? 0,
                'orbit_epoch' => now(),
            ];
        }

        $satellite = Satellite::create($attributes);

        return response()->json([
            'message' => 'Satélite cadastrado com sucesso.',
            'satellite' => $this->present($satellite->refresh()),
        ], 201);
    }

    public function update(Request $request, Satellite $satellite): JsonResponse
    {
        if ($denied = $this->deny($request, self::CAN_WRITE, 'editar satélites')) {
            return $denied;
        }

        $data = $request->validate([
            // A identidade (origem e NORAD) não pode ser alterada.
            'source' => ['prohibited'],
            'norad_id' => ['prohibited'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'international_designator' => ['sometimes', 'nullable', 'string', 'max:50'],
            'status' => ['sometimes', 'required', Rule::in(Satellite::STATUSES)],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'launch_date' => ['sometimes', 'nullable', 'date', 'before_or_equal:today'],
            'orbit' => [$satellite->isManual() ? 'sometimes' : 'prohibited', 'array'],
            'orbit.altitude_km' => ['sometimes', 'required', 'numeric', 'between:160,40000'],
            'orbit.inclination_deg' => ['sometimes', 'required', 'numeric', 'between:0,180'],
            'orbit.raan_deg' => ['sometimes', 'required', 'numeric', 'between:0,359.999'],
            'orbit.initial_anomaly_deg' => ['sometimes', 'required', 'numeric', 'between:0,359.999'],
        ]);

        $orbit = $data['orbit'] ?? null;
        unset($data['orbit']);

        if ($orbit) {
            foreach ($orbit as $key => $value) {
                $data['orbit_' . $key] = $value;
            }

            // Uma nova órbita passa a valer a partir de agora.
            $data['orbit_epoch'] = now();
        }

        $satellite->update($data);

        return response()->json([
            'message' => 'Satélite atualizado com sucesso.',
            'satellite' => $this->present($satellite->refresh()),
        ]);
    }

    public function destroy(Request $request, Satellite $satellite): JsonResponse
    {
        if ($denied = $this->deny($request, self::CAN_DELETE, 'excluir satélites')) {
            return $denied;
        }

        // O histórico de telemetria e os alertas são removidos em cascata.
        $satellite->delete();

        return response()->json([
            'message' => 'Satélite excluído com sucesso.',
        ]);
    }

    private function present(Satellite $satellite): array
    {
        $item = [
            'id' => $satellite->id,
            'norad_id' => $satellite->norad_id,
            'name' => $satellite->name,
            'international_designator' => $satellite->international_designator,
            'source' => $satellite->source,
            'status' => $satellite->status,
            'description' => $satellite->description,
            'launch_date' => optional($satellite->launch_date)->toDateString(),
            'orbit' => $satellite->simulatedOrbit(),
            'created_at' => $satellite->created_at,
            'updated_at' => $satellite->updated_at,
        ];

        if (isset($satellite->open_alerts_count)) {
            $item['open_alerts_count'] = (int) $satellite->open_alerts_count;
        }

        return $item;
    }

    private function deny(Request $request, array $allowedRoles, string $action): ?JsonResponse
    {
        $role = optional($request->user()->role)->name;

        if (in_array($role, $allowedRoles, true)) {
            return null;
        }

        return response()->json([
            'message' => "Você não tem permissão para {$action}.",
        ], 403);
    }
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
