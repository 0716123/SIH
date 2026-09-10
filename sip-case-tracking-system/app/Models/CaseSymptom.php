<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaseSymptom extends Model
{
    use HasFactory;

    protected $table = 'case_symptoms';

    protected $fillable = [
        'case_record_id',
        'symptom_id',
        'severity', // 'mild', 'moderate', 'severe'
        'duration_days',
        'notes',
    ];

    protected $casts = [
        'duration_days' => 'integer',
    ];

    public function caseRecord()
    {
        return $this->belongsTo(CaseRecord::class, 'case_record_id');
    }

    public function symptom()
    {
        return $this->belongsTo(Symptom::class, 'symptom_id');
    }
}
