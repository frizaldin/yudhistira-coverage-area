<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$request = \Illuminate\Http\Request::create('/x', 'GET', [
    'sales_id' => 3,
    'cabang_id' => 52,
]);
$controller = app(\App\Http\Controllers\MonitoringController::class);
$response = $controller->salesPerformanceGeoJson($request);
$data = json_decode($response->getContent(), true);
echo 'meta: ' . json_encode($data['meta'] ?? []) . PHP_EOL;
foreach ($data['features'] ?? [] as $f) {
    $name = $f['properties']['kecamatan_name'] ?? '';
    $code = $f['properties']['city_code'] ?? '';
    $type = $f['geometry']['type'] ?? '';
    $kode = '';
    // approximate center lng for sanity
    $coords = $f['geometry']['coordinates'] ?? [];
    $lng = null;
    if ($type === 'MultiPolygon' && isset($coords[0][0][0][0])) {
        $lng = $coords[0][0][0][0];
    } elseif ($type === 'Point') {
        $lng = $coords[0] ?? null;
    }
    $flag = (stripos($name, 'ciawi') !== false) ? ' <== CIAWI' : '';
    echo "{$type} city={$code} lng={$lng} | {$name}{$flag}\n";
}
