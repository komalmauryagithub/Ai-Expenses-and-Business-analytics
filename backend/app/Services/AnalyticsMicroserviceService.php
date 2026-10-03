<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AnalyticsMicroserviceService
{
    protected string $baseUrl;
    protected string $token;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.analytics.url', 'http://127.0.0.1:8001'), '/');
        $this->token = config('services.analytics.token', 'secret-analytics-internal-token-2026');
    }

    /**
     * Internal helper to make secure authenticated requests to FastAPI.
     */
    protected function postInternal(string $endpoint, array $payload): array
    {
        $url = "{$this->baseUrl}/internal/analytics/{$endpoint}";

        try {
            $response = Http::withHeaders([
                'X-Analytics-Token' => $this->token,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->timeout(10)->post($url, $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error("FastAPI Analytics Service HTTP Error: {$response->status()} - {$response->body()}");
            throw new \Exception("Analytics microservice returned error status {$response->status()}");
        } catch (\Throwable $e) {
            Log::error("FastAPI Analytics Connection Exception: {$e->getMessage()}");
            throw new \Exception("Analytics service is temporarily unavailable. Please try again later.");
        }
    }

    /**
     * Fetch complete Python analytics suite for authenticated user.
     */
    public function getFullAnalytics(int $userId, string $period = 'current_month', ?string $fromDateInput = null, ?string $toDateInput = null): array
    {
        [$fromDate, $toDate] = $this->resolveDateRange($period, $fromDateInput, $toDateInput);

        $payload = [
            'user_id' => $userId,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'period' => $period,
            'limit' => 5,
        ];

        return $this->postInternal('full', $payload);
    }

    /**
     * Fetch Phase 7 Advanced Analytics suite for authenticated user.
     */
    public function getAdvancedFullAnalytics(int $userId, string $period = 'current_month', ?string $fromDateInput = null, ?string $toDateInput = null): array
    {
        [$fromDate, $toDate] = $this->resolveDateRange($period, $fromDateInput, $toDateInput);

        $payload = [
            'user_id' => $userId,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'period' => $period,
            'limit' => 5,
        ];

        return $this->postInternal('advanced-full', $payload);
    }

    /**
     * Fetch period-over-period comparison analytics.
     */
    public function getComparisonAnalytics(int $userId, string $period = 'current_month', ?string $fromDateInput = null, ?string $toDateInput = null): array
    {
        [$fromDate, $toDate] = $this->resolveDateRange($period, $fromDateInput, $toDateInput);

        return $this->postInternal('comparison', [
            'user_id' => $userId,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'period' => $period,
        ]);
    }

    /**
     * Fetch rule-based statistical anomaly / outlier detection.
     */
    public function getAnomalies(int $userId, string $period = 'current_month', ?string $fromDateInput = null, ?string $toDateInput = null): array
    {
        [$fromDate, $toDate] = $this->resolveDateRange($period, $fromDateInput, $toDateInput);

        return $this->postInternal('anomalies', [
            'user_id' => $userId,
            'from_date' => $fromDate,
            'to_date' => $toDate,
        ]);
    }

    /**
     * Fetch spending patterns & day-of-week breakdown.
     */
    public function getSpendingPatterns(int $userId, string $period = 'current_month', ?string $fromDateInput = null, ?string $toDateInput = null): array
    {
        [$fromDate, $toDate] = $this->resolveDateRange($period, $fromDateInput, $toDateInput);

        return $this->postInternal('patterns', [
            'user_id' => $userId,
            'from_date' => $fromDate,
            'to_date' => $toDate,
        ]);
    }

    /**
     * Fetch budget utilization performance analytics.
     */
    public function getBudgetPerformance(int $userId): array
    {
        return $this->postInternal('budget-performance', [
            'user_id' => $userId,
            'from_date' => Carbon::now()->startOfMonth()->toDateString(),
            'to_date' => Carbon::now()->endOfMonth()->toDateString(),
        ]);
    }

    /**
     * Fetch financial goal progress analytics.
     */
    public function getGoalPerformance(int $userId): array
    {
        return $this->postInternal('goal-performance', [
            'user_id' => $userId,
            'from_date' => Carbon::now()->startOfYear()->toDateString(),
            'to_date' => Carbon::now()->endOfYear()->toDateString(),
        ]);
    }

    /**
     * Resolve date range strings (YYYY-MM-DD).
     */
    public function resolveDateRange(string $period, ?string $fromDateInput, ?string $toDateInput): array
    {
        $now = Carbon::now();

        switch ($period) {
            case 'previous_month':
                $start = $now->copy()->subMonth()->startOfMonth()->toDateString();
                $end = $now->copy()->subMonth()->endOfMonth()->toDateString();
                break;
            case 'last_7_days':
                $start = $now->copy()->subDays(6)->startOfDay()->toDateString();
                $end = $now->copy()->endOfDay()->toDateString();
                break;
            case 'last_30_days':
                $start = $now->copy()->subDays(29)->startOfDay()->toDateString();
                $end = $now->copy()->endOfDay()->toDateString();
                break;
            case 'last_90_days':
                $start = $now->copy()->subDays(89)->startOfDay()->toDateString();
                $end = $now->copy()->endOfDay()->toDateString();
                break;
            case 'current_year':
                $start = $now->copy()->startOfYear()->toDateString();
                $end = $now->copy()->endOfYear()->toDateString();
                break;
            case 'custom':
                $start = $fromDateInput ? Carbon::parse($fromDateInput)->toDateString() : $now->copy()->startOfMonth()->toDateString();
                $end = $toDateInput ? Carbon::parse($toDateInput)->toDateString() : $now->copy()->endOfMonth()->toDateString();
                break;
            case 'current_month':
            default:
                $start = $now->copy()->startOfMonth()->toDateString();
                $end = $now->copy()->endOfMonth()->toDateString();
                break;
        }

        return [$start, $end];
    }
}
