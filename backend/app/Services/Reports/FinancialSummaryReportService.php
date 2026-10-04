<?php

namespace App\Services\Reports;

use App\Models\Expense;
use App\Models\Income;
use Carbon\Carbon;

class FinancialSummaryReportService extends BaseReportService
{
    public function getReportData(int $userId, array $filters): array
    {
        [$start, $end] = $this->resolveDateRange(
            $filters['period'] ?? 'current_month',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null
        );

        $incomeQuery = Income::where('user_id', $userId)
            ->whereBetween('income_date', [$start->toDateString(), $end->toDateString()]);

        $expenseQuery = Expense::where('user_id', $userId)
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()]);

        $totalIncome = (float) $incomeQuery->sum('amount');
        $incomeCount = $incomeQuery->count();

        $totalExpenses = (float) $expenseQuery->sum('amount');
        $expenseCount = $expenseQuery->count();

        $balance = $totalIncome - $totalExpenses;
        $savings = max(0, $balance);
        $savingsRate = $totalIncome > 0 ? round(($savings / $totalIncome) * 100, 2) : 0;

        // Combined chronological transactions for summary
        $incomes = $incomeQuery->with('category')->get()->map(function ($item) {
            return [
                'date' => $item->income_date->format('Y-m-d'),
                'type' => 'Income',
                'description' => $item->source,
                'category' => $item->category ? $item->category->name : 'Income',
                'method_or_source' => ucfirst(str_replace('_', ' ', $item->type)),
                'amount' => (float) $item->amount,
                'amount_formatted' => '+Rs. ' . number_format($item->amount, 2),
            ];
        });

        $expenses = $expenseQuery->with('category')->get()->map(function ($item) {
            return [
                'date' => $item->expense_date->format('Y-m-d'),
                'type' => 'Expense',
                'description' => $item->description,
                'category' => $item->category ? $item->category->name : 'Uncategorized',
                'method_or_source' => ucfirst(str_replace('_', ' ', $item->payment_method)),
                'amount' => (float) $item->amount,
                'amount_formatted' => '-Rs. ' . number_format($item->amount, 2),
            ];
        });

        $rows = $incomes->concat($expenses)->sortByDesc('date')->values()->toArray();

        return [
            'report_type' => 'summary',
            'title' => 'Income vs Expense Financial Summary',
            'period_label' => $start->format('d M Y') . ' to ' . $end->format('d M Y'),
            'summary_cards' => [
                ['label' => 'Total Income', 'value' => 'Rs. ' . number_format($totalIncome, 2)],
                ['label' => 'Total Expenses', 'value' => 'Rs. ' . number_format($totalExpenses, 2)],
                ['label' => 'Net Balance', 'value' => 'Rs. ' . number_format($balance, 2)],
                ['label' => 'Savings Rate', 'value' => $savingsRate . '%'],
            ],
            'totals' => [
                'total_income' => $totalIncome,
                'total_expenses' => $totalExpenses,
                'balance' => $balance,
                'savings' => $savings,
                'savings_rate' => $savingsRate,
                'income_count' => $incomeCount,
                'expense_count' => $expenseCount,
            ],
            'rows' => $rows,
        ];
    }

    public function exportCsv(int $userId, array $filters)
    {
        $report = $this->getReportData($userId, $filters);
        $filename = 'income-vs-expense-' . Carbon::now()->format('Y-m-d-His') . '.csv';
        $csvHeaders = ['Date', 'Transaction Type', 'Description', 'Category', 'Method / Source', 'Amount (INR)'];

        $generator = function () use ($report) {
            foreach ($report['rows'] as $row) {
                yield [
                    $row['date'],
                    $row['type'],
                    $row['description'],
                    $row['category'],
                    $row['method_or_source'],
                    $row['amount'],
                ];
            }
        };

        return $this->streamCsvResponse($filename, $csvHeaders, $generator);
    }

    public function exportPdf(int $userId, array $filters, string $userName, string $userEmail)
    {
        $data = $this->getReportData($userId, $filters);
        $filename = 'income-vs-expense-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        $viewData = [
            'title' => 'Income vs Expense Summary Report',
            'user_name' => $userName,
            'user_email' => $userEmail,
            'period_label' => $data['period_label'],
            'generated_at' => Carbon::now()->format('d M Y, h:i A'),
            'summary' => $data['summary_cards'],
            'breakdown' => [],
            'rows' => $data['rows'],
        ];

        return $this->generatePdfResponse($filename, $viewData);
    }
}
