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

        Schema::create('treatments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_record_id')->constrained('cases')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('treatment_name');
            $table->text('description')->nullable();
            $table->text('procedure_details')->nullable();
            $table->text('outcome')->nullable();
            $table->enum('status', ['planned', 'in_progress', 'completed', 'discontinued'])->default('planned');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();

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
        Schema::dropIfExists('treatments');
        Schema::enableForeignKeyConstraints();
    }
};
