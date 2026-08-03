<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$request = \Illuminate\Http\Request::create('/monitoring/sales-performance/geojson', 'GET', [
    'sales_id' => 2,
    'cabang_id' => 52
]);

$controller = new \App\Http\Controllers\MonitoringController();
$response = $controller->salesPerformanceGeoJson($request);
$content = $response->getContent();
$data = json_decode($content, true);

echo "Type: " . ($data['type'] ?? 'none') . "\n";
echo "Features Count: " . count($data['features'] ?? []) . "\n";
if (empty($data['features'])) {
    echo "Raw response: " . substr($content, 0, 200) . "\n";
} else {
    foreach ($data['features'] as $f) {
        echo "- " . $f['properties']['kecamatan_name'] . "\n";
    }
}
