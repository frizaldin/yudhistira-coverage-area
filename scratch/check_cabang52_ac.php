<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$year = (int) (optional(\App\Models\Configuration::query()->first())->target_year ?: date('Y'));
$customers = \App\Models\Customer::where('cabang_id', 52)->get(['id', 'name', 'is_active']);
echo "customers cabang 52: " . $customers->count() . PHP_EOL;
echo "customers.is_active=1: " . $customers->where('is_active', 1)->count() . PHP_EOL;
echo "customers.is_active=0: " . $customers->where('is_active', 0)->count() . PHP_EOL;

$ids = $customers->pluck('id');
$acIds = \App\Models\CustomerPlan::whereIn('customer_id', $ids)
    ->where('year', $year)
    ->where('is_ac', 1)
    ->distinct()
    ->pluck('customer_id');
echo "year=$year plan is_ac: " . $acIds->count() . PHP_EOL;
echo "non plan AC: " . ($customers->count() - $acIds->count()) . PHP_EOL;
