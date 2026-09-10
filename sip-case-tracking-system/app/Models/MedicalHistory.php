<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalHistory extends Model
{
    use HasFactory;

    protected $table = 'medical_history';

    protected $fillable = [
        'patient_id',
        'allergies',
        'chronic_diseases',
        'past_surgeries',
        'family_history',
        'current_medications',
        'lifestyle_notes',
    ];

    protected $casts = [
        'allergies' => 'array',
        'chronic_diseases' => 'array',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}
