<?php

namespace Tests\Feature;

use App\Telemetry\TelemetryUnitCatalog;
use Tests\TestCase;

class TelemetryUnitsTest extends TestCase
{
    public function test_units_endpoint_returns_all_definitions_without_authentication(): void
    {
        $response = $this->getJson('/api/telemetry/units');

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json')
            ->assertJsonCount(15, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['key', 'name', 'unit', 'symbol', 'type', 'description'],
                ],
            ])
            ->assertExactJson(['data' => (new TelemetryUnitCatalog())->all()])
            ->assertJsonFragment([
                'key' => 'communication_status',
                'type' => 'categorical',
                'unit' => null,
                'symbol' => null,
            ]);
    }

    public function test_existing_user_endpoint_still_requires_authentication(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }
}
