<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceOrder extends Model
{
    use SoftDeletes;

    public const TYPES = [
        'maintenance',
        'urgency',
    ];

    public const STATUSES = [
        'open',
        'in_progress',
        'completed',
        'cancelled',
    ];

    protected $fillable = [
        'title',
        'description',
        'type',
        'status',
        'operator_id',
        'mission_id',
        'satellite_id',
        'alert_id',
    ];

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class);
    }

    public function satellite(): BelongsTo
    {
        return $this->belongsTo(Satellite::class);
    }

    public function alert(): BelongsTo
    {
        return $this->belongsTo(SatelliteAlert::class, 'alert_id');
    }
}
