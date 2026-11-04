<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PasswordController;
use App\Http\Controllers\OrbitController;
use App\Http\Controllers\SatelliteSensorController;

use App\Services\Integrations\CelesTrakService;
use App\Services\Integrations\NasaDonkiService;
use App\Http\Controllers\SatelliteTelemetryController;
use App\Http\Controllers\SatelliteController;
use App\Http\Controllers\SatelliteMonitoringController;

/*
|--------------------------------------------------------------------------
| Rotas públicas
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);

Route::post('/forgot-password', [
    PasswordController::class,
    'forgot',
]);

Route::post('/reset-password', [
    PasswordController::class,
    'reset',
]);

/*
|--------------------------------------------------------------------------
| Rotas protegidas por autenticação
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Autenticação e usuários
    |--------------------------------------------------------------------------
    */

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', [AuthController::class, 'user']);

    Route::post('/users', [UserController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | Integração com CelesTrak
    |--------------------------------------------------------------------------
    |
    | Consulta dados orbitais utilizando o identificador NORAD.
    |
    */

    Route::get(
        '/integrations/celestrak/{noradId}',
        function (
            string $noradId,
            CelesTrakService $celesTrak
        ) {
            try {
                return response()->json([
                    'success' => true,
                    'source' => 'CelesTrak',
                    'data' => $celesTrak->getSatelliteByNoradId(
                        $noradId
                    ),
                ]);
            } catch (\Throwable $exception) {
                report($exception);

                return response()->json([
                    'success' => false,
                    'message' => 'Não foi possível consultar os dados orbitais.',
                ], 502);
            }
        }
    )->where('noradId', '[0-9]+');

    /*
    |--------------------------------------------------------------------------
    | Integração com NASA DONKI
    |--------------------------------------------------------------------------
    |
    | As datas start_date e end_date são opcionais.
    | Por padrão, consulta os últimos sete dias até a data atual UTC.
    |
    */

    Route::prefix('/integrations/nasa')->group(function () {

        /*
        | Erupções solares (FLR)
        */

        Route::get('/solar-flares', function (
            Request $request,
            NasaDonkiService $nasa
        ) {
            return self::queryNasaEvents(
                $request,
                $nasa,
                'getSolarFlares',
                'solar_flares',
                'Não foi possível consultar as erupções solares.'
            );
        });

        /*
        | Tempestades geomagnéticas (GST)
        */

        Route::get('/geomagnetic-storms', function (
            Request $request,
            NasaDonkiService $nasa
        ) {
            return self::queryNasaEvents(
                $request,
                $nasa,
                'getGeomagneticStorms',
                'geomagnetic_storms',
                'Não foi possível consultar as tempestades geomagnéticas.'
            );
        });

        /*
        | Ejeções de massa coronal (CME)
        */

        Route::get('/coronal-mass-ejections', function (
            Request $request,
            NasaDonkiService $nasa
        ) {
            return self::queryNasaEvents(
                $request,
                $nasa,
                'getCoronalMassEjections',
                'coronal_mass_ejections',
                'Não foi possível consultar as ejeções de massa coronal.'
            );
        });

    });

    /*
    |--------------------------------------------------------------------------
    | API interna de satélites — Python
    |--------------------------------------------------------------------------
    |
    | Esses endpoints encaminham as consultas para a API Python.
    |
    */

    Route::get(
        '/satellites/{noradId}/position',
        [OrbitController::class, 'position']
    )->where('noradId', '[0-9]+');

    Route::get(
        '/satellites/{noradId}/sensors',
        [SatelliteSensorController::class, 'index']
    )->where('noradId', '[0-9]+');

    Route::get(
        '/satellites/{noradId}/telemetry',
        [SatelliteTelemetryController::class, 'index']
    )->where('noradId', '[0-9]+');

    /*
    |--------------------------------------------------------------------------
    | Cadastro de satélites (CRUD)
    |--------------------------------------------------------------------------
    |
    | Identificados pelo id interno. Satélites podem ser reais
    | (source = celestrak) ou manuais (source = manual, órbita simulada).
    |
    */

    Route::get('/satellites', [SatelliteController::class, 'index']);
    Route::post('/satellites', [SatelliteController::class, 'store']);

    // Posição atual de todos os satélites ativos (mapa orbital).
    Route::get(
        '/satellites/positions',
        [SatelliteMonitoringController::class, 'positions']
    );

    Route::get('/satellites/{satellite}', [SatelliteController::class, 'show'])
        ->where('satellite', '[0-9]+');
    Route::match(['put', 'patch'], '/satellites/{satellite}', [SatelliteController::class, 'update'])
        ->where('satellite', '[0-9]+');
    Route::delete('/satellites/{satellite}', [SatelliteController::class, 'destroy'])
        ->where('satellite', '[0-9]+');

    /*
    | Monitoramento por id interno (reais e manuais).
    | As rotas /satellites/{noradId}/... acima continuam válidas.
    */

    Route::prefix('/satellites/{satellite}/monitoring')
        ->where(['satellite' => '[0-9]+'])
        ->group(function () {
            Route::get('/position', [SatelliteMonitoringController::class, 'position']);
            Route::get('/sensors', [SatelliteMonitoringController::class, 'sensors']);
            Route::get('/telemetry', [SatelliteMonitoringController::class, 'telemetry']);
        });

});

