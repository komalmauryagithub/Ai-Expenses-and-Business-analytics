<?php

namespace App\Services\Reports;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ExpenseReportService extends BaseReportService
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
        if (!empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }
        if (isset($filters['min_amount']) && is_numeric($filters['min_amount'])) {
            $query->where('amount', '>=', $filters['min_amount']);
        }
        if (isset($filters['max_amount']) && is_numeric($filters['max_amount'])) {
            $query->where('amount', '<=', $filters['max_amount']);
        }
        if (!empty($filters['search'])) {
            $query->where('description', 'ilike', '%' . $filters['search'] . '%');
        }

        $expenses = $query->orderBy('expense_date', 'desc')->get();

        $totalAmount = (float) $expenses->sum('amount');
        $count = $expenses->count();
        $avgAmount = $count > 0 ? $totalAmount / $count : 0;

        // Category breakdown
        $categoryBreakdown = $expenses->groupBy('category_id')->map(function ($group) use ($totalAmount) {
            $catName = $group->first()->category ? $group->first()->category->name : 'Uncategorized';
            $sum = (float) $group->sum('amount');
            $pct = $totalAmount > 0 ? round(($sum / $totalAmount) * 100, 2) : 0;
            return [
                'name' => $catName,
                'count' => $group->count(),
                'amount' => $sum,
                'amount_formatted' => 'Rs. ' . number_format($sum, 2),
                'percentage' => $pct,
            ];
        })->values()->sortByDesc('amount')->values()->toArray();

        // Payment method breakdown
        $paymentBreakdown = $expenses->groupBy('payment_method')->map(function ($group) use ($totalAmount) {
            $method = ucfirst(str_replace('_', ' ', $group->first()->payment_method));
            $sum = (float) $group->sum('amount');
            $pct = $totalAmount > 0 ? round(($sum / $totalAmount) * 100, 2) : 0;
            return [
                'name' => $method,
                'count' => $group->count(),
                'amount' => $sum,
                'amount_formatted' => 'Rs. ' . number_format($sum, 2),
                'percentage' => $pct,
            ];
        })->values()->sortByDesc('amount')->values()->toArray();

        // Standardized rows
        $rows = $expenses->map(function ($item) {
            return [
                'id' => $item->id,
                'date' => $item->expense_date->format('Y-m-d'),
                'description' => $item->description,
                'category' => $item->category ? $item->category->name : 'Uncategorized',
                'method_or_source' => ucfirst(str_replace('_', ' ', $item->payment_method)),
                'amount' => (float) $item->amount,
                'amount_formatted' => '-Rs. ' . number_format($item->amount, 2),
                'notes' => $item->notes ?? '',
            ];
        })->toArray();

        return [
            'report_type' => 'expense',
            'title' => 'Expense Report',
            'period_label' => $start->format('d M Y') . ' to ' . $end->format('d M Y'),
            'summary_cards' => [
                ['label' => 'Total Expenses', 'value' => 'Rs. ' . number_format($totalAmount, 2)],
                ['label' => 'Transaction Count', 'value' => (string) $count],
                ['label' => 'Average Expense', 'value' => 'Rs. ' . number_format($avgAmount, 2)],
            ],
            'breakdown' => $categoryBreakdown,
            'payment_breakdown' => $paymentBreakdown,
            'rows' => $rows,
            'total_amount' => $totalAmount,
            'total_count' => $count,
        ];
    }

    public function exportCsv(int $userId, array $filters)
    {
        $report = $this->getReportData($userId, $filters);
        $filename = 'expense-report-' . Carbon::now()->format('Y-m-d-His') . '.csv';
        $csvHeaders = ['Date', 'Description', 'Category', 'Payment Method', 'Amount (INR)', 'Notes'];

        $generator = function () use ($report) {
            foreach ($report['rows'] as $row) {
                yield [
                    $row['date'],
                    $row['description'],
                    $row['category'],
                    $row['method_or_source'],
                    $row['amount'],
                    $row['notes'],
                ];
            }
        };

        return $this->streamCsvResponse($filename, $csvHeaders, $generator);
    }

    public function exportPdf(int $userId, array $filters, string $userName, string $userEmail)
    {
        $data = $this->getReportData($userId, $filters);
        $filename = 'expense-report-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        $viewData = [
            'title' => 'Expense Financial Report',
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
