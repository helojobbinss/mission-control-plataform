<?php

namespace Tests\Feature;

use App\Models\{Satellite, User, Role};
use App\Services\MonitoringLimits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MonitoringLimitsTest extends TestCase
{
    use RefreshDatabase;

    private function satellite(): Satellite
    {
        return Satellite::create(['name' => 'Teste', 'source' => 'manual', 'orbit_altitude_km' => 550, 'orbit_inclination_deg' => 53, 'orbit_epoch' => now()]);
    }
    private function user(string $role = 'operador'): void
    {
        $profile = Role::firstOrCreate(['name' => $role]);
        Sanctum::actingAs(User::factory()->create(['role_id' => $profile->id, 'is_active' => true]));
    }
    private function url(Satellite $satellite): string
    {
        return '/api/satellites/'.$satellite->id.'/monitoring/limits';
    }
    public function test_ct001_defaults_and_missing_satellite(): void
    {
        $this->user();
        $sat = $this->satellite();
        $this->getJson($this->url($sat))->assertOk()->assertJsonPath('internal_temperature.max', 40)->assertJsonPath('battery_level.min', 20);
        $this->assertNull($sat->fresh()->monitoring_limits);
        $this->getJson('/api/satellites/99999/monitoring/limits')->assertNotFound();
    }
    public function test_ct002_ct004_ct006_save_reload_and_independence(): void
    {
        $this->user();
        $a = $this->satellite(); $b = $this->satellite();
        $limits = MonitoringLimits::DEFAULTS;
        $limits['internal_temperature']['max'] = 75;
        $this->putJson($this->url($a), ['limits' => $limits])->assertOk();
        $this->getJson($this->url($a))->assertJsonPath('internal_temperature.max', 75);
        $this->assertEquals(75, $a->fresh()->monitoring_limits['internal_temperature']['max']);
        $this->getJson($this->url($b))->assertJsonPath('internal_temperature.max', 40);
    }
    public function test_ct003_invalid_limits_are_atomic(): void
    {
        $this->user(); $sat = $this->satellite();
        foreach ([['battery_level', 'min', 101], ['voltage', 'min', 40], ['internal_temperature', 'min', -274], ['internal_temperature', 'max', 'abc'], ['internal_temperature', 'critical_max', 30]] as [$sensor, $bound, $value]) {
            $limits = MonitoringLimits::DEFAULTS; $limits[$sensor][$bound] = $value;
            $this->putJson($this->url($sat), ['limits' => $limits])->assertUnprocessable();
            $this->assertNull($sat->fresh()->monitoring_limits);
        }
    }
    public function test_ct007_access_control(): void
    {
        $sat = $this->satellite();
        $this->getJson($this->url($sat))->assertUnauthorized();
        $this->putJson($this->url($sat), ['limits' => MonitoringLimits::DEFAULTS])->assertUnauthorized();
        $this->user('visitante');
        $this->getJson($this->url($sat))->assertOk();
        $this->putJson($this->url($sat), ['limits' => MonitoringLimits::DEFAULTS])->assertForbidden();
    }
    public function test_ct005_thresholds_change_same_reading_and_persist_classification(): void
    {
        $this->user(); $sat = $this->satellite();
        $payload = ['satellite_id' => $sat->id, 'simulated' => true, 'timestamp' => '2026-11-16T12:00:00Z', 'sensors' => ['internal_temperature' => ['value' => 72, 'unit' => '°C', 'status' => 'warning']], 'alerts' => [['code' => 'HIGH_INTERNAL_TEMPERATURE', 'parameter' => 'internal_temperature']]];
        Http::fake([
            '*/telemetry' => Http::response($payload),
            '*/orbits/simulate' => Http::response(['orbital_position' => ['latitude' => 1]]),
        ]);
        $limits = MonitoringLimits::DEFAULTS;
        $limits['internal_temperature']['max'] = 60;
        $limits['internal_temperature']['critical_max'] = 80;
        $telemetryUrl = '/api/satellites/'.$sat->id.'/monitoring/telemetry';
        foreach ([[60, 80, 'warning'], [75, 80, 'normal'], [60, 70, 'critical']] as [$max, $critical, $status]) {
            $limits['internal_temperature']['max'] = $max;
            $limits['internal_temperature']['critical_max'] = $critical;
            $this->putJson($this->url($sat), ['limits' => $limits])->assertOk();
            $response = $this->getJson($telemetryUrl)->assertOk()->assertJsonPath('sensors.internal_temperature.status', $status);
            $this->assertSame($status === 'normal' ? 0 : 1, count($response->json('alerts')));
            $this->assertSame($status, $sat->telemetryReadings()->orderByDesc('id')->first()->readings['internal_temperature']['status']);
        }
        $this->assertDatabaseHas('satellite_alerts', ['satellite_id' => $sat->id, 'severity' => 'critical', 'resolved' => false]);
    }
    public function test_ct008_unconfigured_satellite_preserves_legacy_payload(): void
    {
        $sat = $this->satellite();
        $payload = ['sensors' => [], 'alerts' => [['code' => 'COMMUNICATION_LOST']], 'timestamp' => 'x'];
        $this->assertSame($payload, app(MonitoringLimits::class)->apply($sat, $payload));
    }
    public function test_missing_unknown_and_inactive_inputs_are_rejected(): void
    {
        $this->user(); $sat = $this->satellite();
        $limits = MonitoringLimits::DEFAULTS;
        unset($limits['voltage']['min']);
        $this->putJson($this->url($sat), ['limits' => $limits])->assertUnprocessable();
        $this->putJson($this->url($sat), ['limits' => MonitoringLimits::DEFAULTS + ['invented_sensor' => []]])->assertUnprocessable();
        $this->putJson($this->url($sat), [])->assertUnprocessable();
        auth()->user()->update(['is_active' => false]);
        $this->putJson($this->url($sat), ['limits' => MonitoringLimits::DEFAULTS])->assertForbidden();
        $this->assertNull($sat->fresh()->monitoring_limits);
    }
    public function test_boundaries_and_unrelated_alerts_are_preserved(): void
    {
        $sat = $this->satellite();
        $sat->monitoring_limits = MonitoringLimits::DEFAULTS;
        $payload = ['timestamp' => '2026-11-16T12:00:00Z', 'sensors' => ['battery_level' => ['value' => 20, 'unit' => '%', 'status' => 'normal']], 'alerts' => [['code' => 'COMMUNICATION_LOST', 'parameter' => 'communication_status', 'severity' => 'critical']]];
        $data = app(MonitoringLimits::class)->apply($sat, $payload);
        $this->assertSame('normal', $data['sensors']['battery_level']['status']);
        $this->assertSame($payload['alerts'], $data['alerts']);
        $payload['sensors']['battery_level']['value'] = 19.99;
        $data = app(MonitoringLimits::class)->apply($sat, $payload);
        $this->assertSame('warning', $data['sensors']['battery_level']['status']);
        $this->assertCount(2, $data['alerts']);
    }
}
