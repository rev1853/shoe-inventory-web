<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
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
            'movement_type' => $this->movement_type,
            'qty_change' => (int) $this->qty_change,
            'reason' => $this->reason,
            'reference' => $this->reference,
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->supplier->id,
                'name' => $this->supplier->name,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'variant' => $this->whenLoaded('variant', fn () => [
                'id' => $this->variant->id,
                'sku' => $this->variant->sku,
                'color' => $this->variant->color,
                'size_system' => $this->variant->size_system,
                'size' => (float) $this->variant->size,
                'product' => $this->variant->relationLoaded('product')
                    ? [
                        'id' => $this->variant->product->id,
                        'name' => $this->variant->product->name,
                        'brand' => $this->variant->product->brand,
                      ]
                    : null,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
