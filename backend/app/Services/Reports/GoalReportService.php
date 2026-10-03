<?php

namespace App\Services\Reports;

use App\Models\FinancialGoal;
use Carbon\Carbon;

class GoalReportService extends BaseReportService
{
    public function getReportData(int $userId, array $filters): array
    {
        $query = FinancialGoal::where('user_id', $userId)->with('contributions');

        if (!empty($filters['goal_id'])) {
            $query->where('id', $filters['goal_id']);
        }

        $goals = $query->orderBy('target_date', 'asc')->get();

        $totalTarget = 0;
        $totalContributed = 0;

        $rows = $goals->map(function ($g) use (&$totalTarget, &$totalContributed) {
            $target = (float) $g->target_amount;
            $current = (float) $g->current_amount;
            $totalTarget += $target;
            $totalContributed += $current;

            $remaining = max(0, $target - $current);
            $completionPct = $target > 0 ? round(($current / $target) * 100, 2) : 0;
            $daysRemaining = Carbon::now()->diffInDays($g->target_date, false);

            $status = 'active';
            if ($current >= $target) {
                $status = 'completed';
            } elseif ($daysRemaining < 0) {
                $status = 'overdue';
            }

            return [
                'id' => $g->id,
                'date' => $g->target_date->format('Y-m-d'),
                'description' => $g->name,
                'category' => 'Financial Goal',
                'method_or_source' => strtoupper($status),
                'amount' => $target,
                'amount_formatted' => '₹' . number_format($target, 2),
                'current_amount' => $current,
                'current_formatted' => '₹' . number_format($current, 2),
                'remaining' => $remaining,
                'remaining_formatted' => '₹' . number_format($remaining, 2),
                'completion_percentage' => $completionPct,
                'status' => $status,
                'days_remaining' => (int) $daysRemaining,
                'contributions_count' => $g->contributions->count(),
            ];
        })->toArray();

        $avgCompletion = count($rows) > 0 ? round(array_sum(array_column($rows, 'completion_percentage')) / count($rows), 2) : 0;

        return [
            'report_type' => 'goal',
            'title' => 'Financial Goals Progress Report',
            'period_label' => 'Active & Saved Goals',
            'summary_cards' => [
                ['label' => 'Total Target Amount', 'value' => '₹' . number_format($totalTarget, 2)],
                ['label' => 'Total Contributed', 'value' => '₹' . number_format($totalContributed, 2)],
                ['label' => 'Average Completion', 'value' => $avgCompletion . '%'],
            ],
            'breakdown' => array_map(fn($r) => [
                'name' => $r['description'],
                'count' => $r['contributions_count'],
                'percentage' => $r['completion_percentage'],
                'amount_formatted' => $r['current_formatted'] . ' / ' . $r['amount_formatted'],
            ], $rows),
            'rows' => $rows,
        ];
    }

    public function exportCsv(int $userId, array $filters)
    {
        $report = $this->getReportData($userId, $filters);
        $filename = 'financial-goals-' . Carbon::now()->format('Y-m-d-His') . '.csv';
        $csvHeaders = ['Goal Name', 'Target Amount (INR)', 'Contributed (INR)', 'Remaining (INR)', 'Completion (%)', 'Status', 'Target Date', 'Days Remaining'];

        $generator = function () use ($report) {
            foreach ($report['rows'] as $row) {
                yield [
                    $row['description'],
                    $row['amount'],
                    $row['current_amount'],
                    $row['remaining'],
                    $row['completion_percentage'],
                    $row['status'],
                    $row['date'],
                    $row['days_remaining'],
                ];
            }
        };

        return $this->streamCsvResponse($filename, $csvHeaders, $generator);
    }

    public function exportPdf(int $userId, array $filters, string $userName, string $userEmail)
    {
        $data = $this->getReportData($userId, $filters);
        $filename = 'financial-goals-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        $viewData = [
            'title' => 'Financial Goals Progress Report',
            'user_name' => $userName,
            'user_email' => $userEmail,
            'period_label' => $data['period_label'],
            'generated_at' => Carbon::now()->format('d M Y, h:i A'),
            'summary' => $data['summary_cards'],
            'breakdown' => $data['breakdown'],
            'rows' => $data['rows'],
        ];

        return $this->generatePdfResponse($filename, $viewData);
    }
}
