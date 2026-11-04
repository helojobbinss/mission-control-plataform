<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddManagementFieldsToSatellitesTable extends Migration
{
    public function up()
    {
        // Satélites cadastrados manualmente podem não ter número NORAD.
        // (Em bancos novos a migration de criação já define a coluna como
        // nullable; este ajuste cobre bancos já migrados.)
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement(
                'ALTER TABLE satellites MODIFY norad_id BIGINT UNSIGNED NULL'
            );
        }

        Schema::table('satellites', function (Blueprint $table) {
            // celestrak = dados orbitais reais; manual = órbita simulada.
            $table->string('source', 20)->default('celestrak')->after('international_designator');
            $table->string('status', 20)->default('active')->after('source');
            $table->text('description')->nullable()->after('status');
            $table->date('launch_date')->nullable()->after('description');

            // Parâmetros da órbita circular simulada (somente satélites manuais).
            $table->decimal('orbit_altitude_km', 9, 2)->nullable();
            $table->decimal('orbit_inclination_deg', 7, 3)->nullable();
            $table->decimal('orbit_raan_deg', 7, 3)->nullable();
            $table->decimal('orbit_initial_anomaly_deg', 7, 3)->nullable();
            $table->timestamp('orbit_epoch')->nullable();

            $table->index(['source', 'status']);
        });

        Schema::table('telemetry_readings', function (Blueprint $table) {
            // Posição (lat/lon/alt/velocidade) no instante da leitura.
            $table->json('orbital_position')->nullable()->after('readings');
        });
    }

    public function down()
    {
        Schema::table('telemetry_readings', function (Blueprint $table) {
            $table->dropColumn('orbital_position');
        });

        Schema::table('satellites', function (Blueprint $table) {
            $table->dropIndex(['source', 'status']);
            $table->dropColumn([
                'source',
                'status',
                'description',
                'launch_date',
                'orbit_altitude_km',
                'orbit_inclination_deg',
                'orbit_raan_deg',
                'orbit_initial_anomaly_deg',
                'orbit_epoch',
            ]);
        });
    }
}
