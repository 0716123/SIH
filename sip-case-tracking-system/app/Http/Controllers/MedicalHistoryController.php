<?php

namespace App\Http\Controllers;

use App\Models\MedicalHistory;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MedicalHistoryController extends Controller
{
    /**
     * Display medical history for a given patient
     */
    public function showByPatient(int $patientId): JsonResponse
    {
        $patient = Patient::find($patientId);

        if (!$patient) {
            return $this->sendError('Patient not found.');
        }

        $history = MedicalHistory::firstOrCreate(
            ['patient_id' => $patientId],
            [
                'allergies'           => [],
                'chronic_diseases'    => [],
                'past_surgeries'      => null,
                'family_history'      => null,
                'current_medications' => null,
                'lifestyle_notes'     => null,
            ]
        );

        return $this->sendResponse([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->full_name,
                'uhid' => $patient->uhid,
                'blood_group' => $patient->blood_group,
            ],
            'medical_history' => $history,
        ], 'Medical history retrieved successfully.');
    }

    /**
     * Update or create medical history for a patient
     */
    public function updateOrCreate(Request $request, int $patientId): JsonResponse
    {
        $patient = Patient::find($patientId);

        if (!$patient) {
            return $this->sendError('Patient not found.');
        }

        $validator = Validator::make($request->all(), [
            'allergies'           => 'nullable|array',
            'chronic_diseases'    => 'nullable|array',
            'past_surgeries'      => 'nullable|string',
            'family_history'      => 'nullable|string',
            'current_medications' => 'nullable|string',
            'lifestyle_notes'     => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $history = MedicalHistory::updateOrCreate(
            ['patient_id' => $patientId],
            $validator->validated()
        );

        return $this->sendResponse($history, 'Medical history saved successfully.');
    }

    /**
     * Quick allergy and contraindication lookup for safe clinical prescribing
     */
    public function allergyCheck(int $patientId): JsonResponse
    {
        $patient = Patient::with('medicalHistory')->find($patientId);

        if (!$patient) {
            return $this->sendError('Patient not found.');
        }

        $allergies = $patient->medicalHistory?->allergies ?? [];
        $chronicConditions = $patient->medicalHistory?->chronic_diseases ?? [];

        return $this->sendResponse([
            'patient_name'        => $patient->full_name,
            'blood_group'         => $patient->blood_group,
            'has_known_allergies' => !empty($allergies),
            'allergies'           => $allergies,
            'chronic_diseases'    => $chronicConditions,
        ], 'Allergy alerts retrieved.');
    }
}
