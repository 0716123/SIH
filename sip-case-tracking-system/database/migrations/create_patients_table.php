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

        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('uhid', 50)->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->enum('gender', ['male', 'female', 'other']);
            $table->date('dob')->nullable();
            $table->unsignedSmallInteger('age')->nullable();
            $table->enum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])->nullable();
            $table->string('phone', 20);
            $table->string('email', 150)->nullable()->unique();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('phone');
            $table->index(['first_name', 'last_name']);
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('patients');
        Schema::enableForeignKeyConstraints();
    }
};
