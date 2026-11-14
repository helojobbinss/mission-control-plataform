<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;

trait CreatesApplication
{
    /**
     * Creates the application.
     *
     * @return \Illuminate\Foundation\Application
     */
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        // Antes de RefreshDatabase executar qualquer migration, recusar banco
        // existente mesmo se houver config cache que ignore as variáveis XML.
        if (!$app->environment('testing')
            || config('database.default') !== 'sqlite'
            || config('database.connections.sqlite.database') !== ':memory:') {
            throw new \RuntimeException('PHPUnit exige SQLite :memory: em testing; recusado banco não descartável/configuração em cache.');
        }

        return $app;
    }
}
