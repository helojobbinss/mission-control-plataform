<?php

namespace App\Http\Controllers;

use App\Models\Satellite;
use App\Services\MonitoringLimits;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MonitoringLimitsController extends Controller
{
    public function show(Satellite $satellite, MonitoringLimits $limits)
    {
        return response()->json($limits->get($satellite));
    }

    public function update(Request $request, Satellite $satellite, MonitoringLimits $limits)
    {
        abort_unless($request->user()->is_active && in_array($request->user()->role?->name, ['gerente', 'operador'], true), 403);
        $rules = ['limits' => ['required', 'array:internal_temperature,battery_level,voltage']];
        foreach (MonitoringLimits::DEFAULTS as $parameter => $_) {
            $rules["limits.$parameter"] = ['required', 'array:min,max,critical_min,critical_max'];
            foreach (['min', 'max', 'critical_min', 'critical_max'] as $bound) {
                $rules["limits.$parameter.$bound"] = ['present', 'nullable', 'numeric', $parameter === 'battery_level' ? 'between:0,100' : ($parameter === 'voltage' ? 'between:0,1000000' : 'between:-273.15,1000000')];
            }
        }
        $data = $request->validate($rules)['limits'];
        foreach ($data as $parameter => &$bounds) {
            foreach ($bounds as &$value) $value = $value === null ? null : (float) $value;
            unset($value);
            $ordered = array_values(array_filter([$bounds['critical_min'], $bounds['min'], $bounds['max'], $bounds['critical_max']], fn ($v) => $v !== null));
            $sorted = $ordered;
            sort($sorted);
            if ($ordered !== $sorted) throw ValidationException::withMessages(["limits.$parameter" => 'Use crítico mínimo ≤ mínimo ≤ máximo ≤ crítico máximo.']);
        }
        unset($bounds);
        $satellite->monitoring_limits = $data;
        $satellite->save();
        return response()->json($limits->get($satellite));
    }
}
