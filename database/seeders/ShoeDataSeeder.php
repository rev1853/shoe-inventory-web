<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Support\SequenceGenerator;

class ShoeDataSeeder extends Seeder
{
    use WithoutModelEvents;

    protected array $downloadedImages = [];

    public function run(): void
    {
        $dataPath = base_path('shoes_data.json');

        if (! file_exists($dataPath)) {
            $this->command?->error('shoes_data.json not found.');

            return;
        }

        $payload = json_decode(file_get_contents($dataPath), true);

        if (! is_array($payload)) {
            $this->command?->error('Unable to parse shoes_data.json');

            return;
        }

        Storage::disk('public')->makeDirectory('products');

        $productCache = [];

        foreach ($payload as $entry) {
            $name = $entry['name'] ?? 'Unknown Shoe';
            $brand = $entry['brand'] ?? 'Unknown';
            $category = $entry['category'] ?? 'General';
            $productKey = strtolower($name.'|'.$brand);

            $sellPrice = $this->parsePrice($entry['price'] ?? null);
            $costPrice = $sellPrice > 0 ? round($sellPrice * 0.7, 2) : 0;

            if (! isset($productCache[$productKey])) {
                $productCache[$productKey] = Product::firstOrCreate(
                    ['name' => $name, 'brand' => $brand],
                    [
                        'code' => SequenceGenerator::next('product_code', 3, 'SHO-'),
                        'category' => $category,
                        'description' => $entry['description'] ?? null,
                        'default_cost_price' => $costPrice,
                        'default_sell_price' => $sellPrice,
                        'is_active' => true,
                    ]
                );
            }

            $product = $productCache[$productKey];
            $imageFilename = $this->downloadImage(
                $entry['image'] ?? null,
                $entry['sku'] ?? $product->code,
                $entry['color'] ?? ''
            );

            $sizeValue = $this->parseSize($entry['size'] ?? null);
            $sizeSystem = strtoupper($entry['size_system'] ?? 'US');
            $variantSku = $this->buildVariantSku($entry['sku'] ?? $product->code, $sizeSystem, $sizeValue, $entry['color'] ?? '');

            $variantData = [
                'product_id' => $product->id,
                'sku' => $variantSku,
                'gender' => $this->normalizeGender($entry['gender'] ?? null),
                'color' => $entry['color'] ?? 'Standard',
                'image_filename' => $imageFilename,
                'size_system' => $sizeSystem,
                'size' => $sizeValue,
                'cost_price' => $costPrice > 0 ? $costPrice : $product->default_cost_price,
                'sell_price' => $sellPrice > 0 ? $sellPrice : $product->default_sell_price,
                'current_qty' => 0,
                'min_qty' => 0,
                'qr_token' => null,
                'is_active' => true,
            ];

            ProductVariant::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'gender' => $variantData['gender'],
                    'color' => $variantData['color'],
                    'size_system' => $variantData['size_system'],
                    'size' => $variantData['size'],
                ],
                $variantData
            );
        }
    }

    protected function parsePrice(?string $raw): float
    {
        if (! $raw) {
            return 0.0;
        }

        $numeric = preg_replace('/[^0-9.]/', '', $raw);

        return (float) ($numeric ?: 0);
    }

    protected function parseSize($raw): float
    {
        return (float) $raw;
    }

    protected function buildVariantSku(string $baseSku, string $sizeSystem, float $size, string $color = ''): string
    {
        $sizeSuffix = str_replace('.', '', (string) $size);
        $colorSlug = Str::slug($color) ?: 'std';

        return strtoupper($baseSku.'-'.$colorSlug.'-'.$sizeSystem.$sizeSuffix);
    }

    protected function normalizeGender(?string $gender): string
    {
        return match (strtoupper((string) $gender)) {
            'MEN', 'MAN', 'MALE' => 'MEN',
            'WOMEN', 'WOMAN', 'FEMALE' => 'WOMEN',
            'KIDS', 'CHILD', 'CHILDREN' => 'KIDS',
            default => 'UNISEX',
        };
    }

    protected function downloadImage(?string $url, string $sku, string $color): ?string
    {
        if (! $url || str_starts_with($url, 'data:')) {
            return null;
        }

        if (isset($this->downloadedImages[$url])) {
            return $this->downloadedImages[$url];
        }

        try {
            $response = Http::timeout(15)->get($url);
        } catch (\Throwable $e) {
            $this->command?->warn("Failed to fetch image for {$sku}: {$e->getMessage()}");

            return null;
        }

        if (! $response->successful()) {
            $this->command?->warn("Image download failed ({$response->status()}) for {$sku}");

            return null;
        }

        $extension = $this->guessExtension($url, $response->header('Content-Type'));
        $baseName = Str::slug($sku.'-'.$color) ?: Str::random(12);
        $fileName = "{$baseName}.{$extension}";

        Storage::disk('public')->put("products/{$fileName}", $response->body());

        $this->downloadedImages[$url] = $fileName;

        return $fileName;
    }

    protected function guessExtension(string $url, ?string $contentType = null): string
    {
        $pathExtension = pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION);

        if ($pathExtension) {
            return $pathExtension;
        }

        return match ($contentType) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'jpg',
        };
    }
}
