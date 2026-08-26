<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$salesIds = \DB::table('customers')
    ->where('kecamatan_name', 'like', '%CIAWI%')
    ->select('sales_id', 'cabang_id', 'kecamatan_name')
    ->distinct()
    ->get();

echo "customer ciawi rows:\n";
foreach ($salesIds as $r) {
    echo "sales={$r->sales_id} cabang={$r->cabang_id} {$r->kecamatan_name}\n";
}

// Pick a sales with CIAWI KAB BOGOR from screenshot context - try several
foreach ([3, 26, 7, 10, 14, 19] as $sid) {
    $cabang = \DB::table('customers')->where('sales_id', $sid)->value('cabang_id');
    if (!$cabang) continue;
    $request = \Illuminate\Http\Request::create('/x', 'GET', ['sales_id' => $sid, 'cabang_id' => $cabang]);
    $data = json_decode(app(\App\Http\Controllers\MonitoringController::class)->salesPerformanceGeoJson($request)->getContent(), true);
    foreach ($data['features'] ?? [] as $f) {
        if (stripos($f['properties']['kecamatan_name'] ?? '', 'ciawi') === false) continue;
        $polys = $f['geometry']['coordinates'] ?? [];
        echo "\nsales=$sid name={$f['properties']['kecamatan_name']} city={$f['properties']['city_code']} polygon_count=" . count($polys) . "\n";
        foreach ($polys as $i => $poly) {
            $pt = $poly[0][0] ?? null;
            $lng = $pt[0] ?? null;
            $region = ($lng !== null && $lng > 107.5) ? 'TASIK-ish' : 'BOGOR-ish';
            echo "  poly[$i] first=$region lng=$lng\n";
        }
    }
}
