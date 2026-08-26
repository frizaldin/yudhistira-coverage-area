<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$request = \Illuminate\Http\Request::create('/x', 'GET', ['sales_id' => 3, 'cabang_id' => 52]);
$controller = app(\App\Http\Controllers\MonitoringController::class);
$data = json_decode($controller->salesPerformanceGeoJson($request)->getContent(), true);
foreach ($data['features'] as $f) {
    if (stripos($f['properties']['kecamatan_name'] ?? '', 'tengah') !== false) {
        echo json_encode([
            'name' => $f['properties']['kecamatan_name'],
            'coverage_pct' => $f['properties']['coverage_pct'],
            'area_cover' => $f['properties']['area_cover'],
            'sekolah_realisasi' => $f['properties']['sekolah_realisasi'],
            'real_exemplar' => $f['properties']['real_exemplar'],
            'sp_exemplar' => $f['properties']['sp_exemplar'],
            'tahun' => $f['properties']['tahun'],
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
    }
}
