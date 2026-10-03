<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
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
                'sometimes',
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
            'amount' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'description' => ['sometimes', 'required', 'string', 'max:255'],
            'expense_date' => ['sometimes', 'required', 'date'],
            'payment_method' => ['sometimes', 'required', 'string', 'in:cash,credit_card,debit_card,upi,bank_transfer,other'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
