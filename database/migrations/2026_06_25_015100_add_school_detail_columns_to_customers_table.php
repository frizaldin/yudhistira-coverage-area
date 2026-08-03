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
        Schema::table('customers', function (Blueprint $table) {
            $table->boolean('is_active')->default(false)->after('total_student');
            $table->string('penerbit')->nullable()->after('is_active');
            $table->string('sumber_dana')->nullable()->after('penerbit');
            $table->integer('potensi_sekolah')->nullable()->after('sumber_dana');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'penerbit', 'sumber_dana', 'potensi_sekolah']);
        });
    }
};
