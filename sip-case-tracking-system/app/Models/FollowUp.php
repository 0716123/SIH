<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FollowUp extends Model
{
    use HasFactory;

    protected $table = 'follow_ups';

    protected $fillable = [
        'case_record_id',
        'patient_id',
        'doctor_id',
        'scheduled_date',
        'actual_date',
        'purpose',
        'status', // 'pending', 'completed', 'missed'
        'findings',
        'recommendations',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'actual_date' => 'date',
    ];

    public function caseRecord()
    {
        return $this->belongsTo(CaseRecord::class, 'case_record_id');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
