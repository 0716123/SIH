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

        Schema::create('medical_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->unique()->constrained('patients')->cascadeOnDelete();
            $table->json('allergies')->nullable();
            $table->json('chronic_diseases')->nullable();
            $table->text('past_surgeries')->nullable();
            $table->text('family_history')->nullable();
            $table->text('current_medications')->nullable();
            $table->text('lifestyle_notes')->nullable();
            $table->timestamps();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('medical_history');
        Schema::enableForeignKeyConstraints();
    }
};
