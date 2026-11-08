<?php

namespace Tests\Feature;

use App\Models\Mission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MissionPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_mission_fields_and_status_changes_are_persisted(): void
    {
        $satellite = \App\Models\Satellite::create(['norad_id' => 25544, 'name' => 'ISS']);
        $mission = Mission::create([
            'satellite_id' => $satellite->id,
            'name' => 'Monitoramento orbital',
            'description' => 'Acompanhar a órbita',
            'status' => 'Agendada',
            'category' => 'Monitoramento',
            'operator_name' => 'Gabriel',
        ]);

        $mission->update(['status' => 'Ativa']);

        $this->assertDatabaseHas('missions', [
            'id' => $mission->id,
            'name' => 'Monitoramento orbital',
            'description' => 'Acompanhar a órbita',
            'status' => 'Ativa',
            'category' => 'Monitoramento',
            'operator_name' => 'Gabriel',
        ]);
    }
}
