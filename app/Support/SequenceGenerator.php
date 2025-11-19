<?php

namespace App\Support;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sequence;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class SequenceGenerator
{
    public static function next(string $name, int $padding = 3, string $prefix = ''): string
    {
        $number = DB::transaction(function () use ($name) {
            $sequence = Sequence::lockForUpdate()->where('name', $name)->first();

            if (! $sequence) {
                $sequence = new Sequence([
                    'name' => $name,
                    'last_number' => self::determineStartingValue($name),
                ]);
            }

            $sequence->last_number++;
            $sequence->save();

            return $sequence->last_number;
        });

        return self::formatNumber($number, $padding, $prefix);
    }

    public static function preview(string $name, int $padding = 3, string $prefix = ''): string
    {
        $sequence = Sequence::firstOrCreate(
            ['name' => $name],
            ['last_number' => self::determineStartingValue($name)]
        );

        return self::formatNumber($sequence->last_number + 1, $padding, $prefix);
    }

    protected static function determineStartingValue(string $name): int
    {
        return match ($name) {
            'product_code' => (int) Product::query()
                ->where('code', 'like', 'SHO-%')
                ->selectRaw("MAX(CAST(SUBSTRING(code, 5) AS UNSIGNED)) as max_code")
                ->value('max_code') ?? 0,
            'variant_sku' => (int) ProductVariant::query()
                ->where('sku', 'like', 'SKU-%')
                ->selectRaw("MAX(CAST(SUBSTRING(sku, 5) AS UNSIGNED)) as max_sku")
                ->value('max_sku') ?? 0,
            'reference_in', 'reference_out', 'reference_adj' => (int) StockMovement::query()
                ->where('reference', 'like', self::referencePrefix($name).'%')
                ->selectRaw(
                    'MAX(CAST(SUBSTRING(reference, '.(strlen(self::referencePrefix($name)) + 1).') AS UNSIGNED)) as max_ref'
                )
                ->value('max_ref') ?? 0,
            default => 0,
        };
    }

    protected static function referencePrefix(string $name): string
    {
        return match ($name) {
            'reference_in' => 'REF-IN-',
            'reference_out' => 'REF-OUT-',
            'reference_adj' => 'REF-ADJ-',
            default => '',
        };
    }

    protected static function formatNumber(int $number, int $padding, string $prefix): string
    {
        $padded = $padding > 0
            ? str_pad((string) $number, $padding, '0', STR_PAD_LEFT)
            : (string) $number;

        return $prefix.$padded;
    }
}
