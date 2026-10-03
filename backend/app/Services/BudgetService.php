<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BudgetService
{
    /**
     * Calculate actual spending, remaining amount, usage percentage, and status for a budget.
     */
    public function calculateMetrics(Budget $budget): array
    {
        $userId = $budget->user_id;
        $startDate = $budget->start_date->toDateString();
        $endDate = $budget->end_date->toDateString();

        $query = Expense::where('user_id', $userId)
            ->whereNull('deleted_at')
            ->whereBetween('expense_date', [$startDate, $endDate]);

        if ($budget->category_id) {
            $query->where('category_id', $budget->category_id);
        }

        $spent = (float) $query->sum('amount');
        $amount = (float) $budget->amount;
        $remaining = $amount - $spent;
        $usagePercentage = $amount > 0 ? round(($spent / $amount) * 100, 2) : 0.0;
        $alertThreshold = (float) $budget->alert_threshold;
        $thresholdReached = $usagePercentage >= $alertThreshold;

        // Deterministic status rules
        if ($spent > $amount) {
            $status = 'over_budget';
        } elseif ($usagePercentage >= $alertThreshold) {
            $status = 'near_limit';
        } else {
            $status = 'under_budget';
        }

        return [
            'spent' => number_format($spent, 2, '.', ''),
            'remaining' => number_format($remaining, 2, '.', ''),
            'usage_percentage' => $usagePercentage,
            'threshold_reached' => $thresholdReached,
            'status' => $status,
        ];
    }

    /**
     * Get paginated budgets for authenticated user with optional filters.
     */
    public function getBudgets(int $userId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Budget::with('category')->where('user_id', $userId);
        $today = Carbon::now()->toDateString();

        // Filter: Time status (active, upcoming, past)
        if (!empty($filters['period'])) {
            switch ($filters['period']) {
                case 'active':
                    $query->where('start_date', '<=', $today)
                          ->where('end_date', '>=', $today);
                    break;
                case 'upcoming':
                    $query->where('start_date', '>', $today);
                    break;
                case 'past':
                    $query->where('end_date', '<', $today);
                    break;
            }
        }

        // Filter: Category
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Search: Name
        if (!empty($filters['search'])) {
            $search = strtolower(trim($filters['search']));
            $query->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"]);
        }

        // Sorting
        $allowedSort = ['start_date', 'end_date', 'amount', 'name', 'created_at'];
        $sortBy = in_array($filters['sort_by'] ?? '', $allowedSort) ? $filters['sort_by'] : 'start_date';
        $sortOrder = strtolower($filters['sort_order'] ?? '') === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }
}
