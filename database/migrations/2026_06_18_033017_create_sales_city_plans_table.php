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
        Schema::create('sales_city_plans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sales_id');
            $table->string('city_name');
            $table->string('sumber_dana')->comment('SWADANA, BOS, TOTAL');
            
            // REAL 2025
            $table->integer('real_customer')->default(0);
            $table->bigInteger('real_exemplar')->default(0);

            // AC 2026
            $table->integer('ac_customer')->default(0);
            $table->bigInteger('potensi')->default(0);

            // REN JUAL 2026
            $table->integer('target_customer')->default(0);
            $table->bigInteger('target_exemplar')->default(0);

            $table->timestamps();

            // Optional foreign key to sales
            // $table->foreign('sales_id')->references('id')->on('sales')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_city_plans');
    }
};
