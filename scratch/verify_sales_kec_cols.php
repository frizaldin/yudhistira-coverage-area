<?php
require __DIR__ . "/../vendor/autoload.php";
$app = require __DIR__ . "/../bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$ref = new ReflectionClass(App\Http\Controllers\MonitoringController::class);
$m = $ref->getMethod("buildSalesStyleDashboardBundle");
$m->setAccessible(true);
$b = $m->invoke(app(App\Http\Controllers\MonitoringController::class), null, 52, 2026, "CABANG BOGOR");
$j = $b["jenjangBreakdown"][0] ?? [];
echo "jenjang0={$j['label']} ac={$j['value']} sales={$j['sales_count']} kec={$j['kecamatan_count']} ter={$j['sekolah_realisasi']} sp={$j['sp']} real={$j['realisasi']}\n";
$t = $b["kpiData"]["trlgPerJenjang"][0] ?? [];
echo "trlg0={$t['jenjang']} ac={$t['ac']} sales={$t['sales_count']} kec={$t['kecamatan_count']} T={$t['tahan']} R={$t['rebut']} BT={$t['lepas']}\n";
