<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SatelliteAlert extends Model
{
    protected $fillable = [
        'satellite_id',
        'code',
        'parameter',
        'severity',
        'measured_value',
        'unit',
        'threshold',
        'message',
        'occurred_at',
        'resolved',
    ];

    protected $casts = [
        'measured_value' => 'array',
        'threshold' => 'array',
        'occurred_at' => 'datetime',
        'resolved' => 'boolean',
    ];

    public function satellite()
    {
        return $this->belongsTo(Satellite::class);
    }
}