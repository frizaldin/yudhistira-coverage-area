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
        Schema::create('sales_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_id')->constrained('sales')->cascadeOnDelete();
            $table->integer('year');
            $table->integer('target_customer')->default(0);
            $table->integer('real_customer')->default(0);
            $table->integer('target_exemplar')->default(0);
            $table->integer('real_exemplar')->default(0);
            $table->timestamps();
            
            // A sales should only have one record per year
            $table->unique(['sales_id', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_histories');
    }
};
