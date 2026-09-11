<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\CaseRecord;
use App\Models\Charge;
use App\Models\FollowUp;
use App\Models\Patient;
use App\Models\User;
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

    /**
     * Comprehensive Hospital Summary Report with Time Duration Filtering,
     * Doctor Performance Metrics, Patient Category Breakdown, and Token Financials.
     */
    public function hospitalSummary(Request $request): JsonResponse
    {
        $duration = $request->input('duration', '30_days');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $now = Carbon::now();

        switch ($duration) {
            case 'today':
                $start = $now->copy()->startOfDay();
                $end = $now->copy()->endOfDay();
                $label = 'Today (' . $start->format('d M Y') . ')';
                break;
            case '7_days':
                $start = $now->copy()->subDays(6)->startOfDay();
                $end = $now->copy()->endOfDay();
                $label = 'Last 7 Days (' . $start->format('d M') . ' - ' . $end->format('d M Y') . ')';
                break;
            case '30_days':
                $start = $now->copy()->subDays(29)->startOfDay();
                $end = $now->copy()->endOfDay();
                $label = 'Last 30 Days (' . $start->format('d M') . ' - ' . $end->format('d M Y') . ')';
                break;
            case 'this_month':
                $start = $now->copy()->startOfMonth();
                $end = $now->copy()->endOfMonth();
                $label = 'This Month (' . $start->format('F Y') . ')';
                break;
            case 'this_quarter':
                $start = $now->copy()->startOfQuarter();
                $end = $now->copy()->endOfQuarter();
                $label = 'This Quarter (' . $start->format('d M') . ' - ' . $end->format('d M Y') . ')';
                break;
            case 'this_year':
                $start = $now->copy()->startOfYear();
                $end = $now->copy()->endOfYear();
                $label = 'This Year (' . $start->format('Y') . ')';
                break;
            case 'all':
                $start = Carbon::create(2020, 1, 1, 0, 0, 0);
                $end = $now->copy()->endOfDay();
                $label = 'All Time';
                break;
            case 'custom':
            default:
                if ($startDate && $endDate) {
                    $start = Carbon::parse($startDate)->startOfDay();
                    $end = Carbon::parse($endDate)->endOfDay();
                    $label = 'Custom (' . $start->format('d M Y') . ' - ' . $end->format('d M Y') . ')';
                } else {
                    $start = $now->copy()->subDays(29)->startOfDay();
                    $end = $now->copy()->endOfDay();
                    $label = 'Last 30 Days (' . $start->format('d M') . ' - ' . $end->format('d M Y') . ')';
                    $duration = '30_days';
                }
                break;
        }

        $startStr = $start->toDateTimeString();
        $endStr = $end->toDateTimeString();

        // 1. Hospital Executive KPIs
        $patientsInPeriod = Patient::whereBetween('created_at', [$startStr, $endStr])->count();
        $totalHospitalPatients = Patient::count();

        $casesQuery = CaseRecord::whereBetween('admission_date', [$startStr, $endStr]);
        $totalCasesInPeriod = (clone $casesQuery)->count();
        $casesByStatus = [
            'open' => (clone $casesQuery)->where('status', 'open')->count(),
            'in_progress' => (clone $casesQuery)->where('status', 'in_progress')->count(),
            'closed' => (clone $casesQuery)->where('status', 'closed')->count(),
            'referred' => (clone $casesQuery)->where('status', 'referred')->count(),
        ];
        $casesBySeverity = [
            'critical' => (clone $casesQuery)->where('severity', 'critical')->count(),
            'severe' => (clone $casesQuery)->where('severity', 'severe')->count(),
            'moderate' => (clone $casesQuery)->where('severity', 'moderate')->count(),
            'mild' => (clone $casesQuery)->where('severity', 'mild')->count(),
        ];

        // Appointments in period
        $aptsQuery = Appointment::whereBetween('scheduled_at', [$startStr, $endStr]);
        $totalAppointments = (clone $aptsQuery)->count();
        $aptsByStatus = [
            'scheduled' => (clone $aptsQuery)->where('status', 'scheduled')->count(),
            'completed' => (clone $aptsQuery)->where('status', 'completed')->count(),
            'no_show' => (clone $aptsQuery)->where('status', 'no_show')->count(),
            'cancelled' => (clone $aptsQuery)->where('status', 'cancelled')->count(),
        ];

        $concludedApts = $aptsByStatus['completed'] + $aptsByStatus['no_show'];
        $attendanceRate = $concludedApts > 0
            ? round(($aptsByStatus['completed'] / $concludedApts) * 100, 1)
            : ($totalAppointments > 0 ? 100.0 : 0.0);
        $noShowRate = $concludedApts > 0
            ? round(($aptsByStatus['no_show'] / $concludedApts) * 100, 1)
            : 0.0;

        // Token Financials (₹500 Commitment Deposit)
        $tokenFeesCollected = (float) ((clone $aptsQuery)->where('payment_status', 'paid')->sum('token_amount') ?: 0);
        $tokenFeesCredited = (float) ((clone $aptsQuery)->where('status', 'completed')->where('payment_status', 'paid')->sum('token_amount') ?: 0);
        $tokenFeesForfeited = (float) ((clone $aptsQuery)->where('status', 'no_show')->sum('token_amount') ?: 0);
        $tokenFeesEscrow = (float) ((clone $aptsQuery)->where('status', 'scheduled')->where('payment_status', 'paid')->sum('token_amount') ?: 0);

        // Follow-ups in period
        $followUpQuery = FollowUp::whereBetween('scheduled_date', [$start->toDateString(), $end->toDateString()]);
        $totalFollowUps = (clone $followUpQuery)->count();
        $completedFollowUps = (clone $followUpQuery)->where('status', 'completed')->count();
        $followUpAdherence = $totalFollowUps > 0 ? round(($completedFollowUps / $totalFollowUps) * 100, 1) : 0;

        // 2. Patient Demographics & Categories (for all patients active in the period or hospital)
        $ageCategories = [
            'pediatric'   => Patient::where('age', '<=', 12)->count(),
            'adolescent'  => Patient::whereBetween('age', [13, 18])->count(),
            'young_adult' => Patient::whereBetween('age', [19, 35])->count(),
            'middle_aged' => Patient::whereBetween('age', [36, 55])->count(),
            'senior'      => Patient::whereBetween('age', [56, 70])->count(),
            'geriatric'   => Patient::where('age', '>', 70)->count(),
        ];

        $genderDistribution = Patient::select('gender', DB::raw('count(*) as total'))
            ->groupBy('gender')
            ->pluck('total', 'gender');

        $bloodGroupDistribution = Patient::select('blood_group', DB::raw('count(*) as total'))
            ->whereNotNull('blood_group')
            ->groupBy('blood_group')
            ->pluck('total', 'blood_group');

        $appointmentTypes = (clone $aptsQuery)->select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->pluck('total', 'type');

        // 3. Doctor-Wise Performance Breakdown
        $doctors = User::where('role', 'doctor')->get()->map(function ($doc) use ($startStr, $endStr) {
            $docCases = CaseRecord::where('doctor_id', $doc->id)
                ->whereBetween('admission_date', [$startStr, $endStr]);

            $totalCases = (clone $docCases)->count();
            $activeCases = (clone $docCases)->whereIn('status', ['open', 'in_progress'])->count();
            $closedCases = (clone $docCases)->where('status', 'closed')->count();
            $docSeverity = [
                'critical' => (clone $docCases)->where('severity', 'critical')->count(),
                'severe' => (clone $docCases)->where('severity', 'severe')->count(),
                'moderate' => (clone $docCases)->where('severity', 'moderate')->count(),
                'mild' => (clone $docCases)->where('severity', 'mild')->count(),
            ];

            $docApts = Appointment::where('doctor_id', $doc->id)
                ->whereBetween('scheduled_at', [$startStr, $endStr]);

            $totalDocApts = (clone $docApts)->count();
            $completedDocApts = (clone $docApts)->where('status', 'completed')->count();
            $noShowDocApts = (clone $docApts)->where('status', 'no_show')->count();
            $scheduledDocApts = (clone $docApts)->where('status', 'scheduled')->count();
            $cancelledDocApts = (clone $docApts)->where('status', 'cancelled')->count();

            $concluded = $completedDocApts + $noShowDocApts;
            $docAttendanceRate = $concluded > 0
                ? round(($completedDocApts / $concluded) * 100, 1)
                : ($totalDocApts > 0 ? 100.0 : 0.0);

            $docRevenue = (clone $docApts)->where('payment_status', 'paid')->sum('token_amount') ?: 0;

            $casePatientIds = (clone $docCases)->pluck('patient_id')->toArray();
            $aptPatientIds = (clone $docApts)->pluck('patient_id')->toArray();
            $assignedPatientIds = array_unique(array_merge($casePatientIds, $aptPatientIds));
            $assignedPatientsCount = count($assignedPatientIds);

            return [
                'id' => $doc->id,
                'name' => $doc->name,
                'email' => $doc->email,
                'specialization' => $doc->specialization ?? 'General Physician',
                'phone' => $doc->phone,
                'license_number' => $doc->license_number,
                'assigned_patients' => $assignedPatientsCount,
                'total_cases' => $totalCases,
                'active_cases' => $activeCases,
                'closed_cases' => $closedCases,
                'severity' => $docSeverity,
                'total_appointments' => $totalDocApts,
                'completed_appointments' => $completedDocApts,
                'no_show_appointments' => $noShowDocApts,
                'scheduled_appointments' => $scheduledDocApts,
                'cancelled_appointments' => $cancelledDocApts,
                'attendance_rate' => $docAttendanceRate,
                'token_revenue' => (float) $docRevenue,
            ];
        });

        return $this->sendResponse([
            'filter' => [
                'duration' => $duration,
                'label' => $label,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'start_datetime' => $startStr,
                'end_datetime' => $endStr,
            ],
            'executive_summary' => [
                'patients_intake_period' => $patientsInPeriod,
                'total_hospital_patients' => $totalHospitalPatients,
                'total_cases_admitted' => $totalCasesInPeriod,
                'cases_by_status' => $casesByStatus,
                'cases_by_severity' => $casesBySeverity,
                'total_appointments' => $totalAppointments,
                'appointments_by_status' => $aptsByStatus,
                'attendance_rate_percent' => $attendanceRate,
                'no_show_rate_percent' => $noShowRate,
                'total_followups' => $totalFollowUps,
                'followup_adherence_percent' => $followUpAdherence,
                'token_financials' => [
                    'currency' => 'INR',
                    'token_unit_fee' => 500,
                    'total_collected' => $tokenFeesCollected,
                    'credited_to_consultations' => $tokenFeesCredited,
                    'forfeited_no_show' => $tokenFeesForfeited,
                    'held_in_escrow' => $tokenFeesEscrow,
                ],
            ],
            'patient_categories' => [
                'by_severity' => $casesBySeverity,
                'by_age_group' => $ageCategories,
                'by_gender' => $genderDistribution,
                'by_blood_group' => $bloodGroupDistribution,
                'by_appointment_type' => $appointmentTypes,
            ],
            'doctors_breakdown' => $doctors,
        ], 'Comprehensive hospital summary report generated successfully.');
    }
}
