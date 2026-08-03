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
        Schema::create('configuration', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('logo')->nullable();
            $table->text('favicon')->nullable();

            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();
            $table->string('email')->nullable();

            $table->string('instagram')->nullable();
            $table->string('facebook')->nullable();
            $table->string('youtube')->nullable();

            $table->text('about_us')->nullable();
            $table->text('footer_description')->nullable();
            $table->text('footer_copyright')->nullable();

            $table->boolean('maintenance_mode')->default(false);

            $table->string('google_maps_embed')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();
            $table->text('og_image')->nullable();

            $table->string('site_name');
            $table->string('site_tagline')->nullable();
            $table->string('site_url')->nullable();
            $table->string('copyright')->nullable();

            $table->text('terms_conditions')->nullable();
            $table->text('privacy_policy')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configuration');
    }
};
