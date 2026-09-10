<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::create('case_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_record_id')->constrained('cases')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->enum('document_type', [
                'lab_report',
                'x_ray',
                'mri',
                'prescription_scan',
                'discharge_summary',
                'other'
            ])->default('other');
            $table->string('file_path');
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('file_mime', 100)->nullable();
            $table->timestamps();

            $table->index('document_type');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('case_documents');
        Schema::enableForeignKeyConstraints();
    }
};
