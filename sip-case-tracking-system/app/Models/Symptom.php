<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Symptom extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'category',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function caseSymptoms()
    {
        return $this->hasMany(CaseSymptom::class);
    }

    public function cases()
    {
        return $this->belongsToMany(CaseRecord::class, 'case_symptoms', 'symptom_id', 'case_record_id')
            ->withPivot(['id', 'severity', 'duration_days', 'notes'])
            ->withTimestamps();
    }
}
