<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'code' => $this->code,
            'name' => $this->name,
            'brand' => $this->brand,
            'category' => $this->category,
            'description' => $this->description,
            'default_cost_price' => (float) $this->default_cost_price,
            'default_sell_price' => (float) $this->default_sell_price,
            'is_active' => (bool) $this->is_active,
            'variants_count' => $this->when(isset($this->variants_count), (int) $this->variants_count),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
