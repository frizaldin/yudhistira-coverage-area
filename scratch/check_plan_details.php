<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$plan = \App\Models\SalesPlan::first();
echo "SalesPlan sample:\n";
print_r($plan->toArray());

echo "SalesCityPlan sample:\n";
$cityPlan = \App\Models\SalesCityPlan::first();
if ($cityPlan) print_r($cityPlan->toArray());

echo "\nChecking RekapKotaImport mappings...\n";
$salesWithCityPlan = \App\Models\SalesCityPlan::pluck('sales_id')->unique()->count();
echo "Sales with SalesCityPlan: $salesWithCityPlan\n";
