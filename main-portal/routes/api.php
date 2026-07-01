<?php

use App\Http\Controllers\API\SSOController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\CachedDashboardController;
use App\Http\Controllers\API\CompleteDashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// SSO API Routes
Route::post('/sso/verify', [SSOController::class, 'verify'])
     ->middleware(['throttle:60,1', 'readonly.db'])
     ->name('sso.verify');

Route::get('/sso/logout', [SSOController::class, 'logout'])
     ->middleware('throttle:60,1')
     ->name('sso.logout');

Route::post('/sso/logout', [SSOController::class, 'logout'])
     ->middleware('throttle:60,1')
     ->name('sso.logout.post');

Route::get('/sso/verify/logout', [SSOController::class, 'logout'])
     ->middleware('throttle:60,1')
     ->name('sso.verify.logout');

Route::post('/sso/verify/logout', [SSOController::class, 'logout'])
     ->middleware('throttle:60,1')
     ->name('sso.verify.logout.post');

// Dashboard API Routes
Route::prefix('dashboard')->middleware(['throttle:60,1'])->group(function () {
    // Cached endpoints (use these for better performance)
    Route::group(['controller' => CachedDashboardController::class], function () {
        // Comprehensive overview
        Route::get('/overview', 'overview');

        // Total counts from all databases
        Route::get('/totals', 'totalCounts');

        // Time series data for charts
        Route::get('/pencatatan-izin/time-series', 'pencatatanIzinTimeSeries');
        Route::get('/chart-data', 'chartData');

        // Comparison endpoints
        Route::get('/pencatatan-izin/year-comparison', 'yearComparison');
        Route::get('/pencatatan-izin/monthly-comparison', 'monthlyComparison');

        // Province statistics
        Route::get('/province-ranking', 'provinceRanking');

        // Daily statistics
        Route::get('/daily-stats', 'dailyStats');

        // KPI metrics endpoint
        Route::get('/kpis', 'getKPIs');
    });

    // Cache management endpoints
    Route::group(['controller' => CachedDashboardController::class], function () {
        Route::get('/cache/clear', 'clearCache');
        Route::get('/cache/stats', 'getCacheStats');
    });

    // Original endpoints (fallback and non-cached endpoints)
    Route::group(['controller' => DashboardController::class], function () {
        // Time series data (all data endpoint)
        Route::get('/pencatatan-izin/time-series-all', 'pencatatanIzinTimeSeriesAll');

        // Other province statistics
        Route::get('/province-stats', 'getProvinceStats');
        Route::get('/monthly-province-chart', 'getMonthlyProvinceChart');

        // Legacy endpoints (backward compatibility)
        Route::get('/pencatatan-izin', 'getPencatatanIzinData');
        Route::get('/pencatatan-izin/summary', 'getPencatatanIzinSummary');

        // Database connection testing
        Route::get('/test-connections', 'testConnections');
    });

    // Complete dashboard data (single request endpoint)
    Route::get('/complete', [CompleteDashboardController::class, 'getCompleteData']);
});