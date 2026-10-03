<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Fetch authenticated user's financial dashboard overview.
     * GET /api/v1/dashboard
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'period' => ['nullable', 'string', 'in:current_month,previous_month,last_7_days,last_30_days,last_90_days,current_year,custom'],
            'from_date' => ['nullable', 'required_if:period,custom', 'date'],
            'to_date' => ['nullable', 'required_if:period,custom', 'date', 'after_or_equal:from_date'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed for dashboard request.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()->id;
        $period = $request->input('period', 'current_month');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        $data = $this->dashboardService->getDashboardData($userId, $period, $fromDate, $toDate);

        return response()->json([
            'success' => true,
            'message' => 'Dashboard financial summary retrieved successfully',
            'data' => $data,
        ], 200);
    }
}
