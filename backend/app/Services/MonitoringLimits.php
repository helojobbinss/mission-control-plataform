<?php

namespace App\Services;

use App\Models\Satellite;

class MonitoringLimits
{
    public const DEFAULTS = [
        'internal_temperature' => ['min' => null, 'max' => 40, 'critical_min' => null, 'critical_max' => null],
        'battery_level' => ['min' => 20, 'max' => null, 'critical_min' => null, 'critical_max' => null],
        'voltage' => ['min' => 25, 'max' => 31, 'critical_min' => null, 'critical_max' => null],
    ];

    public function get(Satellite $satellite): array
    {
        return $satellite->monitoring_limits ?? self::DEFAULTS;
    }

    public function apply(Satellite $satellite, array $data): array
    {
        // Sem configuração própria, preserva integralmente o contrato legado.
        if ($satellite->monitoring_limits === null) return $data;
        foreach ($this->get($satellite) as $parameter => $limits) {
            $sensor = $data['sensors'][$parameter] ?? null;
            $value = $sensor['value'] ?? null;
            if (!is_int($value) && !is_float($value)) continue;
            if (!is_finite((float) $value)) continue;
            $data['alerts'] = array_values(array_filter($data['alerts'] ?? [], fn ($alert) =>
                ($alert['parameter'] ?? null) !== $parameter || ($alert['code'] ?? '') === 'SENSOR_FAILURE'));
            $critical = ($limits['critical_min'] !== null && $value < $limits['critical_min']) || ($limits['critical_max'] !== null && $value > $limits['critical_max']);
            $low = $limits['min'] !== null && $value < $limits['min'];
            $high = $limits['max'] !== null && $value > $limits['max'];
            $data['sensors'][$parameter]['status'] = $critical ? 'critical' : (($low || $high) ? 'warning' : 'normal');
            if ($critical || $low || $high) {
                $threshold = $critical
                    ? (($limits['critical_min'] !== null && $value < $limits['critical_min']) ? $limits['critical_min'] : $limits['critical_max'])
                    : ($low ? $limits['min'] : $limits['max']);
                $data['alerts'][] = [
                    'code' => 'MONITORING_LIMIT', 'parameter' => $parameter, 'satellite_id' => $satellite->id,
                    'severity' => $critical ? 'critical' : 'high', 'measured_value' => $value,
                    'unit' => $sensor['unit'], 'threshold' => $threshold,
                    'message' => "{$parameter}: limite configurado ultrapassado ({$threshold} {$sensor['unit']}).",
                    'timestamp' => $data['timestamp'],
                ];
            }
        }
        $data['total_alerts'] = count($data['alerts'] ?? []);
        return $data;
    }
}
