<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$cols = \Schema::getColumnListing('kecamatans');
echo 'cols: ' . implode(',', $cols) . PHP_EOL;
$rows = \DB::table('kecamatans')
    ->where('camat_name', 'like', '%Cibinong%')
    ->orWhere('camat_name', 'like', '%Babakan%')
    ->limit(5)
    ->get();
foreach ($rows as $r) {
    echo json_encode($r) . PHP_EOL;
}
echo 'total kecamatans: ' . \DB::table('kecamatans')->count() . PHP_EOL;
$withGeom = \DB::table('kecamatans')->whereNotNull('geomap')->where('geomap', '!=', '')->count();
echo 'with geomap: ' . $withGeom . PHP_EOL;
