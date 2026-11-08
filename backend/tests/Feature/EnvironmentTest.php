<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EnvironmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_tests_use_an_isolated_database(): void
    {
        $this->assertSame('sqlite', DB::connection()->getDriverName());
        $this->assertSame(':memory:', config('database.connections.sqlite.database'));
    }

    public function test_api_returns_401_without_a_json_accept_header(): void
    {
        $this->get('/api/user')->assertStatus(401)->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_sanctum_token_can_authenticate_a_user(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('environment-test')->plainTextToken;

        $this->withToken($token)->getJson('/api/user')
            ->assertOk()->assertJsonPath('id', $user->id)
            ->assertJsonMissingPath('password');
    }
}
