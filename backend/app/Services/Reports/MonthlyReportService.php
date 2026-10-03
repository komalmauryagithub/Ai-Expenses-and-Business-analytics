<?php

namespace App\Services\Reports;

use App\Models\Expense;
use App\Models\Income;
use App\Models\Budget;
use App\Models\FinancialGoal;
use Carbon\Carbon;

class MonthlyReportService extends BaseReportService
{
    public function getReportData(int $userId, array $filters): array
    {
        [$start, $end] = $this->resolveDateRange(
            $filters['period'] ?? 'current_month',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null
        );

        $totalIncome = (float) Income::where('user_id', $userId)
            ->whereBetween('income_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount');

        $totalExpenses = (float) Expense::where('user_id', $userId)
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount');

        $balance = $totalIncome - $totalExpenses;
        $savingsRate = $totalIncome > 0 ? round(($balance / $totalIncome) * 100, 2) : 0;

        $categoryBreakdown = Expense::where('user_id', $userId)
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->with('category')
            ->get()
            ->groupBy('category_id')
            ->map(function ($group) use ($totalExpenses) {
                $catName = $group->first()->category ? $group->first()->category->name : 'Uncategorized';
                $sum = (float) $group->sum('amount');
                $pct = $totalExpenses > 0 ? round(($sum / $totalExpenses) * 100, 2) : 0;
                return [
                    'name' => $catName,
                    'count' => $group->count(),
                    'percentage' => $pct,
                    'amount_formatted' => '₹' . number_format($sum, 2),
                ];
            })->values()->sortByDesc('amount_formatted')->values()->toArray();

        $rows = Expense::where('user_id', $userId)
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->with('category')
            ->orderBy('expense_date', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->expense_date->format('Y-m-d'),
                    'description' => $item->description,
                    'category' => $item->category ? $item->category->name : 'Uncategorized',
                    'method_or_source' => ucfirst(str_replace('_', ' ', $item->payment_method)),
                    'amount_formatted' => '-₹' . number_format($item->amount, 2),
                ];
            })->toArray();

        return [
            'report_type' => 'monthly',
            'title' => 'Monthly Financial Statement',
            'period_label' => $start->format('F Y'),
            'summary_cards' => [
                ['label' => 'Total Income', 'value' => '₹' . number_format($totalIncome, 2)],
                ['label' => 'Total Expenses', 'value' => '₹' . number_format($totalExpenses, 2)],
                ['label' => 'Net Balance', 'value' => '₹' . number_format($balance, 2)],
                ['label' => 'Savings Rate', 'value' => $savingsRate . '%'],
            ],
            'breakdown' => $categoryBreakdown,
            'rows' => $rows,
        ];
    }

    public function exportCsv(int $userId, array $filters)
    {
        $report = $this->getReportData($userId, $filters);
        $filename = 'monthly-statement-' . Carbon::now()->format('Y-m-d-His') . '.csv';
        $csvHeaders = ['Date', 'Description', 'Category', 'Payment Method', 'Amount (INR)'];

        $generator = function () use ($report) {
            foreach ($report['rows'] as $row) {
                yield [
                    $row['date'],
                    $row['description'],
                    $row['category'],
                    $row['method_or_source'],
                    $row['amount_formatted'],
                ];
            }
        };

        return $this->streamCsvResponse($filename, $csvHeaders, $generator);
    }

    public function exportPdf(int $userId, array $filters, string $userName, string $userEmail)
    {
        $data = $this->getReportData($userId, $filters);
        $filename = 'monthly-statement-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        $viewData = [
            'title' => 'Monthly Financial Statement',
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
