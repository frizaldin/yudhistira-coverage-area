<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "MarketShare dapodik sum: " . \App\Models\MarketShare::sum('dapodik_customer') . "\n";
echo "MarketShare ac_customer sum: " . \App\Models\MarketShare::sum('ac_customer') . "\n";
