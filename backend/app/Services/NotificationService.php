<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Budget;
use App\Models\Expense;
use App\Models\FinancialGoal;
use Carbon\Carbon;

class NotificationService
{
    /**
     * Create an idempotent notification for a user.
     */
    public static function createNotification(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?array $data = null,
        ?string $eventKey = null
    ): ?Notification {
        // Idempotency check using event_key
        if ($eventKey) {
            $exists = Notification::where('user_id', $userId)
                ->where('event_key', $eventKey)
                ->exists();
            if ($exists) {
                return null;
            }
        }

        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'event_key' => $eventKey,
            'is_read' => false,
        ]);
    }

    /**
     * Evaluate and generate idempotent budget threshold & limit notifications for a user.
     */
    public static function checkBudgetNotifications(int $userId): void
    {
        $budgets = Budget::where('user_id', $userId)->get();

        foreach ($budgets as $b) {
            $spent = (float) Expense::where('user_id', $userId)
                ->where('category_id', $b->category_id)
                ->whereBetween('expense_date', [$b->start_date->toDateString(), $b->end_date->toDateString()])
                ->sum('amount');

            $allocated = (float) $b->amount;
            $pct = $allocated > 0 ? ($spent / $allocated) * 100 : 0;
            $threshold = (float) ($b->alert_threshold ?? 80.0);

            // Exceeded Notification
            if ($spent > $allocated) {
                $eventKey = "budget_exceeded_{$b->id}_" . $b->start_date->format('Ym');
                self::createNotification(
                    $userId,
                    'budget_exceeded',
                    'Budget Exceeded Warning',
                    "Your budget '{$b->name}' has exceeded its limit (Spent ₹" . number_format($spent, 2) . " / ₹" . number_format($allocated, 2) . ").",
                    ['budget_id' => $b->id, 'spent' => $spent, 'allocated' => $allocated],
                    $eventKey
                );
            }
            // Near Limit Notification
            elseif ($pct >= $threshold) {
                $eventKey = "budget_near_limit_{$b->id}_" . $b->start_date->format('Ym');
                self::createNotification(
                    $userId,
                    'budget_near_limit',
                    'Budget Threshold Alert',
                    "Your budget '{$b->name}' has reached " . round($pct, 1) . "% of its limit (Threshold {$threshold}%).",
                    ['budget_id' => $b->id, 'spent' => $spent, 'allocated' => $allocated, 'percentage' => round($pct, 1)],
                    $eventKey
                );
            }
        }
    }

    /**
     * Evaluate and generate idempotent goal milestone notifications for a user.
     */
    public static function checkGoalNotifications(int $userId): void
    {
        $goals = FinancialGoal::where('user_id', $userId)->get();

        foreach ($goals as $g) {
            $target = (float) $g->target_amount;
            $current = (float) $g->current_amount;
            $pct = $target > 0 ? ($current / $target) * 100 : 0;
            $daysRemaining = Carbon::now()->diffInDays($g->target_date, false);

            if ($pct >= 100) {
                $eventKey = "goal_completed_{$g->id}";
                self::createNotification(
                    $userId,
                    'goal_completed',
                    'Financial Goal Achieved!',
                    "Congratulations! You have fully achieved your goal '{$g->name}' (Saved ₹" . number_format($current, 2) . ").",
                    ['goal_id' => $g->id, 'target' => $target, 'current' => $current],
                    $eventKey
                );
            } elseif ($pct >= 50) {
                $eventKey = "goal_50_pct_{$g->id}";
                self::createNotification(
                    $userId,
                    'goal_progress',
                    'Goal 50% Milestone Reached',
                    "You have crossed 50% completion for your goal '{$g->name}'. Keep it up!",
                    ['goal_id' => $g->id, 'percentage' => round($pct, 1)],
                    $eventKey
                );
            }

            if ($daysRemaining >= 0 && $daysRemaining <= 7 && $pct < 100) {
                $eventKey = "goal_deadline_7d_{$g->id}";
                self::createNotification(
                    $userId,
                    'goal_deadline',
                    'Goal Target Date Approaching',
                    "Your target date for goal '{$g->name}' is in {$daysRemaining} days.",
                    ['goal_id' => $g->id, 'days_remaining' => $daysRemaining],
                    $eventKey
                );
            }
        }
    }

    public static function notifySecurityEvent(int $userId, string $title, string $message): void
    {
        self::createNotification($userId, 'security', $title, $message);
    }

    public static function notifySystemMessage(int $userId, string $title, string $message): void
    {
        self::createNotification($userId, 'system', $title, $message);
    }
}
