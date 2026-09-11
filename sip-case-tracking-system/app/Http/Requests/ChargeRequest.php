<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'case_record_id' => 'required|exists:cases,id',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01|max:99999999.99',
            'status' => 'nullable|in:pending,paid,waived',
        ];
    }
}
