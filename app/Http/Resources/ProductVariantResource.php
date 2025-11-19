<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'sku' => $this->sku,
            'gender' => $this->gender,
            'color' => $this->color,
            'size_system' => $this->size_system,
            'size' => (float) $this->size,
            'current_qty' => (int) $this->current_qty,
            'min_qty' => (int) $this->min_qty,
            'cost_price' => (float) $this->cost_price,
            'sell_price' => (float) $this->sell_price,
            'qr_token' => $this->qr_token,
            'is_active' => (bool) $this->is_active,
            'image_filename' => $this->image_filename,
            'image_url' => $this->image_url,
            'product' => $this->whenLoaded('product', function () {
                return [
                    'id' => $this->product->id,
                    'code' => $this->product->code,
                    'name' => $this->product->name,
                    'brand' => $this->product->brand,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
