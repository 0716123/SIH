# SIP Digital Case History & Patient Tracking System (Backend API)

A robust, enterprise-ready **PHP / Laravel** backend for hospital, clinic, and digital medical case management.

---

## Architecture & Directory Structure

```
sip-case-tracking-system/
│
├── app/                                      [PHP / Laravel]
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php                [Base Controller & JSON Formatter]
│   │   │   ├── AuthController.php            [Secure Login & Token Generation]
│   │   │   ├── DashboardController.php       [Analytics & Hospital Metrics]
│   │   │   ├── PatientController.php         [Patient Records & Case Histories]
│   │   │   ├── CaseController.php            [Digital Case History & Tracking]
│   │   │   ├── SymptomController.php         [Symptom Catalog & Categories]
│   │   │   ├── MedicalHistoryController.php  [Allergies & Medical History]
│   │   │   ├── TreatmentController.php       [Treatment Plans & Notes]
│   │   │   ├── PrescriptionController.php    [Medication & Dosages]
│   │   │   ├── AppointmentController.php     [Appointment Scheduling & Calendar]
│   │   │   ├── FollowUpController.php        [Follow-up Tracking & Adherence]
│   │   │   ├── DoctorController.php          [Doctor Profiles & Schedules]
│   │   │   └── ReportController.php          [Analytical Reports Generation]
│   │   │
│   │   ├── Middleware/
│   │   │   └── RoleMiddleware.php             [RBAC Authorization: Admin, Doctor, Staff]
│   │   │
│   │   └── Requests/                         [Form Validation]
│   │       ├── PatientRequest.php
│   │       ├── CaseRequest.php
│   │       ├── AppointmentRequest.php
│   │       └── TreatmentRequest.php
│   │
│   └── Models/                               [Eloquent Models & Relationships]
│       ├── User.php                          [User Account & Auth Tokens]
│       ├── Patient.php                       [Patient Demographics & Cases]
│       ├── CaseRecord.php                    [Digital Medical Case Record]
│       ├── Symptom.php                       [Clinical Symptoms]
│       ├── CaseSymptom.php                   [Pivot with Severity & Duration]
│       ├── MedicalHistory.php                [Patient Allergies & History]
│       ├── Treatment.php                     [Treatment Protocols]
│       ├── Prescription.php                  [Prescription Details]
│       ├── Appointment.php                   [Patient Appointments]
│       ├── FollowUp.php                      [Follow-up Consultations]
│       └── CaseDocument.php                  [Medical Files & Attachments]
│
├── routes/
│   ├── api.php                               [RESTful API Endpoints & Role Gates]
│   └── web.php                               [System Health & Status Route]
│
├── database/
│   ├── migrations/
│   │   ├── create_users_table.php
│   │   ├── create_patients_table.php
│   │   ├── create_cases_table.php
│   │   ├── create_symptoms_table.php
│   │   ├── create_case_symptoms_table.php
│   │   ├── create_medical_history_table.php
│   │   ├── create_treatments_table.php
│   │   ├── create_prescriptions_table.php
│   │   ├── create_appointments_table.php
│   │   ├── create_follow_ups_table.php
│   │   └── create_case_documents_table.php
│   │
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── UserSeeder.php
│       └── SymptomSeeder.php
│
├── lang/                                     [Multilingual Localization]
│   ├── en/messages.php                       [English Strings]
│   └── gu/messages.php                       [Gujarati Strings (ગુજરાતી)]
│
├── public/
│   ├── index.php                             [Web Entry Point]
│   └── uploads/
│       ├── patients/                         [Patient Documents]
│       └── case-documents/                   [Medical Attachment Storage]
│
├── .env                                      [Environment Configuration]
├── .env.example
├── composer.json                             [PHP / Laravel Dependencies]
└── artisan                                   [Laravel CLI]
```

---

## Getting Started

### 1. Prerequisites
- **PHP 8.1+** (with `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`)
- **Composer**
- **MySQL 5.7+ / MariaDB 10.3+**

### 2. Installation Steps
```bash
# Navigate to project directory
cd sip-case-tracking-system

# Install PHP dependencies
composer install

# Configure database in .env
# DB_DATABASE=sip_case_tracking
# DB_USERNAME=root
# DB_PASSWORD=

# Generate Application Key
php artisan key:generate

# Run Database Migrations & Seed Default Data
php artisan migrate --seed

# Start the Development Server
php artisan serve
```
The backend API will be available at: `http://127.0.0.1:8000`

