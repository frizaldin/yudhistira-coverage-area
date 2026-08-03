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
$allSales = Sales::all();

$countSales = 0;
foreach ($users as $u) {
    if ($u->sales_id) continue;
    
    $emailPrefix = explode('@', $u->email)[0];
    
    // find matching sales by removing all non-alphanumeric chars from sales name
    foreach ($allSales as $s) {
        $cleanSalesName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $s->name));
        if ($cleanSalesName === $emailPrefix) {
            $u->sales_id = $s->id;
            
            $cust = Customer::where('sales_id', $s->id)->whereNotNull('cabang_id')->first();
            if ($cust) {
                $u->cabang_id = $cust->cabang_id;
                $cabang = Cabang::find($cust->cabang_id);
                if ($cabang) {
                    $u->area_id = $cabang->area_id;
                }
            }
            $u->save();
            $countSales++;
            break;
        }
    }
}
echo "Mapped $countSales additional users using strict alphanumeric match.\n";
