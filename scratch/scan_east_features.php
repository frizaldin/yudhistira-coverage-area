<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$salesList = \DB::table('customers')->where('cabang_id', 52)->whereNotNull('sales_id')->distinct()->pluck('sales_id');
echo "sales in cabang 52: " . $salesList->count() . "\n";
foreach ($salesList as $sid) {
    $request = \Illuminate\Http\Request::create('/x', 'GET', ['sales_id' => $sid, 'cabang_id' => 52]);
    $data = json_decode(app(\App\Http\Controllers\MonitoringController::class)->salesPerformanceGeoJson($request)->getContent(), true);
    foreach ($data['features'] ?? [] as $f) {
        if (($f['geometry']['type'] ?? '') === 'Point') {
            $lng = $f['geometry']['coordinates'][0] ?? null;
        } else {
            $lng = $f['geometry']['coordinates'][0][0][0][0] ?? null;
        }
        if ($lng !== null && $lng > 107.5) {
            echo "sales=$sid {$f['properties']['kecamatan_name']} lng=$lng city={$f['properties']['city_code']}\n";
        }
    }
}
echo "done\n";