---

## Pre-seeded Demo Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sip.org` | `Admin@12345` | Full System Access |
| **Doctor** | `dr.rajesh@sip.org` | `Doctor@12345` | General Medicine & Infectious Diseases |
| **Doctor** | `dr.priya@sip.org` | `Doctor@12345` | Pulmonology & Critical Care |
| **Doctor** | `dr.anand@sip.org` | `Doctor@12345` | Cardiology |
| **Staff** | `staff@sip.org` | `Staff@12345` | Outpatient Desk & Registration |

---

## Core API Endpoints

### 1. Authentication & Profile
- `POST /api/auth/login` - Authenticate user and receive Bearer Token.
- `POST /api/auth/forgot-password` - Request password reset token.
- `GET /api/auth/profile` *(Protected)* - Get profile and statistics.
- `PUT /api/auth/profile` *(Protected)* - Update user details/password.
- `POST /api/auth/register` *(Admin only)* - Register doctor/staff accounts.
- `POST /api/auth/logout` *(Protected)* - Invalidate current session token.

### 2. Dashboards
- `GET /api/dashboard` *(Protected)* - Role-aware dashboard.
- `GET /api/dashboard/admin` *(Admin only)* - Hospital statistics, case severity breakdown, occupancy.
- `GET /api/dashboard/doctor` *(Doctor/Admin)* - Doctor caseload, today's consultations, urgent follow-ups.

### 3. Patient Management
- `GET /api/patients` - Paginated patient list with search (UHID, Name, Phone).
- `POST /api/patients` - Register patient (auto-generates UHID if not provided).
- `GET /api/patients/{id}` - Complete profile, case records, medical history.
- `PUT /api/patients/{id}` - Update patient details.
- `DELETE /api/patients/{id}` *(Admin only)* - Delete patient (safeguarded against active cases).
- `GET /api/patients/{id}/case-history` - Chronological medical history of all cases.
- `GET /api/patients/{patientId}/medical-history` - Allergies, chronic diseases, past surgeries.
- `POST /api/patients/{patientId}/medical-history` - Upsert medical history.
- `GET /api/patients/{patientId}/allergy-check` - Allergy contraindication check.

### 4. Digital Case Tracking
- `GET /api/cases` - List cases with status/severity/doctor/patient filters.
- `POST /api/cases` *(Doctor/Admin)* - Create new digital case history.
- `GET /api/cases/{id}` - Full clinical file (symptoms, treatments, prescriptions, files).
- `PUT /api/cases/{id}` *(Doctor/Admin)* - Update case notes and diagnosis.
- `PATCH /api/cases/{id}/status` *(Doctor/Admin)* - Update case status (`open`, `in_progress`, `closed`, `referred`).
- `POST /api/cases/{id}/symptoms` *(Doctor/Admin)* - Attach symptom with severity and duration.
- `DELETE /api/cases/{caseId}/symptoms/{symptomId}` - Detach symptom from case.
- `POST /api/cases/{id}/documents` - Upload radiology, lab report, or clinical file.
- `GET /api/cases/{id}/print-summary` - Formatted JSON for case print report.

### 5. Appointments & Follow-ups
- `GET /api/appointments` - Filter appointments by date, doctor, or status.
- `GET /api/appointments/today` - Today's appointments list.
- `POST /api/appointments` - Book appointment with auto number (`APT-YYYYMMDD-XXXX`).
- `PATCH /api/appointments/{id}/status` - Status update (`scheduled`, `completed`, `cancelled`, `no_show`).
- `GET /api/follow-ups` - List follow-up consultations.
- `GET /api/follow-ups/pending` - Pending follow-ups in the next 7 days.
- `POST /api/follow-ups` - Schedule follow-up.
- `POST /api/follow-ups/{id}/complete` - Record clinical findings and closure.

### 6. Reports Generation
- `GET /api/reports` - Reports overview.
- `GET /api/reports/patients` - Demographic analytics (gender, age groups, blood groups).
- `GET /api/reports/cases` - Case tracking analytics (severity distribution, doctor caseload).
- `GET /api/reports/appointments` - Appointment utilization and cancellation rates.
- `GET /api/reports/follow-ups` - Follow-up compliance and adherence rate.

---

## Multilingual Support (English & Gujarati)
Switch application locale by passing the `Accept-Language` HTTP header:
- English: `Accept-Language: en`
- Gujarati: `Accept-Language: gu`
