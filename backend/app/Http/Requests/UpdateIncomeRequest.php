<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class UpdateIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'amount' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'source' => ['sometimes', 'required', 'string', 'max:255'],
            'income_date' => ['sometimes', 'required', 'date'],
            'type' => ['sometimes', 'required', 'string', 'in:salary,freelance,business,investment,bonus,other'],
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
                    if ($category->type !== 'income') {
                        $fail('The selected category must be an income category.');
                    }
                },
            ],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
