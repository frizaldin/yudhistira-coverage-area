<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "SalesPlan tahan_customer sum: " . \App\Models\SalesPlan::sum('tahan_customer') . "\n";
echo "SalesPlan ac_customer sum: " . \App\Models\SalesPlan::sum('ac_customer') . "\n";
