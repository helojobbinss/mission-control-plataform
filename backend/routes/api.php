<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MissionController;
use App\Http\Controllers\SatelliteController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Desenvolvimento local: substituir por autenticação antes de disponibilizar a API.
if (app()->environment(['local', 'testing'])) {
    Route::get('/satellites', [SatelliteController::class, 'index']);
    Route::get('/satellites/search', [SatelliteController::class, 'search']);
    Route::post('/satellites/import', [SatelliteController::class, 'import']);
    Route::get('/satellites/{satellite}/orbit', [SatelliteController::class, 'orbit']);
    Route::get('/satellites/{satellite}/reception', [SatelliteController::class, 'reception']);
    Route::get('/missions', [MissionController::class, 'index']);
    Route::post('/missions', [MissionController::class, 'store']);
    Route::post('/missions/bulk', [MissionController::class, 'bulk']);
    Route::get('/missions/{mission}', [MissionController::class, 'show']);
    Route::post('/missions/{mission}/comments', [MissionController::class, 'addComment']);
    Route::post('/missions/{mission}/transition', [MissionController::class, 'transition']);
    Route::put('/missions/{mission}', [MissionController::class, 'update']);
    Route::delete('/missions/{mission}', [MissionController::class, 'destroy']);
}
