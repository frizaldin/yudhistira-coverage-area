<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Prefer sales yang punya Ciawi Bogor
$row = \DB::table('customers')
    ->whereNotNull('sales_id')
    ->where('kecamatan_name', 'like', '%Ciawi%')
    ->where(function ($q) {
        $q->where('kecamatan_name', 'like', '%Bogor%')
          ->orWhere('kecamatan_name', 'like', 'Ciawi');
    })
    ->select('sales_id', 'cabang_id', 'kecamatan_name')
    ->first();

if (!$row) {
    $row = \DB::table('customers')->whereNotNull('sales_id')->whereNotNull('kecamatan_name')->select('sales_id', 'cabang_id', 'kecamatan_name')->first();
}

echo "sales_id={$row->sales_id} cabang_id={$row->cabang_id} sample={$row->kecamatan_name}\n";

$request = \Illuminate\Http\Request::create('/x', 'GET', [
    'sales_id' => $row->sales_id,
    'cabang_id' => $row->cabang_id,
]);
$controller = app(\App\Http\Controllers\MonitoringController::class);
$t0 = microtime(true);
$response = $controller->salesPerformanceGeoJson($request);
$ms = round((microtime(true) - $t0) * 1000);
$data = json_decode($response->getContent(), true);
echo "ms={$ms}\n";
echo 'meta: ' . json_encode($data['meta'] ?? []) . PHP_EOL;

$poly = 0;
$point = 0;
$ciawi = null;
$sources = [];
foreach ($data['features'] ?? [] as $f) {
    $t = $f['geometry']['type'] ?? '?';
    if ($t === 'Point') $point++; else $poly++;
    $src = $f['properties']['boundary_source'] ?? '?';
    $sources[$src] = ($sources[$src] ?? 0) + 1;
    $name = $f['properties']['kecamatan_name'] ?? '';
    if (stripos($name, 'ciawi') !== false) {
        $pt = $f['geometry']['coordinates'][0][0][0] ?? null;
        $ciawi = [
            'name' => $name,
            'source' => $src,
            'kode' => $f['properties']['kode'] ?? null,
            'kab' => $f['properties']['kabupaten'] ?? null,
            'pt' => $pt,
            'type' => $t,
        ];
    }
}
echo "poly=$poly point=$point sources=" . json_encode($sources) . PHP_EOL;
echo 'ciawi=' . json_encode($ciawi, JSON_UNESCAPED_UNICODE) . PHP_EOL;
echo "sample:\n";
foreach (array_slice($data['features'] ?? [], 0, 8) as $f) {
    echo ($f['geometry']['type'] ?? '?') . ' | ' . ($f['properties']['boundary_source'] ?? '?') . ' | ' . ($f['properties']['kecamatan_name'] ?? '') . PHP_EOL;
}
