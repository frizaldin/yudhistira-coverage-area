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
        Schema::create('market_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained('areas')->cascadeOnDelete();
            $table->string('jenjang'); // SD/MI, SMP/MTs, SMA/MA, SMK, TOTAL
            $table->integer('dapodik_customer')->default(0);
            $table->integer('dapodik_student')->default(0);
            $table->integer('ac_customer')->default(0);
            $table->integer('real_customer')->default(0);
            $table->integer('real_exemplar')->default(0);
            $table->integer('target_customer')->default(0); // If present in the data
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('market_shares');
    }
};
