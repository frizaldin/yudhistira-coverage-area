<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$row = \DB::table('customers')->whereNotNull('sales_id')->whereNotNull('kecamatan_name')->select('sales_id', 'cabang_id')->first();
if (!$row) {
    echo "no customer\n";
    exit;
}
echo "sales_id={$row->sales_id} cabang_id={$row->cabang_id}\n";
$count = \DB::table('customers')->where('sales_id', $row->sales_id)->where('cabang_id', $row->cabang_id)->distinct('kecamatan_name')->count('kecamatan_name');
echo "distinct kecamatan raw: {$count}\n";

$request = \Illuminate\Http\Request::create('/x', 'GET', [
    'sales_id' => $row->sales_id,
    'cabang_id' => $row->cabang_id,
]);
$controller = app(\App\Http\Controllers\MonitoringController::class);
$response = $controller->salesPerformanceGeoJson($request);
$data = json_decode($response->getContent(), true);
echo 'features: ' . count($data['features'] ?? []) . PHP_EOL;
echo 'meta: ' . json_encode($data['meta'] ?? []) . PHP_EOL;
foreach (array_slice($data['features'] ?? [], 0, 10) as $f) {
    echo ($f['geometry']['type'] ?? '?') . ' | ' . ($f['properties']['kecamatan_name'] ?? '') . PHP_EOL;
}
