<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TelemetryReading extends Model
{
    protected $fillable = [
        'satellite_id',
        'readings',
        'orbital_position',
        'simulated',
        'recorded_at',
    ];

    protected $casts = [
        'readings' => 'array',
        'orbital_position' => 'array',
        'simulated' => 'boolean',
        'recorded_at' => 'datetime',
    ];

    public function satellite()
    {
        return $this->belongsTo(Satellite::class);
    }
}