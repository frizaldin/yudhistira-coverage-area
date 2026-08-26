<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$year = (int) (optional(\App\Models\Configuration::query()->first())->target_year ?: date('Y'));
$ref = new ReflectionClass(\App\Http\Controllers\MonitoringController::class);
$m = $ref->getMethod('buildNonAreaCoverCustomers');
$m->setAccessible(true);
$ctrl = $ref->newInstanceWithoutConstructor();
$list = $m->invoke($ctrl, 52, null, $year);
echo "year=$year nonAC cabang52=" . $list->count() . PHP_EOL;
if ($list->count() > 0) {
    $s = $list->first();
    echo "sample: {$s->name} | {$s->jenjang} | active={$s->is_active} | {$s->sales_name}\n";
}
