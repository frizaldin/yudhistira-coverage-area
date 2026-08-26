<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$ref = new ReflectionClass(\App\Http\Controllers\MonitoringController::class);
$m = $ref->getMethod('buildFixedSalesActivityBreakdown');
$m->setAccessible(true);
$ctrl = $ref->newInstanceWithoutConstructor();
$rows = collect([
    (object) ['aktivitas' => 'Promosi'],
    (object) ['aktivitas' => 'Promosi'],
    (object) ['aktivitas' => 'SP'],
    (object) ['aktivitas' => 'Pendekatan'],
]);
echo json_encode($m->invoke($ctrl, $rows, 18), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
echo "--- empty ---\n";
echo json_encode($m->invoke($ctrl, collect(), 0), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
