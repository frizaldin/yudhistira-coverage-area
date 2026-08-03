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
        Schema::create('sales_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->string('sales_name')->nullable();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->integer('real_lalu')->default(0);
            $table->integer('rencana_jual')->default(0);
            $table->string('tanggal')->nullable();
            $table->string('aktivitas')->nullable();
            $table->string('hasil')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_activities');
    }
};
