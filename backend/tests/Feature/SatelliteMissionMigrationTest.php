<?php

namespace Tests\Feature;

use App\Models\Satellite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SatelliteMissionMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_link_migration_reuses_and_preserves_the_satellite_catalog(): void
    {
        $satellite = Satellite::create(['name' => 'Existing', 'norad_id' => 25544]);
        $migration = require database_path('migrations/2026_11_05_000006_create_satellites_and_link_missions.php');
        $migration->down();
        $this->assertTrue(Schema::hasTable('satellites'));
        $this->assertDatabaseHas('satellites', ['id' => $satellite->id, 'name' => 'Existing']);
        $migration->up();
        $this->assertTrue(Schema::hasColumn('missions', 'satellite_id'));
        $this->assertDatabaseHas('satellites', ['id' => $satellite->id, 'name' => 'Existing']);
    }
}
