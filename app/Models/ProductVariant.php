<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'sku',
        'gender',
        'color',
        'image_filename',
        'size_system',
        'size',
        'current_qty',
        'min_qty',
        'cost_price',
        'sell_price',
        'qr_token',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'size' => 'decimal:1',
        'current_qty' => 'integer',
        'min_qty' => 'integer',
        'cost_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
    ];

    protected $appends = [
        'image_url',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'variant_id');
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_filename) {
            return null;
        }

        return Storage::disk('public')->url('products/'.$this->image_filename);
    }
}
