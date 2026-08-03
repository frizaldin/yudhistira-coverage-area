<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$updates = [
    'BOJONG GEDE' => '{"lat": -6.4950, "lng": 106.7936}',
    'CIBINONG' => '{"lat": -6.4716, "lng": 106.8430}',
    'CILEUNGSI' => '{"lat": -6.4022, "lng": 106.9841}',
    'CITEUREUP' => '{"lat": -6.5161, "lng": 106.8833}',
    'GUNUNG PUTRI' => '{"lat": -6.4357, "lng": 106.9119}',
    'KEMANG' => '{"lat": -6.4957, "lng": 106.7456}',
    'SUKARAJA' => '{"lat": -6.5684, "lng": 106.8475}',
    'TANAH SEREAL' => '{"lat": -6.5601, "lng": 106.7937}'
];

echo "Updating geomap for Bogor...\n";
foreach ($updates as $name => $geomap) {
    $affected = \DB::table('kecamatans')
        ->whereRaw('LOWER(camat_name) = ?', [mb_strtolower($name)])
        ->update(['geomap' => $geomap]);
    echo "  [{$name}] -> Updated {$affected} rows\n";
}
