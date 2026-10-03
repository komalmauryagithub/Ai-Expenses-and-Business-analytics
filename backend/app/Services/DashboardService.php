<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Income;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get aggregated financial summary and breakdown for authenticated user.
     */
    public function getDashboardData(int $userId, string $period = 'current_month', ?string $fromDateInput = null, ?string $toDateInput = null): array
    {
        // 1. Resolve date ranges for selected period and preceding comparison period
        [$fromDate, $toDate] = $this->resolveDateRange($period, $fromDateInput, $toDateInput);
        [$prevFromDate, $prevToDate] = $this->resolveComparisonDateRange($period, $fromDate, $toDate);

        $fromStr = $fromDate->toDateString();
        $toStr = $toDate->toDateString();
        $prevFromStr = $prevFromDate->toDateString();
        $prevToStr = $prevToDate->toDateString();

        // 2. Calculate summary totals for current period
        $totalIncome = (float) Income::where('user_id', $userId)
            ->whereBetween('income_date', [$fromStr, $toStr])
            ->sum('amount');

        $totalExpenses = (float) Expense::where('user_id', $userId)
            ->whereBetween('expense_date', [$fromStr, $toStr])
            ->sum('amount');

        $incomeCount = Income::where('user_id', $userId)
            ->whereBetween('income_date', [$fromStr, $toStr])
            ->count();

        $expenseCount = Expense::where('user_id', $userId)
            ->whereBetween('expense_date', [$fromStr, $toStr])
            ->count();

        $balance = $totalIncome - $totalExpenses;
        $savings = $balance; // As per specification: savings uses balance calculation
        $savingsRate = $totalIncome > 0 ? round(($savings / $totalIncome) * 100, 2) : 0.0;

        // 3. Calculate summary totals for comparison period
        $prevTotalIncome = (float) Income::where('user_id', $userId)
            ->whereBetween('income_date', [$prevFromStr, $prevToStr])
            ->sum('amount');

        $prevTotalExpenses = (float) Expense::where('user_id', $userId)
            ->whereBetween('expense_date', [$prevFromStr, $prevToStr])
            ->sum('amount');

        $prevBalance = $prevTotalIncome - $prevTotalExpenses;

        // Period-over-period changes
        $incomeChange = $totalIncome - $prevTotalIncome;
        $incomeChangePct = $prevTotalIncome > 0
            ? round(($incomeChange / $prevTotalIncome) * 100, 2)
            : ($totalIncome > 0 ? 100.0 : 0.0);

        $expenseChange = $totalExpenses - $prevTotalExpenses;
        $expenseChangePct = $prevTotalExpenses > 0
            ? round(($expenseChange / $prevTotalExpenses) * 100, 2)
            : ($totalExpenses > 0 ? 100.0 : 0.0);

        $balanceChange = $balance - $prevBalance;
        $balanceChangePct = $prevBalance > 0
            ? round(($balanceChange / abs($prevBalance)) * 100, 2)
            : ($balance > 0 ? 100.0 : 0.0);

        // 4. Expense Breakdown by Category
        $expenseBreakdownRaw = DB::table('expenses')
            ->leftJoin('categories', 'expenses.category_id', '=', 'categories.id')
            ->select(
                DB::raw("COALESCE(categories.name, 'Uncategorized') as category"),
                DB::raw("SUM(expenses.amount) as amount"),
                DB::raw("COUNT(expenses.id) as count")
            )
            ->where('expenses.user_id', $userId)
            ->whereNull('expenses.deleted_at')
            ->whereBetween('expenses.expense_date', [$fromStr, $toStr])
            ->groupBy(DB::raw("COALESCE(categories.name, 'Uncategorized')"))
            ->orderByDesc(DB::raw("SUM(expenses.amount)"))
            ->get();

        $expenseBreakdown = [];
        foreach ($expenseBreakdownRaw as $item) {
            $catAmount = (float) $item->amount;
            $pct = $totalExpenses > 0 ? round(($catAmount / $totalExpenses) * 100, 2) : 0.0;
            $expenseBreakdown[] = [
                'category' => $item->category,
                'amount' => number_format($catAmount, 2, '.', ''),
                'count' => (int) $item->count,
                'percentage' => $pct,
            ];
        }

        // 5. Income Breakdown by Type
        $incomeBreakdownRaw = DB::table('income')
            ->select(
                'type',
                DB::raw("SUM(amount) as amount"),
                DB::raw("COUNT(id) as count")
            )
            ->where('user_id', $userId)
            ->whereNull('deleted_at')
            ->whereBetween('income_date', [$fromStr, $toStr])
            ->groupBy('type')
            ->orderByDesc(DB::raw("SUM(amount)"))
            ->get();

        $incomeBreakdown = [];
        foreach ($incomeBreakdownRaw as $item) {
            $typeAmount = (float) $item->amount;
            $pct = $totalIncome > 0 ? round(($typeAmount / $totalIncome) * 100, 2) : 0.0;
            $incomeBreakdown[] = [
                'type' => ucfirst($item->type),
                'amount' => number_format($typeAmount, 2, '.', ''),
                'count' => (int) $item->count,
                'percentage' => $pct,
            ];
        }

        // 6. Monthly Trend (Last 6 Months)
        $monthlyTrends = $this->getMonthlyTrends($userId);

        // 7. Recent Transactions (Top 10 combined Income & Expenses)
        $recentTransactions = $this->getRecentTransactions($userId, 10);

        return [
            'period' => [
                'name' => $period,
                'from' => $fromStr,
                'to' => $toStr,
                'comparison_from' => $prevFromStr,
                'comparison_to' => $prevToStr,
            ],
            'summary' => [
                'total_income' => number_format($totalIncome, 2, '.', ''),
                'total_expenses' => number_format($totalExpenses, 2, '.', ''),
                'balance' => number_format($balance, 2, '.', ''),
                'savings' => number_format($savings, 2, '.', ''),
                'savings_rate' => $savingsRate,
                'expense_count' => $expenseCount,
                'income_count' => $incomeCount,
            ],
            'comparison' => [
                'income_change' => number_format($incomeChange, 2, '.', ''),
                'income_change_percentage' => $incomeChangePct,
                'expense_change' => number_format($expenseChange, 2, '.', ''),
                'expense_change_percentage' => $expenseChangePct,
                'balance_change' => number_format($balanceChange, 2, '.', ''),
                'balance_change_percentage' => $balanceChangePct,
            ],
            'expense_breakdown' => $expenseBreakdown,
            'income_breakdown' => $incomeBreakdown,
            'monthly_trends' => $monthlyTrends,
            'recent_transactions' => $recentTransactions,
        ];
    }

    /**
     * Resolve start and end dates based on period filter preset.
     */
    private function resolveDateRange(string $period, ?string $fromDateInput, ?string $toDateInput): array
    {
        $now = Carbon::now();

        switch ($period) {
            case 'previous_month':
                $start = $now->copy()->subMonth()->startOfMonth();
                $end = $now->copy()->subMonth()->endOfMonth();
                break;
            case 'last_7_days':
                $start = $now->copy()->subDays(6)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'last_30_days':
                $start = $now->copy()->subDays(29)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'last_90_days':
                $start = $now->copy()->subDays(89)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'current_year':
                $start = $now->copy()->startOfYear();
                $end = $now->copy()->endOfYear();
                break;
            case 'custom':
                $start = $fromDateInput ? Carbon::parse($fromDateInput)->startOfDay() : $now->copy()->startOfMonth();
                $end = $toDateInput ? Carbon::parse($toDateInput)->endOfDay() : $now->copy()->endOfMonth();
                break;
            case 'current_month':
            default:
                $start = $now->copy()->startOfMonth();
                $end = $now->copy()->endOfMonth();
                break;
        }

        return [$start, $end];
    }

    /**
     * Resolve immediately preceding period for comparison.
     */
    private function resolveComparisonDateRange(string $period, Carbon $start, Carbon $end): array
    {
        $daysDifference = $start->diffInDays($end) + 1;
        $prevEnd = $start->copy()->subDay()->endOfDay();
        $prevStart = $prevEnd->copy()->subDays($daysDifference - 1)->startOfDay();

        return [$prevStart, $prevEnd];
    }

    /**
     * Fetch monthly aggregated financial trends for last 6 months using PostgreSQL aggregation.
     */
    private function getMonthlyTrends(int $userId): array
    {
        $startDate = Carbon::now()->subMonths(5)->startOfMonth()->toDateString();
        $endDate = Carbon::now()->endOfMonth()->toDateString();

        // Income monthly sum
        $incomeMonthly = DB::table('income')
            ->select(
                DB::raw("TO_CHAR(income_date, 'YYYY-MM') as month"),
                DB::raw("SUM(amount) as total_income")
            )
            ->where('user_id', $userId)
            ->whereNull('deleted_at')
            ->whereBetween('income_date', [$startDate, $endDate])
            ->groupBy(DB::raw("TO_CHAR(income_date, 'YYYY-MM')"))
            ->pluck('total_income', 'month')
            ->toArray();

        // Expenses monthly sum
        $expenseMonthly = DB::table('expenses')
            ->select(
                DB::raw("TO_CHAR(expense_date, 'YYYY-MM') as month"),
                DB::raw("SUM(amount) as total_expenses")
            )
            ->where('user_id', $userId)
            ->whereNull('deleted_at')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->groupBy(DB::raw("TO_CHAR(expense_date, 'YYYY-MM')"))
            ->pluck('total_expenses', 'month')
            ->toArray();

        // Build continuous 6 months list
        $trends = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthCarbon = Carbon::now()->subMonths($i);
            $monthKey = $monthCarbon->format('Y-m');
            $monthLabel = $monthCarbon->format('M Y');

            $incVal = (float) ($incomeMonthly[$monthKey] ?? 0);
            $expVal = (float) ($expenseMonthly[$monthKey] ?? 0);
            $balVal = $incVal - $expVal;

            $trends[] = [
                'month' => $monthKey,
                'month_label' => $monthLabel,
                'income' => number_format($incVal, 2, '.', ''),
                'expenses' => number_format($expVal, 2, '.', ''),
                'balance' => number_format($balVal, 2, '.', ''),
            ];
        }

        return $trends;
    }

    /**
     * Fetch recent transactions combining Income and Expenses.
     */
    private function getRecentTransactions(int $userId, int $limit = 10): array
    {
        $expenses = Expense::with('category')
            ->where('user_id', $userId)
            ->orderBy('expense_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();

        $incomes = Income::with('category')
            ->where('user_id', $userId)
            ->orderBy('income_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get();

        $combined = [];

        foreach ($expenses as $e) {
            $combined[] = [
                'id' => 'exp-' . $e->id,
                'raw_id' => $e->id,
                'type' => 'expense',
                'amount' => number_format((float) $e->amount, 2, '.', ''),
                'title' => $e->description ?? ($e->category ? $e->category->name : 'Expense'),
                'source_or_method' => ucfirst($e->payment_method ?? 'Cash'),
                'category' => $e->category ? $e->category->name : 'Uncategorized',
                'category_id' => $e->category_id,
                'date' => $e->expense_date->toDateString(),
                'timestamp' => $e->expense_date->timestamp,
            ];
        }

        foreach ($incomes as $i) {
            $combined[] = [
                'id' => 'inc-' . $i->id,
                'raw_id' => $i->id,
                'type' => 'income',
                'amount' => number_format((float) $i->amount, 2, '.', ''),
                'title' => $i->source,
                'source_or_method' => ucfirst($i->type ?? 'Other'),
                'category' => $i->category ? $i->category->name : 'Uncategorized',
                'category_id' => $i->category_id,
                'date' => $i->income_date->toDateString(),
                'timestamp' => $i->income_date->timestamp,
            ];
        }

        // Sort combined list by date desc, timestamp desc
        usort($combined, function ($a, $b) {
            if ($a['date'] === $b['date']) {
                return $b['timestamp'] <=> $a['timestamp'];
            }
            return strcmp($b['date'], $a['date']);
        });

        return array_slice($combined, 0, $limit);
    }
}
