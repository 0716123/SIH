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
        Schema::table('appointments', function (Blueprint $table) {
            $table->decimal('token_amount', 10, 2)->default(500.00)->after('type');
            $table->string('payment_status', 30)->default('paid')->after('token_amount'); // paid, pending, waived, refunded
            $table->string('payment_method', 50)->default('UPI')->after('payment_status'); // UPI, Card, Cash, NetBanking
            $table->string('transaction_id', 100)->nullable()->after('payment_method');
            $table->dateTime('paid_at')->nullable()->after('transaction_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['token_amount', 'payment_status', 'payment_method', 'transaction_id', 'paid_at']);
        });
    }
};

