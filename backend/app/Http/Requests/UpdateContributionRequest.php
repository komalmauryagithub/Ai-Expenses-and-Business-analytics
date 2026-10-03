<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateContributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['sometimes', 'required', 'numeric', 'gt:0'],
            'contribution_date' => ['sometimes', 'required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
