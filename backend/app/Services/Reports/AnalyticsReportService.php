<?php

namespace App\Services\Reports;

use App\Services\AnalyticsMicroserviceService;
use Carbon\Carbon;

class AnalyticsReportService extends BaseReportService
{
    protected AnalyticsMicroserviceService $analyticsService;

    public function __construct(AnalyticsMicroserviceService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function getReportData(int $userId, array $filters): array
    {
        $period = $filters['period'] ?? 'current_month';
        $fromDate = $filters['from_date'] ?? null;
        $toDate = $filters['to_date'] ?? null;

        [$start, $end] = $this->resolveDateRange($period, $fromDate, $toDate);

        try {
            $advFull = $this->analyticsService->getAdvancedFullAnalytics($userId, $period, $fromDate, $toDate);
        } catch (\Throwable $e) {
            $advFull = [];
        }

        $summary = $advFull['summary']['totals'] ?? [];
        $totalIncome = (float) ($summary['total_income'] ?? 0);
        $totalExpenses = (float) ($summary['total_expenses'] ?? 0);
        $balance = (float) ($summary['current_balance'] ?? 0);
        $savingsRate = (float) ($summary['savings_rate'] ?? 0);

        $anomaliesCount = $advFull['anomalies']['total_anomalies_found'] ?? 0;
        $iqrThreshold = $advFull['anomalies']['upper_threshold_amount'] ?? 0;

        $rows = [];
        if (!empty($advFull['anomalies']['anomalies'])) {
            foreach ($advFull['anomalies']['anomalies'] as $anom) {
                $rows[] = [
                    'date' => $anom['date'],
                    'description' => $anom['description'] . ' (Statistical IQR Outlier)',
                    'category' => $anom['category'],
                    'method_or_source' => $anom['payment_method'],
                    'amount_formatted' => '-Rs. ' . number_format($anom['amount'], 2),
                ];
            }
        } else {
            $rows[] = [
                'date' => $start->format('Y-m-d'),
                'description' => 'Statistical Analysis',
                'category' => 'Pandas Engine',
                'method_or_source' => 'IQR Rule ($Q3 + 1.5 \\times \\text{IQR}$)',
                'amount_formatted' => 'Rs. 0.00 Outliers',
            ];
        }

        return [
            'report_type' => 'analytics',
            'title' => 'Deterministic Analytics Report',
            'period_label' => $start->format('d M Y') . ' to ' . $end->format('d M Y'),
            'summary_cards' => [
                ['label' => 'Total Outflow', 'value' => 'Rs. ' . number_format($totalExpenses, 2)],
                ['label' => 'Net Balance', 'value' => 'Rs. ' . number_format($balance, 2)],
                ['label' => 'IQR Upper Threshold', 'value' => 'Rs. ' . number_format($iqrThreshold, 2)],
                ['label' => 'Anomalies Flagged', 'value' => (string) $anomaliesCount],
            ],
            'breakdown' => array_map(fn($pm) => [
                'name' => $pm['payment_method'],
                'count' => $pm['count'],
                'percentage' => $pm['percentage'],
                'amount_formatted' => 'Rs. ' . number_format($pm['amount'], 2),
            ], $advFull['expense_analytics']['payment_methods'] ?? []),
            'rows' => $rows,
        ];
    }

    public function exportCsv(int $userId, array $filters)
    {
        $report = $this->getReportData($userId, $filters);
        $filename = 'analytics-report-' . Carbon::now()->format('Y-m-d-His') . '.csv';
        $csvHeaders = ['Date', 'Analysis Detail', 'Category', 'Method / Rule', 'Metric / Outlier Amount'];

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
        $filename = 'analytics-report-' . Carbon::now()->format('Y-m-d-His') . '.pdf';

        $viewData = [
            'title' => 'Deterministic Analytics & Statistical Report',
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
