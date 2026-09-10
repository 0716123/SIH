<?php

namespace App\Http\Controllers;

use App\Models\CaseRecord;
use App\Models\FollowUp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FollowUpController extends Controller
{
    /**
     * Display a listing of follow-ups
     */
    public function index(Request $request): JsonResponse
    {
        $query = FollowUp::with([
            'caseRecord:id,case_number,title',
            'patient:id,first_name,last_name,uhid,phone',
            'doctor:id,name,specialization',
        ]);

        $user = $request->user();
        if ($user && $user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($doctorId = $request->input('doctor_id')) {
            $query->where('doctor_id', $doctorId);
        }

        if ($patientId = $request->input('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($caseId = $request->input('case_record_id')) {
            $query->where('case_record_id', $caseId);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($date = $request->input('scheduled_date')) {
            $query->whereDate('scheduled_date', $date);
        }

        $followUps = $query->orderBy('scheduled_date', 'asc')->paginate((int) $request->input('per_page', 20));

        return $this->sendResponse($followUps, 'Follow-ups retrieved successfully.');
    }

    /**
     * Schedule a new follow-up
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'case_record_id'  => 'required|exists:cases,id',
            'scheduled_date'  => 'required|date|after_or_equal:today',
            'purpose'         => 'required|string|max:255',
            'recommendations' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $case = CaseRecord::findOrFail($request->case_record_id);

        $followUp = FollowUp::create([
            'case_record_id'  => $case->id,
            'patient_id'      => $case->patient_id,
            'doctor_id'       => $case->doctor_id,
            'scheduled_date'  => $request->scheduled_date,
            'purpose'         => $request->purpose,
            'status'          => 'pending',
            'recommendations' => $request->recommendations,
        ]);

        $followUp->load(['patient', 'doctor:id,name']);

        return $this->sendResponse($followUp, __('messages.follow_up_scheduled') ?: 'Follow-up scheduled successfully.', 201);
    }

    /**
     * Display the specified follow-up
     */
    public function show(int $id): JsonResponse
    {
        $followUp = FollowUp::with(['caseRecord', 'patient', 'doctor'])->find($id);

        if (!$followUp) {
            return $this->sendError('Follow-up not found.');
        }

        return $this->sendResponse($followUp, 'Follow-up details retrieved successfully.');
    }

    /**
     * Update follow-up schedule or purpose
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $followUp = FollowUp::find($id);

        if (!$followUp) {
            return $this->sendError('Follow-up not found.');
        }

        $validator = Validator::make($request->all(), [
            'scheduled_date'  => 'sometimes|required|date',
            'purpose'         => 'sometimes|required|string|max:255',
            'status'          => 'nullable|in:pending,completed,missed',
            'findings'        => 'nullable|string',
            'recommendations' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $followUp->update($validator->validated());

        return $this->sendResponse($followUp, 'Follow-up updated successfully.');
    }

    /**
     * Record clinical completion of a follow-up
     */
    public function complete(Request $request, int $id): JsonResponse
    {
        $followUp = FollowUp::find($id);

        if (!$followUp) {
            return $this->sendError('Follow-up not found.');
        }

        $request->validate([
            'findings'        => 'required|string',
            'recommendations' => 'nullable|string',
            'actual_date'     => 'nullable|date',
        ]);

        $followUp->status = 'completed';
        $followUp->actual_date = $request->input('actual_date', today());
        $followUp->findings = $request->input('findings');
        if ($request->filled('recommendations')) {
            $followUp->recommendations = $request->input('recommendations');
        }
        $followUp->save();

        return $this->sendResponse($followUp, 'Follow-up recorded as completed.');
    }

    /**
     * Remove the specified follow-up
     */
    public function destroy(int $id): JsonResponse
    {
        $followUp = FollowUp::find($id);

        if (!$followUp) {
            return $this->sendError('Follow-up not found.');
        }

        $followUp->delete();

        return $this->sendResponse(null, 'Follow-up removed successfully.');
    }

    /**
     * List upcoming pending follow-ups
     */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = FollowUp::where('status', 'pending')
            ->whereDate('scheduled_date', '<=', today()->addDays(7))
            ->with(['caseRecord:id,case_number', 'patient:id,first_name,last_name,uhid,phone', 'doctor:id,name']);

        if ($user && $user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        }

        $list = $query->orderBy('scheduled_date', 'asc')->get();

        return $this->sendResponse($list, 'Pending upcoming follow-ups retrieved.');
    }
}
