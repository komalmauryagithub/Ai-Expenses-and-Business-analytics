<?php

namespace App\Services;

use App\Models\FinancialGoal;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GoalService
{
    /**
     * Transactionally synchronize current_amount on FinancialGoal from goal_contributions.
     */
    public function syncCurrentAmount(FinancialGoal $goal): float
    {
        return DB::transaction(function () use ($goal) {
            $totalContributed = (float) $goal->contributions()->sum('amount');
            $goal->update(['current_amount' => $totalContributed]);
            return $totalContributed;
        });
    }

    /**
     * Calculate completion metrics, status, and remaining days for a goal.
     */
    public function calculateMetrics(FinancialGoal $goal): array
    {
        $target = (float) $goal->target_amount;
        $current = (float) $goal->current_amount;
        $remaining = max(0.0, $target - $current);

        $completionPercentage = $target > 0 ? min(100.0, round(($current / $target) * 100, 2)) : 0.0;
        $today = Carbon::now()->startOfDay();
        $targetDate = Carbon::parse($goal->target_date)->startOfDay();
        $daysRemaining = $today->diffInDays($targetDate, false);

        if ($current >= $target) {
            $status = 'completed';
        } elseif ($today->gt($targetDate) && $current < $target) {
            $status = 'overdue';
        } else {
            $status = 'active';
        }

        return [
            'target_amount' => number_format($target, 2, '.', ''),
            'current_amount' => number_format($current, 2, '.', ''),
            'remaining_amount' => number_format($remaining, 2, '.', ''),
            'completion_percentage' => $completionPercentage,
            'days_remaining' => (int) $daysRemaining,
            'status' => $status,
        ];
    }
}
