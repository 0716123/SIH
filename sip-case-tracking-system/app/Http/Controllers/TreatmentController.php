<?php

namespace App\Http\Controllers;

use App\Http\Requests\TreatmentRequest;
use App\Models\Prescription;
use App\Models\Treatment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TreatmentController extends Controller
{
    /**
     * Display a listing of treatments
     */
    public function index(Request $request): JsonResponse
    {
        $query = Treatment::with([
            'caseRecord:id,case_number,patient_id,title',
            'caseRecord.patient:id,first_name,last_name,uhid',
            'doctor:id,name,specialization',
            'prescriptions',
        ]);

        if ($caseId = $request->input('case_record_id')) {
            $query->where('case_record_id', $caseId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($doctorId = $request->input('doctor_id')) {
            $query->where('doctor_id', $doctorId);
        }

        $treatments = $query->latest()->paginate((int) $request->input('per_page', 15));

        return $this->sendResponse($treatments, 'Treatments retrieved successfully.');
    }

    /**
     * Store a newly created treatment plan and optional nested prescriptions
     */
    public function store(TreatmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['doctor_id'] = $data['doctor_id'] ?? $request->user()?->id;
        $data['status'] = $data['status'] ?? 'planned';
        $data['start_date'] = $data['start_date'] ?? today();

        DB::beginTransaction();
        try {
            $treatment = Treatment::create($data);

            if (!empty($data['prescriptions']) && is_array($data['prescriptions'])) {
                foreach ($data['prescriptions'] as $rx) {
                    Prescription::create([
                        'treatment_id'   => $treatment->id,
                        'case_record_id' => $treatment->case_record_id,
                        'doctor_id'      => $treatment->doctor_id,
                        'medicine_name'  => $rx['medicine_name'],
                        'dosage'         => $rx['dosage'],
                        'frequency'      => $rx['frequency'],
                        'route'          => $rx['route'] ?? 'Oral',
                        'duration'       => $rx['duration'] ?? null,
                        'instructions'   => $rx['instructions'] ?? null,
                    ]);
                }
            }

            DB::commit();

            $treatment->load(['prescriptions', 'caseRecord.patient', 'doctor:id,name']);

            return $this->sendResponse($treatment, 'Treatment plan created successfully.', 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->sendError('Failed to record treatment: ' . $e->getMessage(), [], 500);
        }
    }

    /**
     * Display the specified treatment
     */
    public function show(int $id): JsonResponse
    {
        $treatment = Treatment::with([
            'caseRecord.patient',
            'doctor:id,name,specialization',
            'prescriptions',
        ])->find($id);

        if (!$treatment) {
            return $this->sendError('Treatment record not found.');
        }

        return $this->sendResponse($treatment, 'Treatment details retrieved successfully.');
    }

    /**
     * Update the specified treatment
     */
    public function update(TreatmentRequest $request, int $id): JsonResponse
    {
        $treatment = Treatment::find($id);

        if (!$treatment) {
            return $this->sendError('Treatment record not found.');
        }

        $treatment->update($request->validated());

        return $this->sendResponse($treatment, 'Treatment updated successfully.');
    }

    /**
     * Remove the specified treatment
     */
    public function destroy(int $id): JsonResponse
    {
        $treatment = Treatment::find($id);

        if (!$treatment) {
            return $this->sendError('Treatment record not found.');
        }

        $treatment->prescriptions()->delete();
        $treatment->delete();

        return $this->sendResponse(null, 'Treatment record deleted successfully.');
    }
}
