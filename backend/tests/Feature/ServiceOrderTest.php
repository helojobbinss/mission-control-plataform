<?php

namespace Tests\Feature;

use App\Models\Mission;
use App\Models\Satellite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_crud_and_mission_satellite_consistency(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $satellite = Satellite::create(['name' => 'ISS', 'norad_id' => 25544]);
        $other = Satellite::create(['name' => 'Other', 'norad_id' => 12345]);
        $mission = Mission::create(['name' => 'Test', 'status' => 'Agendada', 'satellite_id' => $satellite->id]);
        $payload = ['title' => 'Maintenance', 'description' => 'Test', 'type' => 'maintenance', 'operator_id' => $user->id, 'mission_id' => $mission->id, 'satellite_id' => $satellite->id];
        $id = $this->postJson('/api/service-orders', $payload)->assertCreated()->json('data.id');
        $this->getJson("/api/service-orders/$id")->assertOk()->assertJsonPath('mission.id', $mission->id);
        $this->patchJson("/api/service-orders/$id", ['satellite_id' => $other->id])->assertUnprocessable();
        $this->patchJson("/api/service-orders/$id", ['status' => 'in_progress'])->assertOk()->assertJsonPath('data.status', 'in_progress');
        $this->deleteJson("/api/service-orders/$id")->assertOk();
        $this->assertSoftDeleted('service_orders', ['id' => $id]);
        $this->getJson("/api/service-orders/$id")->assertNotFound();
    }
}
