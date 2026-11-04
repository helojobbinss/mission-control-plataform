<?php

namespace App\Http\Controllers;

use App\Models\Satellite;
use App\Services\Integrations\CelesTrakService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;


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
}
