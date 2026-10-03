<?php

namespace App\Services\Reports;

use App\Models\Income;
use Carbon\Carbon;

class IncomeReportService extends BaseReportService
{
    public function getReportData(int $userId, array $filters): array
    {
        [$start, $end] = $this->resolveDateRange(
            $filters['period'] ?? 'current_month',
            $filters['from_date'] ?? null,
            $filters['to_date'] ?? null
        );

        $query = Income::where('user_id', $userId)
            ->whereBetween('income_date', [$start->toDateString(), $end->toDateString()])
            ->with('category');

        if (!empty($filters['income_type'])) {
            $query->where('type', $filters['income_type']);
        }
        if (isset($filters['min_amount']) && is_numeric($filters['min_amount'])) {
            $query->where('amount', '>=', $filters['min_amount']);
        }
        if (isset($filters['max_amount']) && is_numeric($filters['max_amount'])) {
            $query->where('amount', '<=', $filters['max_amount']);
        }
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('source', 'ilike', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'ilike', '%' . $filters['search'] . '%');
            });
        }

        $incomeRecords = $query->orderBy('income_date', 'desc')->get();

        $totalAmount = (float) $incomeRecords->sum('amount');
        $count = $incomeRecords->count();
        $avgAmount = $count > 0 ? $totalAmount / $count : 0;

        // Income type breakdown
        $typeBreakdown = $incomeRecords->groupBy('type')->map(function ($group) use ($totalAmount) {
            $typeStr = ucfirst(str_replace('_', ' ', $group->first()->type));
            $sum = (float) $group->sum('amount');
            $pct = $totalAmount > 0 ? round(($sum / $totalAmount) * 100, 2) : 0;
            return [
                'name' => $typeStr,
                'count' => $group->count(),
                'amount' => $sum,
                'amount_formatted' => '₹' . number_format($sum, 2),
                'percentage' => $pct,
            ];
        })->values()->sortByDesc('amount')->values()->toArray();

        $rows = $incomeRecords->map(function ($item) {
            return [
                'id' => $item->id,
                'date' => $item->income_date->format('Y-m-d'),
                'description' => $item->source . ($item->description ? ' (' . $item->description . ')' : ''),
                'category' => $item->category ? $item->category->name : 'Income',
                'method_or_source' => ucfirst(str_replace('_', ' ', $item->type)),
                'amount' => (float) $item->amount,
                'amount_formatted' => '+₹' . number_format($item->amount, 2),
                'notes' => $item->description ?? '',
            ];
        })->toArray();

        return [
            'report_type' => 'income',
            'title' => 'Income Report',
            'period_label' => $start->format('d M Y') . ' to ' . $end->format('d M Y'),
            'summary_cards' => [
                ['label' => 'Total Income', 'value' => '₹' . number_format($totalAmount, 2)],
                ['label' => 'Income Entries', 'value' => (string) $count],
                ['label' => 'Average Deposit', 'value' => '₹' . number_format($avgAmount, 2)],
            ],
            'breakdown' => $typeBreakdown,
            'rows' => $rows,
            'total_amount' => $totalAmount,
            'total_count' => $count,
        ];
    }

    public function exportCsv(int $userId, array $filters)
    {
        $report = $this->getReportData($userId, $filters);
        $filename = 'income-report-' . Carbon::now()->format('Y-m-d-His') . '.csv';
        $csvHeaders = ['Date', 'Source/Description', 'Category', 'Income Type', 'Amount (INR)', 'Notes'];

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
        $filename = 'income-report-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        $viewData = [
            'title' => 'Income Financial Report',
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
