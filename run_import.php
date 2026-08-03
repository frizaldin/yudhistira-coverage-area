<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Imports\DataCustomerCabangImport;
use Maatwebsite\Excel\Facades\Excel;

try {
    $file = 'database/data/Data Customer Cabang - Bogor.xlsx';
    Excel::import(new DataCustomerCabangImport(null, null, null), $file);
    echo "Import berhasil!\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
