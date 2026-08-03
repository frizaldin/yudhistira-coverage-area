<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kecamatans', function (Blueprint $table) {
            $table->unsignedBigInteger('camat_code')->primary();
            $table->unsignedBigInteger('city_code');
            $table->string('camat_name', 150);
            $table->text('geomap')->nullable();
            $table->timestamps();

            $table->foreign('city_code')
                ->references('city_code')
                ->on('cities')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kecamatans');
    }
};
