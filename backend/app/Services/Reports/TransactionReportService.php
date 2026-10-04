<?php

namespace App\Services\Reports;

use App\Models\Expense;
use App\Models\Income;
use Carbon\Carbon;

class TransactionReportService extends BaseReportService
{
    public function getReportData(int $userId, array $filters): array
    {
        [$start, $end] = $this->resolveDateRange(
            $filters['period'] ?? 'current_month',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null
        );

        $txnType = $filters['transaction_type'] ?? 'both'; // 'income' | 'expense' | 'both'

        $rows = [];
        $totalIncome = 0;
        $totalExpenses = 0;

        if (in_array($txnType, ['income', 'both'])) {
            $incQuery = Income::where('user_id', $userId)
                ->whereBetween('income_date', [$start->toDateString(), $end->toDateString()])
                ->with('category');

            if (!empty($filters['category_id'])) {
                $incQuery->where('category_id', $filters['category_id']);
            }
            if (isset($filters['min_amount']) && is_numeric($filters['min_amount'])) {
                $incQuery->where('amount', '>=', $filters['min_amount']);
            }
            if (isset($filters['max_amount']) && is_numeric($filters['max_amount'])) {
                $incQuery->where('amount', '<=', $filters['max_amount']);
            }
            if (!empty($filters['search'])) {
                $incQuery->where(function ($q) use ($filters) {
                    $q->where('source', 'ilike', '%' . $filters['search'] . '%')
                      ->orWhere('description', 'ilike', '%' . $filters['search'] . '%');
                });
            }

            foreach ($incQuery->get() as $item) {
                $amt = (float) $item->amount;
                $totalIncome += $amt;
                $rows[] = [
                    'id' => 'inc_' . $item->id,
                    'date' => $item->income_date->format('Y-m-d'),
                    'type' => 'Income',
                    'description' => $item->source . ($item->description ? ' (' . $item->description . ')' : ''),
                    'category' => $item->category ? $item->category->name : 'Income',
                    'method_or_source' => ucfirst(str_replace('_', ' ', $item->type)),
                    'amount' => $amt,
                    'amount_formatted' => '+Rs. ' . number_format($amt, 2),
                ];
            }
        }

        if (in_array($txnType, ['expense', 'both'])) {
            $expQuery = Expense::where('user_id', $userId)
                ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
                ->with('category');

            if (!empty($filters['category_id'])) {
                $expQuery->where('category_id', $filters['category_id']);
            }
            if (!empty($filters['payment_method'])) {
                $expQuery->where('payment_method', $filters['payment_method']);
            }
            if (isset($filters['min_amount']) && is_numeric($filters['min_amount'])) {
                $expQuery->where('amount', '>=', $filters['min_amount']);
            }
            if (isset($filters['max_amount']) && is_numeric($filters['max_amount'])) {
                $expQuery->where('amount', '<=', $filters['max_amount']);
            }
            if (!empty($filters['search'])) {
                $expQuery->where('description', 'ilike', '%' . $filters['search'] . '%');
            }

            foreach ($expQuery->get() as $item) {
                $amt = (float) $item->amount;
                $totalExpenses += $amt;
                $rows[] = [
                    'id' => 'exp_' . $item->id,
                    'date' => $item->expense_date->format('Y-m-d'),
                    'type' => 'Expense',
                    'description' => $item->description,
                    'category' => $item->category ? $item->category->name : 'Uncategorized',
                    'method_or_source' => ucfirst(str_replace('_', ' ', $item->payment_method)),
                    'amount' => $amt,
                    'amount_formatted' => '-Rs. ' . number_format($amt, 2),
                ];
            }
        }

        // Sort rows by date descending
        usort($rows, fn($a, $b) => strcmp($b['date'], $a['date']));

        return [
            'report_type' => 'transaction',
            'title' => 'Detailed Transaction Export',
            'period_label' => $start->format('d M Y') . ' to ' . $end->format('d M Y'),
            'summary_cards' => [
                ['label' => 'Total Transactions', 'value' => (string) count($rows)],
                ['label' => 'Total Inflow', 'value' => 'Rs. ' . number_format($totalIncome, 2)],
                ['label' => 'Total Outflow', 'value' => 'Rs. ' . number_format($totalExpenses, 2)],
            ],
            'breakdown' => [],
            'rows' => $rows,
        ];
    }

    public function exportCsv(int $userId, array $filters)
    {
        $report = $this->getReportData($userId, $filters);
        $filename = 'transaction-export-' . Carbon::now()->format('Y-m-d-His') . '.csv';
        $csvHeaders = ['Date', 'Type', 'Description', 'Category', 'Method / Source', 'Amount (INR)'];

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
        $filename = 'transaction-export-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        $viewData = [
            'title' => 'Detailed Transaction Export Report',
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
