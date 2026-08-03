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
        Schema::table('customer_plans', function (Blueprint $table) {
            \App\Models\CustomerPlan::truncate(); // Truncate old data
            $table->string('sumber_dana')->after('year')->default('SWA');
            $table->integer('real_exemplar')->default(0)->after('target_exemplar');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_plans', function (Blueprint $table) {
            $table->dropColumn(['sumber_dana', 'real_exemplar']);
        });
    }
};
