<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$cust_with_kec = \App\Models\Customer::whereNotNull('kecamatan_name')->count();
echo "Customers with kecamatan_name: $cust_with_kec\n";

$kec_counts = \App\Models\Customer::select('kecamatan_name', \DB::raw('count(*) as total'), \DB::raw('SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as ac'))
    ->whereNotNull('kecamatan_name')
    ->groupBy('kecamatan_name')
    ->get();

echo "Kecamatan counts from Customer table: \n";
print_r($kec_counts->take(5)->toArray());
