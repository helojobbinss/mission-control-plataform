<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_issues_a_working_token_and_logout_revokes_it(): void
    {
        $user = User::factory()->create(['password' => Hash::make('test-password')]);
        $token = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'test-password'])
            ->assertOk()->assertJsonPath('token_type', 'Bearer')->json('token');
        $this->withToken($token)->getJson('/api/user')->assertOk()->assertJsonPath('user.id', $user->id);
        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_inactive_users_cannot_login(): void
    {
        $user = User::factory()->create(['password' => Hash::make('test-password'), 'is_active' => false]);
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'test-password'])->assertForbidden();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_only_managers_can_create_users(): void
    {
        $operator = Role::create(['name' => 'operador']);
        $manager = Role::create(['name' => 'gerente']);
        $payload = ['name' => 'Test', 'email' => 'test@example.test', 'password' => 'test-password', 'password_confirmation' => 'test-password', 'role_id' => $operator->id];
        Sanctum::actingAs(User::factory()->create(['role_id' => $operator->id]));
        $this->postJson('/api/users', $payload)->assertForbidden();
        Sanctum::actingAs(User::factory()->create(['role_id' => $manager->id]));
        $this->postJson('/api/users', $payload)->assertCreated()->assertJsonPath('user.role', 'operador')->assertJsonMissingPath('user.password');
    }

    public function test_development_password_tokens_are_unavailable_in_production(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $this->postJson('/api/forgot-password', ['email' => 'test@example.test'])->assertForbidden();
        $this->assertDatabaseCount('password_resets', 0);
    }
}
