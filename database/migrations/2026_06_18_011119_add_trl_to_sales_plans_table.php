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
        Schema::table('sales_plans', function (Blueprint $table) {
            $table->integer('tahan_customer')->default(0)->after('ac_customer');
            $table->integer('rebut_customer')->default(0)->after('tahan_customer');
            $table->integer('lepas_customer')->default(0)->after('rebut_customer');
            $table->integer('gagal_customer')->default(0)->after('lepas_customer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_plans', function (Blueprint $table) {
            $table->dropColumn(['tahan_customer', 'rebut_customer', 'lepas_customer', 'gagal_customer']);
        });
    }
};
