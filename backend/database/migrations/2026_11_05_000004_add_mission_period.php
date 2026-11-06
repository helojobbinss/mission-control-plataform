<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->date('planned_start_date')->nullable();
            $table->date('planned_end_date')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('missions', fn (Blueprint $table) => $table->dropColumn(['planned_start_date', 'planned_end_date', 'started_at', 'ended_at']));
    }
};
