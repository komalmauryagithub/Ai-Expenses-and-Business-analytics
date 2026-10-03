<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsMicroserviceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnalyticsController extends Controller
{
    protected AnalyticsMicroserviceService $analyticsService;

    public function __construct(AnalyticsMicroserviceService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    protected function validateDateParams(Request $request)
    {
        return Validator::make($request->all(), [
            'period' => ['nullable', 'string', 'in:current_month,previous_month,last_7_days,last_30_days,last_90_days,current_year,custom'],
            'from_date' => ['nullable', 'required_if:period,custom', 'date'],
            'to_date' => ['nullable', 'required_if:period,custom', 'date', 'after_or_equal:from_date'],
        ]);
    }

    /**
     * Get full Python Pandas/NumPy analytics suite for authenticated user.
     * GET /api/v1/analytics/full
     */
    public function full(Request $request): JsonResponse
    {
        $validator = $this->validateDateParams($request);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed for analytics request.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()->id;
        $period = $request->input('period', 'current_month');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        try {
            $data = $this->analyticsService->getFullAnalytics($userId, $period, $fromDate, $toDate);

            return response()->json([
                'success' => true,
                'message' => 'Analytics retrieved successfully from Python analytics microservice',
                'data' => $data,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => new \stdClass(),
            ], 503);
        }
    }

    /**
     * Get Phase 7 Advanced Analytics suite for authenticated user.
     * GET /api/v1/analytics/advanced-summary
     */
    public function advancedFull(Request $request): JsonResponse
    {
        $validator = $this->validateDateParams($request);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed for analytics request.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()->id;
        $period = $request->input('period', 'current_month');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        try {
            $data = $this->analyticsService->getAdvancedFullAnalytics($userId, $period, $fromDate, $toDate);

            return response()->json([
                'success' => true,
                'message' => 'Advanced analytics retrieved successfully from Python analytics microservice',
                'data' => $data,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => new \stdClass(),
            ], 503);
        }
    }

    /**
     * Period-over-Period comparison analytics.
     * GET /api/v1/analytics/comparison
     */
    public function comparison(Request $request): JsonResponse
    {
        $validator = $this->validateDateParams($request);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            $data = $this->analyticsService->getComparisonAnalytics(
                $request->user()->id,
                $request->input('period', 'current_month'),
                $request->input('from_date'),
                $request->input('to_date')
            );
            return response()->json(['success' => true, 'message' => 'Comparison analytics retrieved', 'data' => $data], 200);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => new \stdClass()], 503);
        }
    }

    /**
     * Rule-based IQR statistical anomaly / outlier detection.
     * GET /api/v1/analytics/anomalies
     */
    public function anomalies(Request $request): JsonResponse
    {
        $validator = $this->validateDateParams($request);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            $data = $this->analyticsService->getAnomalies(
                $request->user()->id,
                $request->input('period', 'current_month'),
                $request->input('from_date'),
                $request->input('to_date')
            );
            return response()->json(['success' => true, 'message' => 'Anomaly detection analytics retrieved', 'data' => $data], 200);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => new \stdClass()], 503);
        }
    }

    /**
     * Spending patterns & day-of-week analysis.
     * GET /api/v1/analytics/spending-patterns
     */
    public function patterns(Request $request): JsonResponse
    {
        $validator = $this->validateDateParams($request);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        try {
            $data = $this->analyticsService->getSpendingPatterns(
                $request->user()->id,
                $request->input('period', 'current_month'),
                $request->input('from_date'),
                $request->input('to_date')
            );
            return response()->json(['success' => true, 'message' => 'Spending patterns retrieved', 'data' => $data], 200);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => new \stdClass()], 503);
        }
    }

    /**
     * Budget utilization performance analytics.
     * GET /api/v1/analytics/budget-performance
     */
    public function budgetPerformance(Request $request): JsonResponse
    {
        try {
            $data = $this->analyticsService->getBudgetPerformance($request->user()->id);
            return response()->json(['success' => true, 'message' => 'Budget performance retrieved', 'data' => $data], 200);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => new \stdClass()], 503);
        }
    }

    /**
     * Financial goal progress analytics.
     * GET /api/v1/analytics/goal-performance
     */
    public function goalPerformance(Request $request): JsonResponse
    {
        try {
            $data = $this->analyticsService->getGoalPerformance($request->user()->id);
            return response()->json(['success' => true, 'message' => 'Goal performance retrieved', 'data' => $data], 200);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => new \stdClass()], 503);
        }
    }
}
