<?php

namespace Tests\Feature;

use App\Models\Satellite;
use App\Models\TelemetryReading;
use App\Models\User;
use App\Services\Integrations\CelesTrakService;
use App\Services\Integrations\PythonApiService;
use GuzzleHttp\Psr7\Response as GuzzleResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class SatelliteTelemetryControllerTest extends TestCase
{
    use RefreshDatabase;

    private const NORAD_ID = 25544;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->create());
    }

    /**
     * Monta o payload padrão retornado pela API Python.
     */
    private function telemetryPayload(array $overrides = []): array
    {
        return array_merge([
            'satellite_id' => self::NORAD_ID,
            'simulated' => true,
            'timestamp' => '2026-11-01T21:16:43.356383Z',
            'sensors' => [
                'internal_temperature' => [
                    'value' => 33.25,
                    'unit' => '°C',
                    'status' => 'normal',
                ],
                'voltage' => [
                    'value' => 28.95,
                    'unit' => 'V',
                    'status' => 'normal',
                ],
            ],
            'total_alerts' => 1,
            'alerts' => [
                [
                    'code' => 'ORIENTATION_DEVIATION',
                    'satellite_id' => self::NORAD_ID,
                    'parameter' => 'pitch',
                    'severity' => 'medium',
                    'measured_value' => 76.83,
                    'unit' => '°',
                    'threshold' => 45.0,
                    'message' => 'O ângulo de pitch ultrapassou o limite.',
                    'timestamp' => '2026-11-01T21:16:43.356383Z',
                ],
            ],
        ], $overrides);
    }

    /**
     * Cria uma resposta HTTP compatível com Illuminate\Http\Client\Response.
     */
    private function createHttpResponse(
        string $body,
        int $status = 200
    ): Response {
        $guzzleResponse = new GuzzleResponse(
            $status,
            [
                'Content-Type' => 'application/json',
            ],
            $body
        );

        return new Response($guzzleResponse);
    }

    /**
     * Configura o mock da API Python.
     */
private function mockPythonResponse(
    array $payload,
    int $status = 200
): void {
    $response = $this->createHttpResponse(
        json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        ),
        $status
    );

    $pythonApi = Mockery::mock(PythonApiService::class);

    $pythonApi
        ->shouldReceive('getSatelliteTelemetry')
        ->with(self::NORAD_ID)
        ->andReturn($response);

    $this->app->instance(
        PythonApiService::class,
        $pythonApi
    );
}

    /**
     * Configura o mock do serviço CelesTrak.
     */
    private function mockCelesTrak(
        ?array $payload = null
    ): void {
        $celesTrak = Mockery::mock(CelesTrakService::class);

        $celesTrak
            ->shouldReceive('getSatelliteByNoradId')
            ->once()
            ->with((string) self::NORAD_ID)
            ->andReturn($payload ?? [
                [
                    'OBJECT_NAME' => 'ISS (ZARYA)',
                    'OBJECT_ID' => '1998-067A',
                    'NORAD_CAT_ID' => self::NORAD_ID,
                ],
            ]);

        $this->app->instance(
            CelesTrakService::class,
            $celesTrak
        );
    }

    /**
     * Verifica o retorno da telemetria e a persistência dos dados.
     */
    public function test_it_returns_telemetry_and_persists_satellite_reading_and_alert(): void
    {
        $payload = $this->telemetryPayload();

        $this->mockPythonResponse($payload);
        $this->mockCelesTrak();

        $response = $this->getJson(
            '/api/satellites/' . self::NORAD_ID . '/telemetry'
        );

        $response
            ->assertOk()
            ->assertJsonPath('satellite_id', self::NORAD_ID)
            ->assertJsonPath(
                'sensors.internal_temperature.value',
                33.25
            )
            ->assertJsonPath(
                'alerts.0.code',
                'ORIENTATION_DEVIATION'
            );

        $this->assertDatabaseHas('satellites', [
            'norad_id' => self::NORAD_ID,
            'name' => 'ISS (ZARYA)',
            'international_designator' => '1998-067A',
        ]);

        $satellite = Satellite::where(
            'norad_id',
            self::NORAD_ID
        )->firstOrFail();

        $this->assertDatabaseHas('telemetry_readings', [
            'satellite_id' => $satellite->id,
            'simulated' => 1,
        ]);

        $reading = TelemetryReading::where(
            'satellite_id',
            $satellite->id
        )->firstOrFail();

        $this->assertEquals(
            33.25,
            $reading->readings['internal_temperature']['value']
        );

        $this->assertDatabaseHas('satellite_alerts', [
            'satellite_id' => $satellite->id,
            'code' => 'ORIENTATION_DEVIATION',
            'resolved' => 0,
        ]);
    }

    /**
     * Verifica se novas consultas reutilizam o satélite existente.
     */
public function test_it_does_not_duplicate_satellite_when_telemetry_is_requested_again(): void
{
    $firstPayload = $this->telemetryPayload();

    $secondPayload = $this->telemetryPayload([
        'alerts' => [],
        'total_alerts' => 0,
    ]);

    $pythonApi = Mockery::mock(PythonApiService::class);

    $pythonApi
        ->shouldReceive('getSatelliteTelemetry')
        ->with(self::NORAD_ID)
        ->twice()
        ->andReturn(
            $this->createHttpResponse(
                json_encode(
                    $firstPayload,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                )
            ),
            $this->createHttpResponse(
                json_encode(
                    $secondPayload,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                )
            )
        );

    $this->app->instance(
        PythonApiService::class,
        $pythonApi
    );

    $this->mockCelesTrak();

    $this->getJson(
        '/api/satellites/' . self::NORAD_ID . '/telemetry'
    )->assertOk();

    $this->getJson(
        '/api/satellites/' . self::NORAD_ID . '/telemetry'
    )->assertOk();

    $this->assertSame(
        1,
        Satellite::where(
            'norad_id',
            self::NORAD_ID
        )->count()
    );

    $this->assertSame(
        2,
        TelemetryReading::count()
    );
}

    /**
     * Verifica se alertas ausentes na nova telemetria são resolvidos.
     */
