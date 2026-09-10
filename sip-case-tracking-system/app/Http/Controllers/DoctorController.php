<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CaseRecord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class DoctorController extends Controller
{
    /**
     * Display a listing of doctors
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'doctor');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('specialization', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($specialization = $request->input('specialization')) {
            $query->where('specialization', 'like', "%{$specialization}%");
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $doctors = $query->withCount([
            'cases as active_cases_count' => function ($q) {
                $q->whereIn('status', ['open', 'in_progress']);
            },
            'appointments as today_appointments_count' => function ($q) {
                $q->whereDate('scheduled_at', today());
            },
        ])->paginate((int) $request->input('per_page', 15));

        return $this->sendResponse($doctors, 'Doctors retrieved successfully.');
    }

    /**
     * Store a newly created doctor account (Admin action)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'           => 'required|string|max:255',
            'email'          => 'required|string|email|max:255|unique:users',
            'password'       => 'required|string|min:8',
            'phone'          => 'nullable|string|max:20',
            'specialization' => 'required|string|max:150',
            'license_number' => 'required|string|max:100|unique:users,license_number',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $data = $validator->validated();
        $data['role'] = 'doctor';
        $data['password'] = Hash::make($data['password']);
        $data['is_active'] = true;

        $doctor = User::create($data);

        return $this->sendResponse($doctor, 'Doctor profile registered successfully.', 201);
    }

    /**
     * Display the specified doctor profile and workload metrics
     */
    public function show(int $id): JsonResponse
    {
        $doctor = User::where('role', 'doctor')
            ->withCount([
                'cases',
                'cases as active_cases_count' => function ($q) {
                    $q->whereIn('status', ['open', 'in_progress']);
                },
                'appointments',
                'followUps as pending_follow_ups_count' => function ($q) {
                    $q->where('status', 'pending');
                },
            ])
            ->find($id);

        if (!$doctor) {
            return $this->sendError('Doctor not found.');
        }

        return $this->sendResponse($doctor, 'Doctor details retrieved successfully.');
    }

    /**
     * Update doctor profile details
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $doctor = User::where('role', 'doctor')->find($id);

        if (!$doctor) {
            return $this->sendError('Doctor not found.');
        }

        $validator = Validator::make($request->all(), [
            'name'           => 'sometimes|required|string|max:255',
            'email'          => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'phone'          => 'nullable|string|max:20',
            'specialization' => 'sometimes|required|string|max:150',
            'license_number' => 'sometimes|required|string|max:100|unique:users,license_number,' . $id,
            'is_active'      => 'nullable|boolean',
            'password'       => 'nullable|string|min:8',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation Error.', $validator->errors(), 422);
        }

        $data = $validator->validated();
        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $doctor->update($data);

        return $this->sendResponse($doctor, 'Doctor profile updated successfully.');
    }

    /**
     * Deactivate doctor account
     */
    public function destroy(int $id): JsonResponse
    {
        $doctor = User::where('role', 'doctor')->find($id);

        if (!$doctor) {
            return $this->sendError('Doctor not found.');
        }

        $activeCases = CaseRecord::where('doctor_id', $doctor->id)->whereIn('status', ['open', 'in_progress'])->count();
        if ($activeCases > 0) {
            return $this->sendError("Cannot delete doctor with {$activeCases} active cases. Please reassign cases first.", [], 400);
        }

        $doctor->update(['is_active' => false]);

        return $this->sendResponse(null, 'Doctor account deactivated successfully.');
    }

    /**
     * Get doctor schedule / appointments for a specific date
     */
    public function schedule(Request $request, int $id): JsonResponse
    {
        $doctor = User::where('role', 'doctor')->find($id);

        if (!$doctor) {
            return $this->sendError('Doctor not found.');
        }

        $date = $request->input('date', today()->toDateString());

        $appointments = Appointment::where('doctor_id', $id)
            ->whereDate('scheduled_at', $date)
            ->with('patient:id,first_name,last_name,uhid,phone')
            ->orderBy('scheduled_at', 'asc')
            ->get();

        return $this->sendResponse([
            'doctor' => ['id' => $doctor->id, 'name' => $doctor->name, 'specialization' => $doctor->specialization],
            'date' => $date,
            'appointments' => $appointments,
        ], 'Doctor schedule retrieved successfully.');
    }
}
