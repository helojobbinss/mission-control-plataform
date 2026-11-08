<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MissionComment extends Model
{
    protected $fillable = ['author', 'body'];

    public function mission(): BelongsTo { return $this->belongsTo(Mission::class); }
}
