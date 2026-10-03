<?php

namespace App\Services\AI;

use App\Services\AnalyticsMicroserviceService;
use App\Models\Budget;
use App\Models\FinancialGoal;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Support\Str;

class AIContextBuilder
{
    protected AnalyticsMicroserviceService $analyticsService;

    public function __construct(AnalyticsMicroserviceService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Build minimal, verified financial context for the authenticated user based on intent.
     */
    public function buildContext(int $userId, string $intent, string $message): array
    {
        $period = $this->extractPeriodFromMessage($message);
        $sources = [];
        $contextData = [
            'user_id' => $userId,
            'period' => $period,
            'currency' => 'INR (₹)',
            'as_of_date' => Carbon::now()->toDateString(),
        ];

        try {
            // Fetch verified advanced summary from FastAPI Pandas microservice
            $advFull = $this->analyticsService->getAdvancedFullAnalytics($userId, $period);
            $sources[] = 'pandas_numpy_analytics_service';

            if (in_array($intent, ['summary', 'unknown', 'general_finance'])) {
                $contextData['summary'] = $advFull['summary'] ?? [];
                $contextData['growth_comparison'] = $advFull['comparison'] ?? [];
                $sources[] = 'summary_metrics';
                $sources[] = 'period_comparison';
            }

            if (in_array($intent, ['expenses', 'category', 'payment_method'])) {
                $contextData['expense_totals'] = [
                    'total_expenses' => $advFull['expense_analytics']['total_expenses'] ?? 0,
                    'expense_count' => $advFull['expense_analytics']['expense_count'] ?? 0,
                    'average_expense' => $advFull['expense_analytics']['average_expense'] ?? 0,
                    'median_expense' => $advFull['expense_analytics']['median_expense'] ?? 0,
                ];
                $contextData['categories_breakdown'] = array_slice($advFull['expense_analytics']['categories'] ?? [], 0, 5);
                $contextData['payment_methods'] = $advFull['expense_analytics']['payment_methods'] ?? [];
                $contextData['top_5_expenses'] = array_slice($advFull['expense_analytics']['top_expenses'] ?? [], 0, 5);
                $sources[] = 'expense_analytics';
            }

            if (in_array($intent, ['income'])) {
                $contextData['income_totals'] = [
                    'total_income' => $advFull['income_analytics']['total_income'] ?? 0,
                    'income_count' => $advFull['income_analytics']['income_count'] ?? 0,
                    'average_income' => $advFull['income_analytics']['average_income'] ?? 0,
                ];
                $contextData['income_sources'] = $advFull['income_analytics']['types'] ?? [];
                $sources[] = 'income_analytics';
            }

            if (in_array($intent, ['comparison'])) {
                $contextData['period_comparison'] = $advFull['comparison'] ?? [];
                $sources[] = 'comparison_analytics';
            }

            if (in_array($intent, ['trend', 'patterns'])) {
                $contextData['day_of_week_spending'] = $advFull['patterns']['day_of_week'] ?? [];
                $contextData['peak_spending_day'] = $advFull['patterns']['highest_spending_day'] ?? null;
                $contextData['active_spending_days'] = $advFull['patterns']['active_days_count'] ?? 0;
                $sources[] = 'trend_patterns';
            }

            if (in_array($intent, ['anomaly'])) {
                $contextData['iqr_anomaly_detection'] = [
                    'outliers_found' => $advFull['anomalies']['total_anomalies_found'] ?? 0,
                    'upper_threshold' => $advFull['anomalies']['upper_threshold_amount'] ?? 0,
                    'detected_anomalies' => array_slice($advFull['anomalies']['anomalies'] ?? [], 0, 5),
                ];
                $sources[] = 'iqr_anomaly_detection';
            }

            if (in_array($intent, ['budget'])) {
                $contextData['budget_performance'] = [
                    'total_budgeted' => $advFull['budget_performance']['total_budgeted_amount'] ?? 0,
                    'total_spent' => $advFull['budget_performance']['total_spent_amount'] ?? 0,
                    'overall_utilization_rate' => $advFull['budget_performance']['overall_utilization_rate'] ?? 0,
                    'active_budgets' => array_slice($advFull['budget_performance']['budgets'] ?? [], 0, 5),
                ];
                $sources[] = 'budget_performance';
            }

            if (in_array($intent, ['goal'])) {
                $contextData['goal_performance'] = [
                    'total_target_amount' => $advFull['goal_performance']['total_target_amount'] ?? 0,
                    'total_contributed' => $advFull['goal_performance']['total_contributed_amount'] ?? 0,
                    'average_completion_percentage' => $advFull['goal_performance']['average_completion_percentage'] ?? 0,
                    'active_goals' => array_slice($advFull['goal_performance']['goals'] ?? [], 0, 5),
                ];
                $sources[] = 'goal_performance';
            }

        } catch (\Throwable $e) {
            // Fallback to direct PostgreSQL queries if microservice call fails
            $contextData['summary'] = [
                'notice' => 'Fetched directly from PostgreSQL database fallback.',
            ];
            $sources[] = 'postgresql_direct_fallback';
        }

        return [
            'context_data' => $contextData,
            'sources' => array_unique($sources),
            'period' => $period,
        ];
    }

    protected function extractPeriodFromMessage(string $message): string
    {
        $normalized = Str::lower($message);
        if (Str::contains($normalized, ['last month', 'previous month'])) {
            return 'previous_month';
        }
        if (Str::contains($normalized, ['last 7 days', 'past 7 days', 'this week'])) {
            return 'last_7_days';
        }
        if (Str::contains($normalized, ['last 30 days', 'past 30 days'])) {
            return 'last_30_days';
        }
        if (Str::contains($normalized, ['last 90 days', 'past 90 days', 'this quarter'])) {
            return 'last_90_days';
        }
        if (Str::contains($normalized, ['this year', 'current year', 'annual'])) {
            return 'current_year';
        }
        return 'current_month';
    }
}
