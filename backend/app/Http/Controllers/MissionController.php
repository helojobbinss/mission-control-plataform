<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MissionController extends Controller
{
    public function index()
    {
        return Mission::query()->with('satellite')->orderBy('id')->get();
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $mission = new Mission($data);
        $this->applyStatus($mission, $data['status'], null);
        $mission->save();
        return response()->json($mission->fresh(), 201);
    }

    public function show(Mission $mission)
    {
        return $mission->load(['satellite', 'comments' => fn ($query) => $query->orderBy('id')]);
    }

    public function addComment(Request $request, Mission $mission)
    {
        $data = $request->validate([
            'author' => ['required', 'string', 'max:100'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        return response()->json($mission->comments()->create($data), 201);
    }

    public function update(Request $request, Mission $mission)
    {
        $data = $this->validated($request);
        DB::transaction(function () use ($mission, $data, $request) {
            $locked = Mission::whereKey($mission->id)->lockForUpdate()->firstOrFail();
            $status = $data['status'];
            unset($data['status']);
            $locked->fill($data);
            $this->applyStatus($locked, $status, $request->input('confirmation'));
            $locked->save();
        });

        return $mission->fresh();
    }

    public function destroy(Request $request, Mission $mission)
    {
        DB::transaction(function () use ($mission, $request) {
            $locked = Mission::whereKey($mission->id)->lockForUpdate()->firstOrFail();
            $this->ensureDeleteConfirmation($locked, $request->input('confirmation'));
            $locked->delete();
        });
        return response()->noContent();
    }

    public function bulk(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'integer', 'distinct', 'min:1'],
            'action' => ['required', Rule::in(['status', 'operator', 'delete'])],
            'value' => [Rule::requiredIf($request->input('action') !== 'delete'), 'nullable', 'string', 'max:255'],
        ]);
        if ($data['action'] === 'status' && ! in_array($data['value'], Mission::STATUSES, true)) {
            throw ValidationException::withMessages(['value' => 'Status inválido.']);
        }
        if ($data['action'] === 'operator' && trim($data['value']) === '') {
            throw ValidationException::withMessages(['value' => 'Informe o operador.']);
        }

        DB::transaction(function () use ($data, $request) {
            $missions = Mission::whereIn('id', $data['ids'])->lockForUpdate()->get();
            if ($missions->count() !== count($data['ids'])) {
                throw ValidationException::withMessages(['ids' => 'Uma ou mais missões não existem. Atualize a lista.']);
            }
            if ($data['action'] === 'status') {
                foreach ($missions as $mission) {
                    $this->ensureConfirmation($mission, $data['value'], $request->input('confirmation'));
                }
            }
            if ($data['action'] === 'delete') {
                foreach ($missions as $mission) {
                    $this->ensureDeleteConfirmation($mission, $request->input('confirmation'));
                }
            }
            foreach ($missions as $mission) {
                match ($data['action']) {
                    'delete' => $mission->delete(),
                    'status' => $this->changeStatus($mission, $data['value'], $request->input('confirmation')),
                    'operator' => $mission->update(['operator_name' => trim($data['value'])]),
                };
            }
        });
        return response()->json(['updated' => count($data['ids'])]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'satellite_id' => ['required', 'integer', Rule::exists('satellites', 'id')],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(Mission::STATUSES)],
            'category' => ['nullable', 'string', 'max:64'],
            'operator_name' => ['nullable', 'string', 'max:255'],
            'planned_start_date' => ['nullable', 'date_format:Y-m-d'],
            'planned_end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:planned_start_date'],
            'budget' => ['nullable', 'regex:/^\d{1,10}(\.\d{1,2})?$/'],
        ]);
    }

    public function transition(Request $request, Mission $mission)
    {
        $data = $request->validate(['action' => ['required', Rule::in(['start', 'complete', 'abort'])]]);
        DB::transaction(function () use ($mission, $data) {
            $locked = Mission::whereKey($mission->id)->lockForUpdate()->firstOrFail();
            $allowed = match ($data['action']) {
                'start' => $locked->status === 'Agendada',
                'complete' => $locked->status === 'Ativa',
                'abort' => in_array($locked->status, ['Agendada', 'Ativa'], true),
            };
            if (! $allowed) {
                throw ValidationException::withMessages(['action' => 'Esta ação não é permitida para o status atual.']);
            }
            $status = match ($data['action']) { 'start' => 'Ativa', 'complete' => 'Concluída', 'abort' => 'Abortada' };
            $this->changeStatus($locked, $status, null);
        });
        return $mission->fresh();
    }

    private function changeStatus(Mission $mission, string $status, mixed $confirmation): void
    {
        $this->applyStatus($mission, $status, $confirmation);
        $mission->save();
    }

    private function applyStatus(Mission $mission, string $status, mixed $confirmation): void
    {
        $this->ensureConfirmation($mission, $status, $confirmation);
        if ($mission->status !== $status || ! $mission->exists) {
            if ($status === 'Ativa' && ! $mission->started_at) $mission->started_at = now();
            if (in_array($status, ['Concluída', 'Abortada'], true)) $mission->ended_at = now();
            else $mission->ended_at = null;
        }
        $mission->status = $status;
    }

    private function ensureConfirmation(Mission $mission, string $newStatus, mixed $confirmation): void
    {
        if (in_array($mission->status, ['Concluída', 'Abortada'], true)
            && $mission->status !== $newStatus
            && $confirmation !== 'ciente') {
            throw ValidationException::withMessages(['confirmation' => 'Digite ciente para alterar uma missão concluída ou abortada.']);
        }
    }

    private function ensureDeleteConfirmation(Mission $mission, mixed $confirmation): void
    {
        if ($mission->status === 'Concluída' && $confirmation !== 'ciente') {
            throw ValidationException::withMessages(['confirmation' => 'Digite ciente para excluir uma missão concluída.']);
        }
    }
}
