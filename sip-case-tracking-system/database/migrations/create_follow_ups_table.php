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

        Schema::create('follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_record_id')->constrained('cases')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->date('scheduled_date');
            $table->date('actual_date')->nullable();
            $table->string('purpose');
            $table->enum('status', ['pending', 'completed', 'missed'])->default('pending');
            $table->text('findings')->nullable();
            $table->text('recommendations')->nullable();
            $table->timestamps();

            $table->index('scheduled_date');
            $table->index('status');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('follow_ups');
        Schema::enableForeignKeyConstraints();
    }
};
