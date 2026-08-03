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
        Schema::create('sales_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_id')->constrained('sales')->cascadeOnDelete();
            $table->integer('year');
            $table->integer('real_customer');
            $table->integer('real_exemplar');
            $table->integer('ac_customer');
            $table->integer('potential_exemplar');
            $table->integer('target_customer');
            $table->integer('target_exemplar');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_plans');
    }
};
