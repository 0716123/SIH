<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The column is defined in create_patients_table.php for fresh databases.
        return;
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
