<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ref = new ReflectionClass(App\Http\Controllers\MonitoringController::class);
$m = $ref->getMethod('buildSalesStyleDashboardBundle');
$m->setAccessible(true);
$c = app(App\Http\Controllers\MonitoringController::class);
$b = $m->invoke($c, null, 52, 2026, 'CABANG BOGOR');

$j = $b['jenjangBreakdown'];
$sumS = array_sum(array_column($j, 'sekolah_realisasi'));
$sumR = array_sum(array_column($j, 'realisasi'));
$sumAc = array_sum(array_column($j, 'value'));

echo "jenjang AC={$sumAc} real_sekolah={$sumS} real_eks={$sumR}\n";
echo 'kpi real_sekolah=' . ($b['insights']['customerWithRealisasi'] ?? '?')
    . ' real_eks=' . ($b['insights']['totalRealisasiTargetYear'] ?? '?') . "\n";

foreach ($j as $r) {
    echo "{$r['label']} AC={$r['value']} ter={$r['sekolah_realisasi']} eks={$r['realisasi']}\n";
}

$sd = $b['sumberDanaBreakdown'];
echo "\nsumber dana real_sekolah=" . array_sum(array_column($sd, 'sekolah_realisasi'))
    . ' real_eks=' . array_sum(array_column($sd, 'realisasi')) . "\n";
