<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSatelliteAlertsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('satellite_alerts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('satellite_id');
            $table->string('code');

        $table->string('parameter');

        $table->string('severity');
            $table->json('measured_value');
            $table->string('unit')->default('');
            $table->json('threshold')->nullable();
            $table->text('message');
            $table->timestamp('occurred_at');
            $table->boolean('resolved')->default(false);
            $table->timestamps();
            $table->foreign('satellite_id')->references('id')->on('satellites')->onDelete('cascade');
            $table->index(['satellite_id', 'occurred_at']);
            $table->index(['severity', 'resolved']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('satellite_alerts');
    }
}
