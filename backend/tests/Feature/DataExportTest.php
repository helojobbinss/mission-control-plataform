<?php

namespace Tests\Feature;

use App\Models\Mission;
use App\Models\Satellite;
use App\Models\TelemetryReading;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DataExportTest extends TestCase
{
    use RefreshDatabase;

    private function authenticate(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Http::preventStrayRequests();
    }

    private function satellite(string $name = 'Satélite Áurea'): Satellite
    {
        return Satellite::create(['name' => $name, 'source' => 'manual', 'orbit_altitude_km' => 550]);
    }

    private function mission(Satellite $satellite): Mission
    {
        return Mission::create(['name' => 'Missão, "Órbita"', 'satellite_id' => $satellite->id, 'status' => 'Agendada', 'budget' => '1234.50']);
    }

    private function reading(Satellite $satellite, string $date = '2026-11-16 23:59:59'): TelemetryReading
    {
        return TelemetryReading::create([
            'satellite_id' => $satellite->id, 'recorded_at' => $date, 'simulated' => true,
            'readings' => ['temperature' => ['value' => -12.5, 'unit' => '°C', 'status' => 'normal'], 'battery' => ['value' => 80, 'unit' => '%', 'status' => 'normal']],
            'orbital_position' => ['latitude' => -23.5, 'longitude' => 40, 'altitude_km' => 550, 'orbital_speed_km_s' => 7.5],
        ]);
    }

    private function csv(array $params): array
    {
        $response = $this->getJson('/api/exports?'.http_build_query($params))->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('attachment;', $response->headers->get('content-disposition'));
        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);
        $stream = fopen('php://temp', 'r+');
        fwrite($stream, substr($content, 3));
        rewind($stream);
        $headers = fgetcsv($stream, 0, ',', '"', '');
        $rows = [];
        while (($row = fgetcsv($stream, 0, ',', '"', '')) !== false) {
            $this->assertCount(count($headers), $row);
            $rows[] = array_combine($headers, $row);
        }
        fclose($stream);
        return $rows;
    }

    public function test_ct_us01_001_exports_all_three_persisted_datasets(): void
    {
        $this->authenticate();
        $satellite = $this->satellite();
        $mission = $this->mission($satellite);
        $reading = $this->reading($satellite);
        $this->assertSame((string) $mission->id, $this->csv(['dataset' => 'missions'])[0]['id']);
        $this->assertSame($satellite->name, $this->csv(['dataset' => 'satellites'])[0]['name']);
        $rows = $this->csv(['dataset' => 'telemetry']);
        $this->assertCount(2, $rows);
        $this->assertSame((string) $reading->id, $rows[0]['id']);
        $this->assertSame('-12.5', $rows[0]['value']);
        $this->assertSame('°C', $rows[0]['unit']);
        $this->assertSame('1', $rows[0]['simulated']);
        $this->assertSame('-23.5', $rows[0]['latitude_deg']);
    }

    public function test_ct_us01_002_filters_dates_ids_and_mission_relationship(): void
    {
        $this->authenticate();
        $satellite = $this->satellite();
        $other = $this->satellite('Outro');
        $mission = $this->mission($satellite);
        $this->mission($other);
        $mission->created_at = '2026-11-16 00:00:00';
        $mission->save();
        $satellite->created_at = '2026-11-16 23:59:59';
        $satellite->save();
        $this->reading($satellite, '2026-11-15 23:59:59');
        $included = $this->reading($satellite);
        $this->reading($satellite, '2026-11-17 00:00:00');
        $this->reading($other);
        $range = ['start_date' => '2026-11-16', 'end_date' => '2026-11-16'];
        $rows = $this->csv(['dataset' => 'telemetry', 'satellite_id' => $satellite->id] + $range);
        $this->assertCount(2, $rows);
        $this->assertSame([(string) $included->id], array_values(array_unique(array_column($rows, 'id'))));
        $this->assertCount(1, $this->csv(['dataset' => 'missions', 'mission_id' => $mission->id, 'satellite_id' => $satellite->id] + $range));
        $this->assertCount(1, $this->csv(['dataset' => 'satellites', 'mission_id' => $mission->id] + $range));
        $this->assertCount(1, $this->csv(['dataset' => 'satellites', 'satellite_id' => $satellite->id, 'end_date' => '2026-11-16']));
    }

    public function test_ct_us01_003_empty_datasets_return_a_clear_message(): void
    {
        $this->authenticate();
        foreach (['missions', 'satellites', 'telemetry'] as $type) {
            $this->getJson('/api/exports?dataset='.$type)->assertNotFound()
                ->assertJsonPath('message', 'Nenhum registro encontrado para os filtros informados.');
        }
    }

    public static function invalidFilters(): array
    {
        return [
            [['dataset' => 'users'], 'dataset'],
            [['start_date' => '2026-02-30'], 'start_date'],
            [['end_date' => 'yesterday'], 'end_date'],
            [['start_date' => '2026-11-17', 'end_date' => '2026-11-16'], 'end_date'],
            [['satellite_id' => 99999], 'satellite_id'],
            [['mission_id' => 99999], 'mission_id'],
            [['dataset' => 'telemetry', 'mission_id' => 1], 'mission_id'],
            [['satellite_id' => [1]], 'satellite_id'],
        ];
    }

    #[DataProvider('invalidFilters')]
    public function test_ct_us01_004_validates_filters(array $params, string $field): void
    {
        $this->authenticate();
        $this->getJson('/api/exports?'.http_build_query($params + ['dataset' => 'missions']))
            ->assertUnprocessable()->assertJsonValidationErrors($field);
    }

    public function test_ct_us01_005_requires_authentication(): void
    {
        $this->getJson('/api/exports?dataset=missions')->assertUnauthorized();
        $this->withToken('invalid-token')->getJson('/api/exports?dataset=satellites')->assertUnauthorized();
    }

    public function test_ct_us01_006_preserves_all_records_and_does_not_call_upstream(): void
    {
        $this->authenticate();
        $satellite = $this->satellite();
        $this->mission($satellite);
        $this->reading($satellite);
        $snapshot = fn () => collect(['missions', 'satellites', 'telemetry_readings', 'satellite_alerts'])
            ->mapWithKeys(fn ($table) => [$table => DB::table($table)->orderBy('id')->get()->toJson()])->all();
        $before = $snapshot();
        foreach (['missions', 'satellites', 'telemetry'] as $type) {
            $this->csv(['dataset' => $type]);
        }
        $this->assertSame($before, $snapshot());
        if (getenv('US_VALIDATION_INTEGRITY')) {
            file_put_contents(getenv('US_VALIDATION_INTEGRITY'), json_encode(['before' => $before, 'after' => $snapshot(), 'equal' => $before === $snapshot()], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
        Http::assertNothingSent();
    }

    public function test_ct_us01_007_csv_round_trips_unicode_quotes_newlines_and_blocks_formulas(): void
    {
        $this->authenticate();
        $satellite = $this->satellite();
        $mission = $this->mission($satellite);
        $mission->update(['description' => "Linha 1, \"Órbita\"\nLinha 2", 'operator_name' => "  =HYPERLINK(\"x\")"]);
        $rows = $this->csv(['dataset' => 'missions']);
        $this->assertSame($mission->name, $rows[0]['name']);
        $this->assertSame($mission->description, $rows[0]['description']);
        $this->assertSame("'".$mission->operator_name, $rows[0]['operator_name']);
        $this->assertSame('1234.50', $rows[0]['budget']);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $rows[0]['created_at']);
        foreach (["+SUM(1,1)", '-cmd', '@SUM(A1)', "\ttext", "\rtext"] as $unsafe) {
            $satellite->update(['name' => $unsafe]);
            $this->assertSame("'".$unsafe, $this->csv(['dataset' => 'satellites'])[0]['name']);
        }
    }
}
