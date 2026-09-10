<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CaseDocument extends Model
{
    use HasFactory;

    protected $table = 'case_documents';

    protected $fillable = [
        'case_record_id',
        'patient_id',
        'uploaded_by',
        'title',
        'document_type', // 'lab_report', 'x_ray', 'mri', 'prescription_scan', 'discharge_summary', 'other'
        'file_path',
        'file_size',
        'file_mime',
    ];

    public function caseRecord()
    {
        return $this->belongsTo(CaseRecord::class, 'case_record_id');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
