
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateServiceOrdersTable extends Migration
{
    public function up()
    {
        Schema::create('service_orders', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->text('description');

            $table->string('type');
            $table->string('status')->default('open');

            $table->foreignId('operator_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('mission_id')
                ->constrained('missions')
                ->restrictOnDelete();

            $table->foreignId('satellite_id')
                ->constrained('satellites')
                ->restrictOnDelete();

            $table->foreignId('alert_id')
                ->nullable()
                ->constrained('satellite_alerts')
                ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down()
    {
        Schema::dropIfExists('service_orders');
    }
}
