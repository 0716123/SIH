<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->foreignId('primary_doctor_id')->nullable()->after('email')->constrained('users')->nullOnDelete();
            $table->index('primary_doctor_id');
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropForeign(['primary_doctor_id']);
            $table->dropIndex(['primary_doctor_id']);
            $table->dropColumn('primary_doctor_id');
        });
    }
};
