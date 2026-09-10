<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaseRecord extends Model
{
    use HasFactory;

    protected $table = 'cases';

    protected $fillable = [
        'case_number',
        'patient_id',
        'doctor_id',
        'title',
        'description',
        'diagnosis',
        'severity', // 'mild', 'moderate', 'severe', 'critical'
        'status',   // 'open', 'in_progress', 'closed', 'referred'
        'admission_date',
        'discharge_date',
        'closure_notes',
    ];

    protected $casts = [
        'admission_date' => 'datetime',
        'discharge_date' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function caseSymptoms()
    {
        return $this->hasMany(CaseSymptom::class, 'case_record_id');
    }

    public function symptoms()
    {
        return $this->belongsToMany(Symptom::class, 'case_symptoms', 'case_record_id', 'symptom_id')
            ->withPivot(['id', 'severity', 'duration_days', 'notes'])
            ->withTimestamps();
    }

    public function treatments()
    {
        return $this->hasMany(Treatment::class, 'case_record_id');
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'case_record_id');
    }

    public function followUps()
    {
        return $this->hasMany(FollowUp::class, 'case_record_id');
    }

    public function documents()
    {
        return $this->hasMany(CaseDocument::class, 'case_record_id');
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['open', 'in_progress']);
    }
}
