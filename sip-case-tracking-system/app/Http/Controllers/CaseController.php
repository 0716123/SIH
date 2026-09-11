<?php

namespace App\Http\Controllers;

use App\Http\Requests\CaseRequest;
use App\Models\CaseDocument;
use App\Models\CaseRecord;
use App\Models\CaseSymptom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CaseController extends Controller
{
    /**
     * Display a listing of digital case records
     */
    public function index(Request $request): JsonResponse
    {
        $query = CaseRecord::with([
            'patient:id,first_name,last_name,uhid,phone,gender,age',
            'doctor:id,name,specialization',
        ]);

        // Role restriction: Doctor sees their assigned cases unless admin
        $user = $request->user();
        if ($user && $user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($doctorId = $request->input('doctor_id')) {
            $query->where('doctor_id', $doctorId);
        }

        if ($patientId = $request->input('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($severity = $request->input('severity')) {
            $query->where('severity', $severity);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('case_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('diagnosis', 'like', "%{$search}%")
                  ->orWhereHas('patient', function ($pq) use ($search) {
                      $pq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('uhid', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $cases = $query->latest('admission_date')->paginate($perPage);

        return $this->sendResponse($cases, 'Cases retrieved successfully.');
    }

    /**
     * Create a new digital case record
     */
    public function store(CaseRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->user()?->isDoctor() && (int) $data['doctor_id'] !== $request->user()->id) {
            return $this->sendError('Doctors can create cases only for their own caseload.', [], 403);
        }

        DB::beginTransaction();
        try {
            // Auto-generate unique case tracking number
            $data['case_number'] = 'CASE-' . date('Ym') . '-' . strtoupper(Str::random(5));
            $data['status'] = $data['status'] ?? 'open';
            $data['admission_date'] = $data['admission_date'] ?? now();

            $case = CaseRecord::create($data);

            // Attach symptoms if provided
            if (!empty($data['symptoms']) && is_array($data['symptoms'])) {
                foreach ($data['symptoms'] as $symptomData) {
                    CaseSymptom::create([
                        'case_record_id' => $case->id,
                        'symptom_id'     => $symptomData['symptom_id'],
                        'severity'       => $symptomData['severity'] ?? 'moderate',
                        'duration_days'  => $symptomData['duration_days'] ?? 1,
                        'notes'          => $symptomData['notes'] ?? null,
                    ]);
                }
            }

            // Handle file attachments
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $fileName = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('uploads/case-documents', $fileName, 'public');

                    CaseDocument::create([
                        'case_record_id' => $case->id,
                        'patient_id'     => $case->patient_id,
                        'uploaded_by'    => $request->user()?->id ?? $case->doctor_id,
                        'title'          => $file->getClientOriginalName(),
                        'document_type'  => 'other',
                        'file_path'      => $path,
                        'file_size'      => $file->getSize(),
                        'file_mime'      => $file->getClientMimeType(),
                    ]);
                }
            }

            DB::commit();

            $case->load(['patient', 'doctor:id,name,specialization', 'symptoms', 'documents']);

            return $this->sendResponse($case, __('messages.case_created') ?: 'Digital case created successfully.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->sendError('Failed to create case: ' . $e->getMessage(), [], 500);
        }
    }

    /**
     * Display a specific case with all clinical details
     */
    public function show(int $id): JsonResponse
    {
        $case = CaseRecord::with([
            'patient.medicalHistory',
            'doctor:id,name,specialization,phone',
            'symptoms',
            'treatments.prescriptions',
            'treatments.doctor:id,name',
            'prescriptions.doctor:id,name',
            'followUps.doctor:id,name',
            'documents.uploader:id,name',
            'charges',
        ])->find($id);

        if (!$case) {
            return $this->sendError(__('messages.case_not_found') ?: 'Case not found.');
        }

        if (!$this->canDoctorAccess($case, request())) {
            return $this->sendError('You are not assigned to this case.', [], 403);
        }

        return $this->sendResponse($case, 'Case details retrieved successfully.');
    }

    /**
     * Update an existing case record
     */
    public function update(CaseRequest $request, int $id): JsonResponse
    {
        $case = CaseRecord::find($id);

        if (!$case) {
            return $this->sendError(__('messages.case_not_found') ?: 'Case not found.');
        }

        if (!$this->canDoctorAccess($case, $request)) {
            return $this->sendError('You are not assigned to this case.', [], 403);
        }

        $data = $request->validated();

        if (isset($data['status']) && $data['status'] === 'closed' && empty($case->discharge_date)) {
            $data['discharge_date'] = $data['discharge_date'] ?? now();
        }

        $case->update($data);

        return $this->sendResponse($case, __('messages.case_updated') ?: 'Case updated successfully.');
    }

    /**
     * Update case status directly (e.g. open -> in_progress -> closed)
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $case = CaseRecord::find($id);

        if (!$case) {
            return $this->sendError(__('messages.case_not_found') ?: 'Case not found.');
        }

        if (!$this->canDoctorAccess($case, $request)) {
            return $this->sendError('You are not assigned to this case.', [], 403);
        }

        $request->validate([
            'status'        => 'required|in:open,in_progress,closed,referred',
            'closure_notes' => 'nullable|string',
        ]);

        $status = $request->input('status');
        $case->status = $status;

        if ($request->filled('closure_notes')) {
            $case->closure_notes = $request->input('closure_notes');
        }

        if ($status === 'closed') {
            $case->discharge_date = now();
        }

        $case->save();

        return $this->sendResponse($case, 'Case status updated successfully.');
    }

    private function canDoctorAccess(CaseRecord $case, Request $request): bool
    {
        $user = $request->user();
        return !$user || !$user->isDoctor() || $case->doctor_id === $user->id;
    }

    /**
     * Attach a symptom to this case
     */
    public function addSymptom(Request $request, int $id): JsonResponse
    {
        $case = CaseRecord::find($id);

        if (!$case) {
            return $this->sendError('Case not found.');
        }

        $request->validate([
            'symptom_id'    => 'required|exists:symptoms,id',
            'severity'      => 'required|in:mild,moderate,severe',
            'duration_days' => 'nullable|integer|min:0',
            'notes'         => 'nullable|string|max:500',
        ]);

        $caseSymptom = CaseSymptom::updateOrCreate(
            [
                'case_record_id' => $case->id,
                'symptom_id'     => $request->symptom_id,
            ],
            [
                'severity'      => $request->severity,
                'duration_days' => $request->duration_days ?? 1,
                'notes'         => $request->notes,
            ]
        );

        return $this->sendResponse($caseSymptom, 'Symptom added to case successfully.');
    }

    /**
     * Remove a symptom from this case
     */
    public function removeSymptom(int $caseId, int $symptomId): JsonResponse
    {
        $deleted = CaseSymptom::where('case_record_id', $caseId)
            ->where('symptom_id', $symptomId)
            ->delete();

        if (!$deleted) {
            return $this->sendError('Symptom association not found in this case.');
        }

        return $this->sendResponse(null, 'Symptom removed from case successfully.');
    }

    /**
     * Upload medical document/attachment to this case
     */
    public function uploadDocument(Request $request, int $id): JsonResponse
    {
        $case = CaseRecord::find($id);

        if (!$case) {
            return $this->sendError('Case not found.');
        }

        $request->validate([
            'document'      => 'required|file|mimes:pdf,jpg,jpeg,png,docx,txt|max:10240',
            'title'         => 'nullable|string|max:255',
            'document_type' => 'nullable|in:lab_report,x_ray,mri,prescription_scan,discharge_summary,other',
        ]);

        $file = $request->file('document');
        $title = $request->input('title') ?: $file->getClientOriginalName();
        $fileName = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('uploads/case-documents', $fileName, 'public');

        $document = CaseDocument::create([
            'case_record_id' => $case->id,
            'patient_id'     => $case->patient_id,
            'uploaded_by'    => $request->user()?->id ?? $case->doctor_id,
            'title'          => $title,
            'document_type'  => $request->input('document_type', 'other'),
            'file_path'      => $path,
            'file_size'      => $file->getSize(),
            'file_mime'      => $file->getClientMimeType(),
        ]);

        return $this->sendResponse($document, 'Case document uploaded successfully.', 201);
    }

    /**
     * Generate printable data for clinical case summary report
     */
    public function printSummary(int $id): JsonResponse
    {
        $case = CaseRecord::with([
            'patient.medicalHistory',
            'doctor',
            'symptoms',
            'treatments.prescriptions',
            'followUps',
            'documents',
        ])->find($id);

        if (!$case) {
            return $this->sendError('Case not found.');
        }

        $summary = [
            'case_number' => $case->case_number,
            'date_generated' => now()->toFormattedDateString(),
            'patient' => [
                'name' => $case->patient->full_name,
                'uhid' => $case->patient->uhid,
                'gender' => $case->patient->gender,
                'age' => $case->patient->age,
                'blood_group' => $case->patient->blood_group,
                'phone' => $case->patient->phone,
                'medical_history' => $case->patient->medicalHistory,
            ],
            'attending_doctor' => [
                'name' => $case->doctor->name,
                'specialization' => $case->doctor->specialization,
                'license' => $case->doctor->license_number,
            ],
            'clinical_record' => [
                'title' => $case->title,
                'diagnosis' => $case->diagnosis,
                'severity' => $case->severity,
                'status' => $case->status,
                'admission_date' => $case->admission_date?->toDayDateTimeString(),
                'discharge_date' => $case->discharge_date?->toDayDateTimeString(),
                'description' => $case->description,
                'closure_notes' => $case->closure_notes,
            ],
            'symptoms' => $case->symptoms,
            'treatments' => $case->treatments,
            'follow_ups' => $case->followUps,
        ];

        return $this->sendResponse($summary, 'Case printable summary prepared successfully.');
    }
}
