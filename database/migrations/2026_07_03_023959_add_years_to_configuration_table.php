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
        Schema::table('configuration', function (Blueprint $table) {
            $table->string('prev_year')->nullable()->default('2025')->after('privacy_policy');
            $table->string('target_year')->nullable()->default('2026')->after('prev_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('configuration', function (Blueprint $table) {
            $table->dropColumn(['prev_year', 'target_year']);
        });
    }
};
