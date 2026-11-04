<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Satellite extends Model
{
    public const SOURCE_CELESTRAK = 'celestrak';
    public const SOURCE_MANUAL = 'manual';

    public const STATUSES = ['active', 'inactive', 'decommissioned'];

    protected $fillable = [
        'norad_id',
        'name',
        'international_designator',
        'source',
        'status',
        'description',
        'launch_date',
        'orbit_altitude_km',
        'orbit_inclination_deg',
        'orbit_raan_deg',
        'orbit_initial_anomaly_deg',
        'orbit_epoch',
    ];

    protected $casts = [
        'norad_id' => 'integer',
        'launch_date' => 'date:Y-m-d',
        'orbit_altitude_km' => 'float',
        'orbit_inclination_deg' => 'float',
        'orbit_raan_deg' => 'float',
        'orbit_initial_anomaly_deg' => 'float',
        'orbit_epoch' => 'datetime',
    ];

    public function isManual(): bool
    {
        return $this->source === self::SOURCE_MANUAL;
    }

    /**
     * Parâmetros da órbita simulada, ou null para satélites com
     * dados orbitais reais.
     */
    public function simulatedOrbit(): ?array
    {
        if (!$this->isManual() || $this->orbit_altitude_km === null) {
            return null;
        }

        return [
            'altitude_km' => $this->orbit_altitude_km,
            'inclination_deg' => $this->orbit_inclination_deg,
            'raan_deg' => $this->orbit_raan_deg ?? 0.0,
            'initial_anomaly_deg' => $this->orbit_initial_anomaly_deg ?? 0.0,
            'epoch' => optional($this->orbit_epoch)->toIso8601String(),
        ];
    }

    public function telemetryReadings()
    {
        return $this->hasMany(TelemetryReading::class);
    }

    public function alerts()
    {
        return $this->hasMany(SatelliteAlert::class);
    }
}
