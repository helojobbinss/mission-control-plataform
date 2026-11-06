<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MissionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        \App\Models\Satellite::create(['norad_id' => 25544, 'name' => 'ISS', 'source' => 'CelesTrak']);
    }

    public function test_create_list_and_update_a_mission(): void
    {
        $mission = ['satellite_id' => 1, 'name' => 'Missão teste', 'status' => 'Agendada', 'category' => 'Monitoramento', 'operator_name' => 'Gabriel'];
        $id = $this->postJson('/api/missions', $mission)->assertCreated()->json('id');
        $this->getJson('/api/missions')->assertOk()->assertJsonFragment(['id' => $id, 'name' => 'Missão teste']);
        $mission['status'] = 'Ativa';
        $this->putJson('/api/missions/'.$id, $mission)->assertOk()->assertJsonPath('status', 'Ativa');
        $this->assertDatabaseHas('missions', ['id' => $id, 'status' => 'Ativa']);
    }

    public function test_invalid_status_is_rejected(): void
    {
        $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Teste', 'status' => 'inválido'])
            ->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_missions_are_listed_by_increasing_id(): void
    {
        $first = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Primeira', 'status' => 'Agendada'])->json('id');
        $second = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Segunda', 'status' => 'Agendada'])->json('id');
        $this->getJson('/api/missions')->assertOk()->assertJsonPath('0.id', $first)->assertJsonPath('1.id', $second);
    }

    public function test_comments_belong_to_one_mission(): void
    {
        $first = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Primeira', 'status' => 'Ativa'])->json('id');
        $second = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Segunda', 'status' => 'Ativa'])->json('id');
        $this->postJson("/api/missions/$first/comments", ['author' => 'Ana', 'body' => 'Tudo certo'])->assertCreated();
        $this->postJson("/api/missions/$first/comments", ['author' => 'Bia', 'body' => 'Acompanhando'])->assertCreated();
        $this->getJson("/api/missions/$first")->assertOk()->assertJsonCount(2, 'comments');
        $this->getJson("/api/missions/$second")->assertOk()->assertJsonCount(0, 'comments');
        $this->postJson("/api/missions/$second/comments", ['author' => '', 'body' => ''])->assertUnprocessable();
    }

    public function test_bulk_updates_and_deletion_preserve_other_missions(): void
    {
        $first = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Primeira', 'status' => 'Agendada'])->json('id');
        $second = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Segunda', 'status' => 'Agendada'])->json('id');
        $other = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Outra', 'status' => 'Agendada'])->json('id');
        $this->postJson("/api/missions/$first/comments", ['author' => 'Ana', 'body' => 'Comentário'])->assertCreated();
        $this->postJson('/api/missions/bulk', ['ids' => [$first, $second], 'action' => 'status', 'value' => 'Ativa'])->assertOk();
        $this->postJson('/api/missions/bulk', ['ids' => [$first, $second], 'action' => 'operator', 'value' => 'Arthur'])->assertOk();
        $this->assertDatabaseHas('missions', ['id' => $second, 'status' => 'Ativa', 'operator_name' => 'Arthur']);
        $this->assertDatabaseHas('missions', ['id' => $other, 'status' => 'Agendada']);
        $this->postJson('/api/missions/bulk', ['ids' => [$first, 99999], 'action' => 'delete'])->assertUnprocessable();
        $this->assertDatabaseHas('missions', ['id' => $first]);
        $this->postJson('/api/missions/bulk', ['ids' => [$first, $second], 'action' => 'delete'])->assertOk();
        $this->assertDatabaseMissing('missions', ['id' => $first]);
        $this->assertDatabaseMissing('mission_comments', ['mission_id' => $first]);
        $this->assertDatabaseHas('missions', ['id' => $other]);
    }

    public function test_deleting_one_mission_deletes_its_comments(): void
    {
        $id = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Teste', 'status' => 'Ativa'])->json('id');
        $this->postJson("/api/missions/$id/comments", ['author' => 'Ana', 'body' => 'Nota'])->assertCreated();
        $this->deleteJson("/api/missions/$id")->assertNoContent();
        $this->assertDatabaseMissing('mission_comments', ['mission_id' => $id]);
        $this->deleteJson("/api/missions/$id")->assertNotFound();
    }

    public function test_finished_missions_require_confirmation_individually_and_in_bulk(): void
    {
        $data = ['satellite_id' => 1, 'name' => 'Teste', 'status' => 'Concluída'];
        $id = $this->postJson('/api/missions', $data)->json('id');
        $data['status'] = 'Ativa';
        $this->putJson("/api/missions/$id", $data)->assertUnprocessable()->assertJsonValidationErrors('confirmation');
        $this->postJson('/api/missions/bulk', ['ids' => [$id], 'action' => 'status', 'value' => 'Agendada'])->assertUnprocessable();
        $this->assertDatabaseHas('missions', ['id' => $id, 'status' => 'Concluída']);
        $this->putJson("/api/missions/$id", $data + ['confirmation' => 'ciente'])->assertOk()->assertJsonPath('status', 'Ativa');
        $this->postJson('/api/missions/bulk', ['ids' => [$id], 'action' => 'status', 'value' => 'Abortada'])->assertOk();
        $this->postJson('/api/missions/bulk', ['ids' => [$id], 'action' => 'status', 'value' => 'Ativa', 'confirmation' => 'ciente'])->assertOk();
        $this->assertDatabaseHas('missions', ['id' => $id, 'status' => 'Ativa']);
    }

    public function test_period_and_lifecycle_actions_are_recorded(): void
    {
        $data = ['satellite_id' => 1, 'name' => 'Missão período', 'status' => 'Agendada', 'planned_start_date' => '2026-11-10', 'planned_end_date' => '2026-11-20'];
        $id = $this->postJson('/api/missions', $data)->assertCreated()->json('id');
        $this->postJson("/api/missions/$id/transition", ['action' => 'complete'])->assertUnprocessable();
        $this->postJson("/api/missions/$id/transition", ['action' => 'start'])->assertOk()->assertJsonPath('status', 'Ativa')->assertJsonPath('planned_start_date', '2026-11-10');
        $this->assertNotNull(\App\Models\Mission::findOrFail($id)->started_at);
        $this->postJson("/api/missions/$id/transition", ['action' => 'complete'])->assertOk()->assertJsonPath('status', 'Concluída');
        $this->assertNotNull(\App\Models\Mission::findOrFail($id)->ended_at);
        $this->postJson("/api/missions/$id/transition", ['action' => 'start'])->assertUnprocessable();
        $this->postJson('/api/missions', array_merge($data, ['planned_end_date' => '2026-11-01']))->assertUnprocessable()->assertJsonValidationErrors('planned_end_date');
    }

    public function test_bulk_status_changes_also_update_actual_dates(): void
    {
        $id = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Teste', 'status' => 'Agendada'])->json('id');
        $this->postJson('/api/missions/bulk', ['ids' => [$id], 'action' => 'status', 'value' => 'Ativa'])->assertOk();
        $this->assertNotNull(\App\Models\Mission::findOrFail($id)->started_at);
        $this->postJson('/api/missions/bulk', ['ids' => [$id], 'action' => 'status', 'value' => 'Abortada'])->assertOk();
        $this->assertNotNull(\App\Models\Mission::findOrFail($id)->ended_at);
        $this->postJson('/api/missions/bulk', ['ids' => [$id], 'action' => 'status', 'value' => 'Ativa', 'confirmation' => 'ciente'])->assertOk();
        $this->assertNull(\App\Models\Mission::findOrFail($id)->ended_at);
    }

    public function test_deletion_of_completed_missions_requires_confirmation(): void
    {
        $completed = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Concluída', 'status' => 'Concluída'])->json('id');
        $active = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Ativa', 'status' => 'Ativa'])->json('id');
        $this->postJson("/api/missions/$completed/comments", ['author' => 'Ana', 'body' => 'Nota'])->assertCreated();
        $this->deleteJson("/api/missions/$completed")->assertUnprocessable()->assertJsonValidationErrors('confirmation');
        $this->postJson('/api/missions/bulk', ['ids' => [$active, $completed], 'action' => 'delete'])->assertUnprocessable();
        $this->assertDatabaseHas('missions', ['id' => $active]);
        $this->assertDatabaseHas('mission_comments', ['mission_id' => $completed]);
        $this->postJson('/api/missions/bulk', ['ids' => [$active, $completed], 'action' => 'delete', 'confirmation' => 'ciente'])->assertOk();
        $this->assertDatabaseMissing('missions', ['id' => $completed]);
        $this->assertDatabaseMissing('mission_comments', ['mission_id' => $completed]);
        $another = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Outra', 'status' => 'Concluída'])->json('id');
        $this->deleteJson("/api/missions/$another", ['confirmation' => 'ciente'])->assertNoContent();
        $normal = $this->postJson('/api/missions', ['satellite_id' => 1, 'name' => 'Normal', 'status' => 'Ativa'])->json('id');
        $this->deleteJson("/api/missions/$normal")->assertNoContent();
    }

    public function test_budget_is_preserved_and_invalid_values_are_rejected(): void
    {
        $data = ['satellite_id' => 1, 'name' => 'Missão orçamento', 'status' => 'Agendada', 'budget' => '12345.67'];
        $id = $this->postJson('/api/missions', $data)->assertCreated()->assertJsonPath('budget', '12345.67')->json('id');
        $this->getJson("/api/missions/$id")->assertOk()->assertJsonPath('budget', '12345.67');
        $this->putJson("/api/missions/$id", array_merge($data, ['budget' => '0.00']))->assertOk()->assertJsonPath('budget', '0.00');
        foreach (['-1', '1.234', '10000000000.00'] as $invalid) {
            $this->postJson('/api/missions', array_merge($data, ['budget' => $invalid]))->assertUnprocessable()->assertJsonValidationErrors('budget');
        }
    }
}
