<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductVariantResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\SequenceGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductVariantController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductVariant::with('product');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('sku', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($productQuery) use ($search) {
                        $productQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('brand', 'like', "%{$search}%");
                    });
            });
        }

        if ($productId = $request->integer('product_id')) {
            $query->where('product_id', $productId);
        }

        if ($gender = $request->string('gender')->toString()) {
            $query->where('gender', strtoupper($gender));
        }

        if ($sizeSystem = $request->string('size_system')->toString()) {
            $query->where('size_system', strtoupper($sizeSystem));
        }

        $sortable = ['sku', 'color', 'size', 'current_qty', 'sell_price', 'min_qty'];
        $sortField = $request->string('sort_by')->toString();
        $sortDir = $request->string('sort_dir')->toString() === 'desc' ? 'desc' : 'asc';

        if (! in_array($sortField, $sortable, true)) {
            $sortField = 'sku';
        }

        $query->orderBy($sortField, $sortDir);

        $perPage = max(5, min(100, (int) $request->integer('per_page', 10)));

        return ProductVariantResource::collection(
            $query->paginate($perPage)
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateVariant($request);

        $variant = ProductVariant::create($data);
        $variant->load('product');

        return new ProductVariantResource($variant);
    }

    public function show(ProductVariant $productVariant)
    {
        return new ProductVariantResource($productVariant->load('product'));
    }

    public function update(Request $request, ProductVariant $productVariant)
    {
        $data = $this->validateVariant($request, $productVariant);

        $productVariant->update($data);

        return new ProductVariantResource($productVariant->fresh()->load('product'));
    }

    public function destroy(ProductVariant $productVariant)
    {
        if ($productVariant->image_filename) {
            Storage::disk('public')->delete('products/'.$productVariant->image_filename);
        }

        $productVariant->delete();

        return response()->json([
            'message' => 'Variant deleted.',
        ]);
    }

    protected function validateVariant(Request $request, ?ProductVariant $variant = null): array
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'gender' => ['required', 'string', 'max:20'],
            'color' => ['required', 'string', 'max:50'],
            'size_system' => ['required', 'string'],
            'size' => ['required', 'numeric', 'min:0'],
            'current_qty' => ['nullable', 'integer', 'min:0'],
            'min_qty' => ['nullable', 'integer', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sell_price' => ['nullable', 'numeric', 'min:0'],
            'qr_token' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('product_variants', 'qr_token')->ignore($variant?->id),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'image' => ['sometimes', 'nullable', 'image', 'max:5120'],
        ]);

        $product = Product::find($data['product_id']);

        if ($request->hasFile('image')) {
            if ($variant?->image_filename) {
                Storage::disk('public')->delete('products/'.$variant->image_filename);
            }

            $data['image_filename'] = $this->storeImage(
                $request->file('image'),
                $data['sku'] ?? null,
                $data['color']
            );
        }

        $data['gender'] = $this->normalizeGender($data['gender']);
        $data['size_system'] = strtoupper($data['size_system']);
        if (! in_array($data['size_system'], ['EU', 'UK', 'US', 'CM'], true)) {
            throw ValidationException::withMessages([
                'size_system' => ['Size system must be one of US, EU, UK, or CM.'],
            ]);
        }
        $data['size'] = (float) $data['size'];
        $data['current_qty'] = $data['current_qty'] ?? ($variant?->current_qty ?? 0);
        $data['min_qty'] = $data['min_qty'] ?? ($variant?->min_qty ?? 0);
        $data['cost_price'] = $data['cost_price'] ?? ($product?->default_cost_price ?? 0);
        $data['sell_price'] = $data['sell_price'] ?? ($product?->default_sell_price ?? 0);
        $data['is_active'] = $request->boolean('is_active', $variant?->is_active ?? true);

        $data['qr_token'] = $data['qr_token'] ?? ($variant?->qr_token ?? ProductVariant::generateQrToken());

        if (! $variant) {
            $data['sku'] = SequenceGenerator::next('variant_sku', 4, 'SKU-');
        } else {
            $data['sku'] = $variant->sku;
        }

        return $data;
    }

    protected function normalizeGender(string $gender): string
    {
        return match (strtoupper($gender)) {
            'MEN', 'MAN', 'MALE' => 'MEN',
            'WOMEN', 'WOMAN', 'FEMALE' => 'WOMEN',
            'KIDS', 'CHILD', 'CHILDREN' => 'KIDS',
            default => 'UNISEX',
        };
    }

    protected function storeImage($file, ?string $sku, string $color): string
    {
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $name = Str::slug(($sku ?: Str::random(10)).'-'.$color);
        $filename = "{$name}.{$extension}";

        $counter = 1;
        while (Storage::disk('public')->exists('products/'.$filename)) {
            $filename = "{$name}-{$counter}.{$extension}";
            $counter++;
        }

        Storage::disk('public')->putFileAs('products', $file, $filename);

        return $filename;
    }

    public function scan(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:150'],
        ]);

        $code = trim($validated['code']);

        $variant = ProductVariant::with('product')
            ->where(function ($query) use ($code) {
                $query->where('qr_token', $code)
                    ->orWhere('sku', $code);
            })
            ->first();

        if (! $variant) {
            return response()->json([
                'message' => 'Variant not found for this QR code.',
            ], 404);
        }

        $variant->ensureQrToken();

        return new ProductVariantResource($variant);
    }
}
