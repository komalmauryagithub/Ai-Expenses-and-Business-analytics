<?php

namespace App\Services\Reports;

use App\Services\AnalyticsMicroserviceService;

class ReportFactory
{
    public static function create(string $reportType): BaseReportService
    {
        switch (strtolower(trim($reportType))) {
            case 'income':
                return new IncomeReportService();
            case 'summary':
            case 'income_vs_expense':
                return new FinancialSummaryReportService();
            case 'category':
                return new CategoryReportService();
            case 'budget':
                return new BudgetReportService();
            case 'goal':
                return new GoalReportService();
            case 'transaction':
                return new TransactionReportService();
            case 'monthly':
                return new MonthlyReportService();
            case 'analytics':
                return new AnalyticsReportService(app(AnalyticsMicroserviceService::class));
            case 'expense':
            default:
                return new ExpenseReportService();
        }
    }

    public static function getSupportedTypes(): array
    {
        return [
            ['id' => 'expense', 'name' => 'Expense Report', 'description' => 'Detailed expense transaction breakdown by category and payment method.'],
            ['id' => 'income', 'name' => 'Income Report', 'description' => 'Income receipts grouped by source type and date.'],
            ['id' => 'summary', 'name' => 'Income vs Expense Report', 'description' => 'Net financial summary, balance, savings rate, and period metrics.'],
            ['id' => 'category', 'name' => 'Category Spending Report', 'description' => 'Category spending distribution, average transaction, and min/max stats.'],
            ['id' => 'budget', 'name' => 'Budget Performance Report', 'description' => 'Budget limit utilization, spent amount, remaining balance, and status.'],
            ['id' => 'goal', 'name' => 'Financial Goals Report', 'description' => 'Savings goals target, current deposits, completion %, and days remaining.'],
            ['id' => 'transaction', 'name' => 'Transaction Export', 'description' => 'Complete export of all income and expense records.'],
            ['id' => 'monthly', 'name' => 'Monthly Financial Report', 'description' => 'Comprehensive monthly financial statement.'],
            ['id' => 'analytics', 'name' => 'Analytics Report', 'description' => 'Pandas & NumPy trends, day-of-week patterns, and statistical IQR anomalies.'],
        ];
    }
}
