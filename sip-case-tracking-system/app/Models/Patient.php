<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'uhid',
        'first_name',
        'last_name',
        'gender',
        'dob',
        'age',
        'blood_group',
        'phone',
        'email',
        'primary_doctor_id',
        'address',
        'city',
        'emergency_contact_name',
        'emergency_contact_phone',
        'is_active',
    ];

    protected $casts = [
        'dob' => 'date',
        'age' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function medicalHistory()
    {
        return $this->hasOne(MedicalHistory::class);
    }

    public function cases()
    {
        return $this->hasMany(CaseRecord::class);
    }

    public function primaryDoctor()
    {
        return $this->belongsTo(User::class, 'primary_doctor_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function followUps()
    {
        return $this->hasMany(FollowUp::class);
    }

    public function documents()
    {
        return $this->hasMany(CaseDocument::class);
    }

    public function charges()
    {
        return $this->hasMany(Charge::class);
    }
}
