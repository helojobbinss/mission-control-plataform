<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Satellite extends Model
{
    protected $fillable = ['norad_id', 'name', 'source'];
    public function missions(): HasMany { return $this->hasMany(Mission::class); }
}
