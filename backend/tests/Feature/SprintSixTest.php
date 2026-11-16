<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Satellite;
use App\Models\User;
use App\Services\TelemetryRecorder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SprintSixTest extends TestCase
{
    use RefreshDatabase;

    private function operator(): void
    {
        $role = Role::firstOrCreate(['name' => 'operador']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
    }

    public static function altitudeLimits(): array
    {
        return [[159.99, 422], [160, 201], [40000, 201], [40000.01, 422]];
    }

    // CT-001: limites definidos em SatelliteController::store.
    #[DataProvider('altitudeLimits')]
    public function test_ct001_altitude_limits(float $altitude, int $status): void
    {
        $this->operator();
        $this->postJson('/api/satellites', [
            'source' => 'manual', 'name' => 'QA fictício',
            'orbit' => ['altitude_km' => $altitude, 'inclination_deg' => 0],
        ])->assertStatus($status);
        $this->assertDatabaseCount('satellites', $status === 201 ? 1 : 0);
    }

    public static function paginationLimits(): array
    {
        return [[0, 422], [1, 200], [100, 200], [101, 422]];
    }

    // CT-002: limites definidos em SatelliteController::index.
    #[DataProvider('paginationLimits')]
    public function test_ct002_pagination_limits(int $size, int $status): void
    {
        $this->operator();
        $this->getJson('/api/satellites?per_page='.$size)->assertStatus($status);
    }

    // CT-003: binding de registros inexistentes, sem chamadas externas.
    public function test_ct003_missing_records_return_404(): void
    {
        $this->operator();
        foreach (['satellites/999999', 'missions/999999', 'service-orders/999999'] as $path) {
            $this->getJson('/api/'.$path)->assertNotFound();
        }
    }

    // CT-004: uma operação em lote inválida não pode persistir parcialmente.
    public function test_ct004_invalid_bulk_is_atomic(): void
    {
        $this->operator();
        $satellite = Satellite::create(['name' => 'QA', 'norad_id' => 5]);
        $mission = $satellite->missions()->create(['name' => 'QA', 'status' => 'Agendada']);
        $this->postJson('/api/missions/bulk', [
            'ids' => [$mission->id, 999999], 'action' => 'operator', 'value' => 'QA alterado',
        ])->assertUnprocessable();
        $this->assertNull($mission->fresh()->operator_name);
    }

    // CT-005: dois eixos podem produzir HIGH_ANGULAR_VELOCITY na mesma leitura.
    // Requisito de integridade proposto pela auditoria; não é aceite formal da equipe.
    public function test_ct005_alerts_with_same_code_preserve_each_parameter(): void
    {
        $satellite = Satellite::create(['name' => 'QA', 'norad_id' => 5]);
        $alerts = array_map(fn ($axis) => [
            'code' => 'HIGH_ANGULAR_VELOCITY', 'parameter' => 'gyroscope_'.$axis,
            'severity' => 'medium', 'measured_value' => 4.9, 'unit' => '°/s',
            'threshold' => 4.5, 'message' => 'Alerta fictício '.$axis,
        ], ['x', 'y']);
        DB::transaction(fn () => app(TelemetryRecorder::class)->record($satellite, [
            'sensors' => [], 'simulated' => true,
            'timestamp' => '2026-01-01T00:00:00Z', 'alerts' => $alerts,
        ]));
        $this->assertSame(['gyroscope_x', 'gyroscope_y'],
            $satellite->alerts()->where('resolved', false)->orderBy('parameter')->pluck('parameter')->all());
    }
}
