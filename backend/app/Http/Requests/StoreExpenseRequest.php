<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'category_id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) use ($userId) {
                    $category = Category::where('id', $value)->forUser($userId)->first();
                    if (!$category) {
                        $fail('The selected category is invalid or inaccessible.');
                        return;
                    }
                    if ($category->type !== 'expense') {
                        $fail('The selected category must be an expense category.');
                    }
                },
            ],
            'amount' => ['required', 'numeric', 'gt:0'],
            'description' => ['required', 'string', 'max:255'],
            'expense_date' => ['required', 'date'],
            'payment_method' => ['required', 'string', 'in:cash,credit_card,debit_card,upi,bank_transfer,other'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
