<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "SalesCityPlan count: " . \App\Models\SalesCityPlan::count() . "\n";
echo "Customer count: " . \App\Models\Customer::count() . "\n";
echo "Customer with area_id count: " . \App\Models\Customer::whereNotNull('area_id')->count() . "\n";
echo "Customer with cabang_id count: " . \App\Models\Customer::whereNotNull('cabang_id')->count() . "\n";
