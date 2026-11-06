<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mission extends Model
{
    public const STATUSES = ['Agendada', 'Ativa', 'Concluída', 'Abortada'];

    public function comments(): HasMany { return $this->hasMany(MissionComment::class); }
    public function satellite(): BelongsTo { return $this->belongsTo(Satellite::class); }

    protected $fillable = [
        'name',
        'satellite_id',
        'description',
        'status',
        'category',
        'operator_name',
        'planned_start_date',
        'planned_end_date',
        'budget',
    ];

    protected function casts(): array
    {
        return ['planned_start_date' => 'date:Y-m-d', 'planned_end_date' => 'date:Y-m-d', 'started_at' => 'datetime', 'ended_at' => 'datetime', 'budget' => 'decimal:2'];
    }
}
