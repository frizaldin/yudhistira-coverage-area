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
        Schema::table('market_shares', function (Blueprint $table) {
            $table->string('city_code', 10)->nullable()->after('kecamatan_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('market_shares', function (Blueprint $table) {
            $table->dropColumn('city_code');
        });
    }
};
