<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            throw new RuntimeException('DemoSeeder é exclusivo de local/testing.');
        }
        $password = env('DEMO_PASSWORD', '');
        if (strlen($password) < 12) {
            throw new RuntimeException('Defina DEMO_PASSWORD com pelo menos 12 caracteres.');
        }
        $this->call(RoleSeeder::class);
        User::firstOrCreate(
            ['email' => env('DEMO_EMAIL', 'demo.manager@example.test')],
            ['name' => 'Gerente da apresentação', 'password' => Hash::make($password),
                'role_id' => Role::where('name', 'gerente')->firstOrFail()->id, 'is_active' => true]
        );
    }
}
