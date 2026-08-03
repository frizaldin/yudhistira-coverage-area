<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$groups = \App\Models\SalesCityPlan::select('sumber_dana', \DB::raw('SUM(ac_customer) as sum_ac'))
    ->groupBy('sumber_dana')
    ->get();
print_r($groups->toArray());
