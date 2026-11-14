<?php

namespace Tests\Feature;

use App\Models\Mission;
use App\Models\Role;
use App\Models\Satellite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StabilizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_disabled_account_and_expired_token_cannot_access_api(): void
    {
        $user = User::factory()->create(['is_active' => false]);
        $this->withToken($user->createToken('disabled')->plainTextToken)->getJson('/api/user')->assertUnauthorized();
        $this->app['auth']->forgetGuards();
        $user->update(['is_active' => true]);
        $token = $user->createToken('expired');
        $token->accessToken->forceFill(['created_at' => now()->subDays(2)])->save();
        $this->withToken($token->plainTextToken)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_password_reset_revokes_previous_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('before-reset');
        $token = $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk()->json('token');
        $this->postJson('/api/reset-password', ['email' => $user->email, 'token' => $token, 'password' => 'new-password-2026', 'password_confirmation' => 'new-password-2026'])->assertOk();
        $this->assertSame(0, $user->tokens()->count());
        $this->assertTrue(Hash::check('new-password-2026', $user->fresh()->password));
    }

    public function test_referenced_satellite_returns_conflict_and_preserves_records(): void
    {
        $role = Role::create(['name' => 'gerente']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
        $satellite = Satellite::create(['name' => 'Linked', 'source' => 'manual']);
        $mission = Mission::create(['name' => 'Mission', 'satellite_id' => $satellite->id, 'status' => 'Agendada']);
        $this->deleteJson('/api/satellites/'.$satellite->id)->assertStatus(409)->assertJsonMissingPath('exception');
        $this->assertDatabaseHas('satellites', ['id' => $satellite->id]);
        $this->assertDatabaseHas('missions', ['id' => $mission->id]);
    }

    public function test_role_seeding_is_idempotent(): void
    {
        $this->seed();
        $this->seed();
        $this->assertDatabaseCount('roles', 3);
    }

    public function test_analyst_can_read_but_cannot_import_satellites(): void
    {
        $role = Role::create(['name' => 'analista_dados']);
        Sanctum::actingAs(User::factory()->create(['role_id' => $role->id]));
        $this->getJson('/api/satellites')->assertOk();
        $this->postJson('/api/satellites/import', ['norad_id' => 25544])->assertForbidden();
        $this->assertDatabaseCount('satellites', 0);
    }
}
