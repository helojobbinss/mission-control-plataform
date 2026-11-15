<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (DB::table('users')->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->whereNotNull('users.role_id')->whereNull('roles.id')->exists()) {
            throw new RuntimeException('Há usuários com role_id inexistente. Revise os vínculos antes de migrar. Nenhum dado foi alterado.');
        }
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('role_id')->references('id')->on('roles')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropForeign(['role_id']));
    }
};
