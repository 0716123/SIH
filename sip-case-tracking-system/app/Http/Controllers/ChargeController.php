<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChargeRequest;
use App\Models\CaseRecord;
use App\Models\Charge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChargeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Charge::with('caseRecord:id,case_number,status');

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }

        if ($request->filled('case_record_id')) {
            $query->where('case_record_id', $request->integer('case_record_id'));
        }

        return $this->sendResponse($query->latest()->get(), 'Charges retrieved successfully.');
    }

    public function store(ChargeRequest $request): JsonResponse
    {
        $case = CaseRecord::findOrFail($request->integer('case_record_id'));
        $status = $request->input('status', 'pending');

        $charge = Charge::create([
            'case_record_id' => $case->id,
            'patient_id' => $case->patient_id,
            'description' => $request->string('description')->toString(),
            'amount' => $request->input('amount'),
            'status' => $status,
            'receipt_number' => $status === 'paid' ? 'RCT-' . strtoupper(Str::random(8)) : null,
            'paid_at' => $status === 'paid' ? now() : null,
            'created_by' => $request->user()?->id,
        ]);

        return $this->sendResponse($charge->load('caseRecord:id,case_number,status'), 'Charge added successfully.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => 'required|in:pending,paid,waived']);
        $charge = Charge::findOrFail($id);
        $charge->status = $data['status'];
        $charge->paid_at = $data['status'] === 'paid' ? ($charge->paid_at ?: now()) : null;
        $charge->receipt_number = $data['status'] === 'paid'
            ? ($charge->receipt_number ?: 'RCT-' . strtoupper(Str::random(8)))
            : null;
        $charge->save();

        return $this->sendResponse($charge, 'Charge status updated successfully.');
    }
}
