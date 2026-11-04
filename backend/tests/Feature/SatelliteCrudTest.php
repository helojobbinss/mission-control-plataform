<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Satellite;
use App\Models\SatelliteAlert;
use App\Models\TelemetryReading;
use App\Models\User;
use App\Services\Integrations\CelesTrakService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class SatelliteCrudTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsRole(string $role): User
    {
        $roleModel = Role::firstOrCreate(
            ['name' => $role],
            ['description' => $role]
        );

        $user = User::factory()->create(['role_id' => $roleModel->id]);

        Sanctum::actingAs($user);

        return $user;
    }

    private function manualPayload(array $overrides = []): array
    {
        return array_merge([
            'source' => 'manual',
            'name' => 'Aurora-1',
            'description' => 'Satélite de teste',
            'orbit' => [
                'altitude_km' => 550,
                'inclination_deg' => 53,
                'raan_deg' => 10,
                'initial_anomaly_deg' => 90,
            ],
        ], $overrides);
    }

    private function mockCelesTrak(?array $records, bool $fail = false): void
    {
        $mock = Mockery::mock(CelesTrakService::class);

        $expectation = $mock->shouldReceive('getSatelliteByNoradId');

        if ($fail) {
            $expectation->andThrow(new RuntimeException('indisponível'));
        } else {
            $expectation->andReturn($records);
        }

        $this->app->instance(CelesTrakService::class, $mock);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/satellites')->assertStatus(401);
        $this->postJson('/api/satellites', [])->assertStatus(401);
    }

    public function test_operator_can_create_manual_satellite(): void
    {
        $this->actingAsRole('operador');

        $response = $this->postJson('/api/satellites', $this->manualPayload());

        $response->assertStatus(201)
            ->assertJsonPath('satellite.source', 'manual')
            ->assertJsonPath('satellite.norad_id', null)
            ->assertJsonPath('satellite.status', 'active')
            ->assertJsonPath('satellite.orbit.altitude_km', 550)
            ->assertJsonPath('satellite.orbit.initial_anomaly_deg', 90);

        $this->assertNotNull(Satellite::first()->orbit_epoch);
    }

    public function test_manual_satellite_requires_name_and_orbit(): void
    {
        $this->actingAsRole('operador');

        $this->postJson('/api/satellites', ['source' => 'manual'])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'name',
                'orbit',
                'orbit.altitude_km',
                'orbit.inclination_deg',
            ]);
    }

    public function test_manual_orbit_limits_are_validated(): void
    {
        $this->actingAsRole('operador');

        $payload = $this->manualPayload();
        $payload['orbit']['altitude_km'] = 50;
        $payload['orbit']['inclination_deg'] = 200;

        $this->postJson('/api/satellites', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'orbit.altitude_km',
                'orbit.inclination_deg',
            ]);
    }

    public function test_celestrak_satellite_gets_name_from_celestrak(): void
    {
        $this->actingAsRole('gerente');
        $this->mockCelesTrak([
            ['OBJECT_NAME' => 'ISS (ZARYA)', 'OBJECT_ID' => '1998-067A'],
        ]);

        $this->postJson('/api/satellites', [
            'source' => 'celestrak',
            'norad_id' => 25544,
        ])
            ->assertStatus(201)
            ->assertJsonPath('satellite.name', 'ISS (ZARYA)')
            ->assertJsonPath('satellite.international_designator', '1998-067A')
            ->assertJsonPath('satellite.orbit', null);
    }

    public function test_celestrak_satellite_requires_norad_and_rejects_orbit(): void
    {
        $this->actingAsRole('gerente');

        $this->postJson('/api/satellites', ['source' => 'celestrak'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['norad_id']);

        $this->postJson('/api/satellites', [
            'source' => 'celestrak',
            'norad_id' => 25544,
            'orbit' => ['altitude_km' => 500, 'inclination_deg' => 10],
        ])->assertStatus(422)->assertJsonValidationErrors(['orbit']);
    }

    public function test_duplicate_norad_is_rejected(): void
    {
        $this->actingAsRole('gerente');
        Satellite::create(['norad_id' => 25544, 'name' => 'ISS']);

        $this->postJson('/api/satellites', [
            'source' => 'celestrak',
            'norad_id' => 25544,
        ])->assertStatus(422)->assertJsonValidationErrors(['norad_id']);
    }

    public function test_celestrak_failure_without_name_returns_502_but_name_allows_save(): void
    {
        $this->actingAsRole('gerente');
        $this->mockCelesTrak(null, true);

        $this->postJson('/api/satellites', [
            'source' => 'celestrak',
            'norad_id' => 25544,
        ])->assertStatus(502);

        $this->assertSame(0, Satellite::count());

        $this->postJson('/api/satellites', [
            'source' => 'celestrak',
            'norad_id' => 25544,
            'name' => 'ISS',
        ])->assertStatus(201)->assertJsonPath('satellite.name', 'ISS');
    }

    public function test_analyst_cannot_write_and_operator_cannot_delete(): void
    {
        $satellite = Satellite::create([
            'source' => 'manual',
            'name' => 'X',
            'orbit_altitude_km' => 500,
            'orbit_inclination_deg' => 30,
        ]);

        $this->actingAsRole('analista_dados');
        $this->postJson('/api/satellites', $this->manualPayload())->assertStatus(403);
        $this->putJson("/api/satellites/{$satellite->id}", ['name' => 'Y'])->assertStatus(403);
        $this->deleteJson("/api/satellites/{$satellite->id}")->assertStatus(403);
        $this->getJson("/api/satellites/{$satellite->id}")->assertOk();

        $this->actingAsRole('operador');
        $this->deleteJson("/api/satellites/{$satellite->id}")->assertStatus(403);

        $this->assertDatabaseHas('satellites', ['id' => $satellite->id]);
    }

    public function test_user_without_role_cannot_write(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/satellites', $this->manualPayload())->assertStatus(403);
    }

    public function test_update_manual_satellite_changes_orbit_and_resets_epoch(): void
    {
        $this->actingAsRole('operador');

        $id = $this->postJson('/api/satellites', $this->manualPayload())
            ->json('satellite.id');

        Satellite::whereKey($id)->update(['orbit_epoch' => '2020-01-01 00:00:00']);

        $this->patchJson("/api/satellites/{$id}", [
            'name' => 'Aurora-2',
            'status' => 'inactive',
            'orbit' => ['altitude_km' => 700],
        ])
            ->assertOk()
            ->assertJsonPath('satellite.name', 'Aurora-2')
            ->assertJsonPath('satellite.status', 'inactive')
            ->assertJsonPath('satellite.orbit.altitude_km', 700)
            // Campos não enviados são preservados.
            ->assertJsonPath('satellite.orbit.inclination_deg', 53);

        $this->assertTrue(Satellite::find($id)->orbit_epoch->year >= 2026);
    }

    public function test_update_rejects_identity_changes_and_invalid_values(): void
    {
        $this->actingAsRole('gerente');

        $celestrak = Satellite::create(['norad_id' => 25544, 'name' => 'ISS']);

        $this->putJson("/api/satellites/{$celestrak->id}", [
            'norad_id' => 1,
            'source' => 'manual',
            'status' => 'exploded',
            'orbit' => ['altitude_km' => 500],
        ])->assertStatus(422)->assertJsonValidationErrors([
            'norad_id', 'source', 'status', 'orbit',
        ]);

        $this->putJson("/api/satellites/{$celestrak->id}", ['name' => 'ISS (ZARYA)'])
            ->assertOk()
            ->assertJsonPath('satellite.name', 'ISS (ZARYA)');
    }

    public function test_manager_deletes_satellite_with_history(): void
    {
        $this->actingAsRole('gerente');

        $satellite = Satellite::create(['norad_id' => 25544, 'name' => 'ISS']);

        TelemetryReading::create([
            'satellite_id' => $satellite->id,
            'readings' => ['battery_level' => ['value' => 50]],
            'recorded_at' => now(),
        ]);

        SatelliteAlert::create([
            'satellite_id' => $satellite->id,
            'code' => 'LOW_BATTERY',
            'parameter' => 'battery_level',
            'severity' => 'high',
            'measured_value' => 10,
            'message' => 'baixa',
            'occurred_at' => now(),
        ]);

        $this->deleteJson("/api/satellites/{$satellite->id}")->assertOk();

        $this->assertDatabaseMissing('satellites', ['id' => $satellite->id]);
        $this->assertSame(0, TelemetryReading::count());
        $this->assertSame(0, SatelliteAlert::count());

        $this->deleteJson("/api/satellites/{$satellite->id}")->assertStatus(404);
    }

    public function test_index_filters_and_show(): void
    {
        $this->actingAsRole('analista_dados');

        Satellite::create(['norad_id' => 25544, 'name' => 'ISS (ZARYA)']);
        $manual = Satellite::create([
            'source' => 'manual',
            'name' => 'Aurora-1',
            'status' => 'inactive',
            'orbit_altitude_km' => 500,
            'orbit_inclination_deg' => 30,
        ]);

        SatelliteAlert::create([
            'satellite_id' => $manual->id,
            'code' => 'LOW_BATTERY',
            'parameter' => 'battery_level',
            'severity' => 'high',
            'measured_value' => 10,
            'message' => 'baixa',
            'occurred_at' => now(),
        ]);

        $this->getJson('/api/satellites')->assertOk()->assertJsonPath('total', 2);
        $this->getJson('/api/satellites?source=manual')->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.name', 'Aurora-1')
            ->assertJsonPath('data.0.open_alerts_count', 1);
        $this->getJson('/api/satellites?search=zarya')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/satellites?status=inactive')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/satellites?status=foo')->assertStatus(422);

        $this->getJson("/api/satellites/{$manual->id}")->assertOk()
            ->assertJsonPath('orbit.altitude_km', 500)
            ->assertJsonPath('latest_reading', null);
        $this->getJson('/api/satellites/9999')->assertStatus(404);
    }
}
