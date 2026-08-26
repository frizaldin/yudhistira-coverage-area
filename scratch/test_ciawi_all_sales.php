<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Find sales that have CIAWI KAB BOGOR and dump matched feature geometry sample
$salesIds = \DB::table('customers')
    ->where('kecamatan_name', 'like', 'CIAWI%BOGOR%')
    ->distinct()
    ->pluck('sales_id');

foreach ($salesIds as $sid) {
    $cabang = \DB::table('customers')->where('sales_id', $sid)->where('kecamatan_name', 'like', 'CIAWI%')->value('cabang_id');
    $request = \Illuminate\Http\Request::create('/x', 'GET', ['sales_id' => $sid, 'cabang_id' => $cabang]);
    $data = json_decode(app(\App\Http\Controllers\MonitoringController::class)->salesPerformanceGeoJson($request)->getContent(), true);
    foreach ($data['features'] ?? [] as $f) {
        if (stripos($f['properties']['kecamatan_name'] ?? '', 'ciawi') === false) continue;
        $c = $f['geometry']['coordinates'][0][0][0] ?? null;
        echo "sales=$sid cabang=$cabang city={$f['properties']['city_code']} name={$f['properties']['kecamatan_name']} pt=" . json_encode($c) . "\n";
    }
}
