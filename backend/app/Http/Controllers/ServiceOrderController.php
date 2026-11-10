<?php

namespace App\Http\Controllers;

use App\Models\ServiceOrder;
use App\Models\Mission;
use App\Models\Satellite;
use App\Models\SatelliteAlert;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ServiceOrderController extends Controller
{
    public function index()
    {
        $orders = ServiceOrder::with([
            'operator',
            'mission',
            'satellite',
            'alert'
        ])
        ->latest()
        ->get();

        return response()->json($orders);
    }

    /**
     * Consultar uma ordem de serviço.
     */
    public function show($id)
    {
        $order = ServiceOrder::with([
            'operator',
            'mission',
            'satellite',
            'alert'
        ])->findOrFail($id);

        return response()->json($order);
    }

    /**
     * Criar ordem de serviço.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([

            'title' => 'required|string|max:255',

            'description' => 'required|string',

            'type' => [
                'required',
                Rule::in(ServiceOrder::TYPES)
            ],

            'operator_id' => [
                'required',
                Rule::exists('users', 'id')
                    ->where('is_active', true)
            ],

            'mission_id' => 'required|exists:missions,id',

            'satellite_id' => 'required|exists:satellites,id',

            'alert_id' => [
                Rule::requiredIf(
                    $request->input('type') === 'urgency'
                ),
                'nullable',
                'exists:satellite_alerts,id'
            ],

        ]);

        $this->validateAssociations(
            $validated['mission_id'],
            $validated['satellite_id'],
            $validated['alert_id'] ?? null,
            $validated['type']
        );

        $order = ServiceOrder::create([
            ...$validated,
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Ordem de serviço criada com sucesso.',
            'data' => $order->load([
                'operator',
                'mission',
                'satellite',
                'alert'
            ])
        ], 201);
    }

    /**
     * Atualizar ordem de serviço.
     */
    public function update(Request $request, $id)
    {
        $order = ServiceOrder::findOrFail($id);

        $validated = $request->validate([

            'title' => 'sometimes|required|string|max:255',

            'description' => 'sometimes|required|string',

            'type' => [
                'sometimes',
                'required',
                Rule::in(ServiceOrder::TYPES)
            ],

            'status' => [
                'sometimes',
                'required',
                Rule::in(ServiceOrder::STATUSES)
            ],

            'operator_id' => [
                'sometimes',
                'required',
                Rule::exists('users', 'id')
                    ->where('is_active', true)
            ],

            'mission_id' => 'sometimes|required|exists:missions,id',

            'satellite_id' => 'sometimes|required|exists:satellites,id',

            'alert_id' => [
                'sometimes',
                'nullable',
                'exists:satellite_alerts,id'
            ],

        ]);

        $missionId = $validated['mission_id']
            ?? $order->mission_id;

        $satelliteId = $validated['satellite_id']
            ?? $order->satellite_id;

        $type = $validated['type']
            ?? $order->type;

        $alertId = array_key_exists('alert_id', $validated)
            ? $validated['alert_id']
            : $order->alert_id;

        $this->validateAssociations(
            $missionId,
            $satelliteId,
            $alertId,
            $type
        );

        $order->update($validated);

        return response()->json([
            'message' => 'Ordem de serviço atualizada com sucesso.',
            'data' => $order->fresh()->load([
                'operator',
                'mission',
                'satellite',
                'alert'
            ])
        ]);
    }

    /**
     * Excluir ordem de serviço (exclusão lógica).
     */
    public function destroy($id)
    {
        $order = ServiceOrder::findOrFail($id);

        $order->delete();

        return response()->json([
            'message' => 'Ordem de serviço excluída com sucesso.'
        ]);
    }

    /**
     * Validar os relacionamentos da ordem.
     */
    private function validateAssociations(
        $missionId,
        $satelliteId,
        $alertId,
        $type
    ) {
        $mission = Mission::findOrFail($missionId);

        if ((int) $mission->satellite_id !== (int) $satelliteId) {
            throw ValidationException::withMessages([
                'satellite_id' => [
                    'O satélite informado não pertence à missão selecionada.'
                ]
            ]);
        }

        if ($type === 'urgency' && !$alertId) {
            throw ValidationException::withMessages([
                'alert_id' => [
                    'Ordens de urgência precisam estar vinculadas a um alerta.'
                ]
            ]);
        }

        if ($alertId) {
            $alert = SatelliteAlert::findOrFail($alertId);

            if ((int) $alert->satellite_id !== (int) $satelliteId) {
                throw ValidationException::withMessages([
                    'alert_id' => [
                        'O alerta informado não pertence ao satélite selecionado.'
                    ]
                ]);
            }
        }
    }
}
