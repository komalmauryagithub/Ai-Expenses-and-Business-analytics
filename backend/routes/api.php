<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BudgetController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\FinancialGoalController;
use App\Http\Controllers\Api\V1\GoalContributionController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\IncomeController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Middleware\EnsureAdminRole;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Version 1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // System Health Check
    Route::get('/health', [HealthController::class, 'index']);

    // Authentication Routes (Public & Rate Limited)
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1')->name('login');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');

        // Protected Auth Routes
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
        });
    });

    // Protected Application Routes
    Route::middleware('auth:sanctum')->group(function () {

        // Dashboard Financial Overview
        Route::get('/dashboard', [DashboardController::class, 'index']);

        // Profile Routes
        Route::prefix('profile')->group(function () {
            Route::get('/', [ProfileController::class, 'show']);
            Route::match(['put', 'patch'], '/', [ProfileController::class, 'update']);
            Route::post('/change-password', [ProfileController::class, 'changePassword']);
        });

        // Category Management Routes
        Route::apiResource('categories', CategoryController::class);

        // Expense Management Routes
        Route::apiResource('expenses', ExpenseController::class);

        // Income Management Routes
        Route::apiResource('income', IncomeController::class);

        // Budget Management Routes
        Route::apiResource('budgets', BudgetController::class);

        // Financial Goal & Contribution Routes
        Route::apiResource('goals', FinancialGoalController::class);
        Route::apiResource('goals.contributions', GoalContributionController::class);

        // Phase 10 Notification Routes
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('/mark-read', [NotificationController::class, 'markAsRead']);
            Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
            Route::delete('/{id}', [NotificationController::class, 'destroy']);
        });

        // Python FastAPI Analytics Routes
        Route::prefix('analytics')->group(function () {
            Route::get('/full', [AnalyticsController::class, 'full']);
            Route::get('/summary', [AnalyticsController::class, 'full']);
            Route::get('/expenses', [AnalyticsController::class, 'full']);
            Route::get('/income', [AnalyticsController::class, 'full']);
            Route::get('/trends', [AnalyticsController::class, 'full']);
            
            // Phase 7 Advanced Analytics Endpoints
            Route::get('/advanced-summary', [AnalyticsController::class, 'advancedFull']);
            Route::get('/comparison', [AnalyticsController::class, 'comparison']);
            Route::get('/spending-patterns', [AnalyticsController::class, 'patterns']);
            Route::get('/anomalies', [AnalyticsController::class, 'anomalies']);
            Route::get('/budget-performance', [AnalyticsController::class, 'budgetPerformance']);
            Route::get('/goal-performance', [AnalyticsController::class, 'goalPerformance']);
        });

        // Phase 8 AI Financial Assistant Routes
        Route::prefix('ai')->group(function () {
            Route::post('/chat', [\App\Http\Controllers\Api\V1\AIController::class, 'chat'])->middleware('throttle:15,1');
            Route::get('/conversations', [\App\Http\Controllers\Api\V1\AIController::class, 'indexConversations']);
            Route::post('/conversations', [\App\Http\Controllers\Api\V1\AIController::class, 'createConversation']);
            Route::get('/conversations/{id}', [\App\Http\Controllers\Api\V1\AIController::class, 'showConversation']);
            Route::delete('/conversations/{id}', [\App\Http\Controllers\Api\V1\AIController::class, 'destroyConversation']);
            Route::get('/insights', [\App\Http\Controllers\Api\V1\AIController::class, 'indexInsights']);
            Route::post('/insights/generate', [\App\Http\Controllers\Api\V1\AIController::class, 'generateInsight']);
        });

        // Phase 9 Report Center Routes
        Route::prefix('reports')->group(function () {
            Route::get('/types', [\App\Http\Controllers\Api\V1\ReportController::class, 'getTypes']);
            Route::post('/preview', [\App\Http\Controllers\Api\V1\ReportController::class, 'preview']);
            Route::post('/export/csv', [\App\Http\Controllers\Api\V1\ReportController::class, 'exportCsv']);
            Route::post('/export/pdf', [\App\Http\Controllers\Api\V1\ReportController::class, 'exportPdf']);
        });

    });

    // Admin Routes (Protected + Admin Middleware)
    Route::middleware(['auth:sanctum', EnsureAdminRole::class])->prefix('admin')->group(function () {
        Route::get('/test', [AdminController::class, 'test']);
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'indexUsers']);
        Route::get('/users/{id}', [AdminController::class, 'showUser']);
        Route::patch('/users/{id}/role', [AdminController::class, 'updateRole']);
        Route::patch('/users/{id}/status', [AdminController::class, 'updateStatus']);
        Route::get('/audit-logs', [AdminController::class, 'indexAuditLogs']);
        Route::get('/notifications', [AdminController::class, 'indexAdminNotifications']);
        Route::get('/system-health', [AdminController::class, 'systemHealth']);
    });

});
