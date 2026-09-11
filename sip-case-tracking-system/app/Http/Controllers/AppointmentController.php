<?php

namespace App\Http\Controllers;

use App\Http\Requests\AppointmentRequest;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments
     */
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with([
            'patient:id,first_name,last_name,uhid,phone,gender,age',
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

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($date = $request->input('date')) {
            $query->whereDate('scheduled_at', $date);
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        $appointments = $query->orderBy('scheduled_at', 'asc')->paginate((int) $request->input('per_page', 20));

        return $this->sendResponse($appointments, 'Appointments retrieved successfully.');
    }

    /**
     * Book a new appointment
     */
    public function store(AppointmentRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Check if doctor is valid and active
        $doctor = User::where('id', $data['doctor_id'])->where('role', 'doctor')->first();
        if (!$doctor) {
            return $this->sendError('Selected user is not an active doctor.', [], 400);
        }

        // Generate unique appointment number
        $data['appointment_number'] = 'APT-' . date('Ymd') . '-' . strtoupper(Str::random(4));
        $data['status'] = $data['status'] ?? 'scheduled';

        // Process advance commitment token deposit (defaults to 500.00)
        $tokenAmount = isset($data['token_amount']) ? (float) $data['token_amount'] : 500.00;
        $data['token_amount'] = $tokenAmount;
        $data['payment_status'] = $data['payment_status'] ?? 'paid';
        $data['payment_method'] = $data['payment_method'] ?? 'UPI';
        $data['transaction_id'] = $data['transaction_id'] ?? ('TXN-SIP-' . date('Ymd') . '-' . strtoupper(Str::random(6)));
        $data['paid_at'] = $data['payment_status'] === 'paid' ? now() : null;

        $appointment = Appointment::create($data);
        $appointment->load(['patient', 'doctor:id,name,specialization']);

        // Record token deposit in patient charges ledger
        if ($data['payment_status'] === 'paid' && $tokenAmount > 0) {
            \App\Models\Charge::create([
                'patient_id' => $appointment->patient_id,
                'description' => "Consultation Advance Token Deposit (APT #{$appointment->appointment_number})",
                'amount' => $tokenAmount,
                'status' => 'paid',
                'receipt_number' => 'RCT-' . date('Ymd') . '-' . strtoupper(Str::random(5)),
                'paid_at' => now(),
                'created_by' => $request->user()?->id,
            ]);
        }

        return $this->sendResponse($appointment, __('messages.appointment_booked') ?: 'Appointment booked with ₹' . number_format($tokenAmount, 2) . ' commitment token received.', 201);
    }

    /**
     * Display the specified appointment
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::with(['patient.medicalHistory', 'doctor:id,name,specialization,phone'])->find($id);

        if (!$appointment) {
            return $this->sendError('Appointment not found.');
        }

        if (!$this->canDoctorAccess($appointment, $request)) {
            return $this->sendError('You are not assigned to this appointment.', [], 403);
        }

        return $this->sendResponse($appointment, 'Appointment details retrieved successfully.');
    }

    /**
     * Update/reschedule the specified appointment
     */
    public function update(AppointmentRequest $request, int $id): JsonResponse
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return $this->sendError('Appointment not found.');
        }

        if (!$this->canDoctorAccess($appointment, $request)) {
            return $this->sendError('You are not assigned to this appointment.', [], 403);
        }

        $appointment->update($request->validated());

        return $this->sendResponse($appointment, 'Appointment updated successfully.');
    }

    /**
     * Update appointment status (scheduled, completed, cancelled, no_show)
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return $this->sendError('Appointment not found.');
        }

        if (!$this->canDoctorAccess($appointment, $request)) {
            return $this->sendError('You are not assigned to this appointment.', [], 403);
        }

        $request->validate([
            'status'  => 'required|in:scheduled,completed,cancelled,no_show',
            'remarks' => 'nullable|string|max:500',
        ]);

        $appointment->status = $request->input('status');
        if ($request->filled('remarks')) {
            $appointment->remarks = $request->input('remarks');
        }
        $appointment->save();

        return $this->sendResponse($appointment, 'Appointment status updated to ' . $appointment->status . '.');
    }

    /**
     * Remove or cancel the specified appointment
     */
    public function destroy(int $id): JsonResponse
    {
        $appointment = Appointment::find($id);

        if (!$appointment) {
            return $this->sendError('Appointment not found.');
        }

        if (!$this->canDoctorAccess($appointment, request())) {
            return $this->sendError('You are not assigned to this appointment.', [], 403);
        }

        $appointment->delete();

        return $this->sendResponse(null, 'Appointment cancelled and removed.');
    }

    private function canDoctorAccess(Appointment $appointment, Request $request): bool
    {
        $user = $request->user();
        return !$user || !$user->isDoctor() || $appointment->doctor_id === $user->id;
    }

    /**
     * Today's appointments shortcut
     */
    public function today(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Appointment::today()->with(['patient:id,first_name,last_name,uhid,phone', 'doctor:id,name']);

        if ($user && $user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        }

        $appointments = $query->orderBy('scheduled_at', 'asc')->get();

        return $this->sendResponse($appointments, "Today's appointments retrieved.");
    }
}
