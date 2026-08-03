<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check kecamatan names for sales_id=2
$kecNames = \App\Models\Customer::where('sales_id', 2)
    ->whereNotNull('kecamatan_name')
    ->distinct()
    ->pluck('kecamatan_name')
    ->sort()
    ->values();

echo "=== DB kecamatan_name for sales 2 ===\n";
foreach ($kecNames as $name) {
    echo "  [{$name}]\n";
}

// Check kecamatans table
echo "\n=== kecamatans table (cabang_id=52 or related) ===\n";
$kecs = \DB::table('kecamatans')->where('cabang_id', 52)->get();
echo "Count: " . $kecs->count() . "\n";
foreach ($kecs->take(10) as $k) {
    $geoSample = $k->geomap ? substr($k->geomap, 0, 100) : 'NULL';
    echo "  camat_code={$k->camat_code} name={$k->camat_name} geomap={$geoSample}\n";
}

// Also check all cabang_ids
echo "\n=== All sales 2 cabang info ===\n";
$sales = \App\Models\Sales::with('cabang')->find(2);
echo "Sales: {$sales->name}, cabang_id={$sales->cabang_id}, cabang={$sales->cabang->nama_cabang}\n";

// Check if kecamatan names match camat_name in kecamatans table
echo "\n=== Match kecamatan_name vs camat_name ===\n";
foreach ($kecNames as $dbName) {
    $parts = explode(',', $dbName);
    $kecOnly = trim($parts[0]);
    $match = \DB::table('kecamatans')->whereRaw('LOWER(camat_name) = ?', [mb_strtolower($kecOnly)])->first();
    if ($match) {
        $geoSample = $match->geomap ? substr($match->geomap, 0, 80) : 'NULL';
        echo "  ✓ [{$kecOnly}] → camat_code={$match->camat_code} geomap={$geoSample}\n";
    } else {
        echo "  ✗ [{$kecOnly}] → no match\n";
    }
}
