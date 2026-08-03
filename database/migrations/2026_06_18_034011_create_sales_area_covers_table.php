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
        Schema::create('sales_area_covers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sales_id');
            $table->string('jenjang')->comment('SD, SMP, SMA, SMK, DLL, TOTAL');

            // AC 2025
            $table->integer('ac_2025_customer')->default(0);

            // REAL 2025
            $table->integer('real_2025_customer')->default(0);
            $table->bigInteger('real_2025_exemplar')->default(0);

            // AC 2026
            $table->integer('ac_2026_customer')->default(0);

            // REN JUAL 2026
            $table->integer('target_customer')->default(0);
            $table->bigInteger('target_exemplar')->default(0);

            $table->timestamps();
            $table->unique(['sales_id', 'jenjang']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_area_covers');
    }
};
