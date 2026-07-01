<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\InstitutionController;
use App\Http\Controllers\DocumentController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('institutions', InstitutionController::class)->only(['index', 'show']);
    Route::apiResource('applications', ApplicationController::class);
    Route::apiResource('documents', DocumentController::class)->only(['store', 'destroy']);
});
