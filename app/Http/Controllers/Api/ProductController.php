<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Support\SequenceGenerator;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()->withCount('variants');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($brand = $request->string('brand')->toString()) {
            $query->where('brand', $brand);
        }

        if ($category = $request->string('category')->toString()) {
            $query->where('category', $category);
        }

        $sortable = ['name', 'code', 'brand', 'category', 'default_cost_price', 'default_sell_price', 'created_at'];
        $sortField = $request->string('sort_by')->toString();
        $sortDir = $request->string('sort_dir')->toString() === 'desc' ? 'desc' : 'asc';

        if (! in_array($sortField, $sortable, true)) {
            $sortField = 'name';
        }

        $query->orderBy($sortField, $sortDir);

        $perPage = (int) $request->integer('per_page', 10);
        $perPage = max(5, min(100, $perPage));

        $products = $query->paginate($perPage);

        return ProductResource::collection($products);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'brand' => ['required', 'string', 'max:100'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'default_cost_price' => ['required', 'numeric', 'min:0'],
            'default_sell_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['is_active'] = $request->boolean('is_active', true);
        $data['code'] = SequenceGenerator::next('product_code', 3, 'SHO-');

        $product = Product::create($data);

        return new ProductResource($product);
    }

    public function show(Product $product)
    {
        $product->load(['variants' => function ($query) {
            $query->with('product')->orderBy('sku');
        }]);

        return (new ProductResource($product))->additional([
            'variants' => ProductVariantResource::collection($product->variants),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'brand' => ['required', 'string', 'max:100'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'default_cost_price' => ['required', 'numeric', 'min:0'],
            'default_sell_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data['is_active'] = $request->boolean('is_active', $product->is_active);

        $product->update($data);

        return new ProductResource($product->fresh()->loadCount('variants'));
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'message' => 'Product deleted.',
        ]);
    }
}
