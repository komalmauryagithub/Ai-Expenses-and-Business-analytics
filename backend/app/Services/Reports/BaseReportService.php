<?php

namespace App\Services\Reports;

use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

abstract class BaseReportService
{
    /**
     * Resolve date range for report period filter.
     */
    public function resolveDateRange(string $period = 'current_month', ?string $fromDateInput = null, ?string $toDateInput = null): array
    {
        $now = Carbon::now();

        switch ($period) {
            case 'today':
                $start = $now->copy()->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'last_7_days':
                $start = $now->copy()->subDays(6)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'last_30_days':
                $start = $now->copy()->subDays(29)->startOfDay();
                $end = $now->copy()->endOfDay();
                break;
            case 'previous_month':
                $start = $now->copy()->subMonth()->startOfMonth();
                $end = $now->copy()->subMonth()->endOfMonth();
                break;
            case 'last_3_months':
                $start = $now->copy()->subMonths(2)->startOfMonth();
                $end = $now->copy()->endOfMonth();
                break;
            case 'last_6_months':
                $start = $now->copy()->subMonths(5)->startOfMonth();
                $end = $now->copy()->endOfMonth();
                break;
            case 'current_year':
                $start = $now->copy()->startOfYear();
                $end = $now->copy()->endOfYear();
                break;
            case 'previous_year':
                $start = $now->copy()->subYear()->startOfYear();
                $end = $now->copy()->subYear()->endOfYear();
                break;
            case 'custom':
                $start = $fromDateInput ? Carbon::parse($fromDateInput)->startOfDay() : $now->copy()->startOfMonth();
                $end = $toDateInput ? Carbon::parse($toDateInput)->endOfDay() : $now->copy()->endOfMonth();
                if ($start->gt($end)) {
                    $tmp = $start;
                    $start = $end->copy()->startOfDay();
                    $end = $tmp->copy()->endOfDay();
                }
                break;
            case 'current_month':
            default:
                $start = $now->copy()->startOfMonth();
                $end = $now->copy()->endOfMonth();
                break;
        }

        return [$start, $end];
    }

    /**
     * Prevent CSV Formula Injection by prepending a single quote to dangerous leading characters.
     */
    public function sanitizeCsvCell(mixed $val): string
    {
        if ($val === null) {
            return '';
        }
        $str = (string) $val;
        if (strlen($str) > 0 && in_array($str[0], ['=', '+', '-', '@'])) {
            return "'" . $str;
        }
        return $str;
    }

    /**
     * Stream CSV download using chunking/generator for low memory footprint.
     */
    public function streamCsvResponse(string $filename, array $csvHeaders, \Closure $rowsGenerator): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($csvHeaders, $rowsGenerator) {
            $handle = fopen('php://output', 'w');
            
            // Write UTF-8 BOM for Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");
            
            // Write header row
            fputcsv($handle, array_map([$this, 'sanitizeCsvCell'], $csvHeaders));

            // Yield rows from generator callback
            foreach ($rowsGenerator() as $row) {
                $sanitizedRow = array_map([$this, 'sanitizeCsvCell'], $row);
                fputcsv($handle, $sanitizedRow);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Render PDF binary download using DomPDF.
     */
    public function generatePdfResponse(string $filename, array $viewData, string $viewName = 'reports.pdf_template')
    {
        $pdf = Pdf::loadView($viewName, $viewData);
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true]);

        return $pdf->download($filename);
    }
}
