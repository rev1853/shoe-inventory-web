<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\SequenceGenerator;

class SequenceController extends Controller
{
    public function nextProductCode()
    {
        return response()->json([
            'code' => SequenceGenerator::preview('product_code', 3, 'SHO-'),
        ]);
    }

    public function nextVariantSku()
    {
        return response()->json([
            'sku' => SequenceGenerator::preview('variant_sku', 4, 'SKU-'),
        ]);
    }

    public function nextReference(string $type)
    {
        $map = [
            'in' => ['key' => 'reference_in', 'prefix' => 'REF-IN-'],
            'out' => ['key' => 'reference_out', 'prefix' => 'REF-OUT-'],
            'adj' => ['key' => 'reference_adj', 'prefix' => 'REF-ADJ-'],
        ];

        abort_unless(isset($map[$type]), 404);

        $config = $map[$type];

        return response()->json([
            'reference' => SequenceGenerator::preview($config['key'], 4, $config['prefix']),
        ]);
    }
}
