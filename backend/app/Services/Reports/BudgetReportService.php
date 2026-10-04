<?php

namespace App\Services\Reports;

use App\Models\Budget;
use App\Models\Expense;
use Carbon\Carbon;

class BudgetReportService extends BaseReportService
{
    public function getReportData(int $userId, array $filters): array
    {
        $query = Budget::where('user_id', $userId)->with('category');

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (!empty($filters['budget_id'])) {
            $query->where('id', $filters['budget_id']);
        }

        $budgets = $query->orderBy('start_date', 'desc')->get();

        $totalAllocated = 0;
        $totalSpent = 0;

        $rows = $budgets->map(function ($b) use (&$totalAllocated, &$totalSpent) {
            $allocated = (float) $b->amount;
            $totalAllocated += $allocated;

            // Compute actual spending in budget window
            $spent = (float) Expense::where('user_id', $b->user_id)
                ->where('category_id', $b->category_id)
                ->whereBetween('expense_date', [$b->start_date->toDateString(), $b->end_date->toDateString()])
                ->sum('amount');
            $totalSpent += $spent;

            $remaining = $allocated - $spent;
            $usagePct = $allocated > 0 ? round(($spent / $allocated) * 100, 2) : 0;
            $threshold = (float) ($b->alert_threshold ?? 80.0);

            $status = 'under_budget';
            if ($spent > $allocated) {
                $status = 'over_budget';
            } elseif ($usagePct >= $threshold) {
                $status = 'near_limit';
            }

            return [
                'id' => $b->id,
                'date' => $b->start_date->format('Y-m-d') . ' to ' . $b->end_date->format('Y-m-d'),
                'description' => $b->name,
                'category' => $b->category ? $b->category->name : 'All Categories',
                'method_or_source' => strtoupper(str_replace('_', ' ', $status)),
                'amount' => $allocated,
                'amount_formatted' => 'Rs. ' . number_format($allocated, 2),
                'spent' => $spent,
                'spent_formatted' => 'Rs. ' . number_format($spent, 2),
                'remaining' => $remaining,
                'remaining_formatted' => 'Rs. ' . number_format($remaining, 2),
                'usage_percentage' => $usagePct,
                'status' => $status,
            ];
        })->toArray();

        $overallUsage = $totalAllocated > 0 ? round(($totalSpent / $totalAllocated) * 100, 2) : 0;

        return [
            'report_type' => 'budget',
            'title' => 'Budget Performance Report',
            'period_label' => 'Active & Historical Budgets',
            'summary_cards' => [
                ['label' => 'Total Allocated Budget', 'value' => 'Rs. ' . number_format($totalAllocated, 2)],
                ['label' => 'Total Actual Spent', 'value' => 'Rs. ' . number_format($totalSpent, 2)],
                ['label' => 'Overall Utilization', 'value' => $overallUsage . '%'],
            ],
            'breakdown' => array_map(fn($r) => [
                'name' => $r['description'] . ' (' . $r['category'] . ')',
                'count' => 1,
                'percentage' => $r['usage_percentage'],
                'amount_formatted' => $r['spent_formatted'] . ' / ' . $r['amount_formatted'],
            ], $rows),
            'rows' => $rows,
        ];
    }

    public function exportCsv(int $userId, array $filters)
    {
        $report = $this->getReportData($userId, $filters);
        $filename = 'budget-performance-' . Carbon::now()->format('Y-m-d-His') . '.csv';
        $csvHeaders = ['Budget Name', 'Category', 'Allocated (INR)', 'Spent (INR)', 'Remaining (INR)', 'Utilization (%)', 'Status', 'Window'];

        $generator = function () use ($report) {
            foreach ($report['rows'] as $row) {
                yield [
                    $row['description'],
                    $row['category'],
                    $row['amount'],
                    $row['spent'],
                    $row['remaining'],
                    $row['usage_percentage'],
                    $row['status'],
                    $row['date'],
                ];
            }
        };

        return $this->streamCsvResponse($filename, $csvHeaders, $generator);
    }

    public function exportPdf(int $userId, array $filters, string $userName, string $userEmail)
    {
        $data = $this->getReportData($userId, $filters);
        $filename = 'budget-performance-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        $viewData = [
            'title' => 'Budget Performance & Utilization Report',
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
