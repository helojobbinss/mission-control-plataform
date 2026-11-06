<?php

namespace Tests\Feature;

use App\Models\Satellite;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SatelliteTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_and_required_mission_relationship(): void
    {
        Http::fake(['celestrak.org/*' => Http::response([['NORAD_CAT_ID' => 25544, 'OBJECT_NAME' => 'ISS (ZARYA)']])]);
        $satellite = $this->postJson('/api/satellites/import', ['norad_id' => 25544])->assertCreated()->json('id');
        $this->postJson('/api/satellites/import', ['norad_id' => 25544])->assertOk()->assertJsonPath('id', $satellite);
        $this->assertSame(1, Satellite::count());
        $this->postJson('/api/missions', ['name' => 'Sem satélite', 'status' => 'Agendada'])->assertUnprocessable()->assertJsonValidationErrors('satellite_id');
        $this->postJson('/api/missions', ['name' => 'Inválido', 'status' => 'Agendada', 'satellite_id' => 999])->assertUnprocessable();
        foreach (['Primeira', 'Segunda'] as $name) {
            $this->postJson('/api/missions', ['name' => $name, 'status' => 'Agendada', 'satellite_id' => $satellite])->assertCreated();
        }
        $this->assertCount(2, Satellite::findOrFail($satellite)->missions);
        $this->getJson('/api/satellites')->assertOk()->assertJsonCount(2, '0.missions')->assertJsonPath('0.missions.0.name', 'Primeira');
        $this->getJson('/api/missions')->assertJsonFragment(['norad_id' => 25544]);
    }

    public function test_source_failure_does_not_create_satellite(): void
    {
        Http::fake(['celestrak.org/*' => Http::response('unavailable', 503)]);
        $this->postJson('/api/satellites/import', ['norad_id' => 12345])->assertStatus(503);
        $this->assertSame(0, Satellite::count());
    }

    public function test_search_returns_matches_without_storing_them(): void
    {
        Http::fake(['celestrak.org/*' => Http::response([
            ['NORAD_CAT_ID' => 25544, 'OBJECT_NAME' => 'ISS (ZARYA)'],
            ['NORAD_CAT_ID' => 12345, 'OBJECT_NAME' => 'ISS TEST'],
        ])]);
        $this->getJson('/api/satellites/search?name=ISS')->assertOk()->assertJsonCount(2, 'data')->assertJsonFragment(['name' => 'ISS (ZARYA)', 'norad_id' => 25544]);
        $this->assertSame(0, Satellite::count());
        $this->getJson('/api/satellites/search?name=IS')->assertUnprocessable();
    }

    public function test_search_handles_missing_results(): void
    {
        Http::fake(['celestrak.org/*' => Http::response('Not found', 404)]);
        $this->getJson('/api/satellites/search?name=UNKNOWN')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_search_handles_source_errors(): void
    {
        Http::fake(['celestrak.org/*' => Http::response('Unavailable', 503)]);
        $this->getJson('/api/satellites/search?name=OTHER')->assertStatus(503);
    }

    public function test_orbital_data_is_returned_for_registered_satellite(): void
    {
        $satellite = Satellite::create(['norad_id' => 25544, 'name' => 'ISS']);
        Http::fake(['celestrak.org/*' => Http::response([['NORAD_CAT_ID' => 25544, 'OBJECT_NAME' => 'ISS', 'EPOCH' => '2026-11-04T21:15:15.204960']])]);
        $this->getJson('/api/satellites/'.$satellite->id.'/orbit')->assertOk()->assertJsonPath('source', 'CelesTrak')->assertJsonPath('elements.NORAD_CAT_ID', 25544)->assertJsonStructure(['retrieved_at']);
    }

    public function test_orbital_data_rejects_mismatched_satellite(): void
    {
        $satellite = Satellite::create(['norad_id' => 25544, 'name' => 'ISS']);
        Http::fake(['celestrak.org/*' => Http::response([['NORAD_CAT_ID' => 99, 'OBJECT_NAME' => 'Other', 'EPOCH' => '2026-11-04T21:15:15']])]);
        $this->getJson('/api/satellites/'.$satellite->id.'/orbit')->assertStatus(503);
    }
}
