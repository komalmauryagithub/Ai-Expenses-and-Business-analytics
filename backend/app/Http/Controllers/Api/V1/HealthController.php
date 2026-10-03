<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    /**
     * Check API and Database connection status safely without leaking credentials.
     */
    public function index(): JsonResponse
    {
        $dbStatus = 'disconnected';
        $dbError = null;

        try {
            DB::connection()->getPdo();
            $dbStatus = 'connected';
        } catch (Throwable $e) {
            $dbStatus = 'disconnected';
            $dbError = 'Database connection failed';
        }

        $statusCode = ($dbStatus === 'connected') ? 200 : 503;

        return response()->json([
            'success' => $dbStatus === 'connected',
            'message' => 'API health check completed',
            'data' => [
                'status' => 'active',
                'environment' => config('app.env'),
                'database' => $dbStatus,
                'timestamp' => now()->toIso8601String(),
            ],
            'errors' => $dbError ? ['database' => $dbError] : null,
        ], $statusCode);
    }
}
