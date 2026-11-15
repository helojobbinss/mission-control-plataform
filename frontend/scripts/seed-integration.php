<?php

// Executado apenas pelo smoke test, com SQLite temporário definido pelo runner.
require __DIR__.'/../../backend/vendor/autoload.php';
$app = require __DIR__.'/../../backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$sqlite = config('database.default') === 'sqlite' && str_contains(config('database.connections.sqlite.database'), 'mission-control-smoke-');
$mariadb = config('database.default') === 'mysql' && config('database.connections.mysql.database') === 'mission_control_smoke'
    && config('database.connections.mysql.host') === '127.0.0.1' && (int) config('database.connections.mysql.port') === 13317;
if (!$sqlite && !$mariadb) {
    throw new RuntimeException('O teste exige SQLite temporário ou o MariaDB descartável criado pelo runner.');
}
if (in_array('--expire-tokens', $argv, true)) {
    Illuminate\Support\Facades\DB::table('personal_access_tokens')->update(['created_at' => now()->subDays(2)]);
    echo "Only isolated test tokens expired.\n";
    exit;
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
if ($mariadb) echo 'Database: '.Illuminate\Support\Facades\DB::selectOne('select version() as version')->version."\n";
