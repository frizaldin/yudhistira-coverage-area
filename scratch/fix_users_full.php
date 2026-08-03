<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Sales;
use App\Models\Customer;
use App\Models\Cabang;

$users = User::where('level', 'sales')->get();
$countSales = 0;
$countCabang = 0;

foreach ($users as $u) {
    // try to match sales by name
    $name = str_replace('User Sales ', '', $u->name);
    $sales = Sales::where('name', $name)->first();
    
    if (!$sales) {
        // try by email prefix
        $prefix = explode('@', $u->email)[0];
        $sales = Sales::whereRaw("LOWER(REPLACE(name, ' ', '')) = ?", [$prefix])->first();
    }
    
    if ($sales) {
        $u->sales_id = $sales->id;
        $countSales++;
        
        // try to find cabang from customers
        $cust = Customer::where('sales_id', $sales->id)->whereNotNull('cabang_id')->first();
        if ($cust) {
            $u->cabang_id = $cust->cabang_id;
            
            // also get area_id
            $cabang = Cabang::find($cust->cabang_id);
            if ($cabang) {
                $u->area_id = $cabang->area_id;
            }
            $countCabang++;
        }
        $u->save();
    }
}

echo "Updated $countSales users with sales_id. $countCabang also got cabang_id/area_id.\n";
