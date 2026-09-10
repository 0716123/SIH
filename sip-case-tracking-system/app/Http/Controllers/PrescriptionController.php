<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PrescriptionController extends Controller
{
    /**
     * Display a listing of prescriptions
     */
    public function index(Request $request): JsonResponse
    {
        $query = Prescription::with([
            'caseRecord:id,case_number,patient_id',
            'caseRecord.patient:id,first_name,last_name,uhid',
            'doctor:id,name,specialization',
        ]);

        if ($caseId = $request->input('case_record_id')) {
            $query->where('case_record_id', $caseId);
        }

        if ($treatmentId = $request->input('treatment_id')) {
            $query->where('treatment_id', $treatmentId);
        }

        $prescriptions = $query->latest()->paginate((int) $request->input('per_page', 20));

        return $this->sendResponse($prescriptions, 'Prescriptions retrieved successfully.');
    }

    /**
     * Store a newly created prescription
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'case_record_id' => 'required|exists:cases,id',
            'treatment_id'   => 'nullable|exists:treatments,id',
            'doctor_id'      => 'nullable|exists:users,id',
            'medicine_name'  => 'required|string|max:255',
            'dosage'         => 'required|string|max:100',
            'frequency'      => 'required|string|max:100',
            'route'          => 'nullable|string|max:50',
            'duration'       => 'nullable|string|max:100',
            'instructions'   => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['doctor_id'] = $data['doctor_id'] ?? $request->user()?->id;

        $prescription = Prescription::create($data);

        return $this->sendResponse($prescription, 'Prescription added successfully.', 201);
    }

    /**
     * Display the specified prescription
     */
    public function show(int $id): JsonResponse
    {
        $prescription = Prescription::with(['caseRecord.patient', 'doctor', 'treatment'])->find($id);

        if (!$prescription) {
            return $this->sendError('Prescription not found.');
        }

        return $this->sendResponse($prescription, 'Prescription details retrieved successfully.');
    }

    /**
     * Update the specified prescription
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $prescription = Prescription::find($id);

        if (!$prescription) {
            return $this->sendError('Prescription not found.');
        }

        $validator = Validator::make($request->all(), [
            'medicine_name' => 'sometimes|required|string|max:255',
            'dosage'        => 'sometimes|required|string|max:100',
            'frequency'     => 'sometimes|required|string|max:100',
            'route'         => 'nullable|string|max:50',
            'duration'      => 'nullable|string|max:100',
            'instructions'  => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $prescription->update($validator->validated());

        return $this->sendResponse($prescription, 'Prescription updated successfully.');
    }

    /**
     * Remove the specified prescription
     */
    public function destroy(int $id): JsonResponse
    {
        $prescription = Prescription::find($id);

        if (!$prescription) {
            return $this->sendError('Prescription not found.');
        }

        $prescription->delete();

        return $this->sendResponse(null, 'Prescription deleted successfully.');
    }

    /**
     * Get all prescriptions for a specific case
     */
    public function byCase(int $caseId): JsonResponse
    {
        $prescriptions = Prescription::where('case_record_id', $caseId)
            ->with(['doctor:id,name,specialization', 'treatment:id,treatment_name'])
            ->latest()
            ->get();

        return $this->sendResponse($prescriptions, 'Case prescriptions retrieved successfully.');
    }
}
