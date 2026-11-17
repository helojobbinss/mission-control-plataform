<?php

namespace App\Services;

use App\Models\Mission;
use App\Models\Satellite;
use App\Models\TelemetryReading;
use Carbon\CarbonImmutable;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;

class DataExportService
{
    private const COLUMNS = [
        'missions' => ['id', 'name', 'satellite_id', 'description', 'status', 'category', 'operator_name', 'planned_start_date', 'planned_end_date', 'started_at', 'ended_at', 'budget', 'created_at', 'updated_at'],
        'satellites' => ['id', 'norad_id', 'name', 'international_designator', 'source', 'status', 'description', 'launch_date', 'orbit_altitude_km', 'orbit_inclination_deg', 'orbit_raan_deg', 'orbit_initial_anomaly_deg', 'orbit_epoch', 'created_at', 'updated_at'],
        'telemetry' => ['id', 'satellite_id', 'recorded_at', 'simulated', 'parameter', 'value', 'unit', 'status', 'latitude_deg', 'longitude_deg', 'altitude_km', 'orbital_speed_km_s'],
    ];

    public function query(array $filters): Builder
    {
        $type = $filters['dataset'];
        $query = match ($type) {
            'missions' => Mission::query(),
            'satellites' => Satellite::query(),
            'telemetry' => TelemetryReading::query(),
        };
        if (!empty($filters['satellite_id'])) {
            $query->where($type === 'satellites' ? 'id' : 'satellite_id', $filters['satellite_id']);
        }
        if (!empty($filters['mission_id'])) {
            if ($type === 'missions') {
                $query->whereKey($filters['mission_id']);
            } else {
                $query->whereHas('missions', fn (Builder $q) => $q->whereKey($filters['mission_id']));
            }
        }
        $dateColumn = $type === 'telemetry' ? 'recorded_at' : 'created_at';
        if (!empty($filters['start_date'])) {
            $query->where($dateColumn, '>=', CarbonImmutable::parse($filters['start_date'], 'UTC')->startOfDay());
        }
        if (!empty($filters['end_date'])) {
            // Limite exclusivo inclui todo o último dia, inclusive frações de segundo.
            $query->where($dateColumn, '<', CarbonImmutable::parse($filters['end_date'], 'UTC')->addDay()->startOfDay());
        }
        return $query;
    }

    public function write(Builder $query, string $type, $output): void
    {
        fwrite($output, "\xEF\xBB\xBF");
        $this->csv($output, self::COLUMNS[$type]);
        // Keyset pagination: memória limitada a um lote, sem N+1 ou APIs externas.
        foreach ($query->lazyById(500) as $record) {
            if ($type !== 'telemetry') {
                $this->csv($output, array_map(function ($column) use ($record) {
                    $value = $record->$column;
                    if ($value instanceof DateTimeInterface) {
                        return in_array($column, ['launch_date', 'planned_start_date', 'planned_end_date'], true)
                            ? $value->format('Y-m-d') : $value->copy()->utc()->format('Y-m-d\TH:i:s\Z');
                    }
                    return $value;
                }, self::COLUMNS[$type]));
                continue;
            }
            $position = $record->orbital_position ?? [];
            $sensors = $record->readings ?: ['' => []];
            foreach ($sensors as $parameter => $sensor) {
                $sensor = is_array($sensor) ? $sensor : ['value' => $sensor];
                $this->csv($output, [
                    $record->id, $record->satellite_id,
                    $record->recorded_at->copy()->utc()->format('Y-m-d\TH:i:s\Z'),
                    $record->simulated ? 1 : 0, $parameter,
                    $sensor['value'] ?? null, $sensor['unit'] ?? null, $sensor['status'] ?? null,
                    $position['latitude'] ?? null, $position['longitude'] ?? null,
                    $position['altitude_km'] ?? null, $position['orbital_speed_km_s'] ?? null,
                ]);
            }
        }
    }

    private function csv($output, array $values): void
    {
        $safe = array_map(function ($value) {
            if (is_array($value) || is_object($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            }
            // Protege texto contra fórmulas, inclusive após espaços/controles.
            // Valores numéricos tipados (incluindo negativos) são preservados.
            if (is_string($value) && preg_match('/^[\s\x00-\x20]*[=+@-]|^[\t\r\n]/u', $value)) {
                return "'".$value;
            }
            return $value;
        }, $values);
        fputcsv($output, $safe, ',', '"', '', "\r\n");
    }
}
