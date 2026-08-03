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
            $table->unsignedBigInteger('kecamatan_code')->nullable();
            $table->foreign('kecamatan_code')->references('camat_code')->on('kecamatans')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('market_shares', function (Blueprint $table) {
            $table->dropForeign(['kecamatan_code']);
            $table->dropColumn('kecamatan_code');
        });
    }
};
