<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class PatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $patientId = $this->route('patient') ? (is_object($this->route('patient')) ? $this->route('patient')->id : $this->route('patient')) : null;

        return [
            'uhid' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('patients', 'uhid')->ignore($patientId),
            ],
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'gender' => 'required|string|in:male,female,other',
            'dob' => 'nullable|date|before_or_equal:today',
            'age' => 'required_without:dob|nullable|integer|min:0|max:130',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'phone' => 'required|string|max:20',
            'email' => [
                'nullable',
                'email',
                'max:150',
                Rule::unique('patients', 'email')->ignore($patientId),
            ],
            'primary_doctor_id' => [
                'nullable',
                Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'doctor')->where('is_active', true)),
            ],
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'emergency_contact_name' => 'nullable|string|max:100',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
            'allergies' => 'nullable|string|max:1000',
            'chronic_diseases' => 'nullable|string|max:1000',
            'past_surgeries' => 'nullable|string|max:2000',
            'current_medications' => 'nullable|string|max:2000',
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'Patient first name is required.',
            'last_name.required' => 'Patient last name is required.',
            'phone.required' => 'Patient contact number is required.',
            'gender.in' => 'Gender must be male, female, or other.',
            'blood_group.in' => 'Please provide a valid blood group (e.g. A+, O+, B-).',
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
