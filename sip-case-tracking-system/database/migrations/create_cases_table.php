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

        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number', 50)->unique();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->text('diagnosis')->nullable();
            $table->enum('severity', ['mild', 'moderate', 'severe', 'critical'])->default('moderate');
            $table->enum('status', ['open', 'in_progress', 'closed', 'referred'])->default('open');
            $table->dateTime('admission_date')->nullable();
            $table->dateTime('discharge_date')->nullable();
            $table->text('closure_notes')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('severity');
            $table->index('admission_date');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('cases');
        Schema::enableForeignKeyConstraints();
    }
};