public function test_it_marks_alert_as_resolved_when_it_is_no_longer_returned(): void
{
    $firstPayload = $this->telemetryPayload();

    $secondPayload = $this->telemetryPayload([
        'alerts' => [],
        'total_alerts' => 0,
    ]);

    $pythonApi = Mockery::mock(PythonApiService::class);

    $pythonApi
        ->shouldReceive('getSatelliteTelemetry')
        ->with(self::NORAD_ID)
        ->twice()
        ->andReturn(
            $this->createHttpResponse(
                json_encode(
                    $firstPayload,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                )
            ),
            $this->createHttpResponse(
                json_encode(
                    $secondPayload,
                    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                )
            )
        );

    $this->app->instance(
        PythonApiService::class,
        $pythonApi
    );

    $this->mockCelesTrak();

    $this->getJson(
        '/api/satellites/' . self::NORAD_ID . '/telemetry'
    )->assertOk();

    $satellite = Satellite::where(
        'norad_id',
        self::NORAD_ID
    )->firstOrFail();

    $this->assertDatabaseHas('satellite_alerts', [
        'satellite_id' => $satellite->id,
        'code' => 'ORIENTATION_DEVIATION',
        'resolved' => 0,
    ]);

    $this->getJson(
        '/api/satellites/' . self::NORAD_ID . '/telemetry'
    )->assertOk();

    $this->assertDatabaseHas('satellite_alerts', [
        'satellite_id' => $satellite->id,
        'code' => 'ORIENTATION_DEVIATION',
        'resolved' => 1,
    ]);

    $this->assertSame(
        2,
        TelemetryReading::where(
            'satellite_id',
            $satellite->id
        )->count()
    );
}

    /**
     * Verifica o tratamento de uma resposta inválida da API Python.
     */
    public function test_it_returns_bad_gateway_when_python_response_is_invalid(): void
    {
        $pythonApi = Mockery::mock(PythonApiService::class);

        $pythonApi
            ->shouldReceive('getSatelliteTelemetry')
            ->once()
            ->with(self::NORAD_ID)
            ->andReturn(
                $this->createHttpResponse(
                    'not-json',
                    200
                )
            );

        $this->app->instance(
            PythonApiService::class,
            $pythonApi
        );

        $response = $this->getJson(
            '/api/satellites/' . self::NORAD_ID . '/telemetry'
        );

        $response
            ->assertStatus(502)
            ->assertJson([
                'message' => 'Resposta inválida da API de telemetria.',
            ]);

        $this->assertDatabaseMissing('satellites', [
            'norad_id' => self::NORAD_ID,
        ]);

        $this->assertSame(
            0,
            TelemetryReading::count()
        );
    }

    /**
     * Verifica o tratamento de erros HTTP retornados pela API Python.
     */
    public function test_it_returns_bad_gateway_when_python_returns_http_error(): void
    {
        $this->mockPythonResponse(
            [
                'message' => 'Erro interno da API Python.',
            ],
            500
        );

        $response = $this->getJson(
            '/api/satellites/' . self::NORAD_ID . '/telemetry'
        );

        $response
            ->assertStatus(502)
            ->assertJson([
                'message' => 'Não foi possível obter a telemetria do satélite.',
            ]);

        $this->assertSame(
            0,
            TelemetryReading::count()
        );
    }

    /**
     * Verifica o tratamento de falhas de conexão com a API Python.
     */
    public function test_it_returns_service_unavailable_when_python_connection_fails(): void
    {
        $pythonApi = Mockery::mock(PythonApiService::class);

        $pythonApi
            ->shouldReceive('getSatelliteTelemetry')
            ->once()
            ->with(self::NORAD_ID)
            ->andThrow(
                new ConnectionException(
                    'Falha de conexão com a API Python.'
                )
            );

        $this->app->instance(
            PythonApiService::class,
            $pythonApi
        );

        $response = $this->getJson(
            '/api/satellites/' . self::NORAD_ID . '/telemetry'
        );

        $response
            ->assertStatus(503)
            ->assertJson([
                'message' => 'Não foi possível conectar à API Python.',
            ]);

        $this->assertSame(
            0,
            TelemetryReading::count()
        );
    }

    /**
     * Verifica se a telemetria é salva mesmo quando o CelesTrak falha.
     */
    public function test_it_continues_saving_telemetry_if_celestrak_fails(): void
    {
        $this->mockPythonResponse(
            $this->telemetryPayload()
        );

        $celesTrak = Mockery::mock(CelesTrakService::class);

        $celesTrak
            ->shouldReceive('getSatelliteByNoradId')
            ->once()
            ->with((string) self::NORAD_ID)
            ->andThrow(
                new \RuntimeException(
                    'Falha na consulta ao CelesTrak.'
                )
            );

        $this->app->instance(
            CelesTrakService::class,
            $celesTrak
        );

        $response = $this->getJson(
            '/api/satellites/' . self::NORAD_ID . '/telemetry'
        );

        $response->assertOk();

        $this->assertDatabaseHas('satellites', [
            'norad_id' => self::NORAD_ID,
        ]);

        $satelliteId = Satellite::where(
            'norad_id',
            self::NORAD_ID
        )->value('id');

        $this->assertDatabaseHas('telemetry_readings', [
            'satellite_id' => $satelliteId,
        ]);
    }
}