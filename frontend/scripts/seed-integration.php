<?php

// Executado apenas pelo smoke test, com SQLite temporário definido pelo runner.
require __DIR__.'/../../backend/vendor/autoload.php';
$app = require __DIR__.'/../../backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (config('database.default') !== 'sqlite' || !str_contains(config('database.connections.sqlite.database'), 'mission-control-smoke-')) {
    throw new RuntimeException('O teste exige um SQLite temporário isolado.');
}
Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'RoleSeeder', '--force' => true]);
$manager = App\Models\Role::where('name', 'gerente')->firstOrFail();
App\Models\User::create([
    'name' => 'Integration Manager', 'email' => 'manager@example.test',
    'password' => Illuminate\Support\Facades\Hash::make('integration-test-password'),
    'role_id' => $manager->id, 'is_active' => true,
]);
echo "Isolated schema and test manager ready.\n";
