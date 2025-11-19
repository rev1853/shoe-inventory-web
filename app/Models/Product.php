<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'brand',
        'category',
        'description',
        'default_cost_price',
        'default_sell_price',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'default_cost_price' => 'decimal:2',
        'default_sell_price' => 'decimal:2',
    ];

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }
}
