<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$req = Illuminate\Http\Request::create('/', 'GET', [
    'cabang_id' => 52,
    'level' => 'kota',
    'tahun' => 2026,
]);

$c = app(App\Http\Controllers\MonitoringController::class);
$t = microtime(true);
$res = $c->salesPerformanceGeoJson($req);
$data = json_decode($res->getContent(), true);
echo 'elapsed=' . round(microtime(true) - $t, 2) . "s\n";
echo 'features=' . count($data['features'] ?? []) . "\n";
echo 'meta=' . json_encode($data['meta'] ?? [], JSON_UNESCAPED_UNICODE) . "\n";
foreach (($data['features'] ?? []) as $f) {
    $p = $f['properties'];
    echo ($p['kota_name'] ?? '?')
        . ' city=' . ($p['city_code'] ?? '')
        . ' polys=' . count($f['geometry']['coordinates'] ?? [])
        . ' cov=' . ($p['coverage_pct'] ?? 0) . '%'
        . ' sekolah=' . ($p['total_sekolah'] ?? 0)
        . "\n";
}
