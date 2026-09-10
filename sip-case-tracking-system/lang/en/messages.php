<?php

return [
    // General Status & Feedback
    'success'              => 'Operation completed successfully.',
    'error'                => 'An error occurred while processing your request.',
    'unauthorized'         => 'You do not have permission to access this resource.',
    'not_found'            => 'The requested resource was not found.',
    'validation_error'     => 'Validation failed. Please check your input.',

    // Authentication
    'login_success'        => 'Login successful. Welcome back.',
    'logout_success'       => 'You have been logged out successfully.',
    'invalid_credentials'  => 'Invalid email address or password.',
    'account_inactive'     => 'Your account has been deactivated. Please contact the administrator.',
    'auth_failed'          => 'Authentication failed.',

    // Patient Module
    'patient_created'      => 'Patient record registered successfully.',
    'patient_updated'      => 'Patient record updated successfully.',
    'patient_deleted'      => 'Patient record deleted successfully.',
    'patient_not_found'    => 'Patient record not found.',

    // Case Tracking Module
    'case_created'         => 'Digital case record registered successfully.',
    'case_updated'         => 'Case record details updated successfully.',
    'case_deleted'         => 'Case record deleted successfully.',
    'case_not_found'       => 'Case record not found.',
    'case_status_updated'  => 'Case status updated successfully.',
    'case_closed'          => 'Case has been formally closed and discharged.',

    // Case Statuses
    'status_open'          => 'Open',
    'status_in_progress'   => 'In Progress',
    'status_closed'        => 'Closed',
    'status_referred'      => 'Referred',

    // Case Severities
    'severity_mild'        => 'Mild',
    'severity_moderate'    => 'Moderate',
    'severity_severe'      => 'Severe',
    'severity_critical'    => 'Critical',

    // Appointments & Follow-ups
    'appointment_booked'   => 'Appointment scheduled successfully.',
    'appointment_updated'  => 'Appointment rescheduled successfully.',
    'appointment_cancelled'=> 'Appointment cancelled successfully.',
    'follow_up_scheduled'  => 'Follow-up consultation scheduled successfully.',
    'follow_up_completed'  => 'Follow-up examination recorded as completed.',

    // Medical History & Treatment
    'medical_history_saved'=> 'Patient medical history updated successfully.',
    'treatment_created'    => 'Treatment plan initiated successfully.',
    'prescription_added'   => 'Prescription issued successfully.',
];
