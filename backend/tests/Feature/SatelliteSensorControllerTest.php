<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SatelliteSensorControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_sensor_proxy_preserves_the_python_response(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Http::preventStrayRequests();
        Http::fake(['*' => Http::response(['satellite_id' => 25544, 'simulated' => true, 'sensors' => []])]);
        $this->getJson('/api/satellites/25544/sensors')->assertOk()
            ->assertJsonPath('satellite_id', 25544)->assertJsonPath('simulated', true);
        Http::assertSent(fn ($request) => $request->url() === 'http://127.0.0.1:8001/api/v1/satellites/25544/sensors');
    }

    public function test_sensor_proxy_handles_upstream_errors_and_invalid_payloads(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Http::fake(['*' => Http::sequence()->push(['detail' => 'Not found'], 404)->push('invalid', 200)]);
        $this->getJson('/api/satellites/25544/sensors')->assertNotFound()->assertJsonPath('detail', 'Not found');
        $this->getJson('/api/satellites/25544/sensors')->assertStatus(502);
    }

    public function test_sensor_proxy_requires_authentication(): void
    {
        $this->getJson('/api/satellites/25544/sensors')->assertUnauthorized();
    }
}
