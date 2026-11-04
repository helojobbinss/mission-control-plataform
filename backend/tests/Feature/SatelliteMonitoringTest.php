<?php

namespace Tests\Feature;

use App\Models\Satellite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SatelliteMonitoringTest extends TestCase
{
    use RefreshDatabase;

    private const PYTHON = 'http://127.0.0.1:8001/api/v1';

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->create());
    }

    private function manualSatellite(array $overrides = []): Satellite
    {
        return Satellite::create(array_merge([
            'source' => 'manual',
            'name' => 'Aurora-1',
            'orbit_altitude_km' => 550,
            'orbit_inclination_deg' => 53,
            'orbit_raan_deg' => 10,
            'orbit_initial_anomaly_deg' => 90,
            'orbit_epoch' => '2026-11-01 12:00:00',
        ], $overrides));
    }

    private function position(): array
    {
        return [
            'latitude' => -12.5,
            'longitude' => 40.1,
            'altitude_km' => 551.2,
            'orbital_speed_km_s' => 7.59,
        ];
    }

    private function telemetryPayload(int $id): array
    {
        return [
            'satellite_id' => $id,
            'simulated' => true,
            'timestamp' => '2026-11-03T12:00:00Z',
            'sensors' => [
                'battery_level' => ['value' => 12.0, 'unit' => '%', 'status' => 'warning'],
            ],
            'total_alerts' => 1,
            'alerts' => [[
                'code' => 'LOW_BATTERY',
                'satellite_id' => $id,
                'parameter' => 'battery_level',
                'severity' => 'high',
                'measured_value' => 12.0,
                'unit' => '%',
                'threshold' => 20.0,
                'message' => 'Bateria baixa.',
                'timestamp' => '2026-11-03T12:00:00Z',
            ]],
        ];
    }

    public function test_manual_position_uses_simulation_endpoint(): void
    {
        Http::fake([
            self::PYTHON . '/orbits/simulate' => Http::response([
                'source' => 'simulation',
                'simulated' => true,
                'orbital_position' => $this->position(),
            ]),
        ]);

        $satellite = $this->manualSatellite();

        $this->getJson("/api/satellites/{$satellite->id}/monitoring/position")
            ->assertOk()
            ->assertJsonPath('simulated', true)
            ->assertJsonPath('satellite.id', $satellite->id)
            ->assertJsonPath('satellite.source', 'manual')
            ->assertJsonPath('orbital_position.latitude', -12.5);

        Http::assertSent(function ($request) {
            $body = $request->data();

            return $request->method() === 'POST'
                && $request->url() === self::PYTHON . '/orbits/simulate'
                && $body['altitude_km'] == 550
                && $body['inclination_deg'] == 53
                && $body['raan_deg'] == 10
                && $body['initial_anomaly_deg'] == 90
                && str_starts_with($body['epoch'], '2026-11-01T12:00:00');
        });
    }

    public function test_celestrak_position_uses_norad_endpoint(): void
    {
        Http::fake([
            self::PYTHON . '/orbits/25544/position' => Http::response([
                'satellite' => ['norad_id' => 25544, 'name' => 'ISS (ZARYA)', 'orbital_epoch' => 'x'],
                'source' => 'CelesTrak',
                'simulated' => false,
                'orbital_position' => $this->position(),
            ]),
        ]);

        $satellite = Satellite::create(['norad_id' => 25544, 'name' => 'ISS (ZARYA)']);

        $this->getJson("/api/satellites/{$satellite->id}/monitoring/position")
            ->assertOk()
            ->assertJsonPath('simulated', false)
            ->assertJsonPath('source', 'CelesTrak')
            ->assertJsonPath('satellite.orbital_epoch', 'x')
            ->assertJsonPath('satellite.id', $satellite->id);
    }

    public function test_position_propagates_python_errors(): void
    {
        $satellite = Satellite::create(['norad_id' => 99999, 'name' => 'Nada']);

        Http::fake([
            '*' => Http::sequence()
                ->push(['detail' => 'Nenhum dado orbital encontrado para o NORAD 99999.'], 404)
                ->push('boom', 500),
        ]);

        $this->getJson("/api/satellites/{$satellite->id}/monitoring/position")
            ->assertStatus(404)
            ->assertJsonPath('message', 'Nenhum dado orbital encontrado para o NORAD 99999.');

        $this->getJson("/api/satellites/{$satellite->id}/monitoring/position")
            ->assertStatus(502);
    }

    public function test_position_returns_503_when_python_is_down(): void
    {
        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('down'));

        $satellite = $this->manualSatellite();

        $this->getJson("/api/satellites/{$satellite->id}/monitoring/position")
            ->assertStatus(503);
    }

    public function test_manual_telemetry_returns_position_and_persists_everything(): void
    {
        $satellite = $this->manualSatellite();

        Http::fake([
            self::PYTHON . "/satellites/{$satellite->id}/telemetry" =>
                Http::response($this->telemetryPayload($satellite->id)),
            self::PYTHON . '/orbits/simulate' => Http::response([
                'simulated' => true,
                'orbital_position' => $this->position(),
            ]),
        ]);

        $this->getJson("/api/satellites/{$satellite->id}/monitoring/telemetry")
            ->assertOk()
            ->assertJsonPath('satellite_id', $satellite->id)
            ->assertJsonPath('orbital_position.longitude', 40.1)
            ->assertJsonPath('alerts.0.code', 'LOW_BATTERY');

        $reading = $satellite->telemetryReadings()->first();
        $this->assertSame(40.1, $reading->orbital_position['longitude']);
        $this->assertSame(12, (int) $reading->readings['battery_level']['value']);

        $this->assertDatabaseHas('satellite_alerts', [
            'satellite_id' => $satellite->id,
            'code' => 'LOW_BATTERY',
            'resolved' => false,
        ]);

        // A posição é calculada no instante da leitura.
        Http::assertSent(fn ($r) => str_ends_with($r->url(), '/orbits/simulate')
            && str_starts_with($r->data()['calculation_time'], '2026-11-03T12:00:00'));
    }

    public function test_telemetry_is_kept_when_position_fails(): void
    {
        $satellite = $this->manualSatellite();

        Http::fake([
            self::PYTHON . "/satellites/{$satellite->id}/telemetry" =>
                Http::response($this->telemetryPayload($satellite->id)),
            self::PYTHON . '/orbits/simulate' => Http::response('erro', 500),
        ]);

        $this->getJson("/api/satellites/{$satellite->id}/monitoring/telemetry")
            ->assertOk()
            ->assertJsonPath('orbital_position', null);

        $this->assertSame(1, $satellite->telemetryReadings()->count());
        $this->assertNull($satellite->telemetryReadings()->first()->orbital_position);
    }

    public function test_telemetry_python_failures(): void
    {
        $satellite = $this->manualSatellite();

        Http::fake(['*' => Http::response('erro', 500)]);
        $this->getJson("/api/satellites/{$satellite->id}/monitoring/telemetry")->assertStatus(502);

        Http::fake(['*' => Http::response(['foo' => 'bar'])]);
        $this->getJson("/api/satellites/{$satellite->id}/monitoring/telemetry")->assertStatus(502);

        $this->assertSame(0, $satellite->telemetryReadings()->count());
    }

    public function test_sensors_for_manual_satellite(): void
    {
        $satellite = $this->manualSatellite();

        Http::fake([
            self::PYTHON . "/satellites/{$satellite->id}/sensors" => Http::response([
                'satellite_id' => $satellite->id,
                'simulated' => true,
                'sensors' => ['voltage' => ['value' => 28, 'unit' => 'V', 'status' => 'normal']],
            ]),
        ]);

        $this->getJson("/api/satellites/{$satellite->id}/monitoring/sensors")
            ->assertOk()
            ->assertJsonPath('sensors.voltage.value', 28);
    }

    public function test_positions_of_active_satellites_isolates_failures(): void
    {
        $manual = $this->manualSatellite();
        $real = Satellite::create(['norad_id' => 25544, 'name' => 'ISS']);
        $this->manualSatellite(['name' => 'Inativo', 'status' => 'inactive']);

        Http::fake([
            self::PYTHON . '/orbits/simulate' => Http::response([
                'simulated' => true,
                'orbital_position' => $this->position(),
            ]),
            self::PYTHON . '/orbits/25544/position' => Http::response('erro', 500),
        ]);

        $response = $this->getJson('/api/satellites/positions')->assertOk();

        $response->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $manual->id)
            ->assertJsonPath('data.0.orbital_position.latitude', -12.5)
            ->assertJsonPath('data.1.id', $real->id)
            ->assertJsonPath('data.1.orbital_position', null);

        $this->assertNotEmpty($response->json('data.1.error'));
    }

    public function test_unknown_satellite_returns_404(): void
    {
        $this->getJson('/api/satellites/999/monitoring/telemetry')->assertStatus(404);
    }
}
