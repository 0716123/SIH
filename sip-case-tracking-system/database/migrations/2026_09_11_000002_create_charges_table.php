<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Charges are created by zzz_create_charges_table.php after core tables.
        return;
    }

    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
