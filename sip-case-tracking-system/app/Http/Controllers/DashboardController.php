<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CaseRecord;
use App\Models\FollowUp;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Role-aware unified dashboard
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return $this->adminDashboard();
        }

        return $this->doctorDashboard($request);
    }

    /**
     * Admin Dashboard Statistics
     */
    public function adminDashboard(): JsonResponse
    {
        $totalPatients = Patient::count();
        $totalDoctors = User::where('role', 'doctor')->where('is_active', true)->count();
        $totalCases = CaseRecord::count();
        $activeCases = CaseRecord::whereIn('status', ['open', 'in_progress'])->count();
        $criticalCases = CaseRecord::where('severity', 'critical')->whereIn('status', ['open', 'in_progress'])->count();

        $todayAppointments = Appointment::today()->count();
        $pendingFollowUps = FollowUp::where('status', 'pending')->count();

        // Cases breakdown by status
        $casesByStatus = CaseRecord::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        // Cases breakdown by severity
        $casesBySeverity = CaseRecord::select('severity', DB::raw('count(*) as count'))
            ->groupBy('severity')
            ->pluck('count', 'severity');

        // Recent 5 Cases
        $recentCases = CaseRecord::with(['patient:id,first_name,last_name,uhid', 'doctor:id,name'])
            ->latest()
            ->take(5)
            ->get();

        // Today's appointments list
        $upcomingAppointments = Appointment::today()
            ->with(['patient:id,first_name,last_name,uhid,phone', 'doctor:id,name,specialization'])
            ->orderBy('scheduled_at', 'asc')
            ->take(5)
            ->get();

        return $this->sendResponse([
            'metrics' => [
                'total_patients' => $totalPatients,
                'total_doctors' => $totalDoctors,
                'total_cases' => $totalCases,
                'active_cases' => $activeCases,
                'critical_cases' => $criticalCases,
                'today_appointments' => $todayAppointments,
                'pending_follow_ups' => $pendingFollowUps,
            ],
            'cases_by_status' => $casesByStatus,
            'cases_by_severity' => $casesBySeverity,
            'recent_cases' => $recentCases,
            'upcoming_appointments' => $upcomingAppointments,
        ], 'Admin dashboard metrics retrieved successfully.');
    }

    /**
     * Doctor Dashboard Statistics
     */
    public function doctorDashboard(Request $request): JsonResponse
    {
        $doctorId = $request->user()->id;

        $myCasesCount = CaseRecord::where('doctor_id', $doctorId)->count();
        $myActiveCases = CaseRecord::where('doctor_id', $doctorId)
            ->whereIn('status', ['open', 'in_progress'])
            ->count();
        $myCriticalCases = CaseRecord::where('doctor_id', $doctorId)
            ->where('severity', 'critical')
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        $todayAppointmentsCount = Appointment::where('doctor_id', $doctorId)
            ->whereDate('scheduled_at', today())
            ->count();

        $pendingFollowUpsCount = FollowUp::where('doctor_id', $doctorId)
            ->where('status', 'pending')
            ->count();

        // Doctor's today appointments
        $todayAppointments = Appointment::where('doctor_id', $doctorId)
            ->whereDate('scheduled_at', today())
            ->with(['patient:id,first_name,last_name,uhid,phone,gender,age'])
            ->orderBy('scheduled_at', 'asc')
            ->get();

        // Doctor's recent cases
        $recentCases = CaseRecord::where('doctor_id', $doctorId)
            ->with(['patient:id,first_name,last_name,uhid'])
            ->latest()
            ->take(5)
            ->get();

        // Urgent follow-ups
        $upcomingFollowUps = FollowUp::where('doctor_id', $doctorId)
            ->where('status', 'pending')
            ->whereDate('scheduled_date', '<=', today()->addDays(3))
            ->with(['patient:id,first_name,last_name,uhid,phone', 'caseRecord:id,case_number,title'])
            ->orderBy('scheduled_date', 'asc')
            ->take(5)
            ->get();

        return $this->sendResponse([
            'metrics' => [
                'total_assigned_cases' => $myCasesCount,
                'active_cases' => $myActiveCases,
                'critical_cases' => $myCriticalCases,
                'today_appointments' => $todayAppointmentsCount,
                'pending_follow_ups' => $pendingFollowUpsCount,
            ],
            'today_appointments' => $todayAppointments,
            'recent_cases' => $recentCases,
            'upcoming_follow_ups' => $upcomingFollowUps,
        ], 'Doctor dashboard metrics retrieved successfully.');
    }
}
