<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_plans', function (Blueprint $table) {
            if (!Schema::hasColumn('customer_plans', 'sp_exemplar')) {
                $table->bigInteger('sp_exemplar')->default(0)->after('real_exemplar');
            }
        });

        Schema::table('sales_plans', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_plans', 'sp_exemplar')) {
                $table->bigInteger('sp_exemplar')->default(0)->after('real_exemplar');
            }
        });
    }

    public function down(): void
    {
        Schema::table('customer_plans', function (Blueprint $table) {
            if (Schema::hasColumn('customer_plans', 'sp_exemplar')) {
                $table->dropColumn('sp_exemplar');
            }
        });

        Schema::table('sales_plans', function (Blueprint $table) {
            if (Schema::hasColumn('sales_plans', 'sp_exemplar')) {
                $table->dropColumn('sp_exemplar');
            }
        });
    }
};
