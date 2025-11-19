<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Supplier;

class LookupController extends Controller
{
    public function options()
    {
        return response()->json([
            'brands' => Product::query()->select('brand')->distinct()->orderBy('brand')->pluck('brand'),
            'categories' => Product::query()->select('category')->distinct()->orderBy('category')->pluck('category'),
            'products' => Product::query()
                ->select('id', 'code', 'name', 'brand')
                ->orderBy('name')
                ->get(),
            'suppliers' => Supplier::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'genders' => ['MEN', 'WOMEN', 'UNISEX', 'KIDS'],
            'size_systems' => ['US', 'EU', 'UK', 'CM'],
            'roles' => ['admin', 'staff'],
            'statuses' => ['active', 'inactive'],
        ]);
    }
}
