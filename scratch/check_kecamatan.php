<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Kecamatan dapodik sum: " . \App\Models\Kecamatan::sum('dapodik_customer') . "\n";
echo "Kecamatan ac_customer sum: " . \App\Models\Kecamatan::sum('ac_customer') . "\n";

$first = \App\Models\Kecamatan::first();
if ($first) {
    print_r($first->toArray());
}
