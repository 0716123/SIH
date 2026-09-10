<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class CaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'diagnosis' => 'nullable|string',
            'severity' => 'required|string|in:mild,moderate,severe,critical',
            'status' => 'nullable|string|in:open,in_progress,closed,referred',
            'admission_date' => 'nullable|date',
            'discharge_date' => 'nullable|date|after_or_equal:admission_date',
            'closure_notes' => 'nullable|string',
            
            // Nested symptoms
            'symptoms' => 'nullable|array',
            'symptoms.*.symptom_id' => 'required_with:symptoms|exists:symptoms,id',
            'symptoms.*.severity' => 'nullable|string|in:mild,moderate,severe',
            'symptoms.*.duration_days' => 'nullable|integer|min:0',
            'symptoms.*.notes' => 'nullable|string|max:500',

            // Optional uploaded documents
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png,docx,txt|max:10240',
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.required' => 'Patient selection is required.',
            'doctor_id.required' => 'Attending doctor selection is required.',
            'severity.in' => 'Severity level must be mild, moderate, severe, or critical.',
            'discharge_date.after_or_equal' => 'Discharge date must be on or after the admission date.',
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
