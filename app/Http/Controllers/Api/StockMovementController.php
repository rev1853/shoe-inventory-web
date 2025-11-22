<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockMovementResource;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Support\SequenceGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = StockMovement::with(['variant.product', 'supplier', 'user'])->latest();

        if ($variantId = $request->integer('variant_id')) {
            $query->where('variant_id', $variantId);
        }

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('reason', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhereHas('variant', function ($variantQuery) use ($search) {
                        $variantQuery->where('sku', 'like', "%{$search}%")
                            ->orWhereHas('product', function ($productQuery) use ($search) {
                                $productQuery->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($type = $request->string('movement_type')->toString()) {
            $query->where('movement_type', strtoupper($type));
        }

        $perPage = max(5, min(100, (int) $request->integer('per_page', 10)));

        return StockMovementResource::collection($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'variant_id' => ['required', 'exists:product_variants,id'],
            'movement_type' => ['required', 'in:IN,OUT,ADJ'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'new_quantity' => ['nullable', 'integer', 'min:0'],
            'reason' => ['required', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:100'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
        ]);

        $movement = DB::transaction(function () use ($request, $data) {
            /** @var \App\Models\ProductVariant $variant */
            $variant = ProductVariant::lockForUpdate()->findOrFail($data['variant_id']);

            $movementType = $data['movement_type'];
            $qtyChange = 0;

            if (in_array($movementType, ['IN', 'OUT'], true)) {
                if (empty($data['quantity'])) {
                    throw ValidationException::withMessages([
                        'quantity' => ['Quantity is required for stock movements.'],
                    ]);
                }

                $qty = (int) $data['quantity'];
                $qtyChange = $movementType === 'IN' ? $qty : -$qty;

                if ($movementType === 'OUT' && ($variant->current_qty + $qtyChange) < 0) {
                    throw ValidationException::withMessages([
                        'quantity' => ['Insufficient stock for this variant.'],
                    ]);
                }

                $variant->current_qty += $qtyChange;
            } else {
                if (! isset($data['new_quantity'])) {
                    throw ValidationException::withMessages([
                        'new_quantity' => ['New quantity is required for adjustments.'],
                    ]);
                }

                $newQuantity = (int) $data['new_quantity'];
                $qtyChange = $newQuantity - $variant->current_qty;
                $variant->current_qty = $newQuantity;
            }

            $variant->save();

            return StockMovement::create([
                'variant_id' => $variant->id,
                'movement_type' => $movementType,
                'qty_change' => $qtyChange,
                'reason' => $data['reason'],
                'reference' => $data['reference'] ?? $this->generateReference($movementType),
                'supplier_id' => $data['supplier_id'] ?? null,
                'user_id' => $request->user()->id,
            ]);
        });

        return new StockMovementResource(
            $movement->load(['variant.product', 'supplier', 'user'])
        );
    }

    protected function generateReference(string $movementType): string
    {
        return match ($movementType) {
            'IN' => SequenceGenerator::next('reference_in', 4, 'REF-IN-'),
            'OUT' => SequenceGenerator::next('reference_out', 4, 'REF-OUT-'),
            default => SequenceGenerator::next('reference_adj', 4, 'REF-ADJ-'),
        };
    }
}
