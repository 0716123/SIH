<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('charges')) {
            return;
        }

        Schema::create('charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_record_id')->constrained('cases')->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->string('description', 255);
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['pending', 'paid', 'waived'])->default('pending');
            $table->string('receipt_number', 50)->nullable()->unique();
            $table->dateTime('paid_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['patient_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};