<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            [
                'name' => 'gerente',
                'description' => 'Gerencia usuários e operações do sistema.',
            ],
            [
                'name' => 'operador',
                'description' => 'Executa as operações das missões.',
            ],
            [
                'name' => 'analista_dados',
                'description' => 'Consulta e analisa dados e relatórios.',
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description']]
            );
        }
    }
}
