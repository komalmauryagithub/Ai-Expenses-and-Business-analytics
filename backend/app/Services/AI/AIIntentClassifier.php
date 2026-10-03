<?php

namespace App\Services\AI;

use Illuminate\Support\Str;

class AIIntentClassifier
{
    /**
     * Classify user query string into a structured intent category.
     */
    public function classify(string $message): string
    {
        $normalized = Str::lower(trim($message));

        if (Str::contains($normalized, ['unusual', 'anomaly', 'anomalies', 'outlier', 'outliers', 'suspicious', 'spike', 'strange'])) {
            return 'anomaly';
        }

        if (Str::contains($normalized, ['compare', 'versus', 'vs', 'last month', 'previous month', 'changed', 'change from', 'increase', 'decrease', 'growth'])) {
            return 'comparison';
        }

        if (Str::contains($normalized, ['budget', 'budgets', 'limit', 'remaining budget', 'over budget'])) {
            return 'budget';
        }

        if (Str::contains($normalized, ['goal', 'goals', 'target', 'deposit', 'contribute', 'emergency fund', 'savings target'])) {
            return 'goal';
        }

        if (Str::contains($normalized, ['payment method', 'credit card', 'upi', 'cash', 'debit card', 'bank transfer'])) {
            return 'payment_method';
        }

        if (Str::contains($normalized, ['pattern', 'trend', 'day of week', 'peak day', 'highest spending day', 'which day'])) {
            return 'trend';
        }

        if (Str::contains($normalized, ['category', 'categories', 'food', 'rent', 'shopping', 'groceries', 'travel', 'utility', 'entertainment'])) {
            return 'category';
        }

        if (Str::contains($normalized, ['income', 'salary', 'earned', 'earning', 'revenue', 'received', 'inflow'])) {
            return 'income';
        }

        if (Str::contains($normalized, ['spent', 'spending', 'expense', 'expenses', 'outflow', 'cost', 'where did i spend', 'biggest expense'])) {
            return 'expenses';
        }

        if (Str::contains($normalized, ['summary', 'summarize', 'overview', 'overall', 'balance', 'savings rate', 'how am i doing', 'financial health'])) {
            return 'summary';
        }

        if (Str::contains($normalized, ['what is', 'how to', 'explain savings rate', 'what does', 'definition', 'tips to save'])) {
            return 'general_finance';
        }

        return 'unknown';
    }
}
