<?php

namespace Tests\Feature;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OrbitControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Verifica se um usuário autenticado consegue consultar
     * a posição orbital de um satélite.
     *
     * @return void
     */
    public function test_authenticated_user_can_get_satellite_position()
    {
        Http::fake([
            '127.0.0.1:8001/api/v1/orbits/25544/position' => Http::response([
                'satellite' => [
                    'norad_id' => 25544,
                    'name' => 'ISS (ZARYA)',
                ],
                'source' => 'CelesTrak',
                'coordinate_frame' => 'TEME',
                'position_km' => [
                    'x' => 6149.53,
                    'y' => 164.40,
                    'z' => 2878.11,
                ],
                'velocity_km_s' => [
                    'x' => -2.50,
                    'y' => 5.18,
                    'z' => 5.05,
                ],
            ], 200),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/satellites/25544/position');

        $response->assertStatus(200)
            ->assertJsonPath('satellite.norad_id', 25544)
            ->assertJsonPath('satellite.name', 'ISS (ZARYA)')
            ->assertJsonPath('source', 'CelesTrak');

        Http::assertSent(function ($request) {
            return $request->url() ===
                'http://127.0.0.1:8001/api/v1/orbits/25544/position';
        });
    }

    /**
     * Verifica se a rota bloqueia usuários não autenticados.
     *
     * @return void
     */
    public function test_unauthenticated_user_cannot_get_satellite_position()
    {
        $response = $this->getJson('/api/satellites/25544/position');

        $response->assertStatus(401);
    }

    /**
     * Verifica se uma data inválida é rejeitada.
     *
     * @return void
     */
    public function test_invalid_calculation_time_is_rejected()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson(
                '/api/satellites/25544/position?calculation_time=data-invalida'
            );

        $response->assertStatus(422)
            ->assertJsonValidationErrors('calculation_time');
    }

    /**
     * Verifica o tratamento de falha de conexão com a API Python.
     *
     * @return void
     */
    public function test_python_api_connection_failure_returns_503()
    {
        Http::fake(function () {
            throw new ConnectionException(
                'Falha simulada de conexão com a API Python.'
            );
        });

        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/satellites/25544/position');

        $response->assertStatus(503)
            ->assertJson([
                'message' => 'Não foi possível conectar à API Python.',
            ]);
    }

    /**
     * Verifica o tratamento de uma resposta que não contém JSON válido.
     *
     * @return void
     */
    public function test_invalid_python_response_returns_502()
    {
        Http::fake([
            '127.0.0.1:8001/api/v1/orbits/25544/position' => Http::response(
                'resposta invalida',
                200,
                ['Content-Type' => 'text/plain']
            ),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/satellites/25544/position');

        $response->assertStatus(502)
            ->assertJson([
                'message' => 'A API Python retornou uma resposta inválida.',
            ]);
    }

    /**
     * Verifica se o horário informado é encaminhado à API Python.
     *
     * @return void
     */
    public function test_calculation_time_is_forwarded_to_python_api()
    {
        Http::fake(['*/api/v1/orbits/25544/position*' => Http::response([
            'satellite' => [
                'norad_id' => 25544,
                'name' => 'ISS (ZARYA)',
            ],
            'source' => 'CelesTrak',
        ], 200),
    ]);

        // Cria um usuário usando a factory do Laravel.
        $user = User::factory()->create();

        $calculationTime = '2026-11-01T12:00:00';

        // Faz a requisição autenticada enviando a data informada.
        $this->actingAs($user, 'sanctum')
            ->getJson(
             '/api/satellites/25544/position?calculation_time=' .
             urlencode($calculationTime)
            )
            ->assertStatus(200);

        // Confirma que a API Python recebeu a data correta.
        Http::assertSent(function ($request) use ($calculationTime) {
         return strpos(
                $request->url(),
                '/api/v1/orbits/25544/position'
            ) !== false
                && $request['calculation_time'] === $calculationTime;
        });
    }
}