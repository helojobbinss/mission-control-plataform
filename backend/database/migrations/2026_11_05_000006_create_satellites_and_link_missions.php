<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (DB::table('missions')->exists()) {
            throw new RuntimeException('Existem missões sem satélite. Vincule-as antes de aplicar esta migration.');
        }
        // satellites já pertence ao módulo de monitoramento (migration de 01/11).
        Schema::table('missions', function (Blueprint $table) {
            $table->foreignId('satellite_id')->constrained()->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('missions', fn (Blueprint $table) => $table->dropConstrainedForeignId('satellite_id'));
    }
};
