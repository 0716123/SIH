<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - SIP Case Tracking System
|--------------------------------------------------------------------------
|
| Backend web routes and status health-check.
|
*/

Route::get('/', function () {
    return response()->json([
        'system'      => 'SIP Digital Case History & Patient Tracking System',
        'status'      => 'Online',
        'api_version' => '1.0',
        'endpoints'   => [
            'login'          => '/api/auth/login',
            'dashboard'      => '/api/dashboard',
            'patients'       => '/api/patients',
            'cases'          => '/api/cases',
            'appointments'   => '/api/appointments',
            'reports'        => '/api/reports',
        ],
        'multilingual_locales' => ['en', 'gu'],
        'time'        => now()->toDateTimeString(),
    ]);
});

Route::get('/health', function () {
    try {
        DB::connection()->getPdo();

        return response()->json([
            'status'    => 'healthy',
            'database'  => 'connected',
            'timestamp' => now()->timestamp,
        ]);
    } catch (Throwable $exception) {
        return response()->json([
            'status'    => 'degraded',
            'database'  => 'unavailable',
            'timestamp' => now()->timestamp,
        ], 503);
    }
});
