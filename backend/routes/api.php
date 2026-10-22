<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PasswordController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [PasswordController::class,'forgot',]);

Route::post('/reset-password', [PasswordController::class,'reset',]);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/users', [UserController::class, 'store']);
});
