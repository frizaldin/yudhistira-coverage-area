<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sales = \App\Models\Sales::first();
echo "Sales columns: \n";
print_r($sales->toArray());

$cabang = \App\Models\Cabang::first();
echo "Cabang columns: \n";
print_r($cabang->toArray());
