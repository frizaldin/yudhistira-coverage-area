<?php

use Illuminate\Support\Facades\DB;
use App\Models\Customer;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;

// Ensure this runs within the Laravel environment
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

class ScratchRjsImport implements ToCollection
{
    public function collection(Collection $rows)
    {
        $updated = 0;
        foreach ($rows as $index => $row) {
            if (isset($row[1]) && is_numeric(trim((string)$row[1])) && !empty($row[2])) {
                $customerRaw = trim((string)$row[2]);
                $customerParts = explode(',', $customerRaw);
                $customerName = trim($customerParts[0]);

                $isActive = (int)($row[14] ?? 0) === 1;
                $penerbit = !empty(trim((string)($row[13] ?? ''))) ? trim((string)$row[13]) : null;
                $sumberDana = !empty(trim((string)($row[15] ?? ''))) ? trim((string)$row[15]) : null;
                $potensiSekolah = (int)($row[16] ?? 0);

                // Assuming name is unique enough for this one-off update, or we can just update all matching
                $affected = Customer::where('name', $customerName)
                    ->update([
                        'is_active' => $isActive,
                        'penerbit' => $penerbit,
                        'sumber_dana' => $sumberDana,
                        'potensi_sekolah' => $potensiSekolah
                    ]);
                
                $updated += $affected;
            }
        }
        echo "Successfully updated {$updated} customer records.\n";
    }
}

$filePath = storage_path('app/RJS - Tangerang.xls');

if (!file_exists($filePath)) {
    echo "Error: Excel file not found at {$filePath}\n";
    echo "Please place 'RJS - Tangerang.xls' in storage/app/ and run this script again.\n";
    exit(1);
}

echo "Starting retroactive data update from {$filePath}...\n";
Excel::import(new ScratchRjsImport, $filePath);
echo "Done.\n";
