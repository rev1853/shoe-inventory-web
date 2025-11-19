<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StockMovementResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function metrics()
    {
        $products = Product::where('is_active', true)->count();
        $variants = ProductVariant::count();
        $lowStock = ProductVariant::where('min_qty', '>', 0)
            ->whereColumn('current_qty', '<=', 'min_qty')
            ->count();
        $outOfStock = ProductVariant::where('current_qty', '<=', 0)->count();

        return response()->json([
            'products' => $products,
            'variants' => $variants,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
        ]);
    }

    public function chart(Request $request)
    {
        $months = (int) $request->integer('months', 6);
        $months = max(3, min($months, 12));

        $start = Carbon::now()->subMonths($months - 1)->startOfMonth();

        $buckets = collect(range(0, $months - 1))->map(function ($i) use ($start) {
            $date = (clone $start)->addMonths($i);

            return [
                'key' => $date->format('Y-m'),
                'label' => $date->format('M'),
                'stock_in' => 0,
                'stock_out' => 0,
            ];
        })->keyBy('key');

        $movements = StockMovement::selectRaw("DATE_FORMAT(created_at, '%Y-%m') as bucket, movement_type, SUM(qty_change) as total")
            ->where('created_at', '>=', $start)
            ->groupBy('bucket', 'movement_type')
            ->get();

        foreach ($movements as $movement) {
            if (! $buckets->has($movement->bucket)) {
                continue;
            }

            $stockIn = 0;
            $stockOut = 0;
            $total = (int) $movement->total;

            if ($movement->movement_type === 'IN') {
                $stockIn = $total;
            } elseif ($movement->movement_type === 'OUT') {
                $stockOut = abs($total);
            } else {
                if ($total >= 0) {
                    $stockIn = $total;
                } else {
                    $stockOut = abs($total);
                }
            }

            $bucket = $buckets->get($movement->bucket);
            $bucket['stock_in'] += $stockIn;
            $bucket['stock_out'] += $stockOut;
            $buckets[$movement->bucket] = $bucket;
        }

        return response()->json([
            'data' => $buckets->values(),
        ]);
    }

    public function recentMovements()
    {
        $movements = StockMovement::with(['variant.product', 'user'])
            ->latest()
            ->limit(10)
            ->get();

        return StockMovementResource::collection($movements);
    }
}
