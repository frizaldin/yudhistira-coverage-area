<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$data = \Maatwebsite\Excel\Facades\Excel::toArray(new \stdClass(), 'database/data/RJS - Tangerang.xls');
$rows = $data[0];

$updatedCount = 0;
foreach ($rows as $index => $row) {
    if ($index < 6) continue; // Skip headers
    
    if (!empty($row[2]) && !empty($row[3])) { // Customer Name and Kecamatan
        // $row[2] is something like "SD DAAN MOGOT, 36.71.09.14.003"
        // In the database it is saved as "SD DAAN MOGOT"
        $parts = explode(',', $row[2]);
        $name = trim($parts[0]);
        
        $kecamatanStr = trim($row[3]);
        // e.g. "CIBODAS, KOTA TANGERANG"
        // We only want the Kecamatan name "CIBODAS"
        $kecParts = explode(',', $kecamatanStr);
        $kecamatanName = trim($kecParts[0]);

        // Find customer by name
        $customer = \App\Models\Customer::where('name', $name)->first();
        if ($customer) {
            $customer->kecamatan_name = $kecamatanName;
            $customer->save();
            $updatedCount++;
        } else {
            // Try matching without comma explode
            $customerExact = \App\Models\Customer::where('name', trim($row[2]))->first();
            if ($customerExact) {
                $customerExact->kecamatan_name = $kecamatanName;
                $customerExact->save();
                $updatedCount++;
            }
        }
    }
}

echo "Updated {$updatedCount} customers with kecamatan_name.\n";
