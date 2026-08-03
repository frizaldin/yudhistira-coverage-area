<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sales = \App\Models\Sales::find(1);
if($sales){
    echo "Sales: " . $sales->name . "\n";
    $total = \App\Models\Customer::where('sales_id', 1)->count();
    $active = \App\Models\Customer::where('sales_id', 1)->where('is_active', true)->count();
    $inactive = \App\Models\Customer::where('sales_id', 1)->where(function ($q) { 
        $q->where('is_active', false)->orWhereNull('is_active'); 
    })->count();
    
    echo "Total: $total\n";
    echo "Active: $active\n";
    echo "Inactive: $inactive\n";
}
