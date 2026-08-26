<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Confirm patched code is loaded
$ref = new ReflectionMethod(\App\Http\Controllers\MonitoringController::class, 'salesPerformanceGeoJson');
$file = file($ref->getFileName());
echo "method starts line " . $ref->getStartLine() . "\n";
echo trim($file[$ref->getStartLine() + 2]) . "\n";
// search for city_code matching comment
$src = file_get_contents($ref->getFileName());
echo "has city match: " . (str_contains($src, 'hindari bentrok nama sama beda kab') ? 'YES' : 'NO') . "\n";

$request = \Illuminate\Http\Request::create('/x', 'GET', ['sales_id' => 3, 'cabang_id' => 52]);
$data = json_decode(app(\App\Http\Controllers\MonitoringController::class)->salesPerformanceGeoJson($request)->getContent(), true);
echo "meta=" . json_encode($data['meta']) . "\n";
foreach ($data['features'] as $f) {
    $pt = $f['geometry']['coordinates'][0][0][0] ?? ($f['geometry']['coordinates'] ?? [null]);
    if (($f['geometry']['type'] ?? '') === 'Point') {
        $lng = $f['geometry']['coordinates'][0];
    } else {
        $lng = $pt[0] ?? null;
    }
    $mark = ($lng !== null && $lng > 107.5) ? ' <<< EAST/TASIK' : '';
    echo ($f['properties']['kecamatan_name'] ?? '') . " lng=$lng$mark\n";
}
