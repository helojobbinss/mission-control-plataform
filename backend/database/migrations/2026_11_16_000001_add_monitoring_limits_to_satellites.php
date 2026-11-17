<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('satellites', fn (Blueprint $table) => $table->json('monitoring_limits')->nullable());
    }
    public function down(): void
    {
        Schema::table('satellites', fn (Blueprint $table) => $table->dropColumn('monitoring_limits'));
    }
};
