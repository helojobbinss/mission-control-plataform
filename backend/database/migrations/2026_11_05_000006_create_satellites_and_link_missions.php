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
        Schema::create('satellites', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('norad_id')->unique();
            $table->string('name');
            $table->string('source')->default('CelesTrak');
            $table->timestamps();
        });
        Schema::table('missions', function (Blueprint $table) {
            $table->foreignId('satellite_id')->constrained()->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('missions', fn (Blueprint $table) => $table->dropConstrainedForeignId('satellite_id'));
        Schema::dropIfExists('satellites');
    }
};
