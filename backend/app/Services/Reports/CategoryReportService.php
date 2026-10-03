<?php

namespace App\Services\Reports;

use App\Models\Expense;
use App\Models\Category;
use Carbon\Carbon;

class CategoryReportService extends BaseReportService
{
    public function getReportData(int $userId, array $filters): array
    {
        [$start, $end] = $this->resolveDateRange(
            $filters['period'] ?? 'current_month',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null
        );

        $query = Expense::where('user_id', $userId)
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->with('category');

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (isset($filters['min_amount']) && is_numeric($filters['min_amount'])) {
            $query->where('amount', '>=', $filters['min_amount']);
        }
        if (isset($filters['max_amount']) && is_numeric($filters['max_amount'])) {
            $query->where('amount', '<=', $filters['max_amount']);
        }

        $expenses = $query->get();
        $grandTotal = (float) $expenses->sum('amount');
        $totalTxns = $expenses->count();

        $rows = $expenses->groupBy('category_id')->map(function ($group) use ($grandTotal) {
            $catName = $group->first()->category ? $group->first()->category->name : 'Uncategorized';
            $sum = (float) $group->sum('amount');
            $count = $group->count();
            $avg = $count > 0 ? $sum / $count : 0;
            $max = (float) $group->max('amount');
            $min = (float) $group->min('amount');
            $pct = $grandTotal > 0 ? round(($sum / $grandTotal) * 100, 2) : 0;

            return [
                'date' => Carbon::now()->toDateString(),
                'description' => "Category Analysis for {$catName}",
                'category' => $catName,
                'method_or_source' => "{$count} transactions",
                'amount' => $sum,
                'amount_formatted' => '₹' . number_format($sum, 2),
                'count' => $count,
                'percentage' => $pct,
                'average' => $avg,
                'max' => $max,
                'min' => $min,
            ];
        })->values()->sortByDesc('amount')->values()->toArray();

        return [
            'report_type' => 'category',
            'title' => 'Category Spending Report',
            'period_label' => $start->format('d M Y') . ' to ' . $end->format('d M Y'),
            'summary_cards' => [
                ['label' => 'Total Category Outflow', 'value' => '₹' . number_format($grandTotal, 2)],
                ['label' => 'Active Categories', 'value' => (string) count($rows)],
                ['label' => 'Total Transactions', 'value' => (string) $totalTxns],
            ],
            'breakdown' => array_map(fn($r) => [
                'name' => $r['category'],
                'count' => $r['count'],
                'percentage' => $r['percentage'],
                'amount_formatted' => $r['amount_formatted'],
            ], $rows),
            'rows' => $rows,
        ];
    }

    public function exportCsv(int $userId, array $filters)
    {
        $report = $this->getReportData($userId, $filters);
        $filename = 'category-spending-' . Carbon::now()->format('Y-m-d-His') . '.csv';
        $csvHeaders = ['Category Name', 'Total Spent (INR)', 'Txn Count', 'Share (%)', 'Average Txn', 'Highest Txn', 'Lowest Txn'];

        $generator = function () use ($report) {
            foreach ($report['rows'] as $row) {
                yield [
                    $row['category'],
                    $row['amount'],
                    $row['count'],
                    $row['percentage'],
                    $row['average'],
                    $row['max'],
                    $row['min'],
                ];
            }
        };

        return $this->streamCsvResponse($filename, $csvHeaders, $generator);
    }

    public function exportPdf(int $userId, array $filters, string $userName, string $userEmail)
    {
        $data = $this->getReportData($userId, $filters);
        $filename = 'category-spending-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        $viewData = [
            'title' => 'Category Spending Analysis Report',
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
