<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CaseRecord;
use App\Models\FollowUp;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Reports metadata and high-level summary overview
     */
    public function index(): JsonResponse
    {
        return $this->sendResponse([
            'available_reports' => [
                'patients'     => '/api/reports/patients',
                'cases'        => '/api/reports/cases',
                'appointments' => '/api/reports/appointments',
                'follow_ups'   => '/api/reports/follow-ups',
            ],
            'quick_stats' => [
                'total_patients'     => Patient::count(),
                'total_cases'        => CaseRecord::count(),
                'total_appointments' => Appointment::count(),
                'total_follow_ups'   => FollowUp::count(),
            ],
        ], 'Report center index retrieved successfully.');
    }

    /**
     * Patient Demographics & Registration Report
     */
    public function patientReport(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->subMonths(6)->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $newRegistrations = Patient::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])->count();

        // Gender breakdown
        $byGender = Patient::select('gender', DB::raw('count(*) as total'))
            ->groupBy('gender')
            ->pluck('total', 'gender');

        // Blood group breakdown
        $byBloodGroup = Patient::select('blood_group', DB::raw('count(*) as total'))
            ->whereNotNull('blood_group')
            ->groupBy('blood_group')
            ->pluck('total', 'blood_group');

        // Age group breakdown
        $ageGroups = [
            '0-18'  => Patient::where('age', '<=', 18)->count(),
            '19-35' => Patient::whereBetween('age', [19, 35])->count(),
            '36-50' => Patient::whereBetween('age', [36, 50])->count(),
            '51-65' => Patient::whereBetween('age', [51, 65])->count(),
            '65+'   => Patient::where('age', '>', 65)->count(),
        ];

        return $this->sendResponse([
            'date_range' => ['start' => $startDate, 'end' => $endDate],
            'new_registrations_in_period' => $newRegistrations,
            'by_gender' => $byGender,
            'by_blood_group' => $byBloodGroup,
            'age_distribution' => $ageGroups,
        ], 'Patient report generated successfully.');
    }

    /**
     * Clinical Cases & Tracking Report
     */
    public function caseReport(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->subMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $query = CaseRecord::whereBetween('admission_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        $totalCasesInPeriod = (clone $query)->count();

        $byStatus = (clone $query)->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $bySeverity = (clone $query)->select('severity', DB::raw('count(*) as count'))
            ->groupBy('severity')
            ->pluck('count', 'severity');

        // Doctor caseload in this period
        $doctorCaseload = (clone $query)->select('doctor_id', DB::raw('count(*) as total_cases'))
            ->with('doctor:id,name,specialization')
            ->groupBy('doctor_id')
            ->get();

        return $this->sendResponse([
            'date_range' => ['start' => $startDate, 'end' => $endDate],
            'total_cases_admitted' => $totalCasesInPeriod,
            'cases_by_status' => $byStatus,
            'cases_by_severity' => $bySeverity,
            'doctor_caseload' => $doctorCaseload,
        ], 'Case tracking report generated successfully.');
    }

    /**
     * Appointments Analytics Report
     */
    public function appointmentReport(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->subMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $query = Appointment::whereBetween('scheduled_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        $total = (clone $query)->count();

        $byStatus = (clone $query)->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $byType = (clone $query)->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type');

        return $this->sendResponse([
            'date_range' => ['start' => $startDate, 'end' => $endDate],
            'total_appointments' => $total,
            'status_breakdown' => $byStatus,
            'type_breakdown' => $byType,
        ], 'Appointment report generated successfully.');
    }

    /**
     * Follow-up Tracking & Adherence Report
     */
    public function followUpReport(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->subMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        $query = FollowUp::whereBetween('scheduled_date', [$startDate, $endDate]);

        $total = (clone $query)->count();
        $completed = (clone $query)->where('status', 'completed')->count();
        $pending = (clone $query)->where('status', 'pending')->count();
        $missed = (clone $query)->where('status', 'missed')->count();

        $adherenceRate = $total > 0 ? round(($completed / $total) * 100, 2) : 0;

        return $this->sendResponse([
            'date_range' => ['start' => $startDate, 'end' => $endDate],
            'total_scheduled_follow_ups' => $total,
            'completed' => $completed,
            'pending' => $pending,
            'missed' => $missed,
            'adherence_rate_percent' => $adherenceRate,
        ], 'Follow-up adherence report generated successfully.');
    }
}
