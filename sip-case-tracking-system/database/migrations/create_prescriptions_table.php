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

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('treatment_id')->nullable()->constrained('treatments')->cascadeOnDelete();
            $table->foreignId('case_record_id')->constrained('cases')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('medicine_name');
            $table->string('dosage', 100);
            $table->string('frequency', 100);
            $table->string('route', 50)->default('Oral');
            $table->string('duration', 100)->nullable();
            $table->string('instructions', 500)->nullable();
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
        Schema::dropIfExists('prescriptions');
        Schema::enableForeignKeyConstraints();
    }
};
