<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$cabangs = \App\Models\Customer::where('sales_id', 2)->distinct()->pluck('cabang_id'); 
echo "Cabangs for sales 2: " . json_encode($cabangs) . "\n";
