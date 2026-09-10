<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class TreatmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'case_record_id' => 'required|exists:cases,id',
            'doctor_id' => 'nullable|exists:users,id',
            'treatment_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'procedure_details' => 'nullable|string',
            'outcome' => 'nullable|string',
            'status' => 'nullable|string|in:planned,in_progress,completed,discontinued',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',

            // Prescriptions associated with this treatment
            'prescriptions' => 'nullable|array',
            'prescriptions.*.medicine_name' => 'required_with:prescriptions|string|max:255',
            'prescriptions.*.dosage' => 'required_with:prescriptions|string|max:100',
            'prescriptions.*.frequency' => 'required_with:prescriptions|string|max:100',
            'prescriptions.*.route' => 'nullable|string|max:50',
            'prescriptions.*.duration' => 'nullable|string|max:100',
            'prescriptions.*.instructions' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'case_record_id.required' => 'Case reference is required.',
            'treatment_name.required' => 'Treatment name or plan is required.',
            'end_date.after_or_equal' => 'End date cannot be earlier than the start date.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        if ($this->expectsJson() || $this->is('api/*')) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], 422));
        }

        parent::failedValidation($validator);
    }
}
