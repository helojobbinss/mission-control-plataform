<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NasaIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_event_routes_forward_validated_dates(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Http::preventStrayRequests();
        Http::fake(['api.nasa.gov/*' => Http::response([['activityID' => 'test']])]);

        foreach (['solar-flares' => 'FLR', 'geomagnetic-storms' => 'GST', 'coronal-mass-ejections' => 'CME'] as $path => $type) {
            $this->getJson("/api/integrations/nasa/$path?start_date=2026-11-01&end_date=2026-11-07")
                ->assertOk()->assertJsonPath('success', true)->assertJsonPath('data.0.activityID', 'test');
            Http::assertSent(fn ($request) => str_contains($request->url(), "/$type?")
                && $request['startDate'] === '2026-11-01' && $request['endDate'] === '2026-11-07');
        }
    }

    public function test_invalid_dates_do_not_reach_nasa_and_upstream_failure_returns_502(): void
    {
        Sanctum::actingAs(User::factory()->create());
        Http::fake(['*' => Http::response([], 503)]);
        $this->getJson('/api/integrations/nasa/solar-flares?start_date=invalid')->assertUnprocessable();
        $this->getJson('/api/integrations/nasa/solar-flares?start_date=2026-11-07&end_date=2026-11-01')->assertUnprocessable();
        Http::assertNothingSent();
        $this->getJson('/api/integrations/nasa/solar-flares')->assertStatus(502)->assertJsonPath('success', false);
    }

    public function test_mission_and_integration_routes_require_authentication(): void
    {
        foreach (['/api/missions', '/api/satellites', '/api/satellites/search?name=ISS', '/api/integrations/nasa/solar-flares'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->postJson('/api/missions', [])->assertUnauthorized();
        $this->postJson('/api/satellites/import', [])->assertUnauthorized();
    }
}
