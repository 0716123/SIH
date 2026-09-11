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
        $query = Patient::with('primaryDoctor:id,name,specialization');

        if ($request->user()?->isDoctor()) {
            $doctorId = $request->user()->id;
            $query->where(function ($q) use ($doctorId) {
                $q->where('primary_doctor_id', $doctorId)
                  ->orWhereHas('cases', fn ($case) => $case->where('doctor_id', $doctorId))
                  ->orWhereHas('appointments', fn ($appointment) => $appointment->where('doctor_id', $doctorId));
            });
        }

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
        $history = [
            'allergies' => $this->splitList($data['allergies'] ?? null),
            'chronic_diseases' => $this->splitList($data['chronic_diseases'] ?? null),
            'past_surgeries' => $data['past_surgeries'] ?? 'None reported',
            'current_medications' => $data['current_medications'] ?? 'None',
        ];
        unset($data['allergies'], $data['chronic_diseases'], $data['past_surgeries'], $data['current_medications']);

        // Auto-generate Unique Hospital ID if not provided
        if (empty($data['uhid'])) {
            $data['uhid'] = 'UHID-' . date('Y') . '-' . strtoupper(Str::random(6));
        }

        // Auto-calculate age from DOB if DOB provided and age omitted
        if (!empty($data['dob']) && empty($data['age'])) {
            $data['age'] = \Carbon\Carbon::parse($data['dob'])->age;
        }

        $patient = Patient::create($data);
        $patient->medicalHistory()->create($history);

        return $this->sendResponse(
            $patient->load('primaryDoctor:id,name,specialization', 'medicalHistory'),
            __('messages.patient_created') ?: 'Patient created successfully.',
            201
        );
    }

    public function stream(Request $request)
    {
        return response()->stream(function () use ($request) {
            $lastChangedAt = null;

            while (!connection_aborted()) {
                $changedAt = Patient::max('updated_at');

                if ($changedAt !== $lastChangedAt) {
                    echo "event: patients.changed\n";
                    echo 'data: ' . json_encode(['updated_at' => $changedAt]) . "\n\n";
                    $lastChangedAt = $changedAt;
                } else {
                    echo ": keep-alive\n\n";
                }

                if (function_exists('ob_flush')) {
                    @ob_flush();
                }
                flush();
                sleep(1);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Display the specified patient
     */
    public function show(int $id): JsonResponse
    {
        $patient = Patient::with([
            'primaryDoctor:id,name,specialization',
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

        if (!$this->canDoctorAccess($patient, request())) {
            return $this->sendError('You are not assigned to this patient.', [], 403);
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

        if (!$this->canDoctorAccess($patient, $request)) {
            return $this->sendError('You are not assigned to this patient.', [], 403);
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

        if (!$this->canDoctorAccess($patient, request())) {
            return $this->sendError('You are not assigned to this patient.', [], 403);
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

        if (!$this->canDoctorAccess($patient, request())) {
            return $this->sendError('You are not assigned to this patient.', [], 403);
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

    private function canDoctorAccess(Patient $patient, Request $request): bool
    {
        $user = $request->user();
        if (!$user || !$user->isDoctor()) {
            return true;
        }

        return $patient->primary_doctor_id === $user->id
            || $patient->cases()->where('doctor_id', $user->id)->exists()
            || $patient->appointments()->where('doctor_id', $user->id)->exists();
    }

    private function splitList(?string $value): array
    {
        return collect(explode(',', (string) $value))
            ->map(fn ($item) => trim($item))
            ->filter()
            ->values()
            ->all();
    }
}
