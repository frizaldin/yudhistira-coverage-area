<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->unsignedBigInteger('city_code')->primary();
            $table->string('city_name', 150);
            $table->unsignedBigInteger('province_code');
            $table->unsignedTinyInteger('region')->nullable();
            $table->unsignedTinyInteger('region_b')->nullable();
            $table->unsignedTinyInteger('region_c')->nullable();
            $table->unsignedTinyInteger('region_s')->nullable();
            $table->timestamps();

            $table->foreign('province_code')
                ->references('province_code')
                ->on('provinces')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
