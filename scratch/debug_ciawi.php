<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== customers Ciawi ===\n";
$rows = \DB::table('customers')
    ->where('kecamatan_name', 'like', '%CIAWI%')
    ->select('kecamatan_name', 'sales_id', 'cabang_id')
    ->distinct()
    ->limit(20)
    ->get();
foreach ($rows as $r) {
    echo "{$r->kecamatan_name} | sales={$r->sales_id} cabang={$r->cabang_id}\n";
}

echo "\n=== kecamatans Ciawi ===\n";
$kec = \DB::table('kecamatans')->where('camat_name', 'like', '%CIAWI%')->get();
foreach ($kec as $k) {
    echo "{$k->camat_code} city={$k->city_code} {$k->camat_name}\n";
}

echo "\n=== geojson Ciawi ===\n";
$geo = json_decode(file_get_contents(__DIR__ . '/../public/geojson/indonesia-kecamatan-32.json'), true);
foreach ($geo['features'] as $f) {
    $n = $f['properties']['nama'] ?? '';
    if (stripos($n, 'ciawi') !== false) {
        echo ($f['properties']['kode'] ?? '') . ' | ' . $n . PHP_EOL;
    }
}
