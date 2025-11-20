<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LookupController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SequenceController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('dashboard/metrics', [DashboardController::class, 'metrics']);
    Route::get('dashboard/chart', [DashboardController::class, 'chart']);
    Route::get('dashboard/recent-movements', [DashboardController::class, 'recentMovements']);

    Route::apiResource('products', ProductController::class);
    Route::get('variants/scan', [ProductVariantController::class, 'scan']);
    Route::apiResource('variants', ProductVariantController::class);
    Route::apiResource('suppliers', SupplierController::class)->except(['show', 'create', 'edit']);
    Route::apiResource('users', UserController::class)->except(['show', 'create', 'edit']);
    Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword']);

    Route::get('stock-movements', [StockMovementController::class, 'index']);
    Route::post('stock-movements', [StockMovementController::class, 'store']);

    Route::get('lookups/options', [LookupController::class, 'options']);
    Route::get('sequences/product-code', [SequenceController::class, 'nextProductCode']);
    Route::get('sequences/variant-sku', [SequenceController::class, 'nextVariantSku']);
    Route::get('sequences/reference/{type}', [SequenceController::class, 'nextReference']);
});
