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
        Schema::table('areas', function (Blueprint $table) {
            $table->dropColumn(['province', 'city', 'district']);
            $table->string('name')->after('id')->nullable();
        });

        Schema::create('cabangs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('area_id')->constrained('areas')->onDelete('cascade');
            $table->string('kode_cabang');
            $table->string('nama_cabang');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cabangs');
        
        Schema::table('areas', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->string('district')->nullable();
        });
    }
};
