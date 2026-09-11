<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_number',
        'patient_id',
        'doctor_id',
        'scheduled_at',
        'reason',
        'type',           // 'consultation', 'follow_up', 'emergency'
        'status',         // 'scheduled', 'completed', 'cancelled', 'no_show'
        'token_amount',   // advance commitment fee (e.g. 500)
        'payment_status', // 'paid', 'pending', 'waived', 'refunded'
        'payment_method', // 'UPI', 'Card', 'Cash', 'NetBanking'
        'transaction_id',
        'paid_at',
        'remarks',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'paid_at' => 'datetime',
        'token_amount' => 'decimal:2',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('scheduled_at', today());
    }

    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_at', '>=', now())->orderBy('scheduled_at', 'asc');
    }
}
