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
        Schema::table('kecamatans', function (Blueprint $table) {
            $table->integer('dapodik_customer')->default(0)->after('cabang_id');
            $table->integer('dapodik_student')->default(0)->after('dapodik_customer');
            $table->integer('ac_customer')->default(0)->after('dapodik_student');
            $table->integer('real_customer')->default(0)->after('ac_customer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kecamatans', function (Blueprint $table) {
            $table->dropColumn(['dapodik_customer', 'dapodik_student', 'ac_customer', 'real_customer']);
        });
    }
};
