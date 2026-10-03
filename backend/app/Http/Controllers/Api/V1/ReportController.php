<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Reports\ReportFactory;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    protected function validateReportFilters(Request $request): \Illuminate\Validation\Validator
    {
        return Validator::make($request->all(), [
            'report_type' => ['required', 'string', 'in:expense,income,summary,category,budget,goal,transaction,monthly,analytics'],
            'period' => ['nullable', 'string', 'in:today,last_7_days,last_30_days,current_month,previous_month,last_3_months,last_6_months,current_year,previous_year,custom'],
            'from_date' => ['nullable', 'required_if:period,custom', 'date'],
            'to_date' => ['nullable', 'required_if:period,custom', 'date', 'after_or_equal:from_date'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'payment_method' => ['nullable', 'string', 'in:cash,credit_card,debit_card,upi,bank_transfer,other'],
            'transaction_type' => ['nullable', 'string', 'in:income,expense,both'],
            'income_type' => ['nullable', 'string'],
            'min_amount' => ['nullable', 'numeric', 'min:0'],
            'max_amount' => ['nullable', 'numeric', 'gte:min_amount'],
            'budget_id' => ['nullable', 'integer', 'exists:budgets,id'],
            'goal_id' => ['nullable', 'integer', 'exists:financial_goals,id'],
            'search' => ['nullable', 'string', 'max:255'],
        ]);
    }

    /**
     * List supported report types.
     * GET /api/v1/reports/types
     */
    public function getTypes(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Report types retrieved successfully',
            'data' => ReportFactory::getSupportedTypes(),
        ], 200);
    }

    /**
     * Preview report data before downloading.
     * POST /api/v1/reports/preview
     */
    public function preview(Request $request): JsonResponse
    {
        $validator = $this->validateReportFilters($request);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed for report request.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $userId = $request->user()->id;
            $reportType = $request->input('report_type', 'expense');
            $filters = $request->all();

            $service = ReportFactory::create($reportType);
            $data = $service->getReportData($userId, $filters);

            return response()->json([
                'success' => true,
                'message' => 'Report preview generated successfully',
                'data' => $data,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => new \stdClass(),
            ], 500);
        }
    }

    /**
     * Stream CSV export.
     * POST /api/v1/reports/export/csv
     */
    public function exportCsv(Request $request)
    {
        $validator = $this->validateReportFilters($request);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed for CSV export request.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->user();
            $reportType = $request->input('report_type', 'expense');
            $filters = $request->all();

            $service = ReportFactory::create($reportType);

            AuditLogService::log('report_exported_csv', $user->id, 'Report', null, ['report_type' => $reportType]);

            return $service->exportCsv($user->id, $filters);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => new \stdClass(),
            ], 500);
        }
    }

    /**
     * Download PDF export.
     * POST /api/v1/reports/export/pdf
     */
    public function exportPdf(Request $request)
    {
        $validator = $this->validateReportFilters($request);
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed for PDF export request.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = $request->user();
            $reportType = $request->input('report_type', 'expense');
            $filters = $request->all();

            $service = ReportFactory::create($reportType);

            AuditLogService::log('report_exported_pdf', $user->id, 'Report', null, ['report_type' => $reportType]);

            return $service->exportPdf($user->id, $filters, $user->name, $user->email);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => new \stdClass(),
            ], 500);
        }
    }
}
