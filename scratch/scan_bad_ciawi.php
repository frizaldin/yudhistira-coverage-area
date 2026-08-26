<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Any customer literally named CIAWI KAB BOGOR but somehow?
echo "All distinct CIAWI* names:\n";
foreach (\DB::table('customers')->where('kecamatan_name', 'like', '%CIAWI%')->select('kecamatan_name', 'sales_id', 'cabang_id')->distinct()->get() as $r) {
    echo "{$r->kecamatan_name} | sales={$r->sales_id} cabang={$r->cabang_id}\n";
}

echo "\n--- Check if any sales geojson still emits Tasik Ciawi ---\n";
$salesList = \DB::table('customers')->whereNotNull('sales_id')->distinct()->limit(50)->pluck('sales_id');
foreach ($salesList as $sid) {
    $cabang = \DB::table('customers')->where('sales_id', $sid)->value('cabang_id');
    $request = \Illuminate\Http\Request::create('/x', 'GET', ['sales_id' => $sid, 'cabang_id' => $cabang]);
    $data = json_decode(app(\App\Http\Controllers\MonitoringController::class)->salesPerformanceGeoJson($request)->getContent(), true);
    foreach ($data['features'] ?? [] as $f) {
        $name = $f['properties']['kecamatan_name'] ?? '';
        if (stripos($name, 'ciawi') === false) continue;
        if (($f['geometry']['type'] ?? '') === 'Point') {
            $lng = $f['geometry']['coordinates'][0];
        } else {
            $lng = $f['geometry']['coordinates'][0][0][0][0] ?? null;
        }
        if ($lng !== null && $lng > 107.5) {
            echo "BAD sales=$sid $name lng=$lng city={$f['properties']['city_code']}\n";
        }
    }
}
echo "done\n";
