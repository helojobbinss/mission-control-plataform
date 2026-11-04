<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTelemetryReadingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('telemetry_readings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('satellite_id');
            $table->json('readings');
            $table->boolean('simulated')->default(true);
            $table->timestamp('recorded_at');
            $table->timestamps();
            $table->foreign('satellite_id')->references('id')->on('satellites')->onDelete('cascade');
            $table->index(['satellite_id', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('telemetry_readings');
    }
}
