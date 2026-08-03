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
        Schema::table('sales_area_covers', function (Blueprint $table) {
            $table->renameColumn('ac_2025_customer', 'ac_customer_prev');
            $table->renameColumn('real_2025_customer', 'real_customer_prev');
            $table->renameColumn('real_2025_exemplar', 'real_exemplar_prev');
            $table->renameColumn('ac_2026_customer', 'ac_customer_curr');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_area_covers', function (Blueprint $table) {
            $table->renameColumn('ac_customer_prev', 'ac_2025_customer');
            $table->renameColumn('real_customer_prev', 'real_2025_customer');
            $table->renameColumn('real_exemplar_prev', 'real_2025_exemplar');
            $table->renameColumn('ac_customer_curr', 'ac_2026_customer');
        });
    }
};
