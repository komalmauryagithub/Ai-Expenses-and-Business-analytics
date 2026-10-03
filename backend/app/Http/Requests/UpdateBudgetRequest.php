<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'amount' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date', 'after_or_equal:start_date'],
            'alert_threshold' => ['nullable', 'numeric', 'min:1', 'max:100'],
            'category_id' => [
                'nullable',
                'integer',
                function ($attribute, $value, $fail) use ($userId) {
                    if (!$value) return;
                    $category = Category::where('id', $value)->forUser($userId)->first();
                    if (!$category) {
                        $fail('The selected category is invalid or inaccessible.');
                        return;
                    }
                    if ($category->type !== 'expense') {
                        $fail('Budgets can only be assigned to expense categories.');
                    }
                },
            ],
        ];
    }
}
