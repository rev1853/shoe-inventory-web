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
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku', 100)->unique();
            $table->enum('gender', ['MEN', 'WOMEN', 'UNISEX', 'KIDS']);
            $table->string('color', 50);
            $table->string('image_filename')->nullable();
            $table->enum('size_system', ['EU', 'UK', 'US', 'CM']);
            $table->decimal('size', 4, 1);
            $table->integer('current_qty')->default(0);
            $table->integer('min_qty')->default(0);
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('sell_price', 12, 2)->default(0);
            $table->string('qr_token', 100)->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['product_id', 'gender', 'color', 'size_system', 'size'], 'product_variants_unique_variant');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
