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

        Schema::create('case_symptoms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_record_id')->constrained('cases')->cascadeOnDelete();
            $table->foreignId('symptom_id')->constrained('symptoms')->cascadeOnDelete();
            $table->enum('severity', ['mild', 'moderate', 'severe'])->default('moderate');
            $table->unsignedSmallInteger('duration_days')->default(1);
            $table->string('notes', 500)->nullable();
            $table->timestamps();

            $table->unique(['case_record_id', 'symptom_id']);
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('case_symptoms');
        Schema::enableForeignKeyConstraints();
    }
};
