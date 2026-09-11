<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\ChargeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\FollowUpController;
use App\Http\Controllers\MedicalHistoryController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\PresenceController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SymptomController;
use App\Http\Controllers\TreatmentController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - SIP Case Tracking System
|--------------------------------------------------------------------------
|
| Secure RESTful endpoints for digital case history and patient tracking.
| Authentication is managed using Laravel Sanctum with role middleware.
|
*/

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        return response()->json([
            'status'    => 'healthy',
            'database'  => 'connected',
            'timestamp' => now()->timestamp,
        ]);
    } catch (\Throwable $exception) {
        return response()->json([
            'status'    => 'degraded',
            'database'  => 'unavailable',
            'timestamp' => now()->timestamp,
        ], 503);
    }
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->name('api.auth.login');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('api.auth.forgot-password');
});

// ==========================================
// 2. PROTECTED AUTHENTICATED ROUTES
// ==========================================
Route::middleware(['auth:sanctum'])->group(function () {

    // Auth & Profile
    Route::prefix('auth')->group(function () {
        Route::get('/profile', [AuthController::class, 'profile'])->name('api.auth.profile');
        Route::put('/profile', [AuthController::class, 'updateProfile'])->name('api.auth.profile.update');
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.auth.logout');
        Route::post('/register', [AuthController::class, 'register'])
            ->middleware('role:admin')
            ->name('api.auth.register');
    });

    // Realtime Presence Tracking
    Route::prefix('presence')->group(function () {
        Route::post('/heartbeat', [PresenceController::class, 'heartbeat'])->name('api.presence.heartbeat');
        Route::get('/active-users', [PresenceController::class, 'activeUsers'])->name('api.presence.active-users');
    });

    // Dashboards
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('api.dashboard');
        Route::get('/admin', [DashboardController::class, 'adminDashboard'])->middleware('role:admin')->name('api.dashboard.admin');
        Route::get('/doctor', [DashboardController::class, 'doctorDashboard'])->middleware('role:doctor,admin')->name('api.dashboard.doctor');
    });

    // Patients Management
    Route::prefix('patients')->group(function () {
        Route::get('/', [PatientController::class, 'index'])->name('api.patients.index');
        Route::post('/', [PatientController::class, 'store'])->name('api.patients.store');
        Route::get('/sync', [PatientController::class, 'sync'])->name('api.patients.sync');
        Route::get('/stream', [PatientController::class, 'stream'])->name('api.patients.stream');
        Route::get('/{id}', [PatientController::class, 'show'])->name('api.patients.show');
        Route::put('/{id}', [PatientController::class, 'update'])->name('api.patients.update');
        Route::delete('/{id}', [PatientController::class, 'destroy'])->middleware('role:admin')->name('api.patients.destroy');
        Route::get('/{id}/case-history', [PatientController::class, 'caseHistory'])->name('api.patients.case-history');

        // Patient Medical History
        Route::get('/{patientId}/medical-history', [MedicalHistoryController::class, 'showByPatient'])->name('api.medical-history.show');
        Route::post('/{patientId}/medical-history', [MedicalHistoryController::class, 'updateOrCreate'])->name('api.medical-history.save');
        Route::get('/{patientId}/allergy-check', [MedicalHistoryController::class, 'allergyCheck'])->name('api.medical-history.allergy-check');
    });

    // Digital Case Records
    Route::prefix('cases')->group(function () {
        Route::get('/', [CaseController::class, 'index'])->name('api.cases.index');
        Route::post('/', [CaseController::class, 'store'])->middleware('role:admin,doctor')->name('api.cases.store');
        Route::get('/{id}', [CaseController::class, 'show'])->name('api.cases.show');
        Route::put('/{id}', [CaseController::class, 'update'])->middleware('role:admin,doctor')->name('api.cases.update');
        Route::patch('/{id}/status', [CaseController::class, 'updateStatus'])->middleware('role:admin,doctor')->name('api.cases.update-status');
        Route::post('/{id}/symptoms', [CaseController::class, 'addSymptom'])->middleware('role:admin,doctor')->name('api.cases.add-symptom');
        Route::delete('/{caseId}/symptoms/{symptomId}', [CaseController::class, 'removeSymptom'])->middleware('role:admin,doctor')->name('api.cases.remove-symptom');
        Route::post('/{id}/documents', [CaseController::class, 'uploadDocument'])->name('api.cases.upload-document');
        Route::get('/{id}/print-summary', [CaseController::class, 'printSummary'])->name('api.cases.print-summary');
        Route::get('/{caseId}/prescriptions', [PrescriptionController::class, 'byCase'])->name('api.cases.prescriptions');
    });

    // Clinical Symptoms Catalog
    Route::prefix('symptoms')->group(function () {
        Route::get('/', [SymptomController::class, 'index'])->name('api.symptoms.index');
        Route::get('/categories', [SymptomController::class, 'categories'])->name('api.symptoms.categories');
        Route::post('/', [SymptomController::class, 'store'])->middleware('role:admin,doctor')->name('api.symptoms.store');
        Route::get('/{id}', [SymptomController::class, 'show'])->name('api.symptoms.show');
        Route::put('/{id}', [SymptomController::class, 'update'])->middleware('role:admin,doctor')->name('api.symptoms.update');
        Route::delete('/{id}', [SymptomController::class, 'destroy'])->middleware('role:admin')->name('api.symptoms.destroy');
    });

    // Treatment Plans
    Route::prefix('treatments')->group(function () {
        Route::get('/', [TreatmentController::class, 'index'])->name('api.treatments.index');
        Route::post('/', [TreatmentController::class, 'store'])->middleware('role:admin,doctor')->name('api.treatments.store');
        Route::get('/{id}', [TreatmentController::class, 'show'])->name('api.treatments.show');
        Route::put('/{id}', [TreatmentController::class, 'update'])->middleware('role:admin,doctor')->name('api.treatments.update');
        Route::delete('/{id}', [TreatmentController::class, 'destroy'])->middleware('role:admin')->name('api.treatments.destroy');
    });

    // Prescriptions
    Route::prefix('prescriptions')->group(function () {
        Route::get('/', [PrescriptionController::class, 'index'])->name('api.prescriptions.index');
        Route::post('/', [PrescriptionController::class, 'store'])->middleware('role:admin,doctor')->name('api.prescriptions.store');
        Route::get('/{id}', [PrescriptionController::class, 'show'])->name('api.prescriptions.show');
        Route::put('/{id}', [PrescriptionController::class, 'update'])->middleware('role:admin,doctor')->name('api.prescriptions.update');
        Route::delete('/{id}', [PrescriptionController::class, 'destroy'])->middleware('role:admin,doctor')->name('api.prescriptions.destroy');
    });

    // Patient Charges
    Route::prefix('charges')->group(function () {
        Route::get('/', [ChargeController::class, 'index'])->name('api.charges.index');
        Route::post('/', [ChargeController::class, 'store'])->middleware('role:admin,staff')->name('api.charges.store');
        Route::patch('/{id}', [ChargeController::class, 'update'])->middleware('role:admin,staff')->name('api.charges.update');
    });

    // Appointments
    Route::prefix('appointments')->group(function () {
        Route::get('/', [AppointmentController::class, 'index'])->name('api.appointments.index');
        Route::get('/today', [AppointmentController::class, 'today'])->name('api.appointments.today');
        Route::post('/', [AppointmentController::class, 'store'])->name('api.appointments.store');
        Route::get('/{id}', [AppointmentController::class, 'show'])->name('api.appointments.show');
        Route::put('/{id}', [AppointmentController::class, 'update'])->name('api.appointments.update');
        Route::patch('/{id}/status', [AppointmentController::class, 'updateStatus'])->name('api.appointments.update-status');
        Route::delete('/{id}', [AppointmentController::class, 'destroy'])->name('api.appointments.destroy');
    });

    // Follow-ups
    Route::prefix('follow-ups')->group(function () {
        Route::get('/', [FollowUpController::class, 'index'])->name('api.follow-ups.index');
        Route::get('/pending', [FollowUpController::class, 'pending'])->name('api.follow-ups.pending');
        Route::post('/', [FollowUpController::class, 'store'])->name('api.follow-ups.store');
        Route::get('/{id}', [FollowUpController::class, 'show'])->name('api.follow-ups.show');
        Route::put('/{id}', [FollowUpController::class, 'update'])->name('api.follow-ups.update');
        Route::post('/{id}/complete', [FollowUpController::class, 'complete'])->middleware('role:admin,doctor')->name('api.follow-ups.complete');
        Route::delete('/{id}', [FollowUpController::class, 'destroy'])->name('api.follow-ups.destroy');
    });

    // Doctors Management
    Route::prefix('doctors')->group(function () {
        Route::get('/', [DoctorController::class, 'index'])->name('api.doctors.index');
        Route::post('/', [DoctorController::class, 'store'])->middleware('role:admin')->name('api.doctors.store');
        Route::get('/{id}', [DoctorController::class, 'show'])->name('api.doctors.show');
        Route::put('/{id}', [DoctorController::class, 'update'])->middleware('role:admin')->name('api.doctors.update');
        Route::delete('/{id}', [DoctorController::class, 'destroy'])->middleware('role:admin')->name('api.doctors.destroy');
        Route::get('/{id}/schedule', [DoctorController::class, 'schedule'])->name('api.doctors.schedule');
    });

    // Reports Generation
    Route::prefix('reports')->middleware('role:admin,doctor')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('api.reports.index');
        Route::get('/patients', [ReportController::class, 'patientReport'])->name('api.reports.patients');
        Route::get('/cases', [ReportController::class, 'caseReport'])->name('api.reports.cases');
        Route::get('/appointments', [ReportController::class, 'appointmentReport'])->name('api.reports.appointments');
        Route::get('/follow-ups', [ReportController::class, 'followUpReport'])->name('api.reports.follow-ups');
        Route::get('/hospital-summary', [ReportController::class, 'hospitalSummary'])->name('api.reports.hospital-summary');
    });
});
