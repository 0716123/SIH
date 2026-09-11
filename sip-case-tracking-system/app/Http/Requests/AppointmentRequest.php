<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class AppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => [
                'required',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'doctor')->where('is_active', true)),
            ],
            'scheduled_at' => 'required|date',
            'reason' => 'required|string|max:255',
            'type' => 'required|string|in:consultation,follow_up,emergency',
            'status' => 'nullable|string|in:scheduled,completed,cancelled,no_show',
            'remarks' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.required' => 'Patient selection is required.',
            'doctor_id.required' => 'Doctor selection is required.',
            'scheduled_at.required' => 'Appointment date and time are required.',
            'type.in' => 'Appointment type must be consultation, follow_up, or emergency.',
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
