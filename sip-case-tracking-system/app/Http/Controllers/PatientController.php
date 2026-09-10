<?php

namespace App\Http\Controllers;

use App\Http\Requests\PatientRequest;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PatientController extends Controller
{
    /**
     * Display a listing of patients with search and filter
     */
    public function index(Request $request): JsonResponse
    {
        $query = Patient::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('uhid', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($gender = $request->input('gender')) {
            $query->where('gender', $gender);
        }

        if ($bloodGroup = $request->input('blood_group')) {
            $query->where('blood_group', $bloodGroup);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = (int) $request->input('per_page', 15);
        $patients = $query->withCount('cases')->latest()->paginate($perPage);

        return $this->sendResponse($patients, 'Patients retrieved successfully.');
    }

    /**
     * Store a newly created patient
     */
    public function store(PatientRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Auto-generate Unique Hospital ID if not provided
        if (empty($data['uhid'])) {
            $data['uhid'] = 'UHID-' . date('Y') . '-' . strtoupper(Str::random(6));
        }

        // Auto-calculate age from DOB if DOB provided and age omitted
        if (!empty($data['dob']) && empty($data['age'])) {
            $data['age'] = \Carbon\Carbon::parse($data['dob'])->age;
        }

        $patient = Patient::create($data);

        return $this->sendResponse($patient, __('messages.patient_created') ?: 'Patient created successfully.', 201);
    }

    /**
     * Display the specified patient
     */
    public function show(int $id): JsonResponse
    {
        $patient = Patient::with([
            'medicalHistory',
            'cases' => function ($q) {
                $q->latest()->with('doctor:id,name,specialization');
            },
            'appointments' => function ($q) {
                $q->latest()->take(5)->with('doctor:id,name');
            },
            'followUps' => function ($q) {
                $q->latest()->take(5);
            },
            'documents',
        ])->find($id);

        if (!$patient) {
            return $this->sendError(__('messages.patient_not_found') ?: 'Patient not found.');
        }

        return $this->sendResponse($patient, 'Patient details retrieved successfully.');
    }

    /**
     * Update the specified patient
     */
    public function update(PatientRequest $request, int $id): JsonResponse
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return $this->sendError(__('messages.patient_not_found') ?: 'Patient not found.');
        }

        $data = $request->validated();

        if (!empty($data['dob']) && empty($data['age'])) {
            $data['age'] = \Carbon\Carbon::parse($data['dob'])->age;
        }

        $patient->update($data);

        return $this->sendResponse($patient, __('messages.patient_updated') ?: 'Patient updated successfully.');
    }

    /**
     * Remove or deactivate the specified patient
     */
    public function destroy(int $id): JsonResponse
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return $this->sendError(__('messages.patient_not_found') ?: 'Patient not found.');
        }

        $activeCasesCount = $patient->cases()->whereIn('status', ['open', 'in_progress'])->count();
        if ($activeCasesCount > 0) {
            return $this->sendError('Cannot delete patient with active open cases. Please close cases first or deactivate patient.', [], 400);
        }

        $patient->delete();

        return $this->sendResponse(null, __('messages.patient_deleted') ?: 'Patient removed successfully.');
    }

    /**
     * Retrieve complete case history for this patient
     */
    public function caseHistory(int $id): JsonResponse
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return $this->sendError(__('messages.patient_not_found') ?: 'Patient not found.');
        }

        $cases = $patient->cases()
            ->with([
                'doctor:id,name,specialization',
                'symptoms',
                'treatments.prescriptions',
                'followUps',
                'documents',
            ])
            ->latest()
            ->get();

        return $this->sendResponse([
            'patient' => [
                'id' => $patient->id,
                'uhid' => $patient->uhid,
                'name' => $patient->full_name,
                'gender' => $patient->gender,
                'age' => $patient->age,
                'blood_group' => $patient->blood_group,
            ],
            'cases' => $cases,
        ], 'Patient case history retrieved successfully.');
    }
}
